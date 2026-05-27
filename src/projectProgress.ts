import type { Project, ProjectStage } from "./types";

export function projectDeliveryProgress(project: Pick<Project, "stage" | "progress">) {
  return project.stage === "项目启动" ? 0 : project.progress;
}

export function projectProgressForStage(stage: ProjectStage) {
  const map: Record<ProjectStage, number> = {
    项目启动: 0,
    项目进行: 68,
    项目验收: 88,
    验收完成: 100
  };
  return map[stage];
}
