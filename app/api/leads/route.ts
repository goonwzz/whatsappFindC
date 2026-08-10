import { listLeads } from "../../../lib/json-store";

export async function GET() {
  try {
    return Response.json({ leads: await listLeads() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "无法读取买家线索" }, { status: 500 });
  }
}
