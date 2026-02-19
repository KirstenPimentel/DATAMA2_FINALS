'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Row = {
  role: string | null;
  user_email: string | null;

  ticket_id: number;
  showtime_id: number;
  seat_id: number;
  seat_no: string;
  booking_date: string; // ISO
  status: string;

  movie_title: string;
  show_date: string;  // 'YYYY-MM-DD'
  show_time: string;  // 'HH:mm:ss'
  theater_name: string;
  location: string;

  original_price: number;
  discount_type: string;
  discount_percentage: number;
  discount_amount: number;
  discounted_price: number;

  payment_method: string | null;
  payment_amount: number | null;
  payment_status: string | null;
  payment_date: string | null;

  review_rating: number | null;
  review_text: string | null;
  review_date: string | null;
};

export default function AdminSummary() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from('admin_show_summary')
        .select('*')
        .order('booking_date', { ascending: false });

      if (error) {
        setErr(error.message);
        setRows([]);
      } else {
        setRows((data as Row[]) ?? []);
      }

      setLoading(false);
    })();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="card-1975" style={{ width: '100%', maxWidth: 1100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1>SHOW SUMMARY</h1>
          / ← Back to Start</Link>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          /bookAdd Customer</Link>
        </div>

        {loading && <div className="muted-1975">Loading…</div>}
        {err && <div style={{ border: '1px solid #b91c1c', padding: '0.75rem', color: '#b91c1c', marginBottom: '0.75rem' }}>{err}</div>}

        {!loading && !err && (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ background: '#111', color: '#fff' }}>
                  <th style={th}>Role</th>
                  <th style={th}>User Email</th>
                  <th style={th}>Ticket ID</th>
                  <th style={th}>Showtime ID</th>
                  <th style={th}>Seat</th>
                  <th style={th}>Booking Date</th>
                  <th style={th}>Status</th>

                  <th style={th}>Original</th>
                  <th style={th}>Discount Type</th>
                  <th style={th}>Disc %</th>
                  <th style={th}>Disc Amt</th>
                  <th style={th}>Total</th>

                  <th style={th}>Pay Method</th>
                  <th style={th}>Pay Amt</th>
                  <th style={th}>Pay Status</th>

                  <th style={th}>Movie</th>
                  <th style={th}>Theater</th>
                  <th style={th}>Location</th>
                  <th style={th}>Show Date</th>
                  <th style={th}>Show Time</th>

                  <th style={th}>Review ★</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={21} className="muted-1975">No tickets found.</td>
                  </tr>
                ) : rows.map((r, idx) => (
                  <tr key={r.ticket_id} style={{ background: idx % 2 ? '#f7f7f7' : '#fff' }}>
                    <td style={td}>{r.role ?? ''}</td>
                    <td style={td}>{r.user_email ?? ''}</td>
                    <td style={td}>{r.ticket_id}</td>
                    <td style={td}>{r.showtime_id}</td>
                    <td style={td}>{r.seat_no} (#{r.seat_id})</td>
                    <td style={td}>{formatDateTime(r.booking_date)}</td>
                    <td style={td}>{r.status}</td>

                    <td style={td}>₱{fmt(r.original_price)}</td>
                    <td style={td}>{r.discount_type}</td>
                    <td style={td}>{r.discount_percentage}%</td>
                    <td style={td}>₱{fmt(r.discount_amount)}</td>
                    <td style={td}><b>₱{fmt(r.discounted_price)}</b></td>

                    <td style={td}>{r.payment_method ?? ''}</td>
                    <td style={td}>{r.payment_amount != null ? `₱${fmt(r.payment_amount)}` : ''}</td>
                    <td style={td}>{r.payment_status ?? ''}</td>

                    <td style={td}>{r.movie_title}</td>
                    <td style={td}>{r.theater_name}</td>
                    <td style={td}>{r.location}</td>
                    <td style={td}>{r.show_date}</td>
                    <td style={td}>{r.show_time}</td>

                    <td style={td}>{r.review_rating ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

/* Styling helpers for table cells */
const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderRight: '1px solid #333',
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '10px 12px',
  borderTop: '1px solid #e5e5e5',
  borderRight: '1px solid #eee',
  verticalAlign: 'top',
  whiteSpace: 'nowrap',
};

/* Formatters */
function fmt(n: number) {
  return (n ?? 0).toFixed(2);
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}