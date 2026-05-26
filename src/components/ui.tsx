import { X } from "lucide-react";
import type { ReactNode } from "react";
import type { Tone } from "../types";

export function SectionHeader({
  eyebrow,
  title,
  action
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function MetricCard({ label, value, delta, tone }: { label: string; value: string; delta: string; tone: Tone }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{delta}</small>
    </article>
  );
}

export function StatusTag({ children, tone = "gray" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`tag tone-${tone}`}>{children}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress" aria-label={`进度 ${value}%`}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Drawer({
  title,
  open,
  onClose,
  children
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <h3>{title}</h3>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}

export function Modal({
  title,
  open,
  onClose,
  size = "default",
  children
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  size?: "default" | "wide";
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <section className={size === "wide" ? "modal wide" : "modal"} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <h3>{title}</h3>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

export function MiniBarChart({ data, suffix = "" }: { data: { label: string; value: number }[]; suffix?: string }) {
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);
  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div className="bar-row" key={item.label}>
          <span>{item.label}</span>
          <div className="bar-track">
            <i style={{ width: `${(Math.abs(item.value) / max) * 100}%` }} />
          </div>
          <strong>
            {item.value}
            {suffix}
          </strong>
        </div>
      ))}
    </div>
  );
}

export function TrendLine({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="trend">
      {data.map((item) => (
        <div className="trend-point" key={item.label}>
          <span style={{ height: `${(item.value / max) * 100}%` }} />
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

export function toneForStatus(status: string): Tone {
  if (["已完成", "已上线", "已归档", "低", "完成", "已批准", "已受理", "已立项", "已关闭", "启用"].includes(status)) return "green";
  if (["交付中", "实施中", "联调测试中", "验收支持中", "进行中", "产品评估中", "资源排期中"].includes(status)) return "blue";
  if (["待业务确认", "待产品承接", "待项目受理", "待受理", "待验收", "待审批", "待确认", "待项目经理受理", "评估中", "测算中", "退回补充", "中"].includes(status)) return "orange";
  if (["暂停", "高", "延期风险", "风险"].includes(status)) return "red";
  return "gray";
}
