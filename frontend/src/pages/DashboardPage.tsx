import { Link } from 'react-router-dom'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
            Use voice assistant to ask for balance, transactions, account details, and more.
          </p>
        </div>
        <Link
          to="/voice"
          className="inline-flex items-center justify-center rounded-md bg-violet-600 text-white px-4 py-2 text-sm hover:bg-violet-700"
        >
          Go to Voice Assistant
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-sm text-zinc-500">Available Intents</div>
          <div className="mt-2 font-medium">Balance, Transactions</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Account details, Profile & Settings</div>
        </div>
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-sm text-zinc-500">Architecture</div>
          <div className="mt-2 font-medium">FastAPI + MongoDB + JWT</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Whisper, Transformers, LangChain, gTTS</div>
        </div>
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-sm text-zinc-500">Demo Flow</div>
          <div className="mt-2 font-medium">Voice to Text to Intent to Data</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Text to Audio reply</div>
        </div>
      </div>
    </div>
  )
}

