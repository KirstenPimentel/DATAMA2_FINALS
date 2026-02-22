"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

/** ---------------------------
 *    Types & Helpers
 *  --------------------------*/
type DiscountCode = "REGULAR" | "PWD" | "SENIOR" | "STUDENT";
type PaymentMethod = "GCASH" | "CARD" | "CASH";

type Option = { id: string | number; label: string };

type Theater = { theater_id: number; theater_name: string; location: string };
type Movie = { movie_id: number; title: string };
type Showtime = {
  showtime_id: number;
  movie_id: number;
  theater_id: number;
  show_date: string; // YYYY-MM-DD
  show_time: string; // HH:mm:ss
  ticket_price: number;
};
type Seat = { seat_id: number; seat_no: string; seat_type: "VIP" | "Regular" };
type Ticket = {
  ticket_id: number;
  showtime_id: number;
  seat_id: number;
};

/** Discount options */
const discountList: { code: DiscountCode; label: string; percent: number }[] = [
  { code: "REGULAR", label: "Regular", percent: 0 },
  { code: "PWD", label: "PWD", percent: 20 },
  { code: "SENIOR", label: "Senior Citizen", percent: 20 },
  { code: "STUDENT", label: "Student", percent: 10 },
];

const peso = (n: number) =>
  `₱${(n ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const showtimeLabel = (st: Showtime) => {
  const hhmm = (st.show_time || "").slice(0, 5);
  return `${st.show_date} ${hhmm}:00 — ${peso(Number(st.ticket_price))}`;
};

/** ---------------------------
 *    UI Primitives
 *  --------------------------*/
function Box({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <section
      className="card-1975"
      style={{
        width: "min(820px, 92vw)",
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "28px 32px",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function Btn({
  variant = "primary",
  onClick,
  type = "button",
  disabled,
  children,
}: {
  variant?: "primary" | "ghost";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-1975 ${variant === "primary" ? "btn-1975--filled" : ""}`}
      style={{
        border: "1px solid var(--fg)",
        background: variant === "primary" ? "var(--fg)" : "transparent",
        color: variant === "primary" ? "var(--bg)" : "var(--fg)",
        padding: "8px 14px",
        borderRadius: 4,
        letterSpacing: "0.02em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>
      {children}
      {helper ? (
        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>{helper}</div>
      ) : null}
    </div>
  );
}

function SelectEl(props: JSX.IntrinsicElements["select"]) {
  return (
    <select
      {...props}
      className="select-1975"
      style={{
        width: "100%",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: "10px 12px",
        background: "#f7f4eb",
        color: "var(--fg)",
      }}
    />
  );
}

function InputEl(props: JSX.IntrinsicElements["input"]) {
  return (
    <input
      {...props}
      className="input-1975"
      style={{
        width: "100%",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: "10px 12px",
        background: "#f7f4eb",
        color: "var(--fg)",
      }}
    />
  );
}

/** ---------------------------
 *    Page
 *  --------------------------*/
export default function BookPage() {
  const router = useRouter();

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

  // Save state
  const [saving, setSaving] = useState(false);
  const [savedTicketId, setSavedTicketId] = useState<number | null>(null);

  /** Load theaters + movies once */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [{ data: th, error: e1 }, { data: mv, error: e2 }] = await Promise.all([
          supabase
            .from("theaters")
            .select("theater_id, theater_name, location")
            .order("theater_name", { ascending: true }),
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
  }, []);

  /** Load showtimes when theater or movie changes (hide past showtimes) */
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

        // Filter out past showtimes using local date+time
        const now = new Date();
        const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const nowTime = now.toTimeString().slice(0, 8); // HH:mm:ss

        const upcoming = (data ?? []).filter((st: any) => {
          const d = String(st.show_date ?? "");
          const t = String(st.show_time ?? "");
          if (d > today) return true;
          if (d < today) return false;
          return t >= nowTime;
        });

        if (!alive) return;
        setShowtimes(upcoming as Showtime[]);
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
  }, [theaterId, movieId]);

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

        // 3) Tickets for that showtime
        const { data: taken, error: e2 } = await supabase
          .from("tickets")
          .select("ticket_id, showtime_id, seat_id")
          .eq("showtime_id", Number(showtimeId));
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
  }, [showtimeId, showtimes]);

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

  /** Navigation — with guard on Step 4 -> Step 5 */
  const next = async () => {
    if (step === 4) {
      if (!showtimeId || !seatId) return;
      try {
        setLoading(true);
        setErr(null);

        // Ensure showtime still exists and not past
        const { data: stData, error: stErr } = await supabase
          .from("showtimes")
          .select("showtime_id, show_date, show_time")
          .eq("showtime_id", Number(showtimeId))
          .maybeSingle();
        if (stErr) throw stErr;
        if (!stData) {
          setErr("Selected showtime is no longer available. Please choose another showtime.");
          setSeatId("");
          setSeatLabel("");
          setLoading(false);
          return;
        }
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        const nowTime = now.toTimeString().slice(0, 8);
        const d = String(stData.show_date ?? "");
        const t = String(stData.show_time ?? "");
        if (d < today || (d === today && t < nowTime)) {
          setErr("Selected showtime has passed. Please choose another showtime.");
          setSeatId("");
          setSeatLabel("");
          setLoading(false);
          return;
        }

        // Check if the selected seat is still free
        const { data: seatTakenRow, error: tkErr } = await supabase
          .from("tickets")
          .select("ticket_id")
          .eq("showtime_id", Number(showtimeId))
          .eq("seat_id", Number(seatId))
          .maybeSingle();
        if (tkErr) throw tkErr;
        if (seatTakenRow) {
          setErr("Seat just got taken. Please pick another seat.");
          setLoading(false);
          return;
        }
      } catch (e: any) {
        setErr(e?.message ?? "Failed to validate seat availability.");
        setLoading(false);
        return;
      }
    }

    setStep((s) => s + 1);
    setLoading(false);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  /** Validation per step */
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

  /** Save handler — minimal insert + required fields */
  const handleConfirmSave = async () => {
    if (!customerName || !showtimeId || !seatId) return;
    setSaving(true);
    setErr(null);

    try {
      // Double-check seat still available
      const { data: taken, error: eCheck } = await supabase
        .from("tickets")
        .select("seat_id")
        .eq("showtime_id", Number(showtimeId));
      if (eCheck) throw eCheck;
      const seatTaken = ((taken ?? []) as Array<{ seat_id: string | number }>).some(
        (t) => String(t.seat_id) === String(seatId)
      );
      if (seatTaken) {
        setErr("Seat just got taken. Please pick another seat.");
        return;
      }

      // Insert ticket (includes discount_type)
      const minimalTicket: Record<string, any> = {
        customer_name: customerName,
        showtime_id: Number(showtimeId),
        seat_id: Number(seatId),
        booking_date: new Date().toISOString(),
        ticket_status: "RESERVED",
        ticket_price: originalPrice,
        final_price: total,
        discount_type: discount, // REGULAR | PWD | SENIOR | STUDENT
      };

      const insertRes = await supabase
        .from("tickets")
        .insert(minimalTicket)
        .select("ticket_id")
        .single();

      // DB unique seat conflict
      if (insertRes.error) {
        if ((insertRes.error as any).code === "23505") {
          setErr("Seat just got taken. Please pick another seat.");
          return;
        }
        throw insertRes.error;
      }

      const ticketId: number = insertRes.data.ticket_id;

      // Insert payment
      const payRes = await supabase.from("payments").insert({
        ticket_id: ticketId,
        amount: total,
        payment_method: payment,
        payment_status: "PAID",
        payment_date: new Date().toISOString(),
      } as any);

      if (payRes.error) throw payRes.error;

      setSavedTicketId(ticketId);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save ticket.");
    } finally {
      setSaving(false);
    }
  };

  /** Reset form for "Add another customer" */
  const resetAll = () => {
    setStep(0);
    setCustomerName("");
    setTheaterId("");
    setMovieId("");
    setShowtimeId("");
    setSeatId("");
    setSeatLabel("");
    setDiscount("REGULAR");
    setPayment("CASH");
    setSavedTicketId(null);
    setErr(null);
  };

  /** Render */
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
      <Box>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <h1
            style={{
              fontSize: 28,
              letterSpacing: "0.16em",
              fontWeight: 700,
              color: "var(--fg)",
            }}
          >
            ADD CUSTOMER
          </h1>
          <Link href="/" className="btn-1975" style={{ borderColor: "var(--fg)" }}>
            ← Back to Start
          </Link>
        </div>

        {/* Stepper */}
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Step {step + 1} of 8</div>
          <div
            aria-hidden
            style={{
              height: 6,
              background: "#eae6da",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${((step + 1) / 8) * 100}%`,
                background: "var(--fg)",
                transition: "width .2s ease",
              }}
            />
          </div>
        </div>

        {/* Errors/Loading */}
        {err && <div style={{ color: "crimson", marginBottom: 8 }}>{err}</div>}
        {loading && <div style={{ color: "var(--muted)", marginBottom: 8 }}>Loading…</div>}

        {/* Steps */}
        {step === 0 && (
          <>
            <Field label="Customer Name">
              <InputEl
                placeholder="Enter customer's full name"
                value={customerName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
              />
            </Field>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <Btn variant="ghost" onClick={back} disabled>
                Back
              </Btn>
              <Btn onClick={() => void next()} disabled={!canNext}>
                Next
              </Btn>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Theater">
              <SelectEl
                value={theaterId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  setTheaterId(e.target.value);
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
              </SelectEl>
            </Field>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <Btn variant="ghost" onClick={back}>
                Back
              </Btn>
              <Btn onClick={() => void next()} disabled={!canNext}>
                Next
              </Btn>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Movie">
              <SelectEl
                value={movieId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
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
              </SelectEl>
            </Field>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <Btn variant="ghost" onClick={back}>
                Back
              </Btn>
              <Btn onClick={() => void next()} disabled={!canNext}>
                Next
              </Btn>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="Showtime">
              <SelectEl
                value={showtimeId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
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
              </SelectEl>
            </Field>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <Btn variant="ghost" onClick={back}>
                Back
              </Btn>
              <Btn onClick={() => void next()} disabled={!canNext}>
                Next
              </Btn>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <Field label="Seat">
              <SelectEl
                value={seatId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
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
              </SelectEl>
            </Field>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <Btn variant="ghost" onClick={back}>
                Back
              </Btn>
              <Btn onClick={() => void next()} disabled={!canNext}>
                Next
              </Btn>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <Field label="Discount">
              <SelectEl
                value={discount}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setDiscount(e.target.value as DiscountCode)
                }
              >
                {discountList.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label} {d.percent ? `(${d.percent}%)` : ""}
                  </option>
                ))}
              </SelectEl>
            </Field>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <Btn variant="ghost" onClick={back}>
                Back
              </Btn>
              <Btn onClick={() => void next()} disabled={!canNext}>
                Next
              </Btn>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <Field label="Payment Method">
              <SelectEl
                value={payment}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setPayment(e.target.value as PaymentMethod)
                }
              >
                <option value="GCASH">GCash</option>
                <option value="CARD">Card</option>
                <option value="CASH">Cash</option>
              </SelectEl>
            </Field>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <Btn variant="ghost" onClick={back}>
                Back
              </Btn>
              <Btn onClick={() => void next()} disabled={!canNext}>
                Next
              </Btn>
            </div>
          </>
        )}

        {step === 7 && (
          <>
            {/* Preview */}
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
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "14px 16px",
                  background: "var(--card-bg)",
                }}
              >
                <p>
                  <strong>Name:</strong> {customerName || "—"}
                </p>
                <p>
                  <strong>Cinema:</strong>{" "}
                  {theaterOptions.find((t) => String(t.id) === String(theaterId))?.label || "—"}
                </p>
                <p>
                  <strong>Movie:</strong>{" "}
                  {movieOptions.find((m) => String(m.id) === String(movieId))?.label || "—"}
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

            {/* Actions */}
            {savedTicketId ? (
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <Btn onClick={resetAll}>Add another customer</Btn>
                <Btn variant="ghost" onClick={() => router.push("/admin/summary")}>
                  Show summary
                </Btn>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <Btn onClick={handleConfirmSave} disabled={saving}>
                  {saving ? "Saving…" : "Confirm & Save Ticket"}
                </Btn>
                <Btn variant="ghost" onClick={back} disabled={saving}>
                  Back
                </Btn>
              </div>
            )}
          </>
        )}
      </Box>
    </main>
  );
}