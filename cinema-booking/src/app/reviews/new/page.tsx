'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Movie = { movie_id: number; title: string };

export default function NewReviewPage() {
  const [email, setEmail] = useState<string>('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [movieId, setMovieId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const validRating = (n: number) => Number.isFinite(n) && n >= 1 && n <= 5;

  // Load movies that this email has tickets for
  useEffect(() => {
    (async () => {
      setErrorMsg(null);
      setSuccess(null);
      setMovies([]);
      setMovieId(null);
      if (!isValidEmail(email)) return;

      // find this email's showtimes via tickets
      const { data: tix, error: tErr } = await supabase
        .from('tickets')
        .select('showtime_id')
        .eq('customer_email', email.trim());

      if (tErr) { setErrorMsg(tErr.message); return; }
      const showtimeIds = Array.from(new Set((tix ?? []).map((r: any) => r.showtime_id))).filter(Boolean);
      if (showtimeIds.length === 0) { setMovies([]); return; }

      const { data: stRows, error: sErr } = await supabase
        .from('showtimes')
        .select('movie_id')
        .in('showtime_id', showtimeIds);

      if (sErr) { setErrorMsg(sErr.message); return; }
      const movieIds = Array.from(new Set((stRows ?? []).map((r: any) => r.movie_id))).filter(Boolean);
      if (movieIds.length === 0) { setMovies([]); return; }

      const { data: mvRows, error: mErr } = await supabase
        .from('movies')
        .select('movie_id,title')
        .in('movie_id', movieIds)
        .order('title', { ascending: true });

      if (mErr) { setErrorMsg(mErr.message); return; }
      setMovies((mvRows as Movie[]) ?? []);
    })();
  }, [email]);

  async function saveReview() {
    setErrorMsg(null);
    setSuccess(null);

    if (!isValidEmail(email)) { setErrorMsg('Enter a valid email.'); return; }
    if (!movieId) { setErrorMsg('Please select a movie.'); return; }
    if (!validRating(rating)) { setErrorMsg('Rating must be between 1 and 5.'); return; }

    // Client-side duplicate check
    const { data: existing, error: existErr } = await supabase
      .from('reviews')
      .select('review_id')
      .eq('email', email.trim())
      .eq('movie_id', movieId)
      .limit(1);

    if (existErr) { setErrorMsg(existErr.message); return; }
    if ((existing ?? []).length > 0) {
      setErrorMsg('This email already reviewed this movie.');
      return;
    }

    setSaving(true);

    // Insert review (DB will also enforce unique (email, movie_id))
    const { error } = await supabase.from('reviews').insert({
      email: email.trim(),
      user_id: null,
      movie_id: movieId,
      rating,
      review_text: reviewText || `Review by ${email.trim()}`
    });

    setSaving(false);

    if (error) {
      // Surface a friendly message if unique index fires
      if (error.message?.toLowerCase().includes('duplicate') || error.code === '23505') {
        setErrorMsg('This email already reviewed this movie.');
      } else {
        setErrorMsg(error.message);
      }
      return;
    }

    setSuccess('Review saved.');
    setRating(5);
    setReviewText('');
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="card-1975" style={{ width: '100%', maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1>ADD REVIEW</h1>
          /← Back to Start</Link>
        </div>

        {errorMsg && (
          <div style={{ border: '1px solid #b91c1c', padding: '0.75rem', color: '#b91c1c', marginBottom: '0.75rem' }}>
            {errorMsg}
          </div>
        )}
        {success && (
          <div style={{ border: '1px solid #166534', padding: '0.75rem', color: '#166534', marginBottom: '0.75rem' }}>
            {success}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="muted-1975">Customer Email</label>
            <input
              className="input-1975"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. juan@example.com"
            />
            {email.length > 0 && !isValidEmail(email) && (
              <div className="muted-1975" style={{ marginTop: 6 }}>Enter a valid email.</div>
            )}
          </div>

          <div>
            <label className="muted-1975">Movie</label>
            <select
              className="select-1975"
              value={movieId ?? ''}
              onChange={(e) => setMovieId(e.target.value ? Number(e.target.value) : null)}
              disabled={!isValidEmail(email) || movies.length === 0}
            >
              <option value="">Select movie</option>
              {movies.map((m) => (
                <option key={m.movie_id} value={m.movie_id}>{m.title}</option>
              ))}
            </select>
            {isValidEmail(email) && movies.length === 0 && (
              <div className="muted-1975" style={{ marginTop: 6 }}>
                This email has no tickets yet. Please book first.
              </div>
            )}
          </div>

          <div>
            <label className="muted-1975">Rating (1–5)</label>
            <input
              className="input-1975"
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="muted-1975">Review (optional)</label>
            <textarea
              className="input-1975"
              rows={4}
              placeholder="Write a short review (optional)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            /Cancel</Link>
            <button className="btn-1975" onClick={saveReview} disabled={saving || !movieId || !isValidEmail(email)}>
              {saving ? 'Saving…' : 'Save Review'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}