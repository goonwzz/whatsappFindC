import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { campaigns } from "../../../db/schema";

export async function GET() {
  try {
    const rows = await getDb().select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(50);
    return Response.json({ campaigns: rows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to list campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = await request.json() as { country?: string; product?: string; exclusions?: string; targetCount?: number };
  if (!payload.country?.trim() || !payload.product?.trim()) {
    return Response.json({ error: "country and product are required" }, { status: 400 });
  }
  try {
    const [campaign] = await getDb().insert(campaigns).values({
      country: payload.country.trim(), product: payload.product.trim(), exclusions: payload.exclusions?.trim() ?? "", targetCount: payload.targetCount ?? 20,
    }).returning();
    return Response.json({ campaign }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create campaign" }, { status: 500 });
  }
}
