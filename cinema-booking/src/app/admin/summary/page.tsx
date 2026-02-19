"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/** Types */
type Showtime = {
  show_date: string;
  show_time: string;
  ticket_price: number | null;
  movie_id?: number | null;
  movies?: { title: string | null } | null;
  theaters?: { theater_name: string | null; location: string | null } | null;
};

type RowRaw = {
  ticket_id: number;
  customer_name: string;
  ticket_status: string | null;
  booking_date: string | null;
  ticket_price: number | null;
  final_price: number | null;
  discount_type?: string | null;
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

type ReviewRow = {
  movie_id: number;
  rating: number;
  review_text: string | null;
  review_date: string | null;
  email: string | null;
};

const peso = (n: number) =>
  `₱${(n ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

export default function AdminSummaryPage() {
  const [rows, setRows] = useState<RowRaw[]>([]);
  const [payments, setPayments] = useState<Record<number, Payment>>({});
  const [reviewsByMovieAndName, setReviewsByMovieAndName] = useState<
    Record<string, ReviewRow | undefined>
  >({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Scroll sync + header alignment
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const railScrollRef = useRef<HTMLDivElement | null>(null);
  const theadRef = useRef<HTMLTableSectionElement | null>(null);
  const [actionHeaderH, setActionHeaderH] = useState<number>(42);

  // sync scrolling
  useEffect(() => {
    const left = tableScrollRef.current;
    const right = railScrollRef.current;
    if (!left || !right) return;

    const onLeft = () => {
      right.scrollTop = left.scrollTop;
    };
    const onRight = () => {
      left.scrollTop = right.scrollTop;
    };
    left.addEventListener("scroll", onLeft);
    right.addEventListener("scroll", onRight);
    return () => {
      left.removeEventListener("scroll", onLeft);
      right.removeEventListener("scroll", onRight);
    };
  }, [tableScrollRef.current, railScrollRef.current]);

  // measure header height
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (theadRef.current) {
        const h = theadRef.current.getBoundingClientRect().height;
        if (h && Math.abs(h - actionHeaderH) > 0.5) setActionHeaderH(h);
      }
    };
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, [theadRef.current, actionHeaderH]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
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
            movie_id,
            movies:movie_id ( title ),
            theaters:theater_id ( theater_name, location )
          )
        `)
        .order("booking_date", { ascending: false })
        .limit(500);
      if (tErr) throw tErr;

      const tickets = (ticketsData ?? []) as unknown as RowRaw[];
      setRows(tickets);

      const ticketIds = tickets.map((t) => t.ticket_id);
      if (ticketIds.length > 0) {
        const { data: paysData, error: pErr } = await supabase
          .from("payments")
          .select("ticket_id, amount, payment_method, payment_status, payment_date")
          .in("ticket_id", ticketIds);
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

      const movieIds = Array.from(
        new Set(
          tickets
            .map((t) => t.showtimes?.movie_id)
            .filter((m): m is number => typeof m === "number")
        )
      );
      if (movieIds.length) {
        const { data: rData, error: rErr } = await supabase
          .from("reviews")
          .select("movie_id, rating, review_text, review_date, email")
          .in("movie_id", movieIds)
          .order("review_date", { ascending: false });
        if (rErr) throw rErr;

        const latest: Record<string, ReviewRow> = {};
        for (const r of (rData ?? []) as ReviewRow[]) {
          const key = `${r.movie_id}||${norm(r.email)}`;
          if (!latest[key]) latest[key] = r;
        }
        setReviewsByMovieAndName(latest);
      } else {
        setReviewsByMovieAndName({});
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

  const table = useMemo(() => {
    return rows.map((r) => {
      const theaterName = r.showtimes?.theaters?.theater_name ?? "—";
      const location = r.showtimes?.theaters?.location ?? "—";
      const movieTitle = r.showtimes?.movies?.title ?? "—";
      const movieId = r.showtimes?.movie_id ?? null;

      const date = r.showtimes?.show_date ?? "—";
      const timeHH = (r.showtimes?.show_time ?? "").slice(0, 5) || "—";
      const showtimeStr = `${date} ${timeHH}:00`;

      const original = r.ticket_price ?? r.showtimes?.ticket_price ?? 0;
      const payment = payments[r.ticket_id];
      const total = r.final_price ?? payment?.amount ?? original;
      const discountAmt = Math.max(0, Number(original) - Number(total));

      const reviewKey = movieId != null ? `${movieId}||${norm(r.customer_name)}` : "";
      const review = reviewKey ? reviewsByMovieAndName[reviewKey] : undefined;

      const hasRating = typeof review?.rating === "number";
      const hasReviewText = !!(review?.review_text && review.review_text.trim().length > 0);
      const hasFullReview = hasRating && hasReviewText;

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
        discount_type: (r.discount_type ?? "REGULAR").toUpperCase(),
        discountAmt,
        total,
        payment_method: payment?.payment_method ?? "—",
        rating: hasRating ? review!.rating : null,
        review_text: hasReviewText ? review!.review_text! : "",
        has_full_review: hasFullReview, // only disable when both exist
      };
    });
  }, [rows, payments, reviewsByMovieAndName]);

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
            <Link href="/" className="btn-1975">
              ← Back to Start
            </Link>
            <Link href="/admin/book" className="btn-1975 btn-1975--filled">
              + Add Customer
            </Link>
            <button onClick={load} className="btn-1975">
              Refresh
            </button>
          </div>
        </div>

        {/* Content: table + right rail */}
        <div style={{ display: "flex", gap: 10 }}>
          {/* LEFT: Table */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              border: "1px solid var(--border)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div ref={tableScrollRef} className="table-scroll">
              <table className="table-1975">
                <thead ref={theadRef}>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Customer</th>
                    <th>Cinema</th>
                    <th>Location</th>
                    <th>Movie</th>
                    <th>Showtime</th>
                    <th>Seat</th>
                    <th style={{ textAlign: "right" }}>Original</th>
                    <th>Discount Type</th>
                    <th style={{ textAlign: "right" }}>Discount</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th>Payment</th>
                    <th>Review</th>
                    <th>Review Text</th>
                  </tr>
                </thead>
                <tbody>
                  {table.length === 0 ? (
                    <tr>
                      <td
                        colSpan={14}
                        style={{ padding: 10, textAlign: "center", color: "var(--muted)" }}
                      >
                        No tickets yet.
                      </td>
                    </tr>
                  ) : (
                    table.map((r, idx) => (
                      <tr key={r.ticket_id} className={idx % 2 === 1 ? "table-row-alt" : ""}>
                        <td>
                          <Link
                            href={`/admin/ticket/${r.ticket_id}`}
                            style={{ textDecoration: "underline" }}
                          >
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
                        <td>{r.discount_type}</td>
                        <td style={{ textAlign: "right" }}>{peso(Number(r.discountAmt))}</td>
                        <td style={{ textAlign: "right" }}>{peso(Number(r.total))}</td>
                        <td>{r.payment_method}</td>
                        <td>{r.rating ? `★ ${r.rating}` : "—"}</td>
                        <td>
                          <span
                            style={{ color: r.review_text ? "var(--fg)" : "var(--muted)" }}
                          >
                            {r.review_text || ""}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT: Vertical review buttons rail */}
          <div
            style={{
              width: 140,
              border: "1px solid var(--border)",
              borderRadius: 6,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                height: actionHeaderH, // aligned to actual thead height
                background: "#0f0f0f",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Action
            </div>

            <div ref={railScrollRef} style={{ overflowY: "auto", maxHeight: "70vh" }}>
              {table.length === 0 ? (
                <div style={{ padding: 10, color: "var(--muted)", textAlign: "center" }}>—</div>
              ) : (
                table.map((r) => (
                  <div
                    key={`rail-${r.ticket_id}`}
                    style={{
                      padding: 8,
                      borderTop: "1px solid #1f1f1f",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {r.has_full_review ? (
                      <button
                        className="btn-1975"
                        title="Only one finalized review per customer"
                        disabled
                        style={{ opacity: 0.6, width: 110 }}
                      >
                        Reviewed
                      </button>
                    ) : (
                      <Link
                        href={`/admin/reviews/new?ticketId=${r.ticket_id}`}
                        className="btn-1975"
                        style={{ width: 110, textAlign: "center" }}
                        title="Add/Complete Review"
                      >
                        Add Review
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
