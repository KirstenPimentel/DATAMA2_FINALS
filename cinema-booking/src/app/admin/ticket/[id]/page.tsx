"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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

const peso = (n: number) =>
  `₱${(n ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketRow | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setErr(null);
      try {
        const { data: tData, error: tErr } = await supabase
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
              movies:movie_id ( title ),
              theaters:theater_id ( theater_name, location )
            )
          `)
          .eq("ticket_id", Number(id))
          .maybeSingle();
        if (tErr) throw tErr;

        const t = tData as unknown as TicketRow | null;
        setTicket(t);

        const { data: pData, error: pErr } = await supabase
          .from("payments")
          .select("ticket_id, amount, payment_method, payment_status, payment_date")
          .eq("ticket_id", Number(id))
          .order("payment_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (pErr) throw pErr;

        setPayment(pData as unknown as Payment | null);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load ticket.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const computed = useMemo(() => {
    if (!ticket) return null;
    const showDate = ticket.showtimes?.show_date ?? "—";
    const showTime = (ticket.showtimes?.show_time ?? "").slice(0, 5);
    const showtimeStr = showTime ? `${showDate} ${showTime}:00` : showDate;

    const original = ticket.ticket_price ?? ticket.showtimes?.ticket_price ?? 0;
    const total = ticket.final_price ?? payment?.amount ?? original;
    const discountAmt = Math.max(0, Number(original) - Number(total));
    const discountType = (ticket.discount_type ?? "REGULAR").toUpperCase();

    return {
      customer: ticket.customer_name,
      movie: ticket.showtimes?.movies?.title ?? "—",
      theater: ticket.showtimes?.theaters?.theater_name ?? "—",
      location: ticket.showtimes?.theaters?.location ?? "—",
      seat: ticket.seats?.seat_no ?? "—",
      showtime: showtimeStr,
      booking: ticket.booking_date ? new Date(ticket.booking_date).toLocaleString() : "—",
      original,
      discountAmt,
      total,
      discountType,
      paymentMethod: payment?.payment_method ?? "—",
      status: ticket.ticket_status ?? "—",
    };
  }, [ticket, payment]);

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
          width: "min(700px, 94vw)",
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "22px 24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ fontSize: 18, letterSpacing: "0.16em", fontWeight: 700, margin: 0 }}>
            DIGITAL TICKET
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/admin/summary" className="btn-1975">← Summary</Link>
            <button className="btn-1975" onClick={() => window.print()}>Print</button>
          </div>
        </div>

        {loading && <div style={{ color: "var(--muted)", marginBottom: 8 }}>Loading…</div>}
        {err && <div style={{ color: "crimson", marginBottom: 8 }}>{err}</div>}

        {ticket && computed && (
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.08em" }}>
                {computed.movie}
              </div>
              <div className="muted-1975">TICKET #{ticket.ticket_id} • {computed.status}</div>

              <div style={{ marginTop: 10 }}>
                <strong>Name:</strong> {computed.customer}
              </div>
              <div>
                <strong>Cinema:</strong> {computed.theater} — {computed.location}
              </div>
              <div>
                <strong>Showtime:</strong> {computed.showtime}
              </div>
              <div>
                <strong>Seat:</strong> {computed.seat}
              </div>

              <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span><strong>Original</strong></span>
                  <span>{peso(Number(computed.original))}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>
                    <strong>Discount</strong> ({computed.discountType})
                  </span>
                  <span>- {peso(Number(computed.discountAmt))}</span>
                </div>
                <div style={{ height: 1, background: "var(--border)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span>Total</span>
                  <span>{peso(Number(computed.total))}</span>
                </div>
              </div>

              <div style={{ display: "grid", gap: 4, marginTop: 12 }}>
                <div><strong>Payment Method:</strong> {computed.paymentMethod}</div>
                <div><strong>Booked At:</strong> {computed.booking}</div>
              </div>
            </div>
          </div>
        )}

        {!ticket && !loading && !err && (
          <div className="muted-1975">No ticket found.</div>
        )}
      </section>
    </main>
  );
}