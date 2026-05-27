export const departments = [
  "全部部门",
  "营销中心",
  "供应链",
  "采购管理",
  "财务共享",
  "门店运营",
  "高管办",
  "人力行政",
  "数据平台"
];

export const demandByDepartment = [
  { department: "营销中心", proposed: 88, accepted: 61, completed: 51 },
  { department: "供应链", proposed: 64, accepted: 55, completed: 44 },
  { department: "采购管理", proposed: 42, accepted: 31, completed: 18 },
  { department: "财务共享", proposed: 39, accepted: 33, completed: 31 },
  { department: "门店运营", proposed: 93, accepted: 68, completed: 29 }
];

export const workloadByDepartment = [
  { department: "营销中心", weeks: [82, 96, 113, 118, 101] },
  { department: "供应链", weeks: [74, 85, 94, 98, 79] },
  { department: "采购管理", weeks: [92, 109, 121, 97, 81] },
  { department: "财务共享", weeks: [66, 73, 84, 92, 76] },
  { department: "门店运营", weeks: [99, 116, 124, 119, 103] },
  { department: "高管办", weeks: [58, 64, 72, 69, 61] },
  { department: "人力行政", weeks: [63, 79, 82, 76, 70] },
  { department: "数据平台", weeks: [91, 102, 108, 99, 87] }
];

export const projects = [
  {
    name: "CRM 会员增长平台",
    department: "营销中心",
    budget: 720,
    actual: 620,
    forecast: 806,
    progress: 56,
    start: 8,
    end: 66,
    status: "延期",
    riskLevel: "critical"
  },
  {
    name: "供应链计划中台",
    department: "供应链",
    budget: 705,
    actual: 410,
    forecast: 620,
    progress: 74,
    start: 16,
    end: 68,
    status: "正常",
    riskLevel: "high"
  },
  {
    name: "门店智能补货",
    department: "门店运营",
    budget: 735,
    actual: 530,
    forecast: 911,
    progress: 42,
    start: 42,
    end: 84,
    status: "临界",
    riskLevel: "critical"
  },
  {
    name: "财务共享自动化",
    department: "财务共享",
    budget: 590,
    actual: 260,
    forecast: 448,
    progress: 92,
    start: 4,
    end: 40,
    status: "已交付",
    riskLevel: "low"
  },
  {
    name: "采购风控模型",
    department: "采购管理",
    budget: 320,
    actual: 310,
    forecast: 340,
    progress: 69,
    start: 56,
    end: 92,
    status: "正常",
    riskLevel: "high"
  },
  {
    name: "数据指标治理一期",
    department: "数据平台",
    budget: 280,
    actual: 205,
    forecast: 286,
    progress: 64,
    start: 20,
    end: 72,
    status: "正常",
    riskLevel: "high"
  },
  {
    name: "电子合同归档",
    department: "高管办",
    budget: 180,
    actual: 132,
    forecast: 174,
    progress: 78,
    start: 12,
    end: 46,
    status: "正常",
    riskLevel: "medium"
  },
  {
    name: "人才盘点系统",
    department: "人力行政",
    budget: 210,
    actual: 168,
    forecast: 226,
    progress: 61,
    start: 30,
    end: 78,
    status: "临界",
    riskLevel: "high"
  },
  {
    name: "价格策略引擎",
    department: "营销中心",
    budget: 360,
    actual: 318,
    forecast: 430,
    progress: 48,
    start: 50,
    end: 94,
    status: "延期",
    riskLevel: "critical"
  },
  {
    name: "供应商协同门户",
    department: "采购管理",
    budget: 240,
    actual: 188,
    forecast: 268,
    progress: 57,
    start: 22,
    end: 64,
    status: "临界",
    riskLevel: "high"
  },
  {
    name: "门店巡检移动化",
    department: "门店运营",
    budget: 220,
    actual: 196,
    forecast: 270,
    progress: 45,
    start: 62,
    end: 96,
    status: "延期",
    riskLevel: "critical"
  },
  {
    name: "经营分析报表重构",
    department: "财务共享",
    budget: 220,
    actual: 163,
    forecast: 208,
    progress: 81,
    start: 10,
    end: 54,
    status: "正常",
    riskLevel: "low"
  }
];

export const riskInsights = [
  {
    title: "门店智能补货进入“高投入低进度”象限",
    department: "门店运营",
    tone: "critical",
    text: "已投入 ¥530 万，完工预测超预算 24%，本月里程碑存在延期。建议暂停新增范围，先完成核心补货链路验收。",
    tags: ["资金风险", "交付风险", "需决策"]
  },
  {
    title: "营销中心需求承接缺口正在挤压 CRM 交付",
    department: "营销中心",
    tone: "critical",
    text: "提出 88 项，接收 61 项，完成 42 项；第 3-4 周人力负荷超过 113%。建议调减低价值需求或临时补充外包。",
    tags: ["需求积压", "人力超载", "需协调"]
  },
  {
    title: "财务共享自动化投入产出健康",
    department: "财务共享",
    tone: "good",
    text: "预算消耗 44%，预测 76%，本月已完成核心里程碑。可作为流程自动化模板复用到采购侧。",
    tags: ["可复制", "节余", "已交付"]
  },
  {
    title: "采购风控模型存在数据口径冻结风险",
    department: "采购管理",
    tone: "warning",
    text: "业务数据口径仍未冻结，若本周未完成治理，验收将顺延。建议指定业务口径 owner，当周锁定。",
    tags: ["数据风险", "验收风险"]
  },
  {
    title: "数据平台并行支撑 7 个项目，存在公共能力瓶颈",
    department: "数据平台",
    tone: "warning",
    text: "指标治理、CRM、采购风控均依赖同一数据团队。建议将数据接口优先级前置到项目会决策。",
    tags: ["共享资源", "依赖风险"]
  }
];

function inDepartment(item, department) {
  return department === "全部部门" || item.department === department;
}

function sumDemand(rows) {
  return rows.reduce(
    (acc, row) => ({
      proposed: acc.proposed + row.proposed,
      accepted: acc.accepted + row.accepted,
      completed: acc.completed + row.completed
    }),
    { proposed: 0, accepted: 0, completed: 0 }
  );
}

export function getDashboardData(department = "全部部门", month = "2026-05") {
  const demandDepartments = demandByDepartment.filter((row) => inDepartment(row, department));
  const demand = sumDemand(demandDepartments);
  const selectedProjects = projects.filter((project) => inDepartment(project, department));
  const workload = workloadByDepartment.filter((row) => inDepartment(row, department));
  const selectedRisks = riskInsights.filter(
    (risk) => department === "全部部门" || risk.department === department || risk.department === "数据平台"
  );

  const actualSpend = selectedProjects.reduce((sum, project) => sum + project.actual, 0);
  const budget = selectedProjects.reduce((sum, project) => sum + project.budget, 0);
  const forecast = selectedProjects.reduce((sum, project) => sum + project.forecast, 0);
  const highRiskProjects = selectedProjects.filter((project) =>
    ["high", "critical"].includes(project.riskLevel)
  ).length;
  const peakWorkload = Math.max(...workload.flatMap((row) => row.weeks), 0);

  return {
    month,
    departments,
    demand: {
      totals: demand,
      departments: demandDepartments,
      acceptRate: demand.proposed ? Math.round((demand.accepted / demand.proposed) * 1000) / 10 : 0,
      deliveryRate: demand.accepted ? Math.round((demand.completed / demand.accepted) * 1000) / 10 : 0,
      endToEndRate: demand.proposed ? Math.round((demand.completed / demand.proposed) * 1000) / 10 : 0
    },
    workload,
    projects: selectedProjects,
    risks: selectedRisks,
    metrics: {
      totalDemand: demand.proposed,
      acceptedDemand: demand.accepted,
      completedDemand: demand.completed,
      peopleMonths: department === "全部部门" ? 186 : Math.max(18, Math.round(selectedProjects.length * 16.5)),
      peakWorkload,
      budget,
      actualSpend,
      forecastOverrun: Math.max(0, forecast - budget),
      highRiskProjects
    }
  };
}
