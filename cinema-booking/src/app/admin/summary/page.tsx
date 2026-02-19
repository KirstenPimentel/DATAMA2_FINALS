"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/** Types */
type Showtime = {
  show_date: string;
  show_time: string;
  ticket_price: number | null;
  movie_id?: number | null; // <-- we will request this
  movies?: { title: string | null } | null;
  theaters?: { theater_name: string | null; location: string | null } | null;
};

type RowRaw = {
  // NOTE: if your PK is "id" not "ticket_id", change to "id" and adjust below
  ticket_id: number;
  customer_name: string;
  ticket_status: string | null;
  booking_date: string | null;
  ticket_price: number | null;
  final_price: number | null;
  discount_type?: string | null; // <-- will be read from DB (REGULAR | PWD | SENIOR | STUDENT)
  seats?: { seat_no: string | null } | null;
  showtimes?: Showtime | null;
};

type Payment = {
  ticket_id: number;
  amount: number;
  payment_method: "GCASH" | "CARD" | "CASH" | string;
  payment_status: string | null;
  payment_date: string | null;
};

type ReviewLite = {
  movie_id: number;
  rating: number;
  review_date: string | null;
};

/** Helpers */
const peso = (n: number) =>
  `₱${(n ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function AdminSummaryPage() {
  const [rows, setRows] = useState<RowRaw[]>([]);
  const [payments, setPayments] = useState<Record<number, Payment>>({});
  const [latestReviewByMovie, setLatestReviewByMovie] = useState<
    Record<number, ReviewLite | undefined>
  >({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      // Tickets with joins (include movie_id + discount_type)
      const { data: ticketsData, error: tErr } = await supabase
        .from("tickets")
        .select(`
          ticket_id,
          customer_name,
          ticket_status,
          booking_date,
          ticket_price,
          final_price,
          discount_type,
          seat_id,
          showtime_id,
          seats:seat_id ( seat_no ),
          showtimes:showtime_id (
            show_date,
            show_time,
            ticket_price,
            movie_id,                       -- <-- include movie_id
            movies:movie_id ( title ),
            theaters:theater_id ( theater_name, location )
          )
        `)
        .order("booking_date", { ascending: false })
        .limit(500);

      if (tErr) throw tErr;

      const tickets = (ticketsData ?? []) as unknown as RowRaw[];
      setRows(tickets);

      // Payments for those tickets
      const ids = tickets.map((t: any) => t.ticket_id);
      if (ids.length > 0) {
        const { data: paysData, error: pErr } = await supabase
          .from("payments")
          .select("ticket_id, amount, payment_method, payment_status, payment_date")
          .in("ticket_id", ids);
        if (pErr) throw pErr;

        const byId: Record<number, Payment> = {};
        for (const p of paysData ?? []) {
          const cast = p as Payment;
          byId[cast.ticket_id] = cast;
        }
        setPayments(byId);
      } else {
        setPayments({});
      }

      // Pull latest review per movie_id present
      const movieIds = Array.from(
        new Set(
          tickets
            .map((t) => t.showtimes?.movie_id)
            .filter((x): x is number => typeof x === "number")
        )
      );

      if (movieIds.length) {
        const { data: reviewsData, error: rErr } = await supabase
          .from("reviews")
          .select("movie_id, rating, review_date")
          .in("movie_id", movieIds)
          .order("review_date", { ascending: false });

        if (rErr) throw rErr;

        // Keep the latest review per movie
        const latestMap: Record<number, ReviewLite> = {};
        for (const r of reviewsData ?? []) {
          const mId = (r as any).movie_id as number;
          if (!latestMap[mId]) latestMap[mId] = r as ReviewLite;
        }
        setLatestReviewByMovie(latestMap);
      } else {
        setLatestReviewByMovie({});
      }
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /** Flatten for table */
  const table = useMemo(() => {
    return rows.map((r) => {
      const theaterName = r.showtimes?.theaters?.theater_name ?? "—";
      const location = r.showtimes?.theaters?.location ?? "—";
      const movieTitle = r.showtimes?.movies?.title ?? "—";
      const date = r.showtimes?.show_date ?? "—";
      const timeHH = (r.showtimes?.show_time ?? "").slice(0, 5) || "—";
      const showtimeStr = `${date} ${timeHH}:00`;

      const original = r.ticket_price ?? r.showtimes?.ticket_price ?? 0;
      const payment = payments[r.ticket_id];
      const total = r.final_price ?? payment?.amount ?? original;
      const discountAmt = Math.max(0, Number(original) - Number(total));

      const movieId = r.showtimes?.movie_id ?? null;
      const latestReview = movieId ? latestReviewByMovie[movieId] : undefined;

      return {
        ticket_id: r.ticket_id,
        customer_name: r.customer_name,
        theater: theaterName,
        location,
        movie: movieTitle,
        movie_id: movieId,
        showtime: showtimeStr,
        seat: r.seats?.seat_no ?? "—",
        original,
        discount_type: (r.discount_type ?? "REGULAR").toUpperCase(), // REGULAR | PWD | SENIOR | STUDENT
        discountAmt,
        total,
        payment_method: payment?.payment_method ?? "—",
        rating: latestReview?.rating ?? null,
      };
    });
  }, [rows, payments, latestReviewByMovie]);

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
      <section
        className="card-1975"
        style={{
          width: "min(1100px, 95vw)",
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "14px 16px",
        }}
      >
        {/* Title + Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <h1
            style={{
              fontSize: 22,
              letterSpacing: "0.16em",
              fontWeight: 700,
              color: "var(--fg)",
              margin: 0,
            }}
          >
            SUMMARY
          </h1>

          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/" className="btn-1975">← Back to Start</Link>
            <Link href="/book" className="btn-1975 btn-1975--filled">+ Add Customer</Link>
            <button onClick={load} className="btn-1975">Refresh</button>
          </div>
        </div>

        {/* Errors / Loading */}
        {err && <div style={{ color: "crimson", marginBottom: 6 }}>{err}</div>}
        {loading && <div style={{ color: "var(--muted)", marginBottom: 6 }}>Loading…</div>}

        {/* Table */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
          <div className="table-scroll">
            <table className="table-1975">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Customer</th>
                  <th>Cinema</th>
                  <th>Location</th>
                  <th>Movie</th>
                  <th>Showtime</th>
                  <th>Seat</th>
                  <th style={{ textAlign: "right" }}>Original</th>
                  <th>Discount Type</th> {/* <-- NEW */}
                  <th style={{ textAlign: "right" }}>Discount</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th>Payment</th>
                  <th>Review</th>         {/* <-- NEW */}
                </tr>
              </thead>
              <tbody>
                {table.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ padding: 10, textAlign: "center", color: "var(--muted)" }}>
                      No tickets yet.
                    </td>
                  </tr>
                ) : (
                  table.map((r, idx) => (
                    <tr key={r.ticket_id} className={idx % 2 === 1 ? "table-row-alt" : ""}>
                      <td>
                        <Link href={`/admin/ticket/${r.ticket_id}`} style={{ textDecoration: "underline" }}>
                          {r.ticket_id}
                        </Link>
                      </td>
                      <td>{r.customer_name}</td>
                      <td>{r.theater}</td>
                      <td>{r.location}</td>
                      <td>{r.movie}</td>
                      <td>{r.showtime}</td>
                      <td>{r.seat}</td>
                      <td style={{ textAlign: "right" }}>{peso(Number(r.original))}</td>
                      <td>{r.discount_type}</td> {/* <-- NEW */}
                      <td style={{ textAlign: "right" }}>{peso(Number(r.discountAmt))}</td>
                      <td style={{ textAlign: "right" }}>{peso(Number(r.total))}</td>
                      <td>{r.payment_method}</td>
                      <td>
                        {/* Show latest rating (if any) and an Add Review button */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{r.rating ? `★ ${r.rating}` : "—"}</span>
                          <Link
                            href={`/admin/reviews/new?ticketId=${r.ticket_id}`}
                            className="btn-1975"
                          >
                            Add Review
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}