import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="card-1975 max-w-md">
        <div className="space-y-6">
          <h1 className="text-center">Cinema Admin</h1>
          <p className="text-center muted-1975">What would you like to do?</p>

          <div className="gap-4" style={{ display: 'flex', flexDirection: 'column' }}>
            <Link href="/book" className="btn-1975" style={{ alignSelf: 'center' }}>
              Add Customer
            </Link>
            <Link href="/admin/summary" className="btn-1975" style={{ alignSelf: 'center' }}>
              Show Summary
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}