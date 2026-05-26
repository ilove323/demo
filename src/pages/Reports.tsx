import { useEffect, useMemo, useState } from "react";
import { projectInvestmentBreakdowns, projects, resourcePeople, supplierBudgets } from "../data";
import { MetricCard, MiniBarChart, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";
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
  engineering: "研发交付",
  operations: "运营验收",
  supplier: "供应商绩效",
  budget: "资源预算"
};

const internalDeveloperNames = new Set(resourcePeople.map((person) => person.name));

export function Reports({
  activeRole,
  activeUser,
  demands,
  tasks,
  flows
}: {
  activeRole: RoleId;
  activeUser: RoleOption;
  demands: Demand[];
  tasks: Task[];
  flows: DemandProjectFlow[];
}) {
  const allowedDomains = useMemo(() => getAllowedDomains(activeRole), [activeRole]);
  const defaultDomain = allowedDomains[0];
  const canSwitchDomain = ["admin", "executive"].includes(activeRole);
  const canFilterDepartment = canSwitchDomain || Boolean(activeUser.isDepartmentOwner);
  const canFilterProjectOwner = canSwitchDomain || activeRole === "itOwner";
  const canFilterProductOwner = canSwitchDomain || activeRole === "opsOwner";
  const canFilterSupplierManager = canSwitchDomain || activeRole === "itOwner";
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
          matchesSelect(task.owner, filters.department === "研发部" ? task.owner : allOption) &&
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

      <div className="panel">
        <SectionHeader eyebrow="FILTERS" title="报表筛选" />
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
              {["IT部", "研发部", "运营中心", "外部供应商"].map((department) => <option key={department} value={department}>{department}</option>)}
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
          <span className="filter-count">当前 {resultCount} 条对象 · {timeRanges.find((item) => item.value === filters.timeRange)?.label}</span>
        </div>
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
      />

      <div className="grid-2">
        <div className="panel">
          <SectionHeader eyebrow="DETAIL" title="绩效明细" />
          <table className="data-table">
            <thead><tr><th>对象</th><th>维度</th><th>核心指标</th><th>状态</th><th>说明</th></tr></thead>
            <tbody>
              {detailRows.map((row) => (
                <tr key={`${row.name}${row.dimension}`}>
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
  investments
}: {
  activeRole: RoleId;
  domain: ReportDomain;
  projects: Project[];
  demands: Demand[];
  tasks: Task[];
  suppliers: typeof supplierBudgets;
  investments: typeof projectInvestmentBreakdowns;
}) {
  if (activeRole === "pm") {
    return (
      <div className="grid-2">
        <div className="panel"><SectionHeader eyebrow="RISK RESPONSE" title="项目风险与应对" /><ProjectRiskList projects={visibleProjects} /></div>
        <div className="panel"><SectionHeader eyebrow="BUDGET CONTROL" title="负责项目预算偏差" /><MiniBarChart data={visibleProjects.map((project) => ({ label: shortLabel(project.name), value: budgetDeviation(project) }))} suffix="%" /></div>
        <div className="panel"><SectionHeader eyebrow="SUPPLIER GOVERNANCE" title="供应商交付风险" /><SupplierStatusList suppliers={suppliers} /></div>
        <div className="panel"><SectionHeader eyebrow="STAGE" title="项目阶段分布" /><MiniBarChart data={countBy(visibleProjects, (project) => project.stage)} suffix=" 项" /></div>
      </div>
    );
  }

  if (activeRole === "itOwner") {
    return (
      <div className="grid-2">
        <div className="panel"><SectionHeader eyebrow="PM PORTFOLIO" title="项目经理负责项目数" /><MiniBarChart data={countBy(visibleProjects, (project) => project.owner)} suffix=" 项" /></div>
        <div className="panel"><SectionHeader eyebrow="SUPPLIER" title="供应商风险分布" /><MiniBarChart data={countBy(suppliers, (item) => item.riskStatus)} suffix=" 家" /></div>
        <div className="panel"><SectionHeader eyebrow="RESOURCE GAP" title="研发人员负载" /><MiniBarChart data={resourcePeople.map((person) => ({ label: person.name, value: Math.round((person.assigned / person.capacity) * 100) }))} suffix="%" /></div>
        <div className="panel"><SectionHeader eyebrow="BUDGET" title="IT项目预算使用率" /><MiniBarChart data={visibleProjects.map((project) => ({ label: shortLabel(project.name), value: Math.round((project.usedBudget / Math.max(project.budget, 1)) * 100) }))} suffix="%" /></div>
      </div>
    );
  }

  if (domain === "engineering") {
    return (
      <div className="grid-2">
        <div className="panel"><SectionHeader eyebrow="TASK" title="任务状态分布" /><MiniBarChart data={statusDistribution(tasks)} suffix=" 项" /></div>
        <div className="panel"><SectionHeader eyebrow="WORKLOAD" title="研发人员负载" /><MiniBarChart data={resourcePeople.map((person) => ({ label: person.name, value: Math.round((person.assigned / person.capacity) * 100) }))} suffix="%" /></div>
        <div className="panel"><SectionHeader eyebrow="EFFORT" title="实际/预估工时" /><EffortCompare tasks={tasks} /></div>
        <div className="panel"><SectionHeader eyebrow="OWNER" title="人员任务量" /><MiniBarChart data={chartDataOrEmpty(countBy(tasks, (task) => task.owner), "暂无任务")} suffix=" 项" /></div>
      </div>
    );
  }

  if (domain === "product") {
    return (
      <div className="grid-2">
        <div className="panel"><SectionHeader eyebrow="VALUE" title="需求价值评分排行" /><MiniBarChart data={demands.map((demand) => ({ label: shortLabel(demand.name), value: demand.analysis.valueScore }))} /></div>
        <div className="panel"><SectionHeader eyebrow="FLOW" title="转项目实现方式" /><MiniBarChart data={modeDistribution(demands)} suffix=" 项" /></div>
        <div className="panel"><SectionHeader eyebrow="RESOURCE" title="资源申请节点状态" /><MiniBarChart data={resourceRequestStatus(demands)} suffix=" 个" /></div>
        <div className="panel"><SectionHeader eyebrow="STATUS" title="需求状态分布" /><MiniBarChart data={countBy(demands, (demand) => demand.status)} suffix=" 个" /></div>
      </div>
    );
  }

  if (domain === "operations") {
    return (
      <div className="grid-2">
        <div className="panel"><SectionHeader eyebrow="PRIORITY" title="运营需求优先级" /><MiniBarChart data={countBy(demands, (demand) => demand.priority)} suffix=" 个" /></div>
        <div className="panel"><SectionHeader eyebrow="ACCEPTANCE" title="业务验收评分（已评分需求）" /><MiniBarChart data={acceptanceScoreData(demands)} suffix="/5" /></div>
        <div className="panel"><SectionHeader eyebrow="INVESTMENT" title="业务投入项目排行" /><MiniBarChart data={investments.map((item) => ({ label: shortLabel(item.project), value: item.internalDays }))} suffix=" 人天" /></div>
        <div className="panel"><SectionHeader eyebrow="REQUESTER" title="需求提出人分布" /><MiniBarChart data={countBy(demands, (demand) => demand.requester)} suffix=" 个" /></div>
      </div>
    );
  }

  if (domain === "supplier") {
    return (
      <div className="grid-2">
        <div className="panel"><SectionHeader eyebrow="CONTRACT" title="供应商合同使用率" /><MiniBarChart data={suppliers.map((item) => ({ label: shortLabel(item.supplier), value: Math.round((item.used / Math.max(item.contract, 1)) * 100) }))} suffix="%" /></div>
        <div className="panel"><SectionHeader eyebrow="RISK" title="供应商风险分布" /><MiniBarChart data={countBy(suppliers, (item) => item.riskStatus)} suffix=" 家" /></div>
        <div className="panel"><SectionHeader eyebrow="PAYMENT" title="付款与交付状态" /><SupplierStatusList suppliers={suppliers} /></div>
        <div className="panel"><SectionHeader eyebrow="CONTRACT" title="供应商合同金额" /><MiniBarChart data={suppliers.map((item) => ({ label: shortLabel(item.supplier), value: Math.round(item.contract / 10000) }))} suffix="万" /></div>
      </div>
    );
  }

  if (domain === "budget") {
    return (
      <div className="grid-2">
        <div className="panel"><SectionHeader eyebrow="BUDGET" title="项目预算使用率" /><MiniBarChart data={visibleProjects.map((project) => ({ label: shortLabel(project.name), value: Math.round((project.usedBudget / Math.max(project.budget, 1)) * 100) }))} suffix="%" /></div>
        <div className="panel"><SectionHeader eyebrow="INVESTMENT" title="内部人天投入" /><MiniBarChart data={investments.map((item) => ({ label: shortLabel(item.project), value: item.internalDays }))} suffix=" 天" /></div>
        <div className="panel"><SectionHeader eyebrow="SUPPLIER" title="外部合同金额" /><MiniBarChart data={suppliers.map((item) => ({ label: shortLabel(item.supplier), value: Math.round(item.contract / 10000) }))} suffix="万" /></div>
        <div className="panel"><SectionHeader eyebrow="MIX" title="内外部投入结构" /><InvestmentMix investments={investments} /></div>
      </div>
    );
  }

  return (
    <div className="grid-2">
      <div className="panel"><SectionHeader eyebrow="ACCEPTANCE SCORE" title="业务验收评分（已评分需求）" /><MiniBarChart data={acceptanceScoreData(demands)} suffix="/5" /></div>
      <div className="panel"><SectionHeader eyebrow="PROGRESS" title="项目完成率排行" /><MiniBarChart data={visibleProjects.map((project) => ({ label: shortLabel(project.name), value: project.progress }))} suffix="%" /></div>
      <div className="panel"><SectionHeader eyebrow="BUDGET" title="预算偏差排行" /><MiniBarChart data={visibleProjects.map((project) => ({ label: shortLabel(project.name), value: budgetDeviation(project) }))} suffix="%" /></div>
      <div className="panel"><SectionHeader eyebrow="RISK" title="风险等级分布" /><MiniBarChart data={countBy(visibleProjects, (project) => project.risk)} suffix=" 项" /></div>
    </div>
  );
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
  if (role === "itOwner") return ["overview"];
  if (role === "pm") return ["project"];
  if (role === "product") return ["product"];
  if (role === "opsOwner") return ["operations"];
  if (role === "rdOwner") return ["engineering"];
  return ["overview"];
}

function scopeProjects(role: RoleId, activeUser: RoleOption, liveDemands: Demand[]) {
  if (role === "pm") return projects.filter((project) => project.owner === activeUser.userName || project.supplierManager === activeUser.userName);
  if (role === "product") {
    const demandIds = new Set(liveDemands.filter((demand) => demand.handler.includes(activeUser.userName)).map((demand) => demand.id));
    return projects.filter((project) => demandIds.has(project.demandId));
  }
  if (role === "opsOwner") {
    const demandIds = new Set(liveDemands.filter((demand) => demand.team === activeUser.department).map((demand) => demand.id));
    return projects.filter((project) => demandIds.has(project.demandId));
  }
  return projects;
}

function scopeDemands(role: RoleId, activeUser: RoleOption, liveDemands: Demand[], visibleProjects: Project[]) {
  if (role === "product") return liveDemands.filter((demand) => demand.handler.includes(activeUser.userName));
  if (role === "opsOwner") return liveDemands.filter((demand) => demand.team === activeUser.department);
  const visibleDemandIds = new Set(visibleProjects.map((project) => project.demandId));
  return liveDemands.filter((demand) => visibleDemandIds.has(demand.id));
}

function scopeTasks(role: RoleId, liveTasks: Task[], visibleProjects: Project[]) {
  if (role === "rdOwner") return liveTasks.filter((task) => internalDeveloperNames.has(task.owner));
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
  if (department === "运营中心") return demand?.team === department || project.contributions.some((item) => item.party === department);
  if (department === "研发部") return project.contributions.some((item) => item.party === department || item.type === "内部IT");
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
  const completedProjects = visibleProjects.filter((project) => ["已上线", "已归档"].includes(project.stage) || project.progress >= 100).length;
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
      { label: "平均进度", value: `${Math.round(average(visibleProjects.map((project) => project.progress)))}%`, delta: "当前项目推进", tone: "green" },
      { label: "预算偏差均值", value: `${Math.round(average(visibleProjects.map(budgetDeviation)))}%`, delta: "使用率相对进度", tone: "orange" },
      { label: "供应商项目", value: String(visibleProjects.filter((project) => project.implementation !== "内部实现").length), delta: "需跟踪合同与交付", tone: "violet" }
    ];
  }
  if (domain === "product") {
    return [
      { label: "需求承接量", value: String(visibleDemands.length), delta: "当前范围", tone: "blue" },
      { label: "平均价值评分", value: String(Math.round(averageValue)), delta: "产品优先级输入", tone: "violet" },
      { label: "转项目率", value: `${percent(flowedDemandCount, visibleDemands.length)}%`, delta: `${flowedDemandCount} 个已关联项目`, tone: "green" },
      { label: "待验收需求", value: String(visibleDemands.filter((demand) => demand.status === "待验收").length), delta: "需组织业务评分", tone: "orange" }
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
      { label: "运营需求量", value: String(visibleDemands.length), delta: "本部门需求池", tone: "blue" },
      { label: "P0/P1 占比", value: `${percent(important, visibleDemands.length)}%`, delta: `${important} 个高优先级`, tone: "orange" },
      { label: "平均验收评分", value: averageReview ? averageReview.toFixed(1) : "暂无", delta: "来自业务验收", tone: "violet" },
      { label: "待验收", value: String(visibleDemands.filter((demand) => demand.status === "待验收").length), delta: "需业务确认", tone: "green" }
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
      { label: "内部投入", value: `${internalDays}天`, delta: "研发/IT 人天", tone: "cyan" },
      { label: "外部合同", value: formatMoney(supplierContract), delta: "供应商合同金额", tone: "violet" },
      { label: "预算使用率", value: `${percent(budgetUsed, budgetTotal)}%`, delta: `${formatMoney(budgetUsed)} / ${formatMoney(budgetTotal)}`, tone: "green" },
      { label: "预算偏差均值", value: `${Math.round(average(visibleProjects.map(budgetDeviation)))}%`, delta: "使用率相对进度", tone: "orange" }
    ];
  }
  return [
    { label: "项目总数", value: String(visibleProjects.length), delta: `${completedProjects} 个已上线`, tone: "blue" },
    { label: "项目完成率", value: `${percent(completedProjects, visibleProjects.length)}%`, delta: "按已上线/100%统计", tone: "green" },
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
  if (role === "itOwner") {
    return visibleProjects.slice(0, 8).map((project) => ({
      name: project.name,
      dimension: `项目经理：${project.owner}`,
      metric: `进度 ${project.progress}% · 预算 ${percent(project.usedBudget, project.budget)}%`,
      status: project.risk,
      note: project.supplierManager === "无外部供应商" ? "纯内部实现，关注研发资源负载" : `供应商治理：${project.supplierManager}`
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
    dimension: `${project.projectType} · ${project.implementation}`,
    metric: `进度 ${project.progress}% · 偏差 ${budgetDeviation(project)}%`,
    status: project.risk,
    note: project.riskResponse
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
  const pendingDemand = visibleDemands.find((demand) => demand.status === "待验收" || demand.status === "产品评估中");
  const riskySupplier = visibleSuppliers.find((item) => item.riskStatus === "高");
  const heavyInvestment = [...visibleInvestments].sort((a, b) => b.internalDays - a.internalDays)[0];

  if (role === "pm") {
    return [
      { type: "风险", tone: highRiskProject ? "red" as Tone : "green" as Tone, title: highRiskProject?.name ?? "负责项目无高风险", body: highRiskProject?.riskResponse ?? "当前负责项目没有高风险事项。" },
      { type: "预算", tone: "orange" as Tone, title: `平均预算偏差 ${Math.round(average(visibleProjects.map(budgetDeviation)))}%`, body: "项目经理重点看预算使用率是否明显快于项目进度。" },
      { type: "供应商", tone: "violet" as Tone, title: `${visibleSuppliers.length} 条供应商合同`, body: "供应商付款、交付状态和风险需要与里程碑一起看。" }
    ];
  }
  if (role === "itOwner") {
    return [
      { type: "组合", tone: "blue" as Tone, title: `${visibleProjects.length} 个 IT 项目`, body: "IT负责人关注组合风险、预算和项目经理治理压力，不下钻普通业务个人绩效。" },
      { type: "资源", tone: overloaded ? "red" as Tone : "green" as Tone, title: overloaded ? `${overloaded.name} 超载` : "研发资源未超载", body: overloaded ? `${overloaded.assigned}/${overloaded.capacity}h，需要协调项目优先级。` : "当前研发资源负载可控。" },
      { type: "供应商", tone: riskySupplier ? "red" as Tone : "green" as Tone, title: riskySupplier?.supplier ?? "无高风险供应商", body: riskySupplier ? `${riskySupplier.project} · ${riskySupplier.deliveryStatus}` : "当前供应商风险可控。" }
    ];
  }
  if (domain === "engineering") {
    return [
      { type: "负载", tone: "red" as Tone, title: overloaded ? `${overloaded.name} 已超载` : "研发负载正常", body: overloaded ? `${overloaded.role} 当前 ${overloaded.assigned}/${overloaded.capacity}h，需要项目经理协调排期。` : "当前研发资源未超过周容量。" },
      { type: "暂停", tone: "orange" as Tone, title: "暂停任务需复盘", body: `${visibleTasks.filter((task) => task.status === "暂停").length} 个任务处于暂停状态，建议在周会中确认阻塞原因。` },
      { type: "工时", tone: "cyan" as Tone, title: "关注预估偏差", body: "实际/预估工时可作为后续资源申请和迭代计划的校准依据。" }
    ];
  }
  if (domain === "product") {
    return [
      { type: "价值", tone: "violet" as Tone, title: `平均价值 ${Math.round(average(visibleDemands.map((demand) => demand.analysis.valueScore)))}`, body: "可结合实现方式和资源申请状态决定下一批迭代优先级。" },
      { type: "流程", tone: "blue" as Tone, title: `${visibleProjects.length} 个需求已转项目`, body: "资源申请、业务确认和验收节点应在产品工作台继续跟进。" },
      { type: "待办", tone: "orange" as Tone, title: pendingDemand?.name ?? "暂无关键待办", body: pendingDemand ? `${pendingDemand.status} · ${pendingDemand.objective}` : "暂无待验收或产品评估中需求。" }
    ];
  }
  if (domain === "operations") {
    return [
      { type: "验收", tone: "green" as Tone, title: `${visibleDemands.filter((demand) => demand.status === "待验收").length} 个待验收`, body: "运营中心负责人可在需求管理中组织评分和结论沉淀。" },
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
    { type: "风险", tone: highRiskProject ? "red" as Tone : "green" as Tone, title: highRiskProject?.name ?? "无高风险项目", body: highRiskProject?.riskResponse ?? "风险处于可控状态。" },
    { type: "预算", tone: "orange" as Tone, title: `预算使用率 ${percent(visibleProjects.reduce((sum, project) => sum + project.usedBudget, 0), visibleProjects.reduce((sum, project) => sum + project.budget, 0))}%`, body: "预算偏差需要结合项目进度、供应商付款和内部人天一起判断。" },
    { type: "交付", tone: "blue" as Tone, title: `${visibleProjects.filter((project) => ["已上线", "已归档"].includes(project.stage)).length} 个项目已上线/归档`, body: "可切换项目绩效或资源预算域查看下钻指标。" }
  ];
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
      if (project.progress >= 90 || project.stage === "验收支持中" || project.stage === "已上线" || project.stage === "已归档") return "已安排";
      if (project.stage === "实施中" || project.stage === "联调测试中") return "执行中";
      if (project.stage === "待受理" || project.stage === "已立项" || project.stage === "资源排期中") return "评估中";
      return "待申请";
    }),
    "暂无资源申请"
  );
}

function budgetDeviation(project: Project) {
  return Math.round((project.usedBudget / Math.max(project.budget, 1)) * 100 - project.progress);
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

function shortLabel(value: string) {
  return value.replace("SAP S/4HANA ", "SAP").replace("一期", "").slice(0, 10);
}
