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
  MAX_QUESTION_LENGTH,
  PERSONAL_INFO_BLOCKED_MESSAGE,
  PERSONAL_INFO_NOTICE,
  TOO_LONG_MESSAGE,
} from "@/lib/constants";
import { validateQuestion } from "@/lib/validate-input";

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const conversationEnd = useRef<HTMLDivElement>(null);

  const isTooLong = question.length > MAX_QUESTION_LENGTH;

  // 새 메시지가 생기면 대화의 맨 아래가 보이게 한다.
  useEffect(() => {
    conversationEnd.current?.scrollIntoView();
  }, [messages, isSending]);

  async function submit() {
    if (isSending) {
      return;
    }
    const error = validateQuestion(question);
    if (error === "TOO_LONG") {
      setNotice(TOO_LONG_MESSAGE);
      return;
    }
    if (error === "PERSONAL_INFO") {
      setNotice(PERSONAL_INFO_BLOCKED_MESSAGE);
      return;
    }
    if (error) {
      return;
    }

    setNotice("");
    setIsSending(true);
    setMessages((previous) => [...previous, { role: "user", text: question }]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!response.ok) {
        throw new Error("답변 요청 실패");
      }
      const answer: ChatResponse = await response.json();
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: answer.text,
          citations: answer.citations,
          isMock: answer.isMock,
        },
      ]);
      setQuestion("");
    } catch {
      // 실패한 질문은 대화에서 빼고 입력창에 남겨, 다시 보내도 중복되지 않게 한다.
      setMessages((previous) => previous.slice(0, -1));
      setNotice(ERROR_MESSAGE);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  // Enter는 전송, Shift+Enter는 줄바꿈. 한글 조합 중의 Enter는 전송하지 않는다.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section
        aria-label="대화"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {messages.length === 0 && !isSending && (
          <p className="m-auto text-center text-sm text-zinc-500 dark:text-zinc-400">
            휴가나 경비 규정에서 궁금한 내용을 문장으로 입력해 보세요.
          </p>
        )}
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isSending && (
          <p className="self-start text-sm text-zinc-500 dark:text-zinc-400">
            답변을 만드는 중...
          </p>
        )}
        <div ref={conversationEnd} />
      </section>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800"
      >
        <p className="text-sm font-medium">{PERSONAL_INFO_NOTICE}</p>
        <div className="flex items-end gap-2">
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
            className="min-w-0 flex-1 resize-none rounded-lg border border-zinc-300 bg-transparent p-3 text-base outline-none placeholder:text-zinc-400 read-only:opacity-60 focus:border-zinc-500 dark:border-zinc-700"
          />
          <button
            type="submit"
            disabled={isSending || question.trim() === ""}
            className="h-12 shrink-0 rounded-lg bg-foreground px-5 font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            전송
          </button>
        </div>
        <div className="flex items-start justify-between gap-4 text-sm">
          <span
            className={
              isTooLong
                ? "font-medium text-red-600 dark:text-red-400"
                : "text-zinc-500 dark:text-zinc-400"
            }
          >
            {question.length}/{MAX_QUESTION_LENGTH}
          </span>
          <p
            role="status"
            className="text-right text-red-600 dark:text-red-400"
          >
            {notice}
          </p>
        </div>
      </form>
    </div>
  );
}
