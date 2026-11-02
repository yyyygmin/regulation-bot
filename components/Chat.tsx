"use client";

// 질문 입력창과 전송 전 검사를 담당하는 채팅 화면. API 연결은 다음 작업에서 한다.
import { type FormEvent, type KeyboardEvent, useState } from "react";

import {
  MAX_QUESTION_LENGTH,
  PERSONAL_INFO_BLOCKED_MESSAGE,
  PERSONAL_INFO_NOTICE,
  TOO_LONG_MESSAGE,
} from "@/lib/constants";
import { validateQuestion } from "@/lib/validate-input";

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState("");

  const isTooLong = question.length > MAX_QUESTION_LENGTH;

  function submit() {
    const error = validateQuestion(question);
    if (error === "TOO_LONG") {
      setNotice(TOO_LONG_MESSAGE);
    } else if (error === "PERSONAL_INFO") {
      setNotice(PERSONAL_INFO_BLOCKED_MESSAGE);
    } else if (!error) {
      // 임시 안내. 작업 11에서 API 호출로 바꾼다.
      setNotice("입력 검사를 통과했습니다. 답변 연결은 다음 작업에서 합니다.");
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
    <div className="flex flex-1 flex-col">
      <section
        aria-label="대화"
        className="flex flex-1 items-center justify-center p-4 text-center text-sm text-zinc-500 dark:text-zinc-400"
      >
        휴가나 경비 규정에서 궁금한 내용을 문장으로 입력해 보세요.
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
            rows={2}
            placeholder="예: 연차는 며칠 전까지 신청해야 하나요?"
            className="min-w-0 flex-1 resize-none rounded-lg border border-zinc-300 bg-transparent p-3 text-base outline-none placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-700"
          />
          <button
            type="submit"
            disabled={question.trim() === ""}
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
