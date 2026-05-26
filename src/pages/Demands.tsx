import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { Demand, Priority } from "../types";
import { Modal, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";

const priorities: Priority[] = ["P0", "P1", "P2", "P3"];

export function Demands({
  demands,
  canAdjustPriority = true,
  onPriorityChange,
  onOpenDetail
}: {
  demands: Demand[];
  canAdjustPriority?: boolean;
  onPriorityChange: (id: string, priority: Priority) => void;
  onOpenDetail: (id: string) => void;
}) {
  const [status, setStatus] = useState("全部状态");
  const [priority, setPriority] = useState("全部优先级");
  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [keyword, setKeyword] = useState("");
  const [creating, setCreating] = useState(false);

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
            {["全部状态", "草稿", "需求评审", "方案确认", "项目启动", "项目进行", "项目验收", "验收完成", "已打回", "已放弃"].map((item) => (
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
        <SectionHeader title="需求列表" action={<ViewToggle value={viewMode} onChange={setViewMode} />} />
        {viewMode === "list" ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>需求</th>
                <th>优先级</th>
                <th>状态</th>
                <th>处理人</th>
                <th>进度</th>
                <th>下一步</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((demand) => (
                <tr className="clickable" key={demand.id} onClick={() => onOpenDetail(demand.id)}>
                  <td>
                    <strong>{demand.name}</strong>
                    <div className="muted-text">{demand.id} · {demand.team} · {demand.implementation}</div>
                  </td>
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
                  <td>{nextDemandAction(demand)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="entity-card-grid">
            {filtered.map((demand) => (
              <button className="entity-card demand-card compact-entity-card" key={demand.id} onClick={() => onOpenDetail(demand.id)}>
                <div className="entity-card-head">
                  <span>{demand.id}</span>
                  <StatusTag tone={toneForStatus(demand.status)}>{demand.status}</StatusTag>
                </div>
                <strong>{demand.name}</strong>
                <div className="card-meta">
                  <StatusTag tone={demand.priority === "P0" ? "red" : demand.priority === "P1" ? "orange" : "gray"}>{demand.priority}</StatusTag>
                  <StatusTag tone={demand.implementation === "合作实现" ? "blue" : demand.implementation === "内部实现" ? "cyan" : "violet"}>{demand.implementation}</StatusTag>
                </div>
                <div className="compact-grid">
                  <span>团队：{demand.team}</span>
                  <span>处理：{demand.handler}</span>
                  <span>下一步：{nextDemandAction(demand)}</span>
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

      <Modal title="新建业务需求" open={creating} onClose={() => setCreating(false)}>
        <div className="form-grid">
          <label>需求名称<input defaultValue="GxP 培训记录查询优化" /></label>
          <label>业务目标<input defaultValue="提高培训记录检索效率，支撑审计检查" /></label>
          <label>优先级<select defaultValue="P1"><option>P0</option><option>P1</option><option>P2</option><option>P3</option></select></label>
          <label>期望上线<input type="date" defaultValue="2026-06-30" /></label>
          <label className="wide">需求描述<textarea defaultValue="业务部门希望按员工、SOP、培训批次快速查询培训完成情况，并保留审计追踪。" /></label>
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

function nextDemandAction(demand: Demand) {
  if (demand.status === "草稿") return "发起需求评审";
  if (demand.status === "需求评审") return "产品经理评审";
  if (demand.status === "方案确认") return "需求方确认方案";
  if (demand.status === "项目启动") return "项目经理启动";
  if (demand.status === "项目进行") return "跟踪里程碑";
  if (demand.status === "项目验收") return "产品经理验收";
  if (demand.status === "验收完成") return "需求方评分";
  if (demand.status === "已打回") return "补充需求后再提交";
  if (demand.status === "已放弃") return "查看关闭记录";
  return "关注状态变化";
}
