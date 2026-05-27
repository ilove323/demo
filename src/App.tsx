import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "./components/Layout";
import { deliveryRequests as initialDeliveryRequests, demands as initialDemands, demandProjectFlows as initialDemandProjectFlows, initialNotifications, initialTasks, navItems, projects as initialProjects, roleAccessPreviews, roles } from "./data";
import { Dashboard } from "./pages/Dashboard";
import { Demands } from "./pages/Demands";
import { DemandDetail } from "./pages/DemandDetail";
import { Integrations } from "./pages/Integrations";
import { Notifications } from "./pages/Notifications";
import { Permissions } from "./pages/Permissions";
import { Profile } from "./pages/Profile";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Projects } from "./pages/Projects";
import { Reports } from "./pages/Reports";
import { Resources } from "./pages/Resources";
import { DepartmentSettings, NotificationSettings, RoleSettings, UserSettings } from "./pages/SystemSettings";
import { Tasks } from "./pages/Tasks";
import type { AcceptanceReview, DeliveryRequest, Demand, DemandAnalysis, DemandProjectFlow, FlowActionId, FlowActionLog, FlowNode, NotificationItem, PageId, Priority, ProfileTab, Project, ProjectActionLog, ProjectStage, ResourceAssignmentPlan, RoleId, RoleOption, Task, TaskPresetFilter, TaskStatus, WorkflowStageId } from "./types";

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
  const [detailView, setDetailView] = useState<{ type: "demand" | "project"; id: string; from: PageId } | null>(null);
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
    if (activeRole === "businessOwner") return demands.filter((demand) => demand.team === role.department);
    return demands;
  }, [activeRole, demands, role.department, role.userName]);
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
      setDetailView(null);
    }
  }, [activePage, visibleNavItems, visiblePageIds]);

  const detailDemand = detailView?.type === "demand" ? demands.find((item) => item.id === detailView.id) : undefined;
  const detailProject = detailView?.type === "project" ? projects.find((item) => item.id === detailView.id) : undefined;

  useEffect(() => {
    if (!detailView) return;
    if (detailView.type === "demand" && !detailDemand) setDetailView(null);
    if (detailView.type === "project" && !detailProject) setDetailView(null);
  }, [detailDemand, detailProject, detailView]);

  function changePage(page: PageId) {
    setDetailView(null);
    setActivePage(page);
  }

  function openDemandDetail(id: string) {
    setDetailView({ type: "demand", id, from: activePage });
  }

  function openProjectDetail(id: string) {
    setDetailView({ type: "project", id, from: activePage });
  }

  function closeDetail() {
    setDetailView(null);
    if (detailView?.from) {
      setActivePage(detailView.from);
    }
  }

  function updateDemandPriority(id: string, priority: Priority) {
    setDemands((items) =>
      items.map((demand) =>
        demand.id === id
          ? {
              ...demand,
              priority,
              priorityHistory: [`2026-05-25 需求方负责人调整为 ${priority}`, ...demand.priorityHistory]
            }
          : demand
      )
    );
  }

  function updateDemandAnalysis(id: string, analysis: DemandAnalysis, summary: string) {
    setDemands((items) =>
      items.map((demand) =>
        demand.id === id
          ? {
              ...demand,
              analysis,
              comments: [`2026-05-27 ${role.userName} 更新需求评审：${summary}`, ...demand.comments]
            }
          : demand
      )
    );
    if (analysis.budgetEstimate > 0) {
      setProjects((items) =>
        items.map((project) =>
          project.demandId === id
            ? {
                ...project,
                budget: analysis.budgetEstimate
              }
            : project
        )
      );
    }
    createNotification({
      title: `${id} 需求评审字段已更新`,
      content: `${role.userName} 更新了价值评分、迭代版本、资源方案、预算测算和实现决策：${summary}`,
      type: "需求评审更新",
      level: "blue",
      channel: "站内信",
      targetRoles: ["product", "requester", "businessOwner"],
      sourceUserName: role.userName,
      relatedType: "demand",
      relatedId: id
    });
  }

  function submitAcceptanceReview(id: string, review: AcceptanceReview) {
    setDemands((items) =>
      items.map((demand) =>
        demand.id === id
          ? {
              ...demand,
              score: review.score,
              status: "验收完成",
              progress: 100,
              acceptanceReview: review,
              lifecycleSteps: demand.lifecycleSteps.map((step) => ({ ...step, done: true, current: false }))
            }
          : demand
      )
    );
  }

  function changeTaskStatus(id: string, status: TaskStatus) {
    const task = tasks.find((item) => item.id === id);
    setTasks((items) => items.map((task) => (task.id === id ? { ...task, status } : task)));
    if (task && status === "已完成") {
      const flow = demandProjectFlows.find((item) => item.projectId === task.projectId);
      if (flow) applyFlowAction(flow.id, "developer.completeTask", `${task.title} 已完成。`);
    }
  }

  function addWorklog(id: string, hours: number, note: string) {
    const task = tasks.find((item) => item.id === id);
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
    if (task) {
      const flow = demandProjectFlows.find((item) => item.projectId === task.projectId);
      if (flow) applyFlowAction(flow.id, "developer.updateProgress", `${task.title} 登记 ${hours}h：${note}`);
    }
  }

  function createTask(projectId: string, parentTaskId: string | undefined, title: string, estimate: number, startDate: string, due: string, note: string) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    const newTask: Task = {
      id: `TASK-${Date.now().toString().slice(-6)}`,
      parentTaskId,
      title,
      projectId,
      project: project.name,
      owner: role.userName,
      status: "待开始",
      estimate,
      actual: 0,
      startDate,
      due,
      role: "开发",
      description: note,
      progressNote: note,
      worklogs: []
    };
    setTasks((items) => [newTask, ...items]);
    setProjects((items) => items.map((item) => (item.id === projectId ? { ...item, taskIds: [newTask.id, ...item.taskIds] } : item)));
    const flow = demandProjectFlows.find((item) => item.projectId === projectId);
    if (flow) {
      applyFlowAction(flow.id, "developer.createTask", parentTaskId ? `从 ${parentTaskId} 拆分：${note}` : note);
    }
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

  function updateFlowAssignments(flowId: string, assignments: ResourceAssignmentPlan[], summary: string) {
    const flow = demandProjectFlows.find((item) => item.id === flowId);
    if (!flow) return;
    const assignedPeople = assignments.map((item) => item.person);
    setDemandProjectFlows((items) =>
      items.map((item) =>
        item.id === flowId
          ? {
              ...item,
              assignments,
              nodes: item.nodes.map((node) =>
                node.stageId === "projectExecution"
                  ? {
                      ...node,
                      owner: assignedPeople.length > 0 ? assignedPeople.join(" / ") : node.owner,
                      description: summary
                    }
                  : node
              )
            }
          : item
      )
    );
    setFlowActionLogs((items) => [
      {
        id: `FL-${Date.now()}-${items.length + 1}`,
        flowId,
        actor: role.userName,
        roleId: activeRole,
        actionName: "分配开发/供应商",
        targetNodeId: "projectExecution",
        time: nowText(),
        summary,
        note: summary
      },
      ...items
    ]);
    createNotification({
      title: `${flow.title} 资源分配已更新`,
      content: `${role.userName} 更新了开发与供应商分配：${summary}`,
      type: "工作分配",
      level: "blue",
      channel: "企业微信",
      targetRoles: ["pm", "product", "developer"],
      targetUserNames: assignedPeople,
      sourceUserName: role.userName,
      relatedType: "flow",
      relatedId: flowId
    });
  }

  function assignWork(targetUserName: string, relatedType: "demand" | "project" | "task" | "resource" | "flow", relatedId: string, summary: string) {
    if (relatedType === "project") {
      setProjects((items) => items.map((project) => (project.id === relatedId ? { ...project, owner: targetUserName, supplierManager: targetUserName } : project)));
    }
    if (relatedType === "demand") {
      setDemands((items) => items.map((demand) => (demand.id === relatedId ? { ...demand, handler: `${targetUserName} / 产品`, status: "需求评审", progress: Math.max(demand.progress, 24) } : demand)));
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
        summary: withActionNote(action.summary(flow, demand, project), note),
        note: note.trim() || undefined
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
      targetRoles: patch.risk === "高" ? ["executive", "pm"] : ["pm", "product"],
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
      level: stage === "验收完成" ? "green" : "blue",
      channel: "站内信",
      targetRoles: ["product", "pm", "businessOwner"],
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
    setDetailView(null);
    setProfileTab(tab);
    setActivePage("profile");
  }

  function openNotificationSettings() {
    if (activeRole === "admin") {
      setDetailView(null);
      setActivePage("notificationSettings");
    }
  }

  function openTaskFilter(filter: Omit<TaskPresetFilter, "nonce">) {
    setDetailView(null);
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
      onPageChange={changePage}
      onRoleChange={(nextRole) => {
        setDetailView(null);
        setActiveRole(nextRole);
      }}
      onThemeChange={setTheme}
      onOpenProfile={() => openProfile("personal")}
      onOpenNotifications={() => openProfile("notifications")}
    >
      {detailView?.type === "demand" && detailDemand ? (
        <DemandDetail
          demand={detailDemand}
          flow={demandProjectFlows.find((flow) => flow.demandId === detailDemand.id)}
          activeRole={activeRole}
          activeUser={role}
          flowActionLogs={flowActionLogs}
          canAdjustPriority={activeRole === "admin" || activeRole === "businessOwner"}
          onBack={closeDetail}
          onPriorityChange={updateDemandPriority}
          onSubmitReview={submitAcceptanceReview}
          onUpdateAnalysis={updateDemandAnalysis}
          onApplyFlowAction={applyFlowAction}
          onAssignWork={assignWork}
        />
      ) : null}
      {detailView?.type === "project" && detailProject ? (
        <ProjectDetail
          project={detailProject}
          demand={demands.find((demand) => demand.id === detailProject.demandId)}
          projects={projects}
          tasks={tasks}
          flow={demandProjectFlows.find((flow) => flow.projectId === detailProject.id || flow.demandId === detailProject.demandId)}
          deliveryRequest={deliveryRequests.find((request) => request.projectId === detailProject.id || request.demandId === detailProject.demandId)}
          activeRole={activeRole}
          activeUser={role}
          flowActionLogs={flowActionLogs}
          projectActionLogs={projectActionLogs}
          onBack={closeDetail}
          onApplyFlowAction={applyFlowAction}
          onAssignWork={assignWork}
          onUpdateFlowAssignments={updateFlowAssignments}
          onUpdateProjectRecord={updateProjectRecord}
          onAdvanceProjectStage={advanceProjectStage}
          onOpenTaskFilter={openTaskFilter}
        />
      ) : null}
      {detailView ? null : (
        <>
      {activePage === "dashboard" ? <Dashboard role={activeRole} projects={projects} tasks={tasks} flows={demandProjectFlows} onOpenProjectDetail={openProjectDetail} /> : null}
      {activePage === "demands" ? (
        <Demands
          demands={visibleDemands}
          canAdjustPriority={activeRole === "admin" || activeRole === "businessOwner"}
          canCreateDemand={["admin", "requester", "businessOwner"].includes(activeRole)}
          onPriorityChange={updateDemandPriority}
          onOpenDetail={openDemandDetail}
        />
      ) : null}
      {activePage === "projects" ? (
        <Projects
          demands={demands}
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
          onOpenDetail={openProjectDetail}
        />
      ) : null}
      {activePage === "tasks" ? <Tasks tasks={tasks} projects={projects} activeRole={activeRole} activeUser={role} presetFilter={taskPresetFilter} onStatusChange={changeTaskStatus} onAddWorklog={addWorklog} onCreateTask={createTask} /> : null}
      {activePage === "resources" ? <Resources flows={demandProjectFlows} /> : null}
      {activePage === "reports" ? <Reports activeRole={activeRole} activeUser={role} demands={demands} tasks={tasks} flows={demandProjectFlows} onOpenProjectDetail={openProjectDetail} /> : null}
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
        </>
      )}
    </AppLayout>
  );
}

const projectStageOrder: ProjectStage[] = ["项目启动", "项目进行", "项目验收", "验收完成"];
const workflowStageOrder: WorkflowStageId[] = ["draft", "demandReview", "solutionConfirm", "projectStart", "projectExecution", "projectAcceptance", "acceptedComplete"];

const flowActionTargetNode: Record<FlowActionId, WorkflowStageId> = {
  "requester.submitReview": "demandReview",
  "product.returnDemand": "draft",
  "product.submitSolution": "solutionConfirm",
  "requester.abandonDemand": "acceptedComplete",
  "requester.submitProjectRequest": "projectStart",
  "pm.startProject": "projectExecution",
  "pm.returnSolution": "solutionConfirm",
  "pm.assignDevelopers": "projectExecution",
  "developer.createTask": "projectExecution",
  "developer.updateProgress": "projectExecution",
  "developer.completeTask": "projectExecution",
  "pm.submitAcceptance": "projectAcceptance",
  "product.completeAcceptance": "acceptedComplete",
  "product.returnExecution": "projectExecution",
  "requester.submitScore": "acceptedComplete"
};

const flowActionMeta: Record<FlowActionId, { name: string; summary: (flow: DemandProjectFlow, demand?: Demand, project?: Project) => string }> = {
  "requester.submitReview": { name: "发起需求评审", summary: (_flow, demand) => `${demand?.requester ?? "需求方"} 发起 ${demand?.name ?? "需求"} 评审。` },
  "product.returnDemand": { name: "打回需求", summary: (_flow, demand) => `产品经理打回 ${demand?.name ?? "需求"}，要求需求方补充背景、目标或价值。` },
  "product.submitSolution": { name: "发起方案确认", summary: (_flow, demand) => `产品经理完成 ${demand?.name ?? "需求"} 评审，提交方案、资源投入和 AI 评分给需求方确认。` },
  "requester.abandonDemand": { name: "放弃需求", summary: (_flow, demand) => `${demand?.requester ?? "需求方"} 放弃 ${demand?.name ?? "需求"}，流程关闭。` },
  "requester.submitProjectRequest": { name: "发起项目申请", summary: (flow) => `需求方确认方案并发起项目申请：${flow.resourceRequest.need}。` },
  "pm.startProject": { name: "项目启动", summary: (_flow, _demand, project) => `唯一项目经理确认资源可用，启动 ${project?.name ?? "项目"}。` },
  "pm.returnSolution": { name: "退回方案确认", summary: (_flow, demand) => `项目经理退回 ${demand?.name ?? "需求"} 的方案确认，请需求方和产品经理补充资源或范围。` },
  "pm.assignDevelopers": { name: "指派开发", summary: (flow) => `项目经理指派开发：${flow.assignments.map((item) => item.person).join("、")}。` },
  "developer.createTask": { name: "新增子任务", summary: (_flow, _demand, project) => `开发为 ${project?.name ?? "项目"} 新增子任务并估算工时。` },
  "developer.updateProgress": { name: "汇报进度", summary: (_flow, _demand, project) => `开发更新 ${project?.name ?? "项目"} 任务进度和工时。` },
  "developer.completeTask": { name: "完成任务", summary: (_flow, _demand, project) => `开发完成 ${project?.name ?? "项目"} 下的任务。` },
  "pm.submitAcceptance": { name: "项目验收", summary: (_flow, _demand, project) => `项目经理确认任务全部完成，提交 ${project?.name ?? "项目"} 给产品经理验收。` },
  "product.completeAcceptance": { name: "验收完成", summary: (_flow, demand) => `产品经理完成 ${demand?.name ?? "需求"} 的项目验收，等待需求方评分。` },
  "product.returnExecution": { name: "退回项目进行", summary: (_flow, _demand, project) => `产品经理将 ${project?.name ?? "项目"} 退回项目进行阶段继续整改。` },
  "requester.submitScore": { name: "提交评分", summary: (_flow, demand) => `${demand?.requester ?? "需求方"} 提交验收评分，${demand?.name ?? "需求"} 流程关闭。` }
};

function reduceFlowByAction(flow: DemandProjectFlow, actionId: FlowActionId): DemandProjectFlow {
  const currentNodeId = flowActionTargetNode[actionId];
  return {
    ...flow,
    currentNodeId,
    resourceRequest: { ...flow.resourceRequest, status: deliveryStatusForAction(flow.resourceRequest.status, actionId) },
    nodes: flow.nodes.map((node) => ({ ...node, status: flowNodeStatus(node.stageId ?? (node.id as WorkflowStageId), currentNodeId, actionId) }))
  };
}

function flowNodeStatus(stageId: WorkflowStageId, currentStage: WorkflowStageId, actionId: FlowActionId): FlowNode["status"] {
  const nodeIndex = workflowStageOrder.indexOf(stageId);
  const currentIndex = workflowStageOrder.indexOf(currentStage);
  if (actionId === "requester.submitScore") return nodeIndex <= currentIndex ? "已完成" : "待开始";
  if (actionId === "requester.abandonDemand") return nodeIndex === currentIndex ? "风险" : nodeIndex < currentIndex ? "已完成" : "待开始";
  if (nodeIndex < currentIndex) return "已完成";
  if (nodeIndex === currentIndex) return currentStage === "acceptedComplete" ? "待确认" : "进行中";
  return "待开始";
}

function reduceDemandByFlowAction(demand: Demand, actionId: FlowActionId): Demand {
  const patch: Partial<Demand> = {};
  if (actionId === "requester.submitReview") Object.assign(patch, { status: "需求评审", progress: Math.max(demand.progress, 14) });
  if (actionId === "product.returnDemand") Object.assign(patch, { status: "已打回", progress: Math.max(demand.progress, 16) });
  if (actionId === "product.submitSolution") Object.assign(patch, { status: "方案确认", progress: Math.max(demand.progress, 32) });
  if (actionId === "requester.abandonDemand") Object.assign(patch, { status: "已放弃", progress: 100 });
  if (actionId === "requester.submitProjectRequest") Object.assign(patch, { status: "项目启动", progress: Math.max(demand.progress, 45) });
  if (["pm.startProject", "pm.assignDevelopers", "developer.createTask", "developer.updateProgress", "developer.completeTask", "product.returnExecution"].includes(actionId)) {
    Object.assign(patch, { status: "项目进行", progress: Math.max(demand.progress, 64) });
  }
  if (actionId === "pm.returnSolution") Object.assign(patch, { status: "方案确认", progress: Math.max(demand.progress, 38) });
  if (actionId === "pm.submitAcceptance") Object.assign(patch, { status: "项目验收", progress: Math.max(demand.progress, 86) });
  if (actionId === "product.completeAcceptance") Object.assign(patch, { status: "验收完成", progress: Math.max(demand.progress, 96) });
  if (actionId === "requester.submitScore") {
    Object.assign(patch, {
      status: "验收完成",
      progress: 100,
      lifecycleSteps: demand.lifecycleSteps.map((step) => ({ ...step, done: true, current: false }))
    });
  }
  return { ...demand, ...patch };
}

function reduceProjectByFlowAction(project: Project, actionId: FlowActionId): Project {
  if (actionId === "requester.submitProjectRequest" || actionId === "pm.returnSolution") return reduceProjectStage(project, "项目启动");
  if (["pm.startProject", "pm.assignDevelopers", "developer.createTask", "developer.updateProgress", "developer.completeTask", "product.returnExecution"].includes(actionId)) {
    return reduceProjectStage(project, "项目进行");
  }
  if (actionId === "pm.submitAcceptance") return reduceProjectStage(project, "项目验收");
  if (actionId === "product.completeAcceptance" || actionId === "requester.submitScore") return reduceProjectStage(project, "验收完成");
  return project;
}

function syncFlowWithProjectStage(flow: DemandProjectFlow, stage: ProjectStage): DemandProjectFlow {
  const stageMap: Record<ProjectStage, WorkflowStageId> = {
    项目启动: "projectStart",
    项目进行: "projectExecution",
    项目验收: "projectAcceptance",
    验收完成: "acceptedComplete"
  };
  const currentNodeId = stageMap[stage];
  return {
    ...flow,
    currentNodeId,
    nodes: flow.nodes.map((node) => ({
      ...node,
      status: flowNodeStatus(node.stageId ?? (node.id as WorkflowStageId), currentNodeId, stage === "验收完成" ? "requester.submitScore" : "pm.startProject")
    }))
  };
}

function reduceDeliveryRequestByFlowAction(request: DeliveryRequest, actionId: FlowActionId): DeliveryRequest {
  return { ...request, status: deliveryStatusForAction(request.status, actionId) as DeliveryRequest["status"] };
}

function deliveryStatusForAction(current: string, actionId: FlowActionId) {
  if (actionId === "product.submitSolution") return "方案确认中";
  if (actionId === "requester.submitProjectRequest") return "待项目经理启动";
  if (actionId === "pm.returnSolution") return "退回方案确认";
  if (actionId === "pm.startProject" || actionId === "pm.assignDevelopers" || actionId.startsWith("developer")) return "项目进行";
  if (actionId === "pm.submitAcceptance") return "项目验收";
  if (actionId === "product.completeAcceptance" || actionId === "requester.submitScore" || actionId === "requester.abandonDemand") return "已关闭";
  return current;
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
    项目启动: 36,
    项目进行: 68,
    项目验收: 88,
    验收完成: 100
  };
  return map[stage];
}

function roleIdsForUsers(userNames: string[]): RoleId[] {
  return roles.filter((item) => userNames.includes(item.userName)).map((item) => item.id);
}

function notificationForFlowAction(actionId: FlowActionId, actor: RoleOption, flow: DemandProjectFlow, demand?: Demand, project?: Project, note = ""): Omit<NotificationItem, "id" | "time" | "unread" | "targetRoles"> & { targetRoles?: RoleId[] } {
  const noteText = note.trim() ? `备注：${note.trim()}` : "";
  const actionName = flowActionMeta[actionId].name;
  const titleByAction: Record<FlowActionId, string> = {
    "requester.submitReview": `${demand?.name ?? flow.title} 已发起需求评审`,
    "product.returnDemand": `${demand?.name ?? flow.title} 已打回需求`,
    "product.submitSolution": `${demand?.name ?? flow.title} 待需求方确认方案`,
    "requester.abandonDemand": `${demand?.name ?? flow.title} 已放弃`,
    "requester.submitProjectRequest": `${demand?.name ?? flow.title} 已发起项目申请`,
    "pm.startProject": `${project?.name ?? flow.title} 已启动`,
    "pm.returnSolution": `${demand?.name ?? flow.title} 退回方案确认`,
    "pm.assignDevelopers": `${project?.name ?? flow.title} 已指派开发`,
    "developer.createTask": `${project?.name ?? flow.title} 新增子任务`,
    "developer.updateProgress": `${project?.name ?? flow.title} 进度已更新`,
    "developer.completeTask": `${project?.name ?? flow.title} 任务已完成`,
    "pm.submitAcceptance": `${project?.name ?? flow.title} 已提交项目验收`,
    "product.completeAcceptance": `${demand?.name ?? flow.title} 项目验收完成`,
    "product.returnExecution": `${project?.name ?? flow.title} 退回项目进行`,
    "requester.submitScore": `${demand?.name ?? flow.title} 评分已提交`
  };
  const targetsByAction: Record<FlowActionId, RoleId[]> = {
    "requester.submitReview": ["product"],
    "product.returnDemand": ["requester", "businessOwner"],
    "product.submitSolution": ["requester", "businessOwner"],
    "requester.abandonDemand": ["product", "pm", "businessOwner"],
    "requester.submitProjectRequest": ["pm", "product"],
    "pm.startProject": ["product", "developer", "requester", "businessOwner"],
    "pm.returnSolution": ["product", "requester", "businessOwner"],
    "pm.assignDevelopers": ["developer", "product"],
    "developer.createTask": ["pm"],
    "developer.updateProgress": ["pm", "product"],
    "developer.completeTask": ["pm"],
    "pm.submitAcceptance": ["product"],
    "product.completeAcceptance": ["requester", "businessOwner"],
    "product.returnExecution": ["pm", "developer"],
    "requester.submitScore": ["product", "pm", "businessOwner", "executive"]
  };
  return {
    title: titleByAction[actionId],
    content: compactContent(`${actor.userName} 执行了「${actionName}」，流程节点和详情页操作记录已同步更新。`, noteText),
    channel: actionId.startsWith("requester") || actionId.startsWith("product") ? "企业微信" : "站内信",
    type: actionName,
    level: actionId.includes("return") || actionId.includes("abandon") ? "orange" : actionId.includes("complete") || actionId.includes("Score") ? "green" : "blue",
    targetRoles: targetsByAction[actionId],
    targetUserNames: demand ? [demand.requester, flow.resourceRequest.requester, ...flow.assignments.map((item) => item.person)] : flow.assignments.map((item) => item.person),
    sourceUserName: actor.userName,
    relatedType: "flow",
    relatedId: flow.id
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
