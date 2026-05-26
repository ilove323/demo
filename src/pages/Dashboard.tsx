import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { dashboardByRole, projects, resourceTrend, stageDistribution } from "../data";
import type { RoleId } from "../types";
import { MetricCard, MiniBarChart, ProgressBar, SectionHeader, StatusTag, TrendLine, toneForStatus } from "../components/ui";

export function Dashboard({ role }: { role: RoleId }) {
  const config = dashboardByRole[role];
  const risky = projects.filter((project) => project.risk !== "低");

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>{config.title}</h1>
        </div>
      </div>

      <div className="grid-4">
        {config.metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid-2">
        <div className="panel">
          <SectionHeader eyebrow="PROJECT STAGE" title="项目阶段分布" />
          <MiniBarChart data={stageDistribution} suffix=" 个" />
        </div>
        <div className="panel">
          <SectionHeader eyebrow="RESOURCE" title="资源投入趋势（人天）" />
          <TrendLine data={resourceTrend} />
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
                <th>负责人</th>
                <th>风险</th>
                <th>进度</th>
              </tr>
            </thead>
            <tbody>
              {risky.map((project) => (
                <tr key={project.id}>
                  <td>
                    <strong>{project.name}</strong>
                    <div className="muted-text">{project.riskReason}</div>
                  </td>
                  <td>{project.owner}</td>
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
            {config.todos.map((todo) => (
              <li key={todo}>{todo}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
