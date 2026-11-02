// 대화의 메시지 하나를 표시한다. 내 질문은 오른쪽, 답변은 왼쪽에 놓는다.
import type { Citation } from "@/lib/answer";
import { MOCK_ANSWER_LABEL } from "@/lib/constants";

export interface Message {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  isMock?: boolean;
}

export default function ChatMessage({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <p className="max-w-[85%] self-end whitespace-pre-line break-words rounded-lg bg-foreground px-4 py-2 text-background">
        {message.text}
      </p>
    );
  }
  return (
    <div className="max-w-[85%] self-start rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-900">
      <p className="whitespace-pre-line break-words">{message.text}</p>
      {message.citations && message.citations.length > 0 && (
        <p className="mt-2 text-sm font-medium">
          근거:{" "}
          {message.citations
            .map(({ document, number }) => `${document} ${number}`)
            .join(", ")}
        </p>
      )}
      {message.isMock && (
        <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
          {MOCK_ANSWER_LABEL}
        </p>
      )}
    </div>
  );
}
