import { useMemo, useState } from "react";
import { demands, projectDependencies, projectRules } from "../data";
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
  const visibleProjects = useMemo(() => getVisibleProjects(projects, activeRole, activeUser), [activeRole, activeUser, projects]);
  const ownerOptions = useMemo(() => unique(visibleProjects.map((project) => project.owner)), [visibleProjects]);
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
            project.owner,
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
          matchesSelect(project.owner, filters.owner) &&
          matchesSelect(project.supplierManager, filters.supplierManager)
        );
      }),
    [filters, taskById, visibleProjects]
  );
  const projectGanttGroups = useMemo(() => buildProjectGanttGroups(filteredProjects, tasks), [filteredProjects, tasks]);
  const visibleDeliveryRequests = useMemo(() => {
    if (activeRole === "pm") return deliveryRequests.filter((request) => request.projectManager === activeUser.userName);
    if (activeRole === "itOwner" || activeRole === "admin" || activeRole === "executive") return deliveryRequests;
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
        <div className="filter-bar">
          <input
            aria-label="按项目、需求、负责人搜索"
            placeholder="搜索项目 / 需求 / 负责人 / 供应商"
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
            <option value={allOption}>全部项目经理</option>
            {ownerOptions.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
          </select>
          <select value={filters.supplierManager} onChange={(event) => setFilters((current) => ({ ...current, supplierManager: event.target.value }))}>
            <option value={allOption}>全部供应商负责人</option>
            {supplierManagerOptions.map((manager) => <option key={manager} value={manager}>{manager}</option>)}
          </select>
          <button className="btn secondary" onClick={resetFilters}>清空筛选</button>
          <span className="filter-count">显示 {filteredProjects.length} / {visibleProjects.length} 个项目</span>
        </div>
        {viewMode === "gantt" ? (
          <GanttTimeline
            groups={projectGanttGroups}
            onBarClick={(bar) => {
              const project = filteredProjects.find((item) => bar.id.startsWith(item.id));
              if (project) onOpenDetail(project.id);
            }}
          />
        ) : viewMode === "list" ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>项目</th>
                <th>负责人</th>
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
                  <td>{project.owner}</td>
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
                  <span>负责人：{project.owner}</span>
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

      {["admin", "pm", "itOwner", "product", "executive"].includes(activeRole) ? (
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

      <div className="grid-2">
        {filteredProjects.slice(0, 2).map((project) => (
          <div className="panel" key={project.id}>
            <SectionHeader eyebrow={project.id} title={project.name} />
            <div className="stage-strip">
              {project.stages.map((stage) => (
                <span className={stage.done ? "done" : ""} key={stage.name}>{stage.name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="panel">
          <SectionHeader eyebrow="RULES" title="实施流程规则与交付物" />
          <table className="data-table">
            <thead><tr><th>阶段</th><th>交付物</th><th>负责人</th><th>验收标准</th></tr></thead>
            <tbody>
              {projectRules.map((rule) => (
                <tr key={rule.stage}>
                  <td><strong>{rule.stage}</strong></td>
                  <td>{rule.deliverable}</td>
                  <td>{rule.owner}</td>
                  <td>{rule.acceptance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <SectionHeader eyebrow="RELATION" title="项目关系与依赖" />
          <table className="data-table">
            <thead><tr><th>项目</th><th>关系</th><th>目标</th><th>影响</th><th>状态</th></tr></thead>
            <tbody>
              {projectDependencies.map((dependency) => (
                <tr key={`${dependency.project}${dependency.target}`}>
                  <td><strong>{dependency.project}</strong></td>
                  <td>{dependency.relation}</td>
                  <td>{dependency.target}</td>
                  <td>{dependency.impact}</td>
                  <td><StatusTag tone={toneForStatus(dependency.status)}>{dependency.status}</StatusTag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </section>
  );
}

function getVisibleProjects(projects: Project[], activeRole: RoleId, activeUser: RoleOption) {
  if (activeRole === "pm") {
    return projects.filter((project) => project.owner === activeUser.userName || project.supplierManager === activeUser.userName);
  }
  if (activeRole === "product") {
    const ownedDemandIds = new Set(demands.filter((demand) => demand.handler.includes(activeUser.userName)).map((demand) => demand.id));
    return projects.filter((project) => ownedDemandIds.has(project.demandId));
  }
  return projects;
}

export function getProjectManagerActions(activeRole: RoleId, flow: DemandProjectFlow): FlowBoardAction[] {
  if (!["admin", "pm", "itOwner"].includes(activeRole)) return [];
  const nodeStatus = (id: string) => flow.nodes.find((node) => node.id === id)?.status;
  return [
    {
      id: "pm.acceptDeliveryRequest",
      label: "受理项目申请",
      description: "确认产品方案、范围和资源测算可进入项目经理治理。",
      stage: "项目受理与立项",
      tone: "orange",
      disabled: !["待项目经理受理", "待审批"].includes(flow.resourceRequest.status)
    },
    {
      id: "pm.returnDeliveryRequest",
      label: "退回补充",
      description: "项目申请材料不足时退回产品经理补充。",
      stage: "项目受理与立项",
      tone: "orange",
      disabled: flow.resourceRequest.status === "已批准"
    },
    {
      id: "pm.createProject",
      label: "转为新项目",
      description: "将项目申请正式立项为 IT 项目。",
      stage: "立项与资源排期",
      tone: "blue",
      disabled: flow.resourceRequest.status === "待审批"
    },
    {
      id: "pm.linkProject",
      label: "关联已有项目",
      description: "将项目申请合并到已有项目治理范围。",
      stage: "立项与资源排期",
      tone: "cyan",
      disabled: flow.resourceRequest.status === "待审批"
    },
    {
      id: "pm.generateResourcePlan",
      label: "生成资源计划",
      description: "根据需求窗口、人员负载和供应商排期生成计划。",
      stage: "立项与资源排期",
      tone: "violet",
      disabled: nodeStatus("iteration") === "待开始"
    },
    {
      id: "pm.confirmResourceSchedule",
      label: "确认资源排期",
      description: "确认人员和时间窗口，通知产品经理、开发和研发负责人。",
      stage: "立项与资源排期",
      tone: "green",
      disabled: flow.resourceRequest.status === "已批准"
    },
    {
      id: "pm.assignSupplier",
      label: "指派供应商",
      description: "确认外部供应商负责人、合同跟进和交付检查点。",
      stage: "执行治理",
      tone: "violet",
      disabled: flow.mode === "内部实现"
    },
    {
      id: "pm.updateBudget",
      label: "更新预算记录",
      description: "维护预算使用、付款状态和合同备注。",
      stage: "执行治理",
      tone: "orange"
    },
    {
      id: "pm.updateRiskResponse",
      label: "更新风险应对",
      description: "补充风险原因、应对措施和治理记录。",
      stage: "执行治理",
      tone: "red"
    },
    {
      id: "pm.updateSupplierDelivery",
      label: "更新供应商交付状态",
      description: "维护供应商交付进度、风险和下一检查点。",
      stage: "执行治理",
      tone: "violet",
      disabled: flow.mode === "内部实现"
    },
    {
      id: "pm.enterIntegrationTest",
      label: "进入联调测试",
      description: "开发或供应商完成实施后，进入联调测试。",
      stage: "联调测试",
      tone: "blue",
      disabled: nodeStatus("resource") !== "已完成"
    },
    {
      id: "pm.enterAcceptanceSupport",
      label: "进入验收支持",
      description: "交付可验收后，通知产品经理组织运营验收。",
      stage: "验收支持",
      tone: "cyan"
    },
    {
      id: "pm.submitArchive",
      label: "提交上线归档",
      description: "完成上线确认、供应商评价、预算和复盘归档。",
      stage: "上线归档",
      tone: "green",
      disabled: nodeStatus("acceptance") === "待开始"
    }
  ];
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean);
}

function matchesSelect(value: string, selected: string) {
  return selected === allOption || value === selected;
}

function formatMoney(value: number) {
  return `${Math.round(value / 10000)}万`;
}

function nextProjectAction(project: Project) {
  if (project.stage === "待受理") return "受理项目申请";
  if (project.stage === "已立项") return "生成资源计划";
  if (project.stage === "资源排期中") return "确认排期";
  if (project.stage === "实施中") return "跟踪任务交付";
  if (project.stage === "联调测试中") return "处理联调风险";
  if (project.stage === "验收支持中") return "组织业务验收";
  if (project.stage === "已上线") return "提交归档";
  return "查看复盘";
}

function AiScoreBadge({ project, compact = false }: { project?: Project; compact?: boolean }) {
  if (!project) {
    return (
      <div className="ai-score-inline empty">
        <strong>待生成</strong>
        <span>立项评分等待项目申请材料补齐</span>
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
