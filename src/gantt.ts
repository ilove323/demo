import type { Project, ResourceCalendarEntry, ResourcePerson, Task, Tone } from "./types";

export interface GanttBar {
  id: string;
  label: string;
  start: string;
  end: string;
  tone: Tone;
  meta?: string;
  progress?: number;
  lane?: number;
  invalid?: boolean;
  detailItems?: { label: string; value: string }[];
}

export interface GanttRow {
  id: string;
  label: string;
  subLabel: string;
  status?: string;
  statusTone?: Tone;
  meta?: string;
  bars: GanttBar[];
}

export interface GanttGroup {
  id: string;
  title: string;
  subtitle?: string;
  rows: GanttRow[];
}

const projectPalette: Tone[] = ["blue", "cyan", "green", "violet", "orange", "red"];
const projectStageOrder = ["待受理", "已立项", "资源排期中", "实施中", "联调测试中", "验收支持中", "已上线", "已归档"];

export function buildProjectGanttGroups(projects: Project[], tasks: Task[]): GanttGroup[] {
  const taskByProject = groupBy(tasks, (task) => task.projectId);
  const grouped = groupBy(projects, projectMainTeam);

  return ["IT部项目治理", "研发部交付实施", "运营中心验收上线"].map((title, groupIndex) => {
    const rows = (grouped.get(title) ?? []).map((project, index) => {
      const projectTasks = taskByProject.get(project.id) ?? [];
      const range = projectDateRange(project, projectTasks, index + groupIndex);
      const nextMilestone = project.milestones.find((milestone) => milestone.status !== "完成") ?? project.milestones.at(-1);
      const nextMilestoneText = nextMilestone ? `${nextMilestone.name} ${nextMilestone.date}` : "暂无里程碑";
      return {
        id: project.id,
        label: project.name,
        subLabel: `${project.owner} · ${project.projectType} · ${project.implementation}`,
        status: project.stage,
        statusTone: toneForProjectStage(project.stage),
        meta: nextMilestone ? `下一节点：${nextMilestone.name} ${nextMilestone.date}` : `${project.progress}%`,
        bars: [
          {
            id: `${project.id}-delivery`,
            label: `${project.stage} · ${project.progress}%`,
            start: range.start,
            end: range.end,
            tone: projectTone(project.id),
            progress: project.progress,
            meta: `${project.id} · ${project.taskIds.length} 个关联任务`,
            detailItems: [
              { label: "项目", value: project.name },
              { label: "阶段", value: project.stage },
              { label: "起止", value: `${range.start} 至 ${range.end}` },
              { label: "负责人", value: project.owner },
              { label: "进度", value: `${project.progress}%` },
              { label: "风险", value: `${project.risk} · ${project.riskReason}` },
              { label: "AI 结论", value: `${project.aiScore.recommendation} · ${project.aiScore.total}分` },
              { label: "下一里程碑", value: nextMilestoneText }
            ]
          }
        ]
      };
    });

    return {
      id: title,
      title,
      subtitle: teamSubtitle(title),
      rows
    };
  }).filter((group) => group.rows.length > 0);
}

export function buildResourceGanttGroups(resourcePeople: ResourcePerson[], calendarEntries: ResourceCalendarEntry[], projects: Project[]): GanttGroup[] {
  const projectByName = new Map(projects.map((project) => [project.name, project]));
  const calendarByPersonProject = new Map<string, ResourceCalendarEntry[]>();

  calendarEntries.forEach((entry) => {
    const key = `${entry.person}::${entry.project}`;
    calendarByPersonProject.set(key, [...(calendarByPersonProject.get(key) ?? []), entry]);
  });

  const rows = resourcePeople.map((person, personIndex) => {
    const bars = person.allocations.map((allocation, allocationIndex) => {
      const project = projectByName.get(allocation.project);
      const entries = calendarByPersonProject.get(`${person.name}::${allocation.project}`) ?? [];
      const range = resourceDateRange(entries, allocationIndex, personIndex);
      const load = Math.round((allocation.hours / Math.max(person.capacity, 1)) * 100);
      const entrySummary = entries.length > 0 ? `${entries.length} 条排期 · ${entries.reduce((sum, entry) => sum + entry.hours, 0)}h` : "暂无日历排期";
      return {
        id: `${person.name}-${allocation.project}-${allocationIndex}`,
        label: `${shortProjectName(allocation.project)} ${load}%`,
        start: range.start,
        end: range.end,
        tone: project ? projectTone(project.id) : "red",
        progress: load,
        meta: project ? allocation.work : `数据异常：未匹配项目 ${allocation.project}`,
        lane: allocationIndex % 2,
        invalid: !project,
        detailItems: [
          { label: "人员", value: person.name },
          { label: "角色", value: person.role },
          { label: "任务", value: allocation.work },
          { label: "项目", value: allocation.project },
          { label: "起止", value: `${range.start} 至 ${range.end}` },
          { label: "投入", value: `${allocation.hours}h · ${entrySummary}` },
          { label: "状态", value: allocation.status },
          { label: "负载", value: `${person.assigned}/${person.capacity}h · ${loadStatus(Math.round((person.assigned / Math.max(person.capacity, 1)) * 100))}` }
        ]
      };
    });

    const loadRate = Math.round((person.assigned / Math.max(person.capacity, 1)) * 100);
    return {
      id: person.name,
      label: person.name,
      subLabel: person.role,
      status: loadStatus(loadRate),
      statusTone: loadTone(loadRate),
      meta: `${person.assigned}/${person.capacity}h · ${person.allocations.length} 项占用`,
      bars
    };
  });

  return [
    {
      id: "internal-resource",
      title: "IT内部资源投入",
      subtitle: "按人员展示项目和任务占用，条形来源于人员分配与排期日历",
      rows
    }
  ];
}

export function buildResourceRiskAlerts(resourcePeople: ResourcePerson[]) {
  return [...resourcePeople]
    .sort((a, b) => b.assigned / b.capacity - a.assigned / a.capacity)
    .map((person) => {
      const load = Math.round((person.assigned / Math.max(person.capacity, 1)) * 100);
      const mainAllocation = person.allocations[0];
      return {
        id: person.name,
        title: `${person.name} · ${person.role}`,
        tone: loadTone(load),
        status: loadStatus(load),
        body:
          load > 100
            ? `本周负载 ${load}%，${mainAllocation?.project ?? "重点项目"} 已超过容量，建议项目经理重排窗口或拆分任务。`
            : load < 50
              ? `本周负载 ${load}%，可承接低风险支持任务，优先补位延期项目。`
              : `本周负载 ${load}%，主要占用在 ${mainAllocation?.project ?? "内部项目"}，当前排期可控。`
      };
    });
}

function projectDateRange(project: Project, tasks: Task[], index: number) {
  const dates = [
    ...project.milestones.map((milestone) => milestone.date),
    ...tasks.map((task) => task.due)
  ].filter(Boolean);
  const earliest = dates.length > 0 ? minDate(dates) : "2026-05-25";
  const latest = dates.length > 0 ? maxDate(dates) : "2026-06-30";
  const stageIndex = Math.max(0, projectStageOrder.indexOf(project.stage));
  return {
    start: addDays(earliest, -12 - Math.min(stageIndex, 4) * 3 - (index % 3) * 2),
    end: addDays(latest, 10 + Math.max(0, 4 - stageIndex) * 3)
  };
}

function resourceDateRange(entries: ResourceCalendarEntry[], allocationIndex: number, personIndex: number) {
  if (entries.length > 0) {
    const dates = entries.map((entry) => entry.date);
    return {
      start: minDate(dates),
      end: addDays(maxDate(dates), Math.max(4, entries.length * 2))
    };
  }
  const start = addDays("2026-05-26", allocationIndex * 8 + (personIndex % 3) * 3);
  return { start, end: addDays(start, 18 + allocationIndex * 5) };
}

function projectMainTeam(project: Project) {
  if (["待受理", "已立项", "资源排期中"].includes(project.stage)) return "IT部项目治理";
  if (["实施中", "联调测试中"].includes(project.stage)) return "研发部交付实施";
  return "运营中心验收上线";
}

function teamSubtitle(title: string) {
  if (title === "IT部项目治理") return "项目申请、立项、资源排期和供应商治理";
  if (title === "研发部交付实施") return "内部开发、联调、技术问题处理";
  return "业务验收、上线确认和归档配合";
}

function toneForProjectStage(stage: string): Tone {
  if (stage.includes("验收") || stage.includes("上线") || stage.includes("归档")) return "green";
  if (stage.includes("实施") || stage.includes("联调")) return "blue";
  if (stage.includes("排期")) return "orange";
  return "cyan";
}

function loadTone(load: number): Tone {
  if (load > 100) return "red";
  if (load >= 85) return "orange";
  if (load < 50) return "cyan";
  return "green";
}

function loadStatus(load: number) {
  if (load > 100) return "超载";
  if (load >= 85) return "偏高";
  if (load < 50) return "空闲";
  return "正常";
}

function projectTone(projectId: string): Tone {
  const hash = Array.from(projectId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return projectPalette[hash % projectPalette.length];
}

function shortProjectName(value: string) {
  return value.replace("SAP S/4HANA ", "SAP ").replace("一期", "").slice(0, 12);
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const result = new Map<string, T[]>();
  items.forEach((item) => {
    const key = getKey(item);
    result.set(key, [...(result.get(key) ?? []), item]);
  });
  return result;
}

function minDate(values: string[]) {
  return values.reduce((min, value) => (value < min ? value : min), values[0]);
}

function maxDate(values: string[]) {
  return values.reduce((max, value) => (value > max ? value : max), values[0]);
}

function addDays(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
