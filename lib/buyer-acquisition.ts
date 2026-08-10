import type { Campaign, Lead } from "./json-store";

type AcquisitionResult = { leads: Lead[] };

const leadSchema = {
  type: "object",
  additionalProperties: false,
  required: ["leads"],
  properties: {
    leads: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["company", "country", "fit", "contact", "evidence", "website", "buyerType", "demandStatus", "sourceUrls"],
        properties: {
          company: { type: "string" }, country: { type: "string" }, fit: { type: "integer", minimum: 0, maximum: 100 },
          contact: { type: "string" }, evidence: { type: "string" }, website: { type: "string" }, buyerType: { type: "string" },
          demandStatus: { type: "string", enum: ["已确认进口", "高可能采购", "潜在买家"] },
          sourceUrls: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

export function acquisitionConfig() {
  const baseUrl = getOpenAIBaseUrl();
  return {
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    source: "实时公开网页搜索",
    endpoint: new URL(baseUrl).hostname,
    customsProviderConfigured: Boolean(process.env.CUSTOMS_API_KEY),
  };
}

function getOpenAIBaseUrl() {
  const configured = process.env.OPENAI_BASE_URL
    || process.env.OPENAI_API_URL
    || process.env.OPenAI_API_URL;
  return (configured || "https://api.openai.com/v1").replace(/\/+$/, "");
}

export async function acquireBuyers(campaign: Campaign): Promise<AcquisitionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("未配置 OPENAI_API_KEY，无法执行真实联网获客");

  const prompt = `你是海外B2B买家研究员。实时搜索公开网页，为以下任务寻找最多 ${campaign.targetCount} 家真实企业：\n目标国家：${campaign.country}\nHS编码：${campaign.hsCode}\n中文品名：${campaign.hsNameZh}\n产品补充：${campaign.productDescription || "无"}\n排除：${campaign.exclusions || "无"}\n
要求：1. 只返回有可访问来源URL的公司；2. 优先进口商、品牌商、分销商和终端采购方，排除自有同类工厂、出口供应商和明显无关企业；3. contact只填来源页公开的企业邮箱、电话或联系页URL，找不到就填空字符串；4. 不得猜测邮箱；5. 只有来源明确显示该企业进口该HS编码或对应商品时才写“已确认进口”，业务匹配但无进口记录写“高可能采购”或“潜在买家”；6. evidence用中文简洁说明证据及其局限；7. sourceUrls必须是支撑该公司的具体页面。宁缺毋滥。8. 最终只输出符合 schema 的 JSON 对象，不要在 JSON 前后添加解释、Markdown 或总结。`;

  const response = await fetch(`${getOpenAIBaseUrl()}/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      tools: [{ type: "web_search" }],
      input: [{ role: "user", content: prompt }],
      text: { format: { type: "json_schema", name: "buyer_leads", strict: true, schema: leadSchema } },
      store: false,
    }),
    signal: AbortSignal.timeout(300_000),
  });
  const body = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || `联网搜索失败（HTTP ${response.status}）`);
  const outputText = body.output_text || body.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  if (!outputText) throw new Error("联网搜索未返回结构化结果");
  let result: AcquisitionResult;
  try {
    result = parseAcquisitionResult(outputText);
    if (!Array.isArray(result.leads)) throw new Error("missing leads");
  } catch {
    result = await normalizeAcquisitionResult(outputText, apiKey);
  }
  return {
    leads: result.leads.slice(0, campaign.targetCount).map((lead) => ({
      ...lead,
      country: lead.country || campaign.country,
      status: lead.contact ? "可发送" : "待审核",
      sourceUrls: (lead.sourceUrls ?? []).filter((url) => /^https?:\/\//i.test(url)),
    })),
  };
}

async function normalizeAcquisitionResult(sourceText: string, apiKey: string): Promise<AcquisitionResult> {
  const response = await fetch(`${getOpenAIBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "将用户提供的买家搜索结果转换为JSON。顶层必须是leads数组；每项只包含company,country,fit,contact,evidence,website,buyerType,demandStatus,sourceUrls。不得编造公司、联系方式或URL；没有合格数据时返回{\"leads\":[]}。只输出JSON。",
        },
        { role: "user", content: sourceText },
      ],
      response_format: { type: "json_object" },
      stream: false,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || `线索JSON归一化失败（HTTP ${response.status}）`);
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("线索JSON归一化未返回内容");
  const result = parseAcquisitionResult(content);
  if (!Array.isArray(result.leads)) throw new Error("线索JSON归一化结果缺少leads数组");
  return result;
}

function parseAcquisitionResult(outputText: string): AcquisitionResult {
  const trimmed = outputText.trim();
  try {
    return JSON.parse(trimmed) as AcquisitionResult;
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
    if (fenced) {
      try {
        return JSON.parse(fenced) as AcquisitionResult;
      } catch {
        // Continue with balanced-object extraction for OpenAI-compatible providers
        // that prepend a short natural-language status message.
      }
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as AcquisitionResult;
    }
    throw new Error("联网搜索已完成，但模型未返回可解析的JSON线索");
  }
}
