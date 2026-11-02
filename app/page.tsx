import Chat from "@/components/Chat";

export default function Home() {
  return (
    <main className="mx-auto flex h-dvh w-full max-w-3xl flex-col font-sans">
      <header className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <h1 className="text-2xl font-bold">규정봇</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          휴가·경비 규정을 문장으로 물어보세요.
        </p>
      </header>
      <Chat />
    </main>
  );
}
