import { ArrowLeft, Star } from "lucide-react";
import { useState } from "react";
import { DemandProjectFlowBoard } from "../components/DemandProjectFlowBoard";
import { Modal, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";
import type { AcceptanceReview, Demand, DemandProjectFlow, Priority, RoleOption } from "../types";

const priorities: Priority[] = ["P0", "P1", "P2", "P3"];

export function DemandDetail({
  demand,
  flow,
  activeUser,
  canAdjustPriority,
  onBack,
  onPriorityChange,
  onSubmitReview,
  onAssignWork
}: {
  demand: Demand;
  flow?: DemandProjectFlow;
  activeUser: RoleOption;
  canAdjustPriority: boolean;
  onBack: () => void;
  onPriorityChange: (id: string, priority: Priority) => void;
  onSubmitReview: (id: string, review: AcceptanceReview) => void;
  onAssignWork: (targetUserName: string, relatedType: "demand" | "project" | "task" | "resource" | "flow", relatedId: string, summary: string) => void;
}) {
  const [reviewing, setReviewing] = useState(false);
  const [reviewScore, setReviewScore] = useState(String(demand.acceptanceReview?.score ?? "4.7"));
  const [reviewConclusion, setReviewConclusion] = useState(demand.acceptanceReview?.conclusion ?? "通过验收");
  const [reviewComment, setReviewComment] = useState(demand.acceptanceReview?.comment ?? "交付结果符合业务预期，关键流程可正常使用。");

  function submitReview() {
    onSubmitReview(demand.id, {
      score: Number(reviewScore) || 0,
      conclusion: reviewConclusion,
      comment: reviewComment,
      reviewer: demand.requester,
      date: "2026-05-26"
    });
    setReviewing(false);
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

          {flow ? (
            <div className="panel">
              <SectionHeader title="需求到项目协作链路" />
              <DemandProjectFlowBoard flow={flow} />
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
              <div className="empty-state"><strong>待业务验收评分</strong><span>等待运营提交验收结论。</span></div>
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
                      <strong>业务确认 / 验收</strong>
                      <span>当前提出人：{demand.requester}</span>
                    </div>
                    <button className="btn" type="button" onClick={() => onAssignWork("沈岚", "demand", demand.id, `${demand.name} 的业务确认和验收`)}>
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
