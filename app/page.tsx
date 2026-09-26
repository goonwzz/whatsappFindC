"use client";

import { useEffect, useMemo, useState } from "react";

type Direction = "large_chain" | "small_store" | "import_distributor" | "online_store" | "custom_target";
type SourcingEvidence = { signal: string; score: number; url: string };
type Buyer = { company: string; customer_type: Direction; website: string; product_fit_score: number; demand_status: string; contact_person: string; contact_title: string; person_email: string; company_email: string; phone: string; whatsapp: string; whatsapp_greeting_en?: string; whatsapp_greeting_basis?: string; linkedin_url?: string; contact_confidence?: string; contact_evidence?: string; contact_verified_at?: string; contact_person_score?: number; contact_channel_score?: number; recommended_contact_path?: string; product_fit_evidence: string; demand_evidence: string; discovery_channels?: string[]; china_sourcing_score?: number; china_sourcing_status?: string; china_sourcing_evidence?: SourcingEvidence[]; source_urls: string[] };
type BuyerResult = { generated_at: string; task: { country: string; city?: string; hs_code?: string; product_description: string; product_description_en?: string; target_customer_prompt?: string; search_policy?: { candidate_pool_multiplier?: number } }; summary: { candidates_reviewed?: number; requested: number; qualified: number; overflow_count?: number; with_named_contact: number; with_public_email: number; china_sourcing_strong?: number; china_sourcing_moderate?: number; discovery_channels_used?: string[]; coverage_note: string }; categories: Partial<Record<Direction, Buyer[]>>; overflow_candidates?: Partial<Record<Direction, Buyer[]>> };
type Channel = "email" | "whatsapp";
type OutreachStatus = "draft" | "approved" | "sent" | "replied";
type DraftVersion = { subject: string; body: string };
type OutreachDraft = { channel: Channel; local_language: string; local: DraftVersion; english: DraftVersion; status: OutreachStatus; updated_at: string };
type AutoMailSettings = { enabled: boolean; dailyLimit: number; gapMinutes: number; followUpDays: number; requireApproval: boolean; stopOnReply: boolean; includeUnsubscribe: boolean };
type BuyerHistoryRecord = { country: string; city?: string; hs_code: string; product_key?: string; company: string; domain: string; email: string; whatsapp?: string; first_found_at: string; last_verified_at: string };
type BuyerDatabase = { version: number; records: BuyerHistoryRecord[] };
const directions: Array<{ key: Direction; label: string; note: string; roles: string[] }> = [
  { key: "large_chain", label: "大型连锁卖场", note: "多门店零售集团与大型商超", roles: ["Buyer", "Category Manager", "Product Manager"] },
  { key: "small_store", label: "1–2家店面小卖场", note: "本地小型零售店与独立商铺", roles: ["Owner", "Founder", "General Manager"] },
  { key: "import_distributor", label: "进口经销商", note: "进口商、批发商与区域分销商", roles: ["Buyer", "Import Manager", "Procurement Manager"] },
  { key: "online_store", label: "海外网店", note: "独立站、品牌网店与平台卖家", roles: ["Owner", "E-commerce Manager", "Product Manager"] },
  { key: "custom_target", label: "指定目标渠道", note: "按提示词寻找设计师、装修公司、工程商等", roles: ["Owner", "Founder", "Director", "Project Manager"] },
];

export default function Home() {
  const [supplierCompany, setSupplierCompany] = useState("allwall");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [hsCode, setHsCode] = useState("6303920090");
  const [product, setProduct] = useState("合成纤维制窗帘、帷幔、室内百叶帘及床帷等家纺产品，可按尺寸、颜色、面料和包装要求定制");
  const [productEnglish, setProductEnglish] = useState("custom-made products with flexible specifications, colours and retail packaging");
  const [targetCustomerPrompt, setTargetCustomerPrompt] = useState("优先寻找整装设计师、室内设计工作室和装修公司，尤其是承接住宅、酒店或商业空间整体项目的单位");
  const [exclude, setExclude] = useState("同类生产工厂、出口供应商");
  const [existing, setExisting] = useState("");
  const [counts, setCounts] = useState<Record<Direction, number>>({ large_chain: 5, small_store: 5, import_distributor: 5, online_store: 5, custom_target: 5 });
  const [candidatePoolMultiplier, setCandidatePoolMultiplier] = useState(4);
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<BuyerResult | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [channel, setChannel] = useState<Channel>("email");
  const [languageVersion, setLanguageVersion] = useState<"local" | "english">("local");
  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const [outreachStatus, setOutreachStatus] = useState<OutreachStatus>("draft");
  const [senderName, setSenderName] = useState("Brien");
  const [senderEmail, setSenderEmail] = useState("goonwzz@gmail.com");
  const [senderWhatsapp, setSenderWhatsapp] = useState("+86 15558008200");
  const [showAutomation, setShowAutomation] = useState(false);
  const [autoMail, setAutoMail] = useState<AutoMailSettings>({ enabled: false, dailyLimit: 20, gapMinutes: 12, followUpDays: 5, requireApproval: true, stopOnReply: true, includeUnsubscribe: true });
  const total = useMemo(() => Object.values(counts).reduce((sum, count) => sum + count, 0), [counts]);
  const existingCount = useMemo(() => existing ? existing.split("\n").filter(Boolean).length : 0, [existing]);

  function normalizeHs(value: string) { return value.replace(/[.\s-]/g, ""); }
  function normalizeCountry(value: string) { return value.trim().toLocaleLowerCase(); }
  function productKey(value: string) { return value.trim().toLocaleLowerCase().replace(/\s+/g, " ").slice(0, 120); }
  function domainOf(website: string) { try { return new URL(website).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } }
  function readBuyerDatabase(): BuyerDatabase {
    try { const parsed = JSON.parse(localStorage.getItem("beibeijia-buyer-database") || ""); return parsed?.records ? parsed : { version: 1, records: [] }; }
    catch { return { version: 1, records: [] }; }
  }
  function exclusionsFor(targetCountry: string, _targetCity: string, targetHs: string, targetProduct: string, database = readBuyerDatabase()) {
    const countryKey = normalizeCountry(targetCountry); const hsKey = normalizeHs(targetHs); const fallbackProductKey = productKey(targetProduct);
    return database.records.filter(record => normalizeCountry(record.country) === countryKey && (hsKey ? normalizeHs(record.hs_code) === hsKey : !normalizeHs(record.hs_code) && record.product_key === fallbackProductKey)).flatMap(record => [record.domain, record.company, record.email, record.whatsapp || ""]).filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).sort().join("\n");
  }
  function mergeResultIntoBuyerDatabase(data: BuyerResult) {
    const database = readBuyerDatabase(); const now = new Date().toISOString();
    const buyers = Object.values(data.categories).flat();
    for (const buyer of buyers) {
      const domain = domainOf(buyer.website); const email = buyer.person_email || buyer.company_email || ""; const whatsapp = buyer.whatsapp || "";
      const found = database.records.find(record => normalizeCountry(record.country) === normalizeCountry(data.task.country) && (data.task.hs_code ? normalizeHs(record.hs_code) === normalizeHs(data.task.hs_code) : !normalizeHs(record.hs_code) && record.product_key === productKey(data.task.product_description)) && ((domain && record.domain === domain) || record.company.trim().toLowerCase() === buyer.company.trim().toLowerCase() || (email && record.email === email) || (whatsapp && record.whatsapp === whatsapp)));
      if (found) { found.company = buyer.company; found.domain = domain || found.domain; found.email = email || found.email; found.whatsapp = whatsapp || found.whatsapp; found.last_verified_at = now; }
      else database.records.push({ country: data.task.country, city: data.task.city || "", hs_code: data.task.hs_code || "", product_key: productKey(data.task.product_description), company: buyer.company, domain, email, whatsapp, first_found_at: data.generated_at || now, last_verified_at: now });
    }
    localStorage.setItem("beibeijia-buyer-database", JSON.stringify(database));
    const exclusions = exclusionsFor(data.task.country, data.task.city || "", data.task.hs_code || "", data.task.product_description, database); setExisting(exclusions); return exclusions;
  }

  useEffect(() => {
    const saved = localStorage.getItem("beibeijia-sender-profile");
    if (saved) {
      try { const profile = JSON.parse(saved); setSenderName(profile.name || "Brien"); setSenderEmail(profile.email || ""); setSenderWhatsapp(profile.whatsapp || ""); } catch { /* ignore invalid local data */ }
    }
    const savedAutomation = localStorage.getItem("beibeijia-auto-mail-settings");
    if (savedAutomation) { try { setAutoMail(current => ({ ...current, ...JSON.parse(savedAutomation) })); } catch { /* ignore invalid local data */ } }
  }, []);

  function saveAutomation() {
    localStorage.setItem("beibeijia-auto-mail-settings", JSON.stringify(autoMail));
    setMessage(autoMail.enabled ? "自动邮件规则已保存；接入发信服务前仅建立审核队列，不会实际发送。" : "自动邮件已保持关闭。可继续使用人工审核和邮件客户端发送。");
    setShowAutomation(false);
  }

  useEffect(() => {
    let active = true;
    fetch(`/data/latest-buyers.json?t=${Date.now()}`, { cache: "no-store" })
      .then(response => { if (!response.ok) throw new Error("no result"); return response.json() as Promise<BuyerResult>; })
      .then(data => {
        if (!active || !data.generated_at || !data.summary || !data.categories) return;
        setResult(data);
        mergeResultIntoBuyerDatabase(data);
        setCountry(data.task?.country || "");
        setCity(data.task?.city || "");
        setHsCode(data.task?.hs_code || "6303920090");
        setProduct(data.task?.product_description || product);
        setProductEnglish(data.task?.product_description_en || "custom-made products with flexible specifications, colours and retail packaging");
        setTargetCustomerPrompt(data.task?.target_customer_prompt || targetCustomerPrompt);
        setMessage(`已自动载入最新回传：${data.summary.qualified || 0} 家客户。`);
      })
      .catch(() => { /* 首次没有回传文件时保持空白 */ });
    return () => { active = false; };
  // product is only the fallback for malformed legacy data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!country.trim() || !city.trim() || (!normalizeHs(hsCode) && !product.trim())) { setExisting(""); return; }
    setExisting(exclusionsFor(country, city, hsCode, product));
  }, [country, city, hsCode, product]);

  function buyerKey(buyer: Buyer) { try { return new URL(buyer.website).hostname.replace(/^www\./, ""); } catch { return buyer.company.toLowerCase(); } }
  function draftKey(buyer: Buyer, nextChannel: Channel) { return `beibeijia-outreach:${buyerKey(buyer)}:${nextChannel}`; }
  function saveSenderProfile() {
    localStorage.setItem("beibeijia-sender-profile", JSON.stringify({ name: senderName, email: senderEmail, whatsapp: senderWhatsapp }));
    setMessage("发件人资料已保存在本机浏览器。邮箱和WhatsApp API接入后可直接复用。");
  }
  function languageFor(targetCountry: string) {
    const value = targetCountry.toLowerCase();
    if (/英国|美国|加拿大|澳大利亚|新西兰|爱尔兰|新加坡|united kingdom|\buk\b|united states|\busa\b|canada|australia|new zealand|ireland|singapore/.test(value)) return { name: "英语", code: "en" };
    if (/瑞典|sweden/.test(value)) return { name: "瑞典语", code: "sv" };
    if (/瑞士|switzerland|德国|germany|奥地利|austria/.test(value)) return { name: "德语", code: "de" };
    if (/日本|japan/.test(value)) return { name: "日语", code: "ja" };
    if (/韩国|south korea|korea/.test(value)) return { name: "韩语", code: "ko" };
    if (/法国|france|比利时|belgium/.test(value)) return { name: "法语", code: "fr" };
    if (/哈萨克|kazakhstan|俄罗斯|russia/.test(value)) return { name: "俄语", code: "ru" };
    if (/西班牙|spain|墨西哥|mexico/.test(value)) return { name: "西班牙语", code: "es" };
    if (/意大利|italy/.test(value)) return { name: "意大利语", code: "it" };
    return { name: "当地语言", code: "en" };
  }
  function englishHook(buyer: Buyer) {
    const hooks: Record<Direction, string> = {
      large_chain: `I noticed that ${buyer.company} carries this product category across its retail channel.`,
      small_store: `I noticed that ${buyer.company} serves customers in this category and may benefit from flexible quantities.`,
      import_distributor: `I noticed that ${buyer.company} distributes products in this category and works with external suppliers.`,
      online_store: `I noticed that ${buyer.company} sells this category online, where flexible variants and retail-ready packaging can be useful.`,
      custom_target: `I noticed that ${buyer.company} works on projects where this product category may be relevant.`
    }; return hooks[buyer.customer_type];
  }
  function localCopy(buyer: Buyer, nextChannel: Channel, code: string): DraftVersion {
    const who = buyer.contact_person || buyer.company;
    const signature = `${senderName}\n${supplierCompany}\n${senderEmail}\nWhatsApp: ${senderWhatsapp}`;
    const copies: Record<string, { subject: string; email: string; whatsapp: string }> = {
      de: { subject: `Individuelle Vorhangkollektion für ${buyer.company}`, email: `Guten Tag ${who},\n\nwir haben gesehen, dass ${buyer.company} Vorhänge und Heimtextilien für seine Kunden anbietet. Mein Name ist ${senderName} von ${supplierCompany} in Hangzhou, China.\n\nWir liefern individuell gefertigte Vorhänge und Heimtextilien aus synthetischen Fasern. Maße, Farben, Stoffe, Etiketten und Verkaufsverpackungen können wir an Ihre Kollektion anpassen. Gern erstellen wir passende Muster und ein Angebot für Ihr Sortiment.\n\nSind Sie die richtige Ansprechperson für Einkauf oder Produktmanagement? Andernfalls freuen wir uns über eine Weiterleitung.\n\nFreundliche Grüße\n${signature}`, whatsapp: `Guten Tag ${who}, hier ist ${senderName} von ${supplierCompany} in Hangzhou. Wir liefern individuell gefertigte Vorhänge und Heimtextilien. Da ${buyer.company} in diesem Bereich tätig ist: Darf ich Ihnen unseren Katalog und passende Musteroptionen senden?` },
      ja: { subject: `${buyer.company}様向けカスタムカーテンのご提案`, email: `${who}様\n\n突然のご連絡失礼いたします。中国・杭州の${supplierCompany}、${senderName}と申します。${buyer.company}様がカーテン・ホームテキスタイルを取り扱っていることを拝見し、ご連絡いたしました。\n\n弊社は合成繊維カーテンおよびホームテキスタイルを供給しており、サイズ、色、生地、ラベル、店頭用パッケージを御社仕様に合わせてカスタマイズできます。商品構成に合わせたサンプルとお見積りをご用意いたします。\n\nカーテン・ホームテキスタイルの仕入れ、または商品企画のご担当者様へお取り次ぎいただけますでしょうか。\n\nよろしくお願いいたします。\n${signature}`, whatsapp: `${who}様、初めまして。中国・杭州の${supplierCompany}、${senderName}です。カスタム対応の合成繊維カーテンとホームテキスタイルを供給しています。${buyer.company}様向けにカタログとサンプル案をお送りしてもよろしいでしょうか。` },
      ko: { subject: `${buyer.company} 맞춤형 커튼 공급 제안`, email: `${who} 담당자님께,\n\n안녕하세요. 중국 항저우 ${supplierCompany}의 ${senderName}입니다. ${buyer.company}에서 커튼과 홈텍스타일 제품을 취급하고 있는 점을 확인하고 연락드립니다.\n\n저희는 합성섬유 커튼과 홈텍스타일을 공급하며 사이즈, 색상, 원단, 라벨 및 소매 포장을 귀사의 요구에 맞게 제작할 수 있습니다. 제품 구성에 맞는 샘플과 견적을 준비해 드리겠습니다.\n\n커튼 또는 홈텍스타일 바이어/상품기획 담당자에게 전달해 주실 수 있을까요?\n\n감사합니다.\n${signature}`, whatsapp: `안녕하세요 ${who}님, 중국 항저우 ${supplierCompany}의 ${senderName}입니다. 맞춤형 합성섬유 커튼과 홈텍스타일을 공급합니다. ${buyer.company}에 맞는 카탈로그와 샘플 제안을 보내드려도 될까요?` },
      fr: { subject: `Collection de rideaux sur mesure pour ${buyer.company}`, email: `Bonjour ${who},\n\nJe suis ${senderName} de ${supplierCompany}, à Hangzhou en Chine. Nous avons remarqué que ${buyer.company} propose des rideaux et des textiles d’intérieur.\n\nNous fournissons des rideaux en fibres synthétiques personnalisables. Dimensions, couleurs, tissus, étiquettes et emballages de vente peuvent être adaptés à votre assortiment. Nous pouvons préparer des échantillons ciblés et un devis.\n\nPourriez-vous transmettre ce message à la personne responsable des achats ou des produits textiles ?\n\nCordialement,\n${signature}`, whatsapp: `Bonjour ${who}, je suis ${senderName} de ${supplierCompany} à Hangzhou. Nous fournissons des rideaux et textiles personnalisables. Puis-je vous envoyer un catalogue et une sélection adaptée à ${buyer.company} ?` },
      ru: { subject: `Индивидуальная коллекция штор для ${buyer.company}`, email: `Здравствуйте, ${who}!\n\nМеня зовут ${senderName}, компания ${supplierCompany}, Ханчжоу, Китай. Мы обратили внимание, что ${buyer.company} работает со шторами и интерьерным текстилем.\n\nМы поставляем шторы из синтетических волокон с индивидуальными размерами, цветами, тканями, этикетками и розничной упаковкой. Готовы подготовить образцы и предложение специально под ваш ассортимент.\n\nПодскажите, пожалуйста, кто отвечает за закупки или управление этой категорией?\n\nС уважением,\n${signature}`, whatsapp: `Здравствуйте, ${who}! Я ${senderName} из ${supplierCompany}, Ханчжоу. Мы поставляем шторы и домашний текстиль под заказ. Можно отправить вам каталог и варианты образцов для ${buyer.company}?` },
      es: { subject: `Colección de cortinas a medida para ${buyer.company}`, email: `Hola ${who},\n\nSoy ${senderName} de ${supplierCompany}, Hangzhou, China. Hemos visto que ${buyer.company} trabaja con cortinas y textiles para el hogar.\n\nSuministramos cortinas de fibra sintética personalizables en medidas, colores, tejidos, etiquetas y embalaje comercial. Podemos preparar muestras y una cotización adaptadas a su surtido.\n\n¿Podría indicarnos o reenviar este mensaje a la persona responsable de compras o producto?\n\nSaludos cordiales,\n${signature}`, whatsapp: `Hola ${who}, soy ${senderName} de ${supplierCompany} en Hangzhou. Fabricamos cortinas y textiles personalizables. ¿Puedo enviarle un catálogo y opciones de muestras para ${buyer.company}?` },
      it: { subject: `Collezione di tende personalizzate per ${buyer.company}`, email: `Buongiorno ${who},\n\nsono ${senderName} di ${supplierCompany}, Hangzhou, Cina. Abbiamo visto che ${buyer.company} tratta tende e tessili per interni.\n\nForniamo tende in fibra sintetica personalizzabili per misure, colori, tessuti, etichette e confezioni retail. Possiamo preparare campioni e un preventivo mirati per il vostro assortimento.\n\nPotreste inoltrare il messaggio al responsabile acquisti o prodotto?\n\nCordiali saluti,\n${signature}`, whatsapp: `Buongiorno ${who}, sono ${senderName} di ${supplierCompany}, Hangzhou. Forniamo tende e tessili personalizzabili. Posso inviarvi catalogo e proposte campione per ${buyer.company}?` },
      sv: { subject: `Ett anpassat gardinsortiment för ${buyer.company}`, email: `Hej ${who},\n\nJag heter ${senderName} och representerar ${supplierCompany} i Hangzhou, Kina. Vi såg att ${buyer.company} erbjuder gardiner och hemtextilier.\n\nVi levererar gardiner och hemtextilier i syntetfiber som kan anpassas efter mått, färg, tyg, etiketter och butiksförpackning. Vi tar gärna fram ett riktat urval av prover och en offert utifrån ert nuvarande sortiment.\n\nÄr du rätt kontaktperson för inköp eller produktansvar? Om inte, får du gärna vidarebefordra meddelandet till ansvarig kollega.\n\nVänliga hälsningar\n${signature}`, whatsapp: `Hej ${who}, jag heter ${senderName} från ${supplierCompany} i Hangzhou. Vi levererar kundanpassade gardiner och hemtextilier. Får jag skicka ett kort produkturval och provförslag anpassat för ${buyer.company}?` }
    };
    const selected = copies[code];
    if (!selected) return { subject: `Custom home textile supply for ${buyer.company}`, body: "" };
    return { subject: nextChannel === "email" ? selected.subject : "", body: nextChannel === "email" ? selected.email : selected.whatsapp };
  }
  function buildDraft(buyer: Buyer, nextChannel: Channel): OutreachDraft {
    const lang = languageFor(result?.task.country || country);
    const receiver = buyer.contact_person || `${buyer.company} team`;
    const offer = result?.task.product_description_en || productEnglish.trim() || "custom-made products";
    const greeting = buyer.whatsapp_greeting_en || `Hello ${receiver}, this is ${senderName} from ${supplierCompany} in Hangzhou, China. ${englishHook(buyer)} We supply ${offer}. Would this be relevant to your current sourcing? If so, may I send a short catalogue and pricing options selected for ${buyer.company}?`;
    const english = nextChannel === "email" ? { subject: `A tailored product proposal for ${buyer.company}`, body: `Dear ${receiver},\n\nMy name is ${senderName} from ${supplierCompany} in Hangzhou, China. ${englishHook(buyer)}\n\nWe supply ${offer}. We can prepare a focused selection and quotation around your current assortment instead of sending a generic catalogue.\n\nAre you the right person for purchasing or product management? If not, could you kindly forward this message to the relevant colleague?\n\nBest regards,\n${senderName}\n${supplierCompany}\nEmail: ${senderEmail}\nWhatsApp: ${senderWhatsapp}` } : { subject: "", body: greeting };
    if (nextChannel === "whatsapp") return { channel: nextChannel, local_language: "英语", local: english, english, status: "draft", updated_at: new Date().toISOString() };
    const local = localCopy(buyer, nextChannel, lang.code);
    return { channel: nextChannel, local_language: lang.code === "en" ? "英语" : lang.name, local: lang.code === "en" ? english : local, english, status: "draft", updated_at: new Date().toISOString() };
  }
  function openOutreach(buyer: Buyer, nextChannel: Channel) {
    setSelectedBuyer(buyer); setChannel(nextChannel);
    const saved = localStorage.getItem(draftKey(buyer, nextChannel));
    if (saved) {
      try { const savedDraft = JSON.parse(saved) as OutreachDraft; if (savedDraft.local && savedDraft.english) { setDraft(savedDraft); setOutreachStatus(savedDraft.status); setLanguageVersion(savedDraft.local_language === "英语" ? "english" : "local"); return; } } catch { /* regenerate */ }
    }
    const nextDraft = buildDraft(buyer, nextChannel); setDraft(nextDraft); setOutreachStatus("draft"); setLanguageVersion(nextDraft.local_language === "英语" ? "english" : "local");
  }
  function changeChannel(nextChannel: Channel) {
    if (!selectedBuyer) return; setChannel(nextChannel);
    const saved = localStorage.getItem(draftKey(selectedBuyer, nextChannel));
    if (saved) { try { const savedDraft = JSON.parse(saved) as OutreachDraft; if (savedDraft.local && savedDraft.english) { setDraft(savedDraft); setOutreachStatus(savedDraft.status); setLanguageVersion(savedDraft.local_language === "英语" ? "english" : "local"); return; } } catch { /* regenerate */ } }
    const nextDraft = buildDraft(selectedBuyer, nextChannel); setDraft(nextDraft); setOutreachStatus("draft"); setLanguageVersion(nextDraft.local_language === "英语" ? "english" : "local");
  }
  function saveDraft(nextStatus: OutreachStatus = outreachStatus) {
    if (!selectedBuyer) return;
    if (!draft) return;
    const savedDraft: OutreachDraft = { ...draft, status: nextStatus, updated_at: new Date().toISOString() };
    localStorage.setItem(draftKey(selectedBuyer, channel), JSON.stringify(savedDraft)); setDraft(savedDraft); setOutreachStatus(nextStatus);
    setMessage(nextStatus === "approved" ? "内容已审核并加入待发送队列。" : "草稿已保存在本机浏览器。刷新页面也不会丢失。");
  }
  function updateVersion(field: keyof DraftVersion, value: string) { if (!draft) return; setDraft({ ...draft, [languageVersion]: { ...draft[languageVersion], [field]: value } }); }
  async function copyOutreach() { if (!draft) return; const version = draft[languageVersion]; await navigator.clipboard.writeText(channel === "email" ? `${version.subject}\n\n${version.body}` : version.body); setMessage("当前语言版本已复制。"); }
  function contactScores(buyer: Buyer) {
    let person = buyer.contact_person_score ?? 0;
    if (buyer.contact_person_score == null) {
      if (buyer.contact_person) person += 55;
      if (buyer.contact_title && !/待查|待确认|未注明/.test(buyer.contact_title)) person += 25;
      if (buyer.linkedin_url) person += 10;
      if (buyer.contact_evidence) person += 10;
    }
    let channelScore = buyer.contact_channel_score ?? 0;
    if (buyer.contact_channel_score == null) channelScore = buyer.person_email ? 100 : buyer.company_email ? 65 : buyer.whatsapp ? 55 : buyer.phone ? 40 : buyer.linkedin_url ? 25 : 0;
    return { person: Math.min(person, 100), channel: Math.min(channelScore, 100) };
  }
  function recommendedPath(buyer: Buyer) {
    if (buyer.recommended_contact_path) return buyer.recommended_contact_path;
    if (buyer.person_email) return "使用已公开的个人商务邮箱，人工审核后发送";
    if (buyer.company_email && buyer.contact_person) return `发至公司邮箱，并在主题和首句注明转交 ${buyer.contact_person}`;
    if (buyer.linkedin_url && buyer.company_email) return "公开 LinkedIn 主页确认身份，再由公司邮箱触达";
    if (buyer.phone) return "致电公司总机，请转采购或产品部门";
    return "继续核验官网表单与公开商业社交主页";
  }
  async function copyEnrichmentPrompt(buyer: Buyer) {
    const enrichment = `$find-overseas-buyers\n\n请只使用当前公开商业信息补全以下公司的采购联系人。不得猜测邮箱，不得绕过登录或抓取私人资料。\n\n国家：${result?.task.country || country}\n产品：${result?.task.product_description || product}\n公司：${buyer.company}\n官网：${buyer.website}\n现有联系人：${buyer.contact_person || "无"}\n现有职位：${buyer.contact_title || "无"}\n现有公开渠道：${buyer.person_email || buyer.company_email || buyer.whatsapp || buyer.phone || "无"}\n\n优先查找：Buyer、Category Manager、Product Manager、Procurement Manager、Import Manager、Owner。检查官网团队页、公开 LinkedIn 公司/员工页、Facebook/Instagram 企业简介、行业协会、展会名录、招聘页、新闻稿和公开公司文件。\n\n请返回：姓名、当前职务、公开个人商务邮箱（如有）、公司邮箱、电话/WhatsApp、公开社交主页、联系人证据、证据URL、核验日期、身份确认分、渠道确认分、推荐联系路径。没有公开个人邮箱时明确写“未找到”，不要按姓名和域名推测。`;
    await navigator.clipboard.writeText(enrichment);
    setMessage(`已复制 ${buyer.company} 的联系人补全指令，可直接交给 Codex 深挖公开商业来源。`);
  }
  function launchContact() {
    if (!selectedBuyer || !draft) return;
    saveDraft("approved");
    if (channel === "email") {
      const email = selectedBuyer.person_email || selectedBuyer.company_email;
      if (!email) { setMessage("该企业没有公开邮箱，不能创建邮件；请改用官网表单或电话。"); return; }
      const version = draft[languageVersion]; window.open(`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(version.subject)}&body=${encodeURIComponent(version.body)}`, "_blank");
      setMessage("已调用本机邮件客户端并保留待发送记录；当前版本不会未经确认自动发送。");
    } else {
      if (!selectedBuyer.whatsapp) { setMessage("该企业没有经过公开验证的WhatsApp号码，系统不会把普通电话冒充WhatsApp。 "); return; }
      const number = selectedBuyer.whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(draft[languageVersion].body)}`, "_blank", "noopener,noreferrer");
      setMessage("已打开WhatsApp对话并填入内容，请确认后发送。");
    }
  }

  function quickWhatsapp(buyer: Buyer) {
    if (!buyer.whatsapp) { setMessage("该企业没有经过公开核验的 WhatsApp，不能一键联系。"); return; }
    const nextDraft = buildDraft(buyer, "whatsapp");
    localStorage.setItem(draftKey(buyer, "whatsapp"), JSON.stringify({ ...nextDraft, status: "approved" }));
    const number = buyer.whatsapp.replace(/\D/g, "");
    window.location.href = `whatsapp://send?phone=${number}&text=${encodeURIComponent(nextDraft.english.body)}`;
    setMessage(`已调用本机 WhatsApp，并为 ${buyer.company} 填好英文招呼；请在 WhatsApp 中确认后发送。`);
  }

  function generatePrompt() {
    const normalizedHs = normalizeHs(hsCode);
    if (!country.trim() || !city.trim() || (normalizedHs && !/^\d{6,10}$/.test(normalizedHs)) || !product.trim() || !productEnglish.trim() || !targetCustomerPrompt.trim()) {
      setMessage("请填写国家、城市、产品信息、英文卖点和目标客户提示；HS Code 可留空。"); return;
    }
    const payload = { supplier_profile: { company_name: supplierCompany.trim() }, country: country.trim(), city: city.trim(), hs_code: normalizedHs, product_description: product.trim(), product_description_en: productEnglish.trim(), target_customer_prompt: targetCustomerPrompt.trim(), targets: counts, candidate_pool_multiplier: candidatePoolMultiplier, continue_until_exhausted: true, qualification_gate: { require_verified_public_whatsapp: true, count_only_leads_with_verified_whatsapp: true, return_fewer_instead_of_padding: true }, discovery_channels: ["local_language_web", "official_store_locators", "shopping_centre_directories", "brand_stockists", "company_registries", "industry_associations", "trade_fairs", "marketplaces", "public_catalogues", "job_postings", "customs_data_when_accessible", "linkedin_public_company_and_staff_pages", "facebook_business_about_pages", "instagram_business_bios", "youtube_business_about_pages", "x_business_profiles", "local_market_social_platforms"], contact_enrichment: { enabled: true, when_official_site_missing_contact: ["official_registries_and_filings", "industry_associations_and_trade_fairs", "public_staff_and_procurement_pages", "linkedin_public_company_and_staff_pages", "facebook_business_about_pages", "instagram_business_bios", "youtube_business_about_pages", "x_business_profiles", "local_market_social_platforms", "store_marketplace_and_social_business_profiles", "press_releases_and_public_documents", "switchboard_or_contact_form"], target_roles_by_category: Object.fromEntries(directions.map(item => [item.key, item.roles])), social_media_policy: { public_business_pages_only: true, allow_named_role_discovery: true, allow_public_business_email_phone_whatsapp: true, require_company_identity_match: true, require_profile_url: true, forbid_login_bypass: true, forbid_private_profile_scraping: true, forbid_inferred_email: true }, generate_whatsapp_greeting_en: true, whatsapp_greeting_style: "short_personalized_permission_based", contact_priority: ["verified_public_whatsapp"], require_source_url: true, require_verification_date: true, forbid_guessed_emails: true, verification_labels: ["verified_public", "not_found"] }, china_sourcing_signals: ["customs_from_china", "china_asia_sourcing_roles", "china_office_or_supplier_policy", "chinese_trade_fairs", "made_in_china_assortment"], excluded_types: exclude.split(/[，,、]/).map(v => v.trim()).filter(Boolean), exclude_existing: existing.split(/[,，\n]/).map(v => v.trim()).filter(Boolean), contact_policy: "verified_public_whatsapp_required", deduplicate_by: ["website_domain", "normalized_company_name", "public_email", "public_whatsapp"], output_format: "business_report_and_json", human_report_language: "zh-CN", return_path: "public/data/latest-buyers.json" };
    setPrompt(`$find-target-buyers\n\n${JSON.stringify(payload, null, 2)}`);
    setMessage(`已生成渠道探索指令：五类合计最多 ${total} 家，指定目标渠道会优先遵循你的客户提示词。`);
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setMessage("已复制。请粘贴到Codex并发送，Codex会调用Skill 1执行真实数据挖掘。");
  }

  async function loadLatestResult() {
    try {
      const response = await fetch(`/data/latest-buyers.json?t=${Date.now()}`, { cache: "no-store" });
      const data = await response.json() as BuyerResult;
      if (!data.generated_at || !data.summary || !data.categories) { setMessage("系统还没有收到Codex结果。请先完成Skill任务，再点击读取。"); return; }
      setResult(data); mergeResultIntoBuyerDatabase(data); setMessage(`已读取 ${data.summary.qualified} 家客户，并同步到本机客户主库。`);
    } catch { setMessage("读取失败：请确认Codex已经把结果写入 public/data/latest-buyers.json。"); }
  }

  return <main>
    <header className="site-header"><div className="brand-mark">贝</div><div><h1>贝贝家外贸复制系统</h1><p>特定区域销售渠道探索 · WhatsApp 一键触达</p></div><button className="automation-entry" onClick={() => setShowAutomation(true)}>邮件自动化 <b>{autoMail.enabled ? "已启用" : "备用"}</b></button><span className="phase">本地测试版</span></header>
    <section className="intro"><div><span>CHANNEL DISCOVERY + WHATSAPP</span><h2>找到销售渠道，写好招呼，一键打开 WhatsApp</h2><p>只使用公开核验的企业 WhatsApp；系统按每家企业的业务证据生成英文招呼，由业务员在 WhatsApp 中确认后发送。</p></div><ol><li className="active">找渠道</li><li>核验 WhatsApp</li><li>生成招呼</li><li>一键联系</li></ol></section>
    <div className="layout">
      <section className="card form-card">
        <div className="card-title"><span>01</span><div><h3>产品与区域</h3><p>城市必填，HS Code 可选</p></div></div>
        <div className="form-grid"><label className="full">供应商名称<input value={supplierCompany} onChange={e => setSupplierCompany(e.target.value)} /></label><label>目标国家或地区<input value={country} onChange={e => setCountry(e.target.value)} placeholder="例如：阿联酋、瑞士、韩国" /></label><label>目标城市（必填）<input value={city} onChange={e => setCity(e.target.value)} placeholder="例如：Dubai、Abu Dhabi" /></label><label className="full">HS Code（选填）<input value={hsCode} onChange={e => setHsCode(e.target.value)} inputMode="numeric" /></label><label className="full">产品信息（中文，用于搜索）<textarea rows={3} value={product} onChange={e => setProduct(e.target.value)} /></label><label className="full">目标客户提示词（必填）<textarea rows={3} value={targetCustomerPrompt} onChange={e => setTargetCustomerPrompt(e.target.value)} placeholder="例如：优先寻找整装设计师、室内设计工作室、装修公司和酒店工程承包商" /></label><label className="full">英文产品与卖点（用于 WhatsApp 招呼）<textarea rows={2} value={productEnglish} onChange={e => setProductEnglish(e.target.value)} placeholder="例如：custom wallcoverings, wallpaper and decorative films with custom designs and packaging" /></label><label className="full">排除类型<input value={exclude} onChange={e => setExclude(e.target.value)} /></label><label className="full">历史客户自动排除 <small>已按“{country || "国家"} / {normalizeHs(hsCode) || "产品描述"}”匹配 {existingCount} 项域名、企业、邮箱或WhatsApp</small><textarea className="history-preview" rows={2} value={existing} readOnly placeholder="当前国家和产品还没有历史客户，获得首批结果后会自动建立主库" /></label></div>
        <div className="card-title second"><span>02</span><div><h3>销售渠道数量</h3><p>四类标准渠道和一类自定义目标分别查找</p></div><strong>{total} 家</strong></div>
        <div className="search-depth"><div><b>覆盖强度</b><small>先审查约 {total * candidatePoolMultiplier} 家候选，再返回最匹配的 {total} 家</small></div><select aria-label="候选池倍数" value={candidatePoolMultiplier} onChange={e => setCandidatePoolMultiplier(Number(e.target.value))}><option value="2">标准 · 2倍</option><option value="4">深入 · 4倍</option><option value="6">全面 · 6倍</option></select></div>
        <div className="direction-grid">{directions.map(item => <article key={item.key}><div className="direction-top"><i>{item.label.slice(0, 1)}</i><div><h4>{item.label}</h4><p>{item.note}</p></div><select aria-label={`${item.label}数量`} value={counts[item.key]} onChange={e => setCounts(current => ({ ...current, [item.key]: Number(e.target.value) }))}><option value="0">0</option><option value="3">3</option><option value="5">5</option><option value="10">10</option><option value="20">20</option></select></div><small>联系人：{item.roles.join(" / ")}</small></article>)}</div>
        <button className="generate" onClick={generatePrompt}>生成Skill 1调用指令 <b>→</b></button>{message && <p className="message">{message}</p>}
      </section>
      <aside className="card output-card"><div className="card-title"><span>03</span><div><h3>Codex调用与回传</h3><p>业务员不需要阅读或处理JSON</p></div></div>{prompt ? <><textarea className="prompt" readOnly value={prompt} /><button className="copy" onClick={copyPrompt}>① 复制完整指令</button><button className="load" onClick={loadLatestResult}>② 读取最新结果</button><div className="rule"><b>Codex完成后会同时</b><ul><li>按城市探索五类销售渠道</li><li>优先执行目标客户提示词</li><li>保存机器数据并自动去重</li><li>为公开 WhatsApp 生成英文招呼</li></ul></div></> : <div className="placeholder"><div>$</div><h4>等待生成</h4><p>左侧填写参数后，调用指令会完整显示在这里。</p></div>}</aside>
    </div>
    {result && <section className="results">
      <header><div><span>最新回传</span><h2>{result.task.city ? `${result.task.city} · ` : ""}{result.task.country}{result.task.hs_code ? ` · HS ${result.task.hs_code}` : ""}</h2><p>{result.task.product_description}</p></div><div className="result-metrics"><b>{result.summary.candidates_reviewed ?? result.summary.qualified}<small>审查候选</small></b><b>{result.summary.qualified}<small>合格客户</small></b><b>{result.summary.with_named_contact}<small>具名联系人</small></b><b>{result.summary.with_public_email}<small>公开邮箱</small></b><b>{(result.summary.china_sourcing_strong || 0) + (result.summary.china_sourcing_moderate || 0)}<small>中国采购信号</small></b></div></header>
      <p className="coverage">{result.summary.coverage_note}</p>
      {result.summary.discovery_channels_used?.length ? <p className="channel-summary">已使用渠道：{result.summary.discovery_channels_used.join("、")}</p> : null}
      {directions.map(direction => <section className="category" key={direction.key}>
        <div className="category-title"><h3>{direction.label}</h3><span>{result.categories[direction.key]?.length || 0} 家</span></div>
        <div className="buyer-list">
          <div className="buyer-list-head"><span>企业 / 匹配依据</span><span>负责人 / 身份</span><span>触达渠道 / 路径</span><span>中国采购</span><span>操作</span></div>
          {(result.categories[direction.key] || []).map(buyer => {
            const scores = contactScores(buyer);
            return <article key={`${buyer.company}-${buyer.website}`}>
              <div className="company-cell"><h4>{buyer.company}</h4><p>{buyer.product_fit_evidence}</p><a href={buyer.website} target="_blank" rel="noreferrer">访问官网 ↗</a>{buyer.source_urls?.[0] && <a href={buyer.source_urls[0]} target="_blank" rel="noreferrer">证据来源 ↗</a>}</div>
              <div className="person-cell"><b>{buyer.contact_person || "未找到"}</b><small>{buyer.contact_title || "具名负责人待查"}</small><div className="contact-score"><span>身份 {scores.person}</span><i style={{ width: `${scores.person}%` }} /></div>{buyer.linkedin_url && <a href={buyer.linkedin_url} target="_blank" rel="noreferrer">公开 LinkedIn ↗</a>}{buyer.contact_verified_at && <small>核验于 {buyer.contact_verified_at}</small>}</div>
              <div className="contact-cell"><b>{buyer.person_email || buyer.company_email || buyer.whatsapp || buyer.phone || "仅官网入口"}</b><div className="contact-score channel"><span>渠道 {scores.channel}</span><i style={{ width: `${scores.channel}%` }} /></div><small className="contact-path">{recommendedPath(buyer)}</small>{buyer.contact_evidence && <details><summary>查看联系人依据</summary><p>{buyer.contact_evidence}</p></details>}</div>
              <div className={`sourcing ${buyer.china_sourcing_status || "not_found"}`}><b>{buyer.china_sourcing_score || 0} 分</b><small>{buyer.china_sourcing_status === "strong" ? "强关联" : buyer.china_sourcing_status === "moderate" ? "中等关联" : buyer.china_sourcing_status === "weak" ? "弱关联" : "暂无公开证据"}</small>{buyer.china_sourcing_evidence?.[0]?.url && <a href={buyer.china_sourcing_evidence[0].url} target="_blank" rel="noreferrer">查看依据 ↗</a>}</div>
              <div className="contact-actions"><button onClick={() => openOutreach(buyer, "whatsapp")} disabled={!buyer.whatsapp}>预览招呼</button><button onClick={() => copyEnrichmentPrompt(buyer)}>补联系人</button><button className="quick-wa" onClick={() => quickWhatsapp(buyer)} disabled={!buyer.whatsapp}>一键联系</button></div>
            </article>;
          })}
        </div>
      </section>)}
    </section>}
    {selectedBuyer && draft && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedBuyer(null); }}><section className="outreach-modal" role="dialog" aria-modal="true" aria-label={`${selectedBuyer.company} 联系内容编辑`}><header><div><span>MODULE 2 · 千人千面</span><h2>{selectedBuyer.company}</h2><p>{selectedBuyer.contact_person || "未找到具名联系人"}{selectedBuyer.contact_title ? ` · ${selectedBuyer.contact_title}` : ""}</p></div><button className="modal-close" aria-label="关闭弹窗" onClick={() => setSelectedBuyer(null)}>×</button></header><div className="sender-profile"><label>业务员姓名<input value={senderName} onChange={e => setSenderName(e.target.value)} /></label><label>发件邮箱<input value={senderEmail} onChange={e => setSenderEmail(e.target.value)} /></label><label>自己的 WhatsApp<input value={senderWhatsapp} onChange={e => setSenderWhatsapp(e.target.value)} /></label><button onClick={saveSenderProfile}>保存资料</button></div><div className="composer"><aside><h3>客户信息</h3><dl><div><dt>公开邮箱</dt><dd>{selectedBuyer.person_email || selectedBuyer.company_email || "无"}</dd></div><div><dt>公开 WhatsApp</dt><dd>{selectedBuyer.whatsapp || "无"}</dd></div><div><dt>个性化依据</dt><dd>{selectedBuyer.product_fit_evidence}</dd></div></dl></aside><section><div className="composer-toolbar"><button className={channel === "email" ? "active" : ""} onClick={() => changeChannel("email")}>邮件</button><button className={channel === "whatsapp" ? "active" : ""} onClick={() => changeChannel("whatsapp")}>WhatsApp</button><i></i>{draft.local_language === "英语" ? <button className="language active" onClick={() => setLanguageVersion("english")}>英语版</button> : <><button className={languageVersion === "local" ? "language active" : "language"} onClick={() => setLanguageVersion("local")}>{draft.local_language}版</button><button className={languageVersion === "english" ? "language active" : "language"} onClick={() => setLanguageVersion("english")}>英语版</button></>}<span>状态：{outreachStatus === "draft" ? "草稿" : outreachStatus === "approved" ? "待发送" : outreachStatus === "sent" ? "已发送" : "已回复"}</span></div>{channel === "email" && <label>主题<input value={draft[languageVersion].subject} onChange={e => updateVersion("subject", e.target.value)} /></label>}<label>正文<textarea rows={15} value={draft[languageVersion].body} onChange={e => updateVersion("body", e.target.value)} /></label><div className="composer-actions"><button onClick={() => saveDraft("draft")}>{draft.local_language === "英语" ? "保存草稿" : "保存双语草稿"}</button><button onClick={copyOutreach}>复制当前版本</button><button className="approve" onClick={() => saveDraft("approved")}>加入待发送</button><button className="launch" onClick={launchContact}>{channel === "email" ? "打开邮件客户端" : "打开 WhatsApp"}</button></div></section></div></section></div>}
    {showAutomation && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowAutomation(false); }}><section className="automation-modal" role="dialog" aria-modal="true" aria-label="邮件自动化设置"><header><div><span>OUTREACH CONTROL</span><h2>自动邮件规则</h2><p>先审核、再限速发送；回复、退信或退订后立即停止后续邮件。</p></div><button className="modal-close" aria-label="关闭" onClick={() => setShowAutomation(false)}>×</button></header><div className="automation-flow"><b>公开联系人</b><i>→</i><b>邮箱验证</b><i>→</i><b>人工审核</b><i>→</i><b>限速队列</b><i>→</i><b>回复跟进</b></div><div className="automation-grid"><label>每日最多发送<input type="number" min="1" max="100" value={autoMail.dailyLimit} onChange={e => setAutoMail({ ...autoMail, dailyLimit: Number(e.target.value) })} /></label><label>每封间隔（分钟）<input type="number" min="5" max="120" value={autoMail.gapMinutes} onChange={e => setAutoMail({ ...autoMail, gapMinutes: Number(e.target.value) })} /></label><label>未回复后跟进（天）<input type="number" min="2" max="30" value={autoMail.followUpDays} onChange={e => setAutoMail({ ...autoMail, followUpDays: Number(e.target.value) })} /></label><label className="check"><input type="checkbox" checked={autoMail.requireApproval} onChange={e => setAutoMail({ ...autoMail, requireApproval: e.target.checked })} /> 每封首封邮件必须人工审核</label><label className="check"><input type="checkbox" checked={autoMail.stopOnReply} onChange={e => setAutoMail({ ...autoMail, stopOnReply: e.target.checked })} /> 收到回复或退信后停止序列</label><label className="check"><input type="checkbox" checked={autoMail.includeUnsubscribe} onChange={e => setAutoMail({ ...autoMail, includeUnsubscribe: e.target.checked })} /> 邮件包含退订入口</label></div><div className="provider-note"><b>当前为安全设计模式</b><p>设置只保存在本机。正式自动发送还需接入企业邮箱或邮件服务商，并配置域名 SPF、DKIM、DMARC、退信与退订回调。</p></div><footer><label className="enable"><input type="checkbox" checked={autoMail.enabled} onChange={e => setAutoMail({ ...autoMail, enabled: e.target.checked })} /> 接入服务后启用自动队列</label><button onClick={saveAutomation}>保存规则</button></footer></section></div>}
  </main>;
}
