import type { GanttBar, GanttGroup } from "../gantt";
import type { Tone } from "../types";
import { StatusTag } from "./ui";
import { useState } from "react";
import type { CSSProperties } from "react";

const defaultStart = "2026-05-01";
const defaultEnd = "2026-10-31";
const today = "2026-05-26";

export function GanttTimeline({
  groups,
  start = defaultStart,
  end = defaultEnd,
  onBarClick,
  compact = false
}: {
  groups: GanttGroup[];
  start?: string;
  end?: string;
  onBarClick?: (bar: GanttBar) => void;
  compact?: boolean;
}) {
  const totalDays = Math.max(1, diffDays(start, end) + 1);
  const monthSegments = buildMonthSegments(start, end);
  const todayOffset = offsetPercent(today, start, totalDays);
  const [selectedBar, setSelectedBar] = useState<GanttBar | null>(null);

  return (
    <div className={compact ? "gantt compact" : "gantt"}>
      <div className="gantt-scroll">
        <div className="gantt-canvas">
          <div className="gantt-head">
            <div className="gantt-head-label">
              <strong>对象</strong>
              <span>角色 / 状态 / 下一节点</span>
            </div>
            <div className="gantt-scale">
              <div className="gantt-months">
                {monthSegments.map((month) => (
                  <span key={month.label} style={{ left: `${month.left}%`, width: `${month.width}%` }}>
                    {month.label}
                  </span>
                ))}
              </div>
              <div className="gantt-ticks">
                {Array.from({ length: Math.ceil(totalDays / 7) + 1 }, (_, index) => (
                  <i key={index} style={{ left: `${Math.min(100, (index * 7 / totalDays) * 100)}%` }} />
                ))}
              </div>
            </div>
          </div>

          {groups.map((group) => (
            <section className="gantt-group" key={group.id}>
              <div className="gantt-group-title">
                <strong>{group.title}</strong>
                {group.subtitle ? <span>{group.subtitle}</span> : null}
              </div>
              {group.rows.map((row) => {
                const laneCount = Math.max(1, ...row.bars.map((bar) => (bar.lane ?? 0) + 1));
                return (
                  <div className={`gantt-row${selectedBar && row.bars.some((bar) => bar.id === selectedBar.id) ? " selected" : ""}`} key={row.id} style={{ "--row-height": `${compact ? 62 + laneCount * 28 : 78 + laneCount * 34}px` } as CSSProperties}>
                    <div className="gantt-row-label">
                      <strong>{row.label}</strong>
                      <span>{row.subLabel}</span>
                      <div className="gantt-row-meta">
                        {row.status ? <StatusTag tone={row.statusTone ?? "gray"}>{row.status}</StatusTag> : null}
                        {row.meta ? <small>{row.meta}</small> : null}
                      </div>
                    </div>
                    <div className="gantt-track">
                      {todayOffset >= 0 && todayOffset <= 100 ? (
                        <span className="gantt-today" style={{ left: `${todayOffset}%` }}>
                          <em>今日</em>
                        </span>
                      ) : null}
                      {row.bars.map((bar) => (
                        <button
                          className={`gantt-bar tone-${bar.tone}${bar.invalid ? " invalid" : ""}`}
                          key={bar.id}
                          style={barStyle(bar, start, totalDays, compact)}
                          type="button"
                          onClick={() => setSelectedBar(bar)}
                          onDoubleClick={() => onBarClick?.(bar)}
                          aria-label={`${bar.label}，${bar.meta ?? ""}`}
                        >
                          <span className="gantt-bar-content">
                            <b>{bar.label}</b>
                            <small>{formatShortDate(bar.start)} - {formatShortDate(bar.end)}</small>
                          </span>
                          {typeof bar.progress === "number" ? <i style={{ width: `${Math.min(100, Math.max(0, bar.progress))}%` }} /> : null}
                          <GanttDetailCard bar={bar} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      </div>
      <div className="gantt-legend">
        {(["blue", "cyan", "green", "violet", "orange", "red"] as Tone[]).map((tone) => (
          <span key={tone}><i className={`tone-${tone}`} />{legendLabel(tone)}</span>
        ))}
        <strong>红线：今天 2026-05-26</strong>
      </div>
      {selectedBar ? (
        <div className="gantt-selected-detail">
          <div>
            <strong>{selectedBar.label}</strong>
            <span>{selectedBar.meta}</span>
          </div>
          <GanttDetailItems bar={selectedBar} />
          {onBarClick ? <button className="btn secondary" type="button" onClick={() => onBarClick(selectedBar)}>打开详情</button> : null}
        </div>
      ) : null}
    </div>
  );
}

function GanttDetailCard({ bar }: { bar: GanttBar }) {
  return (
    <span className="gantt-detail-card" role="tooltip">
      <strong>{bar.label}</strong>
      {bar.meta ? <em>{bar.meta}</em> : null}
      <GanttDetailItems bar={bar} />
    </span>
  );
}

function GanttDetailItems({ bar }: { bar: GanttBar }) {
  return (
    <span className="gantt-detail-items">
      {(bar.detailItems ?? [{ label: "说明", value: bar.meta ?? bar.label }]).map((item) => (
        <span key={`${item.label}${item.value}`}>
          <small>{item.label}</small>
          <b>{item.value}</b>
        </span>
      ))}
    </span>
  );
}

function barStyle(bar: GanttBar, start: string, totalDays: number, compact: boolean) {
  const lane = bar.lane ?? 0;
  const left = offsetPercent(bar.start, start, totalDays);
  const end = offsetPercent(bar.end, start, totalDays);
  const width = Math.max(2.5, end - left);
  return {
    left: `${Math.max(0, Math.min(100, left))}%`,
    top: `${compact ? 14 + lane * 32 : 20 + lane * 38}px`,
    width: `${Math.min(100 - Math.max(0, left), width)}%`
  } as CSSProperties;
}

function buildMonthSegments(start: string, end: string) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const totalDays = Math.max(1, diffDays(start, end) + 1);
  const segments: { label: string; left: number; width: number }[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor <= endDate) {
    const monthStart = new Date(cursor);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const visibleStart = monthStart < startDate ? startDate : monthStart;
    const visibleEnd = monthEnd > endDate ? endDate : monthEnd;
    segments.push({
      label: `${cursor.getFullYear()}年${cursor.getMonth() + 1}月`,
      left: (diffDays(startDate, visibleStart) / totalDays) * 100,
      width: ((diffDays(visibleStart, visibleEnd) + 1) / totalDays) * 100
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return segments;
}

function offsetPercent(value: string, start: string, totalDays: number) {
  return (diffDays(start, value) / totalDays) * 100;
}

function diffDays(start: string | Date, end: string | Date) {
  const startDate = typeof start === "string" ? parseDate(start) : start;
  const endDate = typeof end === "string" ? parseDate(end) : end;
  return Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function legendLabel(tone: Tone) {
  const labels: Record<Tone, string> = {
    blue: "项目推进",
    cyan: "空闲/待排",
    green: "正常",
    violet: "协同",
    orange: "偏高/待关注",
    red: "超载/风险",
    gray: "其他"
  };
  return labels[tone];
}
