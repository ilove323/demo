import type { LucideIcon } from "lucide-react";

export type RoleId = "admin" | "executive" | "pm" | "itOwner" | "product" | "requester" | "opsOwner" | "developer" | "rdOwner";

export type PageId =
  | "dashboard"
  | "demands"
  | "workflow"
  | "projects"
  | "tasks"
  | "resources"
  | "reports"
  | "permissions"
  | "integrations"
  | "systemSettings"
  | "userSettings"
  | "roleSettings"
  | "departmentSettings"
  | "notificationSettings"
  | "notifications"
  | "profile";

export type ProfileTab = "personal" | "notifications";

export type DemandStatus = "待业务确认" | "待产品承接" | "产品评估中" | "待项目受理" | "交付中" | "待验收" | "已完成" | "暂停";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type ImplementationType = "内部实现" | "外部供应商" | "合作实现";
export type ProjectType = "软件项目" | "硬件项目" | "软硬件协同";
export type ProjectStage = "待受理" | "已立项" | "资源排期中" | "实施中" | "联调测试中" | "验收支持中" | "已上线" | "已归档";
export type TaskStatus = "待开始" | "进行中" | "测试中" | "已完成" | "暂停";
export type RiskLevel = "低" | "中" | "高";
export type NotificationChannel = "站内信" | "企业微信" | "机器人";
export type NotificationDomain = "需求" | "项目" | "任务" | "资源" | "预算" | "验收" | "权限" | "集成";
export type NotificationPriority = "高" | "中" | "低";
export type Tone = "blue" | "green" | "orange" | "red" | "cyan" | "violet" | "gray";

export interface RoleOption {
  id: RoleId;
  label: string;
  description: string;
  userName: string;
  department: string;
  email: string;
  phone: string;
  organizationTitle?: string;
  isDepartmentOwner?: boolean;
}

export interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export interface Metric {
  label: string;
  value: string;
  delta: string;
  tone: Tone;
}

export interface DashboardConfig {
  title: string;
  subtitle: string;
  metrics: Metric[];
  focusTitle: string;
  todos: string[];
}

export interface Demand {
  id: string;
  name: string;
  requester: string;
  team: string;
  priority: Priority;
  status: DemandStatus;
  handler: string;
  progress: number;
  targetDate: string;
  implementation: ImplementationType;
  objective: string;
  description: string;
  milestones: string[];
  comments: string[];
  linkedProject: string;
  score?: number;
  analysis: DemandAnalysis;
  acceptanceReview?: AcceptanceReview;
  priorityHistory: string[];
  lifecycleSteps: { name: string; done: boolean; current?: boolean }[];
}

export interface DemandAnalysis {
  feasibility: string;
  valueScore: number;
  implementationReason: string;
  resourcePlan: string;
  iteration: string;
}

export interface AcceptanceReview {
  score: number;
  comment: string;
  conclusion: string;
  reviewer: string;
  date: string;
}

export interface Project {
  id: string;
  name: string;
  demandId: string;
  owner: string;
  supplierManager: string;
  projectType: ProjectType;
  implementation: ImplementationType;
  stage: ProjectStage;
  progress: number;
  budget: number;
  usedBudget: number;
  personDays: number;
  risk: RiskLevel;
  riskReason: string;
  riskResponse: string;
  aiScore: ProjectAiScore;
  stages: { name: ProjectStage; done: boolean }[];
  milestones: { name: string; date: string; status: string }[];
  resources: string[];
  taskIds: string[];
  contributions: ContributionItem[];
}

export interface ProjectAiScore {
  businessValue: number;
  urgency: number;
  feasibility: number;
  total: number;
  recommendation: "推荐立项" | "谨慎推荐" | "暂不推荐";
  reasons: string[];
}

export interface ContributionItem {
  party: string;
  type: "内部IT" | "外部供应商" | "业务方";
  responsibility: string;
  effort: string;
  cost: string;
  status: string;
}

export interface ProductWorkflowItem {
  id: string;
  title: string;
  demandId: string;
  owner: string;
  stage: string;
  status: string;
  description: string;
  decision: string;
  nextAction: string;
  artifacts: string[];
}

export type DeliveryRequestStatus = "草稿" | "待项目经理受理" | "已受理" | "退回补充" | "已立项" | "已关闭";

export interface DeliveryRequest {
  id: string;
  demandId: string;
  projectId?: string;
  title: string;
  productOwner: string;
  projectManager: string;
  requestedMode: ImplementationType;
  resourceNeed: string;
  supplierNeed: string;
  status: DeliveryRequestStatus;
  submittedAt: string;
  decision: string;
}

export type FlowLane = "运营中心" | "产品经理" | "项目经理 / IT部" | "研发部 / 开发" | "外部供应商" | "高管关注";
export type FlowNodeStatus = "待开始" | "进行中" | "待确认" | "已完成" | "风险";

export interface FlowNode {
  id: string;
  name: string;
  lane: FlowLane;
  owner: string;
  status: FlowNodeStatus;
  deliverable: string;
  description: string;
  configurable: boolean;
}

export interface ResourceAssignmentPlan {
  id: string;
  role: string;
  person: string;
  dateRange: string;
  hours: number;
  workload: string;
  conflict: string;
  sourceCalendarDates: string[];
}

export interface DemandProjectFlow {
  id: string;
  demandId: string;
  projectId: string;
  title: string;
  mode: ImplementationType;
  currentNodeId: string;
  resourceRequest: {
    requester: string;
    need: string;
    days: number;
    window: string;
    status: string;
  };
  nodes: FlowNode[];
  assignments: ResourceAssignmentPlan[];
}

export interface ProjectRule {
  stage: string;
  deliverable: string;
  owner: string;
  acceptance: string;
}

export interface ProjectDependency {
  project: string;
  relation: string;
  target: string;
  impact: string;
  status: string;
}

export interface IntegrationEndpoint {
  name: string;
  method: string;
  path: string;
  capability: string;
  status: string;
}

export interface BotMessage {
  speaker: "user" | "bot";
  text: string;
}

export interface RoleAccessPreview {
  roleId: RoleId;
  visibleModules: string[];
  actions: string[];
  dataScope: string;
}

export interface Worklog {
  date: string;
  hours: number;
  note: string;
}

export interface Task {
  id: string;
  title: string;
  projectId: string;
  project: string;
  owner: string;
  status: TaskStatus;
  estimate: number;
  actual: number;
  due: string;
  role: string;
  description: string;
  worklogs: Worklog[];
}

export interface ResourcePerson {
  name: string;
  role: string;
  skills: string[];
  capacity: number;
  assigned: number;
  allocations: PersonAllocation[];
}

export type CalendarViewMode = "day" | "week" | "month";

export interface ResourceCalendarEntry {
  person: string;
  date: string;
  taskId: string;
  task: string;
  projectId: string;
  project: string;
  hours: number;
  status: string;
  timeSlot: "上午" | "下午" | "全天";
}

export interface PersonAllocation {
  project: string;
  work: string;
  hours: number;
  status: string;
}

export interface TaskPresetFilter {
  projectId?: string;
  projectName?: string;
  taskId?: string;
  keyword?: string;
  nonce: number;
}

export interface ResourceRequest {
  id: string;
  project: string;
  requester: string;
  need: string;
  days: number;
  status: string;
}

export interface SupplierBudget {
  supplier: string;
  project: string;
  manager: string;
  contract: number;
  used: number;
  payment: string;
  deliveryStatus: string;
  riskStatus: string;
}

export interface ProjectInvestmentBreakdown {
  project: string;
  internalDays: number;
  supplierCost: number;
  supplierRole: string;
  businessRole: string;
  status: string;
}

export interface ReportDatum {
  label: string;
  value: number;
}

export interface User {
  id?: string;
  name: string;
  department: string;
  departmentId?: string;
  roleId?: RoleId;
  role: string;
  organizationTitle?: string;
  isDepartmentOwner?: boolean;
  status: string;
  scope: string;
  dataScope?: "全局" | "本部门" | "本人";
}

export interface Department {
  id: string;
  name: string;
  ownerUserIds: string[];
  memberUserIds: string[];
  scope: string;
  status: string;
}

export interface PermissionRow {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  approve: boolean;
  export: boolean;
  scope: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  channel: NotificationChannel;
  type: string;
  time: string;
  unread: boolean;
  level: Tone;
  targetRoles: RoleId[];
  targetUserNames?: string[];
  sourceUserName?: string;
  relatedType?: "demand" | "project" | "task" | "resource" | "flow";
  relatedId?: string;
}

export interface NotificationCatalogItem {
  id: string;
  domain: NotificationDomain;
  event: string;
  description: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  configurable: boolean;
}

export interface RoleNotificationSubscription {
  roleId: RoleId;
  defaultOn: string[];
  optional: string[];
  locked: string[];
  note: string;
}

export type FlowActionId =
  | "product.acceptDemand"
  | "product.returnForSupplement"
  | "product.saveEvaluation"
  | "product.submitScopeConfirm"
  | "product.decideImplementation"
  | "product.startSupplierEvaluation"
  | "product.createResourceEstimate"
  | "product.submitDeliveryRequest"
  | "product.withdrawDeliveryRequest"
  | "product.startAcceptance"
  | "product.recordAcceptanceIssue"
  | "product.closeDemand"
  | "pm.acceptDeliveryRequest"
  | "pm.returnDeliveryRequest"
  | "pm.createProject"
  | "pm.linkProject"
  | "pm.generateResourcePlan"
  | "pm.confirmResourceSchedule"
  | "pm.assignSupplier"
  | "pm.updateBudget"
  | "pm.updateRiskResponse"
  | "pm.updateSupplierDelivery"
  | "pm.enterIntegrationTest"
  | "pm.enterAcceptanceSupport"
  | "pm.submitArchive";

export interface FlowBoardAction {
  id: FlowActionId;
  label: string;
  description: string;
  stage: string;
  tone: Tone;
  disabled?: boolean;
}

export interface FlowActionLog {
  id: string;
  flowId: string;
  actor: string;
  roleId: RoleId;
  actionName: string;
  targetNodeId: string;
  time: string;
  summary: string;
}

export interface ProjectActionLog {
  id: string;
  projectId: string;
  actor: string;
  roleId: RoleId;
  actionName: string;
  time: string;
  summary: string;
}
