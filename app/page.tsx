"use client";

import { useEffect, useMemo, useState } from "react";

type HsCode = { code: string; nameZh: string };

type Lead = {
  id?: string;
  company: string;
  country: string;
  fit: number;
  contact: string;
  evidence: string;
  status: "待审核" | "可发送" | "已发送" | "已回复";
  website?: string;
  demandStatus?: string;
  sourceUrls?: string[];
};

const nav = ["任务总览", "买家线索", "邮件队列", "回复中心", "系统设置"];

export default function Home() {
  const [active, setActive] = useState("任务总览");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [country, setCountry] = useState("");
  const [hsCode, setHsCode] = useState("6307100000");
  const [hsNameZh, setHsNameZh] = useState("擦地布、擦碗布、抹布及类似擦拭用布");
  const [hsCatalog, setHsCatalog] = useState<HsCode[]>([]);
  const [hsOpen, setHsOpen] = useState(false);
  const [product, setProduct] = useState("黏胶/涤纶水刺无纺布干巾、家居清洁布，可定制克重、尺寸和配比");
  const [targetCount, setTargetCount] = useState(5);
  const [exclude, setExclude] = useState("");
  const [company, setCompany] = useState("Hangzhou Kangjie Nonwoven");
  const [sender, setSender] = useState("Brien");
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const [automatic, setAutomatic] = useState(true);
  const [runStage, setRunStage] = useState(0);
  const [logs, setLogs] = useState<string[]>(["系统初始化完成，等待创建获客任务。"]);
  const [showLogs, setShowLogs] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; body: string } | null>(null);
  const [gmailConfigured, setGmailConfigured] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const counts = useMemo(() => ({
    found: leads.length,
    ready: leads.filter((lead) => lead.status === "可发送").length,
    sent: leads.filter((lead) => lead.status === "已发送").length,
    replied: leads.filter((lead) => lead.status === "已回复").length,
  }), [leads]);

  useEffect(() => {
    fetch("/data/hs-codes.json")
      .then((response) => response.json())
      .then((items: HsCode[]) => setHsCatalog(items))
      .catch(() => setNotice("HS编码目录加载失败，请刷新页面重试。"));
  }, []);

  async function refreshLeads() {
    return fetch("/api/leads", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { leads?: Lead[]; error?: string }) => {
        if (!body.leads) throw new Error(body.error || "买家线索读取失败");
        setLeads(body.leads);
      });
  }

  useEffect(() => {
    refreshLeads()
      .catch(() => setNotice("买家线索读取失败，请刷新页面重试。"));
    fetch("/api/email/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { configured?: boolean }) => setGmailConfigured(body.configured === true))
      .catch(() => setGmailConfigured(false));
  }, []);

  const hsSuggestions = useMemo(() => {
    const query = hsCode.replace(/[.\s-]/g, "").toLowerCase();
    if (!query) return hsCatalog.slice(0, 8);
    return hsCatalog.filter((item) => item.code.includes(query) || item.nameZh.includes(hsCode.trim())).slice(0, 8);
  }, [hsCatalog, hsCode]);

  function selectHsCode(item: HsCode) {
    setHsCode(item.code);
    setHsNameZh(item.nameZh);
    setHsOpen(false);
  }

  function updateHsCode(value: string) {
    setHsCode(value);
    const normalized = value.replace(/[.\s-]/g, "");
    setHsNameZh(hsCatalog.find((item) => item.code === normalized)?.nameZh ?? "");
    setHsOpen(true);
  }

  async function startCampaign() {
    if (!country.trim() || !/^\d{6,10}$/.test(hsCode.replace(/[.\s-]/g, "")) || !hsNameZh) {
      setNotice("请填写目标国家，并从候选项中选择有效的HS编码。");
      return;
    }
    setRunning(true);
    setRunStage(1);
    setNotice("");
    const addLog = (message: string) => setLogs((current) => [`${new Date().toLocaleTimeString("zh-CN")}  ${message}`, ...current]);
    addLog(`创建任务：${country} · HS ${hsCode}`);
    try {
      const createdResponse = await fetch("/api/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country, hsCode, hsNameZh, productDescription: product, exclusions: exclude, targetCount }) });
      const created = await createdResponse.json() as { campaign?: { id: string }; error?: string };
      if (!createdResponse.ok || !created.campaign) throw new Error(created.error || "任务创建失败");
      setRunStage(2); addLog("任务已写入本地JSON，正在实时搜索公开网页及采购证据。");
      const runResponse = await fetch(`/api/campaigns/${created.campaign.id}/run`, { method: "POST" });
      setRunStage(3);
      const result = await runResponse.json() as { leads?: Lead[]; error?: string };
      if (!runResponse.ok || !result.leads) throw new Error(result.error || "真实获客任务执行失败");
      setLeads(result.leads);
      setRunStage(4); addLog(`真实搜索完成，获得 ${result.leads.length} 条带来源的候选买家。`);
      setNotice(`真实获客完成：已保存 ${result.leads.length} 条线索到本地JSON。`);
    } catch (error) {
      addLog(`任务失败：${error instanceof Error ? error.message : "未知错误"}`);
      setNotice(error instanceof Error ? error.message : "任务执行失败");
    } finally {
      setRunning(false);
    }
  }

  function openSettings(message: string) {
    setActive("系统设置");
    setNotice(message);
  }

  function saveSettings() {
    window.localStorage.setItem("trade-settings", JSON.stringify({ company, sender, savedAt: new Date().toISOString() }));
    setSettingsSaved(true);
    setNotice("发件人与发送安全配置已保存到本机。 ");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">外</span><div><strong>外贸获客系统</strong><small>海外买家开发工作台</small></div></div>
        <nav aria-label="主导航">
          {nav.map((item, index) => (
            <button key={item} className={active === item ? "nav-item active" : "nav-item"} onClick={() => setActive(item)}>
              <span className="nav-icon">{["⌂", "◎", "↗", "↙", "⚙"][index]}</span>{item}
              {item === "邮件队列" && counts.ready > 0 && <em>{counts.ready}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot"><div className="avatar">B</div><div><strong>Brien</strong><small>Hangzhou Kangjie</small></div><button aria-label="账户菜单" onClick={() => setDialog({ title: "当前账户", body: `${sender} · ${company}\n任务与线索保存在本机 data/*.json。` })}>•••</button></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><span className="eyebrow">AUTOMATED OUTREACH</span><h1>{active}</h1></div><div className="top-actions"><button className="icon-button" aria-label="通知" onClick={() => setDialog({ title: "通知", body: notice || "暂无新通知。" })}>♢<i /></button><button className="ghost-button" onClick={() => setShowLogs(true)}>查看运行日志</button></div></header>

        {active === "任务总览" && <>
          <section className="hero-grid">
            <div className="campaign-card">
              <div className="section-heading"><div><span className="step">01</span><h2>创建获客任务</h2><p>输入目标市场和HS编码，系统按海关品类寻找并验证真实进口商。</p></div><span className="live-dot">系统在线</span></div>
              <div className="form-grid">
                <label>目标国家或地区<input value={country} onChange={(event) => setCountry(event.target.value)} /></label>
                <label>目标买家数量<select value={targetCount} onChange={(event) => setTargetCount(Number(event.target.value))}><option>5</option><option>10</option><option>20</option><option>50</option></select></label>
                <label className="full hs-field">HS Code（必填）
                  <input role="combobox" aria-expanded={hsOpen} aria-controls="hs-suggestions" autoComplete="off" inputMode="numeric" value={hsCode} onFocus={() => setHsOpen(true)} onBlur={() => window.setTimeout(() => setHsOpen(false), 120)} onChange={(event) => updateHsCode(event.target.value)} placeholder="输入编码或中文品名搜索" />
                  {hsOpen && hsSuggestions.length > 0 && <div className="hs-suggestions" id="hs-suggestions" role="listbox">{hsSuggestions.map((item) => <button type="button" role="option" aria-selected={item.code === hsCode} key={item.code} onMouseDown={() => selectHsCode(item)}><b>{item.code}</b><span>{item.nameZh}</span></button>)}</div>}
                </label>
                <label className="full">产品中文名<input value={hsNameZh} readOnly placeholder="选择HS编码后自动填写" /></label>
                <label className="full">产品补充信息（选填）<textarea value={product} onChange={(event) => setProduct(event.target.value)} rows={3} placeholder="例如：黏胶/涤纶配比、克重、尺寸、应用和定制能力" /></label>
                <label className="full">排除类型<input value={exclude} onChange={(event) => setExclude(event.target.value)} placeholder="例如：面膜、零售商" /></label>
                <label>公司名称<input value={company} onChange={(event) => setCompany(event.target.value)} /></label>
                <label>联系人<input value={sender} onChange={(event) => setSender(event.target.value)} /></label>
              </div>
              <div className="automation-row"><div><b>自动执行</b><span>寻找买家 → 验证证据 → 生成邮件 → 进入发送队列</span></div><label className="switch"><input type="checkbox" checked={automatic} onChange={(event) => setAutomatic(event.target.checked)} /><span /></label></div>
              <button className="primary-button" onClick={startCampaign} disabled={running}>{running ? "正在实时搜索（可能需要1–3分钟）…" : "开始自动获客"}<span>→</span></button>
              {notice && <div className="notice">✓ {notice}</div>}
            </div>

            <aside className="status-card">
              <div className="orbit"><span>KJ</span><i className={running ? "scan running" : "scan"} /></div>
              <h3>{running ? "正在分析目标市场" : runStage === 4 ? "本次流程已完成" : "自动获客引擎就绪"}</h3><p>当前任务：{country} · HS {hsCode}</p>
              <div className="pipeline">
                {["买家发现", "需求验证", "邮箱验证", "个性化邮件"].map((item, index) => <div key={item}><span className={runStage > index ? "done" : "pending"}>{runStage > index ? "✓" : index + 1}</span><b>{item}</b><small>{runStage > index ? ["候选公司已载入", "采购证据已核验", "公开联系人已整理", "邮件草稿等待审核"][index] : "等待执行"}</small></div>)}
              </div>
            </aside>
          </section>

          <section className="metrics">
            <article><span>已发现买家</span><strong>{counts.found}</strong><small>本次任务</small></article>
            <article><span>可发送联系人</span><strong>{counts.ready}</strong><small>邮箱已验证</small></article>
            <article><span>已发送邮件</span><strong>{counts.sent}</strong><small>无退信</small></article>
            <article><span>已获得回复</span><strong>{counts.replied}</strong><small>等待首封回复</small></article>
          </section>

          <LeadTable title="最新买家线索" rows={leads} onViewAll={() => setActive("买家线索")} />
        </>}

        {active === "买家线索" && <LeadTable title="全部买家线索" rows={leads} />}

        {active === "邮件队列" && <section className="panel"><div className="section-heading"><div><span className="step">03</span><h2>邮件发送队列</h2><p>验证收件人、控制发送节奏并监控送达结果。</p></div><button className="primary-small" onClick={() => openSettings("请在服务端 .env 中检查 Gmail API 配置。")}>{gmailConfigured ? "Gmail 已配置" : "Gmail 未配置"}</button></div>{leads.length === 0 ? <div className="empty-state"><h2>暂无邮件任务</h2><p>获得真实买家线索后，可发送的联系人将进入这里。</p></div> : <div className="queue-list">{leads.map((lead) => <article key={lead.id ?? `${lead.company}-${lead.contact}`}><div className="company-avatar">{lead.company[0]}</div><div><b>{lead.company}</b><span>{lead.contact || "暂无联系方式"}</span></div><span className={`status ${lead.status}`}>{lead.status}</span><time>{lead.status === "已发送" ? "已发送" : "未发送"}</time></article>)}</div>}</section>}

        {active === "回复中心" && <section className="empty-state"><div>↙</div><h2>回复会集中显示在这里</h2><p>接入 Gmail API 后，系统将识别积极回复、询价、拒绝和退信，并自动暂停后续邮件。</p><button className="primary-small" onClick={() => openSettings("请先配置Gmail API，再启用收件箱同步。")}>配置收件箱同步</button></section>}

        {active === "系统设置" && <><section className="settings-grid"><article className="panel"><h2>发件人资料</h2><label>发件邮箱<input placeholder="name@example.com" /></label><label>WhatsApp<input placeholder="+国家码 手机号" /></label><label>每日发送上限<input type="number" defaultValue="30" /></label><p>Gmail API：{gmailConfigured ? "服务端配置完整" : "服务端配置不完整"}</p></article><article className="panel"><h2>发送安全</h2>{["发送前验证邮箱", "自动停止退信地址", "客户回复后停止跟进", "加入退订说明"].map(item => <label className="check" key={item}><input type="checkbox" defaultChecked />{item}</label>)}</article></section><button className="primary-button settings-save" onClick={saveSettings}>{settingsSaved ? "配置已保存" : "保存系统设置"}<span>✓</span></button></>}
      </section>
      {showLogs && <div className="overlay" role="presentation" onMouseDown={() => setShowLogs(false)}><section className="drawer" role="dialog" aria-modal="true" aria-label="运行日志" onMouseDown={(event) => event.stopPropagation()}><header><h2>运行日志</h2><button aria-label="关闭运行日志" onClick={() => setShowLogs(false)}>×</button></header><div className="log-list">{logs.map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}</div></section></div>}
      {dialog && <div className="overlay centered" role="presentation" onMouseDown={() => setDialog(null)}><section className="dialog" role="dialog" aria-modal="true" aria-label={dialog.title} onMouseDown={(event) => event.stopPropagation()}><h2>{dialog.title}</h2><p>{dialog.body}</p><button className="primary-small" onClick={() => setDialog(null)}>知道了</button></section></div>}
    </main>
  );
}

function LeadTable({ title, rows, onViewAll }: { title: string; rows: Lead[]; onViewAll?: () => void }) {
  return <section className="panel lead-panel"><div className="table-head"><div><h2>{title}</h2><p>每条线索都保留来源和需求判断依据</p></div>{onViewAll && <button className="text-button" onClick={onViewAll}>查看全部 →</button>}</div><div className="table-wrap"><table><thead><tr><th>公司</th><th>匹配度</th><th>联系方式</th><th>采购需求证据</th><th>状态</th></tr></thead><tbody>{rows.map(lead => <tr key={lead.company}><td><div className="company-cell"><span className="company-avatar">{lead.company[0]}</span><div><b>{lead.company}</b><small>{lead.country}{lead.demandStatus ? ` · ${lead.demandStatus}` : ""}</small></div></div></td><td><div className="score"><span style={{width: `${lead.fit}%`}} /><b>{lead.fit}</b></div></td><td>{lead.contact ? <a href={lead.contact.startsWith("http") ? lead.contact : `mailto:${lead.contact}`} target={lead.contact.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{lead.contact}</a> : "待查"}</td><td>{lead.evidence}{lead.sourceUrls?.[0] && <> <a href={lead.sourceUrls[0]} target="_blank" rel="noreferrer">查看来源</a></>}</td><td><span className={`status ${lead.status}`}>{lead.status}</span></td></tr>)}</tbody></table></div></section>;
}
