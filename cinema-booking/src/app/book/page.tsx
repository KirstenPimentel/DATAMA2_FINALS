'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

/** Types aligned with your DB schema / views */
type Theater = { theater_id: number; theater_name: string; location: string };
type Movie = { movie_id: number; title: string };
type Showtime = {
  showtime_id: number;
  movie_id: number;
  title: string;
  theater_id: number;
  theater_name: string;
  location: string;
  show_date: string;     // 'YYYY-MM-DD'
  show_time: string;     // 'HH:mm:ss'
  ticket_price: number;
};
type Seat = { seat_id: number; seat_no: string; seat_type: 'VIP' | 'Regular' };
type DiscountType = 'REGULAR' | 'PWD' | 'SENIOR_CITIZEN' | 'STUDENT';
type PaymentMethod = 'GCASH' | 'CARD' | 'CASH';

export default function BookPage() {
  // Wizard step: 1..8
  const [step, setStep] = useState<number>(1);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [theaterId, setTheaterId] = useState<number | null>(null);
  const [movieId, setMovieId] = useState<number | null>(null);
  const [showtimeId, setShowtimeId] = useState<number | null>(null);
  const [seatId, setSeatId] = useState<number | null>(null);
  const [discountType, setDiscountType] = useState<DiscountType>('REGULAR');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('GCASH');

  // Lists
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);

  // Price
  const [price, setPrice] = useState<number>(0);
  const [discountPct, setDiscountPct] = useState<number>(0);

  // Save state
  const [saving, setSaving] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initial loads
  useEffect(() => {
    (async () => {
      setErrorMsg(null);
      const { data: th, error: thErr } = await supabase
        .from('theaters')
        .select('theater_id,theater_name,location')
        .order('theater_id', { ascending: true });

      const { data: mv, error: mvErr } = await supabase
        .from('movies')
        .select('movie_id,title')
        .order('title', { ascending: true });

      if (thErr || mvErr) {
        setErrorMsg(thErr?.message || mvErr?.message || 'Failed to load initial data.');
        return;
      }
      setTheaters(th ?? []);
      setMovies(mv ?? []);
    })();
  }, []);

  // Load showtimes when theater or movie changes
  useEffect(() => {
    (async () => {
      setErrorMsg(null);
      if (!theaterId || !movieId) return;
      const { data, error } = await supabase
        .from('showtime_catalog')
        .select('*')
        .eq('theater_id', theaterId)
        .eq('movie_id', movieId)
        .order('show_date', { ascending: true })
        .order('show_time', { ascending: true });

      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setShowtimes((data as Showtime[]) ?? []);
      setShowtimeId(null);
      setSeatId(null);
      setSeats([]);
    })();
  }, [theaterId, movieId]);

  // Load available seats when showtime changes
  useEffect(() => {
    (async () => {
      setErrorMsg(null);
      if (!showtimeId || !theaterId) return;

      // Seats already taken for this showtime
      const { data: sold, error: soldErr } = await supabase
        .from('tickets')
        .select('seat_id')
        .eq('showtime_id', showtimeId);

      if (soldErr) {
        setErrorMsg(soldErr.message);
        return;
      }
      const soldIds = new Set<number>((sold ?? []).map((s: any) => s.seat_id));

      // All seats in the theater
      const { data: allSeats, error: seatsErr } = await supabase
        .from('seats')
        .select('seat_id, seat_no, seat_type')
        .eq('theater_id', theaterId)
        .order('seat_no', { ascending: true });

      if (seatsErr) {
        setErrorMsg(seatsErr.message);
        return;
      }

      const available: Seat[] = (allSeats ?? []).filter(s => !soldIds.has(s.seat_id));
      setSeats(available);
      setSeatId(null);
    })();
  }, [showtimeId, theaterId]);

  // Load base price and discount % when showtime or discount changes
  useEffect(() => {
    (async () => {
      setErrorMsg(null);
      if (!showtimeId) return;

      // Base price
      const { data: st, error: stErr } = await supabase
        .from('showtimes')
        .select('ticket_price')
        .eq('showtime_id', showtimeId)
        .single();

      if (stErr) {
        setErrorMsg(stErr.message);
        return;
      }
      const base = st?.ticket_price ?? 0;

      // Discount percentage: prefer showtime-specific then global
      const { data: sd, error: sdErr } = await supabase
        .from('discounts')
        .select('discount_percentage')
        .eq('showtime_id', showtimeId)
        .eq('discount_type', discountType)
        .maybeSingle();

      if (sdErr) {
        setErrorMsg(sdErr.message);
        return;
      }

      let pct: number | null = (sd as any)?.discount_percentage ?? null;
      if (pct === null) {
        const { data: gd, error: gdErr } = await supabase
          .from('discounts')
          .select('discount_percentage')
          .is('showtime_id', null)
          .eq('discount_type', discountType)
          .single();
        if (gdErr) {
          setErrorMsg(gdErr.message);
          return;
        }
        pct = (gd as any)?.discount_percentage ?? 0;
      }

      setPrice(base);
      setDiscountPct(pct || 0);
    })();
  }, [showtimeId, discountType]);

  // Derived price values
  const discountAmount = useMemo(() => {
    return Math.round((price * discountPct / 100) * 100) / 100;
  }, [price, discountPct]);

  const finalPrice = useMemo(() => {
    return Math.round((price - discountAmount) * 100) / 100;
  }, [price, discountAmount]);

  // Navigation
  const canNext = useMemo(() => {
    switch (step) {
      case 1: return customerName.trim().length > 0;
      case 2: return !!theaterId;
      case 3: return !!movieId;
      case 4: return !!showtimeId;
      case 5: return !!seatId;
      case 6: return !!discountType;
      case 7: return !!paymentMethod;
      default: return true;
    }
  }, [step, customerName, theaterId, movieId, showtimeId, seatId, discountType, paymentMethod]);

  const next = () => setStep(s => Math.min(8, s + 1));
  const prev = () => setStep(s => Math.max(1, s - 1));

  // Save ticket + payment
  async function saveTicket() {
    setErrorMsg(null);
    if (!customerName || !showtimeId || !seatId) return;
    setSaving(true);

    // Insert ticket
    const { data: ticket, error: tErr } = await supabase
      .from('tickets')
      .insert({
        user_id: null,
        customer_name: customerName,
        showtime_id: showtimeId,
        seat_id: seatId,
        ticket_status: 'RESERVED',
        discount_type: discountType,
        ticket_price: price,
        discount_amount: discountAmount,
        final_price: finalPrice
      })
      .select('ticket_id')
      .single();

    if (tErr || !ticket) {
      setSaving(false);
      setErrorMsg(tErr?.message || 'Failed to save ticket. The seat may have been taken. Try another seat.');
      return;
    }
    setTicketId(ticket.ticket_id);

    // Insert payment
    const { error: pErr } = await supabase.from('payments').insert({
      ticket_id: ticket.ticket_id,
      amount: finalPrice,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'CASH' ? 'PENDING' : 'PAID'
    });

    setSaving(false);
    if (pErr) {
      setErrorMsg(`Ticket saved (ID: ${ticket.ticket_id}) but payment insert failed: ${pErr.message}`);
    }
  }

  // Helpers for preview labels
  const chosenShowtime = showtimes.find(s => s.showtime_id === showtimeId);
  const chosenSeat = seats.find(s => s.seat_id === seatId);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="card-1975 max-w-md">
        <div className="space-y-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>ADD CUSTOMER</h1>
            / ← Back to Start</Link>
          </div>

          {errorMsg && (
            <div style={{ border: '1px solid #b91c1c', padding: '0.75rem', color: '#b91c1c' }}>
              {errorMsg}
            </div>
          )}

          {/* Step blocks */}
          {step === 1 && (
            <div>
              <label className="muted-1975">Customer Name</label>
              <input
                className="input-1975"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="muted-1975">Theater</label>
              <select
                className="select-1975"
                value={theaterId ?? ''}
                onChange={(e) => setTheaterId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select theater</option>
                {theaters.map(t => (
                  <option key={t.theater_id} value={t.theater_id}>
                    {t.theater_name} — {t.location}
                  </option>
                ))}
              </select>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="muted-1975">Movie</label>
              <select
                className="select-1975"
                value={movieId ?? ''}
                onChange={(e) => setMovieId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select movie</option>
                {movies.map(m => (
                  <option key={m.movie_id} value={m.movie_id}>{m.title}</option>
                ))}
              </select>
            </div>
          )}

          {step === 4 && (
            <div>
              <label className="muted-1975">Showtime</label>
              <select
                className="select-1975"
                value={showtimeId ?? ''}
                onChange={(e) => setShowtimeId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select showtime</option>
                {showtimes.map(st => (
                  <option key={st.showtime_id} value={st.showtime_id}>
                    {st.show_date} • {st.show_time} • ₱{st.ticket_price} ({st.theater_name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {step === 5 && (
            <div>
              <label className="muted-1975">Seat</label>
              <select
                className="select-1975"
                value={seatId ?? ''}
                onChange={(e) => setSeatId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select seat</option>
                {seats.map(s => (
                  <option key={s.seat_id} value={s.seat_id}>
                    {s.seat_no} — {s.seat_type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {step === 6 && (
            <div>
              <label className="muted-1975">Discount</label>
              <select
                className="select-1975"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              >
                <option value="REGULAR">Regular (0%)</option>
                <option value="PWD">PWD (20%)</option>
                <option value="SENIOR_CITIZEN">Senior Citizen (20%)</option>
                <option value="STUDENT">Student (10%)</option>
              </select>
            </div>
          )}

          {step === 7 && (
            <div>
              <label className="muted-1975">Payment Method</label>
              <select
                className="select-1975"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="GCASH">GCash</option>
                <option value="CARD">Card</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          )}

          {step === 8 && (
            <div>
              <h2>Ticket Preview</h2>
              <div className="card-1975" style={{ padding: '1rem', marginTop: '0.5rem' }}>
                <div><b>Name:</b> {customerName}</div>
                <div><b>Cinema:</b> {chosenShowtime?.theater_name} — {chosenShowtime?.location}</div>
                <div><b>Movie:</b> {chosenShowtime?.title}</div>
                <div><b>Showtime:</b> {chosenShowtime?.show_date} {chosenShowtime?.show_time}</div>
                <div><b>Seat:</b> {chosenSeat?.seat_no}</div>
                <div style={{ marginTop: '0.5rem' }}><b>Original:</b> ₱{price.toFixed(2)}</div>
                <div><b>Discount:</b> {discountType} ({discountPct}%) → ₱{discountAmount.toFixed(2)}</div>
                <div><b>Total:</b> ₱{finalPrice.toFixed(2)}</div>
                <div><b>Pay via:</b> {paymentMethod}</div>
              </div>

              {!ticketId ? (
                <div style={{ marginTop: '1rem' }}>
                  <button
                    className="btn-1975"
                    onClick={saveTicket}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Confirm & Save Ticket'}
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ color: '#166534', marginBottom: '0.75rem' }}>
                    Ticket saved (ID: {ticketId})
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    /book
                      <span className="btn-1975">Add Customer</span>
                    </Link>
                    /admin/summary
                      <span className="btn-1975">Show Summary</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn-1975" onClick={prev} disabled={step === 1}>Back</button>
            {step < 8 && (
              <button className="btn-1975" onClick={next} disabled={!canNext}>Next</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}