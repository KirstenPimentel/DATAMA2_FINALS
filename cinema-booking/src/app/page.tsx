import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="card-1975 max-w-md">
        <div className="space-y-6">
          <h1 className="text-center">Cinema Admin</h1>
          <p className="text-center muted-1975">What would you like to do?</p>

          <div className="gap-4" style={{ display: 'flex', flexDirection: 'column' }}>
            <Link className="btn-1975" href="/book">Add Customer</Link>
            <Link className="btn-1975" href="/admin/summary">Show Summary</Link>
            <Link className="btn-1975" href="/reviews/new">Add Review</Link>
          </div>
        </div>
      </div>
    </main>
  );
}