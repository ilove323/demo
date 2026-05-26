import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { CalendarViewMode, ResourceCalendarEntry } from "../types";
import { SectionHeader, StatusTag, toneForStatus } from "./ui";

const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function ScheduleCalendar({
  title,
  subtitle,
  entries,
  defaultMode = "week"
}: {
  title: string;
  subtitle?: string;
  entries: ResourceCalendarEntry[];
  defaultMode?: CalendarViewMode;
}) {
  const [mode, setMode] = useState<CalendarViewMode>(defaultMode);
  const [cursorDate, setCursorDate] = useState(() => entries[0]?.date ?? "2026-05-25");
  const [selectedEntry, setSelectedEntry] = useState<ResourceCalendarEntry | null>(null);
  const orderedEntries = useMemo(
    () =>
      [...entries].sort((a, b) =>
        `${a.date}-${slotOrder(a.timeSlot)}-${a.task}`.localeCompare(`${b.date}-${slotOrder(b.timeSlot)}-${b.task}`)
      ),
    [entries]
  );
  const cursor = parseDate(cursorDate);
  const dayEntries = entriesForDate(orderedEntries, cursorDate);
  const weekDays = getWeekDays(cursor);
  const monthDays = getMonthDays(cursor);

  return (
    <div className="schedule-calendar">
      <SectionHeader
        eyebrow="排期日历"
        title={title}
        action={<CalendarToggle value={mode} onChange={(value) => setMode(value)} />}
      />
      {subtitle ? <p className="calendar-subtitle">{subtitle}</p> : null}
      <div className="calendar-toolbar">
        <button className="icon-button" onClick={() => setCursorDate(shiftDate(cursor, mode, -1))} aria-label="上一段">
          <ChevronLeft size={17} />
        </button>
        <strong>{formatRangeLabel(cursor, mode)}</strong>
        <button className="icon-button" onClick={() => setCursorDate(shiftDate(cursor, mode, 1))} aria-label="下一段">
          <ChevronRight size={17} />
        </button>
      </div>
      {mode === "day" ? (
        <div className="calendar-day-view">
          <div className="calendar-date-strip">
            {weekDays.map((day) => (
              <button
                className={cursorDate === day.date ? "selected" : ""}
                key={day.date}
                onClick={() => setCursorDate(day.date)}
              >
                <span>{day.label}</span>
                <strong>{day.month}/{day.day}</strong>
              </button>
            ))}
          </div>
          <div className="calendar-day-list">
            {dayEntries.length > 0 ? dayEntries.map((entry) => <ScheduleBlock entry={entry} key={scheduleEntryKey(entry)} onSelect={setSelectedEntry} selected={selectedEntry ? scheduleEntryKey(selectedEntry) === scheduleEntryKey(entry) : false} />) : (
              <div className="calendar-empty">当天暂无排期</div>
            )}
          </div>
        </div>
      ) : null}
      {mode === "week" ? (
        <div className="calendar-week-grid">
          {weekDays.map((day) => {
            const entriesForDay = entriesForDate(orderedEntries, day.date);
            return (
              <div className="calendar-day-cell" key={day.date}>
                <div className="calendar-cell-head">
                  <span>{day.label}</span>
                  <strong>{day.month}/{day.day}</strong>
                </div>
                <div className="calendar-cell-events">
                  {entriesForDay.length > 0 ? entriesForDay.map((entry) => <ScheduleBlock entry={entry} key={scheduleEntryKey(entry)} onSelect={setSelectedEntry} selected={selectedEntry ? scheduleEntryKey(selectedEntry) === scheduleEntryKey(entry) : false} />) : (
                    <div className="calendar-empty">无排期</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {mode === "month" ? (
        <div className="calendar-month-grid">
          {monthDays.map((day) => {
            const entriesForDay = entriesForDate(orderedEntries, day.date);
            const totalHours = entriesForDay.reduce((sum, entry) => sum + entry.hours, 0);
            return (
              <div className={entriesForDay.length > 0 ? "calendar-month-cell busy" : "calendar-month-cell"} key={day.date}>
                <div className="calendar-cell-head">
                  <span>{day.label}</span>
                  <strong>{day.day}</strong>
                </div>
                <div className="calendar-cell-events">
                  {entriesForDay.slice(0, 2).map((entry) => (
                    <ScheduleBlock compact entry={entry} key={scheduleEntryKey(entry)} onSelect={setSelectedEntry} selected={selectedEntry ? scheduleEntryKey(selectedEntry) === scheduleEntryKey(entry) : false} />
                  ))}
                  {entriesForDay.length > 2 ? <small>另 {entriesForDay.length - 2} 项</small> : null}
                </div>
                {totalHours > 0 ? <em>{totalHours}h</em> : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {selectedEntry ? (
        <div className="calendar-selected-detail">
          <div>
            <strong>{selectedEntry.task}</strong>
            <StatusTag tone={toneForStatus(selectedEntry.status)}>{selectedEntry.status}</StatusTag>
          </div>
          <CalendarDetailItems entry={selectedEntry} />
        </div>
      ) : null}
    </div>
  );
}

function ScheduleBlock({
  entry,
  compact = false,
  selected = false,
  onSelect
}: {
  entry: ResourceCalendarEntry;
  compact?: boolean;
  selected?: boolean;
  onSelect: (entry: ResourceCalendarEntry) => void;
}) {
  return (
    <button className={`${compact ? "schedule-block compact" : "schedule-block"} tone-${toneForStatus(entry.status)}${selected ? " selected" : ""}`} type="button" onClick={() => onSelect(entry)}>
      <div>
        <span>{entry.timeSlot} · {entry.hours}h</span>
        <StatusTag tone={toneForStatus(entry.status)}>{entry.status}</StatusTag>
      </div>
      <strong>{entry.task}</strong>
      <p>{entry.project}</p>
      <span className="calendar-detail-card" role="tooltip">
        <strong>{entry.task}</strong>
        <CalendarDetailItems entry={entry} />
      </span>
    </button>
  );
}

function CalendarDetailItems({ entry }: { entry: ResourceCalendarEntry }) {
  return (
    <span className="calendar-detail-items">
      <span><small>人员</small><b>{entry.person}</b></span>
      <span><small>日期</small><b>{entry.date}</b></span>
      <span><small>时段</small><b>{entry.timeSlot} · {entry.hours}h</b></span>
      <span><small>任务</small><b>{entry.taskId}</b></span>
      <span><small>项目</small><b>{entry.projectId} · {entry.project}</b></span>
      <span><small>状态</small><b>{entry.status}</b></span>
    </span>
  );
}

function scheduleEntryKey(entry: ResourceCalendarEntry) {
  return `${entry.date}-${entry.timeSlot}-${entry.person}-${entry.taskId}-${entry.projectId}`;
}

function CalendarToggle({
  value,
  onChange
}: {
  value: CalendarViewMode;
  onChange: (value: CalendarViewMode) => void;
}) {
  return (
    <div className="view-toggle">
      <button className={value === "day" ? "selected" : ""} onClick={() => onChange("day")}>日</button>
      <button className={value === "week" ? "selected" : ""} onClick={() => onChange("week")}>周</button>
      <button className={value === "month" ? "selected" : ""} onClick={() => onChange("month")}>月</button>
    </div>
  );
}

function slotOrder(slot: ResourceCalendarEntry["timeSlot"]) {
  if (slot === "上午") return 1;
  if (slot === "下午") return 2;
  return 0;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function shiftDate(date: Date, mode: CalendarViewMode, direction: -1 | 1) {
  const next = new Date(date);
  if (mode === "day") {
    next.setDate(next.getDate() + direction);
  } else if (mode === "week") {
    next.setDate(next.getDate() + direction * 7);
  } else {
    next.setMonth(next.getMonth() + direction);
  }
  return formatDate(next);
}

function getWeekStart(date: Date) {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
}

function getWeekDays(date: Date) {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, index) => {
    const item = addDays(start, index);
    return {
      date: formatDate(item),
      label: weekdayLabels[item.getDay()],
      month: item.getMonth() + 1,
      day: item.getDate()
    };
  });
}

function getMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const item = new Date(year, month, index + 1);
    return {
      date: formatDate(item),
      label: `${month + 1}月`,
      day: item.getDate()
    };
  });
}

function entriesForDate(entries: ResourceCalendarEntry[], date: string) {
  return entries.filter((entry) => entry.date === date);
}

function formatRangeLabel(date: Date, mode: CalendarViewMode) {
  if (mode === "day") return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  if (mode === "month") return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  const start = getWeekStart(date);
  const end = addDays(start, 6);
  return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
}
