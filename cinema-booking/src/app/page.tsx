"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg)",
        color: "var(--fg)",
      }}
    >
      <section className="card-1975" style={{ width: "min(560px, 92vw)", textAlign: "center" }}>
        <h1 style={{ letterSpacing: "0.18em", fontWeight: 700, fontSize: 24, marginBottom: 10 }}>
          CINEMA ADMIN
        </h1>

        <p className="muted-1975" style={{ marginBottom: 22 }}>
          What would you like to do?
        </p>

        <div style={{ display: "grid", gap: 12, justifyContent: "center" }}>
          <Link href="/admin/book" className="btn-1975" style={{ width: 160, textAlign: "center" }}>
            Add Customer
          </Link>

          <Link
            href="/admin/summary"
            className="btn-1975"
            style={{ width: 160, textAlign: "center" }}
          >
            Show Summary
          </Link>
        </div>
      </section>
    </main>
  );
}