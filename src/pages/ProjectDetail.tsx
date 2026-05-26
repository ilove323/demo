import { ArrowLeft, Bot, BrainCircuit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DemandProjectFlowBoard } from "../components/DemandProjectFlowBoard";
import { ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";
import { projectDependencies, users } from "../data";
import { getProjectManagerActions } from "./Projects";
import type { DeliveryRequest, Demand, DemandProjectFlow, FlowActionId, FlowActionLog, Project, ProjectActionLog, ProjectStage, RoleId, RoleOption, Task, TaskPresetFilter } from "../types";

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
  onUpdateProjectRecord: (projectId: string, patch: Partial<Project>, summary: string) => void;
  onAdvanceProjectStage: (projectId: string, nextStage?: ProjectStage) => void;
  onOpenTaskFilter: (filter: Omit<TaskPresetFilter, "nonce">) => void;
}) {
  const [riskDraft, setRiskDraft] = useState(project.riskResponse);
  const [recordDraft, setRecordDraft] = useState(project.riskReason);
  const [projectAssignee, setProjectAssignee] = useState(project.owner);
  const projectManagerOptions = useMemo(
    () =>
      unique([
        ...users.filter((user) => user.departmentId === "it" && user.roleId === "pm").map((user) => user.name),
        ...projects.map((item) => item.owner),
        ...projects.map((item) => item.supplierManager)
      ]).filter((name) => name !== "无外部供应商"),
    [projects]
  );
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const selectedProjectTasks = project.taskIds.map((taskId) => taskById.get(taskId)).filter((task): task is Task => Boolean(task));
  const missingTaskIds = project.taskIds.filter((taskId) => !taskById.has(taskId));
  const selectedFlowLogs = flow ? flowActionLogs.filter((log) => log.flowId === flow.id) : [];
  const selectedProjectLogs = projectActionLogs.filter((log) => log.projectId === project.id);
  const managerActions = flow ? getProjectManagerActions(activeRole, flow) : [];
  const canOpenTasks = ["admin", "pm", "itOwner", "rdOwner", "developer"].includes(activeRole);
  const relatedDependencies = projectDependencies.filter((item) => item.project === project.name || item.target === project.name);

  useEffect(() => {
    setRiskDraft(project.riskResponse);
    setRecordDraft(project.riskReason);
    setProjectAssignee(projectManagerOptions.includes(project.owner) ? project.owner : projectManagerOptions[0] ?? "");
  }, [project, projectManagerOptions]);

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
          <strong>{project.progress}%</strong>
          <ProgressBar value={project.progress} />
        </article>
        <article className="summary-tile">
          <span>预算使用</span>
          <strong>{formatMoney(project.usedBudget)}</strong>
          <small>总预算 {formatMoney(project.budget)}</small>
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

          <div className="panel">
            <SectionHeader title="项目基础信息" />
            <div className="detail-list relaxed">
              <div><span>关联需求</span><strong>{demand ? `${demand.id} · ${demand.name}` : project.demandId}</strong></div>
              <div><span>项目经理</span><strong>{project.owner}</strong></div>
              <div><span>供应商管理</span><strong>{project.supplierManager}</strong></div>
              <div><span>项目申请</span><strong>{deliveryRequest ? `${deliveryRequest.id} · ${deliveryRequest.status}` : "暂无申请记录"}</strong></div>
              <div><span>风险原因</span><strong>{project.riskReason}</strong></div>
            </div>
          </div>

          {flow ? (
            <div className="panel">
              <SectionHeader title="协作链路与项目经理动作" />
              <DemandProjectFlowBoard
                flow={flow}
                actions={managerActions}
                actionTitle="项目经理业务动作"
                logs={selectedFlowLogs}
                onApplyAction={onApplyFlowAction}
              />
            </div>
          ) : null}

          {["admin", "pm", "itOwner"].includes(activeRole) ? (
            <div className="panel">
              <SectionHeader title="项目治理操作" />
              {activeRole === "itOwner" ? (
                <div className="assignment-strip">
                  <div>
                    <strong>分配项目负责人</strong>
                    <span>{project.name} · 当前负责人：{project.owner}</span>
                  </div>
                  <div className="assignment-controls">
                    <select className="inline-select" value={projectAssignee} onChange={(event) => setProjectAssignee(event.target.value)}>
                      {projectManagerOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <button
                      className="btn"
                      type="button"
                      disabled={!projectAssignee || projectAssignee === project.owner}
                      onClick={() => onAssignWork(projectAssignee, "project", project.id, `${project.name} 项目治理和供应商交付`)}
                    >
                      分配给{projectAssignee || "项目经理"}
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="project-command-grid">
                <button className="btn" type="button" onClick={() => onAdvanceProjectStage(project.id)}>推进交付阶段</button>
                <button className="btn secondary" type="button" onClick={() => onUpdateProjectRecord(project.id, { riskResponse: `${project.riskResponse} 已追加每日例会和供应商问题清单。` }, "追加每日例会和供应商问题清单")}>更新风险应对</button>
                <button className="btn secondary" type="button" onClick={() => onApplyFlowAction(flow?.id ?? "", "pm.submitArchive")} disabled={!flow}>提交上线归档</button>
              </div>
              <div className="form-grid project-record-form">
                <label className="wide">风险原因<textarea value={recordDraft} onChange={(event) => setRecordDraft(event.target.value)} /></label>
                <label className="wide">应对措施<textarea value={riskDraft} onChange={(event) => setRiskDraft(event.target.value)} /></label>
              </div>
              <div className="split-actions">
                <button className="btn secondary" type="button" onClick={() => { setRecordDraft(project.riskReason); setRiskDraft(project.riskResponse); }}>重置</button>
                <button className="btn" type="button" onClick={() => onUpdateProjectRecord(project.id, { riskReason: recordDraft, riskResponse: riskDraft }, "更新风险原因和应对措施")}>保存项目记录</button>
              </div>
            </div>
          ) : null}

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
        </div>

        <aside className="detail-side">
          <div className="panel">
            <SectionHeader title="阶段计划" />
            <div className="stage-strip vertical">
              {project.stages.map((stage) => <span className={stage.done ? "done" : ""} key={stage.name}>{stage.name}</span>)}
            </div>
          </div>

          <div className="panel">
            <SectionHeader title="里程碑" />
            <ul className="timeline">
              {project.milestones.map((item) => <li key={`${item.name}${item.date}`}>{item.date} · {item.name} · {item.status}</li>)}
            </ul>
          </div>

          <div className="panel">
            <SectionHeader title="资源与预算" />
            <ul className="pill-list">{project.resources.map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="contribution-list compact">
              {project.contributions.map((item) => (
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
          </div>

          <div className="panel">
            <SectionHeader title="依赖关系" />
            {relatedDependencies.length > 0 ? (
              <ul className="timeline">
                {relatedDependencies.map((item) => <li key={`${item.project}${item.target}`}>{item.relation}：{item.target} · {item.status}</li>)}
              </ul>
            ) : (
              <div className="empty-state table-empty"><strong>暂无依赖</strong><span>当前项目未配置显性父子或阻塞关系。</span></div>
            )}
          </div>

          <div className="panel">
            <SectionHeader title="操作记录" action={<Bot size={17} />} />
            {selectedProjectLogs.length > 0 ? (
              <ul className="timeline compact">
                {selectedProjectLogs.map((log) => <li key={log.id}>{log.time} · {log.actor} · {log.actionName} · {log.summary}</li>)}
              </ul>
            ) : (
              <div className="empty-state table-empty"><strong>暂无操作记录</strong><span>项目推进后会在这里沉淀记录。</span></div>
            )}
          </div>
        </aside>
      </div>
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
