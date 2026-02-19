"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Showtime = {
  show_date: string;
  show_time: string;
  ticket_price: number | null;
  movies?: { title: string | null } | null;
  theaters?: { theater_name: string | null; location: string | null } | null;
};

type TicketRow = {
  ticket_id: number;
  customer_name: string | null;
  ticket_status: string | null;
  booking_date: string | null;
  ticket_price: number | null;
  final_price: number | null;
  seats?: { seat_no: string | null } | null;
  showtimes?: Showtime | null;
};

type Payment = {
  ticket_id: number;
  amount: number;
  payment_method: string | null;
  payment_status: string | null;
  payment_date: string | null;
};

const peso = (n: number) =>
  `₱${(n ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function TicketPrintPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [t, setT] = useState<TicketRow | null>(null);
  const [p, setP] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const { data, error } = await supabase
          .from("tickets")
          .select(`
            ticket_id,
            customer_name,
            ticket_status,
            booking_date,
            ticket_price,
            final_price,
            seats:seat_id ( seat_no ),
            showtimes:showtime_id (
              show_date,
              show_time,
              ticket_price,
              movies:movie_id ( title ),
              theaters:theater_id ( theater_name, location )
            )
          `)
          .eq("ticket_id", id)
          .single();

        if (error) throw error;
        const ticket = (data ?? null) as unknown as TicketRow;
        if (!alive) return;

        const { data: payData, error: payErr } = await supabase
          .from("payments")
          .select("ticket_id, amount, payment_method, payment_status, payment_date")
          .eq("ticket_id", id)
          .maybeSingle();

        if (payErr) throw payErr;

        setT(ticket);
        setP((payData as Payment) ?? null);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load ticket.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const theater = t?.showtimes?.theaters?.theater_name ?? "—";
  const location = t?.showtimes?.theaters?.location ?? "—";
  const movie = t?.showtimes?.movies?.title ?? "—";
  const showDate = t?.showtimes?.show_date ?? "—";
  const showTime = (t?.showtimes?.show_time ?? "").slice(0, 5) || "—";
  const seat = t?.seats?.seat_no ?? "—";
  const original = t?.ticket_price ?? t?.showtimes?.ticket_price ?? 0;
  const total = t?.final_price ?? p?.amount ?? original;
  const discountAmt = Math.max(0, Number(original) - Number(total));

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#f6f6f6",
        padding: 16,
      }}
    >
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .ticket {
            box-shadow: none !important;
            border: 1px solid #000 !important;
          }
          body, html {
            background: #fff !important;
          }
        }
      `}</style>

      <section
        className="ticket"
        style={{
          width: "min(640px, 94vw)",
          background: "#fff",
          border: "1px solid #d4d4d4",
          borderRadius: 6,
          padding: "22px 24px",
          boxShadow: "0 2px 0 rgba(0,0,0,0.06)",
        }}
      >
        {/* Controls */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between" }}>
          <Link href="/admin/summary" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "6px 10px",
                borderRadius: 4,
                border: "1px solid #111",
                background: "#fff",
                color: "#111",
                cursor: "pointer",
              }}
            >
              ← Back to Summary
            </button>
          </Link>
          <button
            onClick={() => window.print()}
            style={{
              padding: "6px 10px",
              borderRadius: 4,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Print
          </button>
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: 24,
            letterSpacing: "0.16em",
            fontWeight: 700,
            color: "#111",
            marginTop: 8,
            marginBottom: 16,
          }}
        >
          CINEMA TICKET
        </h1>

        {loading && <div style={{ color: "#666" }}>Loading…</div>}
        {err && <div style={{ color: "crimson" }}>{err}</div>}

        {t && (
          <div style={{ border: "1px dashed #aaa", borderRadius: 6, padding: 16 }}>
            <p><strong>Ticket ID:</strong> {t.ticket_id}</p>
            <p><strong>Name:</strong> {t.customer_name ?? "—"}</p>
            <p><strong>Cinema:</strong> {theater} — {location}</p>
            <p><strong>Movie:</strong> {movie}</p>
            <p><strong>Showtime:</strong> {showDate} {showTime}:00</p>
            <p><strong>Seat:</strong> {seat}</p>
            <p><strong>Original:</strong> {peso(Number(original))}</p>
            <p><strong>Discount:</strong> {peso(Number(discountAmt))}</p>
            <p><strong>Total:</strong> {peso(Number(total))}</p>
            <p><strong>Payment:</strong> {p?.payment_method ?? "—"} ({p?.payment_status ?? "—"})</p>
            <p><strong>Booking Date:</strong> {t.booking_date ? new Date(t.booking_date).toLocaleString() : "—"}</p>
            <p><strong>Status:</strong> {t.ticket_status ?? "—"}</p>
          </div>
        )}
      </section>
    </main>
  );
}
