import { useMemo, useState } from "react";
import { demands } from "../data";
import { FilterPanel } from "../components/FilterPanel";
import { GanttTimeline } from "../components/GanttTimeline";
import { buildProjectGanttGroups } from "../gantt";
import type { DeliveryRequest, DemandProjectFlow, FlowActionId, FlowActionLog, FlowBoardAction, Project, ProjectActionLog, ProjectStage, RoleId, RoleOption, Task, TaskPresetFilter, Tone } from "../types";
import { ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";

const allOption = "全部";

export function Projects({
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
  const [viewMode, setViewMode] = useState<"list" | "card" | "gantt">("card");
  const [filters, setFilters] = useState({
    keyword: "",
    projectType: allOption,
    implementation: allOption,
    stage: allOption,
    risk: allOption,
    owner: allOption,
    supplierManager: allOption
  });
  const visibleProjects = useMemo(() => getVisibleProjects(projects, tasks, activeRole, activeUser), [activeRole, activeUser, projects, tasks]);
  const productOwnerOptions = useMemo(() => unique(visibleProjects.map((project) => productOwnerForProject(project, deliveryRequests))), [deliveryRequests, visibleProjects]);
  const supplierManagerOptions = useMemo(() => unique(visibleProjects.map((project) => project.supplierManager)), [visibleProjects]);
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const projectByDemandId = useMemo(() => new Map(projects.map((project) => [project.demandId, project])), [projects]);
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
            productOwnerForProject(project, deliveryRequests),
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
          matchesKeyword &&
          matchesSelect(project.projectType, filters.projectType) &&
          matchesSelect(project.implementation, filters.implementation) &&
          matchesSelect(project.stage, filters.stage) &&
          matchesSelect(project.risk, filters.risk) &&
          matchesSelect(productOwnerForProject(project, deliveryRequests), filters.owner) &&
          matchesSelect(project.supplierManager, filters.supplierManager)
        );
      }),
    [deliveryRequests, filters, taskById, visibleProjects]
  );
  const projectGanttGroups = useMemo(() => buildProjectGanttGroups(filteredProjects, tasks), [filteredProjects, tasks]);
  const visibleDeliveryRequests = useMemo(() => {
    if (activeRole === "pm") return deliveryRequests.filter((request) => request.projectManager === activeUser.userName);
    if (activeRole === "admin" || activeRole === "executive") return deliveryRequests;
    if (activeRole === "product") return deliveryRequests.filter((request) => request.productOwner === activeUser.userName);
    return [];
  }, [activeRole, activeUser.userName, deliveryRequests]);
  const filteredDeliveryRequests = useMemo(
    () =>
      visibleDeliveryRequests.filter((request) => {
        const keyword = filters.keyword.trim().toLowerCase();
        const relatedProject = request.projectId ? projectById.get(request.projectId) : projectByDemandId.get(request.demandId);
        return (
          (!keyword ||
            [
              request.id,
              request.title,
              request.productOwner,
              request.projectManager,
              request.resourceNeed,
              request.supplierNeed,
              request.status,
              relatedProject?.id,
              relatedProject?.name,
              relatedProject?.aiScore.recommendation,
              relatedProject ? String(relatedProject.aiScore.total) : undefined,
              relatedProject ? String(relatedProject.aiScore.businessValue) : undefined,
              relatedProject ? String(relatedProject.aiScore.urgency) : undefined,
              relatedProject ? String(relatedProject.aiScore.feasibility) : undefined,
              ...(relatedProject?.aiScore.reasons ?? [])
            ].some((value) => (value ?? "").toLowerCase().includes(keyword))) &&
          matchesSelect(request.requestedMode, filters.implementation)
        );
      }),
    [filters.implementation, filters.keyword, projectByDemandId, projectById, visibleDeliveryRequests]
  );
  const getRelatedProject = (request: DeliveryRequest) => (request.projectId ? projectById.get(request.projectId) : projectByDemandId.get(request.demandId));
  const activeFilterCount = countActiveFilters(filters, {
    keyword: "",
    projectType: allOption,
    implementation: allOption,
    stage: allOption,
    risk: allOption,
    owner: allOption,
    supplierManager: allOption
  });
  const resetFilters = () =>
    setFilters({
      keyword: "",
      projectType: allOption,
      implementation: allOption,
      stage: allOption,
      risk: allOption,
      owner: allOption,
      supplierManager: allOption
    });

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>项目管理</h1>
        </div>
        <StatusTag tone="blue">内部 + 供应商 + 业务方协作视图</StatusTag>
      </div>

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
              {unique(visibleProjects.map((project) => project.stage)).map((stage) => <option key={stage} value={stage}>{stage}</option>)}
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
          <table className="data-table">
            <thead>
              <tr>
                <th>项目</th>
                <th>产品经理</th>
                <th>项目类型</th>
                <th>协作模式</th>
                <th>阶段</th>
                <th>AI 立项</th>
                <th>进度</th>
                <th>预算</th>
                <th>风险</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr className="clickable" key={project.id} onClick={() => onOpenDetail(project.id)}>
                  <td>
                    <strong>{project.name}</strong>
                    <div className="muted-text">{project.id} · 关联 {project.demandId}</div>
                  </td>
                  <td>{productOwnerForProject(project, deliveryRequests)}</td>
                  <td><StatusTag tone={toneForProjectType(project.projectType)}>{project.projectType}</StatusTag></td>
                  <td><StatusTag tone={toneForImplementation(project.implementation)}>{project.implementation}</StatusTag></td>
                  <td><StatusTag tone={toneForStatus(project.stage)}>{project.stage}</StatusTag></td>
                  <td><AiScoreBadge project={project} compact /></td>
                  <td>
                    <div className="progress-cell">
                      <ProgressBar value={project.progress} />
                      <span>{project.progress}%</span>
                    </div>
                  </td>
                  <td>{formatMoney(project.usedBudget)} / {formatMoney(project.budget)}</td>
                  <td><StatusTag tone={toneForStatus(project.risk)}>{project.risk}</StatusTag></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="entity-card-grid">
            {filteredProjects.map((project) => (
              <button className="entity-card project-card compact-entity-card" key={project.id} onClick={() => onOpenDetail(project.id)}>
                <div className="entity-card-head">
                  <span>{project.id} · 关联 {project.demandId}</span>
                  <StatusTag tone={toneForStatus(project.risk)}>{project.risk}</StatusTag>
                </div>
                <strong>{project.name}</strong>
                <div className="card-meta">
                  <StatusTag tone={toneForProjectType(project.projectType)}>{project.projectType}</StatusTag>
                  <StatusTag tone={toneForImplementation(project.implementation)}>{project.implementation}</StatusTag>
                  <StatusTag tone={toneForStatus(project.stage)}>{project.stage}</StatusTag>
                </div>
                <div className="compact-grid">
                  <span>产品经理：{productOwnerForProject(project, deliveryRequests)}</span>
                  <span>预算：{formatMoney(project.usedBudget)} / {formatMoney(project.budget)}</span>
                  <span>下一步：{nextProjectAction(project)}</span>
                </div>
                <AiScoreBadge project={project} />
                <div className="progress-cell">
                  <ProgressBar value={project.progress} />
                  <span>{project.progress}%</span>
                </div>
              </button>
            ))}
          </div>
        )}
        {filteredProjects.length === 0 ? (
          <div className="empty-state table-empty">
            <strong>没有符合条件的项目</strong>
            <span>当前条件下暂无项目。</span>
          </div>
        ) : null}
      </div>

      {["admin", "pm", "pm", "product", "executive"].includes(activeRole) ? (
        <div className="panel">
          <SectionHeader eyebrow="PROJECT REQUEST" title="项目申请池" />
          <table className="data-table">
            <thead><tr><th>项目申请</th><th>产品经理</th><th>项目经理</th><th>实现方式</th><th>状态</th><th>AI 立项建议</th><th>资源/供应商</th></tr></thead>
            <tbody>
              {filteredDeliveryRequests.map((request) => {
                const relatedProject = getRelatedProject(request);
                return (
                  <tr className={relatedProject ? "clickable" : ""} key={request.id} onClick={() => { if (relatedProject) onOpenDetail(relatedProject.id); }}>
                    <td><strong>{request.title}</strong><div className="muted-text">{request.id} · 关联 {request.demandId}</div></td>
                    <td>{request.productOwner}</td>
                    <td>{request.projectManager}</td>
                    <td><StatusTag tone={toneForImplementation(request.requestedMode)}>{request.requestedMode}</StatusTag></td>
                    <td><StatusTag tone={toneForStatus(request.status)}>{request.status}</StatusTag></td>
                    <td><AiScoreBadge project={relatedProject} compact /></td>
                    <td>{request.resourceNeed}<div className="muted-text">{request.supplierNeed}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredDeliveryRequests.length === 0 ? (
            <div className="empty-state table-empty">
              <strong>暂无项目申请</strong>
              <span>当前筛选范围内没有产品经理提交给项目经理的项目申请。</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function getVisibleProjects(projects: Project[], tasks: Task[], activeRole: RoleId, activeUser: RoleOption) {
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

function productOwnerForProject(project: Project, deliveryRequests: DeliveryRequest[]) {
  const request = deliveryRequests.find((item) => item.projectId === project.id || item.demandId === project.demandId);
  const demand = demands.find((item) => item.id === project.demandId);
  return request?.productOwner ?? demand?.handler.replace(" / 产品", "") ?? "未分配";
}

export function getProjectManagerActions(activeRole: RoleId, flow: DemandProjectFlow, project: Project, projectTasks: Task[] = []): FlowBoardAction[] {
  if (!["admin", "pm"].includes(activeRole)) return [];
  const isCurrent = (id: string) => flow.currentNodeId === id;
  const allTasksDone = projectTasks.length > 0 && projectTasks.every((task) => task.status === "已完成");
  return [
    {
      id: "pm.startProject",
      label: "项目启动",
      description: "唯一项目经理确认资源合适后启动项目。",
      stage: "阶段3：项目启动",
      tone: "green",
      impact: ["泳道推进到阶段4项目进行", "项目状态改为项目进行", "需求方、产品经理、开发收到通知"],
      disabled: !isCurrent("projectStart"),
      disabledReason: "只有项目启动阶段可执行。"
    },
    {
      id: "pm.returnSolution",
      label: "退回方案确认",
      description: "资源暂不合适或方案边界不足时，退回需求方和产品经理补充。",
      stage: "阶段3：项目启动",
      tone: "orange",
      impact: ["泳道回到阶段2方案确认", "项目申请状态改为退回方案确认", "操作留言写入记录和通知"],
      disabled: !isCurrent("projectStart"),
      disabledReason: "只有项目启动阶段可退回方案确认。"
    },
    {
      id: "pm.assignDevelopers",
      label: "指派开发",
      description: "在项目进行阶段指定开发人员和职责。",
      stage: "阶段4：项目进行",
      tone: "blue",
      impact: ["泳道保持阶段4项目进行", "开发收到指派通知", "操作留言写入记录和通知"],
      disabled: !isCurrent("projectExecution"),
      disabledReason: "只有项目进行阶段可指派开发。"
    },
    {
      id: "pm.submitAcceptance",
      label: "项目验收",
      description: "项目内任务全部完成后，提交给产品经理验收。",
      stage: "阶段4：项目进行",
      tone: "green",
      impact: ["泳道推进到阶段5项目验收", "项目状态改为项目验收", "产品经理收到验收通知"],
      disabled: !isCurrent("projectExecution") || !allTasksDone,
      disabledReason: !isCurrent("projectExecution") ? "只有项目进行阶段可提交验收。" : "需项目内任务全部完成后才能提交验收。"
    }
  ];
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

function formatMoney(value: number) {
  return `${Math.round(value / 10000)}万`;
}

function nextProjectAction(project: Project) {
  if (project.stage === "项目启动") return "判断资源并启动";
  if (project.stage === "项目进行") return "跟踪任务交付";
  if (project.stage === "项目验收") return "等待产品验收";
  if (project.stage === "验收完成") return "等待需求方评分";
  return "查看复盘";
}

function AiScoreBadge({ project, compact = false }: { project?: Project; compact?: boolean }) {
  if (!project) {
    return (
      <div className="ai-score-inline empty">
        <strong>生成中</strong>
        <span>AI 正在基于项目申请材料生成立项评分</span>
      </div>
    );
  }
  const lowestDimension = getLowestAiDimension(project);
  return (
    <div className={`ai-score-inline tone-${toneForAiRecommendation(project.aiScore.recommendation)}${compact ? " compact" : ""}`}>
      <div className="ai-score-inline-head">
        <strong>AI {project.aiScore.total}分</strong>
        <StatusTag tone={toneForAiRecommendation(project.aiScore.recommendation)}>{project.aiScore.recommendation}</StatusTag>
      </div>
      <div className="ai-score-dimensions">
        <span>业务价值 {project.aiScore.businessValue}</span>
        <span>紧急程度 {project.aiScore.urgency}</span>
        <span>可行性 {project.aiScore.feasibility}</span>
      </div>
      {!compact ? <p>{lowestDimension.label} {lowestDimension.value}分，{project.aiScore.reasons[0]}</p> : null}
    </div>
  );
}

function getLowestAiDimension(project: Project) {
  return [
    { label: "业务价值", value: project.aiScore.businessValue },
    { label: "紧急程度", value: project.aiScore.urgency },
    { label: "可行性", value: project.aiScore.feasibility }
  ].sort((left, right) => left.value - right.value)[0];
}

function toneForAiRecommendation(recommendation: Project["aiScore"]["recommendation"]): Tone {
  if (recommendation === "推荐立项") return "green";
  if (recommendation === "谨慎推荐") return "orange";
  return "red";
}

function toneForImplementation(value: string) {
  if (value === "内部实现") return "cyan";
  if (value === "合作实现") return "blue";
  return "violet";
}

function toneForProjectType(value: string) {
  if (value === "硬件项目") return "orange";
  if (value === "软硬件协同") return "blue";
  return "cyan";
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
