import { useMemo, useState } from "react";
import { FilterPanel } from "../components/FilterPanel";
import { GanttTimeline } from "../components/GanttTimeline";
import { buildProjectGanttGroups } from "../gantt";
import { projectDeliveryProgress } from "../projectProgress";
import type { DeliveryRequest, Demand, DemandProjectFlow, FlowActionId, FlowActionLog, FlowBoardAction, Project, ProjectActionLog, ProjectStage, RoleId, RoleOption, Task, TaskPresetFilter, Tone } from "../types";
import { MetricIcon, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";

const allOption = "全部";
const projectStageOptions: ProjectStage[] = ["项目准备", "项目启动", "项目进行", "项目完成", "项目结束"];
type PmWorkbenchFilter = "all" | "prepare" | "start" | "running" | "complete" | "risk";

export function Projects({
  demands,
  projects,
  tasks,
  flows,
  deliveryRequests,
  activeRole,
  activeUser,
  flowActionLogs,
  projectActionLogs,
  onApplyFlowAction,
  onAssignWork,
  onUpdateProjectRecord,
  onAdvanceProjectStage,
  onOpenTaskFilter,
  onOpenDetail
}: {
  demands: Demand[];
  projects: Project[];
  tasks: Task[];
  flows: DemandProjectFlow[];
  deliveryRequests: DeliveryRequest[];
  activeRole: RoleId;
  activeUser: RoleOption;
  flowActionLogs: FlowActionLog[];
  projectActionLogs: ProjectActionLog[];
  onApplyFlowAction: (flowId: string, actionId: FlowActionId, note?: string) => void;
  onAssignWork: (targetUserName: string, relatedType: "demand" | "project" | "task" | "resource" | "flow", relatedId: string, summary: string) => void;
  onUpdateProjectRecord: (projectId: string, patch: Partial<Project>, summary: string) => void;
  onAdvanceProjectStage: (projectId: string, nextStage?: ProjectStage) => void;
  onOpenTaskFilter: (filter: Omit<TaskPresetFilter, "nonce">) => void;
  onOpenDetail: (projectId: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"list" | "card" | "gantt">("gantt");
  const [pmWorkbenchFilter, setPmWorkbenchFilter] = useState<PmWorkbenchFilter>("all");
  const [filters, setFilters] = useState({
    keyword: "",
    projectType: allOption,
    implementation: allOption,
    stage: allOption,
    risk: allOption,
    owner: allOption,
    supplierManager: allOption
  });
  const visibleProjects = useMemo(() => getVisibleProjects(projects, tasks, demands, activeRole, activeUser), [activeRole, activeUser, demands, projects, tasks]);
  const productOwnerOptions = useMemo(() => unique(visibleProjects.map((project) => productOwnerForProject(project, deliveryRequests, demands))), [deliveryRequests, demands, visibleProjects]);
  const supplierManagerOptions = useMemo(() => unique(visibleProjects.map((project) => project.supplierManager)), [visibleProjects]);
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const pmWorkbenchCards = useMemo(() => buildPmWorkbenchCards(visibleProjects, tasks), [tasks, visibleProjects]);
  const filteredProjects = useMemo(
    () =>
      visibleProjects.filter((project) => {
        const keyword = filters.keyword.trim().toLowerCase();
        const matchesKeyword =
          !keyword ||
          [
            project.id,
            project.name,
            project.demandId,
            productOwnerForProject(project, deliveryRequests, demands),
            project.supplierManager,
            project.projectType,
            project.implementation,
            project.stage,
            project.risk,
            project.riskReason,
            project.riskResponse,
            project.aiScore.recommendation,
            String(project.aiScore.total),
            String(project.aiScore.businessValue),
            String(project.aiScore.urgency),
            String(project.aiScore.feasibility),
            ...project.aiScore.reasons,
            ...project.resources,
            ...project.taskIds.map((taskId) => taskById.get(taskId)?.title ?? taskId),
            ...project.contributions.flatMap((item) => [item.party, item.type, item.responsibility, item.status])
          ].some((value) => value.toLowerCase().includes(keyword));
        return (
          matchesPmWorkbench(project, pmWorkbenchFilter) &&
          matchesKeyword &&
          matchesSelect(project.projectType, filters.projectType) &&
          matchesSelect(project.implementation, filters.implementation) &&
          matchesSelect(project.stage, filters.stage) &&
          matchesSelect(project.risk, filters.risk) &&
          matchesSelect(productOwnerForProject(project, deliveryRequests, demands), filters.owner) &&
          matchesSelect(project.supplierManager, filters.supplierManager)
        );
      }),
    [deliveryRequests, demands, filters, pmWorkbenchFilter, taskById, visibleProjects]
  );
  const projectGanttGroups = useMemo(() => buildProjectGanttGroups(filteredProjects, tasks, demands), [demands, filteredProjects, tasks]);
  const activeFilterCount = countActiveFilters(filters, {
    keyword: "",
    projectType: allOption,
    implementation: allOption,
    stage: allOption,
    risk: allOption,
    owner: allOption,
    supplierManager: allOption
  }) + (pmWorkbenchFilter === "all" ? 0 : 1);
  const resetFilters = () => {
    setPmWorkbenchFilter("all");
    setFilters({
      keyword: "",
      projectType: allOption,
      implementation: allOption,
      stage: allOption,
      risk: allOption,
      owner: allOption,
      supplierManager: allOption
    });
  };
  const applyPmWorkbenchFilter = (nextFilter: PmWorkbenchFilter) => {
    setPmWorkbenchFilter(nextFilter);
    setFilters({
      keyword: "",
      projectType: allOption,
      implementation: allOption,
      stage: allOption,
      risk: allOption,
      owner: allOption,
      supplierManager: allOption
    });
  };

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>项目管理</h1>
        </div>
        <StatusTag tone="blue">内部 + 供应商 + 业务方协作视图</StatusTag>
      </div>

      {activeRole === "pm" ? (
        <div className="requester-workbench">
          <SectionHeader title="项目经理工作台" />
          <div className="grid-4 pm-workbench-grid">
            {pmWorkbenchCards.map((card) => (
              <button
                className={`metric-card metric-button tone-${card.tone}${pmWorkbenchFilter === card.filter ? " selected" : ""}`}
                key={card.filter}
                onClick={() => applyPmWorkbenchFilter(card.filter)}
                type="button"
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
        <SectionHeader eyebrow="PROJECTS" title="项目视图" action={<ViewToggle value={viewMode} onChange={setViewMode} />} />
        <FilterPanel title="项目筛选" summary={`显示 ${filteredProjects.length} / ${visibleProjects.length} 个项目`} activeCount={activeFilterCount}>
          <div className="filter-bar">
            <input
              aria-label="按项目、需求、产品经理搜索"
              placeholder="搜索项目 / 需求 / 产品经理 / 供应商"
              value={filters.keyword}
              onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
            />
            <select value={filters.projectType} onChange={(event) => setFilters((current) => ({ ...current, projectType: event.target.value }))}>
              <option value={allOption}>全部项目类型</option>
              {unique(visibleProjects.map((project) => project.projectType)).map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <select value={filters.implementation} onChange={(event) => setFilters((current) => ({ ...current, implementation: event.target.value }))}>
              <option value={allOption}>全部协作模式</option>
              {unique(visibleProjects.map((project) => project.implementation)).map((implementation) => (
                <option key={implementation} value={implementation}>{implementation}</option>
              ))}
            </select>
            <select value={filters.stage} onChange={(event) => setFilters((current) => ({ ...current, stage: event.target.value }))}>
              <option value={allOption}>全部阶段</option>
              {projectStageOptions.filter((stage) => visibleProjects.some((project) => project.stage === stage)).map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </select>
            <select value={filters.risk} onChange={(event) => setFilters((current) => ({ ...current, risk: event.target.value }))}>
              <option value={allOption}>全部风险</option>
              {unique(visibleProjects.map((project) => project.risk)).map((risk) => <option key={risk} value={risk}>{risk}</option>)}
            </select>
            <select value={filters.owner} onChange={(event) => setFilters((current) => ({ ...current, owner: event.target.value }))}>
              <option value={allOption}>全部产品经理</option>
              {productOwnerOptions.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
            </select>
            <select value={filters.supplierManager} onChange={(event) => setFilters((current) => ({ ...current, supplierManager: event.target.value }))}>
              <option value={allOption}>全部供应商负责人</option>
              {supplierManagerOptions.map((manager) => <option key={manager} value={manager}>{manager}</option>)}
            </select>
            <button className="btn secondary" onClick={resetFilters}>清空筛选</button>
          </div>
        </FilterPanel>
        {viewMode === "gantt" ? (
          <GanttTimeline
            groups={projectGanttGroups}
            onBarClick={(bar) => {
              const project = filteredProjects.find((item) => item.id === bar.targetId || bar.id.startsWith(item.id));
              if (project) onOpenDetail(project.id);
            }}
          />
        ) : viewMode === "list" ? (
          <div className="table-scroll">
            <table className="project-overview-table">
              <thead>
                <tr>
                  <th>项目名称</th>
                  <th>当前阶段</th>
                  <th>状态</th>
                  <th>整体进度</th>
                  <th>参与成员</th>
                  <th>计划完成</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, index) => {
                  const deliveryProgress = projectDeliveryProgress(project);
                  const demand = demands.find((item) => item.id === project.demandId);
                  return (
                    <tr className="clickable" key={project.id} onClick={() => onOpenDetail(project.id)}>
                      <td>
                        <div className="project-name-cell">
                          <span className={`project-dot tone-${projectAccentTone(project, index)}`} />
                          <strong>{project.name}</strong>
                        </div>
                      </td>
                      <td>
                        <span className={`phase-pill tone-${projectAccentTone(project, index)}`}>
                          {projectPhaseText(project)}
                        </span>
                      </td>
                      <td><StatusTag tone={projectStatusTone(project)}>{projectStatusLabel(project)}</StatusTag></td>
                      <td>
                        <div className="project-progress-inline">
                          <ProgressBar value={deliveryProgress} />
                          <span>{deliveryProgress}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="member-pills">
                          {projectMembers(project, tasks, deliveryRequests, demands).map((member) => <span key={member}>{member}</span>)}
                        </div>
                      </td>
                      <td>{demand?.targetDate ?? project.milestones.at(-1)?.date ?? "-"}</td>
                      <td className="project-remark">{projectRemark(project)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="project-overview-card-grid">
            {filteredProjects.map((project, index) => {
              const deliveryProgress = projectDeliveryProgress(project);
              const demand = demands.find((item) => item.id === project.demandId);
              return (
                <button className="project-overview-card" key={project.id} onClick={() => onOpenDetail(project.id)}>
                  <div className="project-overview-card-head">
                    <span className={`project-dot tone-${projectAccentTone(project, index)}`} />
                    <strong>{project.name}</strong>
                    <StatusTag tone={projectStatusTone(project)}>{projectStatusLabel(project)}</StatusTag>
                  </div>
                  <span className={`phase-pill tone-${projectAccentTone(project, index)}`}>{projectPhaseText(project)}</span>
                  <div className="project-progress-inline">
                    <ProgressBar value={deliveryProgress} />
                    <span>{deliveryProgress}%</span>
                  </div>
                  <div className="member-pills">
                    {projectMembers(project, tasks, deliveryRequests, demands).map((member) => <span key={member}>{member}</span>)}
                  </div>
                  <div className="project-card-footer">
                    <span>{demand?.targetDate ?? project.milestones.at(-1)?.date ?? "-"}</span>
                    <small>{projectRemark(project)}</small>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {filteredProjects.length === 0 ? (
          <div className="empty-state table-empty">
            <strong>没有符合条件的项目</strong>
            <span>当前条件下暂无项目。</span>
          </div>
        ) : null}
      </div>

    </section>
  );
}

function getVisibleProjects(projects: Project[], tasks: Task[], demands: Demand[], activeRole: RoleId, activeUser: RoleOption) {
  if (activeRole === "pm") {
    return projects.filter((project) => project.owner === activeUser.userName || project.supplierManager === activeUser.userName);
  }
  if (activeRole === "product") {
    const ownedDemandIds = new Set(demands.filter((demand) => demand.handler.includes(activeUser.userName)).map((demand) => demand.id));
    return projects.filter((project) => ownedDemandIds.has(project.demandId));
  }
  if (activeRole === "developer") {
    const ownedProjectIds = new Set(tasks.filter((task) => task.owner === activeUser.userName).map((task) => task.projectId));
    return projects.filter((project) => ownedProjectIds.has(project.id));
  }
  return projects;
}

function productOwnerForProject(project: Project, deliveryRequests: DeliveryRequest[], demands: Demand[]) {
  const request = deliveryRequests.find((item) => item.projectId === project.id || item.demandId === project.demandId);
  const demand = demands.find((item) => item.id === project.demandId);
  return request?.productOwner ?? demand?.handler.replace(" / 产品", "") ?? "未分配";
}

function projectPhaseText(project: Project) {
  const milestone = project.milestones.find((item) => item.status !== "已完成") ?? project.milestones.at(-1);
  return `${project.stage} · ${milestone?.name ?? project.implementation}`;
}

function projectStatusLabel(project: Project) {
  if (project.risk === "高") return "风险";
  if (project.stage === "项目准备") return "待分配";
  if (project.stage === "项目启动") return "计划中";
  if (project.stage === "项目进行") return "进行中";
  if (project.stage === "项目完成") return "待评分";
  if (project.stage === "项目结束") return "已完成";
  return project.stage;
}

function projectStatusTone(project: Project): Tone {
  if (project.risk === "高") return "red";
  if (project.stage === "项目准备") return "orange";
  if (project.stage === "项目启动") return "blue";
  if (project.stage === "项目进行") return "green";
  if (project.stage === "项目完成") return "orange";
  if (project.stage === "项目结束") return "gray";
  return toneForStatus(project.stage);
}

function projectAccentTone(project: Project, index: number): Tone {
  if (project.risk === "高") return "red";
  if (project.stage === "项目进行") return "green";
  if (project.stage === "项目完成") return "orange";
  if (project.implementation === "外部供应商") return "violet";
  return (["blue", "cyan", "orange", "violet", "red", "green"] as Tone[])[index % 6];
}

function projectMembers(project: Project, tasks: Task[], deliveryRequests: DeliveryRequest[], demands: Demand[]) {
  const taskOwners = tasks.filter((task) => task.projectId === project.id).map((task) => task.owner);
  return unique([project.owner, productOwnerForProject(project, deliveryRequests, demands), ...taskOwners, project.supplierManager])
    .filter((member) => member !== "无外部供应商")
    .slice(0, 5);
}

function projectRemark(project: Project) {
  if (project.risk !== "低") return project.riskReason;
  if (project.stage === "项目准备") return "等待项目经理分配开发和供应商资源";
  if (project.stage === "项目启动") return "等待产品经理填写启动结束时间";
  if (project.stage === "项目进行") return project.resources[0] ?? "开发和供应商按计划推进";
  if (project.stage === "项目完成") return "等待需求方验收评分";
  return project.milestones.at(-1)?.name ?? "项目结束";
}

function buildPmWorkbenchCards(projects: Project[], tasks: Task[]) {
  const preparing = projects.filter((project) => project.stage === "项目准备");
  const pendingStart = projects.filter((project) => project.stage === "项目启动");
  const running = projects.filter((project) => project.stage === "项目进行");
  const completion = projects.filter((project) => project.stage === "项目完成");
  const riskProjects = projects.filter((project) => isRiskProject(project));
  const unfinishedTasks = tasks.filter((task) => task.status !== "已完成" && running.some((project) => project.id === task.projectId)).length;
  return [
    {
      filter: "prepare",
      label: "待分配资源",
      value: String(preparing.length),
      delta: preparing[0]?.name ?? "暂无待分配项目",
      tone: preparing.length > 0 ? "orange" : "gray"
    },
    {
      filter: "start",
      label: "待启动项目",
      value: String(pendingStart.length),
      delta: pendingStart[0]?.name ?? "暂无待启动项目",
      tone: pendingStart.length > 0 ? "orange" : "gray"
    },
    {
      filter: "running",
      label: "进行中项目",
      value: String(running.length),
      delta: `${unfinishedTasks} 个任务未完成`,
      tone: running.length > 0 ? "blue" : "gray"
    },
    {
      filter: "complete",
      label: "待评分",
      value: String(completion.length),
      delta: completion[0]?.name ?? "暂无待评分项目",
      tone: completion.length > 0 ? "green" : "gray"
    },
    {
      filter: "risk",
      label: "风险项目",
      value: String(riskProjects.length),
      delta: riskProjects[0]?.riskReason ?? "暂无风险预警",
      tone: riskProjects.length > 0 ? "red" : "gray"
    }
  ] satisfies { filter: PmWorkbenchFilter; label: string; value: string; delta: string; tone: Tone }[];
}

function matchesPmWorkbench(project: Project, filter: PmWorkbenchFilter) {
  if (filter === "all") return true;
  if (filter === "prepare") return project.stage === "项目准备";
  if (filter === "start") return project.stage === "项目启动";
  if (filter === "running") return project.stage === "项目进行";
  if (filter === "complete") return project.stage === "项目完成";
  if (filter === "risk") return isRiskProject(project);
  return true;
}

function isRiskProject(project: Project) {
  return project.risk !== "低" || (project.budget > 0 && project.usedBudget / project.budget >= 0.72);
}

export function getProjectManagerActions(activeRole: RoleId, flow: DemandProjectFlow, project: Project, projectTasks: Task[] = []): FlowBoardAction[] {
  const isCurrent = (id: string) => flow.currentNodeId === id || flow.currentProjectNodeId === id;
  const isProjectStage = (stage: ProjectStage) => project.stage === stage;
  const actions: FlowBoardAction[] = [];
  if (activeRole === "pm") {
    actions.push(
    {
      id: "pm.assignResources",
      label: "分配开发 / 供应商",
      description: "打开资源分配页，选择内部开发和外部供应商后推进到项目启动。",
      stage: "阶段1：项目准备",
      tone: "green",
      impact: ["打开分配开发 / 供应商", "确认后项目阶段推进到项目启动", "产品经理和被分配人员收到通知"],
      disabled: !(isCurrent("projectPrepare") || isProjectStage("项目准备")),
      disabledReason: "只有项目准备阶段可执行。"
    }
    );
  }
  if (["admin", "product"].includes(activeRole)) {
    actions.push(
    {
      id: "product.startExecution",
      label: "填写启动结束时间",
      description: "产品经理确认启动结束时间，项目进入开发执行。",
      stage: "阶段2：项目启动",
      tone: "blue",
      impact: ["项目阶段推进到项目进行", "开发和供应商开始拆分任务", "操作留言写入记录和通知"],
      disabled: !isCurrent("projectStart"),
      disabledReason: "只有项目启动阶段可进入项目进行。"
    },
    {
      id: "product.submitProjectComplete",
      label: "项目完成",
      description: "项目到 DDL 或产品经理确认后，进入需求方评分阶段。",
      stage: "阶段3：项目进行",
      tone: "green",
      impact: ["项目阶段推进到项目完成", "需求方收到验收评分通知", "操作留言写入记录和通知"],
      disabled: !isCurrent("projectExecution"),
      disabledReason: "只有项目进行阶段可提交项目完成。"
    }
    );
  }
  if (["admin", "requester", "businessOwner"].includes(activeRole)) {
    actions.push({
      id: "requester.submitScore",
      label: "提交验收评分",
      description: "需求方完成评分后，项目结束，关联需求同步结束。",
      stage: "阶段4：项目完成",
      tone: "green",
      impact: ["项目阶段推进到项目结束", "需求评分归档", "产品经理和项目经理收到通知"],
      disabled: !isCurrent("projectComplete"),
      disabledReason: "只有项目完成阶段可评分结束。"
    });
  }
  return actions;
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean);
}

function matchesSelect(value: string, selected: string) {
  return selected === allOption || value === selected;
}

function countActiveFilters<T extends Record<string, string>>(filters: T, defaults: T) {
  return Object.keys(filters).filter((key) => filters[key].trim() !== defaults[key]).length;
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
      <button className={value === "gantt" ? "selected" : ""} onClick={() => onChange("gantt")}>甘特</button>
      <button className={value === "list" ? "selected" : ""} onClick={() => onChange("list")}>列表</button>
      <button className={value === "card" ? "selected" : ""} onClick={() => onChange("card")}>卡片</button>
    </div>
  );
}
