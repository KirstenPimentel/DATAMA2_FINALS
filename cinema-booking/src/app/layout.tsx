import type { Metadata } from "next";
import "./globals.css";
import Background1975 from "@/components/Background1975"; // adjust path if you don't use "@/"

export const metadata: Metadata = {
  title: "Cinema Booking",
  description: "Admin booking flow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "var(--bg)",
          color: "var(--fg)",
          minHeight: "100vh",
          margin: 0,
          position: "relative",   // stacking context
          overflowX: "hidden",    // avoid horizontal scroll from FX
        }}
      >
        {/* Background FX behind everything */}
        <Background1975 />

        {/* App content above FX */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}