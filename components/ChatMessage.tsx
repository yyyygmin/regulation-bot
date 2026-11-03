"use client";

// 대화의 메시지 하나를 표시한다. 내 질문은 오른쪽, 답변은 왼쪽에 놓는다.
import { useState } from "react";

import type { ChatResponse, Citation } from "@/lib/answer";
import {
  DISCLAIMER_MESSAGE,
  MOCK_ANSWER_LABEL,
  SHOW_LESS_LABEL,
  SHOW_MORE_LABEL,
} from "@/lib/constants";

export interface Message {
  role: "user" | "assistant";
  text: string;
  fullText?: string;
  type?: ChatResponse["type"];
  citations?: Citation[];
  isMock?: boolean;
}

export default function ChatMessage({ message }: { message: Message }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (message.role === "user") {
    return (
      <p className="max-w-[85%] self-end whitespace-pre-line break-words rounded-2xl rounded-br-md bg-accent px-4 py-2.5 leading-relaxed text-white">
        {message.text}
      </p>
    );
  }

  // 5문장을 넘어 잘린 답변은 더보기를 누르면 원문을 보여준다.
  const hasMore = Boolean(message.fullText);
  const shownText = isExpanded && message.fullText ? message.fullText : message.text;

  return (
    <div className="max-w-[90%] self-start rounded-2xl rounded-bl-md border border-line bg-background px-4 py-3">
      {hasMore && isExpanded && (
        <p className="mb-1 text-xs font-medium text-muted">원문</p>
      )}
      <p className="whitespace-pre-line break-words leading-relaxed">
        {shownText}
      </p>
      {hasMore && (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((previous) => !previous)}
          className="mt-2 text-sm font-medium text-accent-text underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
        >
          {isExpanded ? SHOW_LESS_LABEL : SHOW_MORE_LABEL}
        </button>
      )}
      {message.citations && message.citations.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <span className="text-muted">근거:</span>
          {message.citations.map(({ document, number }) => (
            <span
              key={`${document} ${number}`}
              className="rounded-full bg-accent-soft px-2.5 py-1 text-accent-text"
            >
              {document} {number}
            </span>
          ))}
        </p>
      )}
      <div className="mt-3 flex flex-col gap-1 border-t border-line pt-2 text-xs">
        <p className="text-muted">{DISCLAIMER_MESSAGE}</p>
        {message.isMock && (
          <p className="font-medium text-notice">{MOCK_ANSWER_LABEL}</p>
        )}
      </div>
    </div>
  );
}
