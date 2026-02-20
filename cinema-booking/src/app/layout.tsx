// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Space_Grotesk } from "next/font/google";

export const metadata: Metadata = {
  title: "Cinema Booking",
  description: "Admin booking flow",
};

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body
        style={{
          background: "var(--bg)",
          color: "var(--fg)",
          minHeight: "100vh",
          margin: 0,
          fontFamily:
            "var(--font-sans), system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}