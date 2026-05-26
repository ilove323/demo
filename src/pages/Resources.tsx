import { useState } from "react";
import { projectInvestmentBreakdowns, resourceCalendars, resourcePeople, resourceRequests, supplierBudgets } from "../data";
import { projects } from "../data";
import { GanttTimeline } from "../components/GanttTimeline";
import { buildResourceGanttGroups, buildResourceRiskAlerts } from "../gantt";
import type { DemandProjectFlow, ResourcePerson } from "../types";
import { ScheduleCalendar } from "../components/ScheduleCalendar";
import { MetricCard, Modal, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";

export function Resources({ flows }: { flows: DemandProjectFlow[] }) {
  const [selectedPerson, setSelectedPerson] = useState<ResourcePerson | null>(null);
  const [calendarPerson, setCalendarPerson] = useState<ResourcePerson | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "card" | "gantt">("card");
  const totalAssigned = resourcePeople.reduce((sum, person) => sum + person.assigned, 0);
  const totalCapacity = resourcePeople.reduce((sum, person) => sum + person.capacity, 0);
  const totalContract = supplierBudgets.reduce((sum, item) => sum + item.contract, 0);
  const totalUsed = supplierBudgets.reduce((sum, item) => sum + item.used, 0);
  const resourceGanttGroups = buildResourceGanttGroups(resourcePeople, resourceCalendars, projects);
  const resourceRiskAlerts = buildResourceRiskAlerts(resourcePeople);

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>资源与预算</h1>
        </div>
      </div>
      <div className="grid-4">
        <MetricCard label="资源负载" value={`${Math.round((totalAssigned / totalCapacity) * 100)}%`} delta={`${totalAssigned}/${totalCapacity} 人时`} tone="cyan" />
        <MetricCard label="资源申请" value={String(resourceRequests.length)} delta="1 项待审批" tone="orange" />
        <MetricCard label="外采合同" value={`${Math.round(totalContract / 10000)}万`} delta={`已使用 ${Math.round(totalUsed / 10000)}万`} tone="violet" />
        <MetricCard label="高负载人员" value="2" delta="可穿透查看占用来源" tone="red" />
      </div>
      <div className="panel">
        <SectionHeader
          eyebrow="RESOURCE POOL"
          title="人员资源池"
          action={
            <div className="section-actions">
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>
          }
        />
        {viewMode === "gantt" ? (
          <div className="resource-gantt-layout">
            <GanttTimeline groups={resourceGanttGroups} />
            <aside className="resource-risk-panel">
              <SectionHeader eyebrow="RESOURCE RISK" title="资源风险提示" />
              {resourceRiskAlerts.map((alert) => (
                <article className={`risk-alert tone-${alert.tone}`} key={alert.id}>
                  <div>
                    <strong>{alert.title}</strong>
                    <StatusTag tone={alert.tone}>{alert.status}</StatusTag>
                  </div>
                  <p>{alert.body}</p>
                </article>
              ))}
            </aside>
          </div>
        ) : viewMode === "list" ? (
          <table className="data-table">
            <thead><tr><th>人员</th><th>角色</th><th>技能栈</th><th>可用/已分配</th><th>负载</th></tr></thead>
            <tbody>
              {resourcePeople.map((person) => (
                <tr className="clickable" key={person.name} onClick={() => setSelectedPerson(person)}>
                  <td><strong>{person.name}</strong><div className="muted-text">{person.allocations.length} 个项目/工作占用</div></td>
                  <td>{person.role}</td>
                  <td><ul className="pill-list">{person.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul></td>
                  <td>{person.assigned} / {person.capacity}h</td>
                  <td><ProgressBar value={Math.round((person.assigned / person.capacity) * 100)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="entity-card-grid">
            {resourcePeople.map((person) => (
              <button className="entity-card person-card" key={person.name} onClick={() => setSelectedPerson(person)}>
                <div className="entity-card-head">
                  <span>{person.role}</span>
                  <StatusTag tone={person.assigned > person.capacity ? "red" : person.assigned / person.capacity > 0.85 ? "orange" : "green"}>
                    {person.assigned > person.capacity ? "超负荷" : "可承接"}
                  </StatusTag>
                </div>
                <strong>{person.name}</strong>
                <ul className="pill-list">{person.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
                <div className="compact-grid">
                  <span>本周：{person.assigned} / {person.capacity}h</span>
                  <span>占用：{person.allocations.length} 项</span>
                  <span>主项目：{person.allocations[0]?.project ?? "暂无"}</span>
                  <span>工作：{person.allocations[0]?.work ?? "暂无"}</span>
                </div>
                <div className="progress-cell">
                  <ProgressBar value={Math.round((person.assigned / person.capacity) * 100)} />
                  <span>{Math.round((person.assigned / person.capacity) * 100)}%</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="panel">
        <SectionHeader eyebrow="INVESTMENT" title="项目投入拆解" />
        <table className="data-table">
          <thead><tr><th>项目</th><th>内部投入</th><th>外部金额</th><th>供应商分工</th><th>业务方参与</th><th>状态</th></tr></thead>
          <tbody>
            {projectInvestmentBreakdowns.map((item) => (
              <tr key={item.project}>
                <td><strong>{item.project}</strong></td>
                <td>{item.internalDays} 人天</td>
                <td>{money(item.supplierCost)}</td>
                <td>{item.supplierRole}</td>
                <td>{item.businessRole}</td>
                <td><StatusTag tone={toneForStatus(item.status)}>{item.status}</StatusTag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid-2">
        <div className="panel">
          <SectionHeader eyebrow="REQUEST" title="资源申请" />
          <table className="data-table">
            <thead><tr><th>项目</th><th>申请人</th><th>需求</th><th>状态</th></tr></thead>
            <tbody>
              {resourceRequests.map((request) => (
                <tr key={request.id}><td>{request.project}</td><td>{request.requester}</td><td>{request.need} · {request.days}天</td><td><StatusTag tone={toneForStatus(request.status)}>{request.status}</StatusTag></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <SectionHeader eyebrow="FLOW RESOURCE" title="转项目资源安排" />
          <table className="data-table">
            <thead><tr><th>流程</th><th>申请内容</th><th>项目经理安排</th><th>负载/冲突</th></tr></thead>
            <tbody>
              {flows.map((flow) => (
                <tr key={flow.id}>
                  <td><strong>{flow.title}</strong><div className="muted-text">{flow.resourceRequest.status} · {flow.resourceRequest.window}</div></td>
                  <td>{flow.resourceRequest.need} · {flow.resourceRequest.days}天</td>
                  <td>{flow.assignments.map((assignment) => `${assignment.person} ${assignment.hours}h`).join(" / ")}</td>
                  <td>{flow.assignments.map((assignment) => assignment.conflict).join(" / ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid-2">
        <div className="panel">
          <SectionHeader eyebrow="SUPPLIER" title="供应商交付与预算管理" />
          <table className="data-table">
            <thead><tr><th>供应商</th><th>项目</th><th>项目经理</th><th>合同/已用</th><th>交付状态</th><th>风险</th><th>付款</th></tr></thead>
            <tbody>
              {supplierBudgets.map((item) => (
                <tr key={item.supplier}>
                  <td>{item.supplier}</td>
                  <td>{item.project}</td>
                  <td>{item.manager}</td>
                  <td>{money(item.used)} / {money(item.contract)}</td>
                  <td>{item.deliveryStatus}</td>
                  <td><StatusTag tone={toneForStatus(item.riskStatus)}>{item.riskStatus}</StatusTag></td>
                  <td>{item.payment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={selectedPerson ? `${selectedPerson.name} 的占用明细` : ""} open={Boolean(selectedPerson)} onClose={() => setSelectedPerson(null)} size="wide">
        {selectedPerson ? (
          <>
            <div className="detail-list">
              <div><span>角色</span><strong>{selectedPerson.role}</strong></div>
              <div><span>本周负载</span><strong>{selectedPerson.assigned} / {selectedPerson.capacity}h</strong></div>
              <div><span>负载状态</span><strong>{selectedPerson.assigned > selectedPerson.capacity ? "超负荷" : "正常"}</strong></div>
            </div>
            <SectionHeader title="技能栈" />
            <ul className="pill-list">{selectedPerson.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
            <SectionHeader title="项目与工作占用" />
            <div className="allocation-list">
              {selectedPerson.allocations.map((allocation) => (
                <article className="allocation-card" key={`${allocation.project}${allocation.work}`}>
                  <div>
                    <strong>{allocation.project}</strong>
                    <StatusTag tone={toneForStatus(allocation.status)}>{allocation.status}</StatusTag>
                  </div>
                  <p>{allocation.work}</p>
                  <div className="progress-cell">
                    <ProgressBar value={Math.round((allocation.hours / selectedPerson.capacity) * 100)} />
                    <span>{allocation.hours}h</span>
                  </div>
                </article>
              ))}
            </div>
            <div className="split-actions">
              <button className="btn" onClick={() => { setCalendarPerson(selectedPerson); setSelectedPerson(null); }}>查看排期日历</button>
            </div>
          </>
        ) : null}
      </Modal>
      <Modal title={calendarPerson ? `${calendarPerson.name} 的排期日历` : ""} open={Boolean(calendarPerson)} onClose={() => setCalendarPerson(null)} size="wide">
        {calendarPerson ? (
          <ScheduleCalendar
            title="人员排期日历"
            subtitle={`${calendarPerson.name} · 上行显示 task，下行显示所属项目`}
            entries={resourceCalendars.filter((entry) => entry.person === calendarPerson.name)}
          />
        ) : null}
      </Modal>
    </section>
  );
}

function money(value: number) {
  return `${Math.round(value / 10000)}万`;
}

function ViewToggle({
  value,
  onChange
}: {
  value: "list" | "card" | "gantt";
  onChange: (value: "list" | "card" | "gantt") => void;
}) {
  return (
    <div className="view-toggle">
      <button className={value === "card" ? "selected" : ""} onClick={() => onChange("card")}>卡片</button>
      <button className={value === "list" ? "selected" : ""} onClick={() => onChange("list")}>列表</button>
      <button className={value === "gantt" ? "selected" : ""} onClick={() => onChange("gantt")}>甘特</button>
    </div>
  );
}
