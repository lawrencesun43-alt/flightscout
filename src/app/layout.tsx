import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlightScout",
  description: "Personal flight-deal tool: layover + student + flexible-date view",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
