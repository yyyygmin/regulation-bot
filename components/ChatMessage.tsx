// 대화의 메시지 하나를 표시한다. 내 질문은 오른쪽, 답변은 왼쪽에 놓는다.
import type { ChatResponse, Citation } from "@/lib/answer";
import { DISCLAIMER_MESSAGE, MOCK_ANSWER_LABEL } from "@/lib/constants";

export interface Message {
  role: "user" | "assistant";
  text: string;
  type?: ChatResponse["type"];
  citations?: Citation[];
  isMock?: boolean;
}

export default function ChatMessage({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <p className="max-w-[85%] self-end whitespace-pre-line break-words rounded-2xl rounded-br-md bg-accent px-4 py-2.5 leading-relaxed text-white">
        {message.text}
      </p>
    );
  }
  return (
    <div className="max-w-[90%] self-start rounded-2xl rounded-bl-md border border-line bg-background px-4 py-3">
      <p className="whitespace-pre-line break-words leading-relaxed">
        {message.text}
      </p>
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
          <p className="font-medium text-amber-700 dark:text-amber-400">
            {MOCK_ANSWER_LABEL}
          </p>
        )}
      </div>
    </div>
  );
}
