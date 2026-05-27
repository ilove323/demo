import { AlertTriangle, CheckCircle2, Gauge } from "lucide-react";
import { dashboardByRole, demands } from "../data";
import type { DemandProjectFlow, Metric, Project, RoleId, Task, Tone } from "../types";
import { MetricCard, MiniBarChart, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";

interface DashboardTodo {
  title: string;
  detail: string;
  badge: string;
  tone: Tone;
  projectId?: string;
}

export function Dashboard({
  role,
  projects,
  tasks,
  flows,
  onOpenProjectDetail
}: {
  role: RoleId;
  projects: Project[];
  tasks: Task[];
  flows: DemandProjectFlow[];
  onOpenProjectDetail: (id: string) => void;
}) {
  const config = dashboardByRole[role];
  const risky = projects
    .filter((project) => project.risk !== "低")
    .sort((a, b) => riskWeight(b.risk) - riskWeight(a.risk) || b.progress - a.progress);
  const metrics = dashboardMetrics(role, config.metrics, projects, tasks);
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
                  <td>{productOwnerForProject(project)}</td>
                  <td>
                    <StatusTag tone={toneForStatus(project.risk)}>{project.risk}</StatusTag>
                  </td>
                  <td>
                    <ProgressBar value={project.progress} />
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
    </section>
  );
}

function dashboardMetrics(role: RoleId, fallback: Metric[], projects: Project[], tasks: Task[]): Metric[] {
  if (role !== "pm") return fallback;
  const pendingStart = projects.filter((project) => project.stage === "项目启动").length;
  const running = projects.filter((project) => project.stage === "项目进行").length;
  const unfinishedTasks = tasks.filter((task) => task.status !== "已完成").length;
  const availableDays = Math.max(0, 240 - projects.filter((project) => project.stage !== "验收完成").reduce((sum, project) => sum + project.personDays, 0));
  const budgetWarnings = projects.filter((project) => project.usedBudget / project.budget >= 0.72 || project.risk !== "低").length;
  const supplierProjects = projects.filter((project) => project.implementation !== "内部实现").length;
  return [
    { label: "待启动项目", value: String(pendingStart), delta: "需判断资源是否合适", tone: pendingStart > 0 ? "orange" : "green" },
    { label: "项目进行中", value: String(running), delta: `${unfinishedTasks} 个任务未完成`, tone: "blue" },
    { label: "可用人天", value: String(availableDays), delta: "按当前 mock 资源池估算", tone: availableDays < 40 ? "orange" : "cyan" },
    { label: "预算预警", value: String(budgetWarnings), delta: `供应商项目共 ${supplierProjects} 个`, tone: budgetWarnings > 0 ? "orange" : "green" }
  ];
}

function projectStageDistribution(projects: Project[]) {
  return ["项目启动", "项目进行", "项目验收", "验收完成"].map((stage) => ({
    label: stage,
    value: projects.filter((project) => project.stage === stage).length
  }));
}

function dashboardTodos(role: RoleId, fallback: string[], projects: Project[], tasks: Task[], flows: DemandProjectFlow[]): DashboardTodo[] {
  if (role !== "pm") return fallback.map((title) => ({ title, detail: "", badge: "待办", tone: "gray" }));
  const byProjectId = new Map(projects.map((project) => [project.id, project]));
  const startTodos = projects
    .filter((project) => project.stage === "项目启动")
    .map((project) => ({
      title: `启动判断：${project.name}`,
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
        detail: `${unfinished} 个任务未完成 · 进度 ${project.progress}% · 风险 ${project.risk}`,
        badge: "推进",
        tone: project.risk === "高" ? "red" as const : project.risk === "中" ? "orange" as const : "blue" as const,
        projectId: project.id
      }];
    });
  const acceptanceTodos = projects
    .filter((project) => project.stage === "项目验收")
    .map((project) => ({
      title: `验收推进：${project.name}`,
      detail: "产品经理验收节点，开发和供应商补齐上线与归档材料",
      badge: "验收",
      tone: "green" as const,
      projectId: project.id
    }));
  const flowTodos = flows
    .filter((flow) => flow.currentNodeId === "projectStart")
    .map((flow) => byProjectId.get(flow.projectId))
    .filter((project): project is Project => Boolean(project))
    .map((project) => ({
      title: `资源判断：${project.name}`,
      detail: `${project.personDays} 人天 · ${project.resources.slice(0, 2).join(" / ")}`,
      badge: "资源",
      tone: "cyan" as const,
      projectId: project.id
    }));
  const seen = new Set<string>();
  return [...startTodos, ...flowTodos, ...executionTodos, ...acceptanceTodos]
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
        const size = Math.max(34, Math.min(58, 28 + project.personDays / 4));
        return (
          <button
            className={`health-dot risk-${project.risk}`}
            key={project.id}
            style={{
              left: `${Math.max(8, Math.min(92, project.progress))}%`,
              bottom: `${Math.max(10, Math.min(88, budgetRate))}%`,
              width: size,
              height: size
            }}
            type="button"
            onClick={() => onOpenProjectDetail(project.id)}
            title={`${project.name}：进度 ${project.progress}% / 预算 ${budgetRate}% / 风险 ${project.risk}`}
          >
            <strong>{project.id.replace("PRJ-", "")}</strong>
            <span>{project.risk}</span>
          </button>
        );
      })}
    </div>
  );
}

function productOwnerForProject(project: Project) {
  const demand = demands.find((item) => item.id === project.demandId);
  return demand?.handler.replace(" / 产品", "") ?? "未分配";
}

function riskWeight(risk: Project["risk"]) {
  if (risk === "高") return 3;
  if (risk === "中") return 2;
  return 1;
}
