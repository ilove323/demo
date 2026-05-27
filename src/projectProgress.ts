import type { Project, ProjectStage } from "./types";

export function projectDeliveryProgress(project: Pick<Project, "stage" | "progress">) {
  return project.stage === "项目准备" || project.stage === "项目启动" ? 0 : project.progress;
}

export function projectProgressForStage(stage: ProjectStage) {
  const map: Record<ProjectStage, number> = {
    项目准备: 0,
    项目启动: 0,
    项目进行: 68,
    项目完成: 92,
    项目结束: 100
  };
  return map[stage];
}
