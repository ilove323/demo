import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { Demand, Priority, Project, Tone } from "../types";
import { FilterPanel } from "../components/FilterPanel";
import { MetricIcon, Modal, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";

const priorities: Priority[] = ["P0", "P1", "P2", "P3"];
type WorkbenchFilter = "all" | "solution" | "running" | "acceptance";

export function Demands({
  demands,
  projects = [],
  showRequesterWorkbench = false,
  canAdjustPriority = true,
  canCreateDemand = false,
  onPriorityChange,
  onOpenDetail
}: {
  demands: Demand[];
  projects?: Project[];
  showRequesterWorkbench?: boolean;
  canAdjustPriority?: boolean;
  canCreateDemand?: boolean;
  onPriorityChange: (id: string, priority: Priority) => void;
  onOpenDetail: (id: string) => void;
}) {
  const [status, setStatus] = useState("全部状态");
  const [priority, setPriority] = useState("全部优先级");
  const [implementation, setImplementation] = useState("全部实现方式");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [keyword, setKeyword] = useState("");
  const [workbenchFilter, setWorkbenchFilter] = useState<WorkbenchFilter>("all");
  const [creating, setCreating] = useState(false);

  const runningProjectDemandIds = useMemo(
    () => new Set(projects.filter((project) => project.stage === "项目进行").map((project) => project.demandId)),
    [projects]
  );
  const projectCompleteDemandIds = useMemo(
    () => new Set(projects.filter((project) => project.stage === "项目完成").map((project) => project.demandId)),
    [projects]
  );

  const activeFilterCount = [
    keyword.trim(),
    status !== "全部状态",
    priority !== "全部优先级",
    implementation !== "全部实现方式",
    workbenchFilter !== "all"
  ].filter(Boolean).length;

  const workbenchCards = useMemo(
    () => buildRequesterWorkbenchCards(demands, projects, runningProjectDemandIds),
    [demands, projects, runningProjectDemandIds]
  );

  const filtered = useMemo(
    () =>
      demands.filter((demand) => {
        const matchWorkbench =
          workbenchFilter === "all" ||
          (workbenchFilter === "solution" && demand.status === "方案确认") ||
          (workbenchFilter === "running" && runningProjectDemandIds.has(demand.id)) ||
          (workbenchFilter === "acceptance" && projectCompleteDemandIds.has(demand.id));
        const matchStatus = status === "全部状态" || demand.status === status;
        const matchPriority = priority === "全部优先级" || demand.priority === priority;
        const matchImplementation = implementation === "全部实现方式" || demand.implementation === implementation;
        const matchKeyword = `${demand.name}${demand.team}${demand.handler}`.includes(keyword);
        return matchWorkbench && matchStatus && matchPriority && matchImplementation && matchKeyword;
      }),
    [demands, implementation, keyword, priority, projectCompleteDemandIds, runningProjectDemandIds, status, workbenchFilter]
  );

  const resetFilters = () => {
    setKeyword("");
    setStatus("全部状态");
    setPriority("全部优先级");
    setImplementation("全部实现方式");
    setWorkbenchFilter("all");
  };

  const applyWorkbenchFilter = (nextFilter: WorkbenchFilter) => {
    setWorkbenchFilter(nextFilter);
    setKeyword("");
    setStatus("全部状态");
    setPriority("全部优先级");
    setImplementation("全部实现方式");
  };

  const clearWorkbenchFilter = () => {
    if (workbenchFilter !== "all") {
      setWorkbenchFilter("all");
    }
  };

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>需求管理</h1>
        </div>
        {canCreateDemand ? (
          <button className="btn" onClick={() => setCreating(true)}>
            <Plus size={16} /> 新建需求
          </button>
        ) : null}
      </div>

      {showRequesterWorkbench ? (
        <div className="requester-workbench">
          <SectionHeader title="需求方工作台" />
          <div className="grid-4">
            {workbenchCards.map((card) => (
              <button
                className={`metric-card metric-button tone-${card.tone}${workbenchFilter === card.filter ? " selected" : ""}`}
                key={card.filter}
                onClick={() => applyWorkbenchFilter(card.filter)}
              >
                <div className="metric-card-head">
                  <span className="metric-card-label">{card.label}</span>
                  <MetricIcon label={card.label} tone={card.tone} />
                </div>
                <strong>{card.value}</strong>
                <small>{card.delta}</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="panel">
        <FilterPanel title="需求筛选" summary={`显示 ${filtered.length} / ${demands.length} 条需求`} activeCount={activeFilterCount}>
          <div className="filter-bar">
            <input placeholder="搜索需求、团队、处理人" value={keyword} onChange={(event) => { clearWorkbenchFilter(); setKeyword(event.target.value); }} />
            <select value={status} onChange={(event) => { clearWorkbenchFilter(); setStatus(event.target.value); }}>
              {["全部状态", "需求评审", "方案确认", "已打回", "已放弃"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select value={priority} onChange={(event) => { clearWorkbenchFilter(); setPriority(event.target.value); }}>
              {["全部优先级", ...priorities].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select value={implementation} onChange={(event) => { clearWorkbenchFilter(); setImplementation(event.target.value); }}>
              {["全部实现方式", "内部实现", "外部供应商", "合作实现"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button className="btn secondary" onClick={resetFilters} disabled={activeFilterCount === 0}>清空筛选</button>
          </div>
        </FilterPanel>
      </div>

      <div className="panel">
        <SectionHeader title="需求列表" action={<ViewToggle value={viewMode} onChange={setViewMode} />} />
        {viewMode === "list" ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>需求</th>
                <th>优先级</th>
	                <th>状态</th>
	                <th>处理人</th>
	                <th>进度</th>
	                <th>关联项目名</th>
	                <th>关联项目进展</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((demand) => {
                const linkedProject = findLinkedProject(demand, projects);
                return (
                <tr className="clickable" key={demand.id} onClick={() => onOpenDetail(demand.id)}>
                  <td>
                    <strong>{demand.name}</strong>
                    <div className="muted-text">{demand.id} · {demand.team} · {demand.implementation}</div>
                  </td>
                  <td>
                    {canAdjustPriority ? (
                      <select
                        className="inline-select"
                        value={demand.priority}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => onPriorityChange(demand.id, event.target.value as Priority)}
                      >
                        {priorities.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    ) : (
                      <StatusTag tone={demand.priority === "P0" ? "red" : demand.priority === "P1" ? "orange" : "gray"}>{demand.priority}</StatusTag>
                    )}
                  </td>
	                  <td><StatusTag tone={toneForStatus(demand.status)}>{demand.status}</StatusTag></td>
	                  <td>{demand.handler}</td>
	                  <td>
	                    {linkedProject ? (
	                      <div className="progress-cell">
	                        <ProgressBar value={demand.progress} />
	                        <span>{demand.progress}%</span>
	                      </div>
	                    ) : (
	                      <span className="muted-text">未关联项目</span>
	                    )}
	                  </td>
	                  <td>{linkedProject?.name ?? "未关联项目"}</td>
	                  <td>{linkedProjectProgress(demand, linkedProject)}</td>
                </tr>
              );
              })}
            </tbody>
          </table>
        ) : (
          <div className="entity-card-grid">
            {filtered.map((demand) => {
              const linkedProject = findLinkedProject(demand, projects);
              return (
              <button className="entity-card demand-card compact-entity-card" key={demand.id} onClick={() => onOpenDetail(demand.id)}>
                <div className="entity-card-head">
                  <span>{demand.id}</span>
	                  <StatusTag tone={toneForStatus(demand.status)}>{demand.status}</StatusTag>
                </div>
                <strong>{demand.name}</strong>
                <div className="card-meta">
                  <StatusTag tone={demand.priority === "P0" ? "red" : demand.priority === "P1" ? "orange" : "gray"}>{demand.priority}</StatusTag>
                  <StatusTag tone={demand.implementation === "合作实现" ? "blue" : demand.implementation === "内部实现" ? "cyan" : "violet"}>{demand.implementation}</StatusTag>
                </div>
                <div className="compact-grid">
                  <span>团队：{demand.team}</span>
                  <span>处理：{demand.handler}</span>
	                  <span>关联项目：{linkedProject?.name ?? "未关联项目"}</span>
	                  <span>项目进展：{linkedProjectProgress(demand, linkedProject)}</span>
                  <span>评分：{demand.acceptanceReview ? `${demand.acceptanceReview.score}/5` : "待评分"}</span>
                </div>
	                {linkedProject ? (
	                  <div className="progress-cell">
	                    <ProgressBar value={demand.progress} />
	                    <span>{demand.progress}%</span>
	                  </div>
	                ) : null}
	              </button>
            );
            })}
          </div>
        )}
      </div>

      <Modal title="新建业务需求" open={creating} onClose={() => setCreating(false)}>
        <div className="form-grid">
          <label>需求名称<input defaultValue="GxP 培训记录查询优化" /></label>
          <label>业务目标<input defaultValue="提高培训记录检索效率，支撑审计检查" /></label>
          <label>优先级<select defaultValue="P1"><option>P0</option><option>P1</option><option>P2</option><option>P3</option></select></label>
          <label>期望上线<input type="date" defaultValue="2026-06-30" /></label>
          <label className="wide">需求描述<textarea defaultValue="业务部门希望按员工、SOP、培训批次快速查询培训完成情况，并保留审计追踪。" /></label>
          <label className="wide">附件上传区域<input value="需求说明.docx / 审计检查样例.xlsx" readOnly /></label>
        </div>
        <div className="split-actions">
          <button className="btn secondary" onClick={() => setCreating(false)}>取消</button>
          <button className="btn" onClick={() => setCreating(false)}>提交需求</button>
        </div>
      </Modal>
    </section>
  );
}

function buildRequesterWorkbenchCards(demands: Demand[], projects: Project[], runningProjectDemandIds: Set<string>) {
  const visibleDemandIds = new Set(demands.map((demand) => demand.id));
  const pendingSolutions = demands.filter((demand) => demand.status === "方案确认");
  const runningProjectDemands = demands.filter((demand) => runningProjectDemandIds.has(demand.id));
  const pendingAcceptanceProjects = projects.filter((project) => project.stage === "项目完成" && visibleDemandIds.has(project.demandId));
  const firstRunningProject = projects.find((project) => project.stage === "项目进行" && visibleDemandIds.has(project.demandId));

  return [
    {
      filter: "all",
      label: "我的需求",
      value: String(demands.length),
      delta: `${runningProjectDemands.length} 个进行中`,
      tone: "blue"
    },
    {
      filter: "solution",
      label: "待确认方案",
      value: String(pendingSolutions.length),
      delta: pendingSolutions[0]?.name ?? "暂无待确认方案",
      tone: pendingSolutions.length > 0 ? "orange" : "gray"
    },
    {
      filter: "running",
      label: "进行中项目",
      value: String(runningProjectDemands.length),
      delta: firstRunningProject?.name ?? runningProjectDemands[0]?.name ?? "暂无进行中项目",
      tone: runningProjectDemands.length > 0 ? "cyan" : "gray"
    },
    {
      filter: "acceptance",
      label: "待验收",
      value: String(pendingAcceptanceProjects.length),
      delta: pendingAcceptanceProjects[0]?.name ?? "暂无待验收项目",
      tone: pendingAcceptanceProjects.length > 0 ? "green" : "gray"
    }
  ] satisfies { filter: WorkbenchFilter; label: string; value: string; delta: string; tone: Tone }[];
}

function ViewToggle({
  value,
  onChange
}: {
  value: "list" | "card";
  onChange: (value: "list" | "card") => void;
}) {
  return (
    <div className="view-toggle">
      <button className={value === "list" ? "selected" : ""} onClick={() => onChange("list")}>列表</button>
      <button className={value === "card" ? "selected" : ""} onClick={() => onChange("card")}>卡片</button>
    </div>
  );
}

function findLinkedProject(demand: Demand, projects: Project[]) {
  return projects.find((project) => project.demandId === demand.id || project.name === demand.linkedProject);
}

function linkedProjectProgress(demand: Demand, linkedProject?: Project) {
  if (linkedProject) return `项目阶段：${linkedProject.stage}，计划完成：${projectCompletionDate(linkedProject, demand.targetDate)}`;
  if (demand.status === "需求评审") return "产品经理评审";
  if (demand.status === "方案确认") return "方案已确认，未关联项目，待产品经理预创建";
  if (demand.status === "已打回") return "补充需求后再提交";
  if (demand.status === "已放弃") return "查看关闭记录";
  return "关注状态变化";
}

function projectCompletionDate(project: Project, fallbackDate: string) {
  const dates = project.milestones
    .map((milestone) => milestone.date)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return dates.at(-1) ?? fallbackDate;
}
