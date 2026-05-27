import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Handshake,
  Hourglass,
  ListChecks,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
      <div className="metric-card-head">
        <span className="metric-card-label">{label}</span>
        <MetricIcon label={label} tone={tone} />
      </div>
      <strong>{value}</strong>
      <small>{delta}</small>
    </article>
  );
}

export function MetricIcon({ label, tone }: { label: string; tone: Tone }) {
  const Icon = iconForMetric(label);
  return (
    <span className={`metric-icon tone-${tone}`} aria-hidden="true">
      <Icon size={16} strokeWidth={2} />
    </span>
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

function iconForMetric(label: string): LucideIcon {
  if (label.includes("需求")) return FileText;
  if (label.includes("项目")) return BriefcaseBusiness;
  if (label.includes("资源") || label.includes("人员")) return Users;
  if (label.includes("风险") || label.includes("预警") || label.includes("缺陷")) return AlertTriangle;
  if (label.includes("工时")) return Clock3;
  if (label.includes("验收") || label.includes("评分")) return Star;
  if (label.includes("预算") || label.includes("合同") || label.includes("外采")) return Wallet;
  if (label.includes("任务")) return ListChecks;
  if (label.includes("进行")) return Activity;
  if (label.includes("待") || label.includes("审批")) return Hourglass;
  if (label.includes("供应商") || label.includes("协作")) return Handshake;
  if (label.includes("AI")) return Sparkles;
  if (label.includes("完成") || label.includes("关闭")) return BadgeCheck;
  if (label.includes("启动")) return CalendarClock;
  if (label.includes("健康") || label.includes("进度")) return TrendingUp;
  return CheckCircle2;
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
        <div className="modal-head">
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
  if (["已完成", "低", "完成", "已批准", "已启动", "项目结束", "启用"].includes(status)) return "green";
  if (["项目进行", "进行中", "需求评审"].includes(status)) return "blue";
  if (["方案确认", "项目准备", "项目启动", "项目完成", "待审批", "待确认", "评估中", "测算中", "中"].includes(status)) return "orange";
  if (["暂停", "高", "延期风险", "风险"].includes(status)) return "red";
  return "gray";
}
