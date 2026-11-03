// 요청 본문의 크기를 다룬다. 화면은 보내기 전에 줄이고, 서버는 읽는 도중에 상한을 지킨다.
import { MAX_REQUEST_BODY_BYTES } from "@/lib/constants";

const encoder = new TextEncoder();

export function byteLength(text: string): number {
  return encoder.encode(text).length;
}

interface RequestHistoryMessage {
  role: "user" | "assistant";
  content: string;
  type?: string;
}

// 질문과 이전 대화를 JSON으로 만든다. 상한을 넘으면 오래된 대화부터 하나씩 빼서 맞춘다.
// 질문 자체가 상한을 넘으면 이전 대화를 모두 빼도 크므로, 그대로 보내 서버가 거절하게 한다.
export function buildRequestBody(
  question: string,
  history: RequestHistoryMessage[],
): string {
  let kept = history;
  let body = JSON.stringify({ question, history: kept });
  while (kept.length > 0 && byteLength(body) > MAX_REQUEST_BODY_BYTES) {
    kept = kept.slice(1);
    body = JSON.stringify({ question, history: kept });
  }
  return body;
}

export class RequestTooLargeError extends Error {}

// 요청 본문을 글로 읽되, 상한을 넘으면 끝까지 읽지 않고 멈춘다.
// 헤더의 크기를 속이거나 크기 없이 이어 보내는 요청도 읽은 만큼 세어 막는다.
export async function readTextWithLimit(
  request: Request,
  maxBytes: number = MAX_REQUEST_BODY_BYTES,
): Promise<string> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestTooLargeError();
  }
  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new RequestTooLargeError();
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}
