import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="card-1975 max-w-md">
        <div className="space-y-6">
          <h1 className="text-center">Cinema Admin</h1>
          <p className="text-center muted-1975">What would you like to do?</p>

          <div className="gap-4" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="text-center">
              /book
                <span className="btn-1975">Add Customer</span>
              </Link>
            </div>
            <div className="text-center">
              /admin/summary
                <span className="btn-1975">Show Summary</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}