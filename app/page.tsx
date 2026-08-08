"use client";

import { useMemo, useState } from "react";

type Lead = {
  company: string;
  country: string;
  fit: number;
  contact: string;
  evidence: string;
  status: "待审核" | "可发送" | "已发送" | "已回复";
};

const leads: Lead[] = [
  { company: "LUNEKS Industrial Lab", country: "哈萨克斯坦", fit: 92, contact: "info@luneks.kz", evidence: "官网展示湿巾生产线与自有品牌", status: "已发送" },
  { company: "ТОО Аккурат", country: "哈萨克斯坦", fit: 87, contact: "too.akkurat@mail.ru", evidence: "产品目录包含卫生湿巾", status: "已发送" },
  { company: "AQAZ Cosmetics", country: "哈萨克斯坦", fit: 81, contact: "info@aqaz.kz", evidence: "本地个人护理用品生产商", status: "可发送" },
  { company: "ПК Билал / Luna Fresh", country: "哈萨克斯坦", fit: 78, contact: "info@bilal.kz", evidence: "Luna Fresh 湿巾品牌运营方", status: "可发送" },
  { company: "LILO GROUP", country: "哈萨克斯坦", fit: 72, contact: "atb@lilo.kz", evidence: "一次性卫生用品产品线", status: "待审核" },
];

const nav = ["任务总览", "买家线索", "邮件队列", "回复中心", "系统设置"];

export default function Home() {
  const [active, setActive] = useState("任务总览");
  const [country, setCountry] = useState("哈萨克斯坦");
  const [product, setProduct] = useState("水刺无纺布（湿巾、卫生湿巾、一次性毛巾用）");
  const [exclude, setExclude] = useState("面膜生产商");
  const [company, setCompany] = useState("Hangzhou Kangjie Nonwoven");
  const [sender, setSender] = useState("Brien");
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");

  const counts = useMemo(() => ({
    found: leads.length,
    ready: leads.filter((lead) => lead.status === "可发送").length,
    sent: leads.filter((lead) => lead.status === "已发送").length,
    replied: leads.filter((lead) => lead.status === "已回复").length,
  }), []);

  function startCampaign() {
    setRunning(true);
    setNotice("任务已进入后台队列：正在搜索官网、产品目录和公开采购证据。");
    window.setTimeout(() => setRunning(false), 2200);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">外</span><div><strong>外贸获客系统</strong><small>海外买家开发工作台</small></div></div>
        <nav aria-label="主导航">
          {nav.map((item, index) => (
            <button key={item} className={active === item ? "nav-item active" : "nav-item"} onClick={() => setActive(item)}>
              <span className="nav-icon">{["⌂", "◎", "↗", "↙", "⚙"][index]}</span>{item}
              {item === "邮件队列" && <em>2</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot"><div className="avatar">B</div><div><strong>Brien</strong><small>Hangzhou Kangjie</small></div><button aria-label="账户菜单">•••</button></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><span className="eyebrow">AUTOMATED OUTREACH</span><h1>{active}</h1></div><div className="top-actions"><button className="icon-button" aria-label="通知">♢<i /></button><button className="ghost-button">查看运行日志</button></div></header>

        {active === "任务总览" && <>
          <section className="hero-grid">
            <div className="campaign-card">
              <div className="section-heading"><div><span className="step">01</span><h2>创建获客任务</h2><p>描述目标市场和产品，系统会寻找、验证并准备个性化触达。</p></div><span className="live-dot">系统在线</span></div>
              <div className="form-grid">
                <label>目标国家或地区<input value={country} onChange={(event) => setCountry(event.target.value)} /></label>
                <label>目标买家数量<select defaultValue="20"><option>5</option><option>10</option><option>20</option><option>50</option></select></label>
                <label className="full">产品信息<textarea value={product} onChange={(event) => setProduct(event.target.value)} rows={3} /></label>
                <label className="full">排除类型<input value={exclude} onChange={(event) => setExclude(event.target.value)} placeholder="例如：面膜、零售商" /></label>
                <label>公司名称<input value={company} onChange={(event) => setCompany(event.target.value)} /></label>
                <label>联系人<input value={sender} onChange={(event) => setSender(event.target.value)} /></label>
              </div>
              <div className="automation-row"><div><b>自动执行</b><span>寻找买家 → 验证证据 → 生成邮件 → 进入发送队列</span></div><label className="switch"><input type="checkbox" defaultChecked /><span /></label></div>
              <button className="primary-button" onClick={startCampaign} disabled={running}>{running ? "正在创建任务…" : "开始自动获客"}<span>→</span></button>
              {notice && <div className="notice">✓ {notice}</div>}
            </div>

            <aside className="status-card">
              <div className="orbit"><span>KJ</span><i className={running ? "scan running" : "scan"} /></div>
              <h3>{running ? "正在分析目标市场" : "自动获客引擎就绪"}</h3><p>最近一次运行：哈萨克斯坦 · 水刺无纺布</p>
              <div className="pipeline">
                {["买家发现", "需求验证", "邮箱验证", "个性化邮件"].map((item, index) => <div key={item}><span className={index < 3 ? "done" : "pending"}>{index < 3 ? "✓" : "4"}</span><b>{item}</b><small>{["5 家候选公司", "3 条强需求证据", "5 个有效联系人", "2 封等待审核"][index]}</small></div>)}
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

        {active === "邮件队列" && <section className="panel"><div className="section-heading"><div><span className="step">03</span><h2>邮件发送队列</h2><p>验证收件人、控制发送节奏并监控送达结果。</p></div><button className="primary-small">连接 Gmail API</button></div><div className="queue-list">{leads.map((lead, index) => <article key={lead.contact}><div className="company-avatar">{lead.company[0]}</div><div><b>{lead.company}</b><span>{lead.contact}</span></div><span className="language">俄语</span><span className={`status ${lead.status}`}>{lead.status}</span><time>{index < 2 ? "已发送 14:26" : "预计明日 10:00"}</time></article>)}</div></section>}

        {active === "回复中心" && <section className="empty-state"><div>↙</div><h2>回复会集中显示在这里</h2><p>接入 Gmail API 后，系统将识别积极回复、询价、拒绝和退信，并自动暂停后续邮件。</p><button className="primary-small">配置收件箱同步</button></section>}

        {active === "系统设置" && <section className="settings-grid"><article className="panel"><h2>发件人资料</h2><label>发件邮箱<input defaultValue="goonwzz@gmail.com" /></label><label>WhatsApp<input defaultValue="+86 15558008200" /></label><label>每日发送上限<input type="number" defaultValue="30" /></label></article><article className="panel"><h2>发送安全</h2>{["发送前验证邮箱", "自动停止退信地址", "客户回复后停止跟进", "加入退订说明"].map(item => <label className="check" key={item}><input type="checkbox" defaultChecked />{item}</label>)}</article></section>}
      </section>
    </main>
  );
}

function LeadTable({ title, rows, onViewAll }: { title: string; rows: Lead[]; onViewAll?: () => void }) {
  return <section className="panel lead-panel"><div className="table-head"><div><h2>{title}</h2><p>每条线索都保留来源和需求判断依据</p></div>{onViewAll && <button className="text-button" onClick={onViewAll}>查看全部 →</button>}</div><div className="table-wrap"><table><thead><tr><th>公司</th><th>匹配度</th><th>联系方式</th><th>采购需求证据</th><th>状态</th></tr></thead><tbody>{rows.map(lead => <tr key={lead.company}><td><div className="company-cell"><span className="company-avatar">{lead.company[0]}</span><div><b>{lead.company}</b><small>{lead.country}</small></div></div></td><td><div className="score"><span style={{width: `${lead.fit}%`}} /><b>{lead.fit}</b></div></td><td><a href={`mailto:${lead.contact}`}>{lead.contact}</a></td><td>{lead.evidence}</td><td><span className={`status ${lead.status}`}>{lead.status}</span></td></tr>)}</tbody></table></div></section>;
}
