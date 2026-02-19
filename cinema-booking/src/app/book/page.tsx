"use client";

import Link from "next/link";
import { useMemo, useState } from "react";


type DiscountCode = "REGULAR" | "PWD" | "SENIOR" | "STUDENT";
type PaymentMethod = "GCASH" | "CARD" | "CASH";

type Option = { id: string | number; label: string };

const discountList: { code: DiscountCode; label: string; percent: number }[] = [
  { code: "REGULAR", label: "Regular", percent: 0 },
  { code: "PWD", label: "PWD", percent: 20 },
  { code: "SENIOR", label: "Senior Citizen", percent: 20 },
  { code: "STUDENT", label: "Student", percent: 10 },
];

// TEMP OPTIONS (will be fetched later)
const theaterOptions: Option[] = [];
const movieOptions: Option[] = [];
const showtimeOptions: { id: number | string; label: string; price: number }[] =
  [];
const seatOptions: Option[] = [];

/** Lightweight layout primitives for minimalist b/w look */
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

  // Derived values for preview
  const selectedShowtime = useMemo(
    () => showtimeOptions.find((s) => String(s.id) === String(showtimeId)),
    [showtimeId]
  );

  const originalPrice = selectedShowtime?.price ?? 0;
  const discPct = discountList.find((d) => d.code === discount)?.percent ?? 0;
  const discountAmount = Math.round((originalPrice * discPct) / 100 * 100) / 100;
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

  /** Renderers per step */
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
          border: "1px solid #111",
          borderRadius: 4,
          padding: "6px 10px",
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
                    {s.label} {/* e.g., 2025-10-28 10:00 — ₱300.00 */}
                  </option>
                ))}
              </Select>
            </Field>
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
                {/* We’ll fill these from fetched values in Step 3 */}
                <p>
                  <strong>Cinema:</strong> {/* Theater Name — Location */}
                </p>
                <p>
                  <strong>Movie:</strong> {/* Movie title */}
                </p>
                <p>
                  <strong>Showtime:</strong>{" "}
                  {selectedShowtime?.label || "—"}
                </p>
                <p>
                  <strong>Seat:</strong> {seatLabel || "—"}
                </p>
                <p>
                  <strong>Original:</strong> ₱{originalPrice.toFixed(2)}
                </p>
                <p>
                  <strong>Discount:</strong>{" "}
                  {discountList.find((d) => d.code === discount)?.label}{" "}
                  ({discPct}%) → ₱{discountAmount.toFixed(2)}
                </p>
                <p>
                  <strong>Total:</strong> ₱{total.toFixed(2)}
                </p>
                <p>
                  <strong>Pay via:</strong> {payment}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Btn
                onClick={() => {
                  // NEXT STEP: will hook this to API to save ticket
                  alert("In Step 4 we’ll save this to Supabase. For now, UI only.");
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

        <StepContent />
      </Box>
    </main>
  );
}