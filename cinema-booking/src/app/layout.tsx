import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cinema Booking",
  description: "Admin booking flow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "var(--bg)",
          color: "var(--fg)",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}