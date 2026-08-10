import { acquireBuyers } from "../../../../../lib/buyer-acquisition";
import { listCampaigns, saveCampaignLeads, updateCampaign } from "../../../../../lib/json-store";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const campaign = (await listCampaigns()).find((item) => item.id === id);
  if (!campaign) return Response.json({ error: "获客任务不存在" }, { status: 404 });
  console.info(`[campaign] run id=${id} country=${campaign.country} hs=${campaign.hsCode} target=${campaign.targetCount}`);
  await updateCampaign(id, { status: "running", error: undefined });
  try {
    const result = await acquireBuyers(campaign);
    const leads = await saveCampaignLeads(id, result.leads);
    console.info(`[campaign] complete id=${id} leads=${leads.length}`);
    const updated = await updateCampaign(id, { status: "completed", completedAt: new Date().toISOString() });
    return Response.json({ campaign: updated, leads, source: "live-web" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "真实获客任务执行失败";
    console.error(`[campaign] failed id=${id} error=${message}`);
    await updateCampaign(id, { status: "failed", error: message });
    return Response.json({ error: message }, { status: 502 });
  }
}
