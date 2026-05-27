import { ChevronDown, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DemandProjectFlow, FlowActionId, FlowActionLog, FlowBoardAction, FlowNode, RoleId, Task } from "../types";
import { Modal, SectionHeader, StatusTag, toneForStatus } from "./ui";

const demandStageIds = ["demandReview", "solutionConfirm"];

type FlowRoleSummary = {
  product?: string;
  pm?: string;
  developers: FlowDeveloperSummary[];
};

type FlowDeveloperSummary = {
  name: string;
  actual: number;
  estimate: number;
};

export function DemandProjectFlowBoard({
  flow,
  actions = [],
  actionTitle = "流程推进操作",
  logs = [],
  tasks = [],
  onApplyAction,
  onRequestAction,
  stageExtras
}: {
  flow: DemandProjectFlow;
  canConfigure?: boolean;
  actions?: FlowBoardAction[];
  actionTitle?: string;
  logs?: FlowActionLog[];
  tasks?: Task[];
  activeRole?: RoleId;
  onNodeChange?: (flowId: string, nodeId: string, patch: Partial<FlowNode>) => void;
  onApplyAction?: (flowId: string, actionId: FlowActionId, note?: string) => void;
  onRequestAction?: (action: FlowBoardAction) => boolean;
  stageExtras?: Record<string, { label: string; value: string }[]>;
}) {
  const [pendingAction, setPendingAction] = useState<FlowBoardAction | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const demandNodes = useMemo(() => flow.nodes.filter((node) => node.stageId && demandStageIds.includes(node.stageId)), [flow.nodes]);
  const projectNodes = useMemo(() => flow.nodes.filter((node) => node.stageId && !demandStageIds.includes(node.stageId)), [flow.nodes]);
  const roleSummary = useMemo(() => buildRoleSummary(flow, tasks), [flow, tasks]);
  const currentDemandNodeId = flow.currentDemandNodeId ?? inferDemandCurrent(flow);
  const currentProjectNodeId = flow.currentProjectNodeId ?? inferProjectCurrent(flow);
  const activeTrack = currentProjectNodeId ? "project" : "demand";
  const [selectedDemandNodeId, setSelectedDemandNodeId] = useState(currentDemandNodeId);
  const [selectedProjectNodeId, setSelectedProjectNodeId] = useState(currentProjectNodeId ?? projectNodes[0]?.id ?? "");
  const [openTracks, setOpenTracks] = useState<{ demand: boolean; project: boolean }>(() => ({
    demand: activeTrack === "demand",
    project: activeTrack === "project"
  }));
  const enabledActions = actions.filter((action) => !action.disabled);
  const groupedActions = groupActions(actions);

  useEffect(() => {
    setSelectedDemandNodeId(currentDemandNodeId);
    setSelectedProjectNodeId(currentProjectNodeId ?? projectNodes[0]?.id ?? "");
  }, [currentDemandNodeId, currentProjectNodeId, projectNodes]);

  useEffect(() => {
    setOpenTracks({
      demand: activeTrack === "demand",
      project: activeTrack === "project"
    });
  }, [activeTrack, flow.id]);

  function submitAction() {
    if (!pendingAction) return;
    onApplyAction?.(flow.id, pendingAction.id, actionNote);
    setPendingAction(null);
    setActionNote("");
  }

  return (
    <div className="flow-board-wrap">
      <SectionHeader
        eyebrow={`${flow.id} · ${flow.mode}`}
        title={flow.title}
      />
      <div className="flow-owner-line">
        <span>产品经理 <strong>{roleSummary.product ?? "未指定"}</strong></span>
        <span>项目经理 <strong>{roleSummary.pm ?? "未指定"}</strong></span>
      </div>

      {actions.length > 0 ? (
        <div className="flow-action-panel">
          <button className="flow-action-toggle" type="button" onClick={() => setActionsOpen((current) => !current)} aria-expanded={actionsOpen}>
            <span>
              <strong>{actionTitle}</strong>
              <small>{enabledActions.length} 个当前阶段可执行 / 共 {actions.length} 个动作</small>
            </span>
            <span>
              {actionsOpen ? "收起" : "展开"}
              <ChevronDown size={16} />
            </span>
          </button>
          {actionsOpen ? (
            <div className="flow-action-groups">
              {groupedActions.map((group) => (
                <div className="flow-action-group" key={group.stage}>
                  <div className="flow-action-stage">{group.stage}</div>
                  <div className="flow-action-grid">
                    {group.actions.map((action) => (
                      <button
                        className={`flow-action-button tone-${action.tone}${action.disabled ? " disabled" : ""}`}
                        disabled={Boolean(action.disabled)}
                        key={action.id}
                        type="button"
                        onClick={() => {
                          if (onRequestAction?.(action)) return;
                          setPendingAction(action);
                          setActionNote("");
                        }}
                      >
                        <div>
                          <strong>{action.label}</strong>
                          <span>{action.description}</span>
                          <em>{action.disabled ? action.disabledReason ?? "当前阶段不可执行。" : action.impact?.[0] ?? "点击后同步更新协作泳道。"}</em>
                        </div>
                        <span className="action-state">{action.disabled ? "未到阶段" : "可执行"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flow-stage-viewer dual-track-viewer">
        <FlowTrack
          title="需求线"
          description="需求线到方案确认结束，后续等待产品经理预创建并关联项目。"
          nodes={demandNodes}
          currentNodeId={currentDemandNodeId}
          selectedNodeId={selectedDemandNodeId}
          onSelect={setSelectedDemandNodeId}
          roleSummary={roleSummary}
          collapsed={!openTracks.demand}
          onToggle={() => setOpenTracks((current) => ({ ...current, demand: !current.demand }))}
        />
        <FlowTrack
          title="阶段"
          description={currentProjectNodeId ? "项目已关联需求，按项目阶段独立推进。" : "产品经理尚未把该需求预创建为项目。"}
          nodes={projectNodes}
          currentNodeId={currentProjectNodeId}
          selectedNodeId={selectedProjectNodeId}
          onSelect={setSelectedProjectNodeId}
          roleSummary={roleSummary}
          stageExtras={stageExtras}
          disabled={!currentProjectNodeId}
          collapsed={!openTracks.project}
          onToggle={() => setOpenTracks((current) => ({ ...current, project: !current.project }))}
        />
      </div>

      {logs.length > 0 ? (
        <div className="flow-log-panel">
          <SectionHeader eyebrow="RECORDS" title="流程操作记录" action={<PlayCircle size={18} />} />
          <ul className="timeline compact">
            {logs.map((log) => (
              <li key={log.id}>
                {log.time} · {log.actor} · {log.actionName} · {log.summary}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Modal title={pendingAction?.label ?? "执行业务动作"} open={Boolean(pendingAction)} onClose={() => setPendingAction(null)}>
        {pendingAction ? (
          <>
            <div className="detail-list">
              <div><span>所属阶段</span><strong>{pendingAction.stage}</strong></div>
              <div><span>执行动作</span><strong>{pendingAction.label}</strong></div>
              <div><span>关联流程</span><strong>{flow.title}</strong></div>
              <div><span>当前节点</span><strong>{flow.nodes.find((node) => node.id === flow.currentNodeId)?.name ?? flow.currentNodeId}</strong></div>
            </div>
            {pendingAction.impact?.length ? (
              <div className="action-impact-box">
                <strong>本次执行会同步更新</strong>
                <ul className="timeline compact">
                  {pendingAction.impact.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ) : null}
            <div className="form-grid">
              <label className="wide">
                操作备注
                <textarea
                  value={actionNote}
                  onChange={(event) => setActionNote(event.target.value)}
                  placeholder="填写本次操作原因、结论、补充材料或下一步要求"
                />
              </label>
            </div>
            <div className="split-actions">
              <button className="btn secondary" onClick={() => setPendingAction(null)}>取消</button>
              <button className="btn" onClick={submitAction}>确认执行</button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}

function groupActions(actions: FlowBoardAction[]) {
  const stages = Array.from(new Set(actions.map((action) => action.stage)));
  return stages.map((stage) => ({ stage, actions: actions.filter((action) => action.stage === stage) }));
}

function FlowTrack({
  title,
  description,
  nodes,
  currentNodeId,
  selectedNodeId,
  onSelect,
  roleSummary,
  stageExtras,
  disabled = false,
  collapsed = false,
  onToggle
}: {
  title: string;
  description: string;
  nodes: FlowNode[];
  currentNodeId?: string;
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
  roleSummary: FlowRoleSummary;
  stageExtras?: Record<string, { label: string; value: string }[]>;
  disabled?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const selectedIndex = Math.max(0, nodes.findIndex((node) => node.id === selectedNodeId));
  const selectedNode = nodes[selectedIndex] ?? nodes[0];
  if (!selectedNode) {
    return (
      <section className="flow-track-section disabled">
        <div className="flow-track-title">
          <button className="flow-track-toggle" type="button" onClick={onToggle}>
            <strong>{title}</strong>
            <ChevronDown size={16} />
          </button>
          <span>{description}</span>
        </div>
      </section>
    );
  }

  return (
    <section className={`${disabled ? "flow-track-section disabled" : "flow-track-section"}${collapsed ? " collapsed" : ""}`}>
      <div className="flow-track-title">
        <button className="flow-track-toggle" type="button" onClick={onToggle} aria-expanded={!collapsed}>
          <strong>{title}</strong>
          <StatusTag tone={selectedNode.id === currentNodeId ? "blue" : "gray"}>{selectedNode.name}</StatusTag>
          <ChevronDown size={16} />
        </button>
        <span>{description}</span>
      </div>
      {collapsed ? null : (
      <>
      <div className="flow-stage-viewer-toolbar">
        <button
          className="icon-button"
          type="button"
          onClick={() => onSelect(nodes[Math.max(0, selectedIndex - 1)].id)}
          disabled={selectedIndex === 0 || disabled}
          aria-label={`查看上一${title}阶段`}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flow-stage-tabs" role="tablist" aria-label={title}>
          {nodes.map((node, index) => (
            <button
              className={`${node.id === selectedNode.id ? "selected" : ""}${node.id === currentNodeId ? " current" : ""}`}
              disabled={disabled}
              key={node.id}
              type="button"
              onClick={() => onSelect(node.id)}
              role="tab"
              aria-selected={node.id === selectedNode.id}
            >
              <span>{stagePrefix(title)} {node.stageNo ?? index}</span>
              <strong>{node.name}</strong>
              {node.id === currentNodeId ? <em>当前阶段</em> : null}
            </button>
          ))}
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={() => onSelect(nodes[Math.min(nodes.length - 1, selectedIndex + 1)].id)}
          disabled={selectedIndex >= nodes.length - 1 || disabled}
          aria-label={`查看下一${title}阶段`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="flow-stage-single">
        <FlowStageCard
          node={selectedNode}
          current={selectedNode.id === currentNodeId}
          developers={["projectPrepare", "projectComplete", "projectEnded"].includes(selectedNode.id) ? [] : roleSummary.developers}
          extras={stageExtras?.[selectedNode.id]}
        />
      </div>
      </>
      )}
    </section>
  );
}

function stagePrefix(title: string) {
  return title === "阶段" ? "阶段" : title;
}

function FlowStageCard({
  node,
  current,
  developers,
  extras = []
}: {
  node: FlowNode;
  current: boolean;
  developers: FlowDeveloperSummary[];
  extras?: { label: string; value: string }[];
}) {
  return (
    <div className="flow-stage-cell">
      <article className={`flow-node-card${node.status === "风险" ? " risk" : ""}${current ? " current" : ""}`}>
        <div className="flow-node-card-head">
          <StatusTag tone={node.status === "风险" ? "red" : toneForStatus(node.status)}>{node.status}</StatusTag>
        </div>
        <p>{node.description}</p>
        {extras.length > 0 ? (
          <div className="flow-stage-extra-grid">
            {extras.map((item) => (
              <span key={item.label}>
                <small>{item.label}</small>
                <strong>{item.value}</strong>
              </span>
            ))}
          </div>
        ) : null}
        {developers.length > 0 ? (
          <div className="flow-dev-list">
            {developers.map((developer) => (
              <button className="flow-dev-chip" key={developer.name} type="button">
                <strong>{developer.name}</strong>
                <span>{developer.actual}/{developer.estimate}h</span>
              </button>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  );
}

function buildRoleSummary(flow: DemandProjectFlow, tasks: Task[]): FlowRoleSummary {
  const product = flow.nodes.find((node) => node.lane === "产品经理")?.owner;
  const pm = flow.nodes.find((node) => node.lane === "项目经理")?.owner;
  const taskSummaries = summarizeDeveloperTasks(tasks.filter((task) => task.projectId === flow.projectId));
  const fallbackDevelopers = unique(flow.assignments.map((assignment) => assignment.person)).map((name) => {
    const assignmentHours = flow.assignments.filter((assignment) => assignment.person === name).reduce((sum, assignment) => sum + assignment.hours, 0);
    return { name, actual: 0, estimate: assignmentHours };
  });
  return {
    product,
    pm,
    developers: taskSummaries.length > 0 ? taskSummaries : fallbackDevelopers
  };
}

function summarizeDeveloperTasks(tasks: Task[]): FlowDeveloperSummary[] {
  const byOwner = new Map<string, FlowDeveloperSummary>();
  tasks.forEach((task) => {
    const current = byOwner.get(task.owner) ?? { name: task.owner, actual: 0, estimate: 0 };
    current.actual += task.actual;
    current.estimate += task.estimate;
    byOwner.set(task.owner, current);
  });
  return Array.from(byOwner.values());
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function inferDemandCurrent(flow: DemandProjectFlow) {
  if (flow.currentDemandNodeId) return flow.currentDemandNodeId;
  if (demandStageIds.includes(flow.currentNodeId)) return flow.currentNodeId;
  return "solutionConfirm";
}

function inferProjectCurrent(flow: DemandProjectFlow) {
  if (flow.currentProjectNodeId) return flow.currentProjectNodeId;
  if (!flow.projectId || flow.projectId === "待项目关联") return undefined;
  if (flow.currentNodeId === "projectPrepare" || flow.currentNodeId === "projectStart" || flow.currentNodeId === "projectExecution" || flow.currentNodeId === "projectComplete" || flow.currentNodeId === "projectEnded") return flow.currentNodeId;
  return "projectPrepare";
}
