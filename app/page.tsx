import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-3">TablePro</h1>
        <p className="text-slate-500 text-lg">Restaurant reservation system</p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/restaurants"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Find a Table
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors"
        >
          Register Restaurant
        </Link>
      </div>
    </main>
  );
}
