import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="card-1975 w-full max-w-md p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center">Cinema Admin</h1>
        <p className="text-center text-sm muted-1975">What would you like to do?</p>

        <div className="flex flex-col gap-4">
          <Link href="/book" className="btn-1975 text-center">
            Add Customer
          </Link>
          <Link href="/admin/summary" className="btn-1975 text-center">
            Show Summary
          </Link>
        </div>
      </div>
    </main>
  );
}