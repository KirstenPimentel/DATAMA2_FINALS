"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Showtime = {
  movie_id: number;
  movies?: { title: string | null } | null;
};
type TicketRow = {
  ticket_id: number;
  customer_name: string;
  showtimes?: Showtime | null;
};

type ExistingReview = {
  review_id: number;
  movie_id: number;
  rating: number | null;
  review_text: string | null;
  email: string | null;
};

const hasText = (s: string | null | undefined) => !!(s && s.trim().length > 0);

export default function NewReviewPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const ticketIdParam = sp.get("ticketId");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [ticket, setTicket] = useState<TicketRow | null>(null);
  const [existing, setExisting] = useState<ExistingReview | null>(null);

  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketIdParam) return;
      setLoading(true);
      setErr(null);
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select(`
            ticket_id,
            customer_name,
            showtimes:showtime_id (
              movie_id,
              movies:movie_id ( title )
            )
          `)
          .eq("ticket_id", Number(ticketIdParam))
          .maybeSingle();
        if (error) throw error;
        setTicket(data as unknown as TicketRow);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load ticket.");
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketIdParam]);

  const movieId = ticket?.showtimes?.movie_id ?? null;
  const movieTitle = ticket?.showtimes?.movies?.title ?? "—";
  const customerName = ticket?.customer_name ?? "—";

  useEffect(() => {
    const checkExisting = async () => {
      if (!movieId || !customerName) return;
      setLoading(true);
      setErr(null);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("review_id, movie_id, rating, review_text, email")
          .eq("movie_id", Number(movieId))
          .eq("email", customerName)
          .order("review_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        const ex = (data as unknown as ExistingReview) ?? null;
        setExisting(ex);
        if (ex?.rating != null) setRating(ex.rating);
        if (ex?.review_text) setReviewText(ex.review_text);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to check existing review.");
      } finally {
        setLoading(false);
      }
    };
    checkExisting();
  }, [movieId, customerName]);

  const hasFullReview =
    !!existing && hasText(existing.review_text) && typeof existing.rating === "number";

  const canSave = useMemo(() => {
    if (!movieId || !customerName) return false;
    if (hasFullReview) return false; // already finalized
    return rating >= 1 && rating <= 5; // text optional
  }, [movieId, customerName, rating, hasFullReview]);

  const save = async () => {
    if (!canSave) return;
    setLoading(true);
    setErr(null);
    try {
      if (existing && !hasText(existing.review_text)) {
        const { error } = await supabase
          .from("reviews")
          .update({
            rating,
            review_text: reviewText || null,
            review_date: new Date().toISOString(),
          })
          .eq("review_id", existing.review_id);
        if (error) throw error;
      } else if (!existing) {
        const { error } = await supabase.from("reviews").insert({
          movie_id: movieId,
          rating,
          review_text: reviewText || null,
          email: customerName, // store customer name for uniqueness
        } as any);
        if (error) throw error;
      } else {
        throw new Error("Only one review per customer");
      }

      router.push("/admin/summary");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save review.");
    } finally {
      setLoading(false);
    }
  };

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
          width: "min(640px, 94vw)",
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "24px 28px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <h1 style={{ fontSize: 20, letterSpacing: "0.16em", fontWeight: 700, margin: 0 }}>
            ADD REVIEW
          </h1>
          <Link href="/admin/summary" className="btn-1975">← Back</Link>
        </div>

        {loading && <div style={{ color: "var(--muted)", marginBottom: 10 }}>Loading…</div>}
        {err && <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>}

        {ticket && (
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Customer</div>
              <div className="muted-1975">{customerName}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Movie</div>
              <div className="muted-1975">{movieTitle}</div>
            </div>

            {hasFullReview ? (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "12px 14px",
                  color: "var(--fg)",
                }}
              >
                <strong>Only one review per customer</strong>
                <div className="muted-1975" style={{ marginTop: 6 }}>
                  {customerName} already submitted a full review (rating + text) for this movie.
                </div>
                <div style={{ marginTop: 12 }}>
                  <Link href="/admin/summary" className="btn-1975">Back to Summary</Link>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Rating (1–5)</div>
                  <select
                    className="select-1975"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Review (optional)</div>
                  <textarea
                    className="input-1975"
                    rows={5}
                    placeholder="Type feedback…"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  <button
                    className="btn-1975 btn-1975--filled"
                    onClick={save}
                    disabled={!canSave || loading}
                  >
                    {loading ? "Saving…" : "Save Review"}
                  </button>
                  <Link href="/admin/summary" className="btn-1975">Cancel</Link>
                </div>
              </>
            )}
          </div>
        )}

        {!ticket && !loading && !err && (
          <div className="muted-1975">No ticket found.</div>
        )}
      </section>
    </main>
  );
}
