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
  ProductWorkflowItem,
  ReportDatum,
  ResourceCalendarEntry,
  ResourcePerson,
  ResourceRequest,
  RoleAccessPreview,
  RoleNotificationSubscription,
  RoleOption,
  SupplierBudget,
  Task,
  User
} from "./types";

const deliveryStageOrder: ProjectStage[] = ["待受理", "已立项", "资源排期中", "实施中", "联调测试中", "验收支持中", "已上线", "已归档"];
const demandFlowOrder = ["需求提交", "业务确认与优先级", "产品指派与承接启动", "产品评估", "项目申请", "项目实施", "业务验收", "完成"];

function projectStageTrack(current: ProjectStage) {
  const currentIndex = deliveryStageOrder.indexOf(current);
  return deliveryStageOrder.map((name, index) => ({ name, done: index <= currentIndex }));
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
    label: "项目经理",
    description: "IT 项目治理、资源、预算、风险和供应商交付",
    userName: "马骏",
    department: "IT部",
    email: "majun@company.com",
    phone: "13800138002"
  },
  {
    id: "itOwner",
    label: "项目经理",
    description: "项目经理角色，因组织身份为 IT负责人，可查看 IT部整体项目治理、资源预算和供应商风险",
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
    description: "本人承接需求、分析、迭代与验收",
    userName: "陈彦",
    department: "研发部",
    email: "chenyan@company.com",
    phone: "13800138003"
  },
  {
    id: "requester",
    label: "运营",
    description: "本人需求提交、进度查看、验收评分",
    userName: "沈岚",
    department: "运营中心",
    email: "shenlan@company.com",
    phone: "13800138006"
  },
  {
    id: "opsOwner",
    label: "运营",
    description: "运营角色，因组织身份为部门负责人，可查看和介入运营中心全部需求",
    userName: "周宁",
    department: "运营中心",
    email: "zhouning@company.com",
    phone: "13800138004",
    organizationTitle: "运营中心负责人",
    isDepartmentOwner: true
  },
  {
    id: "developer",
    label: "开发",
    description: "本人任务、排期与工时",
    userName: "吴承",
    department: "研发部",
    email: "wucheng@company.com",
    phone: "13800138005"
  },
  {
    id: "rdOwner",
    label: "开发",
    description: "开发角色，因组织身份为研发负责人，可查看研发部任务、排期和交付支持",
    userName: "许知远",
    department: "研发部",
    email: "xuzhiyuan@company.com",
    phone: "13800138008",
    organizationTitle: "研发负责人",
    isDepartmentOwner: true
  }
];

export const navItems: NavItem[] = [
  { id: "dashboard", label: "项目驾驶舱", icon: Gauge },
  { id: "demands", label: "需求管理", icon: ClipboardList },
  { id: "workflow", label: "产品工作台", icon: ClipboardList },
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
    todos: ["复核部门负责人数据范围", "维护研发部开发人员账号", "检查企业微信机器人接口配置"]
  },
  executive: {
    title: "医药企业 IT 项目驾驶舱",
    subtitle: "聚焦 SAP、CRM、GxP、LIMS/MES/WMS、算力中心等关键 IT 项目",
    focusTitle: "高管关注事项",
    metrics: [
      { label: "项目总数", value: "42", delta: "本季度新增 7 个", tone: "blue" },
      { label: "进行中项目", value: "19", delta: "5 个进入验证阶段", tone: "cyan" },
      { label: "预算使用率", value: "71%", delta: "低于年度红线 9%", tone: "green" },
      { label: "平均交付评分", value: "4.5", delta: "较上月 +0.1", tone: "violet" }
    ],
    todos: ["审阅 SAP 蓝图变更预算", "确认 GxP 验证供应商评分", "关注算力中心高风险依赖"]
  },
  pm: {
    title: "项目经理工作台",
    subtitle: "跟踪资源分配、审批、预算、合规验证和项目风险",
    focusTitle: "项目经理待办",
    metrics: [
      { label: "待审批资源", value: "6", delta: "2 项 GxP 相关需求", tone: "orange" },
      { label: "高风险项目", value: "3", delta: "需本周处理", tone: "red" },
      { label: "可用人天", value: "164", delta: "SAP 与验证资源紧张", tone: "cyan" },
      { label: "预算预警", value: "4", delta: "外部 IT 供应商占 3 个", tone: "orange" }
    ],
    todos: ["审批 CRM 合规改造资源申请", "更新算力中心硬件到货风险", "补充 LIMS 验证计划"]
  },
  itOwner: {
    title: "IT负责人治理视图",
    subtitle: "从 IT部负责人身份查看项目组合、资源预算、供应商治理和高风险交付",
    focusTitle: "IT负责人关注事项",
    metrics: [
      { label: "IT部项目池", value: "24", delta: "含软件、硬件与软硬件协同", tone: "blue" },
      { label: "供应商风险", value: "5", delta: "2 项需合同跟进", tone: "orange" },
      { label: "资源缺口", value: "38 人天", delta: "接口与平台资源紧张", tone: "red" },
      { label: "预算使用率", value: "73%", delta: "算力中心占比最高", tone: "violet" }
    ],
    todos: ["复核 SAP 与算力中心资源冲突", "评估 CRM 供应商商务风险", "安排 IT部项目经理周会"]
  },
  product: {
    title: "产品经理需求推进台",
    subtitle: "承接医药业务 IT 需求，推进分析、供应商评估、验证和验收",
    focusTitle: "产品经理待办",
    metrics: [
      { label: "待分析需求", value: "8", delta: "P0/P1 共 4 个", tone: "orange" },
      { label: "本月验收", value: "6", delta: "2 个待业务评分", tone: "green" },
      { label: "迭代进行中", value: "5", delta: "平均进度 64%", tone: "blue" },
      { label: "供应商评估", value: "4", delta: "需技术与验证复核", tone: "violet" }
    ],
    todos: ["完成 CRM 拜访合规价值评估", "发起 GxP 文档系统验收", "确认算力中心 GPU 供应商报价"]
  },
  opsOwner: {
    title: "运营部门负责人视图",
    subtitle: "查看运营中心全部需求、优先级、验收评分和资源投入",
    focusTitle: "部门负责人关注事项",
    metrics: [
      { label: "团队需求", value: "17", delta: "本周新增 3 个", tone: "blue" },
      { label: "P0/P1 需求", value: "6", delta: "需排序确认", tone: "orange" },
      { label: "投入人天", value: "258", delta: "环比 +16%", tone: "cyan" },
      { label: "已验收评分", value: "4.6", delta: "满意度稳定", tone: "green" }
    ],
    todos: ["调整算力中心需求优先级", "确认 GxP 文档系统验收评分", "查看 SAP 外部顾问金额"]
  },
  requester: {
    title: "运营个人工作台",
    subtitle: "提交业务需求、查看本人需求进度、接收里程碑通知并完成验收评分",
    focusTitle: "我的需求待办",
    metrics: [
      { label: "我的需求", value: "5", delta: "2 个进行中", tone: "blue" },
      { label: "待补充信息", value: "1", delta: "CRM 规则待确认", tone: "orange" },
      { label: "待验收", value: "2", delta: "需提交评分", tone: "green" },
      { label: "平均评分", value: "4.6", delta: "本人验收记录", tone: "violet" }
    ],
    todos: ["补充 CRM 拜访合规规则", "提交 LIMS 升级验收评分", "查看算力中心压测里程碑"]
  },
  developer: {
    title: "开发任务工作台",
    subtitle: "查看个人任务、排期、状态与工时填报",
    focusTitle: "开发待办",
    metrics: [
      { label: "我的任务", value: "11", delta: "3 个今日截止", tone: "orange" },
      { label: "进行中", value: "5", delta: "2 个阻塞待确认", tone: "blue" },
      { label: "本周工时", value: "32h", delta: "已填报 80%", tone: "green" },
      { label: "验证缺陷", value: "5", delta: "高优先级 1 个", tone: "red" }
    ],
    todos: ["填报 LIMS 仪器接口联调工时", "更新 GPU 集群监控状态", "处理 GxP 验证缺陷"]
  },
  rdOwner: {
    title: "研发负责人交付视图",
    subtitle: "以研发负责人身份查看研发部任务、人员负载、技术联调和交付支持",
    focusTitle: "研发负责人关注事项",
    metrics: [
      { label: "研发部任务", value: "18", delta: "5 个本周到期", tone: "blue" },
      { label: "高负载人员", value: "3", delta: "吴承、陆川接近满负荷", tone: "orange" },
      { label: "技术联调", value: "7", delta: "SAP/CRM/GPU 相关", tone: "cyan" },
      { label: "延期风险", value: "2", delta: "需协调项目经理", tone: "red" }
    ],
    todos: ["协调运营指标门户开发排期", "复核 CRM 移动端联调风险", "查看研发部日/周/月排期"]
  }
};

export const stageDistribution: ReportDatum[] = [
  { label: "待业务确认", value: 8 },
  { label: "产品评估中", value: 6 },
  { label: "交付中", value: 13 },
  { label: "待验收", value: 6 },
  { label: "已完成", value: 9 }
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
    id: "REQ-2026-041",
    name: "SAP S/4HANA 财务供应链升级",
    requester: "沈岚",
    team: "运营中心",
    priority: "P0",
    status: "交付中",
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
      implementationReason: "SAP 核心模块升级由外部 SAP 实施顾问、IT部项目经理、研发部产品与开发、运营中心共同合作实现。",
      resourcePlan: "SAP 顾问 4 人、ABAP 开发 2 人、内部接口开发 2 人、测试 2 人，共 132 人天。",
      iteration: "SAP 核心平台 V2026.1"
    },
    priorityHistory: ["提交时 P1", "运营中心负责人调整为 P0：财务月结和供应链结算强依赖"],
    lifecycleSteps: demandLifecycle("交付实施")
  },
  {
    id: "REQ-2026-038",
    name: "CRM 医药代表拜访合规改造",
    requester: "周宁",
    team: "运营中心",
    priority: "P1",
    status: "产品评估中",
    handler: "赵敏 / 产品",
    progress: 26,
    targetDate: "2026-07-05",
    implementation: "合作实现",
    objective: "满足医药代表拜访记录、合规审批和医生互动留痕要求。",
    description: "改造 CRM 拜访计划、签到定位、资料推送、合规审批和异常预警能力。",
    milestones: ["需求已提交", "CRM 供应商方案对比中"],
    comments: ["需确认运营合规审批节点", "预算需运营中心负责人二次确认"],
    linkedProject: "CRM 合规拜访改造",
    score: undefined,
    analysis: {
      feasibility: "CRM 标准能力可扩展，合规审批流和移动端留痕需要供应商定制。",
      valueScore: 88,
      implementationReason: "CRM 产品由外部供应商定制，内部 IT 负责权限、主数据和接口校验，业务方负责合规规则确认。",
      resourcePlan: "产品经理 1 人、CRM 顾问 2 人、移动端开发 1 人、验证测试 1 人。",
      iteration: "CRM 合规 V3.2"
    },
    priorityHistory: ["提交时 P2", "运营中心负责人调整为 P1：合规审计前必须上线"],
    lifecycleSteps: demandLifecycle("产品评估")
  },
  {
    id: "REQ-2026-033",
    name: "GxP 合规文档管理系统",
    requester: "沈岚",
    team: "运营中心",
    priority: "P1",
    status: "待验收",
    handler: "王骁 / 产品",
    progress: 92,
    targetDate: "2026-05-29",
    implementation: "合作实现",
    objective: "建立 SOP、验证文档、培训记录和电子签名的统一管理入口。",
    description: "支持文档版本、审批流、电子签名、培训任务、审计追踪和归档检索。",
    milestones: ["开发完成", "验证测试通过", "运营中心待验收"],
    comments: ["验证环境已准备", "需运营中心负责人补充评分"],
    linkedProject: "GxP 电子文档与验证平台",
    score: undefined,
    analysis: {
      feasibility: "文档、流程和电子签名组件可复用，但需补齐审计追踪和验证包。",
      valueScore: 90,
      implementationReason: "核心功能内部实现，同时引入 GxP 验证咨询支持验证策略和文档包。",
      resourcePlan: "全栈开发 1 人、验证工程师 1 人、测试 1 人，共 72 人天。",
      iteration: "质量数字化 V1.5"
    },
    priorityHistory: ["提交时 P1", "保持 P1：年度 GMP 审计前验收"],
    lifecycleSteps: demandLifecycle("业务验收")
  },
  {
    id: "REQ-2026-030",
    name: "运营指标自助报表门户",
    requester: "沈岚",
    team: "运营中心",
    priority: "P1",
    status: "交付中",
    handler: "陈彦 / 产品",
    progress: 64,
    targetDate: "2026-06-14",
    implementation: "内部实现",
    objective: "让运营中心按区域、品类、渠道和活动批次自助查看指标，减少人工取数和邮件流转。",
    description: "建设运营指标口径配置、权限审计、可视化报表和数据导出能力，复用现有内部数据服务。",
    milestones: ["指标口径冻结", "权限模型开发中", "报表页面联调中"],
    comments: ["不引入外部供应商", "运营中心负责人确认首批 18 个核心指标"],
    linkedProject: "运营指标自助报表门户",
    score: undefined,
    analysis: {
      feasibility: "数据服务和权限中心已有基础能力，可由研发部内部开发完成。",
      valueScore: 89,
      implementationReason: "该需求涉及内部指标口径、数据权限和审计日志，研发部掌握现有平台能力，因此采用纯内部实现。",
      resourcePlan: "产品经理 1 人、全栈开发 1 人、前端开发 1 人、接口开发 1 人，共 58 人天。",
      iteration: "运营数据门户 V1.0"
    },
    priorityHistory: ["提交时 P2", "运营中心负责人调整为 P1：月度经营复盘依赖"],
    lifecycleSteps: demandLifecycle("交付实施")
  },
  {
    id: "REQ-2026-026",
    name: "LIMS 实验室信息管理系统升级",
    requester: "高翔",
    team: "运营中心",
    priority: "P2",
    status: "已完成",
    handler: "陈彦 / 产品",
    progress: 100,
    targetDate: "2026-05-12",
    implementation: "合作实现",
    objective: "提升实验样本、检测结果、仪器接口和审计追踪管理效率。",
    description: "升级 LIMS 样本流转、仪器数据采集、结果复核、电子签名和报表能力。",
    milestones: ["供应商交付", "验证完成", "运营中心验收完成"],
    comments: ["仪器接口稳定性达到预期", "运营中心评分较高"],
    linkedProject: "LIMS 实验室系统升级",
    score: 4.8,
    analysis: {
      feasibility: "供应商已有成熟 LIMS 升级方案，重点在仪器接口和历史数据迁移。",
      valueScore: 86,
      implementationReason: "LIMS 供应商负责产品升级，IT部负责供应商交付治理，研发部负责接口、安全和验证支持，运营中心负责业务验收。",
      resourcePlan: "产品经理 1 人、供应商实施 3 人、内部验证测试 1 人。",
      iteration: "研发信息化 V2.0"
    },
    acceptanceReview: {
      score: 4.8,
      comment: "样本流转和仪器数据采集效率明显提升，审计追踪满足验证要求。",
      conclusion: "通过验收",
      reviewer: "宋岚",
      date: "2026-05-12"
    },
    priorityHistory: ["提交时 P2", "保持 P2：研发效率专项"],
    lifecycleSteps: demandLifecycle("完成")
  },
  {
    id: "REQ-2026-019",
    name: "算力中心 GPU 集群建设",
    requester: "高翔",
    team: "运营中心",
    priority: "P2",
    status: "交付中",
    handler: "赵敏 / 产品",
    progress: 76,
    targetDate: "2026-06-10",
    implementation: "合作实现",
    objective: "为药物研发 AI 建模、分子筛选和医学影像分析提供统一算力底座。",
    description: "建设 GPU 集群、作业调度、存储网络、监控告警和资源配额管理。",
    milestones: ["机房方案冻结", "GPU 节点上架完成", "调度平台测试中"],
    comments: ["研发算法团队提出存储吞吐要求", "基础架构团队已排查网络瓶颈"],
    linkedProject: "算力中心 GPU 集群一期",
    score: undefined,
    analysis: {
      feasibility: "硬件到货和机房电力是主要约束，调度平台可基于现有容器平台扩展。",
      valueScore: 91,
      implementationReason: "算力平台由 IT部项目经理统筹，研发部负责平台联调和技术验收，硬件与机房实施由外部供应商配合，运营中心参与业务验收。",
      resourcePlan: "基础架构 2 人、平台开发 1 人、网络工程师 1 人、供应商实施 2 人，共 98 人天。",
      iteration: "研发算力平台 V1.0"
    },
    priorityHistory: ["提交时 P2", "保持 P2：GPU 到货前不升优先级"],
    lifecycleSteps: demandLifecycle("交付实施")
  },
  {
    id: "REQ-2026-014",
    name: "培训中心音视频设备更新",
    requester: "周宁",
    team: "运营中心",
    priority: "P3",
    status: "产品评估中",
    handler: "陈彦 / 产品",
    progress: 12,
    targetDate: "2026-07-20",
    implementation: "外部供应商",
    objective: "更新培训中心投屏、拾音、录播和远程会议设备，保障全国培训和合规宣导质量。",
    description: "由外部集成商完成音视频设备、弱电布线、录播主机和会议联动调试，内部仅做项目治理和验收。",
    milestones: ["现场踏勘预约", "供应商报价待确认"],
    comments: ["无需研发部开发投入", "项目经理负责供应商交付与合同风险"],
    linkedProject: "培训中心音视频设备更新",
    score: undefined,
    analysis: {
      feasibility: "需求以硬件集成和现场实施为主，内部没有必要自建实施队伍。",
      valueScore: 72,
      implementationReason: "该项目为纯外部供应商实施，IT部项目经理管理合同、交付、风险和验收，运营中心确认使用效果。",
      resourcePlan: "外部集成商 3 人现场实施，IT部项目经理治理 8 人天，运营中心验收 6 人天。",
      iteration: "培训中心硬件更新 V1.0"
    },
    priorityHistory: ["提交时 P3", "保持 P3：可与季度培训计划错峰实施"],
    lifecycleSteps: demandLifecycle("业务确认")
  }
];

export const projects: Project[] = [
  {
    id: "PRJ-126",
    name: "SAP S/4HANA 财务供应链一体化",
    demandId: "REQ-2026-041",
    owner: "马骏",
    supplierManager: "马骏",
    projectType: "软件项目",
    implementation: "合作实现",
    stage: "实施中",
    progress: 58,
    budget: 1880000,
    usedBudget: 936000,
    personDays: 132,
    risk: "中",
    riskReason: "主数据冻结窗口和外围接口排期存在依赖",
    riskResponse: "项目经理已设置主数据冻结日和接口联调日历，若 6 月 3 日前未完成则拆分非关键接口二期上线。",
    aiScore: {
      businessValue: 92,
      urgency: 86,
      feasibility: 78,
      total: 86,
      recommendation: "推荐立项",
      reasons: ["财务供应链一体化对月结效率和合规透明度价值高", "上线窗口与主数据冻结强相关，需重点管控接口排期", "外部顾问成熟但跨系统联调复杂度较高"]
    },
    stages: projectStageTrack("实施中"),
    milestones: [
      { name: "蓝图评审", date: "2026-05-12", status: "完成" },
      { name: "主数据迁移联调", date: "2026-06-03", status: "进行中" },
      { name: "财务供应链 UAT", date: "2026-06-18", status: "未开始" }
    ],
    resources: ["SAP 顾问 4 人", "ABAP 开发 2 人", "接口开发 2 人", "测试 2 人"],
    taskIds: ["TASK-901", "TASK-903", "TASK-904"],
    contributions: [
      { party: "研发部", type: "内部IT", responsibility: "外围接口、主数据校验、权限与环境管理", effort: "46 人天", cost: "内部成本", status: "开发中" },
      { party: "明德 SAP 实施顾问", type: "外部供应商", responsibility: "蓝图设计、FI/MM 模块配置、ABAP 增强", effort: "86 人天", cost: "188 万合同", status: "实施中" },
      { party: "运营中心", type: "业务方", responsibility: "成本中心、采购入库、月结场景 UAT", effort: "24 人天", cost: "业务投入", status: "参与中" }
    ]
  },
  {
    id: "PRJ-124",
    name: "CRM 合规拜访改造",
    demandId: "REQ-2026-038",
    owner: "马骏",
    supplierManager: "马骏",
    projectType: "软件项目",
    implementation: "合作实现",
    stage: "待受理",
    progress: 26,
    budget: 720000,
    usedBudget: 160000,
    personDays: 64,
    risk: "低",
    riskReason: "供应商报价和移动端合规留痕方案仍在评审",
    riskResponse: "产品经理组织供应商评分，项目经理同步准备商务评审和合同风险清单。",
    aiScore: {
      businessValue: 88,
      urgency: 82,
      feasibility: 74,
      total: 82,
      recommendation: "推荐立项",
      reasons: ["拜访合规留痕直接支撑审计要求和销售行为规范", "移动 H5 场景明确但供应商报价仍需冻结", "实现依赖 CRM 供应商和内部接口协作，需先完成方案评审"]
    },
    stages: projectStageTrack("待受理"),
    milestones: [
      { name: "合规规则确认", date: "2026-05-30", status: "进行中" },
      { name: "供应商方案定稿", date: "2026-06-08", status: "未开始" },
      { name: "移动端 UAT", date: "2026-07-05", status: "未开始" }
    ],
    resources: ["产品经理 1 人", "CRM 供应商 2 人", "移动端开发 1 人", "接口开发 1 人"],
    taskIds: ["TASK-902", "TASK-905", "TASK-906"],
    contributions: [
      { party: "研发部", type: "内部IT", responsibility: "医生主数据、权限接口和移动端联调支持", effort: "32 人天", cost: "内部成本", status: "分析中" },
      { party: "星瀚 CRM 实施商", type: "外部供应商", responsibility: "CRM 配置、合规审批流、拜访留痕和报价交付", effort: "32 人天", cost: "72 万合同", status: "方案评审" },
      { party: "运营中心", type: "业务方", responsibility: "拜访规则、医学审批节点和异常预警口径确认", effort: "14 人天", cost: "业务投入", status: "确认中" }
    ]
  },
  {
    id: "PRJ-119",
    name: "GxP 电子文档与验证平台",
    demandId: "REQ-2026-033",
    owner: "马骏",
    supplierManager: "马骏",
    projectType: "软件项目",
    implementation: "合作实现",
    stage: "验收支持中",
    progress: 92,
    budget: 620000,
    usedBudget: 548000,
    personDays: 72,
    risk: "低",
    riskReason: "待运营中心完成验收评分",
    riskResponse: "产品经理已发起运营中心验收邀请，项目经理准备验证包归档清单。",
    aiScore: {
      businessValue: 90,
      urgency: 80,
      feasibility: 88,
      total: 87,
      recommendation: "推荐立项",
      reasons: ["GxP 文档和审计追踪是合规基础能力", "验证咨询与内部开发分工清晰", "项目已进入验收支持，交付确定性高"]
    },
    stages: projectStageTrack("验收支持中"),
    milestones: [
      { name: "验证测试通过", date: "2026-05-20", status: "完成" },
      { name: "运营验收", date: "2026-05-29", status: "进行中" }
    ],
    resources: ["全栈开发 1 人", "验证工程师 1 人", "测试 1 人"],
    taskIds: ["TASK-818", "TASK-819", "TASK-817"],
    contributions: [
      { party: "研发部", type: "内部IT", responsibility: "文档版本、审批流、电子签名和审计追踪开发", effort: "52 人天", cost: "内部成本", status: "验收中" },
      { party: "信合 GxP 验证咨询", type: "外部供应商", responsibility: "验证策略、测试脚本、验证包复核", effort: "20 人天", cost: "22 万合同", status: "复核中" },
      { party: "运营中心", type: "业务方", responsibility: "SOP 场景确认、验证测试和验收评分", effort: "18 人天", cost: "业务投入", status: "待评分" }
    ]
  },
  {
    id: "PRJ-116",
    name: "运营指标自助报表门户",
    demandId: "REQ-2026-030",
    owner: "李书航",
    supplierManager: "无外部供应商",
    projectType: "软件项目",
    implementation: "内部实现",
    stage: "实施中",
    progress: 64,
    budget: 280000,
    usedBudget: 142000,
    personDays: 58,
    risk: "中",
    riskReason: "指标口径和部门数据权限需要运营中心负责人最终确认",
    riskResponse: "产品经理将口径冻结会提前到 5 月 31 日，开发先完成权限模型和审计日志底座。",
    aiScore: {
      businessValue: 84,
      urgency: 76,
      feasibility: 86,
      total: 82,
      recommendation: "推荐立项",
      reasons: ["自助报表可降低跨部门取数沟通成本", "纯内部实现不依赖外采合同，成本可控", "指标口径和行级权限需要先冻结，避免后期返工"]
    },
    stages: projectStageTrack("实施中"),
    milestones: [
      { name: "指标口径冻结", date: "2026-05-31", status: "进行中" },
      { name: "权限模型联调", date: "2026-06-07", status: "未开始" },
      { name: "运营 UAT", date: "2026-06-14", status: "未开始" }
    ],
    resources: ["产品经理 1 人", "全栈开发 1 人", "前端开发 1 人", "接口开发 1 人"],
    taskIds: ["TASK-846", "TASK-842", "TASK-843"],
    contributions: [
      { party: "研发部", type: "内部IT", responsibility: "报表门户、权限模型、审计日志和数据导出接口", effort: "58 人天", cost: "内部成本", status: "开发中" },
      { party: "运营中心", type: "业务方", responsibility: "指标口径、样例数据、验收脚本和权限边界确认", effort: "18 人天", cost: "业务投入", status: "参与中" }
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
    stage: "已归档",
    progress: 100,
    budget: 860000,
    usedBudget: 842000,
    personDays: 36,
    risk: "低",
    riskReason: "已完成上线复盘",
    riskResponse: "进入运维观察期，LIMS 供应商保留 2 周问题响应窗口。",
    aiScore: {
      businessValue: 86,
      urgency: 72,
      feasibility: 90,
      total: 84,
      recommendation: "推荐立项",
      reasons: ["实验室样本流程升级对研发效率和数据合规有明确价值", "供应商能力成熟，已完成上线复盘", "后续主要风险在运维观察和问题响应窗口"]
    },
    stages: projectStageTrack("已归档"),
    milestones: [
      { name: "供应商交付", date: "2026-04-28", status: "完成" },
      { name: "正式上线", date: "2026-05-12", status: "完成" }
    ],
    resources: ["产品经理 1 人", "供应商实施 3 人", "验证测试 1 人"],
    taskIds: ["TASK-732", "TASK-733", "TASK-734"],
    contributions: [
      { party: "研发部", type: "内部IT", responsibility: "仪器接口、安全策略、账号权限和验证协调", effort: "18 人天", cost: "内部成本", status: "已完成" },
      { party: "LIMS 供应商", type: "外部供应商", responsibility: "系统升级、样本流程配置、报表和接口适配", effort: "36 人天", cost: "86 万合同", status: "已交付" },
      { party: "运营中心", type: "业务方", responsibility: "样本流转、结果复核和实验室场景验收", effort: "16 人天", cost: "业务投入", status: "已验收" }
    ]
  },
  {
    id: "PRJ-131",
    name: "算力中心 GPU 集群一期",
    demandId: "REQ-2026-019",
    owner: "许知远",
    supplierManager: "马骏",
    projectType: "硬件项目",
    implementation: "合作实现",
    stage: "联调测试中",
    progress: 76,
    budget: 3260000,
    usedBudget: 2480000,
    personDays: 98,
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
    stages: projectStageTrack("联调测试中"),
    milestones: [
      { name: "GPU 节点上架", date: "2026-05-18", status: "完成" },
      { name: "调度平台压测", date: "2026-05-28", status: "延期风险" }
    ],
    resources: ["基础架构 2 人", "平台开发 1 人", "网络工程师 1 人", "供应商实施 2 人"],
    taskIds: ["TASK-881", "TASK-882", "TASK-883"],
    contributions: [
      { party: "研发部", type: "内部IT", responsibility: "调度平台、资源配额、监控告警和安全策略", effort: "62 人天", cost: "内部成本", status: "测试中" },
      { party: "云算科技", type: "外部供应商", responsibility: "GPU 服务器、存储网络、机房上架和硬件维保", effort: "36 人天", cost: "326 万合同", status: "到货验收中" },
      { party: "运营中心", type: "业务方", responsibility: "AI 建模场景、压测作业和算力验收标准", effort: "20 人天", cost: "业务投入", status: "参与中" }
    ]
  },
  {
    id: "PRJ-097",
    name: "培训中心音视频设备更新",
    demandId: "REQ-2026-014",
    owner: "马骏",
    supplierManager: "马骏",
    projectType: "硬件项目",
    implementation: "外部供应商",
    stage: "待受理",
    progress: 12,
    budget: 450000,
    usedBudget: 30000,
    personDays: 8,
    risk: "低",
    riskReason: "现场踏勘尚未完成，设备清单和布线窗口待确认",
    riskResponse: "项目经理安排供应商踏勘并锁定培训空档期，避免影响季度合规培训。",
    aiScore: {
      businessValue: 70,
      urgency: 66,
      feasibility: 82,
      total: 72,
      recommendation: "谨慎推荐",
      reasons: ["培训体验提升明确，但业务收益不如核心系统改造直接", "外部集成商可完整交付，内部开发占用低", "现场踏勘和施工窗口确认后再锁定最终设备清单"]
    },
    stages: projectStageTrack("待受理"),
    milestones: [
      { name: "现场踏勘", date: "2026-05-29", status: "预约中" },
      { name: "设备清单确认", date: "2026-06-06", status: "未开始" },
      { name: "安装验收", date: "2026-07-20", status: "未开始" }
    ],
    resources: ["外部集成商 3 人", "项目经理治理 1 人", "运营验收 2 人"],
    taskIds: ["TASK-621", "TASK-622", "TASK-623"],
    contributions: [
      { party: "远见智能会议集成商", type: "外部供应商", responsibility: "设备采购、弱电布线、音视频调试、录播联动和现场培训", effort: "42 人天", cost: "45 万合同", status: "待踏勘" },
      { party: "运营中心", type: "业务方", responsibility: "培训场景、验收标准和使用效果确认", effort: "6 人天", cost: "业务投入", status: "待评审" }
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
    id: "TASK-902",
    title: "CRM 拜访合规规则配置",
    projectId: "PRJ-124",
    project: "CRM 合规拜访改造",
    owner: "姜曼",
    status: "待开始",
    estimate: 24,
    actual: 0,
    due: "2026-06-08",
    role: "前端/移动端开发",
    description: "配置拜访签到、资料推送、医学审批和异常预警规则。",
    worklogs: []
  },
  {
    id: "TASK-905",
    title: "CRM 医生主数据同步接口",
    projectId: "PRJ-124",
    project: "CRM 合规拜访改造",
    owner: "吴承",
    status: "待开始",
    estimate: 18,
    actual: 0,
    due: "2026-06-12",
    role: "接口开发",
    description: "同步医生主数据、拜访授权和医学审批角色信息。",
    worklogs: []
  },
  {
    id: "TASK-906",
    title: "CRM 移动端留痕页面",
    projectId: "PRJ-124",
    project: "CRM 合规拜访改造",
    owner: "姜曼",
    status: "待开始",
    estimate: 26,
    actual: 0,
    due: "2026-06-18",
    role: "前端/移动端开发",
    description: "实现签到、资料推送、审批意见和异常留痕页面。",
    worklogs: []
  },
  {
    id: "TASK-846",
    title: "运营指标口径配置页面",
    projectId: "PRJ-116",
    project: "运营指标自助报表门户",
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
    title: "运营报表权限审计日志",
    projectId: "PRJ-116",
    project: "运营指标自助报表门户",
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
    title: "运营报表导出接口",
    projectId: "PRJ-116",
    project: "运营指标自助报表门户",
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
  },
  {
    id: "TASK-621",
    title: "培训室现场踏勘",
    projectId: "PRJ-097",
    project: "培训中心音视频设备更新",
    owner: "远见智能实施",
    status: "待开始",
    estimate: 16,
    actual: 0,
    due: "2026-05-29",
    role: "外部实施",
    description: "完成培训室弱电、拾音、投屏、录播和会议联动现场踏勘。",
    worklogs: []
  },
  {
    id: "TASK-622",
    title: "音视频设备安装调试",
    projectId: "PRJ-097",
    project: "培训中心音视频设备更新",
    owner: "远见智能实施",
    status: "待开始",
    estimate: 42,
    actual: 0,
    due: "2026-07-10",
    role: "外部实施",
    description: "完成设备安装、弱电布线、投屏、拾音和会议联动调试。",
    worklogs: []
  },
  {
    id: "TASK-623",
    title: "培训中心录播联动验收",
    projectId: "PRJ-097",
    project: "培训中心音视频设备更新",
    owner: "远见智能实施",
    status: "待开始",
    estimate: 12,
    actual: 0,
    due: "2026-07-20",
    role: "外部实施",
    description: "按培训场景完成录播、远程会议和效果验收。",
    worklogs: []
  }
];

export const resourcePeople: ResourcePerson[] = [
  {
    name: "吴承",
    role: "接口开发",
    skills: ["SAP 接口", "Java", "主数据治理"],
    capacity: 40,
    assigned: 38,
    allocations: [
      { project: "SAP S/4HANA 财务供应链一体化", work: "主数据迁移校验、采购入库接口", hours: 18, status: "进行中" },
      { project: "GxP 电子文档与验证平台", work: "电子签名接口复核", hours: 8, status: "测试中" },
      { project: "CRM 合规拜访改造", work: "医生主数据同步接口", hours: 8, status: "待开始" },
      { project: "运营指标自助报表门户", work: "报表导出接口和数据权限校验", hours: 4, status: "排期中" }
    ]
  },
  {
    name: "姜曼",
    role: "前端/移动端开发",
    skills: ["React", "CRM", "合规留痕"],
    capacity: 40,
    assigned: 36,
    allocations: [
      { project: "CRM 合规拜访改造", work: "拜访签到与合规审批移动端页面", hours: 16, status: "待开始" },
      { project: "GxP 电子文档与验证平台", work: "培训记录查询和审计追踪页面", hours: 8, status: "进行中" },
      { project: "SAP S/4HANA 财务供应链一体化", work: "主数据校验看板", hours: 4, status: "排期中" },
      { project: "运营指标自助报表门户", work: "指标口径配置页面", hours: 8, status: "进行中" }
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
    assigned: 37,
    allocations: [
      { project: "GxP 电子文档与验证平台", work: "电子签名审批流与审计追踪缺陷", hours: 14, status: "测试中" },
      { project: "LIMS 实验室系统升级", work: "验证报表导出接口", hours: 9, status: "已完成" },
      { project: "CRM 合规拜访改造", work: "合规审批规则服务", hours: 8, status: "分析中" },
      { project: "运营指标自助报表门户", work: "权限审计日志和角色过滤", hours: 6, status: "进行中" }
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
  { person: "吴承", date: "2026-05-26", timeSlot: "下午", taskId: "TASK-905", task: "CRM 医生主数据同步接口", projectId: "PRJ-124", project: "CRM 合规拜访改造", hours: 4, status: "待开始" },
  { person: "吴承", date: "2026-05-27", timeSlot: "全天", taskId: "TASK-901", task: "SAP 主数据迁移校验", projectId: "PRJ-126", project: "SAP S/4HANA 财务供应链一体化", hours: 7, status: "进行中" },
  { person: "吴承", date: "2026-05-28", timeSlot: "上午", taskId: "TASK-901", task: "SAP 主数据迁移校验", projectId: "PRJ-126", project: "SAP S/4HANA 财务供应链一体化", hours: 4, status: "进行中" },
  { person: "吴承", date: "2026-05-29", timeSlot: "下午", taskId: "TASK-818", task: "GxP 电子签名审批流", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 3, status: "测试中" },
  { person: "吴承", date: "2026-06-02", timeSlot: "全天", taskId: "TASK-903", task: "SAP 采购入库接口联调", projectId: "PRJ-126", project: "SAP S/4HANA 财务供应链一体化", hours: 8, status: "待开始" },
  { person: "吴承", date: "2026-06-03", timeSlot: "下午", taskId: "TASK-843", task: "运营报表导出接口", projectId: "PRJ-116", project: "运营指标自助报表门户", hours: 4, status: "待开始" },

  { person: "姜曼", date: "2026-05-25", timeSlot: "上午", taskId: "TASK-902", task: "CRM 拜访合规规则配置", projectId: "PRJ-124", project: "CRM 合规拜访改造", hours: 4, status: "待开始" },
  { person: "姜曼", date: "2026-05-25", timeSlot: "下午", taskId: "TASK-819", task: "GxP 审计追踪报表", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 3, status: "进行中" },
  { person: "姜曼", date: "2026-05-26", timeSlot: "全天", taskId: "TASK-906", task: "CRM 移动端留痕页面", projectId: "PRJ-124", project: "CRM 合规拜访改造", hours: 7, status: "待开始" },
  { person: "姜曼", date: "2026-05-27", timeSlot: "上午", taskId: "TASK-819", task: "GxP 审计追踪报表", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 4, status: "进行中" },
  { person: "姜曼", date: "2026-05-28", timeSlot: "下午", taskId: "TASK-904", task: "SAP 批次成本核算联调", projectId: "PRJ-126", project: "SAP S/4HANA 财务供应链一体化", hours: 4, status: "待开始" },
  { person: "姜曼", date: "2026-05-29", timeSlot: "上午", taskId: "TASK-846", task: "运营指标口径配置页面", projectId: "PRJ-116", project: "运营指标自助报表门户", hours: 4, status: "进行中" },
  { person: "姜曼", date: "2026-06-04", timeSlot: "全天", taskId: "TASK-906", task: "CRM 移动端留痕页面", projectId: "PRJ-124", project: "CRM 合规拜访改造", hours: 8, status: "待开始" },

  { person: "韩冰", date: "2026-05-25", timeSlot: "上午", taskId: "TASK-881", task: "GPU 集群监控告警", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "暂停" },
  { person: "韩冰", date: "2026-05-26", timeSlot: "上午", taskId: "TASK-882", task: "GPU 作业调度平台", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "测试中" },
  { person: "韩冰", date: "2026-05-27", timeSlot: "全天", taskId: "TASK-881", task: "GPU 集群监控告警", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 8, status: "暂停" },
  { person: "韩冰", date: "2026-05-29", timeSlot: "下午", taskId: "TASK-883", task: "GPU 存储网络压测", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "进行中" },
  { person: "韩冰", date: "2026-06-03", timeSlot: "全天", taskId: "TASK-882", task: "GPU 作业调度平台", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 8, status: "测试中" },

  { person: "陆川", date: "2026-05-25", timeSlot: "上午", taskId: "TASK-817", task: "GxP 文档审批流验证缺陷", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 4, status: "测试中" },
  { person: "陆川", date: "2026-05-25", timeSlot: "下午", taskId: "TASK-902", task: "CRM 拜访合规规则配置", projectId: "PRJ-124", project: "CRM 合规拜访改造", hours: 4, status: "待开始" },
  { person: "陆川", date: "2026-05-26", timeSlot: "全天", taskId: "TASK-817", task: "GxP 文档审批流验证缺陷", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 7, status: "测试中" },
  { person: "陆川", date: "2026-05-27", timeSlot: "下午", taskId: "TASK-842", task: "运营报表权限审计日志", projectId: "PRJ-116", project: "运营指标自助报表门户", hours: 4, status: "进行中" },
  { person: "陆川", date: "2026-05-28", timeSlot: "上午", taskId: "TASK-734", task: "LIMS 审计追踪验证", projectId: "PRJ-108", project: "LIMS 实验室系统升级", hours: 4, status: "已完成" },
  { person: "陆川", date: "2026-06-01", timeSlot: "下午", taskId: "TASK-819", task: "GxP 审计追踪报表", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 4, status: "进行中" },
  { person: "陆川", date: "2026-06-02", timeSlot: "上午", taskId: "TASK-842", task: "运营报表权限审计日志", projectId: "PRJ-116", project: "运营指标自助报表门户", hours: 4, status: "进行中" },

  { person: "罗清", date: "2026-05-25", timeSlot: "上午", taskId: "TASK-883", task: "GPU 存储网络压测", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "进行中" },
  { person: "罗清", date: "2026-05-29", timeSlot: "上午", taskId: "TASK-883", task: "GPU 存储网络压测", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "进行中" },

  { person: "吴承", date: "2026-06-05", timeSlot: "全天", taskId: "TASK-905", task: "CRM 医生主数据同步接口", projectId: "PRJ-124", project: "CRM 合规拜访改造", hours: 8, status: "待开始" },
  { person: "吴承", date: "2026-06-09", timeSlot: "上午", taskId: "TASK-843", task: "运营报表导出接口", projectId: "PRJ-116", project: "运营指标自助报表门户", hours: 4, status: "待开始" },
  { person: "吴承", date: "2026-06-12", timeSlot: "下午", taskId: "TASK-905", task: "CRM 医生主数据同步接口", projectId: "PRJ-124", project: "CRM 合规拜访改造", hours: 4, status: "待开始" },

  { person: "姜曼", date: "2026-06-10", timeSlot: "全天", taskId: "TASK-906", task: "CRM 移动端留痕页面", projectId: "PRJ-124", project: "CRM 合规拜访改造", hours: 8, status: "待开始" },
  { person: "姜曼", date: "2026-06-14", timeSlot: "上午", taskId: "TASK-846", task: "运营指标口径配置页面", projectId: "PRJ-116", project: "运营指标自助报表门户", hours: 4, status: "进行中" },
  { person: "姜曼", date: "2026-07-03", timeSlot: "下午", taskId: "TASK-906", task: "CRM 移动端留痕页面", projectId: "PRJ-124", project: "CRM 合规拜访改造", hours: 4, status: "待开始" },

  { person: "韩冰", date: "2026-06-07", timeSlot: "全天", taskId: "TASK-883", task: "GPU 存储网络压测", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 8, status: "进行中" },
  { person: "韩冰", date: "2026-06-18", timeSlot: "上午", taskId: "TASK-882", task: "GPU 作业调度平台", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "测试中" },
  { person: "韩冰", date: "2026-07-08", timeSlot: "下午", taskId: "TASK-881", task: "GPU 集群监控告警", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "暂停" },

  { person: "陆川", date: "2026-06-06", timeSlot: "全天", taskId: "TASK-842", task: "运营报表权限审计日志", projectId: "PRJ-116", project: "运营指标自助报表门户", hours: 8, status: "进行中" },
  { person: "陆川", date: "2026-06-13", timeSlot: "下午", taskId: "TASK-817", task: "GxP 文档审批流验证缺陷", projectId: "PRJ-119", project: "GxP 电子文档与验证平台", hours: 3, status: "测试中" },
  { person: "陆川", date: "2026-07-02", timeSlot: "上午", taskId: "TASK-902", task: "CRM 拜访合规规则配置", projectId: "PRJ-124", project: "CRM 合规拜访改造", hours: 4, status: "待开始" },

  { person: "罗清", date: "2026-06-04", timeSlot: "全天", taskId: "TASK-883", task: "GPU 存储网络压测", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 8, status: "进行中" },
  { person: "罗清", date: "2026-06-11", timeSlot: "下午", taskId: "TASK-882", task: "GPU 作业调度平台", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "测试中" },
  { person: "罗清", date: "2026-07-10", timeSlot: "上午", taskId: "TASK-883", task: "GPU 存储网络压测", projectId: "PRJ-131", project: "算力中心 GPU 集群一期", hours: 4, status: "进行中" }
];

export const resourceRequests: ResourceRequest[] = [
  { id: "RS-204", project: "SAP S/4HANA 财务供应链一体化", requester: "陈彦", need: "ABAP 开发 2 人", days: 18, status: "待审批" },
  { id: "RS-198", project: "算力中心 GPU 集群一期", requester: "陈彦", need: "网络工程师 1 人", days: 12, status: "已批准" },
  { id: "RS-187", project: "CRM 合规拜访改造", requester: "陈彦", need: "CRM 供应商技术评估", days: 6, status: "评估中" },
  { id: "RS-181", project: "运营指标自助报表门户", requester: "陈彦", need: "内部全栈开发 1 人、前端开发 1 人", days: 28, status: "已批准" },
  { id: "RS-172", project: "培训中心音视频设备更新", requester: "陈彦", need: "外部音视频集成商踏勘与报价", days: 8, status: "待审批" }
];

export const deliveryRequests: DeliveryRequest[] = [
  {
    id: "DR-SAP-041",
    demandId: "REQ-2026-041",
    projectId: "PRJ-126",
    title: "SAP 财务供应链升级项目申请",
    productOwner: "陈彦",
    projectManager: "马骏",
    requestedMode: "合作实现",
    resourceNeed: "ABAP 开发 2 人、接口开发 2 人、测试 2 人，窗口 2026-05-25 至 2026-06-18",
    supplierNeed: "明德 SAP 实施顾问负责蓝图、FI/MM 配置和 ABAP 增强",
    status: "待项目经理受理",
    submittedAt: "2026-05-25",
    decision: "产品经理已完成产品评估，等待项目经理受理项目申请并完成资源排期和供应商治理确认。"
  },
  {
    id: "DR-CRM-038",
    demandId: "REQ-2026-038",
    projectId: "PRJ-124",
    title: "CRM 合规拜访改造项目申请",
    productOwner: "赵敏",
    projectManager: "马骏",
    requestedMode: "合作实现",
    resourceNeed: "移动端开发 1 人、接口开发 1 人、CRM 供应商技术评估 6 人天",
    supplierNeed: "星瀚 CRM 实施商提供合规审批流、移动端留痕和报价方案",
    status: "退回补充",
    submittedAt: "2026-05-24",
    decision: "项目经理要求产品经理在产品评估中补充医学审批节点和预算上限后再正式受理。"
  },
  {
    id: "DR-OPS-030",
    demandId: "REQ-2026-030",
    projectId: "PRJ-116",
    title: "运营指标自助报表门户项目申请",
    productOwner: "陈彦",
    projectManager: "李书航",
    requestedMode: "内部实现",
    resourceNeed: "全栈开发 1 人、前端开发 1 人、接口开发 1 人，共 28 人天",
    supplierNeed: "无外部供应商",
    status: "已立项",
    submittedAt: "2026-05-18",
    decision: "已转为内部实现项目，项目经理完成资源排期。"
  },
  {
    id: "DR-AV-014",
    demandId: "REQ-2026-014",
    projectId: "PRJ-097",
    title: "培训中心音视频设备更新项目申请",
    productOwner: "陈彦",
    projectManager: "马骏",
    requestedMode: "外部供应商",
    resourceNeed: "IT 项目经理治理 8 人天，运营中心预留验收 6 人天",
    supplierNeed: "远见智能会议集成商完成踏勘、设备清单、施工和现场培训",
    status: "待项目经理受理",
    submittedAt: "2026-05-25",
    decision: "产品经理确认纯外部供应商实施，等待项目经理受理并安排踏勘。"
  }
];

export const demandProjectFlows: DemandProjectFlow[] = [
  {
    id: "FLOW-SAP-041",
    demandId: "REQ-2026-041",
    projectId: "PRJ-126",
    title: "SAP 财务供应链升级转项目流程",
    mode: "合作实现",
    currentNodeId: "resource",
    resourceRequest: {
      requester: "陈彦",
      need: "ABAP 开发 2 人、接口开发 2 人、测试 2 人",
      days: 18,
      window: "2026-05-25 至 2026-06-18",
      status: "待审批"
    },
    nodes: [
      { id: "submit", name: "需求提交", lane: "运营中心", owner: "沈岚", status: "已完成", deliverable: "需求说明、业务目标、附件", description: "运营中心提交 SAP 财务供应链升级需求。", configurable: true },
      { id: "businessConfirm", name: "业务确认与优先级", lane: "运营中心", owner: "周宁", status: "已完成", deliverable: "范围确认、P0 优先级", description: "运营中心负责人确认财务月结窗口和验收标准。", configurable: true },
      { id: "assign", name: "产品指派与承接启动", lane: "项目经理 / IT部", owner: "李书航", status: "已完成", deliverable: "产品负责人指派", description: "IT负责人指定陈彦承接该需求，开启产品承接环节。", configurable: true },
      { id: "evaluate", name: "产品评估", lane: "产品经理", owner: "陈彦", status: "已完成", deliverable: "价值评分、范围、实现方式、资源测算、验收标准", description: "产品经理在同一份评估中确认范围、实现方式、资源测算和验收标准。", configurable: true },
      { id: "resource", name: "项目申请", lane: "产品经理", owner: "陈彦", status: "进行中", deliverable: "项目申请 DR-SAP-041", description: "产品经理提交项目申请，等待项目经理受理并安排资源。", configurable: true },
      { id: "iteration", name: "项目立项与资源排期", lane: "项目经理 / IT部", owner: "马骏", status: "待确认", deliverable: "资源申请单 RS-204、人员排期", description: "项目经理评估负载并安排吴承、姜曼。", configurable: true },
      { id: "develop", name: "任务拆解与实施", lane: "研发部 / 开发", owner: "吴承 / 姜曼", status: "进行中", deliverable: "接口开发、主数据校验看板", description: "研发部处理接口、权限和主数据迁移校验。", configurable: true },
      { id: "acceptance", name: "业务验收", lane: "运营中心", owner: "沈岚", status: "待开始", deliverable: "财务供应链 UAT", description: "产品经理组织，运营中心确认业务验收。", configurable: true },
      { id: "online", name: "上线归档", lane: "项目经理 / IT部", owner: "马骏", status: "待开始", deliverable: "上线复盘、预算归档", description: "项目经理负责上线确认、供应商评价和项目归档。", configurable: true }
    ],
    assignments: [
      { id: "ASSIGN-SAP-01", role: "接口开发", person: "吴承", dateRange: "2026-05-25 至 2026-06-03", hours: 22, workload: "本周 38/40h", conflict: "接近满负荷", sourceCalendarDates: ["2026-05-25", "2026-05-27", "2026-05-28", "2026-06-02"] },
      { id: "ASSIGN-SAP-02", role: "前端/移动端开发", person: "姜曼", dateRange: "2026-05-28 至 2026-06-04", hours: 12, workload: "本周 36/40h", conflict: "可承接", sourceCalendarDates: ["2026-05-28", "2026-06-04"] }
    ]
  },
  {
    id: "FLOW-CRM-038",
    demandId: "REQ-2026-038",
    projectId: "PRJ-124",
    title: "CRM 合规拜访改造转项目流程",
    mode: "合作实现",
    currentNodeId: "evaluate",
    resourceRequest: {
      requester: "赵敏",
      need: "CRM 供应商技术评估、移动端开发 1 人、接口开发 1 人",
      days: 6,
      window: "2026-05-25 至 2026-07-05",
      status: "评估中"
    },
    nodes: [
      { id: "submit", name: "需求提交", lane: "运营中心", owner: "周宁", status: "已完成", deliverable: "拜访合规改造需求", description: "运营中心提出拜访签到、审批和留痕诉求。", configurable: true },
      { id: "businessConfirm", name: "业务确认与优先级", lane: "运营中心", owner: "周宁", status: "待确认", deliverable: "合规审批节点确认", description: "等待运营中心负责人确认预算和审批节点。", configurable: true },
      { id: "assign", name: "产品指派与承接启动", lane: "项目经理 / IT部", owner: "李书航", status: "已完成", deliverable: "产品负责人指派", description: "IT负责人指定赵敏承接该需求，开启产品承接环节。", configurable: true },
      { id: "evaluate", name: "产品评估", lane: "产品经理", owner: "赵敏", status: "进行中", deliverable: "价值评分、范围、实现方式、资源测算、验收标准", description: "产品经理在同一份评估中评估 CRM 标准能力、供应商定制边界、资源测算和验收标准。", configurable: true },
      { id: "resource", name: "项目申请", lane: "产品经理", owner: "赵敏", status: "待确认", deliverable: "项目申请 DR-CRM-038", description: "产品经理提交项目申请，项目经理要求补充审批节点和预算上限。", configurable: true },
      { id: "iteration", name: "项目立项与资源排期", lane: "项目经理 / IT部", owner: "马骏", status: "待开始", deliverable: "资源申请单 RS-187", description: "项目经理评估供应商方案和内部接口开发窗口。", configurable: true },
      { id: "develop", name: "任务拆解与实施", lane: "研发部 / 开发", owner: "姜曼 / 陆川", status: "待开始", deliverable: "移动端页面、审批规则服务", description: "研发部配合供应商完成接口和移动端联调。", configurable: true },
      { id: "acceptance", name: "业务验收", lane: "运营中心", owner: "周宁", status: "待开始", deliverable: "CRM 移动端 UAT", description: "运营中心验证拜访场景和审计留痕。", configurable: true },
      { id: "online", name: "上线归档", lane: "项目经理 / IT部", owner: "马骏", status: "待开始", deliverable: "合规审计上线报告", description: "项目经理负责上线确认和合同归档。", configurable: true }
    ],
    assignments: [
      { id: "ASSIGN-CRM-01", role: "前端/移动端开发", person: "姜曼", dateRange: "2026-05-25 至 2026-06-04", hours: 28, workload: "本周 36/40h", conflict: "可承接", sourceCalendarDates: ["2026-05-25", "2026-05-26", "2026-06-04"] },
      { id: "ASSIGN-CRM-02", role: "全栈开发", person: "陆川", dateRange: "2026-05-25 至 2026-06-02", hours: 12, workload: "本周 37/40h", conflict: "接近满负荷", sourceCalendarDates: ["2026-05-25"] }
    ]
  },
  {
    id: "FLOW-OPS-030",
    demandId: "REQ-2026-030",
    projectId: "PRJ-116",
    title: "运营指标自助报表门户转项目流程",
    mode: "内部实现",
    currentNodeId: "develop",
    resourceRequest: {
      requester: "陈彦",
      need: "内部全栈开发 1 人、前端开发 1 人、接口开发 1 人",
      days: 28,
      window: "2026-05-25 至 2026-06-14",
      status: "已批准"
    },
    nodes: [
      { id: "submit", name: "需求提交", lane: "运营中心", owner: "沈岚", status: "已完成", deliverable: "指标门户需求说明", description: "运营中心提交自助报表和权限审计需求。", configurable: true },
      { id: "businessConfirm", name: "业务确认与优先级", lane: "运营中心", owner: "周宁", status: "已完成", deliverable: "18 个核心指标口径", description: "运营中心负责人确认首批指标和权限边界。", configurable: true },
      { id: "assign", name: "产品指派与承接启动", lane: "项目经理 / IT部", owner: "李书航", status: "已完成", deliverable: "产品负责人指派", description: "IT负责人指定陈彦承接该需求，开启产品承接环节。", configurable: true },
      { id: "evaluate", name: "产品评估", lane: "产品经理", owner: "陈彦", status: "已完成", deliverable: "价值评分、范围、实现方式、资源测算、验收标准", description: "产品经理确认复用内部数据服务，并在评估中沉淀范围、资源测算和验收标准。", configurable: true },
      { id: "resource", name: "项目申请", lane: "产品经理", owner: "陈彦", status: "已完成", deliverable: "项目申请 DR-OPS-030", description: "产品经理提交内部实现项目申请。", configurable: true },
      { id: "iteration", name: "项目立项与资源排期", lane: "项目经理 / IT部", owner: "李书航", status: "已完成", deliverable: "资源申请单 RS-181", description: "项目经理已安排姜曼、陆川、吴承进入排期。", configurable: true },
      { id: "develop", name: "任务拆解与实施", lane: "研发部 / 开发", owner: "姜曼 / 陆川 / 吴承", status: "进行中", deliverable: "页面、接口、审计日志", description: "研发部内部开发，无外部供应商投入。", configurable: true },
      { id: "acceptance", name: "业务验收", lane: "运营中心", owner: "沈岚", status: "待开始", deliverable: "运营 UAT 脚本", description: "运营中心按指标样例和权限边界验收。", configurable: true },
      { id: "online", name: "上线归档", lane: "项目经理 / IT部", owner: "李书航", status: "待开始", deliverable: "月度经营复盘看板", description: "项目经理负责上线确认、复盘和归档。", configurable: true }
    ],
    assignments: [
      { id: "ASSIGN-OPS-01", role: "前端/移动端开发", person: "姜曼", dateRange: "2026-05-29 至 2026-06-06", hours: 12, workload: "本周 36/40h", conflict: "可承接", sourceCalendarDates: ["2026-05-29"] },
      { id: "ASSIGN-OPS-02", role: "全栈开发", person: "陆川", dateRange: "2026-05-27 至 2026-06-07", hours: 12, workload: "本周 37/40h", conflict: "接近满负荷", sourceCalendarDates: ["2026-05-27", "2026-06-02"] },
      { id: "ASSIGN-OPS-03", role: "接口开发", person: "吴承", dateRange: "2026-06-03 至 2026-06-10", hours: 8, workload: "本周 38/40h", conflict: "接近满负荷", sourceCalendarDates: ["2026-06-03"] }
    ]
  },
  {
    id: "FLOW-AV-014",
    demandId: "REQ-2026-014",
    projectId: "PRJ-097",
    title: "培训中心音视频设备更新转项目流程",
    mode: "外部供应商",
    currentNodeId: "resource",
    resourceRequest: {
      requester: "陈彦",
      need: "外部音视频集成商踏勘与报价",
      days: 8,
      window: "2026-05-29 至 2026-07-20",
      status: "待审批"
    },
    nodes: [
      { id: "submit", name: "需求提交", lane: "运营中心", owner: "周宁", status: "已完成", deliverable: "培训设备更新需求", description: "运营中心提出培训室音视频设备升级需求。", configurable: true },
      { id: "businessConfirm", name: "业务确认与优先级", lane: "运营中心", owner: "周宁", status: "待确认", deliverable: "培训空档期和验收标准", description: "需确认供应商进场窗口和使用场景。", configurable: true },
      { id: "assign", name: "产品指派与承接启动", lane: "项目经理 / IT部", owner: "李书航", status: "已完成", deliverable: "产品负责人指派", description: "IT负责人指定陈彦承接该需求，开启产品承接环节。", configurable: true },
      { id: "evaluate", name: "产品评估", lane: "产品经理", owner: "陈彦", status: "已完成", deliverable: "价值评分、范围、实现方式、资源测算、验收标准", description: "产品经理确认无需内部开发，并在评估中沉淀供应商方案、预算和验收标准。", configurable: true },
      { id: "resource", name: "项目申请", lane: "产品经理", owner: "陈彦", status: "进行中", deliverable: "项目申请 DR-AV-014", description: "产品经理提交纯外部供应商项目申请。", configurable: true },
      { id: "iteration", name: "项目立项与资源排期", lane: "项目经理 / IT部", owner: "马骏", status: "待开始", deliverable: "资源申请单 RS-172、踏勘计划", description: "项目经理安排远见智能会议集成商踏勘与报价。", configurable: true },
      { id: "develop", name: "任务拆解与实施", lane: "外部供应商", owner: "远见智能实施", status: "待开始", deliverable: "设备安装、弱电布线、录播联动", description: "外部供应商负责完整现场实施。", configurable: true },
      { id: "acceptance", name: "业务验收", lane: "运营中心", owner: "周宁", status: "待开始", deliverable: "音视频效果验收", description: "运营中心按培训场景确认使用效果。", configurable: true },
      { id: "online", name: "上线归档", lane: "项目经理 / IT部", owner: "马骏", status: "待开始", deliverable: "设备启用与合同归档", description: "项目经理负责供应商评价和合同归档。", configurable: true }
    ],
    assignments: [
      { id: "ASSIGN-AV-01", role: "外部实施", person: "远见智能实施", dateRange: "2026-05-29 至 2026-07-20", hours: 42, workload: "外部供应商排期", conflict: "等待场地窗口", sourceCalendarDates: ["2026-05-29"] },
      { id: "ASSIGN-AV-02", role: "项目经理", person: "马骏", dateRange: "2026-05-29 至 2026-06-06", hours: 8, workload: "合同与风险治理", conflict: "无冲突", sourceCalendarDates: ["2026-05-29"] }
    ]
  }
];

export const supplierBudgets: SupplierBudget[] = [
  { supplier: "明德 SAP 实施顾问", project: "SAP S/4HANA 财务供应链一体化", manager: "马骏", contract: 1880000, used: 936000, payment: "二期款待付", deliveryStatus: "FI/MM 配置实施中", riskStatus: "中" },
  { supplier: "星瀚 CRM 实施商", project: "CRM 合规拜访改造", manager: "马骏", contract: 720000, used: 160000, payment: "商务评审", deliveryStatus: "方案与报价评审", riskStatus: "低" },
  { supplier: "云算科技", project: "算力中心 GPU 集群一期", manager: "马骏", contract: 3260000, used: 2480000, payment: "硬件到货验收中", deliveryStatus: "第二批 GPU 待到货", riskStatus: "高" },
  { supplier: "信合 GxP 验证咨询", project: "GxP 电子文档与验证平台", manager: "李书航", contract: 220000, used: 126000, payment: "验证包评审中", deliveryStatus: "验证包复核", riskStatus: "低" },
  { supplier: "远见智能会议集成商", project: "培训中心音视频设备更新", manager: "马骏", contract: 450000, used: 30000, payment: "踏勘费待确认", deliveryStatus: "现场踏勘预约中", riskStatus: "低" }
];

export const projectInvestmentBreakdowns: ProjectInvestmentBreakdown[] = [
  {
    project: "SAP S/4HANA 财务供应链一体化",
    internalDays: 46,
    supplierCost: 1880000,
    supplierRole: "SAP 顾问负责蓝图、FI/MM 配置、ABAP 增强",
    businessRole: "运营中心负责主数据确认、月结 UAT",
    status: "开发中"
  },
  {
    project: "CRM 合规拜访改造",
    internalDays: 32,
    supplierCost: 720000,
    supplierRole: "CRM 实施商负责移动端定制和合规审批适配",
    businessRole: "运营中心确认拜访合规规则",
    status: "分析中"
  },
  {
    project: "GxP 电子文档与验证平台",
    internalDays: 52,
    supplierCost: 220000,
    supplierRole: "GxP 验证咨询负责验证策略和验证包复核",
    businessRole: "运营中心负责 SOP 场景和验收评分",
    status: "验收中"
  },
  {
    project: "运营指标自助报表门户",
    internalDays: 58,
    supplierCost: 0,
    supplierRole: "无外部供应商，研发部内部实现",
    businessRole: "运营中心确认指标口径、样例数据和验收脚本",
    status: "开发中"
  },
  {
    project: "LIMS 实验室系统升级",
    internalDays: 18,
    supplierCost: 860000,
    supplierRole: "LIMS 供应商负责产品升级和仪器接口适配",
    businessRole: "运营中心负责实验室场景验证",
    status: "已上线"
  },
  {
    project: "算力中心 GPU 集群一期",
    internalDays: 62,
    supplierCost: 3260000,
    supplierRole: "云算科技负责 GPU 设备、存储网络和硬件维保",
    businessRole: "运营中心负责 AI 作业压测和验收标准",
    status: "测试中"
  },
  {
    project: "培训中心音视频设备更新",
    internalDays: 8,
    supplierCost: 450000,
    supplierRole: "远见智能会议集成商负责设备采购、布线、调试和现场培训",
    businessRole: "运营中心确认培训场景、使用效果和验收标准",
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
    { label: "研发部", value: 84 },
    { label: "运营中心", value: 88 },
    { label: "外部供应商", value: 81 },
    { label: "管理层", value: 93 }
  ],
  budgetDeviation: [
    { label: "算力中心", value: 19 },
    { label: "SAP升级", value: 8 },
    { label: "GxP文档", value: -3 },
    { label: "LIMS升级", value: 2 },
    { label: "运营报表", value: -6 },
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
  { id: "u-it-01", name: "马骏", departmentId: "it", department: "IT部", roleId: "pm", role: "项目经理", status: "启用", scope: "IT 项目池、供应商交付、合同预算和风险", dataScope: "本部门" },
  { id: "u-it-02", name: "李书航", departmentId: "it", department: "IT部", roleId: "pm", role: "项目经理", organizationTitle: "IT负责人", isDepartmentOwner: true, status: "启用", scope: "IT部项目治理、资源协调、供应商绩效", dataScope: "本部门" },
  { id: "u-it-03", name: "孙昊", departmentId: "it", department: "IT部", roleId: "pm", role: "项目经理", status: "启用", scope: "硬件、机房和算力中心项目治理", dataScope: "本部门" },
  { id: "u-it-04", name: "何嘉", departmentId: "it", department: "IT部", roleId: "pm", role: "项目经理", status: "启用", scope: "供应商实施、合同预算和上线归档", dataScope: "本部门" },
  { id: "u-rd-01", name: "陈彦", departmentId: "rd", department: "研发部", roleId: "product", role: "产品经理", status: "启用", scope: "本人承接需求及关联项目", dataScope: "本人" },
  { id: "u-rd-04", name: "赵敏", departmentId: "rd", department: "研发部", roleId: "product", role: "产品经理", status: "启用", scope: "本人承接 CRM、合规和供应商评估相关需求", dataScope: "本人" },
  { id: "u-rd-05", name: "王骁", departmentId: "rd", department: "研发部", roleId: "product", role: "产品经理", status: "启用", scope: "本人承接 GxP、验证和验收组织相关需求", dataScope: "本人" },
  { id: "u-rd-02", name: "吴承", departmentId: "rd", department: "研发部", roleId: "developer", role: "开发", status: "启用", scope: "本人任务、日/周/月排期和工时填报", dataScope: "本人" },
  { id: "u-rd-03", name: "许知远", departmentId: "rd", department: "研发部", roleId: "developer", role: "开发", organizationTitle: "研发负责人", isDepartmentOwner: true, status: "启用", scope: "研发部开发任务、技术联调和交付验收支持", dataScope: "本部门" },
  { id: "u-ops-01", name: "沈岚", departmentId: "ops", department: "运营中心", roleId: "requester", role: "运营", status: "启用", scope: "本人提交需求、进度查看和验收评分", dataScope: "本人" },
  { id: "u-ops-02", name: "周宁", departmentId: "ops", department: "运营中心", roleId: "requester", role: "运营", organizationTitle: "运营中心负责人", isDepartmentOwner: true, status: "启用", scope: "运营中心全部需求、优先级、验收评分和投入占用", dataScope: "本部门" },
  { id: "u-ops-03", name: "高翔", departmentId: "ops", department: "运营中心", roleId: "requester", role: "运营", status: "启用", scope: "本人算力和数据分析相关需求", dataScope: "本人" }
];

export const departments: Department[] = [
  { id: "it", name: "IT部", ownerUserIds: ["u-it-02"], memberUserIds: ["u-it-01", "u-it-02", "u-it-03", "u-it-04"], scope: "项目治理、供应商交付、合同预算、硬件与软硬件协同项目管理", status: "启用" },
  { id: "rd", name: "研发部", ownerUserIds: ["u-rd-03"], memberUserIds: ["u-rd-01", "u-rd-02", "u-rd-03", "u-rd-04", "u-rd-05"], scope: "产品方案、内部开发、接口联调、平台开发和技术验收支持", status: "启用" },
  { id: "ops", name: "运营中心", ownerUserIds: ["u-ops-02"], memberUserIds: ["u-ops-01", "u-ops-02", "u-ops-03"], scope: "业务需求提交、优先级管理、验收评分和部门投入查看", status: "启用" },
  { id: "management", name: "管理层", ownerUserIds: ["u-exec-02"], memberUserIds: ["u-exec-01", "u-exec-02"], scope: "全公司 IT 项目组合、资源预算和绩效汇总", status: "启用" }
];

export const permissionRows: PermissionRow[] = [
  { module: "需求管理", view: true, create: true, edit: true, approve: true, export: true, scope: "产品经理 / 运营中心" },
  { module: "项目管理", view: true, create: true, edit: true, approve: true, export: true, scope: "IT 项目池 / 全公司汇总" },
  { module: "任务与工时", view: true, create: true, edit: true, approve: false, export: false, scope: "研发部本人任务" },
  { module: "资源与预算", view: true, create: false, edit: true, approve: true, export: true, scope: "项目经理 / 部门投入查看" },
  { module: "权限管理", view: true, create: true, edit: true, approve: true, export: true, scope: "仅管理员系统设置" },
  { module: "系统设置", view: true, create: true, edit: true, approve: true, export: true, scope: "管理员全量维护" }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: "N-520",
    title: "你被分配为 SAP 财务供应链升级项目负责人",
    content: "李书航将 SAP S/4HANA 财务供应链一体化分配给马骏负责项目治理、资源协调和供应商交付。",
    channel: "企业微信",
    type: "工作分配",
    time: "5分钟前",
    unread: true,
    level: "blue",
    targetRoles: ["pm"],
    targetUserNames: ["马骏"],
    sourceUserName: "李书航",
    relatedType: "project",
    relatedId: "PRJ-126"
  },
  {
    id: "N-516",
    title: "CRM 合规拜访改造需求已分配承接",
    content: "许知远将 CRM 合规拜访改造分配给赵敏进行产品评估、实现方式判断和供应商方案评审。",
    channel: "站内信",
    type: "工作分配",
    time: "18分钟前",
    unread: true,
    level: "violet",
    targetRoles: ["product"],
    targetUserNames: ["赵敏"],
    sourceUserName: "许知远",
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
    targetRoles: ["pm", "itOwner", "product"]
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
    targetRoles: ["executive", "pm", "itOwner", "opsOwner", "requester"]
  },
  {
    id: "N-488",
    title: "GxP 电子文档与验证平台待运营验收",
    content: "运营中心可进入验收评分流程。",
    channel: "企业微信",
    type: "验收提醒",
    time: "2小时前",
    unread: false,
    level: "green",
    targetRoles: ["product", "opsOwner", "pm", "itOwner", "requester"]
  },
  {
    id: "N-481",
    title: "运营指标自助报表门户内部资源已批准",
    content: "陆川、姜曼和吴承已进入本周排期，项目不涉及外部供应商合同。",
    channel: "站内信",
    type: "资源审批",
    time: "4小时前",
    unread: false,
    level: "cyan",
    targetRoles: ["product", "developer", "rdOwner", "opsOwner"]
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
    targetRoles: ["pm", "itOwner", "opsOwner", "requester"]
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
    targetRoles: ["executive", "pm", "itOwner", "product", "opsOwner", "requester"]
  }
];

export const notificationCatalog: NotificationCatalogItem[] = [
  { id: "demand.new", domain: "需求", event: "新需求提交", description: "运营提交新的 IT 需求，等待运营负责人确认业务范围和优先级。", priority: "中", channels: ["站内信"], configurable: true },
  { id: "work.assigned", domain: "任务", event: "工作分配", description: "部门负责人将需求、项目或任务分配给具体处理人。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "demand.accepted", domain: "需求", event: "需求承接", description: "产品经理承接需求并进入分析评估。", priority: "中", channels: ["站内信"], configurable: true },
  { id: "demand.scopeConfirm", domain: "需求", event: "产品评估待确认", description: "产品经理提交业务范围、实现方式、资源测算和验收标准，等待运营负责人确认业务边界。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "demand.priority", domain: "需求", event: "需求优先级调整", description: "部门负责人调整 P0/P1/P2/P3 优先级。", priority: "中", channels: ["站内信", "企业微信"], configurable: true },
  { id: "demand.acceptance", domain: "需求", event: "需求进入验收", description: "需求进入待验收阶段，需要业务方确认。", priority: "高", channels: ["站内信", "企业微信"], configurable: true },
  { id: "delivery.submitted", domain: "项目", event: "项目申请提交", description: "产品经理提交项目申请给项目经理或 IT负责人。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "delivery.returned", domain: "项目", event: "项目申请退回", description: "项目经理退回项目申请，要求产品经理补充产品评估、资源或供应商信息。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "delivery.accepted", domain: "项目", event: "项目申请受理", description: "项目经理受理项目申请并进入立项与资源排期。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "project.stage", domain: "项目", event: "交付阶段变更", description: "项目从待受理、立项、资源排期、实施、联调、验收到上线归档发生阶段变化。", priority: "中", channels: ["站内信"], configurable: true },
  { id: "project.record", domain: "项目", event: "项目记录修改", description: "项目经理维护里程碑、预算备注、风险原因或应对措施。", priority: "中", channels: ["站内信"], configurable: true },
  { id: "project.progress", domain: "项目", event: "交付阶段推进", description: "项目经理推进交付阶段并同步协作链路。", priority: "中", channels: ["站内信"], configurable: true },
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
  { id: "acceptance.started", domain: "验收", event: "验收发起", description: "产品经理发起业务验收，运营中心需要确认结果。", priority: "高", channels: ["站内信", "企业微信"], configurable: false },
  { id: "acceptance.score", domain: "验收", event: "验收评分提交", description: "运营完成交付评分和评价。", priority: "中", channels: ["站内信"], configurable: true },
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
    note: "高管默认接收管理例外、预算和重大交付风险，不接收普通任务流。"
  },
  {
    roleId: "pm",
    defaultOn: ["work.assigned", "delivery.submitted", "delivery.returned", "delivery.accepted", "project.stage", "project.progress", "project.record", "project.highRisk", "project.milestoneDelay", "resource.approval", "resource.submitted", "resource.overload", "budget.threshold", "task.due", "permission.changed"],
    optional: ["demand.new", "resource.approved", "acceptance.score", "integration.mcpError"],
    locked: ["work.assigned", "delivery.submitted", "project.highRisk", "resource.approval", "budget.threshold"],
    note: "项目经理关注资源、风险、预算、里程碑、权限和跨项目治理。"
  },
  {
    roleId: "itOwner",
    defaultOn: ["work.assigned", "delivery.submitted", "delivery.accepted", "project.highRisk", "project.milestoneDelay", "project.riskResponse", "resource.approval", "resource.submitted", "resource.overload", "budget.threshold", "integration.mcpError"],
    optional: ["project.stage", "project.progress", "project.record", "acceptance.score", "permission.changed"],
    locked: ["project.highRisk", "project.riskResponse", "resource.overload", "budget.threshold"],
    note: "项目经理叠加 IT负责人身份后，关注 IT部项目组合、供应商交付、资源预算和系统集成异常。"
  },
  {
    roleId: "product",
    defaultOn: ["work.assigned", "demand.new", "demand.accepted", "demand.scopeConfirm", "demand.acceptance", "delivery.returned", "delivery.accepted", "project.stage", "resource.approved", "acceptance.score"],
    optional: ["demand.priority", "project.highRisk", "delivery.submitted", "resource.submitted", "integration.mcpError"],
    locked: ["work.assigned", "demand.acceptance", "delivery.returned"],
    note: "产品经理关注需求承接、资源申请、实现进度和验收结果。"
  },
  {
    roleId: "requester",
    defaultOn: ["work.assigned", "demand.acceptance", "acceptance.started", "project.stage", "acceptance.score"],
    optional: ["project.milestoneDelay", "demand.priority", "demand.accepted"],
    locked: ["demand.acceptance"],
    note: "运营只接收本人需求的进度、里程碑和验收提醒。"
  },
  {
    roleId: "opsOwner",
    defaultOn: ["work.assigned", "demand.priority", "demand.acceptance", "acceptance.started", "project.milestoneDelay", "resource.overload", "acceptance.lowScore"],
    optional: ["demand.new", "demand.accepted", "project.stage", "project.progress", "acceptance.score"],
    locked: ["project.milestoneDelay", "acceptance.lowScore"],
    note: "运营角色叠加部门负责人身份后，关注本部门需求优先级、延期、验收和投入异常。"
  },
  {
    roleId: "developer",
    defaultOn: ["work.assigned", "task.assigned", "task.due", "task.worklog", "resource.approved"],
    optional: ["project.stage", "project.progress", "integration.mcpError"],
    locked: ["work.assigned", "task.assigned", "task.due"],
    note: "开发只接收个人执行相关通知，例如任务、排期和工时。"
  },
  {
    roleId: "rdOwner",
    defaultOn: ["work.assigned", "task.assigned", "task.due", "task.worklog", "resource.approved", "resource.overload", "project.milestoneDelay"],
    optional: ["project.stage", "project.progress", "project.highRisk", "demand.new", "integration.mcpError"],
    locked: ["resource.overload", "task.due"],
    note: "开发叠加研发负责人身份后，关注研发部任务、人员负载、技术联调和延期风险。"
  }
];

export const productWorkflowItems: ProductWorkflowItem[] = [
  {
    id: "WF-01",
    title: "产品评估 CRM 合规拜访改造",
    demandId: "REQ-2026-038",
    owner: "赵敏",
    stage: "产品评估",
    status: "进行中",
    description: "补齐业务目标、合规约束、审计留痕和移动端使用场景。",
    decision: "已确认拜访计划、签到定位、资料推送和医学审批为首期范围。",
    nextAction: "组织 CRM 供应商方案评审",
    artifacts: ["需求分析说明", "业务价值评分 88", "合规留痕清单"]
  },
  {
    id: "WF-02",
    title: "产品评估 SAP 财务供应链升级",
    demandId: "REQ-2026-041",
    owner: "陈彦",
    stage: "产品评估",
    status: "已完成",
    description: "结合长期维护、GxP 合规、数据安全、上线周期和预算选择实现方式。",
    decision: "SAP 核心模块升级采用外部 SAP 顾问实施，内部 IT 承接接口和数据治理。",
    nextAction: "推动主数据迁移和外围接口联调",
    artifacts: ["实现方式评估", "资源测算 132 人天", "主数据风险说明"]
  },
  {
    id: "WF-03",
    title: "项目申请准备",
    demandId: "REQ-2026-041",
    owner: "陈彦",
    stage: "项目申请",
    status: "待审批",
    description: "把产品评估结论、ABAP、接口开发、测试和验证资源需求整理为项目申请。",
    decision: "申请 ABAP 开发 2 人支持采购入库和批次成本接口。",
    nextAction: "等待项目经理受理项目申请并评估资源池负载",
    artifacts: ["资源申请单 RS-204", "排期草案", "技能栈要求"]
  },
  {
    id: "WF-04",
    title: "产品评估 CRM 供应商适配",
    demandId: "REQ-2026-038",
    owner: "赵敏",
    stage: "产品评估",
    status: "评估中",
    description: "比较 CRM 供应商产品能力、移动端适配、合规留痕、报价和交付周期。",
    decision: "星瀚 CRM 实施商综合评分最高，但预算需运营中心负责人确认。",
    nextAction: "提交商务评审材料",
    artifacts: ["供应商评分表", "技术适配清单", "报价对比"]
  },
  {
    id: "WF-05",
    title: "组织验收与评价",
    demandId: "REQ-2026-033",
    owner: "王骁",
    stage: "验收组织",
    status: "待业务评分",
    description: "邀请运营中心完成验收评分并沉淀验证与交付评价。",
    decision: "验证环境已准备，运营中心本周内完成评分。",
    nextAction: "跟进验收评分并归档验证包",
    artifacts: ["验收邀请", "验证测试通过报告", "上线检查表"]
  },
  {
    id: "WF-06",
    title: "确认纯内部实现边界",
    demandId: "REQ-2026-030",
    owner: "陈彦",
    stage: "产品评估",
    status: "交付中",
    description: "评估运营指标门户是否需要外部 BI 工具或供应商开发，最终确认复用内部数据平台实现。",
    decision: "不采购外部工具，研发部负责权限模型、报表页面和审计日志。",
    nextAction: "冻结指标口径并完成权限联调",
    artifacts: ["内部实现评估", "资源申请单 RS-181", "指标口径清单"]
  },
  {
    id: "WF-07",
    title: "产品评估纯外部供应商实施",
    demandId: "REQ-2026-014",
    owner: "陈彦",
    stage: "产品评估",
    status: "待踏勘",
    description: "确认培训中心音视频设备更新不需要内部开发，重点评估集成商方案、设备清单和交付窗口。",
    decision: "采用外部供应商完整实施，IT部项目经理负责合同、交付和风险治理。",
    nextAction: "完成现场踏勘并提交设备清单",
    artifacts: ["供应商踏勘计划", "预算预估 45 万", "验收标准草案"]
  }
];

export const projectRules: ProjectRule[] = [
  { stage: "待受理", deliverable: "项目申请、产品评估、资源测算、验收标准", owner: "项目经理", acceptance: "项目经理确认受理或退回补充" },
  { stage: "已立项", deliverable: "项目编号、负责人、里程碑、预算草案", owner: "项目经理 / IT负责人", acceptance: "项目经理完成立项，重大项目 IT负责人确认" },
  { stage: "资源排期中", deliverable: "人员排期、供应商计划、冲突处理记录", owner: "项目经理", acceptance: "资源和时间窗口可执行" },
  { stage: "实施中", deliverable: "任务拆解、工时记录、接口清单、供应商交付记录", owner: "项目经理 / 开发", acceptance: "关键任务按周更新状态" },
  { stage: "联调测试中", deliverable: "联调结果、缺陷清单、修复记录、验证材料", owner: "开发 / 项目经理", acceptance: "高优先级缺陷清零，交付可验收" },
  { stage: "验收支持中", deliverable: "验收邀请、评分、上线检查表、验证包", owner: "产品经理组织，项目经理支持", acceptance: "运营评分并确认结论" },
  { stage: "已上线", deliverable: "上线确认、回滚预案、运行观察记录", owner: "项目经理", acceptance: "上线完成且运行窗口无阻塞问题" },
  { stage: "已归档", deliverable: "上线复盘、供应商评分、预算归档", owner: "项目经理", acceptance: "复盘完成并归档绩效数据" }
];

export const projectDependencies: ProjectDependency[] = [
  {
    project: "SAP S/4HANA 财务供应链一体化",
    relation: "依赖",
    target: "主数据治理专项",
    impact: "影响物料、供应商和成本中心迁移准确性",
    status: "跟进中"
  },
  {
    project: "算力中心 GPU 集群一期",
    relation: "阻塞",
    target: "GPU 设备到货与机房电力扩容",
    impact: "影响集群压测和正式验收",
    status: "高风险"
  },
  {
    project: "LIMS 实验室系统升级",
    relation: "父子项目",
    target: "ELN 电子实验记录二期",
    impact: "LIMS 样本和结果数据将作为 ELN 二期集成基础",
    status: "已归档"
  },
  {
    project: "运营指标自助报表门户",
    relation: "依赖",
    target: "内部数据服务与权限中心",
    impact: "影响指标权限过滤、审计日志和报表导出准确性",
    status: "跟进中"
  },
  {
    project: "培训中心音视频设备更新",
    relation: "依赖",
    target: "培训中心场地空档期",
    impact: "影响供应商进场、布线施工和录播联动验收",
    status: "待确认"
  }
];

export const integrationEndpoints: IntegrationEndpoint[] = [
  { name: "项目查询", method: "GET", path: "/mcp/projects/{id}", capability: "按项目编号查询进度、预算、风险、验证状态和里程碑", status: "设计完成" },
  { name: "任务状态更新", method: "POST", path: "/mcp/tasks/{id}/status", capability: "通过机器人或外部系统更新任务状态", status: "待联调" },
  { name: "简易需求提交", method: "POST", path: "/mcp/demands", capability: "从企业微信机器人提交轻量 IT 需求", status: "待联调" },
  { name: "工时填报", method: "POST", path: "/mcp/worklogs", capability: "开发人员通过对话填报实际工时", status: "待联调" }
];

export const botMessages: BotMessage[] = [
  { speaker: "user", text: "查询 SAP S/4HANA 财务供应链一体化进度" },
  { speaker: "bot", text: "当前进度 58%，处于开发中。风险：主数据冻结窗口和外围接口排期依赖，项目经理已设置联调日历。" },
  { speaker: "user", text: "把 TASK-901 更新为测试中" },
  { speaker: "bot", text: "已识别任务：SAP 主数据迁移校验。状态更新申请已记录，等待接口联调确认。" },
  { speaker: "user", text: "提交一个 GxP 培训记录查询优化需求" },
  { speaker: "bot", text: "已生成简易需求草稿：GxP 培训记录查询优化，优先级 P2，待业务方补充目标和附件。" }
];

export const roleAccessPreviews: RoleAccessPreview[] = [
  {
    roleId: "admin",
    visibleModules: ["项目驾驶舱", "需求管理", "产品工作台", "项目管理", "任务与工时", "资源与预算", "绩效与报表", "系统设置"],
    actions: ["查看全量数据", "维护权限", "维护用户", "维护角色", "维护部门", "配置集成"],
    dataScope: "全量组织、角色、菜单、集成配置，以及全部 IT 项目数据"
  },
  {
    roleId: "executive",
    visibleModules: ["项目驾驶舱", "项目管理", "资源与预算", "绩效与报表"],
    actions: ["查看全局项目", "查看预算投入", "查看交付评分", "导出统计报告"],
    dataScope: "全公司 IT 项目、预算、资源和绩效汇总；不进入用户、角色、部门等系统配置"
  },
  {
    roleId: "pm",
    visibleModules: ["项目驾驶舱", "项目管理", "任务与工时", "资源与预算", "绩效与报表"],
    actions: ["审批资源", "维护项目规则", "管理风险", "管理供应商交付与合同预算", "查看项目参与人"],
    dataScope: "IT部项目池：软件、硬件、软硬件协同项目，并按内部、外部供应商、合作实现管理交付；不维护系统权限"
  },
  {
    roleId: "itOwner",
    visibleModules: ["项目驾驶舱", "产品工作台", "项目管理", "任务与工时", "资源与预算", "绩效与报表"],
    actions: ["指派产品经理", "以项目经理角色查看 IT部项目池", "以 IT负责人身份统筹资源预算", "管理供应商交付风险", "复核项目经理排期"],
    dataScope: "IT部全部项目、资源预算、供应商合同、风险和绩效；这是组织负责人身份，不是独立角色"
  },
  {
    roleId: "product",
    visibleModules: ["需求管理", "产品工作台", "项目管理", "绩效与报表"],
    actions: ["确认承接", "完成产品评估", "提交项目申请", "组织验收", "查看本人产品绩效"],
    dataScope: "本人承接或参与分析的需求、关联项目和产品绩效"
  },
  {
    roleId: "requester",
    visibleModules: ["需求管理"],
    actions: ["提交需求", "查看本人需求进度", "接收里程碑通知", "提交验收评分"],
    dataScope: "运营中心本人提交或需要本人验收的需求"
  },
  {
    roleId: "opsOwner",
    visibleModules: ["需求管理", "资源与预算", "绩效与报表"],
    actions: ["以运营角色查看本部门需求", "以部门负责人身份调整优先级", "介入修改", "查看资源投入", "确认验收评分"],
    dataScope: "运营中心全部需求、验收评分，以及运营中心提出需求对应的资源投入占用；这是组织负责人身份，不是独立角色"
  },
  {
    roleId: "developer",
    visibleModules: ["任务与工时"],
    actions: ["查看分配任务", "维护任务状态", "填报工时"],
    dataScope: "研发部开发人员本人任务、日/周/月排期和工时填报"
  },
  {
    roleId: "rdOwner",
    visibleModules: ["项目驾驶舱", "产品工作台", "任务与工时", "资源与预算", "绩效与报表"],
    actions: ["以开发角色查看研发部任务", "查看产品承接负载", "查看部门排期", "协调技术联调", "识别高负载人员"],
    dataScope: "研发部全部产品承接、开发任务、人员排期、技术联调和交付支持；这是组织负责人身份，不是独立角色"
  }
];
