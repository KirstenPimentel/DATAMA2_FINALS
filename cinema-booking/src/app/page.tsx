import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="border border-black p-8 w-full max-w-md space-y-6">

        <h1 className="text-2xl font-bold uppercase tracking-wider text-center">
          Cinema Admin
        </h1>

        <p className="text-center text-sm">
          What would you like to do?
        </p>

        <div className="flex flex-col gap-4">

          {/* Add Customer */}
          <Link
            href="/book"
            className="border border-black py-2 text-center hover:bg-black hover:text-white transition"
          >
            Add Customer
          </Link>

          {/* Show Summary */}
          <Link
            href="/admin/summary"
            className="border border-black py-2 text-center hover:bg-black hover:text-white transition"
          >
            Show Summary
          </Link>

        </div>
      </div>
    </main>
  );
}