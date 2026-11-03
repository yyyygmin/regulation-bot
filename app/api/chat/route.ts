// 질문을 받아 답변을 돌려주는 서버 API. 질문 내용은 로그에 남기지 않는다.
import {
  AnswerError,
  getChatResponse,
  type HistoryMessage,
} from "@/lib/answer";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { readTextWithLimit, RequestTooLargeError } from "@/lib/request-body";
import { validateHistory, validateQuestion } from "@/lib/validate-input";

function errorResponse(code: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: { code } }, { status, headers });
}

export async function POST(request: Request) {
  // 가장 싼 검사부터 한다. 호출 횟수 → 본문 크기 → 내용 순서다.
  const rateLimit = checkRateLimit(getClientIp(request));
  if (!rateLimit.allowed) {
    return errorResponse("RATE_LIMITED", 429, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
  }

  let body: { question?: unknown; history?: unknown } | null;
  try {
    body = JSON.parse(await readTextWithLimit(request));
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      return errorResponse("REQUEST_TOO_LARGE", 413);
    }
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
