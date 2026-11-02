// 질문을 받아 답변을 돌려주는 서버 API. 질문 내용은 로그에 남기지 않는다.
import {
  AnswerError,
  getChatResponse,
  type HistoryMessage,
} from "@/lib/answer";
import { validateHistory, validateQuestion } from "@/lib/validate-input";

function errorResponse(code: string, status: number) {
  return Response.json({ error: { code } }, { status });
}

export async function POST(request: Request) {
  let body: { question?: unknown; history?: unknown } | null;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_INPUT", 400);
  }

  const inputError =
    validateQuestion(body?.question) ?? validateHistory(body?.history);
  if (inputError) {
    return errorResponse(inputError, 400);
  }

  try {
    return Response.json(
      await getChatResponse(
        body?.question as string,
        body?.history as HistoryMessage[] | undefined,
      ),
    );
  } catch (error) {
    if (error instanceof AnswerError) {
      return errorResponse(
        error.code,
        error.code === "AI_TIMEOUT" ? 504 : 500,
      );
    }
    console.error("규정봇 서버 오류:", error);
    return errorResponse("SERVER_ERROR", 500);
  }
}
