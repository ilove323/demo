import { Clock, MoveRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { resourceCalendars } from "../data";
import { FilterPanel } from "../components/FilterPanel";
import type { Project, RoleId, RoleOption, Task, TaskPresetFilter, TaskStatus } from "../types";
import { ScheduleCalendar } from "../components/ScheduleCalendar";
import { Modal, ProgressBar, SectionHeader, StatusTag, toneForStatus } from "../components/ui";

const statuses: TaskStatus[] = ["待开始", "进行中", "测试中", "已完成", "暂停"];
const allOption = "全部";
const dueBuckets = [
  { value: "all", label: "全部截止时间" },
  { value: "thisWeek", label: "本周截止" },
  { value: "nextWeek", label: "下周截止" },
  { value: "overdue", label: "已逾期" }
];

export function Tasks({
  tasks,
  projects,
  activeRole,
  activeUser,
  presetFilter,
  onStatusChange,
  onAddWorklog,
  onCreateTask
}: {
  tasks: Task[];
  projects: Project[];
  activeRole: RoleId;
  activeUser: RoleOption;
  presetFilter: TaskPresetFilter | null;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onAddWorklog: (id: string, hours: number, note: string) => void;
  onCreateTask: (projectId: string, parentTaskId: string | undefined, title: string, estimate: number, due: string, note: string) => void;
}) {
  const [selected, setSelected] = useState<Task | null>(null);
  const [creatingFrom, setCreatingFrom] = useState<Task | null | "new">(null);
  const [newTaskProjectId, setNewTaskProjectId] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("拆分开发子任务");
  const [newTaskEstimate, setNewTaskEstimate] = useState("4");
  const [newTaskDue, setNewTaskDue] = useState("2026-06-05");
  const [newTaskNote, setNewTaskNote] = useState("补充任务边界、验收口径和预估工时。");
  const [hours, setHours] = useState("2");
  const [note, setNote] = useState("补充联调和自测记录");
  const [filters, setFilters] = useState({
    keyword: "",
    project: allOption,
    status: allOption,
    role: allOption,
    owner: allOption,
    due: "all"
  });

  const current = selected ? tasks.find((task) => task.id === selected.id) ?? selected : null;
  const isRdOwner = activeRole === "developer";
  const currentDeveloper = taskScopeLabel(activeRole, activeUser);
  const visibleTasks = useMemo(
    () => scopeTasks(tasks, projects, activeRole, activeUser),
    [activeRole, activeUser, projects, tasks]
  );
  const visibleTaskIds = useMemo(() => new Set(visibleTasks.map((task) => task.id)), [visibleTasks]);
  const baseCalendarEntries = useMemo(
    () =>
      resourceCalendars.filter((entry) => {
        if (!visibleTaskIds.has(entry.taskId)) return false;
        if (activeRole === "developer") return entry.person === activeUser.userName;
        if (isRdOwner) return ["吴承", "姜曼", "韩冰", "陆川", "罗清"].includes(entry.person);
        return true;
      }),
    [activeRole, activeUser.userName, isRdOwner, visibleTaskIds]
  );
  const projectOptions = useMemo(() => unique(visibleTasks.map((task) => task.project)), [visibleTasks]);
  const ownerOptions = useMemo(() => unique(visibleTasks.map((task) => task.owner)), [visibleTasks]);
  const roleOptions = useMemo(() => unique(visibleTasks.map((task) => task.role)), [visibleTasks]);
  const filteredTasks = useMemo(
    () =>
      visibleTasks.filter((task) => {
        const keyword = filters.keyword.trim().toLowerCase();
        const matchesKeyword =
          !keyword ||
          [task.title, task.project, task.owner, task.role, task.description, task.id].some((value) => value.toLowerCase().includes(keyword));
        return (
          matchesKeyword &&
          matchesSelect(task.project, filters.project) &&
          matchesSelect(task.status, filters.status) &&
          matchesSelect(task.role, filters.role) &&
          matchesSelect(task.owner, filters.owner) &&
          matchesDueBucket(task.due, filters.due)
        );
      }),
    [filters, visibleTasks]
  );
  const filteredCalendarEntries = useMemo(
    () =>
      baseCalendarEntries.filter((entry) => {
        const keyword = filters.keyword.trim().toLowerCase();
        const matchesKeyword =
          !keyword ||
          [entry.task, entry.project, entry.person, entry.status].some((value) => value.toLowerCase().includes(keyword));
        return (
          matchesKeyword &&
          matchesSelect(entry.project, filters.project) &&
          matchesSelect(entry.status, filters.status) &&
          matchesSelect(entry.person, filters.owner)
        );
      }),
    [baseCalendarEntries, filters]
  );
  const activeFilterCount = countActiveFilters(filters, {
    keyword: "",
    project: allOption,
    status: allOption,
    role: allOption,
    owner: allOption,
    due: "all"
  });
  const resetFilters = () => setFilters({ keyword: "", project: allOption, status: allOption, role: allOption, owner: allOption, due: "all" });
  const taskProjectOptions = useMemo(() => {
    const projectIds = new Set(visibleTasks.map((task) => task.projectId));
    return projects.filter((project) => projectIds.has(project.id) || activeRole === "admin" || activeRole === "pm");
  }, [activeRole, projects, visibleTasks]);

  function openCreateTask(parent: Task | null = null) {
    setCreatingFrom(parent ?? "new");
    setNewTaskProjectId(parent?.projectId ?? taskProjectOptions[0]?.id ?? "");
    setNewTaskTitle(parent ? `${parent.title} - 子任务` : "拆分开发子任务");
    setNewTaskEstimate("4");
    setNewTaskDue(parent?.due ?? "2026-06-05");
    setNewTaskNote(parent ? `从 ${parent.id} 拆分，补充开发边界和验收口径。` : "补充任务边界、验收口径和预估工时。");
  }

  function submitNewTask() {
    if (!newTaskProjectId || !newTaskTitle.trim()) return;
    onCreateTask(newTaskProjectId, typeof creatingFrom === "object" && creatingFrom ? creatingFrom.id : undefined, newTaskTitle.trim(), Number(newTaskEstimate) || 0, newTaskDue, newTaskNote);
    setCreatingFrom(null);
  }

  useEffect(() => {
    if (!presetFilter) return;
    setFilters((currentFilters) => ({
      ...currentFilters,
      keyword: presetFilter.keyword ?? presetFilter.taskId ?? "",
      project: presetFilter.projectName ?? allOption,
      status: allOption,
      role: allOption,
      owner: allOption,
      due: "all"
    }));
    const presetTask = tasks.find((task) => task.id === presetFilter.taskId);
    setSelected(presetTask ?? null);
  }, [presetFilter, tasks]);

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>任务与工时</h1>
        </div>
        <div className="section-actions">
          {["admin", "developer"].includes(activeRole) ? <button className="btn" type="button" onClick={() => openCreateTask()}>新增子任务</button> : null}
          <StatusTag tone="orange">{isRdOwner ? `部门任务 ${visibleTasks.length}` : "本周工时填报率 78%"}</StatusTag>
        </div>
      </div>

      <div className="panel">
        <FilterPanel title="任务筛选" summary={`显示 ${filteredTasks.length} / ${visibleTasks.length} 个任务`} activeCount={activeFilterCount}>
          <div className="filter-bar">
            <input
              aria-label="按任务、项目、负责人搜索"
              placeholder="搜索任务 / 项目 / 负责人"
              value={filters.keyword}
              onChange={(event) => setFilters((currentFilters) => ({ ...currentFilters, keyword: event.target.value }))}
            />
            <select value={filters.project} onChange={(event) => setFilters((currentFilters) => ({ ...currentFilters, project: event.target.value }))}>
              <option value={allOption}>全部项目</option>
              {projectOptions.map((project) => <option key={project} value={project}>{project}</option>)}
            </select>
            <select value={filters.status} onChange={(event) => setFilters((currentFilters) => ({ ...currentFilters, status: event.target.value }))}>
              <option value={allOption}>全部状态</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={filters.role} onChange={(event) => setFilters((currentFilters) => ({ ...currentFilters, role: event.target.value }))}>
              <option value={allOption}>全部任务角色</option>
              {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <select
              disabled={!isRdOwner && ownerOptions.length <= 1}
              value={filters.owner}
              onChange={(event) => setFilters((currentFilters) => ({ ...currentFilters, owner: event.target.value }))}
            >
              <option value={allOption}>{isRdOwner ? "全部成员" : "本人可见人员"}</option>
              {ownerOptions.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
            </select>
            <select value={filters.due} onChange={(event) => setFilters((currentFilters) => ({ ...currentFilters, due: event.target.value }))}>
              {dueBuckets.map((bucket) => <option key={bucket.value} value={bucket.value}>{bucket.label}</option>)}
            </select>
            <button className="btn secondary" onClick={resetFilters}>清空筛选</button>
          </div>
        </FilterPanel>
        <ScheduleCalendar
          title="我的排期日历"
          subtitle={`${currentDeveloper} · 日/周/月查看每天 task 与所属项目`}
          entries={filteredCalendarEntries}
        />
      </div>

      <div className="kanban">
        {statuses.map((status) => (
          <div className="kanban-column" key={status}>
            <h3>{status}</h3>
            {filteredTasks.filter((task) => task.status === status).map((task) => (
              <button className="task-card" key={task.id} onClick={() => setSelected(task)}>
                <strong>{task.title}</strong>
                <small>{task.project}</small>
                <StatusTag tone={toneForStatus(task.status)}>{task.owner} · {task.role}</StatusTag>
                <div className="progress-cell">
                  <ProgressBar value={Math.round((task.actual / Math.max(task.estimate, 1)) * 100)} />
                  <span>{task.actual}/{task.estimate}h</span>
                </div>
                <small><Clock size={13} /> {task.due}</small>
              </button>
            ))}
          </div>
        ))}
      </div>
      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <strong>没有符合条件的任务</strong>
          <span>当前筛选条件下暂无任务。</span>
        </div>
      ) : null}

      <Modal title={current?.title ?? ""} open={Boolean(current)} onClose={() => setSelected(null)}>
        {current ? (
          <>
            <div className="detail-list">
              <div><span>所属项目</span><strong>{current.project}</strong></div>
              <div><span>负责人</span><strong>{current.owner}</strong></div>
              <div><span>角色</span><strong>{current.role}</strong></div>
              <div><span>工时</span><strong>{current.actual} / {current.estimate} 小时</strong></div>
              <div><span>截止日期</span><strong>{current.due}</strong></div>
            </div>
            <div className="panel-soft-block">
              <strong>任务说明</strong>
              <p>{current.description}</p>
            </div>
            <SectionHeader title="状态维护" />
            <div className="filters">
              {statuses.map((status) => (
                <button className={status === current.status ? "btn" : "btn secondary"} key={status} onClick={() => onStatusChange(current.id, status)}>
                  {status === current.status ? null : <MoveRight size={14} />} {status}
                </button>
              ))}
            </div>
            <SectionHeader title="工时填报" />
            <div className="form-grid">
              <label>本次工时<input value={hours} onChange={(event) => setHours(event.target.value)} /></label>
              <label className="wide">备注<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
            </div>
            <div className="split-actions">
              {["admin", "developer"].includes(activeRole) ? <button className="btn secondary" onClick={() => openCreateTask(current)}>拆分子任务</button> : null}
              <button className="btn" onClick={() => onAddWorklog(current.id, Number(hours) || 0, note)}>保存工时</button>
            </div>
            <SectionHeader title="填报记录" />
            <ul className="timeline">
              {current.worklogs.map((log) => <li key={`${log.date}${log.note}`}>{log.date} · {log.hours}h · {log.note}</li>)}
            </ul>
          </>
        ) : null}
      </Modal>
      <Modal title={creatingFrom && creatingFrom !== "new" ? `拆分 ${creatingFrom.id}` : "新增子任务"} open={Boolean(creatingFrom)} onClose={() => setCreatingFrom(null)}>
        <div className="form-grid">
          <label>
            所属项目
            <select value={newTaskProjectId} onChange={(event) => setNewTaskProjectId(event.target.value)}>
              {taskProjectOptions.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label>预估工时<input value={newTaskEstimate} onChange={(event) => setNewTaskEstimate(event.target.value)} /></label>
          <label>截止日期<input value={newTaskDue} onChange={(event) => setNewTaskDue(event.target.value)} /></label>
          <label className="wide">任务标题<input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} /></label>
          <label className="wide">拆分说明 / 留言<textarea value={newTaskNote} onChange={(event) => setNewTaskNote(event.target.value)} /></label>
        </div>
        <div className="split-actions">
          <button className="btn secondary" onClick={() => setCreatingFrom(null)}>取消</button>
          <button className="btn" onClick={submitNewTask} disabled={!newTaskProjectId || !newTaskTitle.trim()}>创建子任务</button>
        </div>
      </Modal>
    </section>
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean);
}

function matchesSelect(value: string, selected: string) {
  return selected === allOption || value === selected;
}

function countActiveFilters<T extends Record<string, string>>(filters: T, defaults: T) {
  return Object.keys(filters).filter((key) => filters[key].trim() !== defaults[key]).length;
}

function matchesDueBucket(due: string, bucket: string) {
  if (bucket === "all") return true;
  const dueDate = new Date(`${due}T00:00:00`);
  const today = new Date("2026-05-26T00:00:00");
  const weekEnd = new Date("2026-06-01T00:00:00");
  const nextWeekEnd = new Date("2026-06-08T00:00:00");
  if (bucket === "overdue") return dueDate < today;
  if (bucket === "thisWeek") return dueDate >= today && dueDate < weekEnd;
  if (bucket === "nextWeek") return dueDate >= weekEnd && dueDate < nextWeekEnd;
  return true;
}

function scopeTasks(tasks: Task[], projects: Project[], activeRole: RoleId, activeUser: RoleOption) {
  if (activeRole === "admin") return tasks;
  if (activeRole === "pm") {
    const projectIds = new Set(projects.filter((project) => project.owner === activeUser.userName || project.supplierManager === activeUser.userName).map((project) => project.id));
    return tasks.filter((task) => projectIds.has(task.projectId));
  }
  if (activeRole === "developer") {
    return tasks.filter((task) => task.owner === activeUser.userName);
  }
  return [];
}

function taskScopeLabel(activeRole: RoleId, activeUser: RoleOption) {
  if (activeRole === "admin") return "全量任务";
  if (activeRole === "pm") return "本人治理项目";
  if (activeRole === "developer") return "本人开发任务";
  return activeUser.userName;
}
