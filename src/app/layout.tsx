import type { Metadata } from "next";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

export const metadata: Metadata = {
  title: "tur-sjef · plan a road trip together",
  description:
    "Collaborative road-trip planning. Share a link, drop in stops, suggest places, vote on what makes the itinerary.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
