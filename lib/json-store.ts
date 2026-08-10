import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type Campaign = {
  id: string;
  country: string;
  hsCode: string;
  hsNameZh: string;
  productDescription: string;
  exclusions: string;
  targetCount: number;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  error?: string;
};

export type Lead = {
  id?: string;
  campaignId?: string;
  company: string;
  country: string;
  fit: number;
  contact: string;
  evidence: string;
  status: "待审核" | "可发送" | "已发送" | "已回复";
  website?: string;
  buyerType?: string;
  demandStatus?: "已确认进口" | "高可能采购" | "潜在买家";
  sourceUrls?: string[];
};

const dataDir = path.join(process.cwd(), "data");
const campaignsFile = path.join(dataDir, "campaigns.json");
const leadsFile = path.join(dataDir, "leads.json");
let writeQueue: Promise<unknown> = Promise.resolve();

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJsonFile<T>(filePath: string, value: T) {
  await mkdir(dataDir, { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

export function listCampaigns() {
  return readJsonFile<Campaign[]>(campaignsFile, []);
}

export function listLeads() {
  return readJsonFile<Lead[]>(leadsFile, []);
}

export function createCampaign(input: Omit<Campaign, "id" | "status" | "createdAt">) {
  const task = writeQueue.then(async () => {
    const campaigns = await listCampaigns();
    const campaign: Campaign = {
      ...input,
      id: crypto.randomUUID(),
      status: "queued",
      createdAt: new Date().toISOString(),
    };
    campaigns.unshift(campaign);
    await writeJsonFile(campaignsFile, campaigns);
    return campaign;
  });
  writeQueue = task.catch(() => undefined);
  return task;
}

export function updateCampaign(id: string, patch: Partial<Omit<Campaign, "id">>) {
  const task = writeQueue.then(async () => {
    const campaigns = await listCampaigns();
    const index = campaigns.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("获客任务不存在");
    campaigns[index] = { ...campaigns[index], ...patch };
    await writeJsonFile(campaignsFile, campaigns);
    return campaigns[index];
  });
  writeQueue = task.catch(() => undefined);
  return task;
}

export function saveCampaignLeads(campaignId: string, incoming: Lead[]) {
  const task = writeQueue.then(async () => {
    const existing = await listLeads();
    const retained = existing.filter((lead) => lead.campaignId !== campaignId);
    const leads = incoming.map((lead) => ({ ...lead, id: lead.id ?? crypto.randomUUID(), campaignId }));
    await writeJsonFile(leadsFile, [...leads, ...retained]);
    return leads;
  });
  writeQueue = task.catch(() => undefined);
  return task;
}
