// 질문에 대한 답변을 만든다. 지금은 비용이 나가지 않도록 실제 AI 대신 가짜 답변을 쓴다.
// 실제 연결 때는 getMockAiOutput 호출만 OpenAI 호출로 바꾼다. 서버 코드에서만 불러온다.
import {
  MAX_CITATIONS,
  MAX_HISTORY_MESSAGES,
  MIN_CITATIONS,
  NOT_FOUND_MESSAGE,
  RESPONSE_TIMEOUT_MS,
} from "@/lib/constants";
import { type Article, loadArticles } from "@/lib/regulations";

type AnswerType = "answer" | "clarify" | "not_found";

// 현재 화면의 이전 대화 한 개. 서버에 저장하지 않고 요청마다 화면에서 받는다.
export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
  type?: AnswerType;
}

// 화면에 표시할 근거
export interface Citation {
  document: string;
  number: string;
}

// 서버 API의 답변
export interface ChatResponse {
  type: AnswerType;
  text: string;
  citations: Citation[];
  isMock: boolean; // 가짜 답변이면 화면에 테스트용이라고 표시한다.
}

// AI가 돌려줘야 하는 형식
interface AiOutput {
  type: AnswerType;
  text: string;
  articleIds: string[];
}

export type AnswerErrorCode = "AI_ERROR" | "AI_TIMEOUT";

export class AnswerError extends Error {
  code: AnswerErrorCode;

  constructor(code: AnswerErrorCode) {
    super(code);
    this.code = code;
  }
}

// 조항으로 인정할 최소 점수. 낮추면 문서에 없는 질문에도 답하게 된다.
const MIN_MATCH_SCORE = 4;
// 제목에 나온 단어가 질문의 주제일 가능성이 높아 더 큰 점수를 준다.
const TITLE_MATCH_WEIGHT = 3;
// 앞 질문에 이어 묻는 말인지 판단하는 시작 표현. 가짜 답변 전용의 단순한 규칙이다.
const FOLLOW_UP_START = /^(그럼|그러면|그건|그거|그때|그런데|그리고|그 경우)/;
// 이어 묻는 질문에서는 앞 질문보다 지금 질문의 단어를 더 중요하게 본다.
const CURRENT_QUESTION_WEIGHT = 2;
// 어떤 휴가나 경비인지 없는 질문을 찾는 규칙. 실제 AI는 지시문으로 판단하므로 가짜 답변 전용이다.
const AMBIGUOUS_QUESTIONS = [
  {
    topic: /휴가/,
    specific: /연차|반차|경조|결혼|출산|사망|병가|공가|훈련|취소|변경|이월|증빙/,
    message: "어떤 휴가인지 알려 주세요. 예: 연차, 반차, 경조휴가, 병가, 공가",
  },
  {
    topic: /경비/,
    specific: /교통|택시|차량|식대|식비|숙박|일비|영수증|증빙|청구|지급|승인/,
    message: "어떤 경비인지 알려 주세요. 예: 교통비, 야근 식대, 출장 숙박비",
  },
];
// 자기 상황을 묻는 질문을 찾는 규칙. 역시 가짜 답변 전용이다.
const PERSONAL_SITUATION =
  /(^|\s)(제가|저는|저도|제 경우|내 경우|내가|나는)(\s|$)/;
const PERSONAL_JUDGMENT_NOTICE =
  "위 내용은 관련 규정 안내이며, 개인별 판단은 담당자에게 확인해 주세요.";

function wasJustClarified(history: HistoryMessage[]): boolean {
  return history.at(-1)?.type === "clarify";
}

// 조사가 붙어도 찾을 수 있도록 글을 두 글자씩 잘라 비교한다. 예: "연차는" → "연차", "차는"
function toBigrams(text: string): Set<string> {
  const letters = text.replace(/[^\p{L}\p{N}]/gu, "");
  const bigrams = new Set<string>();
  for (let i = 0; i < letters.length - 1; i++) {
    bigrams.add(letters.slice(i, i + 2));
  }
  return bigrams;
}

function scoreArticle(questionBigrams: Set<string>, article: Article): number {
  const title = article.title.replace(/\s/g, "");
  const body = article.body.replace(/\s/g, "");
  let score = 0;
  for (const bigram of questionBigrams) {
    if (title.includes(bigram)) {
      score += TITLE_MATCH_WEIGHT;
    }
    if (body.includes(bigram)) {
      score += 1;
    }
  }
  return score;
}

// 질문과 가장 많이 겹치는 조항의 본문을 답으로 돌려주는 가짜 AI
function findBestArticle(
  question: string,
  history: HistoryMessage[],
  articles: Article[],
): AiOutput {
  const ambiguous = AMBIGUOUS_QUESTIONS.find(
    ({ topic, specific }) => topic.test(question) && !specific.test(question),
  );
  if (ambiguous) {
    return { type: "clarify", text: ambiguous.message, articleIds: [] };
  }

  const questionBigrams = toBigrams(question);
  const continuesConversation =
    FOLLOW_UP_START.test(question.trim()) || wasJustClarified(history);
  const previousQuestion = continuesConversation
    ? history.findLast(({ role }) => role === "user")?.content
    : undefined;
  const previousBigrams = previousQuestion
    ? toBigrams(previousQuestion)
    : undefined;
  let best: Article | undefined;
  let bestScore = 0;
  for (const article of articles) {
    const score = previousBigrams
      ? scoreArticle(questionBigrams, article) * CURRENT_QUESTION_WEIGHT +
        scoreArticle(previousBigrams, article)
      : scoreArticle(questionBigrams, article);
    if (score > bestScore) {
      best = article;
      bestScore = score;
    }
  }
  if (!best || bestScore < MIN_MATCH_SCORE) {
    return { type: "not_found", text: "", articleIds: [] };
  }
  const text = PERSONAL_SITUATION.test(question)
    ? `${best.body}\n\n${PERSONAL_JUDGMENT_NOTICE}`
    : best.body;
  return { type: "answer", text, articleIds: [best.id] };
}

// 오류 처리를 확인하기 위해 MOCK_AI_SCENARIO로 특정 상황을 일부러 만든다.
async function getMockAiOutput(
  question: string,
  history: HistoryMessage[],
  articles: Article[],
): Promise<unknown> {
  switch (process.env.MOCK_AI_SCENARIO) {
    case "error":
      throw new AnswerError("AI_ERROR");
    case "timeout":
      return new Promise(() => {});
    case "bad-format":
      return { message: "형식이 다른 응답" };
    case "fake-citation":
      return {
        type: "answer",
        text: "없는 조항을 근거로 든 답변",
        articleIds: [articles[0].id, "leave-999"],
      };
    case "no-citation":
      return { type: "answer", text: "근거가 없는 답변", articleIds: [] };
    case "too-many-citations":
      return {
        type: "answer",
        text: "근거가 너무 많은 답변",
        articleIds: articles.slice(0, MAX_CITATIONS + 1).map(({ id }) => id),
      };
    case "clarify":
      return {
        type: "clarify",
        text: "어떤 휴가를 말씀하시는지 알려 주세요.",
        articleIds: [],
      };
    default:
      return findBestArticle(question, history, articles);
  }
}

function withTimeout<T>(task: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new AnswerError("AI_TIMEOUT")),
      RESPONSE_TIMEOUT_MS,
    );
  });
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer));
}

function isAiOutput(value: unknown): value is AiOutput {
  const output = value as Partial<AiOutput> | null;
  return (
    (output?.type === "answer" ||
      output?.type === "clarify" ||
      output?.type === "not_found") &&
    typeof output.text === "string" &&
    Array.isArray(output.articleIds) &&
    output.articleIds.every((id) => typeof id === "string")
  );
}

// AI 출력을 믿지 않고 실제 조항과 대조해, 화면에 보낼 답변으로 바꾼다.
function toChatResponse(
  output: unknown,
  history: HistoryMessage[],
  articles: Article[],
): ChatResponse {
  if (!isAiOutput(output)) {
    throw new AnswerError("AI_ERROR");
  }
  const notFound: ChatResponse = {
    type: "not_found",
    text: NOT_FOUND_MESSAGE,
    citations: [],
    isMock: true,
  };
  // 되묻기는 한 번만 한다. 직전 답변도 되묻기였다면 찾지 못함으로 답한다.
  if (
    output.type === "not_found" ||
    (output.type === "clarify" && wasJustClarified(history))
  ) {
    return notFound;
  }
  if (output.type === "clarify") {
    return { type: "clarify", text: output.text, citations: [], isMock: true };
  }

  // 근거가 없거나 하나라도 실제 조항이 아니면 지어낸 답변일 수 있으므로 답하지 않는다.
  const cited = output.articleIds.map((id) =>
    articles.find((article) => article.id === id),
  );
  if (cited.length < MIN_CITATIONS || cited.includes(undefined)) {
    return notFound;
  }
  return {
    type: "answer",
    text: output.text,
    citations: (cited as Article[])
      .slice(0, MAX_CITATIONS)
      .map(({ document, number }) => ({ document, number })),
    isMock: true,
  };
}

export async function getChatResponse(
  question: string,
  history: HistoryMessage[] = [],
): Promise<ChatResponse> {
  const articles = await loadArticles();
  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
  const output = await withTimeout(
    getMockAiOutput(question, recentHistory, articles),
  );
  return toChatResponse(output, recentHistory, articles);
}
