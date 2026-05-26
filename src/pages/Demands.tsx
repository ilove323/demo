import { Plus, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { DemandProjectFlowBoard } from "../components/DemandProjectFlowBoard";
import type { AcceptanceReview, Demand, DemandProjectFlow, Priority, RoleOption } from "../types";
import { Drawer, Modal, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";

const priorities: Priority[] = ["P0", "P1", "P2", "P3"];

export function Demands({
  demands,
  flows,
  canAdjustPriority = true,
  activeUser,
  onPriorityChange,
  onSubmitReview,
  onAssignWork
}: {
  demands: Demand[];
  flows: DemandProjectFlow[];
  canAdjustPriority?: boolean;
  activeUser: RoleOption;
  onPriorityChange: (id: string, priority: Priority) => void;
  onSubmitReview: (id: string, review: AcceptanceReview) => void;
  onAssignWork: (targetUserName: string, relatedType: "demand" | "project" | "task" | "resource" | "flow", relatedId: string, summary: string) => void;
}) {
  const [status, setStatus] = useState("全部状态");
  const [priority, setPriority] = useState("全部优先级");
  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewScore, setReviewScore] = useState("4.7");
  const [reviewConclusion, setReviewConclusion] = useState("通过验收");
  const [reviewComment, setReviewComment] = useState("交付结果符合业务预期，关键流程可正常使用。");

  const selected = selectedId ? demands.find((demand) => demand.id === selectedId) ?? null : null;
  const selectedFlow = selected ? flows.find((flow) => flow.demandId === selected.id) : undefined;

  const filtered = useMemo(
    () =>
      demands.filter((demand) => {
        const matchStatus = status === "全部状态" || demand.status === status;
        const matchPriority = priority === "全部优先级" || demand.priority === priority;
        const matchKeyword = `${demand.name}${demand.team}${demand.handler}`.includes(keyword);
        return matchStatus && matchPriority && matchKeyword;
      }),
    [demands, keyword, priority, status]
  );

  function submitReview() {
    if (!selected) return;
    onSubmitReview(selected.id, {
      score: Number(reviewScore) || 0,
      conclusion: reviewConclusion,
      comment: reviewComment,
      reviewer: selected.requester,
      date: "2026-05-25"
    });
    setReviewing(false);
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>需求管理</h1>
        </div>
        <button className="btn" onClick={() => setCreating(true)}>
          <Plus size={16} /> 新建需求
        </button>
      </div>

      <div className="panel">
        <div className="filters">
          <input placeholder="搜索需求、团队、处理人" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {["全部状态", "待业务确认", "待产品承接", "产品评估中", "待项目受理", "交付中", "待验收", "已完成", "暂停"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            {["全部优先级", ...priorities].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select defaultValue="全部实现方式">
            {["全部实现方式", "内部实现", "外部供应商", "合作实现"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel">
        <SectionHeader eyebrow="DEMANDS" title="需求视图" action={<ViewToggle value={viewMode} onChange={setViewMode} />} />
        {viewMode === "list" ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>需求</th>
                <th>团队</th>
                <th>优先级</th>
                <th>状态</th>
                <th>处理人</th>
                <th>进度</th>
                <th>期望上线</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((demand) => (
                <tr className="clickable" key={demand.id} onClick={() => setSelectedId(demand.id)}>
                  <td>
                    <strong>{demand.name}</strong>
                    <div className="muted-text">{demand.id} · {demand.implementation}</div>
                  </td>
                  <td>{demand.team}</td>
                  <td>
                    {canAdjustPriority ? (
                      <select
                        className="inline-select"
                        value={demand.priority}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => onPriorityChange(demand.id, event.target.value as Priority)}
                      >
                        {priorities.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    ) : (
                      <StatusTag tone={demand.priority === "P0" ? "red" : demand.priority === "P1" ? "orange" : "gray"}>{demand.priority}</StatusTag>
                    )}
                  </td>
                  <td>
                    <StatusTag tone={toneForStatus(demand.status)}>{demand.status}</StatusTag>
                  </td>
                  <td>{demand.handler}</td>
                  <td>
                    <div className="progress-cell">
                      <ProgressBar value={demand.progress} />
                      <span>{demand.progress}%</span>
                    </div>
                  </td>
                  <td>{demand.targetDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="entity-card-grid">
            {filtered.map((demand) => (
              <button className="entity-card demand-card" key={demand.id} onClick={() => setSelectedId(demand.id)}>
                <div className="entity-card-head">
                  <span>{demand.id}</span>
                  <StatusTag tone={toneForStatus(demand.status)}>{demand.status}</StatusTag>
                </div>
                <strong>{demand.name}</strong>
                <p>{demand.objective}</p>
                <div className="card-meta">
                  <StatusTag tone={demand.priority === "P0" ? "red" : demand.priority === "P1" ? "orange" : "gray"}>{demand.priority}</StatusTag>
                  <StatusTag tone={demand.implementation === "合作实现" ? "blue" : demand.implementation === "内部实现" ? "cyan" : "violet"}>{demand.implementation}</StatusTag>
                </div>
                <div className="compact-grid">
                  <span>团队：{demand.team}</span>
                  <span>处理：{demand.handler}</span>
                  <span>上线：{demand.targetDate}</span>
                  <span>评分：{demand.acceptanceReview ? `${demand.acceptanceReview.score}/5` : "待评分"}</span>
                </div>
                <div className="progress-cell">
                  <ProgressBar value={demand.progress} />
                  <span>{demand.progress}%</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Drawer title={selected?.name ?? ""} open={Boolean(selected)} onClose={() => setSelectedId(null)}>
        {selected ? (
          <>
            <div className="lifecycle">
              {selected.lifecycleSteps.map((step) => (
                <span className={step.current ? "current" : step.done ? "done" : ""} key={step.name}>
                  {step.name}
                </span>
              ))}
            </div>
            <div className="detail-list">
              <div><span>需求编号</span><strong>{selected.id}</strong></div>
              <div><span>提出人</span><strong>{selected.requester}</strong></div>
              <div><span>当前处理人</span><strong>{selected.handler}</strong></div>
              <div><span>关联项目</span><strong>{selected.linkedProject}</strong></div>
              <div><span>交付评分</span><strong>{selected.acceptanceReview ? `${selected.acceptanceReview.score} / 5` : "待验收后评分"}</strong></div>
            </div>
            {selectedFlow ? (
              <div className="panel-soft-block flow-detail-block">
                <DemandProjectFlowBoard flow={selectedFlow} />
              </div>
            ) : null}
            <div className="panel-soft-block">
              <strong>业务目标</strong>
              <p>{selected.objective}</p>
              <strong>需求描述</strong>
              <p>{selected.description}</p>
            </div>
            <div className="panel-soft-block">
              <strong>产品分析</strong>
              <p>{selected.analysis.feasibility}</p>
              <div className="compact-grid">
                <span>价值评分：{selected.analysis.valueScore}</span>
                <span>迭代版本：{selected.analysis.iteration}</span>
                <span>资源方案：{selected.analysis.resourcePlan}</span>
                <span>实现决策：{selected.analysis.implementationReason}</span>
              </div>
            </div>
            {canAdjustPriority ? (
              <>
                <SectionHeader title="优先级调整" />
                {activeUser.isDepartmentOwner ? (
                  <div className="assignment-strip">
                    <div>
                      <strong>分配业务确认 / 验收</strong>
                      <span>{selected.name} · 当前提出人：{selected.requester}</span>
                    </div>
                    <button className="btn" type="button" onClick={() => onAssignWork("沈岚", "demand", selected.id, `${selected.name} 的业务确认和验收`)}>
                      分配给沈岚
                    </button>
                  </div>
                ) : null}
                <div className="filters">
                  {priorities.map((item) => (
                    <button className={item === selected.priority ? "btn" : "btn secondary"} key={item} onClick={() => onPriorityChange(selected.id, item)}>
                      {item}
                    </button>
                  ))}
                </div>
                <ul className="timeline">
                  {selected.priorityHistory.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </>
            ) : (
            <div className="panel-soft-block">
              <strong>优先级</strong>
              <div className="muted-text">{selected.priority}</div>
            </div>
            )}
            <SectionHeader
              title="验收评分"
              action={<button className="btn secondary" onClick={() => setReviewing(true)}><Star size={15} /> 发起评分</button>}
            />
            {selected.acceptanceReview ? (
              <div className="panel-soft-block">
                <strong>{selected.acceptanceReview.conclusion} · {selected.acceptanceReview.score} / 5</strong>
                <p>{selected.acceptanceReview.comment}</p>
                <span className="muted-text">{selected.acceptanceReview.reviewer} · {selected.acceptanceReview.date}</span>
              </div>
            ) : (
              <div className="empty-state"><strong>待业务验收评分</strong><span>等待运营提交验收结论。</span></div>
            )}
            <SectionHeader title="里程碑" />
            <ul className="timeline">
              {selected.milestones.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <SectionHeader title="沟通记录" />
            <ul className="timeline">
              {selected.comments.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </>
        ) : null}
      </Drawer>

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

      <Modal title="新建业务需求" open={creating} onClose={() => setCreating(false)}>
        <div className="form-grid">
          <label>需求名称<input defaultValue="GxP 培训记录查询优化" /></label>
          <label>业务目标<input defaultValue="提高培训记录检索效率，支撑审计检查" /></label>
          <label>优先级<select defaultValue="P1"><option>P0</option><option>P1</option><option>P2</option><option>P3</option></select></label>
          <label>期望上线<input type="date" defaultValue="2026-06-30" /></label>
          <label className="wide">需求描述<textarea defaultValue="运营中心希望按员工、SOP、培训批次快速查询培训完成情况，并保留审计追踪。" /></label>
          <label className="wide">附件上传区域<input value="需求说明.docx / 审计检查样例.xlsx" readOnly /></label>
        </div>
        <div className="split-actions">
          <button className="btn secondary" onClick={() => setCreating(false)}>取消</button>
          <button className="btn" onClick={() => setCreating(false)}>提交需求</button>
        </div>
      </Modal>
    </section>
  );
}

function ViewToggle({
  value,
  onChange
}: {
  value: "list" | "card";
  onChange: (value: "list" | "card") => void;
}) {
  return (
    <div className="view-toggle">
      <button className={value === "card" ? "selected" : ""} onClick={() => onChange("card")}>卡片</button>
      <button className={value === "list" ? "selected" : ""} onClick={() => onChange("list")}>列表</button>
    </div>
  );
}
