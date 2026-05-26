import { ChevronDown, PlayCircle, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { DemandProjectFlow, FlowActionId, FlowActionLog, FlowBoardAction, FlowLane, FlowNode, FlowNodeStatus } from "../types";
import { Modal, SectionHeader, StatusTag, toneForStatus } from "./ui";

const lanes: FlowLane[] = ["需求方", "产品经理", "项目经理", "开发", "管理层"];
const statusOptions: FlowNodeStatus[] = ["待开始", "进行中", "待确认", "已完成", "风险"];

export function DemandProjectFlowBoard({
  flow,
  canConfigure = false,
  actions = [],
  actionTitle = "流程推进操作",
  logs = [],
  onNodeChange,
  onApplyAction
}: {
  flow: DemandProjectFlow;
  canConfigure?: boolean;
  actions?: FlowBoardAction[];
  actionTitle?: string;
  logs?: FlowActionLog[];
  onNodeChange?: (flowId: string, nodeId: string, patch: Partial<FlowNode>) => void;
  onApplyAction?: (flowId: string, actionId: FlowActionId, note?: string) => void;
}) {
  const [editing, setEditing] = useState<FlowNode | null>(null);
  const [draft, setDraft] = useState<FlowNode | null>(null);
  const [pendingAction, setPendingAction] = useState<FlowBoardAction | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const enabledActions = actions.filter((action) => !action.disabled);
  const groupedActions = groupActions(actions);

  useEffect(() => {
    setDraft(editing ? { ...editing } : null);
  }, [editing]);

  function saveDraft() {
    if (!draft || !editing || !onNodeChange) return;
    onNodeChange(flow.id, editing.id, {
      name: draft.name,
      lane: draft.lane,
      owner: draft.owner,
      status: draft.status,
      deliverable: draft.deliverable,
      description: draft.description
    });
    setEditing(null);
  }

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
        action={<StatusTag tone={canConfigure ? "blue" : "gray"}>{canConfigure ? "可配置" : "只读流程"}</StatusTag>}
      />

      <div className="flow-summary">
        <div><span>关联需求</span><strong>{flow.demandId}</strong></div>
        <div><span>关联项目</span><strong>{flow.projectId}</strong></div>
        <div><span>当前节点</span><strong>{flow.nodes.find((node) => node.id === flow.currentNodeId)?.name ?? flow.currentNodeId}</strong></div>
        <div><span>资源状态</span><strong>{flow.resourceRequest.status}</strong></div>
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

      <div className="flow-board-scroller">
        <div className="flow-board" style={{ gridTemplateColumns: `132px repeat(${flow.nodes.length}, minmax(178px, 1fr))` }}>
          <div className="flow-corner">泳道 / 节点</div>
          {flow.nodes.map((node, index) => (
            <div className="flow-column-head" key={node.id}>
              <span>{index + 1}</span>
              <strong>{node.name}</strong>
            </div>
          ))}
          {lanes.map((lane) => (
            <FlowLaneRow
              key={lane}
              lane={lane}
              nodes={flow.nodes}
              canConfigure={canConfigure}
              onEdit={setEditing}
            />
          ))}
        </div>
      </div>

      <div className="flow-resource-panel">
        <div className="flow-resource-request">
          <span className="eyebrow">DELIVERY REQUEST</span>
          <strong>项目申请与资源测算</strong>
          <p>{flow.resourceRequest.need}</p>
          <div className="compact-grid">
            <span>申请人：{flow.resourceRequest.requester}</span>
            <span>人天：{flow.resourceRequest.days} 天</span>
            <span>窗口：{flow.resourceRequest.window}</span>
            <span>状态：{flow.resourceRequest.status}</span>
          </div>
        </div>
        <div className="assignment-grid">
          {flow.assignments.map((assignment) => (
            <article className="assignment-card" key={assignment.id}>
              <div>
                <strong>{assignment.person}</strong>
                <StatusTag tone={assignment.conflict.includes("满负荷") || assignment.conflict.includes("等待") ? "orange" : "green"}>{assignment.conflict}</StatusTag>
              </div>
              <p>{assignment.role} · {assignment.dateRange}</p>
              <div className="compact-grid">
                <span>工时：{assignment.hours}h</span>
                <span>负载：{assignment.workload}</span>
                <span>日历：{assignment.sourceCalendarDates.join(" / ")}</span>
              </div>
            </article>
          ))}
        </div>
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

      <Modal title="节点设置" open={Boolean(editing && draft)} onClose={() => setEditing(null)}>
        {draft ? (
          <>
            <div className="form-grid">
              <label>节点名称<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <label>负责人<input value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} /></label>
              <label>所属泳道<select value={draft.lane} onChange={(event) => setDraft({ ...draft, lane: event.target.value as FlowLane })}>{lanes.map((lane) => <option key={lane}>{lane}</option>)}</select></label>
              <label>节点状态<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as FlowNodeStatus })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="wide">交付物<input value={draft.deliverable} onChange={(event) => setDraft({ ...draft, deliverable: event.target.value })} /></label>
              <label className="wide">说明<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            </div>
            <div className="split-actions">
              <button className="btn secondary" onClick={() => setEditing(null)}>取消</button>
              <button className="btn" onClick={saveDraft}>保存节点设置</button>
            </div>
          </>
        ) : null}
      </Modal>

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

function FlowLaneRow({
  lane,
  nodes,
  canConfigure,
  onEdit
}: {
  lane: FlowLane;
  nodes: FlowNode[];
  canConfigure: boolean;
  onEdit: (node: FlowNode) => void;
}) {
  return (
    <>
      <div className="flow-lane-label">{lane}</div>
      {nodes.map((node) => (
        <div className="flow-cell" key={`${lane}${node.id}`}>
          {node.lane === lane ? (
            <article className={`flow-node-card ${node.status === "风险" ? "risk" : ""}`}>
              <div>
                <strong>{node.name}</strong>
                <StatusTag tone={node.status === "风险" ? "red" : toneForStatus(node.status)}>{node.status}</StatusTag>
              </div>
              <p>{node.description}</p>
              <div className="compact-grid">
                <span>负责人：{node.owner}</span>
                <span>交付物：{node.deliverable}</span>
              </div>
              {canConfigure && node.configurable ? (
                <button className="btn secondary node-config-button" onClick={() => onEdit(node)}>
                  <Settings2 size={14} /> 节点设置
                </button>
              ) : null}
            </article>
          ) : null}
        </div>
      ))}
    </>
  );
}
