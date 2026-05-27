import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { departments, getDashboardData } from "./data.js";
import "./styles.css";

function classForValue(value) {
  if (value >= 108) return "hot";
  if (value >= 92) return "warn";
  if (value >= 80) return "good";
  return "";
}

function riskClass(tone) {
  if (tone === "critical") return "critical";
  if (tone === "good") return "good";
  return "warning";
}

function money(value) {
  return `¥${value.toLocaleString("zh-CN")}万`;
}

function KpiCard({ label, value, hint, warning }) {
  return (
    <section className="kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <em className={warning ? "warning" : ""}>{hint}</em>
    </section>
  );
}

function DemandPanel({ demand }) {
  return (
    <section className="panel demand-panel">
      <PanelHead title="业务需求承接总览" subtitle="总漏斗 + 部门热力" />
      <div className="demand-content">
        <div>
          <div className="funnel">
            <div className="funnel-stage stage-1">提出 {demand.totals.proposed}</div>
            <div className="funnel-stage stage-2">接收 {demand.totals.accepted}</div>
            <div className="funnel-stage stage-3">完成 {demand.totals.completed}</div>
          </div>
          <div className="rate-grid">
            <div><strong>{demand.acceptRate}%</strong><span>接收率</span></div>
            <div><strong>{demand.deliveryRate}%</strong><span>交付率</span></div>
            <div><strong>{demand.endToEndRate}%</strong><span>端到端</span></div>
          </div>
        </div>
        <div className="demand-heat">
          <span className="axis">部门</span><span className="axis">提出</span><span className="axis">接收</span><span className="axis">完成</span>
          {demand.departments.map((row) => (
            <React.Fragment key={row.department}>
              <span className="row-label">{row.department}</span>
              <span className="heat-cell hot">{row.proposed}</span>
              <span className={`heat-cell ${row.accepted > 55 ? "warn" : "good"}`}>{row.accepted}</span>
              <span className={`heat-cell ${row.completed < 30 ? "hot" : "good"}`}>{row.completed}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResourcePanel({ workload, projects }) {
  return (
    <section className="panel resource-panel">
      <PanelHead title="资源投入情况" subtitle="人力与资金拆成两个决策图" />
      <div className="resource-stack">
        <div>
          <div className="subhead"><strong>人力投入：部门 × 本月周负荷热力</strong><span>峰值负荷</span></div>
          <div className="workload-grid">
            <span />
            {["W1", "W2", "W3", "W4", "W5"].map((week) => <span className="axis" key={week}>{week}</span>)}
            {workload.slice(0, 6).map((row) => (
              <React.Fragment key={row.department}>
                <span className="row-label">{row.department}</span>
                {row.weeks.map((value, index) => (
                  <span className={`heat-cell ${classForValue(value)}`} key={`${row.department}-${index}`}>{value}%</span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div>
          <div className="subhead"><strong>资金投入：项目级预算执行与预测偏差</strong><span>黄线=完工预测，白线=预算</span></div>
          <div className="cost-layout">
            <div className="project-spend">
              <span className="axis">项目</span><span className="axis">预算执行</span><span className="axis right">投入</span><span className="axis">风险</span>
              {projects.slice(0, 6).map((project) => (
                <React.Fragment key={project.name}>
                  <span className="row-label">{project.name}</span>
                  <span className="budget-bar">
                    <i className={`actual ${project.forecast > project.budget ? "bad" : ""}`} style={{ width: `${Math.min(100, (project.actual / project.budget) * 100)}%` }} />
                    <i className="forecast" style={{ width: `${Math.min(130, (project.forecast / project.budget) * 100)}%` }} />
                    <i className="budget-line" />
                  </span>
                  <span className="money">{project.actual}万</span>
                  <span className={`status ${project.riskLevel === "critical" ? "bad" : project.riskLevel === "high" ? "warn" : ""}`}>{project.status}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GanttPanel({ projects, month, onPrev, onNext }) {
  return (
    <section className="panel gantt-panel">
      <PanelHead
        title="本月交付路线图"
        subtitle="关键项目月度甘特，支持拖动上月/下月"
        action={<div className="month-nav"><button onClick={onPrev} aria-label="上个月"><ChevronLeft size={16} /></button><span>{month}</span><button onClick={onNext} aria-label="下个月"><ChevronRight size={16} /></button></div>}
      />
      <div className="gantt-scale"><span /><span>5/1</span><span>5/8</span><span>5/15</span><span>5/22</span><span>5/29</span><span /></div>
      <div className="gantt-list">
        {projects.slice(0, 6).map((project) => (
          <div className="gantt-row" key={project.name}>
            <span className="row-label">{project.name}</span>
            <span className="timeline">
              <i className="today" />
              <i className={`task ${project.riskLevel === "critical" ? "bad" : project.status === "临界" ? "warn" : project.status === "已交付" ? "green" : ""}`} style={{ left: `${project.start}%`, width: `${Math.max(14, project.end - project.start)}%` }} />
            </span>
            <span className={`status ${project.riskLevel === "critical" ? "bad" : project.status === "临界" ? "warn" : ""}`}>{project.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RiskPanel({ risks }) {
  return (
    <section className="panel risk-panel">
      <PanelHead title="风险解读" subtitle="董事长管理洞察卡，从需求、资源、甘特自动归因" />
      <div className="risk-grid">
        {risks.slice(0, 3).map((risk) => (
          <article className={`risk-card ${riskClass(risk.tone)}`} key={risk.title}>
            <h3>{risk.title}</h3>
            <p>{risk.text}</p>
            <div className="tag-row">
              {risk.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PanelHead({ title, subtitle, action }) {
  return (
    <header className="panel-head">
      <div><strong>{title}</strong><span>{subtitle}</span></div>
      {action ?? <div className="seg"><i /><i /><i /></div>}
    </header>
  );
}

function App() {
  const [department, setDepartment] = useState("全部部门");
  const [monthIndex, setMonthIndex] = useState(0);
  const months = ["2026-04", "2026-05", "2026-06"];
  const month = months[monthIndex + 1];
  const data = useMemo(() => getDashboardData(department, month), [department, month]);

  return (
    <main className="page-shell">
      <section className="desktop-board">
        <header className="board-top">
          <div>
            <h1>IT 项目驾驶舱</h1>
            <p>更新时间：2026-05-27 22:22 · 默认本月 · 数据为原型 MOCK</p>
          </div>
          <div className="filter-row">
            {departments.slice(0, 6).map((item) => (
              <button className={department === item ? "active" : ""} onClick={() => setDepartment(item)} key={item}>{item}</button>
            ))}
          </div>
        </header>
        <div className="kpi-grid">
          <KpiCard label="需求提出总量" value={data.metrics.totalDemand} hint="较上月 +12%" />
          <KpiCard label="已接收需求" value={data.metrics.acceptedDemand} hint={`接收率 ${data.demand.acceptRate}%`} />
          <KpiCard label="已完成需求" value={data.metrics.completedDemand} hint={`端到端 ${data.demand.endToEndRate}%`} />
          <KpiCard label="投入人月" value={data.metrics.peopleMonths} hint={`峰值负荷 ${data.metrics.peakWorkload}%`} warning />
          <KpiCard label="已投入资金" value={money(data.metrics.actualSpend)} hint={`预测超支 ${money(data.metrics.forecastOverrun)}`} warning />
          <KpiCard label="高风险项目" value={data.metrics.highRiskProjects} hint="需拍板 3 项" warning />
        </div>
        <div className="dashboard-grid">
          <DemandPanel demand={data.demand} />
          <ResourcePanel workload={data.workload} projects={data.projects} />
          <GanttPanel projects={data.projects} month={month} onPrev={() => setMonthIndex((value) => Math.max(-1, value - 1))} onNext={() => setMonthIndex((value) => Math.min(1, value + 1))} />
          <RiskPanel risks={data.risks} />
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
