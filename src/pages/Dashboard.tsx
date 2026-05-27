import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, BarChart3, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, FileText, Flame, Gauge, Layers3, MessageSquare, TrendingUp, UsersRound } from "lucide-react";
import { dashboardByRole } from "../data";
import { projectDeliveryProgress } from "../projectProgress";
import type { Demand, DemandProjectFlow, Metric, Project, RoleId, RoleOption, Task, Tone } from "../types";
import { MetricCard, MiniBarChart, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";

interface DashboardTodo {
  title: string;
  detail: string;
  badge: string;
  tone: Tone;
  projectId?: string;
}

const executiveDepartments = ["财务", "采购", "临床", "人事", "IT部"];

interface ExecutiveBudgetRow {
  id?: string;
  name: string;
  rate: number;
  spend: number;
  status: string;
}

interface ExecutiveGanttRow {
  id?: string;
  name: string;
  projectType: string;
  implementation: string;
  stage: string;
  risk: Project["risk"];
  progress: number;
  left: number;
  width: number;
}

interface ExecutiveRiskCard {
  title: string;
  text: string;
  badge: string;
  tone: string;
  projectId?: string;
}

export function Dashboard({
  role,
  activeUser,
  demands,
  projects,
  tasks,
  flows,
  onOpenProjectDetail,
  onOpenDemandDetail
}: {
  role: RoleId;
  activeUser: RoleOption;
  demands: Demand[];
  projects: Project[];
  tasks: Task[];
  flows: DemandProjectFlow[];
  onOpenProjectDetail: (id: string) => void;
  onOpenDemandDetail?: (id: string) => void;
}) {
  if (role === "executive" || role === "admin") {
    return (
      <ExecutiveDashboard
        role={role}
        activeUser={activeUser}
        demands={demands}
        projects={projects}
        tasks={tasks}
        flows={flows}
        onOpenProjectDetail={onOpenProjectDetail}
      />
    );
  }

  if (role === "product") {
    return (
      <ProductDashboard
        activeUser={activeUser}
        demands={demands}
        projects={projects}
        tasks={tasks}
        flows={flows}
        onOpenDemandDetail={onOpenDemandDetail}
        onOpenProjectDetail={onOpenProjectDetail}
      />
    );
  }

  const config = dashboardByRole[role];
  const risky = projects
    .filter((project) => project.risk !== "低")
    .sort((a, b) => riskWeight(b.risk) - riskWeight(a.risk) || b.progress - a.progress);
  const metrics = dashboardMetrics(role, config.metrics, demands, projects, tasks, activeUser);
  const stageDistribution = projectStageDistribution(projects);
  const todos = dashboardTodos(role, config.todos, projects, tasks, flows);

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>{config.title}</h1>
        </div>
      </div>

      <div className="grid-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {role !== "requester" ? (
        <>
          <div className="grid-2">
            <div className="panel">
              <SectionHeader eyebrow="PROJECT STAGE" title="项目阶段分布" />
              <MiniBarChart data={stageDistribution} suffix=" 个" />
            </div>
            <div className="panel">
              <SectionHeader
                eyebrow="CONTROL"
                title="项目健康象限（进度 × 预算）"
                action={
                  <span className="tag tone-blue">
                    <Gauge size={13} /> 点击看详情
                  </span>
                }
              />
              <ProjectHealthMap projects={projects} onOpenProjectDetail={onOpenProjectDetail} />
            </div>
          </div>

          <div className="grid-2">
            <div className="panel">
              <SectionHeader
                eyebrow="RISK"
                title="风险项目"
                action={
                  <span className="tag tone-red">
                    <AlertTriangle size={13} /> {risky.length} 项需关注
                  </span>
                }
              />
              <table className="data-table">
                <thead>
                  <tr>
                    <th>项目</th>
                    <th>产品经理</th>
                    <th>风险</th>
                    <th>进度</th>
                  </tr>
                </thead>
                <tbody>
                  {risky.map((project) => (
                    <tr
                      className="clickable"
                      key={project.id}
                      tabIndex={0}
                      onClick={() => onOpenProjectDetail(project.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") onOpenProjectDetail(project.id);
                      }}
                    >
                      <td>
                        <strong>{project.name}</strong>
                        <div className="muted-text">{project.riskReason}</div>
                      </td>
                      <td>{productOwnerForProject(project, demands)}</td>
                      <td>
                        <StatusTag tone={toneForStatus(project.risk)}>{project.risk}</StatusTag>
                      </td>
                      <td>
                        <ProgressBar value={projectDeliveryProgress(project)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel">
              <SectionHeader
                eyebrow="TODO"
                title={config.focusTitle}
                action={
                  <span className="tag tone-green">
                    <CheckCircle2 size={13} /> 今日视图
                  </span>
                }
              />
              <ul className="todo-list">
                {todos.map((todo) => (
                  <li key={`${todo.title}${todo.projectId ?? ""}`}>
                    {todo.projectId ? (
                      <button className="todo-action" type="button" onClick={() => onOpenProjectDetail(todo.projectId!)}>
                        <span>
                          <strong>{todo.title}</strong>
                          <small>{todo.detail}</small>
                        </span>
                        <StatusTag tone={todo.tone}>{todo.badge}</StatusTag>
                      </button>
                    ) : (
                      todo.title
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ExecutiveDashboard({
  role,
  demands,
  projects,
  tasks,
  flows,
  onOpenProjectDetail
}: {
  role: RoleId;
  activeUser: RoleOption;
  demands: Demand[];
  projects: Project[];
  tasks: Task[];
  flows: DemandProjectFlow[];
  onOpenProjectDetail: (id: string) => void;
}) {
  const [scope, setScope] = useState("全公司");
  const [monthIndex, setMonthIndex] = useState(1);
  const months = ["2026-04", "2026-05", "2026-06"];
  const month = months[monthIndex];
  const scopeOptions = useMemo(() => executiveScopeOptions(demands, projects), [demands, projects]);
  const usesLiveFinanceData = scope === "财务";
  const financeProjects = useMemo(() => filterExecutiveProjects(projects, demands, "财务"), [demands, projects]);
  const financeDemands = useMemo(() => filterExecutiveDemands(demands, "财务"), [demands]);
  const financeTasks = useMemo(() => {
    const projectIds = new Set(financeProjects.map((project) => project.id));
    return tasks.filter((task) => projectIds.has(task.projectId));
  }, [financeProjects, tasks]);
  const mockData = useMemo(() => executiveMockData(scope), [scope]);
  const demandSummary = usesLiveFinanceData ? executiveDemandSummary(financeDemands) : mockData.demandSummary;
  const kpis = usesLiveFinanceData ? executiveKpis(demandSummary, financeProjects, financeTasks, flows) : executiveMockKpis(mockData);
  const demandRows = usesLiveFinanceData ? executiveDemandRows(financeDemands, true) : mockData.demandRows;
  const resourceRows = usesLiveFinanceData ? executiveResourceRows(financeProjects, financeDemands, financeTasks) : mockData.resourceRows;
  const riskCards = usesLiveFinanceData ? executiveRiskCards(financeProjects, financeTasks) : mockData.riskCards;
  const budgetRows = usesLiveFinanceData ? executiveBudgetRows(financeProjects) : mockData.budgetRows;
  const ganttRows = usesLiveFinanceData ? executiveGanttRows(financeProjects, month) : executiveMockGanttRows(mockData.ganttRows, month);

  return (
    <section className="executive-dashboard">
      <header className="executive-hero">
        <div>
          <span className="executive-kicker">{role === "admin" ? "ADMIN EXECUTIVE VIEW" : "EXECUTIVE COMMAND CENTER"}</span>
          <h1>IT项目驾驶舱</h1>
        </div>
        <div className="executive-toolbar">
          <div className="executive-month">
            <button type="button" onClick={() => setMonthIndex((value) => Math.max(0, value - 1))} aria-label="上个月">
              <ChevronLeft size={16} />
            </button>
            <span>{month}</span>
            <button type="button" onClick={() => setMonthIndex((value) => Math.min(months.length - 1, value + 1))} aria-label="下个月">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="executive-scope">
            {scopeOptions.map((item) => (
              <button className={scope === item ? "selected" : ""} type="button" key={item} onClick={() => setScope(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="executive-kpi-grid">
        {kpis.map((item) => (
          <article className={`executive-kpi tone-${item.tone}`} key={item.label}>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.hint}</small>
            </div>
            <item.icon size={22} />
          </article>
        ))}
      </div>

      <div className="executive-main-grid">
        <section className="executive-panel executive-demand-panel">
          <ExecutivePanelHead title="业务需求承接总览" subtitle="需求状态漏斗 + 部门热力" />
          <div className="executive-demand-layout">
            <div className="executive-funnel">
              <div style={{ width: "100%" }}>提出 {demandSummary.proposed}</div>
              <div style={{ width: `${Math.max(46, demandSummary.acceptedRate)}%` }}>接收 {demandSummary.accepted}</div>
              <div style={{ width: `${Math.max(34, demandSummary.completedRate)}%` }}>完成 {demandSummary.completed}</div>
            </div>
            <div className="executive-heat-table">
              <span className="axis">组织</span>
              <span className="axis">提出</span>
              <span className="axis">承接</span>
              <span className="axis">完成</span>
              {demandRows.map((row) => (
                <div className="executive-heat-row" key={row.name}>
                  <strong>{row.name}</strong>
                  <span className={heatClass(row.proposed)}>{row.proposed}</span>
                  <span className={heatClass(row.accepted)}>{row.accepted}</span>
                  <span className={heatClass(row.completed)}>{row.completed}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="executive-panel executive-resource-panel">
          <ExecutivePanelHead title="资源投入情况" subtitle="内部开发、项目治理和供应商投入" />
          <div className="executive-workload-head">
            <strong>人力投入：部门 × 本月周负荷热力</strong>
            <span>峰值负荷</span>
          </div>
          <div className="executive-workload-weeks">
            <span />
            {["W1", "W2", "W3", "W4", "W5"].map((week) => <span key={week}>{week}</span>)}
            <span />
          </div>
          <div className="executive-workload">
            {resourceRows.map((row) => (
              <div className="executive-workload-row" key={row.name}>
                <span>{row.name}</span>
                <div>
                  {row.weeks.map((value, index) => (
                    <i className={loadClass(value)} style={{ height: `${Math.max(16, value)}%` }} key={`${row.name}-${index}`} title={`${value}%`} />
                  ))}
                </div>
                <strong>{Math.max(...row.weeks)}%</strong>
              </div>
            ))}
          </div>
          <div className="executive-workload-head executive-budget-head">
            <strong>资金投入：项目级预算执行与预测偏差</strong>
            <span>黄线=预算执行，白线=预算</span>
          </div>
          <div className="executive-budget-list">
            {budgetRows.map((project) => (
              <button type="button" key={project.name} onClick={() => project.id && onOpenProjectDetail(project.id)}>
                <span>{project.name}</span>
                <i><b style={{ width: `${project.rate}%` }} /></i>
                <strong>{project.spend}万</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="executive-panel executive-gantt-panel">
          <ExecutivePanelHead title="项目交付路线图" subtitle="按项目查看本月交付窗口，点击进入项目详情" />
          <div className="executive-gantt-scale">
            <span />
            <span>5/1</span>
            <span>5/8</span>
            <span>5/15</span>
            <span>5/22</span>
            <span>5/29</span>
          </div>
          <div className="executive-gantt-list">
            {ganttRows.map((project) => (
              <button className="executive-gantt-row" type="button" key={project.name} onClick={() => project.id && onOpenProjectDetail(project.id)}>
                <span>
                  <strong>{project.name}</strong>
                  <small>{project.projectType} · {project.implementation}</small>
                </span>
                <i>
                  <b className={`risk-${riskTone(project.risk)}`} style={{ left: `${project.left}%`, width: `${project.width}%` }}>{project.stage}</b>
                </i>
                <em>{project.progress}%</em>
              </button>
            ))}
          </div>
        </section>

        <section className="executive-panel executive-risk-panel">
          <ExecutivePanelHead title="风险解读" subtitle="从项目、预算、资源和延期任务自动归因" />
          <div className="executive-risk-list">
            {riskCards.map((risk) => (
              <button className={`executive-risk-card tone-${risk.tone}`} type="button" key={risk.title} onClick={() => risk.projectId && onOpenProjectDetail(risk.projectId)}>
                <strong>{risk.title}</strong>
                <p>{risk.text}</p>
                <span>{risk.badge}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function ExecutivePanelHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="executive-panel-head">
      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <div className="executive-head-bars"><i /><i /><i /></div>
    </header>
  );
}

function ProductDashboard({
  activeUser,
  demands,
  projects,
  tasks,
  flows,
  onOpenDemandDetail,
  onOpenProjectDetail
}: {
  activeUser: RoleOption;
  demands: Demand[];
  projects: Project[];
  tasks: Task[];
  flows: DemandProjectFlow[];
  onOpenDemandDetail?: (id: string) => void;
  onOpenProjectDetail: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "review" | "progress" | "confirm">("all");
  const productDemands = demands.filter((demand) => demand.handler.includes(activeUser.userName));
  const flowByDemandId = new Map(flows.map((flow) => [flow.demandId, flow]));
  const reviewDemands = productDemands.filter((demand) => {
    const flow = flowByDemandId.get(demand.id);
    return demand.status === "需求评审" || flow?.currentDemandNodeId === "demandReview" || flow?.currentNodeId === "demandReview";
  });
  const confirmDemands = productDemands.filter((demand) => {
    const flow = flowByDemandId.get(demand.id);
    return demand.status === "方案确认" || flow?.currentDemandNodeId === "solutionConfirm" || flow?.currentNodeId === "solutionConfirm";
  });
  const productProjects = projects.filter((project) => productDemands.some((demand) => demand.id === project.demandId) && project.stage !== "项目结束");
  const visibleSections = {
    review: filter === "all" || filter === "review",
    progress: filter === "all" || filter === "progress",
    confirm: filter === "all" || filter === "confirm"
  };
  const total = reviewDemands.length + productProjects.length + confirmDemands.length;

  return (
    <section className="page product-workbench-page">
      <div className="product-workbench-tabs" aria-label="产品经理工作分类">
        <button className={filter === "all" ? "selected" : ""} type="button" onClick={() => setFilter("all")}>
          <span>全部工作</span><b>{total}</b>
        </button>
        <button className={filter === "review" ? "selected" : ""} type="button" onClick={() => setFilter("review")}>
          <span>需求评审</span><b>{reviewDemands.length}</b>
        </button>
        <button className={filter === "progress" ? "selected" : ""} type="button" onClick={() => setFilter("progress")}>
          <span>项目进度</span><b>{productProjects.length}</b>
        </button>
        <button className={filter === "confirm" ? "selected" : ""} type="button" onClick={() => setFilter("confirm")}>
          <span>方案确认</span><b>{confirmDemands.length}</b>
        </button>
      </div>

      <div className="product-workbench-grid">
        {visibleSections.review ? (
          <section className="product-workbench-panel">
            <ProductPanelTitle icon={<FileText size={24} />} title="待评审需求" count={`${reviewDemands.length} 个待处理`} tone="orange" />
            <div className="product-workbench-list">
              {reviewDemands.map((demand) => (
                <button className="product-review-item" type="button" key={demand.id} onClick={() => onOpenDemandDetail?.(demand.id)}>
                  <span>
                    <strong>{demand.name}</strong>
                    <small>来自：{demand.team}-{demand.requester}</small>
                    <em><Clock3 size={14} /> {relativeDueText(demand.targetDate)}</em>
                  </span>
                  <StatusTag tone={priorityTone(demand.priority)}>{priorityLabel(demand.priority)}</StatusTag>
                </button>
              ))}
              {reviewDemands.length === 0 ? <ProductEmpty text="暂无第一阶段待评审需求" /> : null}
            </div>
          </section>
        ) : null}

        {visibleSections.progress ? (
          <section className="product-workbench-panel">
            <ProductPanelTitle icon={<TrendingUp size={24} />} title="项目进度" count={`${productProjects.length} 个进行中`} tone="blue" />
            <div className="product-workbench-list">
              {productProjects.map((project) => {
                const projectTasks = tasks.filter((task) => task.projectId === project.id);
                return (
                  <button className="product-progress-item" type="button" key={project.id} onClick={() => onOpenProjectDetail(project.id)}>
                    <div className="product-progress-head">
                      <strong>{project.name}</strong>
                      <StatusTag tone={toneForStatus(project.risk)}>{project.risk === "高" ? "高风险" : project.risk === "中" ? "中风险" : "正常"}</StatusTag>
                    </div>
                    <div className="product-progress-meta">
                      <span>进度 {projectDeliveryProgress(project)}%</span>
                      <span>{projectTasks.length} 人参与</span>
                    </div>
                    <ProgressBar value={projectDeliveryProgress(project)} />
                    <div className="product-progress-foot">
                      <span>下阶段：{nextProjectStage(project.stage)}</span>
                      <span>{deadlineText(project.milestones.at(-1)?.date)}</span>
                    </div>
                  </button>
                );
              })}
              {productProjects.length === 0 ? <ProductEmpty text="暂无需要产品跟进的项目" /> : null}
            </div>
          </section>
        ) : null}

        {visibleSections.confirm ? (
          <section className="product-workbench-panel">
            <ProductPanelTitle icon={<MessageSquare size={24} />} title="方案确认" count={`${confirmDemands.length} 个待办`} tone="violet" />
            <div className="product-workbench-list">
              {confirmDemands.map((demand, index) => (
                <button className="product-confirm-item" type="button" key={demand.id} onClick={() => onOpenDemandDetail?.(demand.id)}>
                  <span className={index < 2 ? "confirm-icon scheduled" : "confirm-icon pending"}>
                    {index < 2 ? <CalendarDays size={18} /> : <Clock3 size={18} />}
                  </span>
                  <span>
                    <strong>{confirmTitle(demand)}</strong>
                    <small>与：{demand.team}-{demand.requester}</small>
                    <em><b>{index < 2 ? "已安排" : "待安排"}</b>{index < 2 ? ` 今天 ${index === 0 ? "14:00" : "16:00"}` : " 明天 10:00"}</em>
                  </span>
                </button>
              ))}
              {confirmDemands.length === 0 ? <ProductEmpty text="暂无第二阶段方案确认事项" /> : null}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

function ProductPanelTitle({ icon, title, count, tone }: { icon: ReactNode; title: string; count: string; tone: Tone }) {
  return (
    <header className="product-panel-title">
      <div className={`product-title-icon tone-${tone}`}>{icon}</div>
      <strong>{title}</strong>
      <span>{count}</span>
    </header>
  );
}

function ProductEmpty({ text }: { text: string }) {
  return <div className="product-empty">{text}</div>;
}

function priorityTone(priority: Demand["priority"]): Tone {
  if (priority === "P0") return "red";
  if (priority === "P1") return "orange";
  if (priority === "P2") return "blue";
  return "gray";
}

function priorityLabel(priority: Demand["priority"]) {
  if (priority === "P0") return "紧急";
  if (priority === "P1") return "高";
  if (priority === "P2") return "中";
  return "低";
}

function relativeDueText(date: string) {
  const target = new Date(`${date}T00:00:00`);
  const base = new Date("2026-05-27T00:00:00");
  const days = Math.round((target.getTime() - base.getTime()) / 86400000);
  if (days <= 0) return "今天截止";
  if (days === 1) return "1 天后截止";
  return `${days} 天后截止`;
}

function deadlineText(date?: string) {
  if (!date) return "未设截止";
  return relativeDueText(date);
}

function nextProjectStage(stage: Project["stage"]) {
  const order: Project["stage"][] = ["项目准备", "项目启动", "项目进行", "项目完成", "项目结束"];
  const index = order.indexOf(stage);
  return order[Math.min(order.length - 1, index + 1)] ?? "项目进行";
}

function confirmTitle(demand: Demand) {
  if (demand.name.includes("字段")) return demand.name;
  if (demand.name.includes("CRM")) return "确认拜访合规方案范围";
  if (demand.name.includes("SAP")) return "确认财务供应链接口范围";
  return `确认${demand.name}方案范围`;
}

function executiveScopeOptions(demands: Demand[], _projects: Project[]) {
  const demandTeams = demands.map((demand) => normalizeDepartment(demand.team));
  return ["全公司", ...executiveDepartments, ...Array.from(new Set(demandTeams)).filter((item) => !executiveDepartments.includes(item))].slice(0, 7);
}

function filterExecutiveDemands(demands: Demand[], scope: string) {
  if (scope === "全公司" || scope === "IT部") return demands;
  return demands.filter((demand) => normalizeDepartment(demand.team) === scope);
}

function filterExecutiveProjects(projects: Project[], demands: Demand[], scope: string) {
  if (scope === "全公司" || scope === "IT部") return projects;
  const demandById = new Map(demands.map((demand) => [demand.id, demand]));
  return projects.filter((project) => normalizeDepartment(demandById.get(project.demandId)?.team ?? "") === scope);
}

function executiveDemandSummary(demands: Demand[]) {
  const accepted = demands.filter((demand) => !["已打回", "已放弃"].includes(demand.status) && demand.progress >= 30).length;
  const completed = demands.filter((demand) => demand.score || demand.acceptanceReview || demand.progress >= 90).length;
  return {
    proposed: demands.length,
    accepted,
    completed,
    acceptedRate: demands.length ? Math.round((accepted / demands.length) * 100) : 0,
    completedRate: demands.length ? Math.round((completed / demands.length) * 100) : 0
  };
}

function executiveKpis(
  demandSummary: ReturnType<typeof executiveDemandSummary>,
  projects: Project[],
  tasks: Task[],
  flows: DemandProjectFlow[]
) {
  const running = projects.filter((project) => !["项目结束"].includes(project.stage)).length;
  const usedBudget = projects.reduce((sum, project) => sum + project.usedBudget, 0);
  const budget = projects.reduce((sum, project) => sum + project.budget, 0);
  const personDays = projects.reduce((sum, project) => sum + project.personDays, 0);
  const highRisk = projects.filter((project) => project.risk === "高").length;
  const blockedFlows = flows.filter((flow) => flow.nodes.some((node) => node.status === "风险" || node.status === "待确认")).length;
  const unfinishedTasks = tasks.filter((task) => task.status !== "已完成").length;
  return [
    {
      label: "需求提出总量",
      value: String(demandSummary.proposed),
      hint: `承接 ${demandSummary.acceptedRate}% · 完成 ${demandSummary.completedRate}%`,
      tone: "blue",
      icon: Layers3
    },
    {
      label: "进行中项目",
      value: String(running),
      hint: `${unfinishedTasks} 个任务未完成`,
      tone: "cyan",
      icon: CalendarDays
    },
    {
      label: "预算使用",
      value: `${toWan(usedBudget)}万`,
      hint: `总预算 ${toWan(budget)}万`,
      tone: usedBudget / Math.max(1, budget) > 0.82 ? "orange" : "green",
      icon: CircleDollarSign
    },
    {
      label: "资源投入",
      value: `${personDays}人天`,
      hint: `内部 ${projects.reduce((sum, project) => sum + project.resourcePlan.internalPersonDays, 0)} / 外部 ${projects.reduce((sum, project) => sum + project.resourcePlan.externalSupplierPersonDays, 0)}`,
      tone: "violet",
      icon: UsersRound
    },
    {
      label: "高风险项目",
      value: String(highRisk),
      hint: highRisk > 0 ? "需管理层关注" : "暂无高风险",
      tone: highRisk > 0 ? "red" : "green",
      icon: Flame
    },
    {
      label: "待关注交接",
      value: String(blockedFlows),
      hint: "审批、资源或验收节点",
      tone: blockedFlows > 0 ? "orange" : "green",
      icon: BarChart3
    }
  ] as const;
}

function executiveDemandRows(demands: Demand[], liveOnly = false) {
  const rows = new Map<string, Demand[]>();
  demands.forEach((demand) => {
    const team = normalizeDepartment(demand.team);
    rows.set(team, [...(rows.get(team) ?? []), demand]);
  });
  const realRows = new Map(Array.from(rows.entries()).map(([name, items]) => {
    const summary = executiveDemandSummary(items);
    return [name, { name, proposed: summary.proposed, accepted: summary.accepted, completed: summary.completed }];
  }));
  if (liveOnly) return [realRows.get("财务") ?? { name: "财务", proposed: 0, accepted: 0, completed: 0 }];
  return executiveDepartments.map((name, index) => realRows.get(name) ?? {
    name,
    proposed: [7, 5, 4, 3, 6][index],
    accepted: [5, 4, 3, 2, 5][index],
    completed: [3, 2, 2, 1, 4][index]
  });
}

function executiveResourceRows(projects: Project[], demands: Demand[], tasks: Task[]) {
  const internalDays = projects.reduce((sum, project) => sum + project.resourcePlan.internalPersonDays, 0);
  const externalDays = projects.reduce((sum, project) => sum + project.resourcePlan.externalSupplierPersonDays, 0);
  const taskEstimate = tasks.reduce((sum, task) => sum + task.estimate, 0);
  const taskActual = tasks.reduce((sum, task) => sum + task.actual, 0);
  const financeLoad = demands.length * 10 + Math.round(projects.reduce((sum, project) => sum + project.personDays, 0) / 8);
  const itLoad = internalDays + taskEstimate + taskActual + Math.round(externalDays / 2);
  if (demands.every((demand) => normalizeDepartment(demand.team) === "财务")) {
    return [{ name: "财务", weeks: loadWeeks(financeLoad) }];
  }
  return [
    { name: "财务", weeks: loadWeeks(financeLoad) },
    { name: "采购", weeks: [74, 85, 94, 98, 79] },
    { name: "临床", weeks: [92, 109, 121, 97, 81] },
    { name: "人事", weeks: [66, 73, 84, 92, 76] },
    { name: "IT部", weeks: loadWeeks(itLoad) }
  ];
}

function executiveBudgetRows(projects: Project[]): ExecutiveBudgetRow[] {
  return [...projects]
    .sort((a, b) => b.usedBudget / Math.max(1, b.budget) - a.usedBudget / Math.max(1, a.budget))
    .slice(0, 6)
    .map((project) => ({
      id: project.id,
      name: project.name,
      rate: Math.min(128, Math.round((project.usedBudget / Math.max(1, project.budget)) * 100)),
      spend: toWan(project.usedBudget),
      status: project.stage
    }));
}

function executiveGanttRows(projects: Project[], month: string): ExecutiveGanttRow[] {
  const monthOffset = month === "2026-04" ? -8 : month === "2026-06" ? 8 : 0;
  return [...projects]
    .sort((a, b) => riskWeight(b.risk) - riskWeight(a.risk) || projectDeliveryProgress(a) - projectDeliveryProgress(b))
    .slice(0, 8)
    .map((project, index) => {
      const progress = projectDeliveryProgress(project);
      const stageOffset = ["项目准备", "项目启动", "项目进行", "项目完成", "项目结束"].indexOf(project.stage) * 10;
      const left = Math.max(2, Math.min(76, 4 + stageOffset + index * 4 + monthOffset));
      const width = Math.max(18, Math.min(64, 18 + progress / 2));
      return {
        id: project.id,
        name: project.name,
        projectType: project.projectType,
        implementation: project.implementation,
        stage: project.stage,
        risk: project.risk,
        progress,
        left,
        width: Math.min(width, 98 - left)
      };
    });
}

function executiveRiskCards(projects: Project[], tasks: Task[]): ExecutiveRiskCard[] {
  const taskByProjectId = new Map<string, Task[]>();
  tasks.forEach((task) => taskByProjectId.set(task.projectId, [...(taskByProjectId.get(task.projectId) ?? []), task]));
  const projectCards = [...projects]
    .filter((project) => project.risk !== "低" || project.usedBudget / Math.max(1, project.budget) > 0.78)
    .sort((a, b) => riskWeight(b.risk) - riskWeight(a.risk) || b.usedBudget / b.budget - a.usedBudget / a.budget)
    .slice(0, 4)
    .map((project) => {
      const unfinished = (taskByProjectId.get(project.id) ?? []).filter((task) => task.status !== "已完成").length;
      const budgetRate = Math.round((project.usedBudget / Math.max(1, project.budget)) * 100);
      return {
        title: project.name,
        text: `${project.riskReason}；预算使用 ${budgetRate}%，仍有 ${unfinished} 个任务未关闭。`,
        badge: `${project.risk}风险 · ${project.stage}`,
        tone: riskTone(project.risk),
        projectId: project.id
      };
    });
  if (projectCards.length > 0) return projectCards;
  return [{
    title: "当前范围暂无重大风险",
    text: "项目风险、预算偏差和延期任务均未触发高管关注阈值。",
    badge: "健康",
    tone: "green",
    projectId: undefined
  }];
}

function executiveMockData(scope: string) {
  const rowsByScope: Record<string, { proposed: number; accepted: number; completed: number; workload: number[]; budgetSeed: number; risk: Project["risk"] }> = {
    全公司: { proposed: 42, accepted: 31, completed: 21, workload: [86, 94, 108, 101, 89], budgetSeed: 520, risk: "中" },
    采购: { proposed: 9, accepted: 7, completed: 4, workload: [74, 85, 94, 98, 79], budgetSeed: 260, risk: "中" },
    临床: { proposed: 12, accepted: 9, completed: 5, workload: [92, 109, 121, 97, 81], budgetSeed: 430, risk: "高" },
    人事: { proposed: 6, accepted: 4, completed: 3, workload: [66, 73, 84, 92, 76], budgetSeed: 180, risk: "低" },
    IT部: { proposed: 10, accepted: 8, completed: 6, workload: [91, 104, 112, 99, 88], budgetSeed: 380, risk: "中" }
  };
  const config = rowsByScope[scope] ?? rowsByScope.全公司;
  const demandRows = scope === "全公司"
    ? executiveDepartments.map((name, index) => ({
        name,
        proposed: [14, 8, 10, 4, 6][index],
        accepted: [10, 6, 7, 3, 5][index],
        completed: [7, 4, 4, 2, 4][index]
      }))
    : [{ name: scope, proposed: config.proposed, accepted: config.accepted, completed: config.completed }];
  const demandSummary = {
    proposed: demandRows.reduce((sum, row) => sum + row.proposed, 0),
    accepted: demandRows.reduce((sum, row) => sum + row.accepted, 0),
    completed: demandRows.reduce((sum, row) => sum + row.completed, 0),
    acceptedRate: Math.round((demandRows.reduce((sum, row) => sum + row.accepted, 0) / Math.max(1, demandRows.reduce((sum, row) => sum + row.proposed, 0))) * 100),
    completedRate: Math.round((demandRows.reduce((sum, row) => sum + row.completed, 0) / Math.max(1, demandRows.reduce((sum, row) => sum + row.proposed, 0))) * 100)
  };
  const resourceRows = scope === "全公司"
    ? [
        { name: "财务", weeks: [82, 96, 113, 118, 101] },
        { name: "采购", weeks: [74, 85, 94, 98, 79] },
        { name: "临床", weeks: [92, 109, 121, 97, 81] },
        { name: "人事", weeks: [66, 73, 84, 92, 76] },
        { name: "IT部", weeks: [91, 104, 112, 99, 88] }
      ]
    : [{ name: scope, weeks: config.workload }];
  const budgetRows: ExecutiveBudgetRow[] = executiveMockProjectNames(scope).map((name, index) => ({
    name,
    rate: [88, 72, 94, 61, 79, 67][index],
    spend: config.budgetSeed + index * 46,
    status: ["延期", "正常", "临界", "已交付", "正常", "正常"][index]
  }));
  const ganttRows: ExecutiveGanttRow[] = budgetRows.map((project, index) => ({
    name: project.name,
    projectType: index % 3 === 0 ? "软件项目" : index % 3 === 1 ? "软硬件协同" : "硬件项目",
    implementation: index % 2 === 0 ? "合作实现" : "内部实现",
    stage: ["项目准备", "项目启动", "项目进行", "项目完成", "项目进行", "项目结束"][index],
    risk: index === 0 ? config.risk : index === 2 ? "中" : "低",
    progress: [42, 58, 76, 90, 63, 100][index],
    left: 6 + index * 10,
    width: [42, 36, 48, 30, 40, 24][index]
  }));
  const riskCards: ExecutiveRiskCard[] = [
    {
      title: `${scope}资源负荷峰值偏高`,
      text: `W3-W4 周负荷达到 ${Math.max(...config.workload)}%，建议压缩低优先级需求或临时调整供应商投入。`,
      badge: `${config.risk}风险 · 资源`,
      tone: riskTone(config.risk)
    },
    {
      title: `${budgetRows[0].name}预算执行需关注`,
      text: `当前投入 ${budgetRows[0].spend}万，预算执行 ${budgetRows[0].rate}%，需在月度例会上确认范围和验收节奏。`,
      badge: "预算 · 交付",
      tone: budgetRows[0].rate >= 85 ? "red" : "orange"
    }
  ];
  return { demandSummary, demandRows, resourceRows, budgetRows, ganttRows, riskCards };
}

function executiveMockKpis(data: ReturnType<typeof executiveMockData>) {
  const usedBudget = data.budgetRows.reduce((sum, project) => sum + project.spend, 0);
  const highRisk = data.riskCards.filter((card) => card.tone === "red").length;
  return [
    { label: "需求提出总量", value: String(data.demandSummary.proposed), hint: `承接 ${data.demandSummary.acceptedRate}% · 完成 ${data.demandSummary.completedRate}%`, tone: "blue", icon: Layers3 },
    { label: "进行中项目", value: String(data.ganttRows.filter((row) => row.stage !== "项目结束").length), hint: "展示口径按部门月度汇总", tone: "cyan", icon: CalendarDays },
    { label: "预算使用", value: `${usedBudget}万`, hint: "部门月度预算执行", tone: "orange", icon: CircleDollarSign },
    { label: "资源投入", value: `${data.resourceRows.reduce((sum, row) => sum + Math.max(...row.weeks), 0)}%`, hint: "部门峰值负荷合计", tone: "violet", icon: UsersRound },
    { label: "高风险项目", value: String(highRisk), hint: highRisk > 0 ? "需管理层关注" : "暂无高风险", tone: highRisk > 0 ? "red" : "green", icon: Flame },
    { label: "待关注交接", value: String(data.riskCards.length), hint: "审批、资源或验收节点", tone: "orange", icon: BarChart3 }
  ] as const;
}

function executiveMockGanttRows(rows: ExecutiveGanttRow[], month: string) {
  const offset = month === "2026-04" ? -6 : month === "2026-06" ? 6 : 0;
  return rows.map((row) => ({ ...row, left: Math.max(2, Math.min(82, row.left + offset)) }));
}

function executiveMockProjectNames(scope: string) {
  const prefix = scope === "全公司" ? ["财务", "采购", "临床", "人事", "IT", "财务"] : [scope, scope, scope, scope, scope, scope];
  return [
    `${prefix[0]}经营分析平台`,
    `${prefix[1]}流程自动化`,
    `${prefix[2]}数据治理一期`,
    `${prefix[3]}移动审批改造`,
    `${prefix[4]}合规留痕平台`,
    `${prefix[5]}预算执行看板`
  ];
}

function normalizeDepartment(name: string) {
  if (!name || name === "业务部门" || name.includes("运营") || name.includes("市场") || name.includes("财务")) return "财务";
  if (name.includes("采购")) return "采购";
  if (name.includes("临床")) return "临床";
  if (name.includes("人事") || name.includes("人力")) return "人事";
  if (name.includes("研发") || name.includes("IT")) return "IT部";
  if (name.includes("管理")) return "管理层";
  return name;
}

function loadWeeks(base: number) {
  const seed = Math.max(18, Math.min(118, Math.round(base / 2)));
  return [
    Math.min(128, seed),
    Math.min(128, seed + 9),
    Math.min(128, seed + 17),
    Math.max(22, seed - 4),
    Math.min(128, seed + 5)
  ];
}

function heatClass(value: number) {
  if (value >= 6) return "hot";
  if (value >= 3) return "warn";
  return "good";
}

function loadClass(value: number) {
  if (value >= 105) return "hot";
  if (value >= 86) return "warn";
  return "good";
}

function riskTone(risk: Project["risk"]) {
  if (risk === "高") return "red";
  if (risk === "中") return "orange";
  return "green";
}

function toWan(value: number) {
  return Math.round(value / 10000);
}

function dashboardMetrics(role: RoleId, fallback: Metric[], demands: Demand[], projects: Project[], tasks: Task[], activeUser: RoleOption): Metric[] {
  if (role === "requester") return requesterMetrics(demands, projects, activeUser.userName);
  if (role !== "pm") return fallback;
  const pendingPrepare = projects.filter((project) => project.stage === "项目准备").length;
  const pendingStart = projects.filter((project) => project.stage === "项目启动").length;
  const running = projects.filter((project) => project.stage === "项目进行").length;
  const unfinishedTasks = tasks.filter((task) => task.status !== "已完成").length;
  const budgetWarnings = projects.filter((project) => project.usedBudget / project.budget >= 0.72 || project.risk !== "低").length;
  const supplierProjects = projects.filter((project) => project.implementation !== "内部实现").length;
  return [
    { label: "待分配资源", value: String(pendingPrepare), delta: "需项目经理填入开发/供应商", tone: pendingPrepare > 0 ? "orange" : "green" },
    { label: "待启动项目", value: String(pendingStart), delta: "需产品经理填写启动结束时间", tone: pendingStart > 0 ? "orange" : "green" },
    { label: "项目进行中", value: String(running), delta: `${unfinishedTasks} 个任务未完成`, tone: "blue" },
    { label: "预算预警", value: String(budgetWarnings), delta: `供应商项目共 ${supplierProjects} 个`, tone: budgetWarnings > 0 ? "orange" : "green" }
  ];
}

function requesterMetrics(demands: Demand[], projects: Project[], userName: string): Metric[] {
  const myDemands = demands.filter((demand) => demand.requester === userName);
  const myDemandIds = new Set(myDemands.map((demand) => demand.id));
  const runningProjects = projects.filter((project) => myDemandIds.has(project.demandId) && project.stage === "项目进行");
  const pendingSolutions = myDemands.filter((demand) => demand.status === "方案确认");
  const pendingAcceptanceProjects = projects.filter((project) => myDemandIds.has(project.demandId) && project.stage === "项目完成");

  return [
    { label: "我的需求", value: String(myDemands.length), delta: `${projects.filter((project) => myDemandIds.has(project.demandId)).length} 个已关联项目`, tone: "blue" },
    { label: "待确认方案", value: String(pendingSolutions.length), delta: pendingSolutions[0]?.name ?? "暂无待确认方案", tone: pendingSolutions.length > 0 ? "orange" : "green" },
    { label: "进行中项目", value: String(runningProjects.length), delta: runningProjects[0]?.name ?? "暂无进行中项目", tone: runningProjects.length > 0 ? "cyan" : "green" },
    { label: "待验收", value: String(pendingAcceptanceProjects.length), delta: pendingAcceptanceProjects[0]?.name ?? "暂无待验收项目", tone: pendingAcceptanceProjects.length > 0 ? "green" : "gray" }
  ];
}

function projectStageDistribution(projects: Project[]) {
  return ["项目准备", "项目启动", "项目进行", "项目完成", "项目结束"].map((stage) => ({
    label: stage,
    value: projects.filter((project) => project.stage === stage).length
  }));
}

function dashboardTodos(role: RoleId, fallback: string[], projects: Project[], tasks: Task[], flows: DemandProjectFlow[]): DashboardTodo[] {
  if (role !== "pm") return fallback.map((title) => ({ title, detail: "", badge: "待办", tone: "gray" }));
  const byProjectId = new Map(projects.map((project) => [project.id, project]));
  const prepareTodos = projects
    .filter((project) => project.stage === "项目准备")
    .map((project) => ({
      title: `分配资源：${project.name}`,
      detail: `${project.implementation} · 内部 ${project.resourcePlan.internalPersonDays} 人天 · 外部 ${project.resourcePlan.externalSupplierPersonDays} 人天`,
      badge: "资源",
      tone: "orange" as const,
      projectId: project.id
    }));
  const startTodos = projects
    .filter((project) => project.stage === "项目启动")
    .map((project) => ({
      title: `填写启动结束时间：${project.name}`,
      detail: `${project.implementation} · AI ${project.aiScore.total} 分 · ${project.aiScore.recommendation}`,
      badge: "启动",
      tone: "orange" as const,
      projectId: project.id
    }));
  const executionTodos = projects
    .filter((project) => project.stage === "项目进行")
    .flatMap((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      const unfinished = projectTasks.filter((task) => task.status !== "已完成").length;
      if (unfinished === 0) return [];
      return [{
        title: `推进交付：${project.name}`,
        detail: `${unfinished} 个任务未完成 · 进度 ${projectDeliveryProgress(project)}% · 风险 ${project.risk}`,
        badge: "推进",
        tone: project.risk === "高" ? "red" as const : project.risk === "中" ? "orange" as const : "blue" as const,
        projectId: project.id
      }];
    });
  const acceptanceTodos = projects
    .filter((project) => project.stage === "项目完成")
    .map((project) => ({
      title: `验收推进：${project.name}`,
      detail: "产品经理验收节点，开发和供应商补齐上线与归档材料",
      badge: "验收",
      tone: "green" as const,
      projectId: project.id
    }));
  const flowTodos = flows
    .filter((flow) => flow.currentNodeId === "projectPrepare")
    .map((flow) => byProjectId.get(flow.projectId))
    .filter((project): project is Project => Boolean(project))
    .map((project) => ({
      title: `资源分配：${project.name}`,
      detail: `${project.personDays} 人天 · ${project.resources.slice(0, 2).join(" / ")}`,
      badge: "资源",
      tone: "cyan" as const,
      projectId: project.id
    }));
  const seen = new Set<string>();
  return [...prepareTodos, ...startTodos, ...flowTodos, ...executionTodos, ...acceptanceTodos]
    .filter((todo) => {
      const key = `${todo.title}${todo.projectId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

function ProjectHealthMap({ projects, onOpenProjectDetail }: { projects: Project[]; onOpenProjectDetail: (id: string) => void }) {
  return (
    <div className="project-health-map" aria-label="项目健康象限图">
      <div className="health-axis x">进度越高</div>
      <div className="health-axis y">预算使用越高</div>
      <div className="health-zone good">健康</div>
      <div className="health-zone watch">关注</div>
      <div className="health-zone danger">失衡</div>
      {projects.map((project) => {
        const budgetRate = Math.min(100, Math.round((project.usedBudget / project.budget) * 100));
        const deliveryProgress = projectDeliveryProgress(project);
        const size = Math.max(34, Math.min(58, 28 + project.personDays / 4));
        return (
          <button
            className={`health-dot risk-${project.risk}`}
            key={project.id}
            style={{
              left: `${Math.max(8, Math.min(92, deliveryProgress))}%`,
              bottom: `${Math.max(10, Math.min(88, budgetRate))}%`,
              width: size,
              height: size
            }}
            type="button"
            onClick={() => onOpenProjectDetail(project.id)}
            title={`${project.name}：进度 ${deliveryProgress}% / 预算 ${budgetRate}% / 风险 ${project.risk}`}
          >
            <strong>{project.id.replace("PRJ-", "")}</strong>
            <span>{project.risk}</span>
          </button>
        );
      })}
    </div>
  );
}

function productOwnerForProject(project: Project, demands: Demand[]) {
  const demand = demands.find((item) => item.id === project.demandId);
  return demand?.handler.replace(" / 产品", "") ?? "未分配";
}

function riskWeight(risk: Project["risk"]) {
  if (risk === "高") return 3;
  if (risk === "中") return 2;
  return 1;
}
