import { ArrowLeft, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { DemandProjectFlowBoard } from "../components/DemandProjectFlowBoard";
import { Modal, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";
import type { AcceptanceReview, Demand, DemandAnalysis, DemandProjectFlow, FlowActionId, FlowActionLog, FlowBoardAction, Priority, RoleId, RoleOption } from "../types";

const priorities: Priority[] = ["P0", "P1", "P2", "P3"];

export function DemandDetail({
  demand,
  flow,
  activeRole,
  activeUser,
  flowActionLogs,
  canAdjustPriority,
  onBack,
  onPriorityChange,
  onSubmitReview,
  onUpdateAnalysis,
  onApplyFlowAction,
  onAssignWork
}: {
  demand: Demand;
  flow?: DemandProjectFlow;
  activeRole: RoleId;
  activeUser: RoleOption;
  flowActionLogs: FlowActionLog[];
  canAdjustPriority: boolean;
  onBack: () => void;
  onPriorityChange: (id: string, priority: Priority) => void;
  onSubmitReview: (id: string, review: AcceptanceReview) => void;
  onUpdateAnalysis: (id: string, analysis: DemandAnalysis, summary: string) => void;
  onApplyFlowAction: (flowId: string, actionId: FlowActionId, note?: string) => void;
  onAssignWork: (targetUserName: string, relatedType: "demand" | "project" | "task" | "resource" | "flow", relatedId: string, summary: string) => void;
}) {
  const [reviewing, setReviewing] = useState(false);
  const [reviewScore, setReviewScore] = useState(String(demand.acceptanceReview?.score ?? "4.7"));
  const [reviewConclusion, setReviewConclusion] = useState(demand.acceptanceReview?.conclusion ?? "通过验收");
  const [reviewComment, setReviewComment] = useState(demand.acceptanceReview?.comment ?? "交付结果符合业务预期，关键流程可正常使用。");
  const [analysisDraft, setAnalysisDraft] = useState({
    feasibility: demand.analysis.feasibility,
    valueScore: String(demand.analysis.valueScore),
    implementationReason: demand.analysis.implementationReason,
    resourcePlan: demand.analysis.resourcePlan,
    iteration: demand.analysis.iteration
  });
  const [analysisNote, setAnalysisNote] = useState("已补充价值评分、迭代版本、资源方案和实现决策。");

  const demandActions = flow ? getDemandDetailActions(activeRole, flow) : [];
  const selectedFlowLogs = flow ? flowActionLogs.filter((log) => log.flowId === flow.id) : [];
  const canEditProductReview = ["admin", "product"].includes(activeRole) && flow?.currentNodeId === "demandReview";

  useEffect(() => {
    setAnalysisDraft({
      feasibility: demand.analysis.feasibility,
      valueScore: String(demand.analysis.valueScore),
      implementationReason: demand.analysis.implementationReason,
      resourcePlan: demand.analysis.resourcePlan,
      iteration: demand.analysis.iteration
    });
  }, [demand.id, demand.analysis]);

  function submitReview() {
    onSubmitReview(demand.id, {
      score: Number(reviewScore) || 0,
      conclusion: reviewConclusion,
      comment: reviewComment,
      reviewer: demand.requester,
      date: "2026-05-26"
    });
    if (flow) {
      onApplyFlowAction(flow.id, "requester.submitScore", `${reviewConclusion}，评分 ${reviewScore}/5：${reviewComment}`);
    }
    setReviewing(false);
  }

  function productReviewAnalysis(): DemandAnalysis {
    return {
      feasibility: analysisDraft.feasibility.trim(),
      valueScore: clampScore(Number(analysisDraft.valueScore) || 0),
      implementationReason: analysisDraft.implementationReason.trim(),
      resourcePlan: analysisDraft.resourcePlan.trim(),
      iteration: analysisDraft.iteration.trim()
    };
  }

  function saveProductReview() {
    onUpdateAnalysis(demand.id, productReviewAnalysis(), analysisNote.trim() || "产品经理更新需求评审字段。");
  }

  function submitSolutionFromReview() {
    const nextAnalysis = productReviewAnalysis();
    const note = `${analysisNote.trim() || "产品经理完成需求评审。"} 价值评分 ${nextAnalysis.valueScore}，迭代 ${nextAnalysis.iteration}，资源方案：${nextAnalysis.resourcePlan}`;
    onUpdateAnalysis(demand.id, nextAnalysis, note);
    if (flow) onApplyFlowAction(flow.id, "product.submitSolution", note);
  }

  function returnDemandFromReview() {
    const note = analysisNote.trim() || "资料不足，需需求方补充背景、目标、价值或附件。";
    if (flow) onApplyFlowAction(flow.id, "product.returnDemand", note);
  }

  return (
    <section className="page detail-page">
      <div className="detail-hero">
        <button className="btn secondary" type="button" onClick={onBack}>
          <ArrowLeft size={16} /> 返回需求列表
        </button>
        <div className="detail-hero-main">
          <div>
            <span className="detail-kicker">{demand.id} · {demand.team}</span>
            <h1>{demand.name}</h1>
            <p>{demand.objective}</p>
          </div>
          <div className="detail-hero-tags">
            <StatusTag tone={toneForStatus(demand.status)}>{demand.status}</StatusTag>
            <StatusTag tone={demand.priority === "P0" ? "red" : demand.priority === "P1" ? "orange" : "gray"}>{demand.priority}</StatusTag>
            <StatusTag tone={demand.implementation === "内部实现" ? "cyan" : demand.implementation === "外部供应商" ? "violet" : "blue"}>{demand.implementation}</StatusTag>
          </div>
        </div>
      </div>

      <div className="detail-summary-grid">
        <article className="summary-tile">
          <span>当前进度</span>
          <strong>{demand.progress}%</strong>
          <ProgressBar value={demand.progress} />
        </article>
        <article className="summary-tile">
          <span>当前处理人</span>
          <strong>{demand.handler}</strong>
          <small>提出人：{demand.requester}</small>
        </article>
        <article className="summary-tile">
          <span>期望上线</span>
          <strong>{demand.targetDate}</strong>
          <small>关联项目：{demand.linkedProject}</small>
        </article>
        <article className="summary-tile">
          <span>交付评分</span>
          <strong>{demand.acceptanceReview ? `${demand.acceptanceReview.score}/5` : "待评分"}</strong>
          <small>{demand.acceptanceReview?.conclusion ?? "验收后由业务方评价"}</small>
        </article>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="panel">
            <SectionHeader title="需求内容" />
            <div className="narrative-block">
              <strong>需求描述</strong>
              <p>{demand.description}</p>
              <strong>业务价值</strong>
              <p>{demand.analysis.feasibility}</p>
            </div>
            <div className="detail-list relaxed">
              <div><span>价值评分</span><strong>{demand.analysis.valueScore}</strong></div>
              <div><span>迭代版本</span><strong>{demand.analysis.iteration}</strong></div>
              <div><span>资源方案</span><strong>{demand.analysis.resourcePlan}</strong></div>
              <div><span>实现决策</span><strong>{demand.analysis.implementationReason}</strong></div>
              <div><span>附件</span><strong>需求说明.docx / 业务样例.xlsx</strong></div>
            </div>
          </div>

          {canEditProductReview ? (
            <div className="panel product-review-editor">
              <SectionHeader title="产品经理需求评审填写" action={<StatusTag tone="blue">阶段1：需求评审</StatusTag>} />
              <div className="form-grid">
                <label>价值评分<input value={analysisDraft.valueScore} onChange={(event) => setAnalysisDraft((draft) => ({ ...draft, valueScore: event.target.value }))} /></label>
                <label>迭代版本<input value={analysisDraft.iteration} onChange={(event) => setAnalysisDraft((draft) => ({ ...draft, iteration: event.target.value }))} /></label>
                <label className="wide">业务价值 / 可行性<textarea value={analysisDraft.feasibility} onChange={(event) => setAnalysisDraft((draft) => ({ ...draft, feasibility: event.target.value }))} /></label>
                <label className="wide">资源方案<textarea value={analysisDraft.resourcePlan} onChange={(event) => setAnalysisDraft((draft) => ({ ...draft, resourcePlan: event.target.value }))} /></label>
                <label className="wide">实现决策<textarea value={analysisDraft.implementationReason} onChange={(event) => setAnalysisDraft((draft) => ({ ...draft, implementationReason: event.target.value }))} /></label>
                <label className="wide">评审留言 / 附件说明<textarea value={analysisNote} onChange={(event) => setAnalysisNote(event.target.value)} /></label>
              </div>
              <div className="split-actions">
                <button className="btn secondary" type="button" onClick={returnDemandFromReview}>打回需求</button>
                <button className="btn secondary" type="button" onClick={saveProductReview}>保存评审字段</button>
                <button className="btn" type="button" onClick={submitSolutionFromReview}>保存并发起方案确认</button>
              </div>
            </div>
          ) : null}

          {flow ? (
            <div className="panel">
              <SectionHeader title="0-6 阶段泳道图" />
              <DemandProjectFlowBoard
                flow={flow}
                canConfigure
                activeRole={activeRole}
                actions={demandActions}
                actionTitle="需求与产品业务动作"
                logs={selectedFlowLogs}
                onApplyAction={onApplyFlowAction}
              />
            </div>
          ) : null}

          <div className="panel">
            <SectionHeader title="验收评分" action={<button className="btn secondary" type="button" onClick={() => setReviewing(true)}><Star size={15} /> 发起评分</button>} />
            {demand.acceptanceReview ? (
              <div className="panel-soft-block">
                <strong>{demand.acceptanceReview.conclusion} · {demand.acceptanceReview.score} / 5</strong>
                <p>{demand.acceptanceReview.comment}</p>
                <span className="muted-text">{demand.acceptanceReview.reviewer} · {demand.acceptanceReview.date}</span>
              </div>
            ) : (
              <div className="empty-state"><strong>待需求方验收评分</strong><span>等待需求方提交验收结论。</span></div>
            )}
          </div>
        </div>

        <aside className="detail-side">
          <div className="panel">
            <SectionHeader title="生命周期" />
            <div className="lifecycle vertical">
              {demand.lifecycleSteps.map((step) => (
                <span className={step.current ? "current" : step.done ? "done" : ""} key={step.name}>{step.name}</span>
              ))}
            </div>
          </div>

          <div className="panel">
            <SectionHeader title="优先级与分配" />
            {canAdjustPriority ? (
              <>
                {activeUser.isDepartmentOwner ? (
                  <div className="assignment-strip compact">
                    <div>
                      <strong>需求方确认 / 验收</strong>
                      <span>当前提出人：{demand.requester}</span>
                    </div>
                    <button className="btn" type="button" onClick={() => onAssignWork("沈岚", "demand", demand.id, `${demand.name} 的需求方确认和验收`)}>
                      分配给沈岚
                    </button>
                  </div>
                ) : null}
                <div className="priority-actions">
                  {priorities.map((item) => (
                    <button className={item === demand.priority ? "btn" : "btn secondary"} key={item} onClick={() => onPriorityChange(demand.id, item)}>
                      {item}
                    </button>
                  ))}
                </div>
                <ul className="timeline compact">{demand.priorityHistory.map((item) => <li key={item}>{item}</li>)}</ul>
              </>
            ) : (
              <StatusTag tone={demand.priority === "P0" ? "red" : demand.priority === "P1" ? "orange" : "gray"}>{demand.priority}</StatusTag>
            )}
          </div>

          <div className="panel">
            <SectionHeader title="里程碑通知" />
            <ul className="timeline">{demand.milestones.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>

          <div className="panel">
            <SectionHeader title="沟通记录" />
            <ul className="timeline">{demand.comments.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </aside>
      </div>

      <Modal title="验收评分与评价" open={reviewing} onClose={() => setReviewing(false)}>
        <div className="form-grid">
          <label>评分<input value={reviewScore} onChange={(event) => setReviewScore(event.target.value)} /></label>
          <label>验收结论<select value={reviewConclusion} onChange={(event) => setReviewConclusion(event.target.value)}><option>通过验收</option><option>有条件通过</option><option>退回修改</option></select></label>
          <label className="wide">评价内容<textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} /></label>
        </div>
        <div className="split-actions">
          <button className="btn secondary" onClick={() => setReviewing(false)}>取消</button>
          <button className="btn" onClick={submitReview}>提交评价</button>
        </div>
      </Modal>
    </section>
  );
}

function getDemandDetailActions(activeRole: RoleId, flow: DemandProjectFlow): FlowBoardAction[] {
  const canRequesterAct = ["admin", "requester", "businessOwner"].includes(activeRole);
  const canProductAct = ["admin", "product"].includes(activeRole);
  const isCurrent = (id: string) => flow.currentNodeId === id;
  const actions: FlowBoardAction[] = [];
  if (canRequesterAct) {
    actions.push(
      {
        id: "requester.submitReview",
        label: "发起需求评审",
        description: "草稿补齐后提交给产品经理评审。",
        stage: "阶段0：草稿",
        tone: "blue",
        impact: ["泳道推进到阶段1需求评审", "产品经理收到评审通知", "操作留言写入记录和通知"],
        disabled: !isCurrent("draft"),
        disabledReason: "只有草稿阶段可发起需求评审。"
      },
      {
        id: "requester.abandonDemand",
        label: "放弃需求",
        description: "方案确认阶段放弃需求，流程关闭为只读。",
        stage: "阶段2：方案确认",
        tone: "orange",
        impact: ["流程关闭", "需求状态变为已放弃", "产品经理和项目经理收到通知"],
        disabled: !isCurrent("solutionConfirm"),
        disabledReason: "只有方案确认阶段可放弃需求。"
      },
      {
        id: "requester.submitProjectRequest",
        label: "发起项目申请",
        description: "确认产品方案后发起项目申请，交由唯一项目经理判断资源并启动。",
        stage: "阶段2：方案确认",
        tone: "green",
        impact: ["泳道推进到阶段3项目启动", "项目经理收到启动判断通知", "操作留言写入记录和通知"],
        disabled: !isCurrent("solutionConfirm"),
        disabledReason: "只有方案确认阶段可发起项目申请。"
      },
      {
        id: "requester.submitScore",
        label: "提交评分",
        description: "产品验收完成后，需求方提交 1-5 分和评价并关闭流程。",
        stage: "阶段6：验收完成",
        tone: "green",
        impact: ["流程关闭为只读", "评分写入需求详情", "管理层报表可查看评分"],
        disabled: !isCurrent("acceptedComplete"),
        disabledReason: "只有验收完成阶段可提交评分。"
      }
    );
  }
  if (canProductAct) {
    actions.push(
      {
        id: "product.returnDemand",
        label: "打回需求",
        description: "资料不足时打回需求方补充。",
        stage: "阶段1：需求评审",
        tone: "orange",
        impact: ["泳道回到阶段0草稿", "需求状态变为已打回", "操作留言写入记录和通知"],
        disabled: !isCurrent("demandReview"),
        disabledReason: "只有需求评审阶段可打回。"
      },
      {
        id: "product.submitSolution",
        label: "发起方案确认",
        description: "提交解决方案、资源投入测算和 AI 评分给需求方确认。",
        stage: "阶段1：需求评审",
        tone: "blue",
        impact: ["泳道推进到阶段2方案确认", "需求方收到确认通知", "操作留言写入记录和通知"],
        disabled: !isCurrent("demandReview"),
        disabledReason: "只有需求评审阶段可发起方案确认。"
      },
      {
        id: "product.returnExecution",
        label: "退回项目进行",
        description: "项目验收不通过时退回开发整改。",
        stage: "阶段5：项目验收",
        tone: "red",
        impact: ["泳道回到阶段4项目进行", "项目经理和开发收到整改通知", "操作留言写入记录和通知"],
        disabled: !isCurrent("projectAcceptance"),
        disabledReason: "只有项目验收阶段可退回整改。"
      },
      {
        id: "product.completeAcceptance",
        label: "验收完成",
        description: "产品经理确认验收通过，进入需求方最终评分。",
        stage: "阶段5：项目验收",
        tone: "green",
        impact: ["泳道推进到阶段6验收完成", "需求方收到评分通知", "操作留言写入记录和通知"],
        disabled: !isCurrent("projectAcceptance"),
        disabledReason: "只有项目验收阶段可完成验收。"
      }
    );
  }
  return actions;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
