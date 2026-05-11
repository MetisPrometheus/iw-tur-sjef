import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import type { Trip } from "@/lib/types";
import TripClient from "./TripClient";

export const dynamic = "force-dynamic";

export default async function TripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trips = await sql<Trip[]>`SELECT * FROM trip WHERE slug = ${slug}`;
  if (!trips.length) notFound();
  return <TripClient slug={slug} initialName={trips[0].name} />;
}
