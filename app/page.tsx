import Chat from "@/components/Chat";

export default function Home() {
  return (
    <main className="mx-auto flex h-dvh w-full max-w-3xl flex-col font-sans sm:p-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-sm">
        <header className="flex items-center gap-3 border-t-4 border-b border-t-brand-red border-b-line px-4 py-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white"
          >
            규
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight">규정봇</h1>
            <p className="text-sm text-muted">
              휴가·경비 규정을 문장으로 물어보세요.
            </p>
          </div>
        </header>
        <Chat />
      </div>
    </main>
  );
}
