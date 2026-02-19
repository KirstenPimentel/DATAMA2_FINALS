"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient"; // your existing client

type DiscountCode = "REGULAR" | "PWD" | "SENIOR" | "STUDENT";
type PaymentMethod = "GCASH" | "CARD" | "CASH";

type Option = { id: string | number; label: string };

type Theater = { theater_id: number; theater_name: string; location: string };
type Movie = { movie_id: number; title: string };
type Showtime = {
  showtime_id: number;
  movie_id: number;
  theater_id: number;
  show_date: string; // ISO date
  show_time: string; // HH:mm:ss
  ticket_price: number;
};
type Seat = { seat_id: number; seat_no: string; seat_type: "VIP" | "Regular" };
type Ticket = {
  ticket_id: number;
  showtime_id: number;
  seat_id: number;
  ticket_status: "CONFIRMED" | "CANCELLED" | "REFUNDED" | string;
};

const discountList: { code: DiscountCode; label: string; percent: number }[] = [
  { code: "REGULAR", label: "Regular", percent: 0 },
  { code: "PWD", label: "PWD", percent: 20 },
  { code: "SENIOR", label: "Senior Citizen", percent: 20 },
  { code: "STUDENT", label: "Student", percent: 10 },
];

/** Helpers */
const peso = (n: number) =>
  `₱${(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const showtimeLabel = (st: Showtime) => {
  // Format like: 2025-10-28 10:00 — ₱300.00
  const time = (st.show_time || "").slice(0, 5); // HH:mm
  return `${st.show_date} ${time}:00 — ${peso(Number(st.ticket_price))}`;
};

const Box: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({
  children,
  style,
}) => (
  <section
    style={{
      width: "min(820px, 92vw)",
      background: "#fff",
      border: "1px solid #d4d4d4",
      borderRadius: 6,
      padding: "28px 32px",
      boxShadow: "0 2px 0 rgba(0,0,0,0.06)",
      ...style,
    }}
  >
    {children}
  </section>
);

const Btn: React.FC<
  React.PropsWithChildren<{
    variant?: "primary" | "ghost";
    onClick?: () => void;
    type?: "button" | "submit";
    disabled?: boolean;
  }>
> = ({ variant = "primary", children, onClick, type = "button", disabled }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: "8px 14px",
      borderRadius: 4,
      border: "1px solid #111",
      background: variant === "primary" ? "#111" : "#fff",
      color: variant === "primary" ? "#fff" : "#111",
      letterSpacing: "0.02em",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
    }}
  >
    {children}
  </button>
);

export default function BookPage() {
  const supabase = createClient();

  const [step, setStep] = useState(0);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [theaterId, setTheaterId] = useState<string | number>("");
  const [movieId, setMovieId] = useState<string | number>("");
  const [showtimeId, setShowtimeId] = useState<string | number>("");
  const [seatId, setSeatId] = useState<string | number>("");
  const [seatLabel, setSeatLabel] = useState<string>("");
  const [discount, setDiscount] = useState<DiscountCode>("REGULAR");
  const [payment, setPayment] = useState<PaymentMethod>("CASH");

  // Data sources
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** Load theaters + movies once */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [{ data: th, error: e1 }, { data: mv, error: e2 }] = await Promise.all([
          supabase.from("theaters").select("theater_id, theater_name, location").order("theater_name", { ascending: true }),
          supabase.from("movies").select("movie_id, title").order("title", { ascending: true }),
        ]);
        if (e1) throw e1;
        if (e2) throw e2;
        if (!alive) return;
        setTheaters((th ?? []) as Theater[]);
        setMovies((mv ?? []) as Movie[]);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load data.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Load showtimes when theater or movie changes */
  useEffect(() => {
    if (!theaterId || !movieId) {
      setShowtimes([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const { data, error } = await supabase
          .from("showtimes")
          .select("showtime_id, movie_id, theater_id, show_date, show_time, ticket_price")
          .eq("theater_id", Number(theaterId))
          .eq("movie_id", Number(movieId))
          .order("show_date", { ascending: true })
          .order("show_time", { ascending: true });
        if (error) throw error;
        if (!alive) return;
        setShowtimes((data ?? []) as Showtime[]);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load showtimes.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [supabase, theaterId, movieId]);

  /** Load available seats when a showtime is chosen */
  useEffect(() => {
    if (!showtimeId) {
      setSeats([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // 1) Find the showtime (to get theater_id)
        const current = showtimes.find((s) => String(s.showtime_id) === String(showtimeId));
        if (!current) {
          setSeats([]);
          return;
        }

        // 2) All seats for that theater
        const { data: allSeats, error: e1 } = await supabase
          .from("seats")
          .select("seat_id, seat_no, seat_type, theater_id")
          .eq("theater_id", Number(current.theater_id))
          .order("seat_no", { ascending: true });
        if (e1) throw e1;

        // 3) Already confirmed tickets for that showtime
        const { data: taken, error: e2 } = await supabase
          .from("tickets")
          .select("ticket_id, showtime_id, seat_id, ticket_status")
          .eq("showtime_id", Number(showtimeId))
          .eq("ticket_status", "CONFIRMED");
        if (e2) throw e2;

        const takenIds = new Set((taken ?? []).map((t: Ticket) => t.seat_id));
        const available = (allSeats ?? []).filter((s: any) => !takenIds.has(s.seat_id));

        if (!alive) return;
        setSeats(available as Seat[]);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load seats.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [supabase, showtimeId, showtimes]);

  /** Dropdown options derived from data */
  const theaterOptions: Option[] = useMemo(
    () =>
      theaters.map((t) => ({
        id: t.theater_id,
        label: `${t.theater_name} — ${t.location}`,
      })),
    [theaters]
  );

  const movieOptions: Option[] = useMemo(
    () =>
      movies.map((m) => ({
        id: m.movie_id,
        label: m.title,
      })),
    [movies]
  );

  const showtimeOptions: { id: number | string; label: string; price: number }[] = useMemo(
    () =>
      showtimes.map((st) => ({
        id: st.showtime_id,
        label: showtimeLabel(st),
        price: Number(st.ticket_price),
      })),
    [showtimes]
  );

  const seatOptions: Option[] = useMemo(
    () =>
      seats.map((s) => ({
        id: s.seat_id,
        label: s.seat_no,
      })),
    [seats]
  );

  // Derived values for preview
  const selectedShowtime = useMemo(
    () => showtimes.find((s) => String(s.showtime_id) === String(showtimeId)),
    [showtimes, showtimeId]
  );

  const originalPrice = Number(selectedShowtime?.ticket_price ?? 0);
  const discPct = discountList.find((d) => d.code === discount)?.percent ?? 0;
  const discountAmount = Math.round(((originalPrice * discPct) / 100) * 100) / 100;
  const total = Math.max(0, Math.round((originalPrice - discountAmount) * 100) / 100);

  /** Step navigation */
  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  /** Validation per step (basic) */
  const canNext = useMemo(() => {
    switch (step) {
      case 0:
        return customerName.trim().length > 0;
      case 1:
        return !!theaterId;
      case 2:
        return !!movieId;
      case 3:
        return !!showtimeId;
      case 4:
        return !!seatId;
      case 5:
        return !!discount;
      case 6:
        return !!payment;
      default:
        return true;
    }
  }, [step, customerName, theaterId, movieId, showtimeId, seatId, discount, payment]);

  /** UI Part — same as Step 2 (minor additions for errors/spinners) */
  const StepHeader = (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
      <h1
        style={{
          fontSize: 28,
          letterSpacing: "0.16em",
          fontWeight: 700,
          color: "#111",
        }}
      >
        ADD CUSTOMER
      </h1>
      <Link
        href="/"
        style={{
          alignSelf: "start",
          border: "1px solid #111",
          borderRadius: 4,
          padding: "8px 10px",
          color: "#111",
          textDecoration: "none",
        }}
      >
        ← Back to Start
      </Link>
    </div>
  );

  const Nav = (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
      <Btn variant="ghost" onClick={back} disabled={step === 0}>
        Back
      </Btn>
      <Btn onClick={next} disabled={!canNext || step >= 7}>
        Next
      </Btn>
    </div>
  );

  const Field: React.FC<
    React.PropsWithChildren<{ label: string; helper?: string }>
  > = ({ label, helper, children }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>
      {children}
      {helper ? (
        <div style={{ color: "#666", fontSize: 12, marginTop: 6 }}>{helper}</div>
      ) : null}
    </div>
  );

  const Select = (props: JSX.IntrinsicElements["select"]) => (
    <select
      {...props}
      style={{
        width: "100%",
        border: "1px solid #111",
        borderRadius: 4,
        padding: "10px 12px",
        background: "#fff",
        color: "#111",
      }}
    />
  );

  const Input = (props: JSX.IntrinsicElements["input"]) => (
    <input
      {...props}
      style={{
        width: "100%",
        border: "1px solid #111",
        borderRadius: 4,
        padding: "10px 12px",
        background: "#fff",
        color: "#111",
      }}
    />
  );

  const StepContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Field label="Customer Name">
              <Input
                placeholder="Enter customer's full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </Field>
            {Nav}
          </>
        );

      case 1:
        return (
          <>
            <Field label="Theater">
              <Select
                value={theaterId}
                onChange={(e) => {
                  setTheaterId(e.target.value);
                  // reset downstream
                  setMovieId("");
                  setShowtimeId("");
                  setSeatId("");
                  setSeatLabel("");
                }}
              >
                <option value="">Select theater</option>
                {theaterOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            {Nav}
          </>
        );

      case 2:
        return (
          <>
            <Field label="Movie">
              <Select
                value={movieId}
                onChange={(e) => {
                  setMovieId(e.target.value);
                  setShowtimeId("");
                  setSeatId("");
                  setSeatLabel("");
                }}
              >
                <option value="">Select movie</option>
                {movieOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            {Nav}
          </>
        );

      case 3:
        return (
          <>
            <Field label="Showtime">
              <Select
                value={showtimeId}
                onChange={(e) => {
                  setShowtimeId(e.target.value);
                  setSeatId("");
                  setSeatLabel("");
                }}
              >
                <option value="">Select showtime</option>
                {showtimeOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            {loading && <div style={{ color: "#666" }}>Loading…</div>}
            {err && <div style={{ color: "crimson" }}>{err}</div>}
            {Nav}
          </>
        );

      case 4:
        return (
          <>
            <Field label="Seat">
              <Select
                value={seatId}
                onChange={(e) => {
                  const v = e.target.value;
                  setSeatId(v);
                  const opt = seatOptions.find((s) => String(s.id) === String(v));
                  setSeatLabel(opt?.label || "");
                }}
              >
                <option value="">Select seat</option>
                {seatOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            {loading && <div style={{ color: "#666" }}>Loading…</div>}
            {err && <div style={{ color: "crimson" }}>{err}</div>}
            {Nav}
          </>
        );

      case 5:
        return (
          <>
            <Field label="Discount">
              <Select
                value={discount}
                onChange={(e) => setDiscount(e.target.value as DiscountCode)}
              >
                {discountList.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label} {d.percent ? `(${d.percent}%)` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            {Nav}
          </>
        );

      case 6:
        return (
          <>
            <Field label="Payment Method">
              <Select
                value={payment}
                onChange={(e) => setPayment(e.target.value as PaymentMethod)}
              >
                <option value="GCASH">GCash</option>
                <option value="CARD">Card</option>
                <option value="CASH">Cash</option>
              </Select>
            </Field>
            {Nav}
          </>
        );

      case 7:
        // Theater label for preview
        const theaterLabel =
          theaterOptions.find((t) => String(t.id) === String(theaterId))?.label || "—";
        const movieLabel =
          movieOptions.find((m) => String(m.id) === String(movieId))?.label || "—";

        return (
          <>
            <div style={{ marginTop: 6, marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  marginBottom: 10,
                }}
              >
                TICKET PREVIEW
              </div>
              <div
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  padding: "14px 16px",
                }}
              >
                <p>
                  <strong>Name:</strong> {customerName || "—"}
                </p>
                <p>
                  <strong>Cinema:</strong> {theaterLabel}
                </p>
                <p>
                  <strong>Movie:</strong> {movieLabel}
                </p>
                <p>
                  <strong>Showtime:</strong>{" "}
                  {selectedShowtime ? showtimeLabel(selectedShowtime) : "—"}
                </p>
                <p>
                  <strong>Seat:</strong> {seatLabel || "—"}
                </p>
                <p>
                  <strong>Original:</strong> {peso(originalPrice)}
                </p>
                <p>
                  <strong>Discount:</strong>{" "}
                  {discountList.find((d) => d.code === discount)?.label} ({discPct}
                  %) → {peso(discountAmount)}
                </p>
                <p>
                  <strong>Total:</strong> {peso(total)}
                </p>
                <p>
                  <strong>Pay via:</strong> {payment}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Btn
                onClick={() => {
                  alert(
                    "Looks good! In Step 4 we’ll save this to Supabase (tickets + payments) and then ask Admin to Add another or Show Summary."
                  );
                }}
              >
                Confirm &amp; Save Ticket
              </Btn>
              <Btn variant="ghost" onClick={back}>
                Back
              </Btn>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#f6f6f6",
      }}
    >
      <Box>
        {StepHeader}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {/* Simple step indicator */}
          <div style={{ fontSize: 12, color: "#666" }}>
            Step {step + 1} of 8
          </div>
          <div
            aria-hidden
            style={{
              height: 6,
              background: "#eaeaea",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${((step + 1) / 8) * 100}%`,
                background: "#111",
                transition: "width .2s ease",
              }}
            />
          </div>
        </div>

        {err && step < 7 && (
          <div style={{ color: "crimson", marginBottom: 8 }}>{err}</div>
        )}
        {loading && step < 7 && (
          <div style={{ color: "#666", marginBottom: 8 }}>Loading…</div>
        )}

        <StepContent />
      </Box>
    </main>
  );
}
