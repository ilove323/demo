import { Fragment, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { demands as seedDemands, projectInvestmentBreakdowns, projects, resourcePeople, supplierBudgets } from "../data";
import { FilterPanel } from "../components/FilterPanel";
import { MetricCard, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";
import { projectDeliveryProgress } from "../projectProgress";
import type { Demand, DemandProjectFlow, Project, RoleId, RoleOption, Task, Tone } from "../types";

type ReportDomain = "overview" | "project" | "product" | "engineering" | "operations" | "supplier" | "budget";
type TimeRange = "30d" | "3m" | "6m" | "year";

interface ReportFilters {
  timeRange: TimeRange;
  domain: ReportDomain;
  department: string;
  projectType: string;
  implementation: string;
  stage: string;
  risk: string;
  projectOwner: string;
  productOwner: string;
  supplierManager: string;
}

interface MetricView {
  label: string;
  value: string;
  delta: string;
  tone: Tone;
}

interface DetailRow {
  name: string;
  dimension: string;
  metric: string;
  status: string;
  note: string;
  projectId?: string;
}

const allOption = "全部";
const timeRanges: { value: TimeRange; label: string }[] = [
  { value: "30d", label: "近30天" },
  { value: "3m", label: "近3月" },
  { value: "6m", label: "近6月" },
  { value: "year", label: "本年" }
];

const domainLabels: Record<ReportDomain, string> = {
  overview: "全局总览",
  project: "项目绩效",
  product: "产品绩效",
  engineering: "开发交付",
  operations: "需求方验收",
  supplier: "供应商绩效",
  budget: "资源预算"
};

const internalDeveloperNames = new Set(resourcePeople.map((person) => person.name));

export function Reports({
  activeRole,
  activeUser,
  demands,
  tasks,
  flows,
  onOpenProjectDetail
}: {
  activeRole: RoleId;
  activeUser: RoleOption;
  demands: Demand[];
  tasks: Task[];
  flows: DemandProjectFlow[];
  onOpenProjectDetail: (id: string) => void;
}) {
  const allowedDomains = useMemo(() => getAllowedDomains(activeRole), [activeRole]);
  const defaultDomain = allowedDomains[0];
  const canSwitchDomain = ["admin", "executive"].includes(activeRole);
  const canFilterDepartment = canSwitchDomain || Boolean(activeUser.isDepartmentOwner);
  const canFilterProjectOwner = canSwitchDomain || activeRole === "pm";
  const canFilterProductOwner = canSwitchDomain || activeRole === "businessOwner";
  const canFilterSupplierManager = canSwitchDomain || activeRole === "pm";
  const [filters, setFilters] = useState<ReportFilters>({
    timeRange: "6m",
    domain: defaultDomain,
    department: allOption,
    projectType: allOption,
    implementation: allOption,
    stage: allOption,
    risk: allOption,
    projectOwner: allOption,
    productOwner: allOption,
    supplierManager: allOption
  });

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      domain: allowedDomains.includes(current.domain) ? current.domain : defaultDomain,
      department: canFilterDepartment ? current.department : allOption,
      projectOwner: canFilterProjectOwner ? current.projectOwner : allOption,
      productOwner: canFilterProductOwner ? current.productOwner : allOption,
      supplierManager: canFilterSupplierManager ? current.supplierManager : allOption
    }));
  }, [allowedDomains, canFilterDepartment, canFilterProductOwner, canFilterProjectOwner, canFilterSupplierManager, defaultDomain]);

  const effectiveDomain = allowedDomains.includes(filters.domain) ? filters.domain : defaultDomain;
  const demandById = useMemo(() => new Map(demands.map((demand) => [demand.id, demand])), [demands]);
  const scopedProjects = useMemo(() => scopeProjects(activeRole, activeUser, demands), [activeRole, activeUser, demands]);
  const scopedDemands = useMemo(() => scopeDemands(activeRole, activeUser, demands, scopedProjects), [activeRole, activeUser, demands, scopedProjects]);
  const scopedTasks = useMemo(() => scopeTasks(activeRole, tasks, scopedProjects), [activeRole, scopedProjects, tasks]);
  const scopedSuppliers = useMemo(() => supplierBudgets.filter((item) => scopedProjects.some((project) => project.name === item.project)), [scopedProjects]);
  const filteredProjects = useMemo(
    () =>
      scopedProjects.filter((project) =>
        matchesProjectFilters(project, filters, demandById)
      ),
    [demandById, filters, scopedProjects]
  );
  const filteredProjectNames = useMemo(() => new Set(filteredProjects.map((project) => project.name)), [filteredProjects]);
  const filteredDemands = useMemo(
    () =>
      scopedDemands.filter((demand) => {
        const linkedProject = projects.find((project) => project.demandId === demand.id);
        return (
          matchesSelect(demand.team, filters.department) &&
          matchesSelect(demand.implementation, filters.implementation) &&
          matchesPerson(demand.handler, filters.productOwner) &&
          (!linkedProject || filteredProjectNames.has(linkedProject.name))
        );
      }),
    [filteredProjectNames, filters.department, filters.implementation, filters.productOwner, scopedDemands]
  );
  const filteredTasks = useMemo(
    () =>
      scopedTasks.filter((task) => {
        const relatedProject = projects.find((project) => project.name === task.project);
        return (
          filteredProjectNames.has(task.project) &&
          matchesSelect(task.owner, filters.department === "IT部" ? task.owner : allOption) &&
          matchesSelect(relatedProject?.stage ?? allOption, filters.stage)
        );
      }),
    [filteredProjectNames, filters.department, filters.stage, scopedTasks]
  );
  const filteredSuppliers = useMemo(
    () =>
      scopedSuppliers.filter((item) => {
        const project = projects.find((entry) => entry.name === item.project);
        return (
          filteredProjectNames.has(item.project) &&
          matchesSelect(item.manager, filters.supplierManager) &&
          matchesSelect(item.riskStatus, filters.risk) &&
          (!project || matchesSelect(project.implementation, filters.implementation))
        );
      }),
    [filteredProjectNames, filters.implementation, filters.risk, filters.supplierManager, scopedSuppliers]
  );
  const filteredInvestments = useMemo(
    () => projectInvestmentBreakdowns.filter((item) => filteredProjectNames.has(item.project)),
    [filteredProjectNames]
  );
  const visibleFlows = useMemo(() => flows.filter((flow) => filteredProjectNames.has(projectNameForFlow(flow.projectId))), [filteredProjectNames, flows]);
  const productOwnerOptions = useMemo(() => unique(scopedDemands.map((demand) => demand.handler)), [scopedDemands]);
  const metrics = buildMetrics(effectiveDomain, filteredProjects, filteredDemands, filteredTasks, filteredSuppliers, filteredInvestments);
  const detailRows = buildDetailRows(activeRole, effectiveDomain, filteredProjects, filteredDemands, filteredTasks, filteredSuppliers, filteredInvestments, visibleFlows);
  const insights = buildInsights(activeRole, effectiveDomain, filteredProjects, filteredDemands, filteredTasks, filteredSuppliers, filteredInvestments);
  const resultCount = countDomainObjects(effectiveDomain, filteredProjects, filteredDemands, filteredTasks, filteredSuppliers);
  const activeFilterCount = countActiveFilters(filters, {
    timeRange: "6m",
    domain: defaultDomain,
    department: allOption,
    projectType: allOption,
    implementation: allOption,
    stage: allOption,
    risk: allOption,
    projectOwner: allOption,
    productOwner: allOption,
    supplierManager: allOption
  });

  function resetFilters() {
    setFilters({
      timeRange: "6m",
      domain: defaultDomain,
      department: allOption,
      projectType: allOption,
      implementation: allOption,
      stage: allOption,
      risk: allOption,
      projectOwner: allOption,
      productOwner: allOption,
      supplierManager: allOption
    });
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>绩效与报表</h1>
        </div>
        <StatusTag tone="blue">{domainLabels[effectiveDomain]}</StatusTag>
      </div>

      <div className="panel report-filter-shell">
        <FilterPanel eyebrow="FILTERS" title="报表筛选" summary={`当前 ${resultCount} 条对象 · ${timeRanges.find((item) => item.value === filters.timeRange)?.label}`} activeCount={activeFilterCount}>
          <div className="filter-bar">
            <select value={filters.timeRange} onChange={(event) => setFilters((current) => ({ ...current, timeRange: event.target.value as TimeRange }))}>
              {timeRanges.map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}
            </select>
            {canSwitchDomain ? (
              <select value={effectiveDomain} onChange={(event) => setFilters((current) => ({ ...current, domain: event.target.value as ReportDomain }))}>
                {allowedDomains.map((domain) => <option key={domain} value={domain}>{domainLabels[domain]}</option>)}
              </select>
            ) : (
              <span className="filter-chip">{domainLabels[effectiveDomain]}</span>
            )}
            {canFilterDepartment ? (
              <select value={filters.department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}>
                <option value={allOption}>全部部门</option>
                {["IT部", "IT部", "业务部门", "外部供应商"].map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            ) : (
              <span className="filter-chip">{activeUser.department} · 本人范围</span>
            )}
            <select value={filters.projectType} onChange={(event) => setFilters((current) => ({ ...current, projectType: event.target.value }))}>
              <option value={allOption}>全部项目类型</option>
              {unique(scopedProjects.map((project) => project.projectType)).map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <select value={filters.implementation} onChange={(event) => setFilters((current) => ({ ...current, implementation: event.target.value }))}>
              <option value={allOption}>全部实现方式</option>
              {unique(scopedProjects.map((project) => project.implementation)).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={filters.stage} onChange={(event) => setFilters((current) => ({ ...current, stage: event.target.value }))}>
              <option value={allOption}>全部阶段</option>
              {unique(scopedProjects.map((project) => project.stage)).map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </select>
            <select value={filters.risk} onChange={(event) => setFilters((current) => ({ ...current, risk: event.target.value }))}>
              <option value={allOption}>全部风险</option>
              {unique(scopedProjects.map((project) => project.risk)).map((risk) => <option key={risk} value={risk}>{risk}</option>)}
            </select>
            {canFilterProjectOwner ? (
              <select value={filters.projectOwner} onChange={(event) => setFilters((current) => ({ ...current, projectOwner: event.target.value }))}>
                <option value={allOption}>全部项目经理</option>
                {unique(scopedProjects.map((project) => project.owner)).map((owner) => <option key={owner} value={owner}>{owner}</option>)}
              </select>
            ) : null}
            {canFilterProductOwner ? (
              <select value={filters.productOwner} onChange={(event) => setFilters((current) => ({ ...current, productOwner: event.target.value }))}>
                <option value={allOption}>全部产品负责人</option>
                {productOwnerOptions.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
              </select>
            ) : null}
            {canFilterSupplierManager ? (
              <select value={filters.supplierManager} onChange={(event) => setFilters((current) => ({ ...current, supplierManager: event.target.value }))}>
                <option value={allOption}>全部供应商负责人</option>
                {unique(scopedSuppliers.map((item) => item.manager)).map((manager) => <option key={manager} value={manager}>{manager}</option>)}
              </select>
            ) : null}
            <button className="btn secondary" onClick={resetFilters}>清空筛选</button>
          </div>
        </FilterPanel>
      </div>

      <div className="grid-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} delta={metric.delta} tone={metric.tone} />
        ))}
      </div>

      <ReportDomainPanels
        activeRole={activeRole}
        domain={effectiveDomain}
        projects={filteredProjects}
        demands={filteredDemands}
        tasks={filteredTasks}
        suppliers={filteredSuppliers}
        investments={filteredInvestments}
        onOpenProjectDetail={onOpenProjectDetail}
      />

      <div className="grid-2">
        <div className="panel">
          <SectionHeader eyebrow="DETAIL" title="绩效明细" />
          <table className="data-table">
            <thead><tr><th>{effectiveDomain === "overview" || effectiveDomain === "project" ? "项目" : "对象"}</th><th>维度</th><th>核心指标</th><th>状态</th><th>说明</th></tr></thead>
            <tbody>
              {detailRows.map((row) => (
                <tr
                  className={row.projectId ? "clickable" : ""}
                  key={`${row.name}${row.dimension}`}
                  onClick={() => {
                    if (row.projectId) onOpenProjectDetail(row.projectId);
                  }}
                >
                  <td><strong>{row.name}</strong></td>
                  <td>{row.dimension}</td>
                  <td>{row.metric}</td>
                  <td><StatusTag tone={toneForStatus(row.status)}>{row.status}</StatusTag></td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <SectionHeader eyebrow="INSIGHTS" title="管理洞察" />
          <div className="insight-list">
            {insights.map((item) => (
              <article className="insight-card" key={item.title}>
                <StatusTag tone={item.tone}>{item.type}</StatusTag>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReportDomainPanels({
  activeRole,
  domain,
  projects: visibleProjects,
  demands,
  tasks,
  suppliers,
  investments,
  onOpenProjectDetail
}: {
  activeRole: RoleId;
  domain: ReportDomain;
  projects: Project[];
  demands: Demand[];
  tasks: Task[];
  suppliers: typeof supplierBudgets;
  investments: typeof projectInvestmentBreakdowns;
  onOpenProjectDetail: (id: string) => void;
}) {
  const taskProjects = projects.filter((project) => tasks.some((task) => task.project === project.name));
  const visibleProjectSet = taskProjects.length > 0 ? taskProjects : projects;
  const stageData = chartDataOrEmpty(countBy(projects, (project) => project.stage), "暂无项目");
  const riskData = chartDataOrEmpty(countBy(projects, (project) => project.risk), "暂无风险");
  const taskStatus = chartDataOrEmpty(statusDistribution(tasks), "暂无任务");
  const acceptanceData = acceptanceScoreData(demands);

  if (activeRole === "pm") {
    return (
      <div className="report-board">
        <div className="panel report-panel-wide"><SectionHeader eyebrow="FLOW" title="负责项目阶段推进" /><FlowStackChart data={stageData} /></div>
        <div className="panel"><SectionHeader eyebrow="BUDGET" title="进度 / 预算燃尽" /><BudgetBurnChart projects={projects} onOpenProjectDetail={onOpenProjectDetail} /></div>
        <div className="panel"><SectionHeader eyebrow="RISK" title="项目风险矩阵" /><RiskMatrix projects={projects} /></div>
        <div className="panel"><SectionHeader eyebrow="SUPPLIER" title="供应商交付评分卡" /><SupplierScorecards suppliers={suppliers} /></div>
        <div className="panel report-panel-wide"><SectionHeader eyebrow="CONTROL" title="任务工时偏差分析" /><CycleTimeChart tasks={tasks} /></div>
      </div>
    );
  }

  if (domain === "engineering") {
    return (
      <div className="report-board">
        <div className="panel report-panel-wide"><SectionHeader eyebrow="CFD" title="任务流动与积压" /><FlowStackChart data={taskStatus} /></div>
        <div className="panel"><SectionHeader eyebrow="CONTROL" title="任务工时偏差分析" /><CycleTimeChart tasks={tasks} /></div>
        <div className="panel"><SectionHeader eyebrow="WORKLOAD" title="开发负载热力图" /><WorkloadHeatmap people={resourcePeople} projects={visibleProjectSet} /></div>
        <div className="panel"><SectionHeader eyebrow="EFFORT" title="实际 / 预估偏差" /><EffortCompare tasks={tasks} /></div>
      </div>
    );
  }

  if (domain === "product") {
    return (
      <div className="report-board">
        <div className="panel report-panel-wide"><SectionHeader eyebrow="VALUE" title="需求价值与转项目漏斗" /><DemandValueFunnel demands={demands} projects={projects} /></div>
        <div className="panel"><SectionHeader eyebrow="PRIORITY" title="优先级分布" /><DistributionDonut data={countBy(demands, (demand) => demand.priority)} /></div>
        <div className="panel"><SectionHeader eyebrow="RESOURCE" title="资源申请节点" /><FlowStackChart data={resourceRequestStatus(demands)} compact /></div>
        <div className="panel"><SectionHeader eyebrow="TREND" title="需求处理趋势" /><TrendAreaChart data={demandTrend(demands)} suffix="个" /></div>
      </div>
    );
  }

  if (domain === "operations") {
    return (
      <div className="report-board">
        <div className="panel report-panel-wide"><SectionHeader eyebrow="ACCEPTANCE" title="需求方验收评分分布" /><ScoreDistribution data={acceptanceData} /></div>
        <div className="panel"><SectionHeader eyebrow="PRIORITY" title="业务需求优先级" /><DistributionDonut data={countBy(demands, (demand) => demand.priority)} /></div>
        <div className="panel"><SectionHeader eyebrow="INVESTMENT" title="业务投入热度" /><InvestmentHeatmap investments={investments} /></div>
        <div className="panel"><SectionHeader eyebrow="REQUESTER" title="提出人结构" /><RankedList data={countBy(demands, (demand) => demand.requester)} suffix="个" /></div>
      </div>
    );
  }

  if (domain === "supplier") {
    return (
      <div className="report-board">
        <div className="panel report-panel-wide"><SectionHeader eyebrow="SUPPLIER" title="供应商交付评分卡" /><SupplierScorecards suppliers={suppliers} /></div>
        <div className="panel"><SectionHeader eyebrow="RISK" title="供应商风险分布" /><DistributionDonut data={countBy(suppliers, (item) => item.riskStatus)} /></div>
        <div className="panel"><SectionHeader eyebrow="CONTRACT" title="合同使用率" /><ContractUsage suppliers={suppliers} /></div>
        <div className="panel"><SectionHeader eyebrow="PAYMENT" title="付款与交付状态" /><SupplierStatusList suppliers={suppliers} /></div>
      </div>
    );
  }

  if (domain === "budget") {
    return (
      <div className="report-board">
        <div className="panel report-panel-wide"><SectionHeader eyebrow="BUDGET" title="预算燃尽与进度偏差" /><BudgetBurnChart projects={projects} onOpenProjectDetail={onOpenProjectDetail} /></div>
        <div className="panel"><SectionHeader eyebrow="MIX" title="内外部投入结构" /><InvestmentMix investments={investments} /></div>
        <div className="panel"><SectionHeader eyebrow="INTERNAL" title="内部人天热力" /><InvestmentHeatmap investments={investments} /></div>
        <div className="panel"><SectionHeader eyebrow="SUPPLIER" title="外部合同使用率" /><ContractUsage suppliers={suppliers} /></div>
      </div>
    );
  }

  return (
    <div className="report-board">
      <div className="panel report-panel-wide"><SectionHeader eyebrow="PORTFOLIO" title="项目组合健康度" /><PortfolioHealth projects={projects} /></div>
      <div className="panel"><SectionHeader eyebrow="FLOW" title="阶段流量" /><FlowStackChart data={stageData} compact /></div>
      <div className="panel"><SectionHeader eyebrow="RISK" title="风险矩阵" /><RiskMatrix projects={projects} /></div>
      <div className="panel"><SectionHeader eyebrow="BUDGET" title="预算燃尽" /><BudgetBurnChart projects={projects} onOpenProjectDetail={onOpenProjectDetail} /></div>
      <div className="panel report-panel-wide"><SectionHeader eyebrow="ACCEPTANCE" title="验收与价值趋势" /><AcceptanceValueChart demands={demands} /></div>
    </div>
  );
}

function PortfolioHealth({ projects: visibleProjects }: { projects: Project[] }) {
  const totalBudget = visibleProjects.reduce((sum, project) => sum + project.budget, 0);
  const usedBudget = visibleProjects.reduce((sum, project) => sum + project.usedBudget, 0);
  const completed = visibleProjects.filter((project) => project.stage === "项目结束").length;
  const avgProgress = Math.round(average(visibleProjects.map(projectDeliveryProgress)));
  const avgAi = Math.round(average(visibleProjects.map((project) => project.aiScore.total)));

  return (
    <div className="portfolio-health">
      <div className="portfolio-score">
        <span>组合健康</span>
        <strong>{Math.round((avgProgress + avgAi + percent(completed, visibleProjects.length)) / 3)}</strong>
        <small>进度、AI 立项质量、上线率综合</small>
      </div>
      <div className="portfolio-health-grid">
        <div><span>平均进度</span><strong>{avgProgress}%</strong><ProgressBar value={avgProgress} /></div>
        <div><span>AI 立项均分</span><strong>{avgAi}</strong><ProgressBar value={avgAi} /></div>
        <div><span>上线/归档</span><strong>{completed}/{visibleProjects.length}</strong><ProgressBar value={percent(completed, visibleProjects.length)} /></div>
        <div><span>预算使用率</span><strong>{percent(usedBudget, totalBudget)}%</strong><ProgressBar value={percent(usedBudget, totalBudget)} /></div>
      </div>
    </div>
  );
}

function FlowStackChart({ data, compact = false }: { data: { label: string; value: number }[]; compact?: boolean }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const normalized = chartDataOrEmpty(data, "暂无数据");
  return (
    <div className={compact ? "flow-stack compact" : "flow-stack"}>
      <div className="flow-stack-track">
        {normalized.map((item, index) => (
          <span
            key={item.label}
            className={`flow-segment segment-${index % 7}`}
            style={{ width: `${total ? Math.max(5, (item.value / total) * 100) : 100}%` }}
            title={`${item.label}：${item.value}`}
          />
        ))}
      </div>
      <div className="flow-stack-legend">
        {normalized.map((item, index) => (
          <div key={item.label}>
            <i className={`segment-${index % 7}`} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function AcceptanceValueChart({ demands }: { demands: Demand[] }) {
  const rows = acceptanceValueRows(demands);
  if (rows.length === 0) {
    return (
      <div className="acceptance-value-chart empty-state">
        <strong>暂无可统计数据</strong>
        <span>当前筛选范围内没有目标日期或验收评分。</span>
      </div>
    );
  }
  return (
    <div className="acceptance-value-chart">
      <div className="acceptance-value-head">
        <span>月份</span>
        <span>需求价值均分</span>
        <span>验收均分</span>
        <span>验收量</span>
      </div>
      {rows.map((row) => (
        <div className="acceptance-value-row" key={row.key}>
          <div className="acceptance-month">
            <strong>{row.label}</strong>
            <span>{row.targetCount} 个目标到期</span>
          </div>
          <div className="acceptance-bar-cell">
            <div className="acceptance-bar-meta">
              <span>价值</span>
              <strong>{row.valueAverage ? `${row.valueAverage}分` : "无目标需求"}</strong>
            </div>
            <div className="acceptance-track value">
              <i style={{ width: `${row.valueAverage}%` }} />
            </div>
          </div>
          <div className="acceptance-bar-cell">
            <div className="acceptance-bar-meta">
              <span>验收</span>
              <strong>{row.acceptanceAverage ? `${row.acceptanceAverage}/5` : "未验收"}</strong>
            </div>
            <div className="acceptance-track score">
              <i style={{ width: `${row.acceptanceAverage ? (row.acceptanceAverage / 5) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="acceptance-count">
            <strong>{row.acceptanceCount}</strong>
            <span>{row.acceptanceNames.length ? row.acceptanceNames.join("、") : "本月无评分"}</span>
          </div>
        </div>
      ))}
      <div className="acceptance-value-note">
        <span>价值均分来自需求评审评分，按目标日期月份聚合。</span>
        <span>验收均分来自需求方验收评分，按验收日期月份聚合。</span>
      </div>
    </div>
  );
}

function TrendAreaChart({ data, suffix = "" }: { data: { label: string; value: number }[]; suffix?: string }) {
  const safeData = chartDataOrEmpty(data, "暂无数据");
  const max = Math.max(...safeData.map((item) => item.value), 1);
  const width = 360;
  const height = 150;
  const points = safeData.map((item, index) => {
    const x = safeData.length === 1 ? width / 2 : 18 + (index * (width - 36)) / (safeData.length - 1);
    const y = height - 22 - (item.value / max) * 104;
    return { ...item, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${points[0].x},${height - 18} ${line} ${points[points.length - 1].x},${height - 18}`;

  return (
    <div className="trend-area">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="趋势图">
        <polygon points={area} />
        <polyline points={line} />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" />
            <text x={point.x} y={height - 4}>{point.label}</text>
          </g>
        ))}
      </svg>
      <div className="trend-area-values">
        {points.map((point) => <span key={point.label}>{point.value}{suffix}</span>)}
      </div>
    </div>
  );
}

function RiskMatrix({ projects: visibleProjects }: { projects: Project[] }) {
  const stages = ["项目准备", "项目启动", "项目进行", "项目完成", "项目结束"];
  const risks = ["高", "中", "低"];
  return (
    <div className="risk-matrix">
      <div className="risk-matrix-head" />
      {stages.map((stage) => <div className="risk-matrix-head" key={stage}>{stage}</div>)}
      {risks.map((risk) => (
        <Fragment key={risk}>
          <div className="risk-matrix-axis" key={`${risk}-axis`}>{risk}风险</div>
          {stages.map((stage) => {
            const count = visibleProjects.filter((project) => project.risk === risk && project.stage === stage).length;
            return <div className={`risk-cell risk-${riskWeight(risk)}`} key={`${risk}-${stage}`}><strong>{count}</strong></div>;
          })}
        </Fragment>
      ))}
    </div>
  );
}

function BudgetBurnChart({ projects: visibleProjects, onOpenProjectDetail }: { projects: Project[]; onOpenProjectDetail: (id: string) => void }) {
  const safeRows = visibleProjects.length
    ? visibleProjects.map((project) => ({
        id: project.id,
        name: shortLabel(project.name),
        progress: projectDeliveryProgress(project),
        usage: percent(project.usedBudget, project.budget),
        risk: project.risk
      }))
    : [{ id: "", name: "暂无项目", progress: 0, usage: 0, risk: "低" }];
  return (
    <div className="budget-burn">
      {safeRows.slice(0, 6).map((row) => (
        <button className={row.id ? "budget-row clickable-card" : "budget-row"} key={row.name} onClick={() => row.id && onOpenProjectDetail(row.id)} type="button">
          <div className="budget-row-head">
            <strong>{row.name}</strong>
            <StatusTag tone={toneForStatus(row.risk)}>{row.risk}</StatusTag>
          </div>
          <div className="dual-progress">
            <span className="progress-label">进度</span>
            <ProgressBar value={row.progress} />
            <b>{row.progress}%</b>
          </div>
          <div className="dual-progress budget">
            <span className="progress-label">预算</span>
            <ProgressBar value={row.usage} />
            <b>{row.usage}%</b>
          </div>
        </button>
      ))}
    </div>
  );
}

function CycleTimeChart({ tasks: visibleTasks }: { tasks: Task[] }) {
  const safeTasks = (visibleTasks.length ? visibleTasks : [{ id: "empty", title: "暂无任务", actual: 0, estimate: 1, status: "待开始", owner: "-", project: "-", role: "-" } as Task])
    .map((task) => {
      const ratio = task.actual / Math.max(task.estimate, 1);
      return {
        ...task,
        ratio,
        overrun: Math.max(0, task.actual - task.estimate)
      };
    })
    .sort((a, b) => (b.ratio === a.ratio ? b.overrun - a.overrun : b.ratio - a.ratio))
    .slice(0, 10);
  const maxRatio = Math.max(...safeTasks.map((task) => task.ratio), 1.6);
  const baselineTop = 18 + (1 - Math.min(1, 1 / maxRatio)) * 62;
  return (
    <div className="cycle-analysis">
      <div className="cycle-summary">
        <span>纵轴：实际 / 预估工时</span>
        <span>横轴：按偏差从高到低排列</span>
        <span><i /> 1.0x 为预估基准线</span>
      </div>
      <div className="cycle-chart" style={{ "--baseline": `${baselineTop}%` } as CSSProperties}>
        <div className="cycle-y-axis">
          <span>{maxRatio.toFixed(1)}x</span>
          <span>1.0x</span>
          <span>0x</span>
        </div>
        <div className="cycle-baseline"><b>1.0x 基准</b></div>
        {safeTasks.map((task, index) => {
          const x = safeTasks.length === 1 ? 50 : 9 + (index * 82) / Math.max(safeTasks.length - 1, 1);
          const y = 82 - Math.min(64, (task.ratio / maxRatio) * 64);
          const varianceTone = task.status === "暂停" || task.ratio >= 1.35 ? "red" : task.ratio > 1.05 ? "orange" : task.ratio >= 0.8 ? "blue" : "green";
        return (
          <button
            className={`cycle-dot variance-${varianceTone}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            key={task.id}
            title={`${task.title}：实际 ${task.actual}h / 预估 ${task.estimate}h · ${task.status}`}
          >
            <strong>{task.ratio.toFixed(1)}x</strong>
            <span>{shortLabel(task.title)}</span>
          </button>
        );
      })}
      </div>
      <div className="cycle-task-list">
        {safeTasks.slice(0, 5).map((task) => (
          <div key={`${task.id}-row`}>
            <strong>{shortLabel(task.title)}</strong>
            <span>{task.owner} · {task.actual}/{task.estimate}h</span>
            <StatusTag tone={task.ratio > 1.05 ? "orange" : toneForStatus(task.status)}>
              {task.overrun > 0 ? `超 ${task.overrun}h` : "未超"}
            </StatusTag>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkloadHeatmap({ people, projects: visibleProjects }: { people: typeof resourcePeople; projects: Project[] }) {
  const projectNames = visibleProjects.slice(0, 5).map((project) => project.name);
  return (
    <div className="workload-heatmap">
      <div className="heatmap-grid" style={{ gridTemplateColumns: `96px repeat(${Math.max(projectNames.length, 1)}, minmax(52px, 1fr))` }}>
        <span />
        {(projectNames.length ? projectNames : ["暂无项目"]).map((name) => <strong key={name}>{shortLabel(name)}</strong>)}
        {people.map((person) => (
          <Fragment key={person.name}>
            <b key={`${person.name}-name`}>{person.name}</b>
            {(projectNames.length ? projectNames : ["暂无项目"]).map((projectName) => {
              const hours = person.allocations.filter((item) => item.project === projectName).reduce((sum, item) => sum + item.hours, 0);
              const level = hours >= 18 ? 3 : hours >= 10 ? 2 : hours > 0 ? 1 : 0;
              return <i className={`heat-level-${level}`} key={`${person.name}-${projectName}`} title={`${person.name} · ${shortLabel(projectName)} · ${hours}h`}>{hours || "-"}</i>;
            })}
          </Fragment>
        ))}
      </div>
      <small>颜色越深代表该成员在项目上的周投入越高。</small>
    </div>
  );
}

function DemandValueFunnel({ demands, projects: visibleProjects }: { demands: Demand[]; projects: Project[] }) {
  const evaluated = demands.filter((demand) => demand.analysis.valueScore >= 80).length;
  const projectDemandIds = new Set(visibleProjects.map((project) => project.demandId));
  const converted = demands.filter((demand) => projectDemandIds.has(demand.id)).length;
  const accepted = demands.filter((demand) => demand.score || demand.acceptanceReview?.score).length;
  const steps = [
    { label: "需求池", value: demands.length },
    { label: "高价值", value: evaluated },
    { label: "已关联项目", value: converted },
    { label: "已验收评分", value: accepted }
  ];
  const max = Math.max(...steps.map((step) => step.value), 1);
  return (
    <div className="value-funnel">
      {steps.map((step, index) => (
        <div className={`funnel-step step-${index}`} style={{ width: `${Math.max(28, (step.value / max) * 100)}%` }} key={step.label}>
          <span>{step.label}</span>
          <strong>{step.value}</strong>
        </div>
      ))}
    </div>
  );
}

function DistributionDonut({ data }: { data: { label: string; value: number }[] }) {
  const safeData = chartDataOrEmpty(data, "暂无数据");
  const total = safeData.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const colors = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b"];
  const gradient = safeData.map((item, index) => {
    const start = cursor;
    const end = cursor + (total ? (item.value / total) * 100 : 100);
    cursor = end;
    return `${colors[index % colors.length]} ${start}% ${end}%`;
  }).join(", ");
  return (
    <div className="donut-report">
      <div className="donut-ring" style={{ background: `conic-gradient(${gradient})` }}><strong>{total}</strong><span>总数</span></div>
      <div className="donut-legend">
        {safeData.map((item, index) => (
          <div key={item.label}><i style={{ background: colors[index % colors.length] }} /><span>{item.label}</span><strong>{item.value}</strong></div>
        ))}
      </div>
    </div>
  );
}

function ScoreDistribution({ data }: { data: { label: string; value: number }[] }) {
  const safeData = chartDataOrEmpty(data, "暂无评分");
  return (
    <div className="score-distribution">
      {safeData.map((item) => (
        <div className="score-row" key={item.label}>
          <span>{item.label}</span>
          <div className="score-track"><i style={{ width: `${Math.min(100, (item.value / 5) * 100)}%` }} /></div>
          <strong>{item.value}/5</strong>
        </div>
      ))}
    </div>
  );
}

function InvestmentHeatmap({ investments }: { investments: typeof projectInvestmentBreakdowns }) {
  const max = Math.max(...investments.map((item) => item.internalDays), 1);
  return (
    <div className="investment-heat">
      {(investments.length ? investments : [{ project: "暂无投入", internalDays: 0, supplierCost: 0, supplierRole: "", businessRole: "", status: "" }]).map((item) => (
        <div className="investment-tile" style={{ "--heat": `${Math.max(10, (item.internalDays / max) * 100)}%` } as CSSProperties} key={item.project}>
          <span>{shortLabel(item.project)}</span>
          <strong>{item.internalDays} 天</strong>
          <small>{item.supplierCost > 0 ? formatMoney(item.supplierCost) : "内部实现"}</small>
        </div>
      ))}
    </div>
  );
}

function RankedList({ data, suffix = "" }: { data: { label: string; value: number }[]; suffix?: string }) {
  const safeData = chartDataOrEmpty(data, "暂无数据").sort((a, b) => b.value - a.value);
  const max = Math.max(...safeData.map((item) => item.value), 1);
  return (
    <div className="ranked-list">
      {safeData.slice(0, 6).map((item, index) => (
        <div key={item.label}>
          <b>{index + 1}</b>
          <span>{item.label}</span>
          <i style={{ width: `${(item.value / max) * 100}%` }} />
          <strong>{item.value}{suffix}</strong>
        </div>
      ))}
    </div>
  );
}

function SupplierScorecards({ suppliers }: { suppliers: typeof supplierBudgets }) {
  const items = suppliers.length ? suppliers : [{ supplier: "暂无供应商", project: "", manager: "", contract: 0, used: 0, payment: "无", deliveryStatus: "无交付", riskStatus: "低" }];
  return (
    <div className="supplier-scorecards">
      {items.slice(0, 5).map((item) => (
        <article key={`${item.supplier}-${item.project}`}>
          <div>
            <strong>{item.supplier}</strong>
            <StatusTag tone={toneForStatus(item.riskStatus)}>{item.riskStatus}</StatusTag>
          </div>
          <p>{item.deliveryStatus}</p>
          <ProgressBar value={percent(item.used, item.contract)} />
          <small>{item.payment} · 合同使用 {percent(item.used, item.contract)}%</small>
        </article>
      ))}
    </div>
  );
}

function ContractUsage({ suppliers }: { suppliers: typeof supplierBudgets }) {
  return <RankedList data={(suppliers.length ? suppliers : [{ supplier: "暂无供应商", contract: 0, used: 0 }]).map((item) => ({ label: shortLabel(item.supplier), value: percent(item.used, item.contract) }))} suffix="%" />;
}

function EffortCompare({ tasks }: { tasks: Task[] }) {
  const estimate = tasks.reduce((sum, task) => sum + task.estimate, 0);
  const actual = tasks.reduce((sum, task) => sum + task.actual, 0);
  const value = Math.round((actual / Math.max(estimate, 1)) * 100);
  return (
    <div className="report-progress-block">
      <div><span>预估工时</span><strong>{estimate}h</strong></div>
      <div><span>实际工时</span><strong>{actual}h</strong></div>
      <ProgressBar value={value} />
      <small>实际 / 预估：{value}%</small>
    </div>
  );
}

function SupplierStatusList({ suppliers }: { suppliers: typeof supplierBudgets }) {
  return (
    <div className="report-list">
      {suppliers.map((item) => (
        <div key={item.supplier}>
          <strong>{item.supplier}</strong>
          <span>{item.payment}</span>
          <StatusTag tone={toneForStatus(item.riskStatus)}>{item.riskStatus}</StatusTag>
        </div>
      ))}
    </div>
  );
}

function InvestmentMix({ investments }: { investments: typeof projectInvestmentBreakdowns }) {
  const internalDays = investments.reduce((sum, item) => sum + item.internalDays, 0);
  const supplierCost = investments.reduce((sum, item) => sum + item.supplierCost, 0);
  return (
    <div className="report-progress-block">
      <div><span>内部人天</span><strong>{internalDays} 天</strong></div>
      <div><span>外部合同</span><strong>{formatMoney(supplierCost)}</strong></div>
      <ProgressBar value={Math.min(100, Math.round(supplierCost / 50000))} />
      <small>内部人天与外部合同金额分开归集。</small>
    </div>
  );
}

function ProjectRiskList({ projects: visibleProjects }: { projects: Project[] }) {
  const items = [...visibleProjects].sort((a, b) => riskWeight(b.risk) - riskWeight(a.risk)).slice(0, 5);
  return (
    <div className="report-list">
      {items.map((project) => (
        <div key={project.id}>
          <strong>{shortLabel(project.name)}</strong>
          <span>{project.riskResponse}</span>
          <StatusTag tone={toneForStatus(project.risk)}>{project.risk}</StatusTag>
        </div>
      ))}
    </div>
  );
}

function getAllowedDomains(role: RoleId): ReportDomain[] {
  if (["admin", "executive"].includes(role)) return ["overview", "project", "product", "engineering", "operations", "supplier", "budget"];
  if (role === "pm") return ["overview", "project", "engineering", "supplier", "budget"];
  if (role === "product") return ["product"];
  if (role === "businessOwner") return ["operations"];
  if (role === "developer") return ["engineering"];
  return ["overview"];
}

function scopeProjects(role: RoleId, activeUser: RoleOption, liveDemands: Demand[]) {
  if (role === "pm") return projects.filter((project) => project.owner === activeUser.userName || project.supplierManager === activeUser.userName);
  if (role === "product") {
    const demandIds = new Set(liveDemands.filter((demand) => demand.handler.includes(activeUser.userName)).map((demand) => demand.id));
    return projects.filter((project) => demandIds.has(project.demandId));
  }
  if (role === "businessOwner") {
    const demandIds = new Set(liveDemands.filter((demand) => demand.team === activeUser.department).map((demand) => demand.id));
    return projects.filter((project) => demandIds.has(project.demandId));
  }
  return projects;
}

function scopeDemands(role: RoleId, activeUser: RoleOption, liveDemands: Demand[], visibleProjects: Project[]) {
  if (role === "product") return liveDemands.filter((demand) => demand.handler.includes(activeUser.userName));
  if (role === "businessOwner") return liveDemands.filter((demand) => demand.team === activeUser.department);
  const visibleDemandIds = new Set(visibleProjects.map((project) => project.demandId));
  return liveDemands.filter((demand) => visibleDemandIds.has(demand.id));
}

function scopeTasks(role: RoleId, liveTasks: Task[], visibleProjects: Project[]) {
  if (role === "developer") return liveTasks.filter((task) => internalDeveloperNames.has(task.owner));
  const visibleProjectNames = new Set(visibleProjects.map((project) => project.name));
  return liveTasks.filter((task) => visibleProjectNames.has(task.project));
}

function matchesProjectFilters(project: Project, filters: ReportFilters, demandById: Map<string, Demand>) {
  return (
    matchesDepartment(project, filters.department, demandById.get(project.demandId)) &&
    matchesSelect(project.projectType, filters.projectType) &&
    matchesSelect(project.implementation, filters.implementation) &&
    matchesSelect(project.stage, filters.stage) &&
    matchesSelect(project.risk, filters.risk) &&
    matchesSelect(project.owner, filters.projectOwner) &&
    matchesSelect(project.supplierManager, filters.supplierManager) &&
    matchesPerson(demandById.get(project.demandId)?.handler ?? "", filters.productOwner)
  );
}

function matchesDepartment(project: Project, department: string, demand?: Demand) {
  if (department === allOption) return true;
  if (department === "业务部门") return demand?.team === department || project.contributions.some((item) => item.party === department);
  if (department === "IT部") return project.contributions.some((item) => item.party === department || item.type === "内部IT");
  if (department === "IT部") return ["马骏", "李书航"].includes(project.owner) || ["马骏", "李书航"].includes(project.supplierManager);
  if (department === "外部供应商") return project.implementation !== "内部实现";
  return false;
}

function buildMetrics(
  domain: ReportDomain,
  visibleProjects: Project[],
  visibleDemands: Demand[],
  visibleTasks: Task[],
  visibleSuppliers: typeof supplierBudgets,
  visibleInvestments: typeof projectInvestmentBreakdowns
): MetricView[] {
  const completedProjects = visibleProjects.filter((project) => project.stage === "项目结束" || projectDeliveryProgress(project) >= 100).length;
  const highRiskProjects = visibleProjects.filter((project) => project.risk === "高").length;
  const budgetUsed = visibleProjects.reduce((sum, project) => sum + project.usedBudget, 0);
  const budgetTotal = visibleProjects.reduce((sum, project) => sum + project.budget, 0);
  const completedTasks = visibleTasks.filter((task) => task.status === "已完成").length;
  const taskEstimate = visibleTasks.reduce((sum, task) => sum + task.estimate, 0);
  const taskActual = visibleTasks.reduce((sum, task) => sum + task.actual, 0);
  const supplierContract = visibleSuppliers.reduce((sum, item) => sum + item.contract, 0);
  const supplierUsed = visibleSuppliers.reduce((sum, item) => sum + item.used, 0);
  const averageValue = average(visibleDemands.map((demand) => demand.analysis.valueScore));
  const averageReview = average(visibleDemands.map((demand) => demand.score ?? 0).filter(Boolean));
  const flowedDemandCount = visibleProjects.filter((project) => visibleDemands.some((demand) => demand.id === project.demandId)).length;

  if (domain === "project") {
    return [
      { label: "负责项目", value: String(visibleProjects.length), delta: `${highRiskProjects} 个高风险`, tone: highRiskProjects > 0 ? "red" : "blue" },
      { label: "平均进度", value: `${Math.round(average(visibleProjects.map(projectDeliveryProgress)))}%`, delta: "当前项目推进", tone: "green" },
      { label: "预算偏差均值", value: `${Math.round(average(visibleProjects.map(budgetDeviation)))}%`, delta: "使用率相对进度", tone: "orange" },
      { label: "供应商项目", value: String(visibleProjects.filter((project) => project.implementation !== "内部实现").length), delta: "需跟踪合同与交付", tone: "violet" }
    ];
  }
  if (domain === "product") {
    return [
      { label: "需求承接量", value: String(visibleDemands.length), delta: "当前范围", tone: "blue" },
      { label: "平均价值评分", value: String(Math.round(averageValue)), delta: "产品优先级输入", tone: "violet" },
      { label: "转项目率", value: `${percent(flowedDemandCount, visibleDemands.length)}%`, delta: `${flowedDemandCount} 个已关联项目`, tone: "green" },
      { label: "项目完成", value: String(visibleProjects.filter((project) => project.stage === "项目完成").length), delta: "需组织验收结论", tone: "orange" }
    ];
  }
  if (domain === "engineering") {
    return [
      { label: "任务完成率", value: `${percent(completedTasks, visibleTasks.length)}%`, delta: `${completedTasks}/${visibleTasks.length} 个任务`, tone: "green" },
      { label: "工时利用率", value: `${percent(taskActual, taskEstimate)}%`, delta: `${taskActual}/${taskEstimate}h`, tone: "cyan" },
      { label: "超载人员", value: String(resourcePeople.filter((person) => person.assigned > person.capacity).length), delta: "超过周容量", tone: "red" },
      { label: "暂停任务", value: String(visibleTasks.filter((task) => task.status === "暂停").length), delta: "需负责人介入", tone: "orange" }
    ];
  }
  if (domain === "operations") {
    const important = visibleDemands.filter((demand) => ["P0", "P1"].includes(demand.priority)).length;
    return [
      { label: "业务需求量", value: String(visibleDemands.length), delta: "本部门需求池", tone: "blue" },
      { label: "P0/P1 占比", value: `${percent(important, visibleDemands.length)}%`, delta: `${important} 个高优先级`, tone: "orange" },
      { label: "平均验收评分", value: averageReview ? averageReview.toFixed(1) : "暂无", delta: "来自需求方验收", tone: "violet" },
      { label: "项目完成", value: String(visibleProjects.filter((project) => project.stage === "项目完成").length), delta: "需产品经理确认", tone: "green" }
    ];
  }
  if (domain === "supplier") {
    return [
      { label: "合同总额", value: formatMoney(supplierContract), delta: `${visibleSuppliers.length} 家供应商`, tone: "blue" },
      { label: "已用金额", value: formatMoney(supplierUsed), delta: `使用率 ${percent(supplierUsed, supplierContract)}%`, tone: "cyan" },
      { label: "高风险供应商", value: String(visibleSuppliers.filter((item) => item.riskStatus === "高").length), delta: "需项目经理跟进", tone: "red" },
      { label: "付款待处理", value: String(visibleSuppliers.filter((item) => !item.payment.includes("完成")).length), delta: "含商务评审/待付款", tone: "orange" }
    ];
  }
  if (domain === "budget") {
    const internalDays = visibleInvestments.reduce((sum, item) => sum + item.internalDays, 0);
    return [
      { label: "内部投入", value: `${internalDays}天`, delta: "开发/IT 人天", tone: "cyan" },
      { label: "外部合同", value: formatMoney(supplierContract), delta: "供应商合同金额", tone: "violet" },
      { label: "预算使用率", value: `${percent(budgetUsed, budgetTotal)}%`, delta: `${formatMoney(budgetUsed)} / ${formatMoney(budgetTotal)}`, tone: "green" },
      { label: "预算偏差均值", value: `${Math.round(average(visibleProjects.map(budgetDeviation)))}%`, delta: "使用率相对进度", tone: "orange" }
    ];
  }
  return [
    { label: "项目总数", value: String(visibleProjects.length), delta: `${completedProjects} 个项目结束`, tone: "blue" },
    { label: "项目完成率", value: `${percent(completedProjects, visibleProjects.length)}%`, delta: "按项目结束/100%统计", tone: "green" },
    { label: "预算使用率", value: `${percent(budgetUsed, budgetTotal)}%`, delta: `${formatMoney(budgetUsed)} / ${formatMoney(budgetTotal)}`, tone: "orange" },
    { label: "高风险项目", value: String(highRiskProjects), delta: "需管理层关注", tone: "red" }
  ];
}

function buildDetailRows(
  role: RoleId,
  domain: ReportDomain,
  visibleProjects: Project[],
  visibleDemands: Demand[],
  visibleTasks: Task[],
  visibleSuppliers: typeof supplierBudgets,
  visibleInvestments: typeof projectInvestmentBreakdowns,
  visibleFlows: DemandProjectFlow[]
): DetailRow[] {
  if (domain === "project" || (role === "pm" && domain === "overview")) {
    return visibleProjects.slice(0, 8).map((project) => ({
      name: project.name,
      projectId: project.id,
      dimension: `产品经理：${productOwnerForProject(project)} · ${project.implementation}`,
      metric: `进度 ${projectDeliveryProgress(project)}% · 预算 ${percent(project.usedBudget, project.budget)}%`,
      status: project.risk,
      note: projectDeliveryNote(project)
    }));
  }
  if (domain === "engineering") {
    return visibleTasks.slice(0, 8).map((task) => ({
      name: task.title,
      dimension: task.owner,
      metric: `${task.actual}/${task.estimate}h`,
      status: task.status,
      note: `${task.project} · ${task.role}`
    }));
  }
  if (domain === "product") {
    return visibleDemands.slice(0, 8).map((demand) => ({
      name: demand.name,
      dimension: demand.handler,
      metric: `价值 ${demand.analysis.valueScore} · ${demand.implementation}`,
      status: demand.status,
      note: visibleFlows.some((flow) => flow.demandId === demand.id) ? "已有需求转项目流程" : "待建立转项目流程"
    }));
  }
  if (domain === "operations") {
    return visibleDemands.slice(0, 8).map((demand) => ({
      name: demand.name,
      dimension: demand.requester,
      metric: `${demand.priority} · ${demand.score ? `评分 ${demand.score}` : "未评分"}`,
      status: demand.status,
      note: demand.objective
    }));
  }
  if (domain === "supplier") {
    return visibleSuppliers.slice(0, 8).map((item) => ({
      name: item.supplier,
      dimension: item.manager,
      metric: `${formatMoney(item.used)} / ${formatMoney(item.contract)}`,
      status: item.riskStatus,
      note: `${item.project} · ${item.deliveryStatus}`
    }));
  }
  if (domain === "budget") {
    return visibleInvestments.slice(0, 8).map((item) => ({
      name: item.project,
      dimension: item.supplierCost > 0 ? "内外部协作" : "纯内部实现",
      metric: `${item.internalDays} 人天 · ${formatMoney(item.supplierCost)}`,
      status: item.status,
      note: item.supplierRole
    }));
  }
  return visibleProjects.slice(0, 8).map((project) => ({
    name: project.name,
    projectId: project.id,
    dimension: `${project.projectType} · ${project.implementation}`,
    metric: `进度 ${projectDeliveryProgress(project)}% · 偏差 ${budgetDeviation(project)}%`,
    status: project.risk,
    note: projectDeliveryNote(project)
  }));
}

function buildInsights(
  role: RoleId,
  domain: ReportDomain,
  visibleProjects: Project[],
  visibleDemands: Demand[],
  visibleTasks: Task[],
  visibleSuppliers: typeof supplierBudgets,
  visibleInvestments: typeof projectInvestmentBreakdowns
) {
  const highRiskProject = visibleProjects.find((project) => project.risk === "高");
  const overloaded = resourcePeople.find((person) => person.assigned > person.capacity);
  const pendingDemand = visibleDemands.find((demand) => demand.status === "方案确认" || demand.status === "需求评审");
  const riskySupplier = visibleSuppliers.find((item) => item.riskStatus === "高");
  const heavyInvestment = [...visibleInvestments].sort((a, b) => b.internalDays - a.internalDays)[0];

  if (role === "pm") {
    return [
      { type: "风险", tone: highRiskProject ? "red" as Tone : "green" as Tone, title: highRiskProject?.name ?? "负责项目无高风险", body: highRiskProject ? projectDeliveryNote(highRiskProject) : "当前负责项目没有高风险事项。" },
      { type: "预算", tone: "orange" as Tone, title: `平均预算偏差 ${Math.round(average(visibleProjects.map(budgetDeviation)))}%`, body: "项目经理重点看预算使用率是否明显快于项目进度。" },
      { type: "供应商", tone: "violet" as Tone, title: `${visibleSuppliers.length} 条供应商合同`, body: "供应商付款、交付状态和风险需要与里程碑一起看。" }
    ];
  }
  if (domain === "engineering") {
    return [
      { type: "负载", tone: "red" as Tone, title: overloaded ? `${overloaded.name} 已超载` : "开发负载正常", body: overloaded ? `${overloaded.role} 当前 ${overloaded.assigned}/${overloaded.capacity}h，需要项目经理协调排期。` : "当前开发资源未超过周容量。" },
      { type: "暂停", tone: "orange" as Tone, title: "暂停任务需复盘", body: `${visibleTasks.filter((task) => task.status === "暂停").length} 个任务处于暂停状态，建议在周会中确认阻塞原因。` },
      { type: "工时", tone: "cyan" as Tone, title: "关注预估偏差", body: "实际/预估工时可作为后续资源申请和迭代计划的校准依据。" }
    ];
  }
  if (domain === "product") {
    return [
      { type: "价值", tone: "violet" as Tone, title: `平均价值 ${Math.round(average(visibleDemands.map((demand) => demand.analysis.valueScore)))}`, body: "可结合实现方式和资源申请状态决定下一批迭代优先级。" },
      { type: "流程", tone: "blue" as Tone, title: `${visibleProjects.length} 个需求已关联项目`, body: "方案确认结束后由产品经理预创建项目，项目完成后由需求方评分。" },
      { type: "待办", tone: "orange" as Tone, title: pendingDemand?.name ?? "暂无关键待办", body: pendingDemand ? `${pendingDemand.status} · ${pendingDemand.objective}` : "暂无方案确认或需求评审需求。" }
    ];
  }
  if (domain === "operations") {
    return [
      { type: "验收", tone: "green" as Tone, title: `${visibleProjects.filter((project) => project.stage === "项目完成").length} 个项目完成`, body: "项目完成后等待需求方验收评分，评分后进入项目结束。" },
      { type: "优先级", tone: "orange" as Tone, title: `${visibleDemands.filter((demand) => ["P0", "P1"].includes(demand.priority)).length} 个高优先级需求`, body: "建议与产品经理确认资源窗口和上线期望。" },
      { type: "投入", tone: "cyan" as Tone, title: heavyInvestment?.project ?? "暂无投入项目", body: heavyInvestment ? `${heavyInvestment.internalDays} 人天 · ${heavyInvestment.businessRole}` : "暂无投入拆解。" }
    ];
  }
  if (domain === "supplier") {
    return [
      { type: "风险", tone: riskySupplier ? "red" as Tone : "green" as Tone, title: riskySupplier?.supplier ?? "供应商风险可控", body: riskySupplier ? `${riskySupplier.project} · ${riskySupplier.deliveryStatus}` : "无高风险供应商。" },
      { type: "付款", tone: "orange" as Tone, title: `${visibleSuppliers.length} 条供应商合同`, body: "付款状态应与交付里程碑、验收结论和合同预算联动查看。" },
      { type: "治理", tone: "blue" as Tone, title: "供应商绩效沉淀", body: "上线复盘后应沉淀供应商评分，作为后续选型参考。" }
    ];
  }
  return [
    { type: "风险", tone: highRiskProject ? "red" as Tone : "green" as Tone, title: highRiskProject?.name ?? "无高风险项目", body: highRiskProject ? projectDeliveryNote(highRiskProject) : "风险处于可控状态。" },
    { type: "预算", tone: "orange" as Tone, title: `预算使用率 ${percent(visibleProjects.reduce((sum, project) => sum + project.usedBudget, 0), visibleProjects.reduce((sum, project) => sum + project.budget, 0))}%`, body: "预算偏差需要结合项目进度、供应商付款和内部人天一起判断。" },
    { type: "交付", tone: "blue" as Tone, title: `${visibleProjects.filter((project) => project.stage === "项目结束").length} 个项目结束项目`, body: "可切换项目绩效或资源预算域查看下钻指标。" }
  ];
}

function productOwnerForProject(project: Project) {
  const demand = seedDemands.find((item) => item.id === project.demandId);
  return demand?.handler.replace(" / 产品", "") ?? "未分配";
}

function projectDeliveryNote(project: Project) {
  const productOwner = productOwnerForProject(project);
  if (project.id === "PRJ-126") {
    return `${productOwner}推动主数据冻结和接口联调计划；项目经理已完成接口开发与测试资源指派，开发按任务推进，若 6 月 3 日前未完成则拆分非关键接口二期上线。`;
  }
  if (project.id === "PRJ-124") {
    return `${productOwner}组织供应商评分并收敛合规方案；项目经理只在资源窗口合适后启动项目，开发与供应商按确认方案执行。`;
  }
  if (project.id === "PRJ-119") {
    return `${productOwner}已发起业务部门验收邀请；开发和供应商补齐验证包、上线检查表和归档材料。`;
  }
  if (project.id === "PRJ-116") {
    return `${productOwner}将口径冻结会提前到 5 月 31 日；开发按已指派任务完成权限模型和审计日志底座。`;
  }
  if (project.id === "PRJ-108") {
    return "进入运维观察期，LIMS 供应商保留 2 周问题响应窗口，需求方已完成验收评分。";
  }
  if (project.id === "PRJ-131") {
    return "先上线 12 卡试运行环境，完整集群等待第二批设备到货；管理层周会确认扩容预算。";
  }
  if (project.id === "PRJ-097") {
    return `${productOwner}确认外部供应商实施方案；项目经理启动后锁定供应商踏勘和施工窗口，避免影响季度合规培训。`;
  }
  return project.riskResponse;
}

function countDomainObjects(domain: ReportDomain, visibleProjects: Project[], visibleDemands: Demand[], visibleTasks: Task[], visibleSuppliers: typeof supplierBudgets) {
  if (domain === "product" || domain === "operations") return visibleDemands.length;
  if (domain === "engineering") return visibleTasks.length;
  if (domain === "supplier") return visibleSuppliers.length;
  return visibleProjects.length;
}

function statusDistribution(tasks: Task[]) {
  return countBy(tasks, (task) => task.status);
}

function modeDistribution(demands: Demand[]) {
  return countBy(demands, (demand) => demand.implementation);
}

function countBy<T>(items: T[], getLabel: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(getLabel(item), (counts.get(getLabel(item)) ?? 0) + 1));
  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
}

function resourceRequestStatus(demands: Demand[]) {
  const demandIds = new Set(demands.map((demand) => demand.id));
  return chartDataOrEmpty(
    countBy(projects.filter((project) => demandIds.has(project.demandId)), (project) => {
      if (projectDeliveryProgress(project) >= 90 || project.stage === "项目完成" || project.stage === "项目结束") return "已安排";
      if (project.stage === "项目进行") return "执行中";
      if (project.stage === "项目启动") return "评估中";
      return "待申请";
    }),
    "暂无资源申请"
  );
}

function demandTrend(demands: Demand[]) {
  const buckets = ["2月", "3月", "4月", "5月", "6月", "7月"];
  const base = Math.max(1, Math.ceil(demands.length / buckets.length));
  return buckets.map((label, index) => {
    const active = demands.filter((demand) => demand.progress >= index * 16).length;
    const highPriorityBoost = demands.filter((demand) => ["P0", "P1"].includes(demand.priority)).length;
    return { label, value: Math.max(0, Math.round(active * 0.7 + base * index + highPriorityBoost * 0.2)) };
  });
}

function acceptanceValueRows(demands: Demand[]) {
  const buckets = new Map<string, { target: Demand[]; accepted: Demand[] }>();
  const ensure = (key: string) => {
    if (!buckets.has(key)) buckets.set(key, { target: [], accepted: [] });
    return buckets.get(key)!;
  };

  demands.forEach((demand) => {
    const targetKey = monthKey(demand.targetDate);
    if (targetKey) ensure(targetKey).target.push(demand);
    const score = demand.acceptanceReview?.score ?? demand.score;
    const acceptanceKey = monthKey(demand.acceptanceReview?.date ?? (score ? demand.targetDate : ""));
    if (score && acceptanceKey) ensure(acceptanceKey).accepted.push(demand);
  });

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, bucket]) => {
      const valueAverage = Math.round(average(bucket.target.map((demand) => demand.analysis.valueScore)));
      const acceptanceScores = bucket.accepted.map((demand) => demand.acceptanceReview?.score ?? demand.score ?? 0);
      const acceptanceAverage = acceptanceScores.length ? Number(average(acceptanceScores).toFixed(1)) : 0;
      return {
        key,
        label: monthLabel(key),
        targetCount: bucket.target.length,
        valueAverage,
        acceptanceAverage,
        acceptanceCount: bucket.accepted.length,
        acceptanceNames: bucket.accepted.map((demand) => shortLabel(demand.name))
      };
    });
}

function budgetDeviation(project: Project) {
  return Math.round((project.usedBudget / Math.max(project.budget, 1)) * 100 - projectDeliveryProgress(project));
}

function riskWeight(risk: string) {
  if (risk === "高") return 3;
  if (risk === "中") return 2;
  return 1;
}

function acceptanceScoreData(demands: Demand[]) {
  return chartDataOrEmpty(
    demands
      .filter((demand) => demand.score || demand.acceptanceReview?.score)
      .map((demand) => ({ label: shortLabel(demand.name), value: demand.acceptanceReview?.score ?? demand.score ?? 0 })),
    "暂无验收评分"
  );
}

function chartDataOrEmpty(data: { label: string; value: number }[], emptyLabel: string) {
  return data.length > 0 ? data : [{ label: emptyLabel, value: 0 }];
}

function projectNameForFlow(projectId: string) {
  return projects.find((project) => project.id === projectId)?.name ?? "";
}

function matchesSelect(value: string, selected: string) {
  return selected === allOption || value === selected;
}

function countActiveFilters<T extends Record<string, string>>(filters: T, defaults: T) {
  return Object.keys(filters).filter((key) => filters[key].trim() !== defaults[key]).length;
}

function matchesPerson(value: string, selected: string) {
  return selected === allOption || value === selected || value.includes(selected) || selected.includes(value);
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function formatMoney(value: number) {
  return `${Math.round(value / 10000)}万`;
}

function monthKey(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-\d{2}$/);
  return match ? `${match[1]}-${match[2]}` : "";
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${year}年${Number(month)}月`;
}

function shortLabel(value: string) {
  return value.replace("SAP S/4HANA ", "SAP").replace("一期", "").slice(0, 10);
}
