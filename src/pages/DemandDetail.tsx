import { ArrowLeft, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal, SectionHeader, StatusTag, toneForStatus } from "../components/ui";
import type { AcceptanceReview, Demand, DemandAnalysis, DemandProjectFlow, FlowActionId, Project, RoleId } from "../types";

export function DemandDetail({
  demand,
  flow,
  linkedProject,
  activeRole,
  onBack,
  onOpenProject,
  onSubmitReview,
  onUpdateAnalysis,
  onApplyFlowAction
}: {
  demand: Demand;
  flow?: DemandProjectFlow;
  linkedProject?: Project;
  activeRole: RoleId;
  onBack: () => void;
  onOpenProject: (id: string) => void;
  onSubmitReview: (id: string, review: AcceptanceReview) => void;
  onUpdateAnalysis: (id: string, analysis: DemandAnalysis, summary: string) => void;
  onApplyFlowAction: (flowId: string, actionId: FlowActionId, note?: string) => void;
}) {
  const [reviewing, setReviewing] = useState(false);
  const [reviewScore, setReviewScore] = useState(String(demand.acceptanceReview?.score ?? "4.7"));
  const [reviewConclusion, setReviewConclusion] = useState(demand.acceptanceReview?.conclusion ?? "通过验收");
  const [reviewComment, setReviewComment] = useState(demand.acceptanceReview?.comment ?? "交付结果符合业务预期，关键流程可正常使用。");
  const [analysisDraft, setAnalysisDraft] = useState({
    feasibility: demand.analysis.feasibility,
    implementationReason: demand.analysis.implementationReason
  });
  const [analysisNote, setAnalysisNote] = useState("已确认技术路线和实现方式。");

  const canEditProductReview = ["admin", "product"].includes(activeRole) && flow?.currentNodeId === "demandReview";
  const canPreCreateProject = ["admin", "product"].includes(activeRole) && flow?.currentDemandNodeId === "solutionConfirm" && !flow.currentProjectNodeId && !linkedProject;
  const linkedProjectRange = linkedProject ? projectDateRange(linkedProject, demand.targetDate) : undefined;

  useEffect(() => {
    setAnalysisDraft({
      feasibility: demand.analysis.feasibility,
      implementationReason: demand.analysis.implementationReason
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
      valueScore: demand.analysis.valueScore,
      implementationReason: analysisDraft.implementationReason.trim(),
      resourcePlan: demand.analysis.resourcePlan,
      budgetEstimate: demand.analysis.budgetEstimate,
      budgetBasis: demand.analysis.budgetBasis,
      iteration: demand.analysis.iteration
    };
  }

  function saveProductReview() {
    onUpdateAnalysis(demand.id, productReviewAnalysis(), analysisNote.trim() || "产品经理更新需求评审字段。");
  }

  function submitSolutionFromReview() {
    const nextAnalysis = productReviewAnalysis();
    const note = `${analysisNote.trim() || "产品经理完成技术路线评审。"} 技术路线：${nextAnalysis.feasibility}；实现方式：${demand.implementation}。`;
    onUpdateAnalysis(demand.id, nextAnalysis, note);
    if (flow) onApplyFlowAction(flow.id, "product.submitSolution", note);
  }

  function returnDemandFromReview() {
    const note = analysisNote.trim() || "资料不足，需需求方补充背景、目标、价值或附件。";
    if (flow) onApplyFlowAction(flow.id, "product.returnDemand", note);
  }

  function preCreateProjectFromDemand() {
    if (!flow) return;
    onApplyFlowAction(flow.id, "product.preCreateProject", "产品经理从已确认方案预创建项目并关联需求。");
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
          <span>需求状态</span>
          <strong>{demand.status}</strong>
          <small>{demand.status === "需求评审" ? "产品经理评审中" : demand.status === "方案确认" ? "需求线已到方案确认" : "需求已关闭"}</small>
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
              <p>{demand.objective}</p>
            </div>
            <div className="detail-list relaxed">
              <div><span>提出人</span><strong>{demand.requester}</strong></div>
              <div><span>所属部门</span><strong>{demand.team}</strong></div>
              <div><span>期望上线</span><strong>{demand.targetDate}</strong></div>
              <div><span>重要级别</span><strong>{demand.priority}</strong></div>
              <div><span>附件</span><strong>需求说明.docx / 业务样例.xlsx</strong></div>
            </div>
          </div>

          {canEditProductReview ? (
            <div className="panel product-review-editor">
              <SectionHeader title="产品经理技术路线评审" action={<StatusTag tone="blue">阶段1：需求评审</StatusTag>} />
              <div className="form-grid">
                <label>建议实现方式<input value={demand.implementation} readOnly /></label>
                <label className="wide">技术路线 / 可行性<textarea value={analysisDraft.feasibility} onChange={(event) => setAnalysisDraft((draft) => ({ ...draft, feasibility: event.target.value }))} /></label>
                <label className="wide">实现方式判断<textarea value={analysisDraft.implementationReason} onChange={(event) => setAnalysisDraft((draft) => ({ ...draft, implementationReason: event.target.value }))} /></label>
                <label className="wide">评审留言 / 附件说明<textarea value={analysisNote} onChange={(event) => setAnalysisNote(event.target.value)} /></label>
              </div>
              <div className="split-actions">
                <button className="btn secondary" type="button" onClick={returnDemandFromReview}>打回需求</button>
                <button className="btn secondary" type="button" onClick={saveProductReview}>保存技术评审</button>
                <button className="btn" type="button" onClick={submitSolutionFromReview}>保存并发起方案确认</button>
              </div>
            </div>
          ) : (
            <div className="panel product-review-editor">
              <SectionHeader title="产品经理技术路线评审" action={<StatusTag tone="blue">阶段1：需求评审</StatusTag>} />
              <div className="detail-list relaxed">
                <div><span>建议实现方式</span><strong>{demand.implementation}</strong></div>
                <div><span>技术路线 / 可行性</span><strong>{demand.analysis.feasibility}</strong></div>
                <div><span>实现方式判断</span><strong>{demand.analysis.implementationReason}</strong></div>
              </div>
            </div>
          )}

          <div className="panel demand-project-summary">
            <SectionHeader
              title="关联项目"
              action={
                linkedProject ? (
                  <button className="btn secondary" type="button" onClick={() => onOpenProject(linkedProject.id)}>查看项目详情</button>
                ) : canPreCreateProject ? (
                  <button className="btn" type="button" onClick={preCreateProjectFromDemand}>项目预创建</button>
                ) : null
              }
            />
            {linkedProject ? (
              <div className="linked-project-card">
                <div>
                  <span className="muted-text">{linkedProject.id}</span>
                  <strong>{linkedProject.name}</strong>
                  <p>当前阶段：{linkedProject.stage}。项目执行、资源、任务、甘特和预算请进入项目详情查看。</p>
                  <div className="linked-project-dates">
                    <span>项目开始：<b>{linkedProjectRange?.start}</b></span>
                    <span>计划结束：<b>{linkedProjectRange?.end}</b></span>
                  </div>
                </div>
                <div className="linked-project-meta">
                  <StatusTag tone={toneForStatus(linkedProject.stage)}>{linkedProject.stage}</StatusTag>
                  <StatusTag tone={toneForStatus(linkedProject.risk)}>{linkedProject.risk}</StatusTag>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <strong>未关联项目</strong>
                <span>{demand.status === "方案确认" ? "需求方案已确认，等待产品经理预创建项目并完成关联。" : "需求还在评审中，方案确认后再关联项目。"}</span>
              </div>
            )}
          </div>

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

function projectDateRange(project: Project, demandTargetDate: string) {
  const milestoneDates = project.milestones
    .map((milestone) => milestone.date)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return {
    start: milestoneDates[0] ?? "待确认",
    end: demandTargetDate || milestoneDates.at(-1) || "待确认"
  };
}
