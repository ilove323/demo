import { ArrowLeft, Bot, BrainCircuit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DemandProjectFlowBoard } from "../components/DemandProjectFlowBoard";
import { Modal, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";
import { resourceCalendars, resourcePeople, supplierBudgets } from "../data";
import { projectDeliveryProgress } from "../projectProgress";
import { getProjectManagerActions } from "./Projects";
import type { ContributionItem, DeliveryRequest, Demand, DemandProjectFlow, FlowActionId, FlowActionLog, Project, ProjectActionLog, ProjectStage, ResourceAssignmentPlan, RoleId, RoleOption, Task, TaskPresetFilter } from "../types";

export function ProjectDetail({
  project,
  demand,
  projects,
  tasks,
  flow,
  deliveryRequest,
  activeRole,
  activeUser,
  flowActionLogs,
  projectActionLogs,
  onBack,
  onApplyFlowAction,
  onAssignWork,
  onUpdateFlowAssignments,
  onUpdateProjectRecord,
  onAdvanceProjectStage,
  onOpenTaskFilter
}: {
  project: Project;
  demand?: Demand;
  projects: Project[];
  tasks: Task[];
  flow?: DemandProjectFlow;
  deliveryRequest?: DeliveryRequest;
  activeRole: RoleId;
  activeUser: RoleOption;
  flowActionLogs: FlowActionLog[];
  projectActionLogs: ProjectActionLog[];
  onBack: () => void;
  onApplyFlowAction: (flowId: string, actionId: FlowActionId, note?: string) => void;
  onAssignWork: (targetUserName: string, relatedType: "demand" | "project" | "task" | "resource" | "flow", relatedId: string, summary: string) => void;
  onUpdateFlowAssignments: (flowId: string, assignments: ResourceAssignmentPlan[], summary: string) => void;
  onUpdateProjectRecord: (projectId: string, patch: Partial<Project>, summary: string) => void;
  onAdvanceProjectStage: (projectId: string, nextStage?: ProjectStage) => void;
  onOpenTaskFilter: (filter: Omit<TaskPresetFilter, "nonce">) => void;
}) {
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [assignmentNote, setAssignmentNote] = useState("");
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const selectedProjectTasks = useMemo(
    () => project.taskIds.map((taskId) => taskById.get(taskId)).filter((task): task is Task => Boolean(task)),
    [project.taskIds, taskById]
  );
  const missingTaskIds = useMemo(() => project.taskIds.filter((taskId) => !taskById.has(taskId)), [project.taskIds, taskById]);
  const selectedFlowLogs = flow ? flowActionLogs.filter((log) => log.flowId === flow.id) : [];
  const selectedProjectLogs = projectActionLogs.filter((log) => log.projectId === project.id);
  const managerActions = flow ? getProjectManagerActions(activeRole, flow, project, selectedProjectTasks) : [];
  const canOpenTasks = ["admin", "pm", "developer"].includes(activeRole);
  const projectCanHaveTasks = stageIndex(project.stage) >= stageIndex("项目进行");
  const shouldShowLinkedTasks = projectCanHaveTasks && (selectedProjectTasks.length > 0 || missingTaskIds.length > 0);
  const operationLogs = buildProjectOperationLogs(project, demand, selectedProjectTasks, selectedProjectLogs);
  const canAssignInternal = project.implementation !== "外部供应商";
  const canAssignSupplier = project.implementation !== "内部实现";
  const currentDeveloperSelection = useMemo(
    () =>
      unique([
        ...(flow?.assignments.map((item) => item.person).filter((person) => resourcePeople.some((candidate) => candidate.name === person)) ?? []),
        ...selectedProjectTasks.map((task) => task.owner).filter((owner) => resourcePeople.some((person) => person.name === owner))
      ]),
    [flow, selectedProjectTasks]
  );
  const currentSupplierSelection = useMemo(
    () =>
      unique([
        ...(flow?.assignments.map((item) => item.person).filter((person) => supplierBudgets.some((candidate) => candidate.supplier === person)) ?? []),
        ...project.contributions.filter((item) => item.type === "外部供应商").map((item) => item.party),
        ...supplierBudgets.filter((item) => item.project === project.name).map((item) => item.supplier)
      ]).filter((supplier) => supplierBudgets.some((candidate) => candidate.supplier === supplier)),
    [flow, project.contributions, project.name]
  );
  const implementationHint =
    project.implementation === "内部实现"
      ? "内部实现：项目经理只分配 IT 部门内部开发，外部供应商入口保持关闭。"
      : project.implementation === "外部供应商"
        ? "外部供应商：项目经理选择承接供应商，内部开发仅作为协同或验收支持，不作为主交付。"
        : "合作实现：项目经理同时分配内部开发和外部供应商，泳道会同步显示双方职责。";
  const deliveryProgress = projectDeliveryProgress(project);
  const projectStageExtras = {
    projectPrepare: [
      { label: "内部资源需求", value: `${project.resourcePlan.internalPersonDays} 人天` },
      {
        label: "外部供应商需求",
        value: project.resourcePlan.needsExternalSupplier
          ? `${project.resourcePlan.externalSupplierRole} · ${project.resourcePlan.externalSupplierPersonDays} 人天`
          : "不需要"
      }
    ],
    projectComplete: [
      {
        label: "产品经理结语",
        value: productClosingNote(project, demand)
      }
    ],
    projectEnded: [
      {
        label: "需求方评分",
        value: demand?.acceptanceReview ? `${demand.acceptanceReview.score} 分 · ${demand.acceptanceReview.conclusion}` : demand?.score ? `${demand.score} 分` : "待评分"
      },
      {
        label: "评价内容",
        value: demand?.acceptanceReview?.comment ?? "需求方提交验收评分后自动显示评价内容。"
      }
    ]
  };

  useEffect(() => {
    setSelectedDevelopers(canAssignInternal ? currentDeveloperSelection : []);
    setSelectedSuppliers(canAssignSupplier ? currentSupplierSelection : []);
    setAssignmentNote(defaultAssignmentNote(project));
  }, [canAssignInternal, canAssignSupplier, currentDeveloperSelection, currentSupplierSelection, project]);

  function toggleDeveloper(name: string) {
    if (!canAssignInternal) return;
    setSelectedDevelopers((items) => (items.includes(name) ? items.filter((item) => item !== name) : [...items, name]));
  }

  function toggleSupplier(name: string) {
    if (!canAssignSupplier) return;
    setSelectedSuppliers((items) => (items.includes(name) ? items.filter((item) => item !== name) : [...items, name]));
  }

  function submitResourceAssignment() {
    if (!flow) return;
    const nextAssignments = buildNextAssignments(flow?.assignments ?? [], project, selectedDevelopers, selectedSuppliers);
    const summary = buildAssignmentSummary(project, selectedDevelopers, selectedSuppliers, assignmentNote);
    onUpdateFlowAssignments(flow.id, nextAssignments, summary);
    onUpdateProjectRecord(
      project.id,
      {
        resources: mergeProjectResources(project.resources, selectedDevelopers, selectedSuppliers),
        resourcePlan: {
          ...project.resourcePlan,
          assignedResources: [...selectedDevelopers, ...selectedSuppliers],
          externalSupplierName: selectedSuppliers[0] ?? project.resourcePlan.externalSupplierName,
          needsExternalSupplier: selectedSuppliers.length > 0 || project.resourcePlan.needsExternalSupplier
        },
        contributions: mergeProjectContributions(project.contributions, project, selectedDevelopers, selectedSuppliers)
      },
      summary
    );
    onApplyFlowAction(flow.id, "pm.assignResources", summary);
    setAssignmentOpen(false);
  }

  return (
    <section className="page detail-page">
      <div className="detail-hero">
        <button className="btn secondary" type="button" onClick={onBack}>
          <ArrowLeft size={16} /> 返回项目列表
        </button>
        <div className="detail-hero-main">
          <div>
            <span className="detail-kicker">{project.id} · 关联 {project.demandId}</span>
            <h1>{project.name}</h1>
            <p>{project.riskResponse}</p>
          </div>
          <div className="detail-hero-tags">
            <StatusTag tone={toneForProjectType(project.projectType)}>{project.projectType}</StatusTag>
            <StatusTag tone={toneForImplementation(project.implementation)}>{project.implementation}</StatusTag>
            <StatusTag tone={toneForStatus(project.stage)}>{project.stage}</StatusTag>
            <StatusTag tone={toneForStatus(project.risk)}>{project.risk}</StatusTag>
          </div>
        </div>
      </div>

      <div className="detail-summary-grid">
        <article className="summary-tile">
          <span>交付进度</span>
          <strong>{deliveryProgress}%</strong>
          <ProgressBar value={deliveryProgress} />
        </article>
        <article className="summary-tile">
          <span>预算使用</span>
          <strong>{formatMoney(project.usedBudget)}</strong>
          <small>总预算 {formatMoney(project.budget)} · 项目阶段测算</small>
        </article>
        <article className="summary-tile">
          <span>内部投入</span>
          <strong>{project.personDays} 人天</strong>
          <small>负责人：{project.owner}</small>
        </article>
        <article className="summary-tile ai-total">
          <span>AI 立项总分</span>
          <strong>{project.aiScore.total}</strong>
          <small>{project.aiScore.recommendation}</small>
        </article>
      </div>

      {flow ? (
        <div className="panel project-swimlane-panel">
          <SectionHeader
            title="需求线 / 项目阶段关系图"
            action={<StatusTag tone={toneForStatus(flow.nodes.find((node) => node.id === flow.currentNodeId)?.status ?? project.stage)}>{flow.nodes.find((node) => node.id === flow.currentNodeId)?.name ?? project.stage}</StatusTag>}
          />
          <DemandProjectFlowBoard
            flow={flow}
            canConfigure
            activeRole={activeRole}
            actions={managerActions}
            actionTitle="项目经理业务动作"
            logs={selectedFlowLogs}
            tasks={tasks}
            stageExtras={projectStageExtras}
            onApplyAction={onApplyFlowAction}
            onRequestAction={(action) => {
              if (action.id !== "pm.assignResources") return false;
              setAssignmentOpen(true);
              return true;
            }}
          />
        </div>
      ) : null}

      <div className="detail-layout">
        <div className="detail-main">
          <div className="panel ai-score-panel">
            <SectionHeader title="AI 立项建议" action={<BrainCircuit size={18} />} />
            <div className="ai-score-grid">
              <ScoreBar label="业务价值" value={project.aiScore.businessValue} />
              <ScoreBar label="紧急程度" value={project.aiScore.urgency} />
              <ScoreBar label="可行性" value={project.aiScore.feasibility} />
            </div>
            <div className="ai-weight-note">
              <strong>加权规则</strong>
              <span>业务价值 40% / 紧急程度 30% / 可行性 30%，总分 = 业务价值 × 40% + 紧急程度 × 30% + 可行性 × 30%。</span>
            </div>
            <div className="recommendation-box">
              <StatusTag tone={project.aiScore.recommendation === "推荐立项" ? "green" : project.aiScore.recommendation === "谨慎推荐" ? "orange" : "red"}>{project.aiScore.recommendation}</StatusTag>
              <ul className="timeline compact">{project.aiScore.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            </div>
          </div>

          {shouldShowLinkedTasks ? (
            <div className="panel">
              <SectionHeader title="关联任务" />
              <div className="linked-task-list relaxed">
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
                    </div>
                    {canOpenTasks ? (
                      <button className="btn secondary" type="button" onClick={() => onOpenTaskFilter({ projectId: project.id, projectName: project.name, taskId: task.id, keyword: task.id })}>
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
            </div>
          ) : null}
        </div>

        <aside className="detail-side">
          <div className="panel">
            <SectionHeader title="操作记录" action={<Bot size={17} />} />
            <ul className="timeline compact">
              {operationLogs.map((log) => <li key={`${log.time}${log.summary}`}>{log.time} · {log.actor} · {log.summary}</li>)}
            </ul>
          </div>
        </aside>
      </div>

      <Modal title="分配开发 / 供应商" open={assignmentOpen} onClose={() => setAssignmentOpen(false)} size="wide">
        <div className="assignment-modal-intro">
          <div>
            <strong>{project.name}</strong>
            <span>{implementationHint}</span>
          </div>
          <StatusTag tone={toneForImplementation(project.implementation)}>{project.implementation}</StatusTag>
        </div>

        <div className="assignment-picker-layout">
          <section className={canAssignInternal ? "assignment-picker-section" : "assignment-picker-section disabled"}>
            <SectionHeader title="内部开发" action={<StatusTag tone={canAssignInternal ? "cyan" : "gray"}>{canAssignInternal ? `${selectedDevelopers.length} 人` : "不适用"}</StatusTag>} />
            <div className="assignment-option-grid">
              {resourcePeople.map((person) => {
                const checked = selectedDevelopers.includes(person.name);
                return (
                  <label className={checked ? "assignment-option selected" : "assignment-option"} key={person.name}>
                    <input type="checkbox" checked={checked} disabled={!canAssignInternal} onChange={() => toggleDeveloper(person.name)} />
                    <span>
                      <strong>{person.name} · {person.role}</strong>
                      <small>负载 {person.assigned}/{person.capacity}h · {person.skills.slice(0, 2).join(" / ")}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className={canAssignSupplier ? "assignment-picker-section" : "assignment-picker-section disabled"}>
            <SectionHeader title="外部供应商" action={<StatusTag tone={canAssignSupplier ? "violet" : "gray"}>{canAssignSupplier ? `${selectedSuppliers.length} 家` : "不适用"}</StatusTag>} />
            <div className="assignment-option-grid">
              {supplierBudgets.map((supplier) => {
                const checked = selectedSuppliers.includes(supplier.supplier);
                return (
                  <label className={checked ? "assignment-option selected" : "assignment-option"} key={supplier.supplier}>
                    <input type="checkbox" checked={checked} disabled={!canAssignSupplier} onChange={() => toggleSupplier(supplier.supplier)} />
                    <span>
                      <strong>{supplier.supplier}</strong>
                      <small>{supplier.deliveryStatus} · 风险 {supplier.riskStatus} · 合同 {formatMoney(supplier.contract)}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <label className="assignment-note-field">
          分配留言
          <textarea value={assignmentNote} onChange={(event) => setAssignmentNote(event.target.value)} />
        </label>

        <div className="assignment-modal-actions">
          <button className="btn secondary" type="button" onClick={() => setAssignmentOpen(false)}>取消</button>
          <button className="btn" type="button" onClick={submitResourceAssignment} disabled={selectedDevelopers.length + selectedSuppliers.length === 0}>确认分配并进入阶段2</button>
        </div>
      </Modal>
    </section>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-bar">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

function formatMoney(value: number) {
  return `${Math.round(value / 10000)}万`;
}

function toneForImplementation(value: string) {
  if (value === "内部实现") return "cyan";
  if (value === "外部供应商") return "violet";
  return "blue";
}

function toneForProjectType(value: string) {
  if (value === "硬件项目") return "orange";
  if (value === "软硬件协同") return "violet";
  return "cyan";
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function defaultAssignmentNote(project: Project) {
  if (project.implementation === "内部实现") return "内部开发承接交付，项目经理负责排期、进度和资源冲突协调。";
  if (project.implementation === "外部供应商") return "外部供应商承接主交付，项目经理负责合同、排期、风险和验收闭环。";
  return "内部开发与外部供应商协同交付，项目经理统一负责排期、依赖、风险和验收闭环。";
}

function productClosingNote(project: Project, demand?: Demand) {
  const owner = demand?.handler.replace(" / 产品", "") ?? "产品经理";
  const pendingMilestone = project.milestones.find((item) => item.status !== "完成" && item.status !== "已完成");
  if (project.stage === "项目完成" || project.stage === "项目结束") {
    return `${owner}确认核心范围已完成，交付材料和验收问题已收敛，可进入需求方验收评分。`;
  }
  return `${owner}将在${pendingMilestone?.name ?? "当前交付节点"}完成后补充项目完成结语。`;
}

function stageIndex(stage: ProjectStage) {
  return ["项目准备", "项目启动", "项目进行", "项目完成", "项目结束"].indexOf(stage);
}

function buildProjectOperationLogs(project: Project, demand: Demand | undefined, tasks: Task[], liveLogs: ProjectActionLog[]) {
  const productOwner = demand?.handler.replace(" / 产品", "") ?? "产品经理";
  const firstTask = tasks[0];
  const secondTask = tasks[1] ?? tasks[0];
  const logs = [
    {
      time: "2026-05-24 09:30",
      actor: productOwner,
      summary: `阶段1 项目准备：产品经理提交资源申请，内部资源 ${project.resourcePlan.internalPersonDays} 人天，外部资源 ${project.resourcePlan.needsExternalSupplier ? `${project.resourcePlan.externalSupplierPersonDays} 人天` : "0 人天"}。`
    }
  ];

  if (stageIndex(project.stage) >= stageIndex("项目启动")) {
    logs.push({
      time: "2026-05-25 14:20",
      actor: project.owner,
      summary: `阶段2 项目启动：项目经理确认资源窗口，申请并锁定 ${project.resourcePlan.assignedResources.length || project.resources.length} 个交付资源，启动窗口 ${project.resourcePlan.startEndDate ?? "待填写"}。`
    });
  }

  if (stageIndex(project.stage) >= stageIndex("项目进行") && firstTask) {
    logs.push({
      time: "2026-05-26 10:15",
      actor: firstTask.owner,
      summary: `阶段3 项目进行：开发新增任务「${firstTask.title}」，预估 ${firstTask.estimate}h，当前登记 ${firstTask.actual}h。`
    });
  }

  if (stageIndex(project.stage) >= stageIndex("项目进行") && secondTask && secondTask.id !== firstTask?.id) {
    logs.push({
      time: "2026-05-27 16:40",
      actor: secondTask.owner,
      summary: `阶段3 项目进行：开发更新任务「${secondTask.title}」，状态 ${secondTask.status}。`
    });
  }

  if (stageIndex(project.stage) >= stageIndex("项目完成")) {
    logs.push({
      time: "2026-05-28 17:10",
      actor: productOwner,
      summary: `阶段4 项目完成：产品经理补充完成结语，等待需求方验收评分。`
    });
  }

  if (stageIndex(project.stage) >= stageIndex("项目结束")) {
    logs.push({
      time: "2026-05-29 15:30",
      actor: demand?.requester ?? "需求方",
      summary: `阶段5 项目结束：需求方完成评分和复盘记录，项目关闭。`
    });
  }

  return [
    ...logs,
    ...liveLogs.map((log) => ({
      time: log.time,
      actor: log.actor,
      summary: `${log.actionName}：${log.summary}`
    }))
  ];
}

function buildAssignmentSummary(project: Project, developers: string[], suppliers: string[], note: string) {
  const internalText = developers.length > 0 ? `内部开发：${developers.join("、")}` : "内部开发：无";
  const supplierText = suppliers.length > 0 ? `外部供应商：${suppliers.join("、")}` : "外部供应商：无";
  return `${project.implementation}资源分配，${internalText}；${supplierText}。${note.trim()}`;
}

function buildNextAssignments(existing: ResourceAssignmentPlan[], project: Project, developers: string[], suppliers: string[]) {
  const optionNames = new Set([...resourcePeople.map((person) => person.name), ...supplierBudgets.map((supplier) => supplier.supplier)]);
  const preserved = existing.filter((item) => !optionNames.has(item.person) && !(suppliers.length > 0 && /供应商|外部/.test(item.role)));
  return [...preserved, ...developers.map((name) => developerAssignment(project, name)), ...suppliers.map((name) => supplierAssignment(project, name))];
}

function developerAssignment(project: Project, name: string): ResourceAssignmentPlan {
  const person = resourcePeople.find((item) => item.name === name);
  const allocation = person?.allocations.find((item) => item.project === project.name);
  const sourceCalendarDates = unique(resourceCalendars.filter((item) => item.person === name && item.projectId === project.id).map((item) => item.date));
  const loadRate = person ? Math.round((person.assigned / person.capacity) * 100) : 0;
  return {
    id: `ASSIGN-${project.id}-${slugify(name)}`,
    role: person?.role ?? "开发",
    person: name,
    dateRange: sourceCalendarDates.length > 0 ? `${sourceCalendarDates[0]} 至 ${sourceCalendarDates[sourceCalendarDates.length - 1]}` : nextProjectWindow(project),
    hours: allocation?.hours ?? 16,
    workload: person ? `${loadRate}% 负载` : "待确认",
    conflict: loadRate > 100 ? "超载，需项目经理调整排期" : loadRate >= 90 ? "偏高，需关注资源冲突" : "无冲突",
    sourceCalendarDates
  };
}

function supplierAssignment(project: Project, name: string): ResourceAssignmentPlan {
  const supplier = supplierBudgets.find((item) => item.supplier === name);
  return {
    id: `ASSIGN-${project.id}-${slugify(name)}`,
    role: "外部供应商",
    person: name,
    dateRange: nextProjectWindow(project),
    hours: Math.max(24, Math.round(project.personDays * 0.45)),
    workload: supplier ? `${supplier.payment} / ${supplier.deliveryStatus}` : "待确认",
    conflict: supplier?.riskStatus === "高" ? "高风险，需项目经理重点盯防" : supplier?.riskStatus === "中" ? "中风险，需周度跟进" : "无冲突",
    sourceCalendarDates: []
  };
}

function mergeProjectResources(resources: string[], developers: string[], suppliers: string[]) {
  return unique([
    ...resources,
    ...developers.map((name) => {
      const person = resourcePeople.find((item) => item.name === name);
      return `${name} · ${person?.role ?? "开发"}`;
    }),
    ...suppliers.map((name) => `${name} · 外部供应商`)
  ]);
}

function mergeProjectContributions(contributions: ContributionItem[], project: Project, developers: string[], suppliers: string[]) {
  const existingParties = new Set(contributions.map((item) => item.party));
  const internalContribution: ContributionItem[] =
    developers.length > 0 && !existingParties.has("IT 部门开发组")
      ? [{
          party: "IT 部门开发组",
          type: "内部IT",
          responsibility: `${developers.join("、")} 负责开发、排期、任务拆分和进度回报。`,
          effort: `${Math.max(12, Math.round(project.personDays * 0.6))} 人天`,
          cost: "内部人天",
          status: "已分配"
        }]
      : [];
  const supplierContributions: ContributionItem[] = suppliers
    .filter((name) => !existingParties.has(name))
    .map((name) => {
      const supplier = supplierBudgets.find((item) => item.supplier === name);
      return {
        party: name,
        type: "外部供应商",
        responsibility: "承担外部交付、实施排期、供应商风险和交付材料闭环。",
        effort: supplier ? supplier.deliveryStatus : "待确认",
        cost: supplier ? formatMoney(supplier.contract) : "待确认",
        status: "已分配"
      };
    });
  return [...contributions, ...internalContribution, ...supplierContributions];
}

function nextProjectWindow(project: Project) {
  const pending = project.milestones.find((item) => item.status !== "已完成");
  return pending ? `即日起至 ${pending.date}` : "即日起至项目完成";
}

function slugify(value: string) {
  return value.replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fa5-]/g, "");
}
