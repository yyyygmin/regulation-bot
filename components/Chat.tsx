"use client";

// 질문을 검사해 서버 API로 보내고, 질문과 답변을 대화 형태로 보여주는 채팅 화면.
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import ChatMessage, { type Message } from "@/components/ChatMessage";
import type { ChatResponse } from "@/lib/answer";
import {
  ERROR_MESSAGE,
  MAX_HISTORY_MESSAGES,
  MAX_QUESTION_LENGTH,
  PERSONAL_INFO_BLOCKED_MESSAGE,
  PERSONAL_INFO_NOTICE,
  RATE_LIMITED_MESSAGE,
  REQUEST_TOO_LARGE_MESSAGE,
  RESPONSE_TIMEOUT_MS,
  SUGGESTED_QUESTIONS,
  TOO_LONG_MESSAGE,
} from "@/lib/constants";
import { buildRequestBody } from "@/lib/request-body";
import { validateQuestion } from "@/lib/validate-input";

// 입력 문제나 요청 제한을 알리는 안내. 화면 검사와 서버 검사의 결과에 함께 쓴다.
const INPUT_ERROR_MESSAGES: Record<string, string> = {
  TOO_LONG: TOO_LONG_MESSAGE,
  PERSONAL_INFO: PERSONAL_INFO_BLOCKED_MESSAGE,
  RATE_LIMITED: RATE_LIMITED_MESSAGE,
  REQUEST_TOO_LARGE: REQUEST_TOO_LARGE_MESSAGE,
};

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const conversationEnd = useRef<HTMLDivElement>(null);

  const isTooLong = question.length > MAX_QUESTION_LENGTH;

  // 새 메시지가 생기면 대화의 맨 아래가 보이게 한다. 첫 화면에서는 위쪽을 그대로 둔다.
  const hasConversation = messages.length > 0 || isSending;
  useEffect(() => {
    if (hasConversation) {
      conversationEnd.current?.scrollIntoView();
    }
  }, [messages, hasConversation]);

  // 입력창과 질문 버튼이 같은 경로로 보내, 버튼 질문에도 같은 규칙을 적용한다.
  async function sendQuestion(text: string) {
    if (isSending) {
      return;
    }
    const error = validateQuestion(text);
    if (error) {
      setNotice(INPUT_ERROR_MESSAGES[error] ?? "");
      return;
    }

    // 맥락은 현재 화면의 대화에서만 가져온다. 새로고침하면 사라진다.
    const history = messages
      .slice(-MAX_HISTORY_MESSAGES)
      .map(({ role, text, type }) => ({ role, content: text, type }));

    setQuestion(text);
    setNotice("");
    setIsSending(true);
    setMessages((previous) => [...previous, { role: "user", text }]);
    let failureMessage = ERROR_MESSAGE;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 본문이 상한을 넘으면 오래된 대화부터 빼고 보낸다.
        body: buildRequestBody(text, history),
        signal: AbortSignal.timeout(RESPONSE_TIMEOUT_MS),
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        failureMessage =
          INPUT_ERROR_MESSAGES[failure?.error?.code] ?? ERROR_MESSAGE;
        throw new Error("답변 요청 실패");
      }
      const answer: ChatResponse = await response.json();
      if (typeof answer?.text !== "string") {
        throw new Error("답변 형식 오류");
      }
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: answer.text,
          fullText:
            typeof answer.fullText === "string" ? answer.fullText : undefined,
          type: answer.type,
          citations: answer.citations,
          isMock: answer.isMock,
        },
      ]);
      setQuestion("");
    } catch {
      // 실패한 질문은 대화에서 빼고 입력창에 남겨, 다시 보내도 중복되지 않게 한다.
      setMessages((previous) => previous.slice(0, -1));
      setNotice(failureMessage);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendQuestion(question);
  }

  // Enter는 전송, Shift+Enter는 줄바꿈. 한글 조합 중의 Enter는 전송하지 않는다.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      sendQuestion(question);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section
        aria-label="대화"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
      >
        {!hasConversation && (
          <div className="m-auto flex w-full max-w-xl flex-col gap-4">
            <div className="text-center">
              <p className="text-lg font-semibold">무엇이 궁금하세요?</p>
              <p className="mt-1 text-sm text-muted">
                휴가나 경비 규정에서 궁금한 내용을 문장으로 입력해 보세요.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTED_QUESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendQuestion(suggestion)}
                  className="rounded-xl border border-line px-3.5 py-2.5 text-left text-sm transition-colors hover:border-accent hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isSending && (
          <p className="self-start text-sm text-muted motion-safe:animate-pulse">
            답변을 만드는 중...
          </p>
        )}
        <div ref={conversationEnd} />
      </section>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 border-t border-line p-4"
      >
        <p className="text-sm font-medium text-notice">
          {PERSONAL_INFO_NOTICE}
        </p>
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-background p-2 transition-colors focus-within:border-accent">
          <textarea
            aria-label="질문 입력"
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
              setNotice("");
            }}
            onKeyDown={handleKeyDown}
            readOnly={isSending}
            rows={2}
            placeholder="예: 연차는 며칠 전까지 신청해야 하나요?"
            className="min-w-0 flex-1 resize-none bg-transparent px-2 py-1.5 text-base outline-none placeholder:text-muted read-only:opacity-60"
          />
          <button
            type="submit"
            disabled={isSending || question.trim() === ""}
            className="h-10 shrink-0 rounded-xl bg-accent px-4 font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            전송
          </button>
        </div>
        <div className="flex items-start justify-between gap-4 text-sm">
          <span
            className={
              isTooLong
                ? "font-medium text-notice"
                : "text-muted"
            }
          >
            {question.length}/{MAX_QUESTION_LENGTH}
          </span>
          <p role="status" className="text-right text-notice">
            {notice}
          </p>
        </div>
      </form>
    </div>
  );
}
