import { createCampaign, listCampaigns } from "../../../lib/json-store";

export async function GET() {
  try {
    const campaigns = await listCampaigns();
    return Response.json({ campaigns: campaigns.slice(0, 50) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to list campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = await request.json() as { country?: string; hsCode?: string; hsNameZh?: string; productDescription?: string; product?: string; exclusions?: string; targetCount?: number };
  const hsCode = payload.hsCode?.replace(/[.\s-]/g, "") ?? "";
  if (!payload.country?.trim() || !/^\d{6,10}$/.test(hsCode) || !payload.hsNameZh?.trim()) {
    return Response.json({ error: "目标国家、有效HS编码和中文品名为必填项" }, { status: 400 });
  }
  try {
    const targetCount = Math.min(50, Math.max(1, Number(payload.targetCount) || 10));
    console.info(`[campaign] create country=${payload.country.trim()} hs=${hsCode} target=${targetCount}`);
    const campaign = await createCampaign({
      country: payload.country.trim(),
      hsCode,
      hsNameZh: payload.hsNameZh.trim(),
      productDescription: (payload.productDescription ?? payload.product ?? "").trim(),
      exclusions: payload.exclusions?.trim() ?? "",
      targetCount,
    });
    return Response.json({ campaign }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create campaign" }, { status: 500 });
  }
}
