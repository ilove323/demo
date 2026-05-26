import { useEffect, useMemo, useState } from "react";
import { demands, projectDependencies, projectRules, users } from "../data";
import { DemandProjectFlowBoard } from "../components/DemandProjectFlowBoard";
import { GanttTimeline } from "../components/GanttTimeline";
import { buildProjectGanttGroups } from "../gantt";
import type { DeliveryRequest, DemandProjectFlow, FlowActionId, FlowActionLog, FlowBoardAction, Project, ProjectActionLog, ProjectStage, RoleId, RoleOption, Task, TaskPresetFilter } from "../types";
import { Drawer, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";

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
  onOpenTaskFilter
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
}) {
  const [selected, setSelected] = useState<Project | null>(null);
  const [riskDraft, setRiskDraft] = useState("");
  const [recordDraft, setRecordDraft] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "card" | "gantt">("card");
  const [projectAssignee, setProjectAssignee] = useState("");
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
  const projectManagerOptions = useMemo(
    () =>
      unique([
        ...users.filter((user) => user.departmentId === "it" && user.roleId === "pm").map((user) => user.name),
        ...projects.map((project) => project.owner),
        ...projects.map((project) => project.supplierManager)
      ]),
    [projects]
  );
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
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
  const selectedFlow = selected ? flows.find((flow) => flow.projectId === selected.id || flow.demandId === selected.demandId) : undefined;
  const selectedFlowLogs = selectedFlow ? flowActionLogs.filter((log) => log.flowId === selectedFlow.id) : [];
  const selectedProjectLogs = selected ? projectActionLogs.filter((log) => log.projectId === selected.id) : [];
  const selectedProjectTasks = selected ? selected.taskIds.map((taskId) => taskById.get(taskId)).filter((task): task is Task => Boolean(task)) : [];
  const missingTaskIds = selected ? selected.taskIds.filter((taskId) => !taskById.has(taskId)) : [];
  const canOpenTasks = ["admin", "pm", "itOwner", "rdOwner", "developer"].includes(activeRole);
  const managerActions = selectedFlow ? getProjectManagerActions(activeRole, selectedFlow) : [];
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
        return (
          (!keyword || [request.id, request.title, request.productOwner, request.projectManager, request.resourceNeed, request.supplierNeed, request.status].some((value) => value.toLowerCase().includes(keyword))) &&
          matchesSelect(request.requestedMode, filters.implementation)
        );
      }),
    [filters.implementation, filters.keyword, visibleDeliveryRequests]
  );
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

  useEffect(() => {
    if (!selected) return;
    const updated = visibleProjects.find((project) => project.id === selected.id);
    if (updated) {
      setSelected(updated);
      return;
    }
    setSelected(null);
  }, [selected, visibleProjects]);

  useEffect(() => {
    setRiskDraft(selected?.riskResponse ?? "");
    setRecordDraft(selected?.riskReason ?? "");
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    setProjectAssignee(projectManagerOptions.includes(selected.owner) ? selected.owner : projectManagerOptions[0] ?? "");
  }, [projectManagerOptions, selected]);

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
              if (project) setSelected(project);
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
                <th>进度</th>
                <th>预算</th>
                <th>风险</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr className="clickable" key={project.id} onClick={() => setSelected(project)}>
                  <td>
                    <strong>{project.name}</strong>
                    <div className="muted-text">{project.id} · 关联 {project.demandId}</div>
                  </td>
                  <td>{project.owner}</td>
                  <td><StatusTag tone={toneForProjectType(project.projectType)}>{project.projectType}</StatusTag></td>
                  <td><StatusTag tone={toneForImplementation(project.implementation)}>{project.implementation}</StatusTag></td>
                  <td><StatusTag tone={toneForStatus(project.stage)}>{project.stage}</StatusTag></td>
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
              <button className="entity-card project-card" key={project.id} onClick={() => setSelected(project)}>
                <div className="entity-card-head">
                  <span>{project.id} · 关联 {project.demandId}</span>
                  <StatusTag tone={toneForStatus(project.risk)}>{project.risk}</StatusTag>
                </div>
                <strong>{project.name}</strong>
                <p>{project.riskResponse}</p>
                <div className="card-meta">
                  <StatusTag tone={toneForProjectType(project.projectType)}>{project.projectType}</StatusTag>
                  <StatusTag tone={toneForImplementation(project.implementation)}>{project.implementation}</StatusTag>
                  <StatusTag tone={toneForStatus(project.stage)}>{project.stage}</StatusTag>
                </div>
                <div className="compact-grid">
                  <span>负责人：{project.owner}</span>
                  <span>供应商经理：{project.supplierManager}</span>
                  <span>预算：{formatMoney(project.usedBudget)} / {formatMoney(project.budget)}</span>
                  <span>内部：{project.personDays} 人天</span>
                  <span>分工：{project.contributions.length} 方协作</span>
                </div>
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
            <thead><tr><th>项目申请</th><th>产品经理</th><th>项目经理</th><th>实现方式</th><th>状态</th><th>资源/供应商</th></tr></thead>
            <tbody>
              {filteredDeliveryRequests.map((request) => (
                <tr key={request.id}>
                  <td><strong>{request.title}</strong><div className="muted-text">{request.id} · 关联 {request.demandId}</div></td>
                  <td>{request.productOwner}</td>
                  <td>{request.projectManager}</td>
                  <td><StatusTag tone={toneForImplementation(request.requestedMode)}>{request.requestedMode}</StatusTag></td>
                  <td><StatusTag tone={toneForStatus(request.status)}>{request.status}</StatusTag></td>
                  <td>{request.resourceNeed}<div className="muted-text">{request.supplierNeed}</div></td>
                </tr>
              ))}
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

      <Drawer title={selected?.name ?? ""} open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <>
            <div className="detail-list">
              <div><span>项目编号</span><strong>{selected.id}</strong></div>
              <div><span>负责人</span><strong>{selected.owner}</strong></div>
              <div><span>项目类型</span><strong>{selected.projectType}</strong></div>
              <div><span>供应商管理</span><strong>{selected.supplierManager}</strong></div>
              <div><span>当前阶段</span><strong>{selected.stage}</strong></div>
              <div><span>预算使用</span><strong>{formatMoney(selected.usedBudget)} / {formatMoney(selected.budget)}</strong></div>
              <div><span>内部人天</span><strong>{selected.personDays} 人天</strong></div>
              <div><span>风险原因</span><strong>{selected.riskReason}</strong></div>
              <div><span>应对措施</span><strong>{selected.riskResponse}</strong></div>
            </div>
            <SectionHeader title="项目阶段" />
            <div className="stage-strip">
              {selected.stages.map((stage) => <span className={stage.done ? "done" : ""} key={stage.name}>{stage.name}</span>)}
            </div>
            {selectedFlow ? (
              <>
                <SectionHeader title="协作链路 / 交接记录" />
                <DemandProjectFlowBoard
                  flow={selectedFlow}
                  actions={managerActions}
                  actionTitle="项目经理业务动作"
                  logs={selectedFlowLogs}
                  onApplyAction={onApplyFlowAction}
                />
              </>
            ) : null}
            {activeRole === "itOwner" ? (
              <>
                <SectionHeader title="项目分配" />
                <div className="assignment-strip">
                  <div>
                    <strong>分配项目负责人</strong>
                    <span>{selected.name} · 当前负责人：{selected.owner}</span>
                  </div>
                  <div className="assignment-controls">
                    <select className="inline-select" value={projectAssignee} onChange={(event) => setProjectAssignee(event.target.value)}>
                      {projectManagerOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <button
                      className="btn"
                      type="button"
                      disabled={!projectAssignee || projectAssignee === selected.owner}
                      onClick={() => onAssignWork(projectAssignee, "project", selected.id, `${selected.name} 项目治理和供应商交付`)}
                    >
                      分配给{projectAssignee || "项目经理"}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
            {["admin", "pm", "itOwner"].includes(activeRole) ? (
              <>
                <SectionHeader title="项目经理业务动作" />
                <div className="project-command-grid">
                  <button className="btn" type="button" onClick={() => onAdvanceProjectStage(selected.id)}>
                    推进交付阶段
                  </button>
                  <button className="btn secondary" type="button" onClick={() => onUpdateProjectRecord(selected.id, { riskResponse: `${selected.riskResponse} 已追加每日例会和供应商问题清单。` }, "追加每日例会和供应商问题清单")}>
                    更新风险应对
                  </button>
                  <button className="btn secondary" type="button" onClick={() => onApplyFlowAction(selectedFlow?.id ?? "", "pm.submitArchive")} disabled={!selectedFlow}>
                    提交上线归档
                  </button>
                </div>
                <SectionHeader title="项目记录编辑" />
                <div className="form-grid project-record-form">
                  <label className="wide">风险原因<textarea value={recordDraft} onChange={(event) => setRecordDraft(event.target.value)} /></label>
                  <label className="wide">应对措施<textarea value={riskDraft} onChange={(event) => setRiskDraft(event.target.value)} /></label>
                </div>
                <div className="split-actions">
                  <button className="btn secondary" type="button" onClick={() => { setRecordDraft(selected.riskReason); setRiskDraft(selected.riskResponse); }}>
                    重置
                  </button>
                  <button className="btn" type="button" onClick={() => onUpdateProjectRecord(selected.id, { riskReason: recordDraft, riskResponse: riskDraft }, "更新风险原因和应对措施")}>
                    保存项目记录
                  </button>
                </div>
              </>
            ) : null}
            {selectedProjectLogs.length > 0 ? (
              <>
                <SectionHeader title="项目操作记录" />
                <ul className="timeline compact">
                  {selectedProjectLogs.map((log) => <li key={log.id}>{log.time} · {log.actor} · {log.actionName} · {log.summary}</li>)}
                </ul>
              </>
            ) : null}
            <SectionHeader title="里程碑计划" />
            <ul className="timeline">
              {selected.milestones.map((item) => (
                <li key={`${item.name}${item.date}`}>{item.date} · {item.name} · {item.status}</li>
              ))}
            </ul>
            <SectionHeader title="资源分配" />
            <ul className="pill-list">
              {selected.resources.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <SectionHeader title="合作实现分工" />
            <div className="contribution-list">
              {selected.contributions.map((item) => (
                <article className="contribution-card" key={`${item.party}${item.responsibility}`}>
                  <div>
                    <strong>{item.party}</strong>
                    <StatusTag tone={item.type === "内部IT" ? "cyan" : item.type === "外部供应商" ? "violet" : "green"}>{item.type}</StatusTag>
                  </div>
                  <p>{item.responsibility}</p>
                  <div className="compact-grid">
                    <span>投入：{item.effort}</span>
                    <span>成本：{item.cost}</span>
                    <span>状态：{item.status}</span>
                  </div>
                </article>
              ))}
            </div>
            <SectionHeader title="关联任务" />
            <div className="linked-task-list">
              {selectedProjectTasks.map((task) => (
                <article className="linked-task-card" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <StatusTag tone={toneForStatus(task.status)}>{task.status}</StatusTag>
                  </div>
                  <div className="compact-grid">
                    <span>编号：{task.id}</span>
                    <span>负责人：{task.owner}</span>
                    <span>角色：{task.role}</span>
                    <span>截止：{task.due}</span>
                    <span>工时：{task.actual}/{task.estimate}h</span>
                    <span>项目：{task.project}</span>
                  </div>
                  {canOpenTasks ? (
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() => {
                        setSelected(null);
                        onOpenTaskFilter({ projectId: selected.id, projectName: selected.name, taskId: task.id, keyword: task.id });
                      }}
                    >
                      打开任务与工时
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
            {missingTaskIds.length > 0 ? (
              <div className="empty-state table-empty">
                <strong>关联任务数据异常</strong>
                <span>以下任务 ID 未在任务列表中找到：{missingTaskIds.join(" / ")}</span>
              </div>
            ) : null}
          </>
        ) : null}
      </Drawer>
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

function getProjectManagerActions(activeRole: RoleId, flow: DemandProjectFlow): FlowBoardAction[] {
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
