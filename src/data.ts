import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  Gauge,
  KanbanSquare,
  LockKeyhole,
  ServerCog,
  Settings,
  ShieldCheck,
  UserCog,
  UsersRound
} from "lucide-react";
import type {
  DashboardConfig,
  Department,
  DeliveryRequest,
  BotMessage,
  Demand,
  DemandProjectFlow,
  IntegrationEndpoint,
  NavItem,
  NotificationCatalogItem,
  NotificationItem,
  PermissionRow,
  Project,
  ProjectStage,
  ProjectDependency,
  ProjectInvestmentBreakdown,
  ProjectRule,
  ReportDatum,
  ResourceCalendarEntry,
  ResourcePerson,
  ResourceRequest,
  RoleAccessPreview,
  RoleNotificationSubscription,
  RoleOption,
  SupplierBudget,
  Task,
  User,
  WorkflowStageId
} from "./types";

const deliveryStageOrder: ProjectStage[] = ["项目准备", "项目启动", "项目进行", "项目完成", "项目结束"];
const demandFlowOrder = ["需求评审", "方案确认"];

export const workflowStageLabels: Record<WorkflowStageId, string> = {
  demandReview: "需求线：需求评审",
  solutionConfirm: "需求线：方案确认",
  projectPrepare: "项目线：项目准备",
  projectStart: "项目线：项目启动",
  projectExecution: "项目线：项目进行",
  projectComplete: "项目线：项目完成",
  projectEnded: "项目线：项目结束"
};

function projectStageTrack(current: ProjectStage) {
  const currentIndex = deliveryStageOrder.indexOf(current);
  return deliveryStageOrder.map((name, index) => ({ name, done: index <= currentIndex }));
}

function projectResourcePlan(
  internalPersonDays: number,
  needsExternalSupplier: boolean,
  externalSupplierPersonDays: number,
  externalSupplierRole: string,
  externalSupplierName: string,
  assignedResources: string[],
  startEndDate?: string
) {
  return {
    internalPersonDays,
    needsExternalSupplier,
    externalSupplierPersonDays,
    externalSupplierRole,
    externalSupplierName,
    assignedResources,
    startEndDate
  };
}

function demandLifecycle(current: string) {
  const currentIndex = demandFlowOrder.indexOf(current);
  return demandFlowOrder.map((name, index) => ({ name, done: index < currentIndex || current === "完成", current: name === current && current !== "完成" }));
}

export const roles: RoleOption[] = [
  {
    id: "admin",
    label: "全局管理员",
    description: "全量数据、系统配置、组织与权限维护",
    userName: "系统管理员",
    department: "无部门",
    email: "admin@company.com",
    phone: "13800138000"
  },
  {
    id: "executive",
    label: "高管",
    description: "全公司项目、预算与绩效汇总",
    userName: "林总",
    department: "管理层",
    email: "executive@company.com",
    phone: "13800138001"
  },
  {
    id: "pm",
    label: "项目经理 / IT负责人",
    description: "唯一项目经理，负责项目启动、资源池、指派开发、预算和风险",
    userName: "李书航",
    department: "IT部",
    email: "lishuhang@company.com",
    phone: "13800138007",
    organizationTitle: "IT负责人",
    isDepartmentOwner: true
  },
  {
    id: "product",
    label: "产品经理",
    description: "承接需求、评审方案、估算资源、跟踪验收和迭代评分",
    userName: "陈彦",
    department: "IT部",
    email: "chenyan@company.com",
    phone: "13800138003"
  },
  {
    id: "requester",
    label: "需求方",
    description: "提交需求、确认方案、跟踪进度、验收后评分",
    userName: "沈岚",
    department: "业务部门",
    email: "shenlan@company.com",
    phone: "13800138006"
  },
  {
    id: "businessOwner",
    label: "需求方负责人",
    description: "查看全部需求-项目情况，调整需求重要级别，关注部门投入和验收",
    userName: "周宁",
    department: "业务部门",
    email: "zhouning@company.com",
    phone: "13800138004",
    organizationTitle: "业务部门负责人",
    isDepartmentOwner: true
  },
  {
    id: "developer",
    label: "开发",
    description: "拆分子任务、估时排期、汇报进度、完成任务和登记工时",
    userName: "吴承",
    department: "IT部",
    email: "wucheng@company.com",
    phone: "13800138005"
  }
];

export const navItems: NavItem[] = [
  { id: "dashboard", label: "工作台", icon: Gauge },
  { id: "demands", label: "需求管理", icon: ClipboardList },
  { id: "projects", label: "项目管理", icon: ServerCog },
  { id: "tasks", label: "任务与工时", icon: KanbanSquare },
  { id: "resources", label: "资源与预算", icon: UsersRound },
  { id: "reports", label: "绩效与报表", icon: BarChart3 },
  { id: "notifications", label: "消息通知", icon: Bell },
  {
    id: "systemSettings",
    label: "系统设置",
    icon: Settings,
    children: [
      { id: "integrations", label: "集成中心", icon: ServerCog },
      { id: "permissions", label: "权限管理", icon: LockKeyhole },
      { id: "userSettings", label: "用户设置", icon: UserCog },
      { id: "roleSettings", label: "角色设置", icon: ShieldCheck },
      { id: "departmentSettings", label: "部门设置", icon: Building2 },
      { id: "notificationSettings", label: "通知设置", icon: Bell }
    ]
  }
];

export const dashboardByRole: Record<string, DashboardConfig> = {
  admin: {
    title: "管理员系统总览",
    subtitle: "查看全量 IT 项目数据，并维护用户、角色、部门和集成配置",
    focusTitle: "管理员待办",
    metrics: [
      { label: "系统用户", value: "86", delta: "4 个部门 + 全局管理员", tone: "blue" },
      { label: "启用角色", value: "6", delta: "含管理员与业务角色", tone: "cyan" },
      { label: "集成接口", value: "4", delta: "MCP / 企业微信", tone: "violet" },
      { label: "权限策略", value: "12", delta: "按部门和角色划分", tone: "green" }
    ],
    todos: ["复核业务部门负责人数据范围", "维护 IT部产品与开发账号", "检查企业微信机器人接口配置"]
  },
  executive: {
    title: "管理层工作台",
    subtitle: "只读查看需求到项目的全局效率、预算、风险和验收评分",
    focusTitle: "高管关注事项",
    metrics: [
      { label: "项目总数", value: "42", delta: "本季度新增 7 个", tone: "blue" },
      { label: "进行中项目", value: "19", delta: "5 个进入项目完成", tone: "cyan" },
      { label: "预算使用率", value: "71%", delta: "低于年度红线 9%", tone: "green" },
      { label: "平均交付评分", value: "4.5", delta: "较上月 +0.1", tone: "violet" }
    ],
    todos: ["审阅 SAP 蓝图变更预算", "确认 GxP 验证供应商评分", "关注算力中心高风险依赖"]
  },
  pm: {
    title: "项目经理工作台",
    subtitle: "唯一项目经理负责启动项目、判断资源、指派开发、推进验收",
    focusTitle: "项目经理待办",
    metrics: [
      { label: "待启动项目", value: "4", delta: "需判断资源是否合适", tone: "orange" },
      { label: "项目进行中", value: "9", delta: "3 个任务未完成", tone: "blue" },
      { label: "可用人天", value: "164", delta: "开发资源需排期", tone: "cyan" },
      { label: "预算预警", value: "4", delta: "供应商项目占 3 个", tone: "orange" }
    ],
    todos: ["处理 CRM 合规改造项目启动", "为 SAP 项目指派开发", "确认 GxP 文档系统能否进入项目完成"]
  },
  product: {
    title: "产品经理工作台",
    subtitle: "评审需求、设计方案、估算资源、发起方案确认并组织项目完成",
    focusTitle: "产品经理待办",
    metrics: [
      { label: "待需求评审", value: "8", delta: "P0/P1 共 4 个", tone: "orange" },
      { label: "待项目完成", value: "6", delta: "2 个需退回或完成", tone: "green" },
      { label: "方案确认中", value: "5", delta: "等待需求方确认", tone: "blue" },
      { label: "AI 高分需求", value: "4", delta: "建议优先推进", tone: "violet" }
    ],
    todos: ["评审 CRM 拜访合规改造", "发起 GxP 文档系统项目结束", "补充算力中心资源投入测算"]
  },
  businessOwner: {
    title: "需求方负责人工作台",
    subtitle: "查看业务部门全部需求-项目情况，调整重要级别并关注验收评分",
    focusTitle: "需求方负责人关注事项",
    metrics: [
      { label: "团队需求", value: "17", delta: "本周新增 3 个", tone: "blue" },
      { label: "P0/P1 需求", value: "6", delta: "需排序确认", tone: "orange" },
      { label: "投入人天", value: "258", delta: "环比 +16%", tone: "cyan" },
      { label: "已验收评分", value: "4.6", delta: "满意度稳定", tone: "green" }
    ],
    todos: ["调整算力中心需求重要级别", "查看 GxP 文档系统验收评分", "查看 SAP 项目资源投入"]
  },
  requester: {
    title: "需求方工作台",
    subtitle: "提交需求、跟进需求评审、确认产品方案；项目由项目经理关联并推进",
    focusTitle: "我的需求待办",
    metrics: [
      { label: "我的需求", value: "5", delta: "2 个进行中", tone: "blue" },
      { label: "待确认方案", value: "1", delta: "CRM 规则待确认", tone: "orange" },
      { label: "进行中项目", value: "2", delta: "关联项目推进中", tone: "cyan" },
      { label: "待验收", value: "1", delta: "等待验收处理", tone: "green" }
    ],
    todos: ["补充 CRM 拜访合规规则", "提交 LIMS 升级验收评分", "查看算力中心压测里程碑"]
  },
  developer: {
    title: "开发任务工作台",
    subtitle: "加入项目后拆分任务、估时排期、汇报进度、完成任务与登记工时",
    focusTitle: "开发待办",
    metrics: [
      { label: "我的任务", value: "11", delta: "3 个今日截止", tone: "orange" },
      { label: "进行中", value: "5", delta: "2 个阻塞待确认", tone: "blue" },
      { label: "本周工时", value: "32h", delta: "已填报 80%", tone: "green" },
      { label: "验证缺陷", value: "5", delta: "高优先级 1 个", tone: "red" }
    ],
    todos: ["填报 LIMS 仪器接口联调工时", "更新 GPU 集群监控状态", "处理 GxP 验证缺陷"]
  }
};

export const stageDistribution: ReportDatum[] = [
  { label: "需求评审", value: 6 },
  { label: "方案确认", value: 5 },
  { label: "项目启动", value: 4 },
  { label: "项目进行", value: 13 },
  { label: "项目完成", value: 6 },
  { label: "项目结束", value: 9 }
];

export const resourceTrend: ReportDatum[] = [
  { label: "1月", value: 136 },
  { label: "2月", value: 148 },
  { label: "3月", value: 172 },
  { label: "4月", value: 166 },
  { label: "5月", value: 198 },
  { label: "6月", value: 212 }
];

export const demands: Demand[] = [
  {
    id: "REQ-REVIEW-001",
    name: "销售样品申请移动化",
    requester: "沈岚",
    team: "业务部门",
    priority: "P2",
    status: "需求评审",
    handler: "陈彦 / 产品",
    progress: 18,
    targetDate: "2026-07-18",
    implementation: "内部实现",
    objective: "让需求方用手机提交样品申请、审批附件和期望到货时间，减少纸质流转。",
    description: "当前销售样品申请依赖线下表格和邮件，需求方正在补充审批节点、样品类型、附件模板和验收口径。",
    milestones: ["需求已创建", "已进入需求评审"],
    comments: ["用于验证创建需求成功后直接进入需求评审", "需求方负责人可调整重要级别"],
    linkedProject: "待项目关联",
    score: undefined,
    analysis: {
      feasibility: "现有 H5 表单和附件能力可复用，关键是补齐审批节点和数据留痕要求。",
      valueScore: 76,
      implementationReason: "需求创建后已进入产品评审，当前实现方式等待产品经理确认。",
      resourcePlan: "待产品经理评审后估算。",
      budgetEstimate: 0,
      budgetBasis: "需求评审阶段由产品经理补充预算测算。",
      iteration: "样品协同 V0.1"
    },
    priorityHistory: ["提交时 P2"],
    lifecycleSteps: demandLifecycle("需求评审")
  },
  {
    id: "REQ-2026-041",
    name: "SAP S/4HANA 财务供应链升级",
    requester: "沈岚",
    team: "业务部门",
    priority: "P0",
    status: "方案确认",
    handler: "陈彦 / 产品",
    progress: 58,
    targetDate: "2026-06-18",
    implementation: "合作实现",
    objective: "统一财务、采购、库存与批次成本核算口径，支撑集团化经营分析。",
    description: "升级 SAP 财务与供应链模块，覆盖主数据、采购入库、批次成本、财务凭证和接口改造。",
    milestones: ["蓝图评审通过", "外部顾问资源已确认", "主数据迁移开发中"],
    comments: ["财务侧确认成本中心编码规则", "项目经理补充主数据冻结风险"],
    linkedProject: "SAP S/4HANA 财务供应链一体化",
    score: undefined,
    analysis: {
      feasibility: "现有 ECC 数据可迁移，但主数据质量和外围接口改造是主要风险。",
      valueScore: 94,
      implementationReason: "SAP 核心模块升级由外部 SAP 实施顾问、IT部项目经理、IT部产品与开发、业务部门共同合作实现。",
      resourcePlan: "SAP 顾问 4 人、ABAP 开发 2 人、内部接口开发 2 人、测试 2 人，共 132 人天。",
      budgetEstimate: 1880000,
      budgetBasis: "按 SAP 顾问合同、ABAP/接口开发人天、测试验证和数据迁移窗口测算。",
      iteration: "SAP 核心平台 V2026.1"
    },
    priorityHistory: ["提交时 P1", "业务部门负责人调整为 P0：财务月结和供应链结算强依赖"],
    lifecycleSteps: demandLifecycle("方案确认")
  },
  {
    id: "REQ-2026-038",
    name: "CRM 医药代表拜访合规改造",
    requester: "周宁",
    team: "业务部门",
    priority: "P1",
    status: "方案确认",
    handler: "陈彦 / 产品",
    progress: 100,
    targetDate: "2026-07-05",
    implementation: "合作实现",
    objective: "满足医药代表拜访记录、合规审批和医生互动留痕要求。",
    description: "改造 CRM 拜访计划、签到定位、资料推送、合规审批和异常预警能力。",
    milestones: ["需求已提交", "CRM 供应商方案对比中"],
    comments: ["需确认业务合规审批节点", "预算需业务部门负责人二次确认"],
    linkedProject: "CRM 合规拜访改造",
    score: undefined,
    analysis: {
      feasibility: "CRM 标准能力可扩展，合规审批流和移动端留痕需要供应商定制。",
      valueScore: 88,
      implementationReason: "CRM 产品由外部供应商定制，内部 IT 负责权限、主数据和接口校验，业务方负责合规规则确认。",
      resourcePlan: "产品经理 1 人、CRM 顾问 2 人、移动端开发 1 人、验证测试 1 人。",
      budgetEstimate: 720000,
      budgetBasis: "按 CRM 供应商定制报价、移动端留痕改造、接口校验和验证测试人天测算。",
      iteration: "CRM 合规 V3.2"
    },
    priorityHistory: ["提交时 P2", "业务部门负责人调整为 P1：合规审计前必须上线"],
    lifecycleSteps: demandLifecycle("方案确认")
  },
  {
    id: "REQ-STAGE-2",
    name: "质量偏差 CAPA 跟踪看板",
    requester: "沈岚",
    team: "业务部门",
    priority: "P1",
    status: "方案确认",
    handler: "陈彦 / 产品",
    progress: 38,
    targetDate: "2026-07-12",
    implementation: "内部实现",
    objective: "统一查看偏差、CAPA、责任人、到期提醒和关闭状态，减少质量复盘遗漏。",
    description: "产品经理已完成解决方案和资源估算，方案确认后需求线结束，等待产品经理预创建并关联项目。",
    milestones: ["AI 评分已生成", "产品方案已提交", "等待需求方确认方案"],
    comments: ["用于验证产品经理把已确认方案的需求预创建为项目", "需求方仍可在方案确认阶段放弃需求"],
    linkedProject: "待项目关联",
    score: undefined,
    analysis: {
      feasibility: "偏差和 CAPA 数据已经在质量系统沉淀，可先做只读看板和到期提醒。",
      valueScore: 87,
      implementationReason: "产品经理建议内部实现，复用现有质量数据接口和权限模型。",
      resourcePlan: "产品经理 1 人、全栈开发 1 人、测试 1 人，预计 28 人天。",
      budgetEstimate: 180000,
      budgetBasis: "内部实现按 28 人天、复用质量系统接口、少量测试验证环境成本测算。",
      iteration: "质量协同 V1.0"
    },
    priorityHistory: ["提交时 P2", "业务部门负责人调整为 P1：季度质量复盘依赖"],
    lifecycleSteps: demandLifecycle("方案确认")
  },
  {
    id: "REQ-2026-033",
    name: "GxP 合规文档管理系统",
    requester: "沈岚",
    team: "业务部门",
    priority: "P1",
    status: "方案确认",
    handler: "陈彦 / 产品",
    progress: 92,
    targetDate: "2026-05-29",
    implementation: "合作实现",
    objective: "建立 SOP、验证文档、培训记录和电子签名的统一管理入口。",
    description: "支持文档版本、审批流、电子签名、培训任务、审计追踪和归档检索。",
    milestones: ["开发完成", "项目完成通过", "等待项目关闭"],
    comments: ["验证环境已准备", "需业务部门负责人补充评分"],
    linkedProject: "GxP 电子文档与验证平台",
    score: undefined,
    analysis: {
      feasibility: "文档、流程和电子签名组件可复用，但需补齐审计追踪和验证包。",
      valueScore: 90,
      implementationReason: "核心功能内部实现，同时引入 GxP 验证咨询支持验证策略和文档包。",
      resourcePlan: "全栈开发 1 人、验证工程师 1 人、测试 1 人，共 72 人天。",
      budgetEstimate: 620000,
      budgetBasis: "按内部开发人天、验证咨询服务、电子签名审计追踪配置和验证包复核测算。",
      iteration: "质量数字化 V1.5"
    },
    priorityHistory: ["提交时 P1", "保持 P1：年度 GMP 审计前验收"],
    lifecycleSteps: demandLifecycle("方案确认")
  },
  {
    id: "REQ-2026-030",
    name: "业务指标自助报表门户",
    requester: "沈岚",
    team: "业务部门",
    priority: "P1",
    status: "方案确认",
    handler: "陈彦 / 产品",
    progress: 64,
    targetDate: "2026-06-14",
    implementation: "内部实现",
    objective: "让业务部门按区域、品类、渠道和活动批次自助查看指标，减少人工取数和邮件流转。",
    description: "建设业务指标口径配置、权限审计、可视化报表和数据导出能力，复用现有内部数据服务。",
    milestones: ["指标口径冻结", "权限模型开发中", "报表页面联调中"],
    comments: ["不引入外部供应商", "业务部门负责人确认首批 18 个核心指标"],
    linkedProject: "业务指标自助报表门户",
    score: undefined,
    analysis: {
      feasibility: "数据服务和权限中心已有基础能力，可由IT部内部开发完成。",
      valueScore: 89,
      implementationReason: "该需求涉及内部指标口径、数据权限和审计日志，IT部掌握现有平台能力，因此采用纯内部实现。",
      resourcePlan: "产品经理 1 人、全栈开发 1 人、前端开发 1 人、接口开发 1 人，共 58 人天。",
      budgetEstimate: 280000,
      budgetBasis: "内部实现按 58 人天、报表底座复用、权限模型和审计日志开发测算。",
      iteration: "业务数据门户 V1.0"
    },
    priorityHistory: ["提交时 P2", "业务部门负责人调整为 P1：月度经营复盘依赖"],
    lifecycleSteps: demandLifecycle("方案确认")
  },
  {
    id: "REQ-2026-026",
    name: "LIMS 实验室信息管理系统升级",
    requester: "沈岚",
    team: "业务部门",
    priority: "P2",
    status: "方案确认",
    handler: "陈彦 / 产品",
    progress: 100,
    targetDate: "2026-05-12",
    implementation: "合作实现",
    objective: "提升实验样本、检测结果、仪器接口和审计追踪管理效率。",
    description: "升级 LIMS 样本流转、仪器数据采集、结果复核、电子签名和报表能力。",
    milestones: ["供应商交付", "项目完成通过", "需求方评价完成"],
    comments: ["仪器接口稳定性达到预期", "需求方评分较高"],
    linkedProject: "LIMS 实验室系统升级",
    score: 4.8,
    analysis: {
      feasibility: "供应商已有成熟 LIMS 升级方案，重点在仪器接口和历史数据迁移。",
      valueScore: 86,
      implementationReason: "LIMS 供应商负责产品升级，IT部负责供应商交付治理，IT部负责接口、安全和验证支持，需求方负责验收评分。",
      resourcePlan: "产品经理 1 人、供应商实施 3 人、内部验证测试 1 人。",
      budgetEstimate: 860000,
      budgetBasis: "按 LIMS 供应商升级包、仪器接口适配、历史数据迁移和内部验证测试测算。",
      iteration: "实验室信息化 V2.0"
    },
    acceptanceReview: {
      score: 4.8,
      comment: "样本流转和仪器数据采集效率明显提升，审计追踪满足验证要求。",
      conclusion: "通过验收",
      reviewer: "沈岚",
      date: "2026-05-12"
    },
    priorityHistory: ["提交时 P2", "保持 P2：开发效率专项"],
    lifecycleSteps: demandLifecycle("方案确认")
  },
  {
    id: "REQ-2026-019",
    name: "算力中心 GPU 集群建设",
    requester: "高翔",
    team: "业务部门",
    priority: "P2",
    status: "方案确认",
    handler: "陈彦 / 产品",
    progress: 76,
    targetDate: "2026-06-10",
    implementation: "合作实现",
    objective: "为药物研发 AI 建模、分子筛选和医学影像分析提供统一算力底座。",
    description: "建设 GPU 集群、作业调度、存储网络、监控告警和资源配额管理。",
    milestones: ["机房方案冻结", "GPU 节点上架完成", "调度平台测试中"],
    comments: ["算法团队提出存储吞吐要求", "基础架构团队已排查网络瓶颈"],
    linkedProject: "算力中心 GPU 集群一期",
    score: undefined,
    analysis: {
      feasibility: "硬件到货和机房电力是主要约束，调度平台可基于现有容器平台扩展。",
      valueScore: 91,
      implementationReason: "算力平台由 IT部项目经理统筹，IT部负责平台联调和技术验收，硬件与机房实施由外部供应商配合，需求方参与验收评分。",
      resourcePlan: "基础架构 2 人、平台开发 1 人、网络工程师 1 人、供应商实施 2 人，共 98 人天。",
      budgetEstimate: 3260000,
      budgetBasis: "按 GPU 设备、存储网络、机房电力扩容、供应商实施和平台联调人天测算。",
      iteration: "算法算力平台 V1.0"
    },
    priorityHistory: ["提交时 P2", "保持 P2：GPU 到货前不升优先级"],
    lifecycleSteps: demandLifecycle("方案确认")
  },
  {
    id: "REQ-2026-014",
    name: "培训中心音视频设备更新",
    requester: "周宁",
    team: "业务部门",
    priority: "P3",
    status: "方案确认",
    handler: "陈彦 / 产品",
    progress: 12,
    targetDate: "2026-07-20",
    implementation: "外部供应商",
    objective: "更新培训中心投屏、拾音、录播和远程会议设备，保障全国培训和合规宣导质量。",
    description: "由外部集成商完成音视频设备、弱电布线、录播主机和会议联动调试，内部仅做项目治理和验收。",
    milestones: ["现场踏勘预约", "供应商报价待确认"],
    comments: ["无需IT部开发投入", "项目经理负责供应商交付与合同风险"],
    linkedProject: "培训中心音视频设备更新",
    score: undefined,
    analysis: {
      feasibility: "需求以硬件集成和现场实施为主，内部没有必要自建实施队伍。",
      valueScore: 72,
      implementationReason: "该项目为纯外部供应商实施，IT部项目经理管理合同、交付、风险和验收，业务部门确认使用效果。",
      resourcePlan: "外部集成商 3 人现场实施，IT部项目经理治理 8 人天，业务部门验收 6 人天。",
      budgetEstimate: 450000,
      budgetBasis: "按音视频设备采购、弱电布线、现场调试、供应商培训和验收支持测算。",
      iteration: "培训中心硬件更新 V1.0"
    },
    priorityHistory: ["提交时 P3", "保持 P3：可与季度培训计划错峰实施"],
    lifecycleSteps: demandLifecycle("方案确认")
  }
];

export const projects: Project[] = [
  {
    id: "PRJ-126",
    name: "SAP S/4HANA 财务供应链一体化",
    demandId: "REQ-2026-041",
    owner: "李书航",
    supplierManager: "李书航",
    projectType: "软件项目",
    implementation: "合作实现",
    stage: "项目进行",
    progress: 58,
    budget: 1880000,
    usedBudget: 936000,
    personDays: 132,
    resourcePlan: projectResourcePlan(46, true, 86, "SAP 实施顾问 / ABAP 增强", "明德 SAP 实施顾问", ["吴承", "姜曼", "明德 SAP 实施顾问"], "2026-05-25"),
    risk: "中",
    riskReason: "主数据冻结窗口和外围接口排期存在依赖",
    riskResponse: "产品经理推动主数据冻结和接口联调计划；项目经理已完成接口开发与测试资源指派，开发按任务推进，若 6 月 3 日前未完成则拆分非关键接口二期上线。",
    aiScore: {
      businessValue: 92,
      urgency: 86,
      feasibility: 78,
      total: 86,
      recommendation: "推荐立项",
      reasons: ["财务供应链一体化对月结效率和合规透明度价值高", "上线窗口与主数据冻结强相关，需重点管控接口排期", "外部顾问成熟但跨系统联调复杂度较高"]
    },
    stages: projectStageTrack("项目进行"),
    milestones: [
      { name: "蓝图评审", date: "2026-05-12", status: "完成" },
      { name: "主数据迁移联调", date: "2026-06-03", status: "进行中" },
      { name: "财务供应链 UAT", date: "2026-06-18", status: "未开始" }
    ],
    resources: ["SAP 顾问 4 人", "ABAP 开发 2 人", "接口开发 2 人", "测试 2 人"],
    taskIds: ["TASK-901", "TASK-903", "TASK-904"],
    contributions: [
      { party: "IT部", type: "内部IT", responsibility: "外围接口、主数据校验、权限与环境管理", effort: "46 人天", cost: "内部成本", status: "开发中" },
      { party: "明德 SAP 实施顾问", type: "外部供应商", responsibility: "蓝图设计、FI/MM 模块配置、ABAP 增强", effort: "86 人天", cost: "188 万合同", status: "项目进行" },
      { party: "业务部门", type: "业务方", responsibility: "成本中心、采购入库、月结场景 UAT", effort: "24 人天", cost: "业务投入", status: "参与中" }
    ]
  },
  {
    id: "PRJ-124",
    name: "CRM 合规拜访改造",
    demandId: "REQ-2026-038",
    owner: "李书航",
    supplierManager: "李书航",
    projectType: "软件项目",
    implementation: "合作实现",
    stage: "项目准备",
    progress: 0,
    budget: 720000,
    usedBudget: 160000,
    personDays: 64,
    resourcePlan: projectResourcePlan(32, true, 32, "CRM 顾问 / 移动端改造", "星瀚 CRM 实施商", []),
    risk: "低",
    riskReason: "供应商报价和移动端合规留痕方案仍在评审",
    riskResponse: "产品经理组织供应商评分并收敛合规方案；项目经理只在资源窗口合适后启动项目，开发与供应商按确认方案执行。",
    aiScore: {
      businessValue: 88,
      urgency: 82,
      feasibility: 74,
      total: 82,
      recommendation: "推荐立项",
      reasons: ["拜访合规留痕直接支撑审计要求和销售行为规范", "移动 H5 场景明确但供应商报价仍需冻结", "实现依赖 CRM 供应商和内部接口协作，需先完成方案评审"]
    },
    stages: projectStageTrack("项目准备"),
    milestones: [
      { name: "合规规则确认", date: "2026-05-30", status: "进行中" },
      { name: "供应商方案定稿", date: "2026-06-08", status: "未开始" },
      { name: "移动端 UAT", date: "2026-07-05", status: "未开始" }
    ],
    resources: ["产品经理 1 人", "CRM 供应商 2 人", "移动端开发 1 人", "接口开发 1 人"],
    taskIds: [],
    contributions: [
      { party: "IT部", type: "内部IT", responsibility: "医生主数据、权限接口和移动端联调支持", effort: "32 人天", cost: "内部成本", status: "分析中" },
      { party: "星瀚 CRM 实施商", type: "外部供应商", responsibility: "CRM 配置、合规审批流、拜访留痕和报价交付", effort: "32 人天", cost: "72 万合同", status: "方案评审" },
      { party: "业务部门", type: "业务方", responsibility: "拜访规则、医学审批节点和异常预警口径确认", effort: "14 人天", cost: "业务投入", status: "确认中" }
    ]
  },
  {
    id: "PRJ-119",
    name: "GxP 电子文档与验证平台",
    demandId: "REQ-2026-033",
    owner: "李书航",
    supplierManager: "李书航",
    projectType: "软件项目",
    implementation: "合作实现",
    stage: "项目完成",
    progress: 92,
    budget: 620000,
    usedBudget: 548000,
    personDays: 72,
    resourcePlan: projectResourcePlan(52, true, 20, "GxP 验证咨询", "信合 GxP 验证咨询", ["陆川", "姜曼", "信合 GxP 验证咨询"], "2026-05-20"),
    risk: "低",
    riskReason: "待业务部门完成验收评分",
    riskResponse: "产品经理已发起业务部门验收邀请，开发和供应商补齐验证包归档材料。",
    aiScore: {
      businessValue: 90,
      urgency: 80,
      feasibility: 88,
      total: 87,
      recommendation: "推荐立项",
      reasons: ["GxP 文档和审计追踪是合规基础能力", "验证咨询与内部开发分工清晰", "项目已进入验收支持，交付确定性高"]
    },
    stages: projectStageTrack("项目完成"),
    milestones: [
      { name: "验证测试通过", date: "2026-05-20", status: "完成" },
      { name: "需求方验收", date: "2026-05-29", status: "进行中" }
    ],
    resources: ["全栈开发 1 人", "验证工程师 1 人", "测试 1 人"],
    taskIds: ["TASK-818", "TASK-819", "TASK-817"],
    contributions: [
      { party: "IT部", type: "内部IT", responsibility: "文档版本、审批流、电子签名和审计追踪开发", effort: "52 人天", cost: "内部成本", status: "验收中" },
      { party: "信合 GxP 验证咨询", type: "外部供应商", responsibility: "验证策略、测试脚本、验证包复核", effort: "20 人天", cost: "22 万合同", status: "复核中" },
      { party: "业务部门", type: "业务方", responsibility: "SOP 场景确认、验证测试和验收评分", effort: "18 人天", cost: "业务投入", status: "待评分" }
    ]
  },
  {
    id: "PRJ-116",
    name: "业务指标自助报表门户",
    demandId: "REQ-2026-030",
    owner: "李书航",
    supplierManager: "无外部供应商",
    projectType: "软件项目",
    implementation: "内部实现",
    stage: "项目进行",
    progress: 64,
    budget: 280000,
    usedBudget: 142000,
    personDays: 58,
    resourcePlan: projectResourcePlan(58, false, 0, "无", "无外部供应商", ["姜曼", "陆川", "吴承"], "2026-05-25"),
    risk: "中",
    riskReason: "指标口径和部门数据权限需要业务部门负责人最终确认",
    riskResponse: "产品经理将口径冻结会提前到 5 月 31 日，开发按已指派任务先完成权限模型和审计日志底座。",
    aiScore: {
      businessValue: 84,
      urgency: 76,
      feasibility: 86,
      total: 82,
      recommendation: "推荐立项",
      reasons: ["自助报表可降低跨部门取数沟通成本", "纯内部实现不依赖外采合同，成本可控", "指标口径和行级权限需要先冻结，避免后期返工"]
    },
    stages: projectStageTrack("项目进行"),
    milestones: [
      { name: "指标口径冻结", date: "2026-05-31", status: "进行中" },
      { name: "权限模型联调", date: "2026-06-07", status: "未开始" },
      { name: "业务 UAT", date: "2026-06-14", status: "未开始" }
    ],
    resources: ["产品经理 1 人", "全栈开发 1 人", "前端开发 1 人", "接口开发 1 人"],
    taskIds: ["TASK-846", "TASK-842", "TASK-843"],
    contributions: [
      { party: "IT部", type: "内部IT", responsibility: "报表门户、权限模型、审计日志和数据导出接口", effort: "58 人天", cost: "内部成本", status: "开发中" },
      { party: "业务部门", type: "业务方", responsibility: "指标口径、样例数据、验收脚本和权限边界确认", effort: "18 人天", cost: "业务投入", status: "参与中" }
    ]
  },
  {
    id: "PRJ-108",
    name: "LIMS 实验室系统升级",
    demandId: "REQ-2026-026",
    owner: "李书航",
    supplierManager: "李书航",
    projectType: "软硬件协同",
    implementation: "合作实现",
    stage: "项目结束",
    progress: 100,
    budget: 860000,
    usedBudget: 842000,
    personDays: 36,
    resourcePlan: projectResourcePlan(18, true, 36, "LIMS 供应商实施", "LIMS 供应商", ["陆川", "LIMS 供应商"], "2026-04-28"),
    risk: "低",
    riskReason: "已完成上线复盘",
    riskResponse: "进入运维观察期，LIMS 供应商保留 2 周问题响应窗口。",
    aiScore: {
      businessValue: 86,
      urgency: 72,
      feasibility: 90,
      total: 84,
      recommendation: "推荐立项",
      reasons: ["实验室样本流程升级对开发效率和数据合规有明确价值", "供应商能力成熟，已完成上线复盘", "后续主要风险在运维观察和问题响应窗口"]
    },
    stages: projectStageTrack("项目结束"),
    milestones: [
      { name: "供应商交付", date: "2026-04-28", status: "完成" },
      { name: "正式上线", date: "2026-05-12", status: "完成" }
    ],
    resources: ["产品经理 1 人", "供应商实施 3 人", "验证测试 1 人"],
    taskIds: ["TASK-732", "TASK-733", "TASK-734"],
    contributions: [
      { party: "IT部", type: "内部IT", responsibility: "仪器接口、安全策略、账号权限和验证协调", effort: "18 人天", cost: "内部成本", status: "已完成" },
      { party: "LIMS 供应商", type: "外部供应商", responsibility: "系统升级、样本流程配置、报表和接口适配", effort: "36 人天", cost: "86 万合同", status: "已交付" },
      { party: "业务部门", type: "业务方", responsibility: "样本流转、结果复核和实验室场景验收", effort: "16 人天", cost: "业务投入", status: "已验收" }
    ]
  },
  {
    id: "PRJ-131",
    name: "算力中心 GPU 集群一期",
    demandId: "REQ-2026-019",
    owner: "李书航",
    supplierManager: "李书航",
    projectType: "硬件项目",
    implementation: "合作实现",
    stage: "项目进行",
    progress: 76,
    budget: 3260000,
    usedBudget: 2480000,
    personDays: 98,
    resourcePlan: projectResourcePlan(62, true, 36, "硬件供应商 / 机房实施", "云算科技", ["韩冰", "罗清", "云算科技"], "2026-05-18"),
    risk: "高",
    riskReason: "GPU 交付批次和机房电力扩容存在不确定性",
    riskResponse: "先上线 12 卡试运行环境，完整集群等待第二批设备到货；高管周会确认扩容预算。",
    aiScore: {
      businessValue: 94,
      urgency: 88,
      feasibility: 68,
      total: 84,
      recommendation: "谨慎推荐",
      reasons: ["AI 建模与影像分析算力底座战略价值高", "GPU 到货和机房电力扩容存在硬件交付风险", "建议分阶段上线试运行环境，预算和供应链风险需高管持续关注"]
    },
    stages: projectStageTrack("项目进行"),
    milestones: [
      { name: "GPU 节点上架", date: "2026-05-18", status: "完成" },
      { name: "调度平台压测", date: "2026-05-28", status: "延期风险" }
    ],
    resources: ["基础架构 2 人", "平台开发 1 人", "网络工程师 1 人", "供应商实施 2 人"],
    taskIds: ["TASK-881", "TASK-882", "TASK-883"],
    contributions: [
      { party: "IT部", type: "内部IT", responsibility: "调度平台、资源配额、监控告警和安全策略", effort: "62 人天", cost: "内部成本", status: "测试中" },
      { party: "云算科技", type: "外部供应商", responsibility: "GPU 服务器、存储网络、机房上架和硬件维保", effort: "36 人天", cost: "326 万合同", status: "到货验收中" },
      { party: "业务部门", type: "业务方", responsibility: "AI 建模场景、压测作业和算力验收标准", effort: "20 人天", cost: "业务投入", status: "参与中" }
    ]
  },
  {
    id: "PRJ-097",
    name: "培训中心音视频设备更新",
    demandId: "REQ-2026-014",
    owner: "李书航",
    supplierManager: "李书航",
    projectType: "硬件项目",
    implementation: "外部供应商",
    stage: "项目启动",
    progress: 0,
    budget: 450000,
    usedBudget: 30000,
    personDays: 8,
    resourcePlan: projectResourcePlan(8, true, 42, "外部音视频集成商", "远见智能会议集成商", ["远见智能实施"]),
    risk: "低",
    riskReason: "现场踏勘尚未完成，设备清单和布线窗口待确认",
    riskResponse: "产品经理确认外部供应商实施方案；项目经理启动后锁定供应商踏勘和施工窗口，避免影响季度合规培训。",
    aiScore: {
      businessValue: 70,
      urgency: 66,
      feasibility: 82,
      total: 72,
      recommendation: "谨慎推荐",
      reasons: ["培训体验提升明确，但业务收益不如核心系统改造直接", "外部集成商可完整交付，内部开发占用低", "现场踏勘和施工窗口确认后再锁定最终设备清单"]
    },
    stages: projectStageTrack("项目启动"),
    milestones: [
      { name: "现场踏勘", date: "2026-05-29", status: "预约中" },
      { name: "设备清单确认", date: "2026-06-06", status: "未开始" },
      { name: "安装验收", date: "2026-07-20", status: "未开始" }
    ],
    resources: ["外部集成商 3 人", "项目经理治理 1 人", "需求方验收 2 人"],
    taskIds: [],
    contributions: [
      { party: "远见智能会议集成商", type: "外部供应商", responsibility: "设备采购、弱电布线、音视频调试、录播联动和现场培训", effort: "42 人天", cost: "45 万合同", status: "待踏勘" },
      { party: "业务部门", type: "业务方", responsibility: "培训场景、验收标准和使用效果确认", effort: "6 人天", cost: "业务投入", status: "待评审" }
    ]
  }
];

export const initialTasks: Task[] = [
  {
    id: "TASK-901",
    title: "SAP 主数据迁移校验",
    projectId: "PRJ-126",
    project: "SAP S/4HANA 财务供应链一体化",
    owner: "吴承",
    status: "进行中",
    estimate: 32,
    actual: 18,
    due: "2026-06-03",
    role: "接口开发",
    description: "校验物料、供应商、成本中心和批次主数据迁移规则。",
    worklogs: [{ date: "2026-05-24", hours: 6, note: "完成成本中心映射校验" }]
  },
  {
    id: "TASK-903",
    title: "SAP 采购入库接口联调",
    projectId: "PRJ-126",
    project: "SAP S/4HANA 财务供应链一体化",
    owner: "吴承",
    status: "进行中",
    estimate: 28,
    actual: 12,
    due: "2026-06-05",
    role: "接口开发",
    description: "联调采购入库、批号、供应商和库存凭证接口。",
    worklogs: [{ date: "2026-05-25", hours: 4, note: "完成采购入库接口字段映射" }]
  },
  {
    id: "TASK-904",
    title: "SAP 批次成本核算联调",
    projectId: "PRJ-126",
    project: "SAP S/4HANA 财务供应链一体化",
    owner: "姜曼",
    status: "待开始",
    estimate: 16,
    actual: 0,
    due: "2026-06-10",
    role: "前端/移动端开发",
    description: "补充批次成本核算校验看板和异常提示。",
    worklogs: []
  },
  {
    id: "TASK-846",
    title: "业务指标口径配置页面",
    projectId: "PRJ-116",
    project: "业务指标自助报表门户",
    owner: "姜曼",
    status: "进行中",
    estimate: 22,
    actual: 11,
    due: "2026-06-06",
    role: "前端/移动端开发",
    description: "实现指标口径配置、筛选条件、权限提示和报表预览页面。",
    worklogs: [{ date: "2026-05-25", hours: 5, note: "完成指标列表和筛选器框架" }]
  },
  {
    id: "TASK-817",
    title: "GxP 文档审批流验证缺陷",
    projectId: "PRJ-119",
    project: "GxP 电子文档与验证平台",
    owner: "陆川",
    status: "测试中",
    estimate: 12,
    actual: 14,
    due: "2026-05-28",
    role: "全栈开发",
    description: "修复电子签名时间戳和审计追踪筛选条件问题。",
    worklogs: [{ date: "2026-05-23", hours: 4, note: "修复审计追踪筛选状态" }]
  },
  {
    id: "TASK-818",
    title: "GxP 电子签名审批流",
    projectId: "PRJ-119",
    project: "GxP 电子文档与验证平台",
    owner: "陆川",
    status: "测试中",
    estimate: 20,
    actual: 16,
    due: "2026-05-29",
    role: "全栈开发",
    description: "完善电子签名、审批节点、退回重签和审计追踪链路。",
    worklogs: [{ date: "2026-05-25", hours: 4, note: "补充退回重签场景" }]
  },
  {
    id: "TASK-819",
    title: "GxP 审计追踪报表",
    projectId: "PRJ-119",
    project: "GxP 电子文档与验证平台",
    owner: "姜曼",
    status: "进行中",
    estimate: 14,
    actual: 7,
    due: "2026-05-31",
    role: "前端/移动端开发",
    description: "实现审计追踪筛选、导出和验证复核页面。",
    worklogs: [{ date: "2026-05-25", hours: 3, note: "完成审计追踪列表联调" }]
  },
  {
    id: "TASK-842",
    title: "业务报表权限审计日志",
    projectId: "PRJ-116",
    project: "业务指标自助报表门户",
    owner: "陆川",
    status: "进行中",
    estimate: 18,
    actual: 8,
    due: "2026-06-07",
    role: "全栈开发",
    description: "补充按部门、角色和人员维度的报表访问审计日志。",
    worklogs: [{ date: "2026-05-26", hours: 4, note: "完成审计日志表结构和查询接口" }]
  },
  {
    id: "TASK-843",
    title: "业务报表导出接口",
    projectId: "PRJ-116",
    project: "业务指标自助报表门户",
    owner: "吴承",
    status: "待开始",
    estimate: 16,
    actual: 0,
    due: "2026-06-10",
    role: "接口开发",
    description: "实现报表导出、权限校验和导出审计记录。",
    worklogs: []
  },
  {
    id: "TASK-732",
    title: "LIMS 样本流转配置",
    projectId: "PRJ-108",
    project: "LIMS 实验室系统升级",
    owner: "供应商实施",
    status: "已完成",
    estimate: 18,
    actual: 17,
    due: "2026-05-03",
    role: "外部实施",
    description: "配置样本接收、分样、检测、复核和归档流程。",
    worklogs: [{ date: "2026-05-03", hours: 7, note: "完成样本流转主流程验证" }]
  },
  {
    id: "TASK-733",
    title: "LIMS 仪器接口联调",
    projectId: "PRJ-108",
    project: "LIMS 实验室系统升级",
    owner: "供应商实施",
    status: "已完成",
    estimate: 20,
    actual: 18,
    due: "2026-05-05",
    role: "外部实施",
    description: "联调 HPLC、溶出仪和天平数据采集接口。",
    worklogs: [{ date: "2026-05-05", hours: 8, note: "完成 12 台仪器接口验证" }]
  },
  {
    id: "TASK-734",
    title: "LIMS 审计追踪验证",
    projectId: "PRJ-108",
    project: "LIMS 实验室系统升级",
    owner: "陆川",
    status: "已完成",
    estimate: 12,
    actual: 11,
    due: "2026-05-08",
    role: "全栈开发",
    description: "验证样本、仪器和结果复核的审计追踪完整性。",
    worklogs: [{ date: "2026-05-08", hours: 5, note: "完成审计追踪验证包复核" }]
  },
  {
    id: "TASK-881",
    title: "GPU 集群监控告警",
    projectId: "PRJ-131",
    project: "算力中心 GPU 集群一期",
    owner: "韩冰",
    status: "暂停",
    estimate: 40,
    actual: 26,
    due: "2026-05-30",
    role: "平台开发",
    description: "建设 GPU 利用率、显存、作业队列和节点健康监控。",
    worklogs: [{ date: "2026-05-22", hours: 5, note: "等待第二批 GPU 节点到货" }]
  },
  {
    id: "TASK-882",
    title: "GPU 作业调度平台",
    projectId: "PRJ-131",
    project: "算力中心 GPU 集群一期",
    owner: "韩冰",
    status: "测试中",
    estimate: 36,
    actual: 20,
    due: "2026-06-03",
    role: "平台开发",
    description: "联调作业队列、资源配额、优先级和失败重试策略。",
    worklogs: [{ date: "2026-05-26", hours: 4, note: "完成调度策略联调" }]
  },
  {
    id: "TASK-883",
    title: "GPU 存储网络压测",
    projectId: "PRJ-131",
    project: "算力中心 GPU 集群一期",
    owner: "罗清",
    status: "进行中",
    estimate: 24,
    actual: 10,
    due: "2026-06-05",
    role: "AI 平台工程师",
    description: "压测存储吞吐、训练数据读取和多任务并发性能。",
    worklogs: [{ date: "2026-05-29", hours: 4, note: "完成首轮吞吐压测" }]
  }
];

export const resourcePeople: ResourcePerson[] = [
  {
    name: "吴承",
    role: "接口开发",
    skills: ["SAP 接口", "Java", "主数据治理"],
    capacity: 40,
    assigned: 30,
    allocations: [
      { project: "SAP S/4HANA 财务供应链一体化", work: "主数据迁移校验、采购入库接口", hours: 18, status: "进行中" },
      { project: "GxP 电子文档与验证平台", work: "电子签名接口复核", hours: 8, status: "测试中" },
      { project: "业务指标自助报表门户", work: "报表导出接口和数据权限校验", hours: 4, status: "排期中" }
    ]
  },
  {
    name: "姜曼",
    role: "前端/移动端开发",
    skills: ["React", "CRM", "合规留痕"],
    capacity: 40,
    assigned: 20,
    allocations: [
      { project: "GxP 电子文档与验证平台", work: "培训记录查询和审计追踪页面", hours: 8, status: "进行中" },
      { project: "SAP S/4HANA 财务供应链一体化", work: "主数据校验看板", hours: 4, status: "排期中" },
      { project: "业务指标自助报表门户", work: "指标口径配置页面", hours: 8, status: "进行中" }
    ]
  },
  {
    name: "韩冰",
    role: "平台开发",
    skills: ["Kubernetes", "GPU 调度", "监控告警"],
    capacity: 40,
    assigned: 42,
    allocations: [
      { project: "算力中心 GPU 集群一期", work: "GPU 节点监控、作业调度平台", hours: 26, status: "暂停" },
      { project: "算力中心 GPU 集群一期", work: "模型训练作业队列与 GPU 配额联调", hours: 10, status: "进行中" },
      { project: "LIMS 实验室系统升级", work: "仪器数据采集队列稳定性排查", hours: 6, status: "已完成" }
    ]
  },
  {
    name: "陆川",
    role: "全栈开发",
    skills: ["Node.js", "电子签名", "审计追踪"],
    capacity: 40,
    assigned: 29,
    allocations: [
      { project: "GxP 电子文档与验证平台", work: "电子签名审批流与审计追踪缺陷", hours: 14, status: "测试中" },
      { project: "LIMS 实验室系统升级", work: "验证报表导出接口", hours: 9, status: "已完成" },
      { project: "业务指标自助报表门户", work: "权限审计日志和角色过滤", hours: 6, status: "进行中" }
    ]
  },
  {
    name: "罗清",
    role: "AI 平台工程师",
    skills: ["RAG", "算力平台", "MCP"],
    capacity: 40,
    assigned: 38,
    allocations: [
      { project: "算力中心 GPU 集群一期", work: "MCP 查询能力与资源配额接口", hours: 16, status: "进行中" },
      { project: "算力中心 GPU 集群一期", work: "RAG 知识库训练任务模板和算力配额接口", hours: 14, status: "进行中" },
      { project: "GxP 电子文档与验证平台", work: "文档智能检索功能", hours: 8, status: "待评审" }
    ]
  }
];

export const resourceCalendars: ResourceCalendarEntry[] = [
  { person: "吴承", date: "2026-05-25", timeSlot: "上午", taskId: "TASK-901", task: "SAP 主数据迁移校验", projectId: "PRJ-126", project: "SAP S/4HANA 财务供应链一体化", hours: 4, status: "进行中" },
  { person: "吴承", date: "2026-05-25", timeSlot: "下午", taskId: "TASK-903", task: "SAP 采购入库接口联调", projectId: "PRJ-126", project: "SAP S/4HANA 财务供应链一体化", hours: 4, status: "进行中" },
  { person: "吴承", date: "2026-05-26", timeSlot: "上午", taskId: "TASK-818", task: "GxP 电子签名审批流", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 3, status: "测试中" },
  { person: "吴承", date: "2026-05-27", timeSlot: "全天", taskId: "TASK-901", task: "SAP 主数据迁移校验", projectId: "PRJ-126", project: "SAP S/4HANA 财务供应链一体化", hours: 7, status: "进行中" },
  { person: "吴承", date: "2026-05-28", timeSlot: "上午", taskId: "TASK-901", task: "SAP 主数据迁移校验", projectId: "PRJ-126", project: "SAP S/4HANA 财务供应链一体化", hours: 4, status: "进行中" },
  { person: "吴承", date: "2026-05-29", timeSlot: "下午", taskId: "TASK-818", task: "GxP 电子签名审批流", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 3, status: "测试中" },
  { person: "吴承", date: "2026-06-02", timeSlot: "全天", taskId: "TASK-903", task: "SAP 采购入库接口联调", projectId: "PRJ-126", project: "SAP S/4HANA 财务供应链一体化", hours: 8, status: "待开始" },
  { person: "吴承", date: "2026-06-03", timeSlot: "下午", taskId: "TASK-843", task: "业务报表导出接口", projectId: "PRJ-116", project: "业务指标自助报表门户", hours: 4, status: "待开始" },

  { person: "姜曼", date: "2026-05-25", timeSlot: "下午", taskId: "TASK-819", task: "GxP 审计追踪报表", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 3, status: "进行中" },
  { person: "姜曼", date: "2026-05-27", timeSlot: "上午", taskId: "TASK-819", task: "GxP 审计追踪报表", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 4, status: "进行中" },
  { person: "姜曼", date: "2026-05-28", timeSlot: "下午", taskId: "TASK-904", task: "SAP 批次成本核算联调", projectId: "PRJ-126", project: "SAP S/4HANA 财务供应链一体化", hours: 4, status: "待开始" },
  { person: "姜曼", date: "2026-05-29", timeSlot: "上午", taskId: "TASK-846", task: "业务指标口径配置页面", projectId: "PRJ-116", project: "业务指标自助报表门户", hours: 4, status: "进行中" },

  { person: "韩冰", date: "2026-05-25", timeSlot: "上午", taskId: "TASK-881", task: "GPU 集群监控告警", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "暂停" },
  { person: "韩冰", date: "2026-05-26", timeSlot: "上午", taskId: "TASK-882", task: "GPU 作业调度平台", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "测试中" },
  { person: "韩冰", date: "2026-05-27", timeSlot: "全天", taskId: "TASK-881", task: "GPU 集群监控告警", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 8, status: "暂停" },
  { person: "韩冰", date: "2026-05-29", timeSlot: "下午", taskId: "TASK-883", task: "GPU 存储网络压测", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "进行中" },
  { person: "韩冰", date: "2026-06-03", timeSlot: "全天", taskId: "TASK-882", task: "GPU 作业调度平台", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 8, status: "测试中" },

  { person: "陆川", date: "2026-05-25", timeSlot: "上午", taskId: "TASK-817", task: "GxP 文档审批流验证缺陷", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 4, status: "测试中" },
  { person: "陆川", date: "2026-05-26", timeSlot: "全天", taskId: "TASK-817", task: "GxP 文档审批流验证缺陷", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 7, status: "测试中" },
  { person: "陆川", date: "2026-05-27", timeSlot: "下午", taskId: "TASK-842", task: "业务报表权限审计日志", projectId: "PRJ-116", project: "业务指标自助报表门户", hours: 4, status: "进行中" },
  { person: "陆川", date: "2026-05-28", timeSlot: "上午", taskId: "TASK-734", task: "LIMS 审计追踪验证", projectId: "PRJ-108", project: "LIMS 实验室系统升级", hours: 4, status: "已完成" },
  { person: "陆川", date: "2026-06-01", timeSlot: "下午", taskId: "TASK-819", task: "GxP 审计追踪报表", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 4, status: "进行中" },
  { person: "陆川", date: "2026-06-02", timeSlot: "上午", taskId: "TASK-842", task: "业务报表权限审计日志", projectId: "PRJ-116", project: "业务指标自助报表门户", hours: 4, status: "进行中" },

  { person: "罗清", date: "2026-05-25", timeSlot: "上午", taskId: "TASK-883", task: "GPU 存储网络压测", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "进行中" },
  { person: "罗清", date: "2026-05-29", timeSlot: "上午", taskId: "TASK-883", task: "GPU 存储网络压测", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "进行中" },

  { person: "吴承", date: "2026-06-09", timeSlot: "上午", taskId: "TASK-843", task: "业务报表导出接口", projectId: "PRJ-116", project: "业务指标自助报表门户", hours: 4, status: "待开始" },

  { person: "姜曼", date: "2026-06-14", timeSlot: "上午", taskId: "TASK-846", task: "业务指标口径配置页面", projectId: "PRJ-116", project: "业务指标自助报表门户", hours: 4, status: "进行中" },

  { person: "韩冰", date: "2026-06-07", timeSlot: "全天", taskId: "TASK-883", task: "GPU 存储网络压测", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 8, status: "进行中" },
  { person: "韩冰", date: "2026-06-18", timeSlot: "上午", taskId: "TASK-882", task: "GPU 作业调度平台", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "测试中" },
  { person: "韩冰", date: "2026-07-08", timeSlot: "下午", taskId: "TASK-881", task: "GPU 集群监控告警", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "暂停" },

  { person: "陆川", date: "2026-06-06", timeSlot: "全天", taskId: "TASK-842", task: "业务报表权限审计日志", projectId: "PRJ-116", project: "业务指标自助报表门户", hours: 8, status: "进行中" },
  { person: "陆川", date: "2026-06-13", timeSlot: "下午", taskId: "TASK-817", task: "GxP 文档审批流验证缺陷", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 3, status: "测试中" },

  { person: "罗清", date: "2026-06-04", timeSlot: "全天", taskId: "TASK-883", task: "GPU 存储网络压测", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 8, status: "进行中" },
  { person: "罗清", date: "2026-06-11", timeSlot: "下午", taskId: "TASK-882", task: "GPU 作业调度平台", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "测试中" },
  { person: "罗清", date: "2026-07-10", timeSlot: "上午", taskId: "TASK-883", task: "GPU 存储网络压测", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "进行中" }
];

export const resourceRequests: ResourceRequest[] = [
  { id: "RS-204", project: "SAP S/4HANA 财务供应链一体化", requester: "陈彦", need: "ABAP 开发 2 人", days: 18, status: "待审批" },
  { id: "RS-198", project: "算力中心 GPU 集群一期", requester: "陈彦", need: "网络工程师 1 人", days: 12, status: "已批准" },
  { id: "RS-187", project: "CRM 合规拜访改造", requester: "陈彦", need: "CRM 供应商技术评估", days: 6, status: "评估中" },
  { id: "RS-181", project: "业务指标自助报表门户", requester: "陈彦", need: "内部全栈开发 1 人、前端开发 1 人", days: 28, status: "已批准" },
  { id: "RS-172", project: "培训中心音视频设备更新", requester: "陈彦", need: "外部音视频集成商踏勘与报价", days: 8, status: "待审批" }
];

export const deliveryRequests: DeliveryRequest[] = [
  {
    id: "DR-CAPA-002",
    demandId: "REQ-STAGE-2",
    title: "质量偏差 CAPA 跟踪看板项目申请草案",
    productOwner: "陈彦",
    projectManager: "李书航",
    requestedMode: "内部实现",
    resourceNeed: "全栈开发 1 人、测试 1 人，预计 28 人天",
    supplierNeed: "无外部供应商",
    status: "方案确认中",
    submittedAt: "2026-05-26",
    decision: "产品经理已提交方案，方案确认后可预创建项目并关联需求。"
  },
  {
    id: "DR-SAP-041",
    demandId: "REQ-2026-041",
    projectId: "PRJ-126",
    title: "SAP 财务供应链升级项目申请",
    productOwner: "陈彦",
    projectManager: "李书航",
    requestedMode: "合作实现",
    resourceNeed: "ABAP 开发 2 人、接口开发 2 人、测试 2 人，窗口 2026-05-25 至 2026-06-18",
    supplierNeed: "明德 SAP 实施顾问负责蓝图、FI/MM 配置和 ABAP 增强",
    status: "项目进行",
    submittedAt: "2026-05-25",
    decision: "产品经理已完成方案和资源测算，等待唯一项目经理判断资源并启动项目。"
  },
  {
    id: "DR-CRM-038",
    demandId: "REQ-2026-038",
    projectId: "PRJ-124",
    title: "CRM 合规拜访改造项目申请",
    productOwner: "陈彦",
    projectManager: "李书航",
    requestedMode: "合作实现",
    resourceNeed: "移动端开发 1 人、接口开发 1 人、CRM 供应商技术评估 6 人天",
    supplierNeed: "星瀚 CRM 实施商提供合规审批流、移动端留痕和报价方案",
    status: "项目准备",
    submittedAt: "2026-05-24",
    decision: "产品经理已预创建项目，等待项目经理分配开发与外部供应商资源。"
  },
  {
    id: "DR-OPS-030",
    demandId: "REQ-2026-030",
    projectId: "PRJ-116",
    title: "业务指标自助报表门户项目申请",
    productOwner: "陈彦",
    projectManager: "李书航",
    requestedMode: "内部实现",
    resourceNeed: "全栈开发 1 人、前端开发 1 人、接口开发 1 人，共 28 人天",
    supplierNeed: "无外部供应商",
    status: "项目进行",
    submittedAt: "2026-05-18",
    decision: "已转为内部实现项目，项目经理完成开发指派。"
  },
  {
    id: "DR-GPU-019",
    demandId: "REQ-2026-019",
    projectId: "PRJ-131",
    title: "算力中心 GPU 集群一期项目预创建",
    productOwner: "陈彦",
    projectManager: "李书航",
    requestedMode: "合作实现",
    resourceNeed: "基础架构 2 人、平台开发 1 人、网络工程师 1 人，共 62 人天",
    supplierNeed: "云算科技负责 GPU 服务器、存储网络、机房上架和硬件维保，外采 36 人天",
    status: "项目进行",
    submittedAt: "2026-05-16",
    decision: "项目经理已分配内部平台开发和外部供应商资源，开发与供应商按压测里程碑推进。"
  },
  {
    id: "DR-GXP-033",
    demandId: "REQ-2026-033",
    projectId: "PRJ-119",
    title: "GxP 电子文档与验证平台项目预创建",
    productOwner: "陈彦",
    projectManager: "李书航",
    requestedMode: "合作实现",
    resourceNeed: "全栈开发 1 人、前端开发 1 人、验证测试 1 人，共 52 人天",
    supplierNeed: "信合 GxP 验证咨询提供验证策略、脚本和验证包复核，外采 20 人天",
    status: "项目完成",
    submittedAt: "2026-05-10",
    decision: "项目交付已完成，等待需求方完成最终评分。"
  },
  {
    id: "DR-LIMS-026",
    demandId: "REQ-2026-026",
    projectId: "PRJ-108",
    title: "LIMS 实验室系统升级项目预创建",
    productOwner: "陈彦",
    projectManager: "李书航",
    requestedMode: "合作实现",
    resourceNeed: "内部验证测试 1 人，共 18 人天",
    supplierNeed: "LIMS 供应商负责系统升级、样本流程配置和接口适配，外采 36 人天",
    status: "项目结束",
    submittedAt: "2026-04-18",
    decision: "需求方已完成评分，项目结束并进入运维观察。"
  },
  {
    id: "DR-AV-014",
    demandId: "REQ-2026-014",
    projectId: "PRJ-097",
    title: "培训中心音视频设备更新项目申请",
    productOwner: "陈彦",
    projectManager: "李书航",
    requestedMode: "外部供应商",
    resourceNeed: "IT 项目经理治理 8 人天，业务部门预留验收 6 人天",
    supplierNeed: "远见智能会议集成商完成踏勘、设备清单、施工和现场培训",
    status: "项目启动",
    submittedAt: "2026-05-25",
    decision: "产品经理确认纯外部供应商实施，等项目启动并安排踏勘。"
  }
];

function workflowNodes(
  current: WorkflowStageId,
  owners: { requester: string; product: string; pm: string; developers: string; reviewer?: string },
  abandoned = false
) {
  const demandOrder: WorkflowStageId[] = ["demandReview", "solutionConfirm"];
  const projectOrder: WorkflowStageId[] = ["projectPrepare", "projectStart", "projectExecution", "projectComplete", "projectEnded"];
  const demandCurrent = demandCurrentForWorkflow(current);
  const projectCurrent = projectCurrentForWorkflow(current);
  const statusFor = (stageId: WorkflowStageId, order: WorkflowStageId[], currentStage?: WorkflowStageId) => {
    if (!currentStage) return "待开始" as const;
    const index = order.indexOf(stageId);
    const currentIndex = order.indexOf(currentStage);
    if (abandoned && stageId === currentStage) return "风险" as const;
    if (index < currentIndex) return "已完成" as const;
    if (index === currentIndex) return stageId === "projectEnded" ? "已完成" as const : "进行中" as const;
    return "待开始" as const;
  };
  return [
    {
      id: "demandReview",
      stageId: "demandReview" as const,
      stageNo: 1,
      name: "需求评审",
      lane: "产品经理" as const,
      owner: owners.product,
      status: statusFor("demandReview", demandOrder, demandCurrent),
      deliverable: "技术路线、实现方式判断",
      completion: "产品经理打回或发起方案确认",
      description: "产品经理评审需求是否可做，判断技术路线以及内部实现、外部供应商或合作实现方式。",
      configurable: true
    },
    {
      id: "solutionConfirm",
      stageId: "solutionConfirm" as const,
      stageNo: 2,
      name: "方案确认",
      lane: "需求方" as const,
      owner: owners.reviewer ?? owners.requester,
      status: statusFor("solutionConfirm", demandOrder, demandCurrent),
      deliverable: "技术路线确认意见、实现方式确认",
      completion: "需求线结束，等待产品经理预创建项目",
      description: "需求方确认技术路线和实现方式；需求线到此结束，后续由产品经理预创建并关联项目，资源与预算进入项目阶段处理。",
      configurable: false
    },
    {
      id: "projectPrepare",
      stageId: "projectPrepare" as const,
      stageNo: 1,
      name: "项目准备",
      lane: "产品经理" as const,
      owner: owners.product,
      status: statusFor("projectPrepare", projectOrder, projectCurrent),
      deliverable: "关联需求、内部人天、外部供应商需求、供应商人天",
      completion: "产品经理完成项目预创建",
      description: "产品经理把已确认方案的需求预创建为项目，填写内部资源需求、是否外采、外采人天和供应商角色。",
      configurable: true
    },
    {
      id: "projectStart",
      stageId: "projectStart" as const,
      stageNo: 2,
      name: "项目启动",
      lane: "项目经理" as const,
      owner: owners.pm,
      status: statusFor("projectStart", projectOrder, projectCurrent),
      deliverable: "已分配开发、已分配外部供应商、资源启动窗口",
      completion: "项目经理填入资源后进入项目启动",
      description: "项目经理必须把内部开发和外部供应商资源填入后，才能确认进入项目启动。",
      configurable: true
    },
    {
      id: "projectExecution",
      stageId: "projectExecution" as const,
      stageNo: 3,
      name: "项目进行",
      lane: "开发" as const,
      owner: owners.developers,
      status: statusFor("projectExecution", projectOrder, projectCurrent),
      deliverable: "开发指派、子任务、估时、工时、进度",
      completion: "到 DDL 或产品经理确认项目完成",
      description: "产品经理填写项目启动结束时间后进入；开发和外部供应商拆分任务、估时排期、登记工时、汇报进度并完成任务。",
      configurable: true
    },
    {
      id: "projectComplete",
      stageId: "projectComplete" as const,
      stageNo: 4,
      name: "项目完成",
      lane: "需求方" as const,
      owner: owners.reviewer ?? owners.requester,
      status: statusFor("projectComplete", projectOrder, projectCurrent),
      deliverable: "项目完成说明、验收材料、需求方评分入口",
      completion: "需求方完成验收评分",
      description: "项目到 DDL 或产品经理点击后进入项目完成，等待需求方验收并打分。",
      configurable: true
    },
    {
      id: "projectEnded",
      stageId: "projectEnded" as const,
      stageNo: 5,
      name: "项目结束",
      lane: "需求方" as const,
      owner: owners.pm,
      status: statusFor("projectEnded", projectOrder, projectCurrent),
      deliverable: "项目关闭记录、评分归档",
      completion: "需求方完成评价后关闭",
      description: "需求方评分完成后，项目线关闭并归档。",
      configurable: false
    }
  ];
}

function demandCurrentForWorkflow(current: WorkflowStageId): WorkflowStageId {
  if (current === "projectPrepare" || current === "projectStart" || current === "projectExecution" || current === "projectComplete" || current === "projectEnded") return "solutionConfirm";
  return current;
}

function projectCurrentForWorkflow(current: WorkflowStageId): WorkflowStageId | undefined {
  if (current === "projectPrepare" || current === "projectStart" || current === "projectExecution" || current === "projectComplete" || current === "projectEnded") return current;
  return undefined;
}

export const demandProjectFlows: DemandProjectFlow[] = [
  {
    id: "FLOW-REVIEW-001",
    demandId: "REQ-REVIEW-001",
    projectId: "待项目关联",
    title: "销售样品申请移动化工作流",
    mode: "内部实现",
    currentNodeId: "demandReview",
    currentDemandNodeId: "demandReview",
    resourceRequest: {
      requester: "沈岚",
      need: "需求已创建并进入产品经理评审，暂未形成项目资源申请",
      days: 0,
      window: "待产品经理完成需求评审",
      status: "需求评审"
    },
    nodes: workflowNodes("demandReview", { requester: "沈岚", product: "陈彦", pm: "李书航", developers: "待指派", reviewer: "周宁" }),
    assignments: []
  },
  {
    id: "FLOW-SAP-041",
    demandId: "REQ-2026-041",
    projectId: "PRJ-126",
    title: "SAP 财务供应链升级工作流",
    mode: "合作实现",
    currentNodeId: "projectExecution",
    currentDemandNodeId: "solutionConfirm",
    currentProjectNodeId: "projectExecution",
    resourceRequest: {
      requester: "陈彦",
      need: "ABAP 开发 2 人、接口开发 2 人、测试 2 人",
      days: 18,
      window: "2026-05-25 至 2026-06-18",
      status: "项目进行"
    },
    nodes: workflowNodes("projectExecution", { requester: "沈岚", product: "陈彦", pm: "李书航", developers: "吴承 / 姜曼", reviewer: "周宁" }),
    assignments: [
      { id: "ASSIGN-SAP-01", role: "接口开发", person: "吴承", dateRange: "2026-05-25 至 2026-06-03", hours: 22, workload: "本周 38/40h", conflict: "接近满负荷", sourceCalendarDates: ["2026-05-25", "2026-05-27", "2026-05-28", "2026-06-02"] },
      { id: "ASSIGN-SAP-02", role: "前端开发", person: "姜曼", dateRange: "2026-05-28 至 2026-06-04", hours: 12, workload: "本周 36/40h", conflict: "可承接", sourceCalendarDates: ["2026-05-28", "2026-06-04"] }
    ]
  },
  {
    id: "FLOW-CRM-038",
    demandId: "REQ-2026-038",
    projectId: "PRJ-124",
    title: "CRM 合规拜访改造工作流",
    mode: "合作实现",
    currentNodeId: "projectPrepare",
    currentDemandNodeId: "solutionConfirm",
    currentProjectNodeId: "projectPrepare",
    resourceRequest: {
      requester: "陈彦",
      need: "CRM 供应商技术评估、移动端开发 1 人、接口开发 1 人",
      days: 6,
      window: "2026-05-25 至 2026-07-05",
      status: "项目准备"
    },
    nodes: workflowNodes("projectPrepare", { requester: "周宁", product: "陈彦", pm: "李书航", developers: "待分配", reviewer: "周宁" }),
    assignments: []
  },
  {
    id: "FLOW-STAGE-2",
    demandId: "REQ-STAGE-2",
    projectId: "待项目关联",
    title: "质量偏差 CAPA 跟踪看板工作流",
    mode: "内部实现",
    currentNodeId: "solutionConfirm",
    currentDemandNodeId: "solutionConfirm",
    resourceRequest: {
      requester: "陈彦",
      need: "全栈开发 1 人、测试 1 人，预计 28 人天",
      days: 28,
      window: "2026-06-03 至 2026-07-12",
      status: "方案确认中"
    },
    nodes: workflowNodes("solutionConfirm", { requester: "沈岚", product: "陈彦", pm: "李书航", developers: "待指派", reviewer: "周宁" }),
    assignments: []
  },
  {
    id: "FLOW-OPS-030",
    demandId: "REQ-2026-030",
    projectId: "PRJ-116",
    title: "业务指标自助报表门户工作流",
    mode: "内部实现",
    currentNodeId: "projectExecution",
    currentDemandNodeId: "solutionConfirm",
    currentProjectNodeId: "projectExecution",
    resourceRequest: {
      requester: "陈彦",
      need: "内部全栈开发 1 人、前端开发 1 人、接口开发 1 人",
      days: 28,
      window: "2026-05-25 至 2026-06-14",
      status: "项目进行"
    },
    nodes: workflowNodes("projectExecution", { requester: "沈岚", product: "陈彦", pm: "李书航", developers: "姜曼 / 陆川 / 吴承", reviewer: "周宁" }),
    assignments: [
      { id: "ASSIGN-OPS-01", role: "前端开发", person: "姜曼", dateRange: "2026-05-29 至 2026-06-06", hours: 12, workload: "本周 36/40h", conflict: "可承接", sourceCalendarDates: ["2026-05-29"] },
      { id: "ASSIGN-OPS-02", role: "全栈开发", person: "陆川", dateRange: "2026-05-27 至 2026-06-07", hours: 12, workload: "本周 37/40h", conflict: "接近满负荷", sourceCalendarDates: ["2026-05-27", "2026-06-02"] },
      { id: "ASSIGN-OPS-03", role: "接口开发", person: "吴承", dateRange: "2026-06-03 至 2026-06-10", hours: 8, workload: "本周 38/40h", conflict: "接近满负荷", sourceCalendarDates: ["2026-06-03"] }
    ]
  },
  {
    id: "FLOW-GPU-019",
    demandId: "REQ-2026-019",
    projectId: "PRJ-131",
    title: "算力中心 GPU 集群一期工作流",
    mode: "合作实现",
    currentNodeId: "projectExecution",
    currentDemandNodeId: "solutionConfirm",
    currentProjectNodeId: "projectExecution",
    resourceRequest: {
      requester: "陈彦",
      need: "基础架构 2 人、平台开发 1 人、网络工程师 1 人、供应商实施 2 人",
      days: 98,
      window: "2026-05-18 至 2026-06-10",
      status: "项目进行"
    },
    nodes: workflowNodes("projectExecution", { requester: "高翔", product: "陈彦", pm: "李书航", developers: "韩冰 / 罗清 / 云算科技", reviewer: "周宁" }),
    assignments: [
      { id: "ASSIGN-GPU-01", role: "平台开发", person: "韩冰", dateRange: "2026-05-18 至 2026-06-02", hours: 24, workload: "本周 42/40h", conflict: "超负荷", sourceCalendarDates: ["2026-05-18", "2026-05-25", "2026-05-28"] },
      { id: "ASSIGN-GPU-02", role: "AI 平台工程师", person: "罗清", dateRange: "2026-05-18 至 2026-06-06", hours: 18, workload: "本周 38/40h", conflict: "接近满负荷", sourceCalendarDates: ["2026-05-20", "2026-05-28"] },
      { id: "ASSIGN-GPU-03", role: "外部硬件实施", person: "云算科技", dateRange: "2026-05-18 至 2026-06-10", hours: 36, workload: "供应商排期", conflict: "等待第二批设备", sourceCalendarDates: ["2026-05-18", "2026-05-29"] }
    ]
  },
  {
    id: "FLOW-AV-014",
    demandId: "REQ-2026-014",
    projectId: "PRJ-097",
    title: "培训中心音视频设备更新工作流",
    mode: "外部供应商",
    currentNodeId: "projectStart",
    currentDemandNodeId: "solutionConfirm",
    currentProjectNodeId: "projectStart",
    resourceRequest: {
      requester: "陈彦",
      need: "外部音视频集成商踏勘与报价",
      days: 8,
      window: "2026-05-29 至 2026-07-20",
      status: "项目启动"
    },
    nodes: workflowNodes("projectStart", { requester: "周宁", product: "陈彦", pm: "李书航", developers: "远见智能实施", reviewer: "周宁" }),
    assignments: [
      { id: "ASSIGN-AV-01", role: "外部实施", person: "远见智能实施", dateRange: "2026-05-29 至 2026-07-20", hours: 42, workload: "外部供应商排期", conflict: "等待场地窗口", sourceCalendarDates: ["2026-05-29"] },
      { id: "ASSIGN-AV-02", role: "项目经理", person: "李书航", dateRange: "2026-05-29 至 2026-06-06", hours: 8, workload: "合同与风险治理", conflict: "无冲突", sourceCalendarDates: ["2026-05-29"] }
    ]
  },
  {
    id: "FLOW-GXP-033",
    demandId: "REQ-2026-033",
    projectId: "PRJ-119",
    title: "GxP 电子文档与验证平台工作流",
    mode: "合作实现",
    currentNodeId: "projectComplete",
    currentDemandNodeId: "solutionConfirm",
    currentProjectNodeId: "projectComplete",
    resourceRequest: {
      requester: "陈彦",
      need: "全栈开发 1 人、验证工程师 1 人、测试 1 人",
      days: 72,
      window: "2026-05-20 至 2026-05-29",
      status: "项目完成"
    },
    nodes: workflowNodes("projectComplete", { requester: "沈岚", product: "陈彦", pm: "李书航", developers: "陆川 / 姜曼", reviewer: "周宁" }),
    assignments: [
      { id: "ASSIGN-GXP-01", role: "全栈开发", person: "陆川", dateRange: "2026-05-20 至 2026-05-29", hours: 12, workload: "验收缺陷处理", conflict: "可承接", sourceCalendarDates: ["2026-05-23", "2026-05-25"] },
      { id: "ASSIGN-GXP-02", role: "前端开发", person: "姜曼", dateRange: "2026-05-20 至 2026-05-31", hours: 8, workload: "验收报表补充", conflict: "可承接", sourceCalendarDates: ["2026-05-25"] }
    ]
  },
  {
    id: "FLOW-LIMS-026",
    demandId: "REQ-2026-026",
    projectId: "PRJ-108",
    title: "LIMS 实验室系统升级工作流",
    mode: "合作实现",
    currentNodeId: "projectEnded",
    currentDemandNodeId: "solutionConfirm",
    currentProjectNodeId: "projectEnded",
    resourceRequest: {
      requester: "陈彦",
      need: "供应商实施 3 人、内部验证测试 1 人",
      days: 36,
      window: "2026-04-28 至 2026-05-12",
      status: "项目结束"
    },
    nodes: workflowNodes("projectEnded", { requester: "沈岚", product: "陈彦", pm: "李书航", developers: "供应商实施 / 陆川", reviewer: "周宁" }),
    assignments: [
      { id: "ASSIGN-LIMS-01", role: "外部实施", person: "供应商实施", dateRange: "2026-04-28 至 2026-05-12", hours: 36, workload: "已完成", conflict: "无冲突", sourceCalendarDates: ["2026-05-03", "2026-05-05"] },
      { id: "ASSIGN-LIMS-02", role: "全栈开发", person: "陆川", dateRange: "2026-05-05 至 2026-05-08", hours: 11, workload: "已完成", conflict: "无冲突", sourceCalendarDates: ["2026-05-08"] }
    ]
  }
];

export const supplierBudgets: SupplierBudget[] = [
  { supplier: "明德 SAP 实施顾问", project: "SAP S/4HANA 财务供应链一体化", manager: "李书航", contract: 1880000, used: 936000, payment: "二期款待付", deliveryStatus: "FI/MM 配置项目进行", riskStatus: "中" },
  { supplier: "星瀚 CRM 实施商", project: "CRM 合规拜访改造", manager: "李书航", contract: 720000, used: 160000, payment: "商务评审", deliveryStatus: "方案与报价评审", riskStatus: "低" },
  { supplier: "云算科技", project: "算力中心 GPU 集群一期", manager: "李书航", contract: 3260000, used: 2480000, payment: "硬件到货验收中", deliveryStatus: "第二批 GPU 待到货", riskStatus: "高" },
  { supplier: "信合 GxP 验证咨询", project: "GxP 电子文档与验证平台", manager: "李书航", contract: 220000, used: 126000, payment: "验证包评审中", deliveryStatus: "验证包复核", riskStatus: "低" },
  { supplier: "远见智能会议集成商", project: "培训中心音视频设备更新", manager: "李书航", contract: 450000, used: 30000, payment: "踏勘费待确认", deliveryStatus: "现场踏勘预约中", riskStatus: "低" }
];

export const projectInvestmentBreakdowns: ProjectInvestmentBreakdown[] = [
  {
    project: "SAP S/4HANA 财务供应链一体化",
    internalDays: 46,
    supplierCost: 1880000,
    supplierRole: "SAP 顾问负责蓝图、FI/MM 配置、ABAP 增强",
    businessRole: "业务部门负责主数据确认、月结 UAT",
    status: "开发中"
  },
  {
    project: "CRM 合规拜访改造",
    internalDays: 32,
    supplierCost: 720000,
    supplierRole: "CRM 实施商负责移动端定制和合规审批适配",
    businessRole: "业务部门确认拜访合规规则",
    status: "分析中"
  },
  {
    project: "GxP 电子文档与验证平台",
    internalDays: 52,
    supplierCost: 220000,
    supplierRole: "GxP 验证咨询负责验证策略和验证包复核",
    businessRole: "业务部门负责 SOP 场景和验收评分",
    status: "验收中"
  },
  {
    project: "业务指标自助报表门户",
    internalDays: 58,
    supplierCost: 0,
    supplierRole: "无外部供应商，IT部内部实现",
    businessRole: "业务部门确认指标口径、样例数据和验收脚本",
    status: "开发中"
  },
  {
    project: "LIMS 实验室系统升级",
    internalDays: 18,
    supplierCost: 860000,
    supplierRole: "LIMS 供应商负责产品升级和仪器接口适配",
    businessRole: "业务部门负责实验室场景验证",
    status: "项目结束"
  },
  {
    project: "算力中心 GPU 集群一期",
    internalDays: 62,
    supplierCost: 3260000,
    supplierRole: "云算科技负责 GPU 设备、存储网络和硬件维保",
    businessRole: "业务部门负责 AI 作业压测和验收标准",
    status: "测试中"
  },
  {
    project: "培训中心音视频设备更新",
    internalDays: 8,
    supplierCost: 450000,
    supplierRole: "远见智能会议集成商负责设备采购、布线、调试和现场培训",
    businessRole: "业务部门确认培训场景、使用效果和验收标准",
    status: "待评审"
  }
];

export const reportData = {
  scores: [
    { label: "1月", value: 4.1 },
    { label: "2月", value: 4.3 },
    { label: "3月", value: 4.2 },
    { label: "4月", value: 4.4 },
    { label: "5月", value: 4.5 }
  ],
  completion: [
    { label: "IT部", value: 86 },
    { label: "IT部", value: 84 },
    { label: "业务部门", value: 88 },
    { label: "外部供应商", value: 81 },
    { label: "管理层", value: 93 }
  ],
  budgetDeviation: [
    { label: "算力中心", value: 19 },
    { label: "SAP升级", value: 8 },
    { label: "GxP文档", value: -3 },
    { label: "LIMS升级", value: 2 },
    { label: "业务报表", value: -6 },
    { label: "培训设备", value: 4 }
  ],
  risk: [
    { label: "高", value: 3 },
    { label: "中", value: 7 },
    { label: "低", value: 32 }
  ]
};

export const users: User[] = [
  { id: "u-admin", name: "系统管理员", department: "无部门", roleId: "admin", role: "全局管理员", status: "启用", scope: "全量组织、角色、菜单、通知、集成配置", dataScope: "全局" },
  { id: "u-exec-01", name: "林总", departmentId: "management", department: "管理层", roleId: "executive", role: "高管", status: "启用", scope: "全公司 IT 项目、预算、资源和绩效汇总", dataScope: "全局" },
  { id: "u-exec-02", name: "许敏", departmentId: "management", department: "管理层", roleId: "executive", role: "管理层负责人", status: "启用", scope: "全公司项目组合、预算例外和绩效复盘", dataScope: "全局" },
  { id: "u-it-01", name: "马骏", departmentId: "it", department: "IT部", roleId: "developer", role: "项目助理", status: "启用", scope: "供应商资料、合同台账和会议纪要协助", dataScope: "本人" },
  { id: "u-it-02", name: "李书航", departmentId: "it", department: "IT部", roleId: "pm", role: "项目经理", organizationTitle: "IT负责人", isDepartmentOwner: true, status: "启用", scope: "IT部项目治理、资源协调、供应商绩效", dataScope: "本部门" },
  { id: "u-it-03", name: "孙昊", departmentId: "it", department: "IT部", roleId: "developer", role: "基础架构", status: "启用", scope: "硬件、机房和算力中心技术实施", dataScope: "本人" },
  { id: "u-it-04", name: "何嘉", departmentId: "it", department: "IT部", roleId: "developer", role: "供应商协调", status: "启用", scope: "供应商实施资料、合同预算和上线归档协助", dataScope: "本人" },
  { id: "u-rd-01", name: "陈彦", departmentId: "it", department: "IT部", roleId: "product", role: "产品经理", status: "启用", scope: "本人承接需求及关联项目", dataScope: "本人" },
  { id: "u-rd-04", name: "赵敏", departmentId: "it", department: "IT部", roleId: "product", role: "产品经理", status: "启用", scope: "本人承接 CRM、合规和供应商评估相关需求", dataScope: "本人" },
  { id: "u-rd-05", name: "王骁", departmentId: "it", department: "IT部", roleId: "product", role: "产品经理", status: "启用", scope: "本人承接 GxP、验证和验收组织相关需求", dataScope: "本人" },
  { id: "u-rd-02", name: "吴承", departmentId: "it", department: "IT部", roleId: "developer", role: "开发", status: "启用", scope: "本人任务、日/周/月排期和工时填报", dataScope: "本人" },
  { id: "u-rd-03", name: "许知远", departmentId: "it", department: "IT部", roleId: "developer", role: "开发", status: "启用", scope: "IT部开发任务、技术联调和交付验收支持", dataScope: "本人" },
  { id: "u-ops-01", name: "沈岚", departmentId: "ops", department: "业务部门", roleId: "requester", role: "需求方", status: "启用", scope: "本人提交需求、进度查看和验收评分", dataScope: "本人" },
  { id: "u-ops-02", name: "周宁", departmentId: "ops", department: "业务部门", roleId: "requester", role: "需求方负责人", organizationTitle: "业务部门负责人", isDepartmentOwner: true, status: "启用", scope: "业务部门全部需求、优先级、验收评分和投入占用", dataScope: "本部门" },
  { id: "u-ops-03", name: "高翔", departmentId: "ops", department: "业务部门", roleId: "requester", role: "需求方", status: "启用", scope: "本人算力和数据分析相关需求", dataScope: "本人" }
];

export const departments: Department[] = [
  { id: "it", name: "IT部", ownerUserIds: ["u-it-02"], memberUserIds: ["u-it-01", "u-it-02", "u-it-03", "u-it-04", "u-rd-01", "u-rd-02", "u-rd-03", "u-rd-04", "u-rd-05"], scope: "产品方案、项目治理、内部开发、资源池、供应商交付、合同预算和技术验收支持", status: "启用" },
  { id: "ops", name: "业务部门", ownerUserIds: ["u-ops-02"], memberUserIds: ["u-ops-01", "u-ops-02", "u-ops-03"], scope: "业务需求提交、优先级管理、验收评分和部门投入查看", status: "启用" },
  { id: "management", name: "管理层", ownerUserIds: ["u-exec-02"], memberUserIds: ["u-exec-01", "u-exec-02"], scope: "全公司 IT 项目组合、资源预算和绩效汇总", status: "启用" }
];

export const permissionRows: PermissionRow[] = [
  { module: "需求管理", view: true, create: true, edit: true, approve: true, export: true, scope: "产品经理 / 业务部门" },
  { module: "项目管理", view: true, create: true, edit: true, approve: true, export: true, scope: "IT 项目池 / 全公司汇总" },
  { module: "任务与工时", view: true, create: true, edit: true, approve: false, export: false, scope: "IT部本人任务" },
  { module: "资源与预算", view: true, create: false, edit: true, approve: true, export: true, scope: "项目经理 / 部门投入查看" },
  { module: "权限管理", view: true, create: true, edit: true, approve: true, export: true, scope: "仅管理员系统设置" },
  { module: "系统设置", view: true, create: true, edit: true, approve: true, export: true, scope: "管理员全量维护" }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: "N-520",
    title: "你被分配为 SAP 财务供应链升级项目负责人",
    content: "系统将 SAP S/4HANA 财务供应链一体化分配给唯一项目经理李书航负责项目治理、资源协调和供应商交付。",
    channel: "企业微信",
    type: "工作分配",
    time: "5分钟前",
    unread: true,
    level: "blue",
    targetRoles: ["pm"],
    targetUserNames: ["李书航"],
    sourceUserName: "李书航",
    relatedType: "project",
    relatedId: "PRJ-126"
  },
  {
    id: "N-516",
    title: "CRM 合规拜访改造需求已分配承接",
    content: "李书航将 CRM 合规拜访改造分配给陈彦进行需求评审、实现方式判断和供应商方案评审。",
    channel: "站内信",
    type: "工作分配",
    time: "18分钟前",
    unread: true,
    level: "violet",
    targetRoles: ["product"],
    targetUserNames: ["陈彦"],
    sourceUserName: "李书航",
    relatedType: "demand",
    relatedId: "REQ-2026-038"
  },
  {
    id: "N-501",
    title: "SAP S/4HANA 财务供应链升级进入开发阶段",
    content: "外部顾问资源已确认，主数据迁移任务已分配给吴承。",
    channel: "企业微信",
    type: "需求状态变更",
    time: "10分钟前",
    unread: true,
    level: "blue",
    targetRoles: ["pm", "product"]
  },
  {
    id: "N-497",
    title: "算力中心 GPU 集群存在延期风险",
    content: "第二批 GPU 到货时间未冻结，请项目经理补充风险应对。",
    channel: "站内信",
    type: "逾期预警",
    time: "35分钟前",
    unread: true,
    level: "red",
    targetRoles: ["executive", "pm", "businessOwner", "requester"]
  },
  {
    id: "N-488",
    title: "GxP 电子文档与验证平台待需求方验收",
    content: "需求方可进入验收评分流程。",
    channel: "企业微信",
    type: "验收提醒",
    time: "2小时前",
    unread: false,
    level: "green",
    targetRoles: ["product", "businessOwner", "pm", "requester"]
  },
  {
    id: "N-481",
    title: "业务指标自助报表门户内部资源已批准",
    content: "陆川、姜曼和吴承已进入本周排期，项目不涉及外部供应商合同。",
    channel: "站内信",
    type: "资源审批",
    time: "4小时前",
    unread: false,
    level: "cyan",
    targetRoles: ["product", "developer", "businessOwner"]
  },
  {
    id: "N-479",
    title: "培训中心音视频设备更新待供应商踏勘",
    content: "远见智能会议集成商已预约现场踏勘，项目经理需确认培训空档期。",
    channel: "企业微信",
    type: "供应商交付",
    time: "5小时前",
    unread: true,
    level: "orange",
    targetRoles: ["pm", "businessOwner", "requester"]
  },
  {
    id: "N-472",
    title: "LIMS 实验室系统升级上线里程碑完成",
    content: "项目已完成验证复盘，交付评分 4.8。",
    channel: "站内信",
    type: "里程碑达成",
    time: "昨天",
    unread: false,
    level: "violet",
    targetRoles: ["executive", "pm", "product", "businessOwner", "requester"]
  }
];

export const notificationCatalog: NotificationCatalogItem[] = [
  { id: "demand.new", domain: "需求", event: "新需求提交", description: "需求方提交新的 IT 需求，等待需求方负责人确认范围和优先级。", priority: "中", channels: ["站内信"], configurable: true },
  { id: "work.assigned", domain: "任务", event: "工作分配", description: "部门负责人将需求、项目或任务分配给具体处理人。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "demand.accepted", domain: "需求", event: "需求评审承接", description: "产品经理承接需求并进入需求评审和方案设计。", priority: "中", channels: ["站内信"], configurable: true },
  { id: "demand.scopeConfirm", domain: "需求", event: "方案确认待处理", description: "产品经理提交范围、实现方式、资源测算和验收标准，等待需求方确认方案。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "demand.priority", domain: "需求", event: "需求优先级调整", description: "部门负责人调整 P0/P1/P2/P3 优先级。", priority: "中", channels: ["站内信", "企业微信"], configurable: true },
  { id: "demand.acceptance", domain: "需求", event: "需求进入验收", description: "需求进入项目完成阶段，需要需求方确认评分。", priority: "高", channels: ["站内信", "企业微信"], configurable: true },
  { id: "delivery.submitted", domain: "项目", event: "项目申请提交", description: "产品经理提交项目申请给项目经理或 IT负责人。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "delivery.returned", domain: "项目", event: "项目申请退回", description: "项目经理退回项目申请，要求产品经理补充方案、资源或供应商信息。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "delivery.accepted", domain: "项目", event: "项目启动", description: "项目经理判断资源可用后启动项目，进入项目进行阶段。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "project.stage", domain: "项目", event: "项目阶段变更", description: "项目在项目启动、项目进行、项目完成、项目结束之间发生阶段变化。", priority: "中", channels: ["站内信"], configurable: true },
  { id: "project.record", domain: "项目", event: "项目记录修改", description: "项目经理维护里程碑、预算备注、风险原因或应对措施。", priority: "中", channels: ["站内信"], configurable: true },
  { id: "project.progress", domain: "项目", event: "项目阶段推进", description: "项目经理推进项目阶段并同步协作链路。", priority: "中", channels: ["站内信"], configurable: true },
  { id: "project.riskResponse", domain: "项目", event: "风险应对更新", description: "项目经理更新风险应对，高风险事项触达 IT负责人和高管。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "project.highRisk", domain: "项目", event: "高风险项目预警", description: "项目风险升级为高，或出现关键延期风险。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "project.milestoneDelay", domain: "项目", event: "关键里程碑延期", description: "关键里程碑未按计划完成，影响上线或验证窗口。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "task.assigned", domain: "任务", event: "新任务分配", description: "开发被分配新 task 或负责人发生变化。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "task.due", domain: "任务", event: "任务截止提醒", description: "任务临近截止或已经逾期。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "task.worklog", domain: "任务", event: "工时填报提醒", description: "开发未按期填报工时或工时异常。", priority: "中", channels: ["站内信", "企业微信"], configurable: true },
  { id: "resource.approval", domain: "资源", event: "资源排期待确认", description: "项目经理根据项目申请安排内部开发或供应商资源。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "resource.submitted", domain: "资源", event: "资源测算提交", description: "产品经理随项目申请提交资源测算。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "resource.approved", domain: "资源", event: "资源排期确认", description: "项目经理确认资源排期并通知产品经理和被安排人员。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "resource.overload", domain: "资源", event: "人员超负荷", description: "人员排期超过容量或连续高负载。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "budget.threshold", domain: "预算", event: "预算超阈值", description: "项目预算使用超过预警线或外采金额异常。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "acceptance.started", domain: "验收", event: "验收发起", description: "产品经理完成项目完成后，需求方需要确认结果并评分。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "acceptance.score", domain: "验收", event: "验收评分提交", description: "需求方完成交付评分和评价。", priority: "中", channels: ["站内信"], configurable: true },
  { id: "acceptance.lowScore", domain: "验收", event: "评分异常", description: "验收评分低于阈值，需要复盘或整改。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "permission.changed", domain: "权限", event: "权限变更", description: "角色、用户或数据范围权限发生变化。", priority: "中", channels: ["站内信"], configurable: true },
  { id: "integration.mcpError", domain: "集成", event: "MCP 调用异常", description: "MCP 接口或企业微信机器人调用失败。", priority: "中", channels: ["站内信", "机器人"], configurable: true }
];

export const roleNotificationSubscriptions: RoleNotificationSubscription[] = [
  {
    roleId: "admin",
    defaultOn: ["permission.changed", "integration.mcpError", "project.highRisk", "budget.threshold", "work.assigned"],
    optional: ["demand.new", "project.stage", "project.record", "task.worklog", "acceptance.score"],
    locked: ["permission.changed", "integration.mcpError"],
    note: "管理员默认接收权限、集成和系统级异常，也可查看全部角色通知。"
  },
  {
    roleId: "executive",
    defaultOn: ["project.highRisk", "project.milestoneDelay", "project.riskResponse", "budget.threshold", "acceptance.lowScore"],
    optional: ["project.stage", "project.progress", "acceptance.score", "integration.mcpError"],
    locked: ["project.highRisk", "project.riskResponse", "budget.threshold"],
    note: "管理层默认接收管理例外、预算和重大交付风险，不接收普通任务流。"
  },
  {
    roleId: "pm",
    defaultOn: ["work.assigned", "delivery.submitted", "delivery.returned", "delivery.accepted", "project.stage", "project.progress", "project.record", "project.highRisk", "project.milestoneDelay", "resource.approval", "resource.submitted", "resource.overload", "budget.threshold", "task.due", "permission.changed"],
    optional: ["demand.new", "resource.approved", "acceptance.score", "integration.mcpError"],
    locked: ["work.assigned", "delivery.submitted", "project.highRisk", "resource.approval", "budget.threshold"],
    note: "唯一项目经理同时是 IT负责人，关注启动判断、资源、风险、预算、里程碑和跨项目治理。"
  },
  {
    roleId: "product",
    defaultOn: ["work.assigned", "demand.new", "demand.accepted", "demand.scopeConfirm", "demand.acceptance", "delivery.returned", "delivery.accepted", "project.stage", "resource.approved", "acceptance.score"],
    optional: ["demand.priority", "project.highRisk", "delivery.submitted", "resource.submitted", "integration.mcpError"],
    locked: ["work.assigned", "demand.acceptance", "delivery.returned"],
    note: "产品经理关注需求评审、方案确认、资源申请、实现进度和项目完成。"
  },
  {
    roleId: "requester",
    defaultOn: ["work.assigned", "demand.acceptance", "acceptance.started", "project.stage", "acceptance.score"],
    optional: ["project.milestoneDelay", "demand.priority", "demand.accepted"],
    locked: ["demand.acceptance"],
    note: "需求方只接收本人需求的进度、方案确认、里程碑和评分提醒。"
  },
  {
    roleId: "businessOwner",
    defaultOn: ["work.assigned", "demand.priority", "demand.acceptance", "acceptance.started", "project.milestoneDelay", "resource.overload", "acceptance.lowScore"],
    optional: ["demand.new", "demand.accepted", "project.stage", "project.progress", "acceptance.score"],
    locked: ["project.milestoneDelay", "acceptance.lowScore"],
    note: "需求方负责人关注本部门全部需求、重要级别、延期、验收和投入异常。"
  },
  {
    roleId: "developer",
    defaultOn: ["work.assigned", "task.assigned", "task.due", "task.worklog", "resource.approved"],
    optional: ["project.stage", "project.progress", "integration.mcpError"],
    locked: ["work.assigned", "task.assigned", "task.due"],
    note: "开发只接收个人执行相关通知，例如任务、排期和工时。"
  }
];

export const projectRules: ProjectRule[] = [
  { stage: "项目准备", deliverable: "关联需求、内部人天、外部供应商需求、外采人天", owner: "产品经理", acceptance: "产品经理点击项目预创建" },
  { stage: "项目启动", deliverable: "已分配开发、供应商资源、启动窗口", owner: "项目经理", acceptance: "项目经理填入资源后确认启动" },
  { stage: "项目进行", deliverable: "任务拆解、工时记录、接口清单、供应商交付记录", owner: "开发 / 外部供应商", acceptance: "开发和供应商按周更新状态" },
  { stage: "项目完成", deliverable: "项目完成说明、验收材料、需求方评分入口", owner: "产品经理 / 需求方", acceptance: "DDL 到期或产品经理确认后等待评分" },
  { stage: "项目结束", deliverable: "需求方 1-5 分评分、评价、复盘记录", owner: "需求方", acceptance: "需求方提交评分后流程关闭" }
];

export const projectDependencies: ProjectDependency[] = [
  { project: "SAP S/4HANA 财务供应链一体化", relation: "依赖", target: "主数据治理专项", impact: "影响物料、供应商和成本中心迁移准确性", status: "跟进中" },
  { project: "算力中心 GPU 集群一期", relation: "阻塞", target: "GPU 设备到货与机房电力扩容", impact: "影响集群压测和正式验收", status: "高风险" },
  { project: "LIMS 实验室系统升级", relation: "父子项目", target: "ELN 电子实验记录二期", impact: "LIMS 样本和结果数据将作为 ELN 二期集成基础", status: "项目结束" },
  { project: "业务指标自助报表门户", relation: "依赖", target: "内部数据服务与权限中心", impact: "影响指标权限过滤、审计日志和报表导出准确性", status: "跟进中" },
  { project: "培训中心音视频设备更新", relation: "依赖", target: "培训中心场地空档期", impact: "影响供应商进场、布线施工和录播联动验收", status: "待确认" }
];

export const integrationEndpoints: IntegrationEndpoint[] = [
  { name: "项目查询", method: "GET", path: "/mcp/projects/{id}", capability: "按项目编号查询进度、预算、风险、验证状态和里程碑", status: "设计完成" },
  { name: "任务状态更新", method: "POST", path: "/mcp/tasks/{id}/status", capability: "通过机器人或外部系统更新任务状态", status: "待联调" },
  { name: "简易需求提交", method: "POST", path: "/mcp/demands", capability: "从企业微信机器人提交轻量 IT 需求", status: "待联调" },
  { name: "工时填报", method: "POST", path: "/mcp/worklogs", capability: "开发人员通过对话填报实际工时", status: "待联调" }
];

export const botMessages: BotMessage[] = [
  { speaker: "user", text: "查询 SAP S/4HANA 财务供应链一体化进度" },
  { speaker: "bot", text: "当前进度 58%，处于开发中。风险：主数据冻结窗口和外围接口排期依赖，产品经理推动计划确认，项目经理负责开发与测试资源指派。" },
  { speaker: "user", text: "把 TASK-901 更新为测试中" },
  { speaker: "bot", text: "已识别任务：SAP 主数据迁移校验。状态更新申请已记录，等待接口联调确认。" },
  { speaker: "user", text: "提交一个 GxP 培训记录查询优化需求" },
  { speaker: "bot", text: "已创建简易需求：GxP 培训记录查询优化，优先级 P2，已进入需求评审。" }
];

export const roleAccessPreviews: RoleAccessPreview[] = [
  {
    roleId: "admin",
    visibleModules: ["工作台", "需求管理", "项目管理", "任务与工时", "资源与预算", "绩效与报表", "系统设置"],
    actions: ["查看全量数据", "维护权限", "维护用户", "维护角色", "维护部门", "配置集成"],
    dataScope: "全量组织、角色、菜单、集成配置，以及全部 IT 项目数据"
  },
  {
    roleId: "executive",
    visibleModules: ["工作台"],
    actions: ["查看管理层工作台"],
    dataScope: "仅查看管理层工作台汇总；不进入业务操作页面，不推进流程"
  },
  {
    roleId: "pm",
    visibleModules: ["工作台", "项目管理", "任务与工时", "资源与预算", "绩效与报表"],
    actions: ["项目启动", "方案确认", "指派开发", "提交项目完成", "管理风险与预算"],
    dataScope: "唯一项目经理视角：查看全部项目申请、进行中项目、任务完成情况、资源预算和供应商风险"
  },
  {
    roleId: "product",
    visibleModules: ["工作台", "需求管理", "项目管理", "绩效与报表"],
    actions: ["需求评审", "打回需求", "发起方案确认", "项目完成", "退回项目进行"],
    dataScope: "本人承接或参与分析的需求、关联项目和产品绩效"
  },
  {
    roleId: "requester",
    visibleModules: ["工作台", "需求管理"],
    actions: ["提交需求", "确认方案", "查看关联项目和验收结果"],
    dataScope: "业务部门本人提交或需要本人确认、评分的需求"
  },
  {
    roleId: "businessOwner",
    visibleModules: ["工作台", "需求管理", "项目管理", "资源与预算", "绩效与报表"],
    actions: ["查看全部需求-项目", "调整需求重要级别", "查看资源投入", "确认验收评分", "关注延期异常"],
    dataScope: "业务部门全部需求、关联项目、验收评分，以及本部门提出需求对应的资源投入占用"
  },
  {
    roleId: "developer",
    visibleModules: ["工作台", "项目管理", "任务与工时"],
    actions: ["查看本人参与项目", "查看分配任务", "新增/拆分子任务", "维护任务状态", "填报工时", "汇报进度"],
    dataScope: "IT部开发人员本人参与项目、本人任务、日/周/月排期和工时填报"
  }
];
