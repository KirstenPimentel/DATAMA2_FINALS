import type { Metadata } from "next";
import "./globals.css";
import Background1975 from "@/components/Background1975";

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
          position: "relative", // ensure stacking context above bg
        }}
      >
        <Background1975 />
        {children}
      </body>
    </html>
  );
}