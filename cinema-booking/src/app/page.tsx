import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="card-1975 max-w-md">
        <div className="space-y-6">
          <h1 className="text-2xl text-center">Cinema Admin</h1>
          <p className="text-center muted-1975">What would you like to do?</p>

          <div className="gap-4">
            <div className="text-center">
              <Link href="/book" className="btn-1975">Add Customer</Link>
            </div>
            <div className="text-center">
              <Link href="/admin/summary" className="btn-1975">Show Summary</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}