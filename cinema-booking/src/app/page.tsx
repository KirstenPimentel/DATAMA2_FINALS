// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#f6f6f6",
      }}
    >
      <section
        style={{
          width: "min(560px, 92vw)",
          background: "#fff",
          border: "1px solid #d4d4d4",
          borderRadius: 6,
          padding: "36px 40px",
          boxShadow: "0 2px 0 rgba(0,0,0,0.06)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            letterSpacing: "0.18em",
            fontWeight: 700,
            fontSize: 28,
            color: "#111",
            marginBottom: 6,
          }}
        >
          CINEMA ADMIN
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "#444",
            marginBottom: 22,
          }}
        >
          What would you like to do?
        </p>

        <div
          style={{
            display: "grid",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <Link
            href="/book"
            style={{
              padding: "10px 14px",
              border: "1px solid #222",
              borderRadius: 4,
              color: "#111",
              background: "#fff",
              width: 150,
              textAlign: "center",
            }}
          >
            Add Customer
          </Link>

          <Link
            href="/admin/summary"
            style={{
              padding: "10px 14px",
              border: "1px solid #222",
              borderRadius: 4,
              color: "#111",
              background: "#fff",
              width: 150,
              textAlign: "center",
            }}
          >
            Show Summary
          </Link>
        </div>
      </section>
    </main>
  );
}