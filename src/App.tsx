import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "./components/Layout";
import { deliveryRequests as initialDeliveryRequests, demands as initialDemands, demandProjectFlows as initialDemandProjectFlows, initialNotifications, initialTasks, navItems, projects as initialProjects, roleAccessPreviews, roles } from "./data";
import { Dashboard } from "./pages/Dashboard";
import { Demands } from "./pages/Demands";
import { Integrations } from "./pages/Integrations";
import { Notifications } from "./pages/Notifications";
import { Permissions } from "./pages/Permissions";
import { Profile } from "./pages/Profile";
import { Projects } from "./pages/Projects";
import { Reports } from "./pages/Reports";
import { Resources } from "./pages/Resources";
import { DepartmentSettings, NotificationSettings, RoleSettings, UserSettings } from "./pages/SystemSettings";
import { Tasks } from "./pages/Tasks";
import { ProductWorkflow } from "./pages/ProductWorkflow";
import type { AcceptanceReview, DeliveryRequest, Demand, DemandProjectFlow, FlowActionId, FlowActionLog, FlowNode, NotificationItem, PageId, Priority, ProfileTab, Project, ProjectActionLog, ProjectStage, RoleId, RoleOption, Task, TaskPresetFilter, TaskStatus } from "./types";

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [activeRole, setActiveRole] = useState<RoleId>("executive");
  const [demands, setDemands] = useState<Demand[]>(initialDemands);
  const [demandProjectFlows, setDemandProjectFlows] = useState<DemandProjectFlow[]>(initialDemandProjectFlows);
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>(initialDeliveryRequests);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [flowActionLogs, setFlowActionLogs] = useState<FlowActionLog[]>([]);
  const [projectActionLogs, setProjectActionLogs] = useState<ProjectActionLog[]>([]);
  const [taskPresetFilter, setTaskPresetFilter] = useState<TaskPresetFilter | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profileTab, setProfileTab] = useState<ProfileTab>("personal");
  const role = roles.find((item) => item.id === activeRole)!;
  const roleNotifications = useMemo(
    () =>
      activeRole === "admin"
        ? notifications
        : notifications.filter((item) => item.targetRoles.includes(activeRole) || item.targetUserNames?.includes(role.userName)),
    [activeRole, notifications, role.userName]
  );
  const visibleDemands = useMemo(() => {
    if (activeRole === "requester") return demands.filter((demand) => demand.requester === role.userName);
    if (role.isDepartmentOwner) return demands.filter((demand) => demand.team === role.department);
    return demands;
  }, [activeRole, demands, role.department, role.isDepartmentOwner, role.userName]);
  const unreadCount = roleNotifications.filter((item) => item.unread).length;
  const visibleNavItems = useMemo(() => {
    const access = roleAccessPreviews.find((item) => item.roleId === activeRole);
    if (!access) return navItems;
    return access.visibleModules
      .map((moduleLabel) => navItems.find((item) => item.label === moduleLabel))
      .filter((item): item is (typeof navItems)[number] => Boolean(item));
  }, [activeRole]);
  const visiblePageIds = useMemo(
    () => visibleNavItems.flatMap((item) => [item.id, ...(item.children?.map((child) => child.id) ?? [])]),
    [visibleNavItems]
  );

  useEffect(() => {
    if (activePage !== "profile" && visibleNavItems.length > 0 && !visiblePageIds.includes(activePage)) {
      setActivePage(visibleNavItems[0].id);
    }
  }, [activePage, visibleNavItems, visiblePageIds]);

  function updateDemandPriority(id: string, priority: Priority) {
    setDemands((items) =>
      items.map((demand) =>
        demand.id === id
          ? {
              ...demand,
              priority,
              priorityHistory: [`2026-05-25 部门负责人调整为 ${priority}`, ...demand.priorityHistory]
            }
          : demand
      )
    );
  }

  function submitAcceptanceReview(id: string, review: AcceptanceReview) {
    setDemands((items) =>
      items.map((demand) =>
        demand.id === id
          ? {
              ...demand,
              score: review.score,
              status: "已完成",
              progress: 100,
              acceptanceReview: review,
              lifecycleSteps: demand.lifecycleSteps.map((step) => ({ ...step, done: true, current: false }))
            }
          : demand
      )
    );
  }

  function changeTaskStatus(id: string, status: TaskStatus) {
    setTasks((items) => items.map((task) => (task.id === id ? { ...task, status } : task)));
  }

  function addWorklog(id: string, hours: number, note: string) {
    setTasks((items) =>
      items.map((task) =>
        task.id === id
          ? {
              ...task,
              actual: task.actual + hours,
              worklogs: [{ date: "2026-05-25", hours, note }, ...task.worklogs]
            }
          : task
      )
    );
  }

  function updateFlowNode(flowId: string, nodeId: string, patch: Partial<FlowNode>) {
    setDemandProjectFlows((items) =>
      items.map((flow) =>
        flow.id === flowId
          ? {
              ...flow,
              nodes: flow.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node))
            }
          : flow
      )
    );
  }

  function assignWork(targetUserName: string, relatedType: "demand" | "project" | "task" | "resource" | "flow", relatedId: string, summary: string) {
    if (relatedType === "project") {
      setProjects((items) => items.map((project) => (project.id === relatedId ? { ...project, owner: targetUserName, supplierManager: targetUserName } : project)));
    }
    if (relatedType === "demand") {
      setDemands((items) => items.map((demand) => (demand.id === relatedId ? { ...demand, handler: `${targetUserName} / 产品`, status: "产品评估中", progress: Math.max(demand.progress, 24) } : demand)));
      setDemandProjectFlows((items) =>
        items.map((flow) =>
          flow.demandId === relatedId
            ? {
                ...flow,
                currentNodeId: "evaluate",
                nodes: flow.nodes.map((node) => {
                  if (node.id === "assign") return { ...node, status: "已完成", owner: role.userName, description: `${role.userName} 指定 ${targetUserName} 承接需求，产品承接环节已开启。` };
                  if (node.id === "evaluate") return { ...node, status: "待确认", owner: targetUserName };
                  return node;
                })
              }
            : flow
        )
      );
      setDeliveryRequests((items) => items.map((request) => (request.demandId === relatedId ? { ...request, productOwner: targetUserName } : request)));
    }
    if (relatedType === "task") {
      setTasks((items) => items.map((task) => (task.id === relatedId ? { ...task, owner: targetUserName, status: "待开始" } : task)));
    }
    createNotification({
      title: `你有新的${relatedType === "project" ? "项目" : relatedType === "task" ? "任务" : "需求"}分配`,
      content: `${role.userName} 将 ${summary} 分配给你处理。`,
      type: "工作分配",
      level: "blue",
      channel: "企业微信",
      targetUserNames: [targetUserName],
      sourceUserName: role.userName,
      relatedType,
      relatedId
    });
  }

  function applyFlowAction(flowId: string, actionId: FlowActionId, note = "") {
    const flow = demandProjectFlows.find((item) => item.id === flowId);
    if (!flow) return;
    const demand = demands.find((item) => item.id === flow.demandId);
    const project = projects.find((item) => item.id === flow.projectId);
    const action = flowActionMeta[actionId];
    const targetNodeId = flowActionTargetNode[actionId];

    setDemandProjectFlows((items) => items.map((item) => (item.id === flowId ? reduceFlowByAction(item, actionId) : item)));
    setDemands((items) => items.map((item) => (item.id === flow.demandId ? reduceDemandByFlowAction(item, actionId) : item)));
    setProjects((items) => items.map((item) => (item.id === flow.projectId ? reduceProjectByFlowAction(item, actionId) : item)));
    setDeliveryRequests((items) => items.map((item) => (item.demandId === flow.demandId ? reduceDeliveryRequestByFlowAction(item, actionId) : item)));
    setFlowActionLogs((items) => [
      {
        id: `FL-${Date.now()}-${items.length + 1}`,
        flowId,
        actor: role.userName,
        roleId: activeRole,
        actionName: action.name,
        targetNodeId,
        time: nowText(),
        summary: withActionNote(action.summary(flow, demand, project), note)
      },
      ...items
    ]);

    createNotification(notificationForFlowAction(actionId, role, flow, demand, project, note));
  }

  function updateProjectRecord(projectId: string, patch: Partial<Project>, summary: string) {
    const project = projects.find((item) => item.id === projectId);
    setProjects((items) => items.map((item) => (item.id === projectId ? { ...item, ...patch } : item)));
    setProjectActionLogs((items) => [
      { id: `PL-${Date.now()}-${items.length + 1}`, projectId, actor: role.userName, roleId: activeRole, actionName: "修改项目记录", time: nowText(), summary },
      ...items
    ]);
    createNotification({
      title: `${project?.name ?? projectId} 项目记录已更新`,
      content: `${role.userName} 更新了项目记录：${summary}`,
      type: patch.risk || patch.riskResponse ? "风险应对更新" : "项目记录修改",
      level: patch.risk === "高" ? "red" : "orange",
      channel: "站内信",
      targetRoles: patch.risk === "高" ? ["executive", "itOwner"] : ["pm", "itOwner", "product"],
      targetUserNames: project ? [project.owner] : undefined,
      sourceUserName: role.userName,
      relatedType: "project",
      relatedId: projectId
    });
  }

  function advanceProjectStage(projectId: string, nextStage?: ProjectStage) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    const stage = nextStage ?? nextProjectStage(project.stage);
    setProjects((items) =>
      items.map((item) =>
        item.id === projectId
          ? {
              ...item,
              stage,
              progress: progressForStage(stage),
              stages: item.stages.map((entry) => ({ ...entry, done: projectStageOrder.indexOf(entry.name) <= projectStageOrder.indexOf(stage) }))
            }
          : item
      )
    );
    const relatedFlow = demandProjectFlows.find((item) => item.projectId === projectId);
    if (relatedFlow) {
      setDemandProjectFlows((items) => items.map((item) => (item.id === relatedFlow.id ? syncFlowWithProjectStage(item, stage) : item)));
    }
    setProjectActionLogs((items) => [
      { id: `PL-${Date.now()}-${items.length + 1}`, projectId, actor: role.userName, roleId: activeRole, actionName: "推进交付阶段", time: nowText(), summary: `阶段推进到 ${stage}` },
      ...items
    ]);
    createNotification({
      title: `${project.name} 阶段推进到 ${stage}`,
      content: `${role.userName} 将交付阶段推进到 ${stage}，请相关负责人同步处理后续事项。`,
      type: "交付阶段推进",
      level: stage === "已上线" ? "green" : "blue",
      channel: "站内信",
      targetRoles: ["product", "pm", "itOwner", "opsOwner"],
      targetUserNames: relatedFlow ? [...relatedFlow.assignments.map((item) => item.person), project.owner] : [project.owner],
      sourceUserName: role.userName,
      relatedType: "project",
      relatedId: projectId
    });
  }

  function createNotification(item: Omit<NotificationItem, "id" | "time" | "unread" | "targetRoles"> & { targetRoles?: RoleId[] }) {
    const targetRoles = item.targetRoles ?? roleIdsForUsers(item.targetUserNames ?? []);
    setNotifications((items) => [
      {
        ...item,
        id: `N-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        time: "刚刚",
        unread: true,
        targetRoles
      },
      ...items
    ]);
  }

  function toggleRead(id: string) {
    setNotifications((items) => items.map((item) => (item.id === id ? { ...item, unread: !item.unread } : item)));
  }

  function markVisibleNotificationsRead() {
    const visibleIds = new Set(roleNotifications.map((item) => item.id));
    setNotifications((items) => items.map((item) => (visibleIds.has(item.id) ? { ...item, unread: false } : item)));
  }

  function openProfile(tab: ProfileTab) {
    setProfileTab(tab);
    setActivePage("profile");
  }

  function openNotificationSettings() {
    if (activeRole === "admin") {
      setActivePage("notificationSettings");
    }
  }

  function openTaskFilter(filter: Omit<TaskPresetFilter, "nonce">) {
    setTaskPresetFilter({ ...filter, nonce: Date.now() });
    setActivePage("tasks");
  }

  return (
    <AppLayout
      navItems={visibleNavItems}
      roles={roles}
      activePage={activePage}
      activeRole={activeRole}
      unreadCount={unreadCount}
      theme={theme}
      onPageChange={setActivePage}
      onRoleChange={setActiveRole}
      onThemeChange={setTheme}
      onOpenProfile={() => openProfile("personal")}
      onOpenNotifications={() => openProfile("notifications")}
    >
      {activePage === "dashboard" ? <Dashboard role={activeRole} /> : null}
      {activePage === "demands" ? (
        <Demands
          demands={visibleDemands}
          flows={demandProjectFlows}
          activeUser={role}
          canAdjustPriority={activeRole === "admin" || activeRole === "product" || Boolean(role.isDepartmentOwner)}
          onPriorityChange={updateDemandPriority}
          onSubmitReview={submitAcceptanceReview}
          onAssignWork={assignWork}
        />
      ) : null}
      {activePage === "workflow" ? (
        <ProductWorkflow
          demands={demands}
          flows={demandProjectFlows}
          deliveryRequests={deliveryRequests}
          activeRole={activeRole}
          activeUser={role}
          flowActionLogs={flowActionLogs}
          canConfigureFlow={activeRole === "admin" || activeRole === "product"}
          onFlowNodeChange={updateFlowNode}
          onApplyFlowAction={applyFlowAction}
          onAssignWork={assignWork}
        />
      ) : null}
      {activePage === "projects" ? (
        <Projects
          projects={projects}
          tasks={tasks}
          flows={demandProjectFlows}
          deliveryRequests={deliveryRequests}
          activeRole={activeRole}
          activeUser={role}
          flowActionLogs={flowActionLogs}
          projectActionLogs={projectActionLogs}
          onApplyFlowAction={applyFlowAction}
          onAssignWork={assignWork}
          onUpdateProjectRecord={updateProjectRecord}
          onAdvanceProjectStage={advanceProjectStage}
          onOpenTaskFilter={openTaskFilter}
        />
      ) : null}
      {activePage === "tasks" ? <Tasks tasks={tasks} projects={projects} activeRole={activeRole} activeUser={role} presetFilter={taskPresetFilter} onStatusChange={changeTaskStatus} onAddWorklog={addWorklog} /> : null}
      {activePage === "resources" ? <Resources flows={demandProjectFlows} /> : null}
      {activePage === "reports" ? <Reports activeRole={activeRole} activeUser={role} demands={demands} tasks={tasks} flows={demandProjectFlows} /> : null}
      {activePage === "permissions" ? <Permissions activeRole={activeRole} /> : null}
      {activePage === "integrations" ? <Integrations /> : null}
      {activePage === "userSettings" ? <UserSettings /> : null}
      {activePage === "roleSettings" ? <RoleSettings activeRole={activeRole} /> : null}
      {activePage === "departmentSettings" ? <DepartmentSettings /> : null}
      {activePage === "notificationSettings" ? <NotificationSettings /> : null}
      {activePage === "notifications" ? (
        <Notifications
          activeRole={activeRole}
          notifications={roleNotifications}
          onToggleRead={toggleRead}
          onMarkAllRead={markVisibleNotificationsRead}
          onOpenNotificationSettings={activeRole === "admin" ? openNotificationSettings : undefined}
        />
      ) : null}
      {activePage === "profile" ? (
        <Profile
          activeRole={activeRole}
          roles={roles}
          activeTab={profileTab}
          notifications={roleNotifications}
          onTabChange={setProfileTab}
          onToggleRead={toggleRead}
          onMarkAllRead={markVisibleNotificationsRead}
          onOpenNotificationSettings={activeRole === "admin" ? openNotificationSettings : undefined}
        />
      ) : null}
    </AppLayout>
  );
}

const projectStageOrder: ProjectStage[] = ["待受理", "已立项", "资源排期中", "实施中", "联调测试中", "验收支持中", "已上线", "已归档"];

const flowActionTargetNode: Record<FlowActionId, string> = {
  "product.acceptDemand": "evaluate",
  "product.returnForSupplement": "businessConfirm",
  "product.saveEvaluation": "evaluate",
  "product.submitScopeConfirm": "businessConfirm",
  "product.decideImplementation": "resource",
  "product.startSupplierEvaluation": "resource",
  "product.createResourceEstimate": "resource",
  "product.submitDeliveryRequest": "resource",
  "product.withdrawDeliveryRequest": "resource",
  "product.startAcceptance": "acceptance",
  "product.recordAcceptanceIssue": "acceptance",
  "product.closeDemand": "online",
  "pm.acceptDeliveryRequest": "iteration",
  "pm.returnDeliveryRequest": "resource",
  "pm.createProject": "iteration",
  "pm.linkProject": "iteration",
  "pm.generateResourcePlan": "iteration",
  "pm.confirmResourceSchedule": "develop",
  "pm.assignSupplier": "iteration",
  "pm.updateBudget": "iteration",
  "pm.updateRiskResponse": "iteration",
  "pm.updateSupplierDelivery": "develop",
  "pm.enterIntegrationTest": "develop",
  "pm.enterAcceptanceSupport": "acceptance",
  "pm.submitArchive": "online"
};

const flowActionMeta: Record<FlowActionId, { name: string; summary: (flow: DemandProjectFlow, demand?: Demand, project?: Project) => string }> = {
  "product.acceptDemand": { name: "确认承接", summary: (_flow, demand) => `确认承接 ${demand?.name ?? "需求"}，进入产品评估。` },
  "product.returnForSupplement": { name: "退回补充", summary: (_flow, demand) => `退回 ${demand?.name ?? "需求"}，要求运营补充业务范围或验收标准。` },
  "product.saveEvaluation": { name: "保存评估", summary: (_flow, demand) => `保存 ${demand?.name ?? "需求"} 的价值、范围和可行性评估。` },
  "product.submitScopeConfirm": { name: "提交产品评估", summary: (_flow, demand) => `提交 ${demand?.name ?? "需求"} 的业务范围、验收标准和实现判断，请运营负责人确认业务边界。` },
  "product.decideImplementation": { name: "保存产品评估", summary: (flow) => `在产品评估中记录实现方式：${flow.mode}。` },
  "product.startSupplierEvaluation": { name: "保存供应商评估", summary: (flow) => `在产品评估中记录 ${flow.mode} 的供应商/技术适配判断。` },
  "product.createResourceEstimate": { name: "保存资源测算", summary: (flow) => `在产品评估中记录资源测算：${flow.resourceRequest.need}，预计 ${flow.resourceRequest.days} 天。` },
  "product.submitDeliveryRequest": { name: "提交项目申请", summary: (flow) => `提交项目申请，包含产品评估、实现方式、资源测算和验收标准：${flow.resourceRequest.need}。` },
  "product.withdrawDeliveryRequest": { name: "撤回项目申请", summary: (_flow, demand) => `撤回 ${demand?.name ?? "需求"} 的项目申请，回到产品评估补充。` },
  "product.startAcceptance": { name: "发起验收", summary: (_flow, demand) => `邀请运营中心对 ${demand?.name ?? "需求"} 进行验收。` },
  "product.recordAcceptanceIssue": { name: "记录验收问题", summary: (_flow, demand) => `记录 ${demand?.name ?? "需求"} 的验收问题，等待整改。` },
  "product.closeDemand": { name: "关闭需求", summary: (_flow, demand) => `${demand?.name ?? "需求"} 已完成业务闭环。` },
  "pm.acceptDeliveryRequest": { name: "受理项目申请", summary: (flow) => `受理 ${flow.resourceRequest.requester} 的项目申请，进入项目经理治理。` },
  "pm.returnDeliveryRequest": { name: "退回补充", summary: (_flow, demand) => `退回 ${demand?.name ?? "需求"} 的项目申请，请产品经理补充材料。` },
  "pm.createProject": { name: "转为新项目", summary: (_flow, _demand, project) => `${project?.name ?? "项目"} 已作为新项目进入立项。` },
  "pm.linkProject": { name: "关联已有项目", summary: (_flow, _demand, project) => `项目申请已关联到 ${project?.name ?? "已有项目"}。` },
  "pm.generateResourcePlan": { name: "生成资源计划", summary: (flow) => `生成资源计划：${flow.assignments.map((item) => `${item.person} ${item.hours}h`).join("、")}。` },
  "pm.confirmResourceSchedule": { name: "确认资源排期", summary: (flow) => `确认资源排期并通知 ${flow.assignments.map((item) => item.person).join("、")}。` },
  "pm.assignSupplier": { name: "指派供应商", summary: (_flow, _demand, project) => `确认 ${project?.name ?? "项目"} 的供应商交付负责人和合同跟进人。` },
  "pm.updateBudget": { name: "更新预算记录", summary: (_flow, _demand, project) => `更新 ${project?.name ?? "项目"} 的预算使用和付款备注。` },
  "pm.updateRiskResponse": { name: "更新风险应对", summary: (_flow, _demand, project) => `更新 ${project?.name ?? "项目"} 的风险应对措施。` },
  "pm.updateSupplierDelivery": { name: "更新供应商交付状态", summary: (_flow, _demand, project) => `更新 ${project?.name ?? "项目"} 的供应商交付状态。` },
  "pm.enterIntegrationTest": { name: "进入联调测试", summary: (_flow, _demand, project) => `${project?.name ?? "项目"} 进入联调测试。` },
  "pm.enterAcceptanceSupport": { name: "进入验收支持", summary: (_flow, _demand, project) => `${project?.name ?? "项目"} 进入验收支持，由产品经理组织业务验收。` },
  "pm.submitArchive": { name: "提交上线归档", summary: (_flow, _demand, project) => `${project?.name ?? "项目"} 已提交上线归档。` }
};

function reduceFlowByAction(flow: DemandProjectFlow, actionId: FlowActionId): DemandProjectFlow {
  if (actionId === "product.acceptDemand") return updateFlow(flow, "evaluate", { assign: "已完成", evaluate: "进行中" });
  if (actionId === "product.returnForSupplement") return updateFlow(flow, "businessConfirm", { businessConfirm: "待确认" });
  if (actionId === "product.saveEvaluation") return updateFlow(flow, "evaluate", { evaluate: "进行中" });
  if (actionId === "product.submitScopeConfirm") return updateFlow(flow, "businessConfirm", { evaluate: "已完成", businessConfirm: "待确认" });
  if (actionId === "product.decideImplementation") return updateFlow(flow, "resource", { businessConfirm: "已完成", resource: "待确认" });
  if (actionId === "product.startSupplierEvaluation") return updateFlow(flow, "resource", { resource: "进行中" });
  if (actionId === "product.createResourceEstimate") return { ...updateFlow(flow, "resource", { resource: "进行中" }), resourceRequest: { ...flow.resourceRequest, status: "测算中" } };
  if (actionId === "product.submitDeliveryRequest") return { ...updateFlow(flow, "resource", { evaluate: "已完成", resource: "待确认" }), resourceRequest: { ...flow.resourceRequest, status: "待项目经理受理" } };
  if (actionId === "product.withdrawDeliveryRequest") return { ...updateFlow(flow, "evaluate", { resource: "待开始", evaluate: "进行中" }), resourceRequest: { ...flow.resourceRequest, status: "已撤回" } };
  if (actionId === "product.startAcceptance") return updateFlow(flow, "acceptance", { develop: "已完成", acceptance: "待确认" });
  if (actionId === "product.recordAcceptanceIssue") return updateFlow(flow, "acceptance", { acceptance: "风险" });
  if (actionId === "product.closeDemand") return { ...flow, currentNodeId: "online", nodes: flow.nodes.map((node) => ({ ...node, status: "已完成" })) };
  if (actionId === "pm.acceptDeliveryRequest") return { ...updateFlow(flow, "iteration", { resource: "已完成", iteration: "进行中" }), resourceRequest: { ...flow.resourceRequest, status: "已受理" } };
  if (actionId === "pm.returnDeliveryRequest") return { ...updateFlow(flow, "resource", { resource: "待确认" }), resourceRequest: { ...flow.resourceRequest, status: "退回补充" } };
  if (actionId === "pm.createProject" || actionId === "pm.linkProject" || actionId === "pm.generateResourcePlan" || actionId === "pm.assignSupplier") return updateFlow(flow, "iteration", { iteration: "进行中" });
  if (actionId === "pm.confirmResourceSchedule") return { ...updateFlow(flow, "develop", { iteration: "已完成", develop: "进行中" }), resourceRequest: { ...flow.resourceRequest, status: "已批准" } };
  if (actionId === "pm.enterIntegrationTest") return updateFlow(flow, "develop", { develop: "进行中" });
  if (actionId === "pm.enterAcceptanceSupport") return updateFlow(flow, "acceptance", { develop: "已完成", acceptance: "待确认" });
  if (actionId === "pm.submitArchive") {
    return { ...flow, currentNodeId: "online", resourceRequest: { ...flow.resourceRequest, status: "已批准" }, nodes: flow.nodes.map((node) => ({ ...node, status: "已完成" })) };
  }
  return flow;
}

function updateFlow(flow: DemandProjectFlow, currentNodeId: string, statuses: Record<string, string>): DemandProjectFlow {
  return {
    ...flow,
    currentNodeId,
    nodes: flow.nodes.map((node) => ({ ...node, status: (statuses[node.id] ?? node.status) as typeof node.status }))
  };
}

function reduceDemandByFlowAction(demand: Demand, actionId: FlowActionId): Demand {
  if (actionId === "product.acceptDemand" || actionId === "product.saveEvaluation") {
    return { ...demand, status: "产品评估中", progress: Math.max(demand.progress, 35) };
  }
  if (actionId === "product.returnForSupplement") {
    return { ...demand, status: "待业务确认", progress: Math.max(demand.progress, 26) };
  }
  if (actionId === "product.submitScopeConfirm" || actionId === "product.decideImplementation" || actionId === "product.startSupplierEvaluation" || actionId === "product.createResourceEstimate") {
    return { ...demand, status: "产品评估中", progress: Math.max(demand.progress, 42) };
  }
  if (actionId === "product.submitDeliveryRequest" || actionId === "pm.acceptDeliveryRequest" || actionId === "pm.confirmResourceSchedule") {
    return { ...demand, status: actionId === "product.submitDeliveryRequest" ? "待项目受理" : "交付中", progress: Math.max(demand.progress, 55) };
  }
  if (actionId === "pm.enterAcceptanceSupport" || actionId === "product.startAcceptance") {
    return { ...demand, status: "待验收", progress: Math.max(demand.progress, 86) };
  }
  if (actionId === "pm.submitArchive" || actionId === "product.closeDemand") {
    return { ...demand, status: "已完成", progress: 100, lifecycleSteps: demand.lifecycleSteps.map((step) => ({ ...step, done: true, current: false })) };
  }
  return demand;
}

function reduceProjectByFlowAction(project: Project, actionId: FlowActionId): Project {
  if (actionId === "pm.acceptDeliveryRequest") return reduceProjectStage(project, "已立项");
  if (actionId === "pm.createProject" || actionId === "pm.linkProject" || actionId === "pm.generateResourcePlan") return reduceProjectStage(project, "资源排期中");
  if (actionId === "pm.confirmResourceSchedule") return reduceProjectStage(project, "实施中");
  if (actionId === "pm.enterIntegrationTest") return reduceProjectStage(project, "联调测试中");
  if (actionId === "pm.enterAcceptanceSupport" || actionId === "product.startAcceptance") return reduceProjectStage(project, "验收支持中");
  if (actionId === "pm.submitArchive") return reduceProjectStage(project, "已归档");
  if (actionId === "pm.updateRiskResponse") {
    return { ...project, riskResponse: `${project.riskResponse} 已补充资源冲突预案和每日跟进机制。` };
  }
  if (actionId === "pm.updateBudget") return { ...project, usedBudget: Math.min(project.budget, project.usedBudget + 20000) };
  if (actionId === "pm.updateSupplierDelivery") return { ...project, riskResponse: `${project.riskResponse} 已更新供应商交付状态和下一次检查点。` };
  return project;
}

function syncFlowWithProjectStage(flow: DemandProjectFlow, stage: ProjectStage): DemandProjectFlow {
  if (stage === "已立项" || stage === "资源排期中") return updateFlow(flow, "iteration", { resource: "已完成", iteration: "进行中" });
  if (stage === "实施中") return updateFlow(flow, "develop", { iteration: "已完成", develop: "进行中" });
  if (stage === "联调测试中") return updateFlow(flow, "develop", { develop: "进行中" });
  if (stage === "验收支持中") return updateFlow(flow, "acceptance", { develop: "已完成", acceptance: "待确认" });
  if (stage === "已上线" || stage === "已归档") return { ...flow, currentNodeId: "online", nodes: flow.nodes.map((node) => ({ ...node, status: "已完成" })) };
  return updateFlow(flow, "evaluate", { submit: "已完成", evaluate: "进行中" });
}

function reduceDeliveryRequestByFlowAction(request: DeliveryRequest, actionId: FlowActionId): DeliveryRequest {
  if (actionId === "product.submitDeliveryRequest") return { ...request, status: "待项目经理受理" };
  if (actionId === "product.withdrawDeliveryRequest") return { ...request, status: "草稿" };
  if (actionId === "pm.acceptDeliveryRequest") return { ...request, status: "已受理" };
  if (actionId === "pm.returnDeliveryRequest") return { ...request, status: "退回补充" };
  if (actionId === "pm.createProject" || actionId === "pm.linkProject" || actionId === "pm.confirmResourceSchedule") return { ...request, status: "已立项" };
  if (actionId === "pm.submitArchive" || actionId === "product.closeDemand") return { ...request, status: "已关闭" };
  return request;
}

function reduceProjectStage(project: Project, stage: ProjectStage): Project {
  return {
    ...project,
    stage,
    progress: progressForStage(stage),
    stages: project.stages.map((entry) => ({ ...entry, done: projectStageOrder.indexOf(entry.name) <= projectStageOrder.indexOf(stage) }))
  };
}

function nextProjectStage(stage: ProjectStage): ProjectStage {
  return projectStageOrder[Math.min(projectStageOrder.indexOf(stage) + 1, projectStageOrder.length - 1)];
}

function progressForStage(stage: ProjectStage) {
  const map: Record<ProjectStage, number> = {
    待受理: 12,
    已立项: 24,
    资源排期中: 36,
    实施中: 58,
    联调测试中: 76,
    验收支持中: 88,
    已上线: 96,
    已归档: 100
  };
  return map[stage];
}

function roleIdsForUsers(userNames: string[]): RoleId[] {
  return roles.filter((item) => userNames.includes(item.userName)).map((item) => item.id);
}

function notificationForFlowAction(actionId: FlowActionId, actor: RoleOption, flow: DemandProjectFlow, demand?: Demand, project?: Project, note = ""): Omit<NotificationItem, "id" | "time" | "unread" | "targetRoles"> & { targetRoles?: RoleId[] } {
  const noteText = note.trim() ? `备注：${note.trim()}` : "";
  const base = {
    sourceUserName: actor.userName,
    relatedType: "flow" as const,
    relatedId: flow.id
  };
  if (actionId === "product.submitScopeConfirm") {
    return {
      ...base,
      title: `${demand?.name ?? flow.title} 产品评估待确认`,
      content: compactContent(`${actor.userName} 提交了业务范围和验收标准确认，请运营负责人处理。`, noteText),
      channel: "企业微信",
      type: "产品评估待确认",
      level: "orange",
      targetRoles: ["opsOwner"],
      targetUserNames: demand ? ["周宁", demand.requester] : ["周宁"]
    };
  }
  if (actionId === "product.submitDeliveryRequest") {
    return {
      ...base,
      title: `${demand?.name ?? flow.title} 项目申请待受理`,
      content: compactContent(`${actor.userName} 提交项目申请：${flow.resourceRequest.need}，窗口 ${flow.resourceRequest.window}。`, noteText),
      channel: "企业微信",
      type: "项目申请提交",
      level: "orange",
      targetRoles: ["pm", "itOwner"],
      targetUserNames: project ? [project.owner, project.supplierManager] : undefined
    };
  }
  if (actionId === "pm.returnDeliveryRequest") {
    return {
      ...base,
      title: `${demand?.name ?? flow.title} 项目申请退回补充`,
      content: compactContent(`${actor.userName} 退回项目申请，请产品经理补充产品评估、资源或供应商材料。`, noteText),
      channel: "企业微信",
      type: "项目申请退回",
      level: "orange",
      targetRoles: ["product"],
      targetUserNames: [flow.resourceRequest.requester]
    };
  }
  if (actionId === "pm.acceptDeliveryRequest") {
    return {
      ...base,
      title: `${project?.name ?? flow.title} 项目申请已受理`,
      content: compactContent(`${actor.userName} 已受理项目申请，项目进入立项与资源排期。`, noteText),
      channel: "站内信",
      type: "项目申请受理",
      level: "blue",
      targetRoles: ["product", "itOwner"],
      targetUserNames: [flow.resourceRequest.requester]
    };
  }
  if (actionId === "pm.confirmResourceSchedule") {
    return {
      ...base,
      title: `${project?.name ?? flow.title} 资源排期已确认`,
      content: compactContent(`${actor.userName} 已安排 ${flow.assignments.map((item) => `${item.person} ${item.hours}h`).join("、")}。`, noteText),
      channel: "站内信",
      type: "资源排期确认",
      level: "green",
      targetRoles: ["product", "developer", "rdOwner"],
      targetUserNames: [flow.resourceRequest.requester, ...flow.assignments.map((item) => item.person)]
    };
  }
  if (actionId === "product.startAcceptance") {
    return {
      ...base,
      title: `${demand?.name ?? flow.title} 已发起验收`,
      content: compactContent(`${actor.userName} 邀请运营中心验收，请完成业务确认和评分。`, noteText),
      channel: "企业微信",
      type: "验收发起",
      level: "green",
      targetRoles: ["requester", "opsOwner"],
      targetUserNames: demand ? [demand.requester, "周宁"] : ["周宁"]
    };
  }
  if (actionId === "pm.updateRiskResponse") {
    return {
      ...base,
      title: `${project?.name ?? flow.title} 风险应对已更新`,
      content: compactContent(`${actor.userName} 更新了项目风险应对，请关注预算、供应商和里程碑影响。`, noteText),
      channel: "站内信",
      type: "风险应对更新",
      level: project?.risk === "高" ? "red" : "orange",
      targetRoles: project?.risk === "高" ? ["executive", "itOwner"] : ["itOwner", "product"]
    };
  }
  if (actionId === "pm.submitArchive") {
    return {
      ...base,
      title: `${project?.name ?? flow.title} 已提交上线归档`,
      content: compactContent(`${actor.userName} 已完成上线确认，后续进入归档和复盘。`, noteText),
      channel: "站内信",
      type: "上线归档",
      level: "green",
      targetRoles: ["executive", "product", "opsOwner", "pm", "itOwner"]
    };
  }
  return {
    ...base,
    title: `${flow.title} 已更新`,
    content: compactContent(`${actor.userName} 执行了「${flowActionMeta[actionId].name}」，当前流程节点已同步更新。`, noteText),
    channel: "站内信",
      type: actionId.startsWith("product") ? "需求承接" : "交付阶段推进",
    level: actionId.startsWith("product") ? "blue" : "cyan",
    targetRoles: actionId.startsWith("product") ? ["requester", "opsOwner", "pm", "itOwner"] : ["product", "opsOwner", "developer", "rdOwner"]
  };
}

function withActionNote(summary: string, note: string) {
  return note.trim() ? `${summary} 备注：${note.trim()}` : summary;
}

function compactContent(content: string, noteText: string) {
  return noteText ? `${content} ${noteText}` : content;
}

function nowText() {
  return "刚刚";
}
