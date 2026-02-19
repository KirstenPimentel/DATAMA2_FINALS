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

  original_price: number | string | null;
  discount_type: string;
  discount_percentage: number | string | null;
  discount_amount: number | string | null;
  discounted_price: number | string | null;

  payment_method: string | null;
  payment_amount: number | string | null;
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

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 12px',
    borderRight: '1px solid #333',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderTop: '1px solid #e5e5e5',
    borderRight: '1px solid #eee',
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
  };

  function peso(n: number | string | null | undefined) {
    const num = Number(n);
    if (Number.isFinite(num)) return `₱${num.toFixed(2)}`;
    return '';
  }

  function percentage(n: number | string | null | undefined) {
    const num = Number(n);
    if (Number.isFinite(num)) return `${num}%`;
    return '';
  }

  function formatDateTime(iso: string | null | undefined) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="card-1975" style={{ width: '100%', maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1>SHOW SUMMARY</h1>
          <Link href="/" className="btn-1975">← Back to Start</Link>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Link href="/book" className="btn-1975">Add Customer</Link>
        </div>

        {/* States */}
        {loading && <div className="muted-1975">Loading…</div>}
        {err && (
          <div style={{ border: '1px solid #b91c1c', padding: '0.75rem', color: '#b91c1c', marginBottom: '0.75rem' }}>
            {err}
          </div>
        )}

        {!loading && !err && (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ background: '#111', color: '#fff' }}>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>User Email</th>
                  <th style={thStyle}>Ticket ID</th>
                  <th style={thStyle}>Showtime ID</th>
                  <th style={thStyle}>Seat</th>
                  <th style={thStyle}>Booking Date</th>
                  <th style={thStyle}>Status</th>

                  <th style={thStyle}>Original</th>
                  <th style={thStyle}>Discount Type</th>
                  <th style={thStyle}>Disc %</th>
                  <th style={thStyle}>Disc Amt</th>
                  <th style={thStyle}>Total</th>

                  <th style={thStyle}>Pay Method</th>
                  <th style={thStyle}>Pay Amt</th>
                  <th style={thStyle}>Pay Status</th>

                  <th style={thStyle}>Movie</th>
                  <th style={thStyle}>Theater</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Show Date</th>
                  <th style={thStyle}>Show Time</th>

                  <th style={thStyle}>Review ★</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={21} className="muted-1975">No tickets found.</td>
                  </tr>
                ) : rows.map((r, idx) => (
                  <tr key={`${r.ticket_id}-${idx}`} style={{ background: idx % 2 ? '#f7f7f7' : '#fff' }}>
                    <td style={tdStyle}>{r.role ?? ''}</td>
                    <td style={tdStyle}>{r.user_email ?? ''}</td>
                    <td style={tdStyle}>{r.ticket_id}</td>
                    <td style={tdStyle}>{r.showtime_id}</td>
                    <td style={tdStyle}>{r.seat_no} (#{r.seat_id})</td>
                    <td style={tdStyle}>{formatDateTime(r.booking_date)}</td>
                    <td style={tdStyle}>{r.status}</td>

                    <td style={tdStyle}>{peso(r.original_price)}</td>
                    <td style={tdStyle}>{r.discount_type}</td>
                    <td style={tdStyle}>{percentage(r.discount_percentage)}</td>
                    <td style={tdStyle}>{peso(r.discount_amount)}</td>
                    <td style={tdStyle}><b>{peso(r.discounted_price)}</b></td>

                    <td style={tdStyle}>{r.payment_method ?? ''}</td>
                    <td style={tdStyle}>{r.payment_amount != null ? peso(r.payment_amount) : ''}</td>
                    <td style={tdStyle}>{r.payment_status ?? ''}</td>

                    <td style={tdStyle}>{r.movie_title}</td>
                    <td style={tdStyle}>{r.theater_name}</td>
                    <td style={tdStyle}>{r.location}</td>
                    <td style={tdStyle}>{r.show_date}</td>
                    <td style={tdStyle}>{r.show_time}</td>

                    <td style={tdStyle}>{r.review_rating ?? ''}</td>
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