# 高管工作台迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `gaoguan/` 的高管驾驶舱迁移为当前系统内的高管工作台。

**Architecture:** 新增高管专用 dashboard 分支和局部 CSS，复用当前 `Dashboard` props 与项目详情跳转。数据从当前 mock 状态派生，页面跟随现有 `AppLayout` 和主题变量。

**Tech Stack:** Vite, React, TypeScript, CSS, lucide-react.

---

### Task 1: 默认主题与高管入口

**Files:**
- Modify: `src/App.tsx`

- [ ] 把全局主题初始值从 `light` 改为 `dark`，满足高管工作台默认暗色。
- [ ] 保持现有主题切换回调不变。

### Task 2: 高管驾驶舱组件

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] 保留原有普通 dashboard 函数，给 `role === "executive" || role === "admin"` 增加高管驾驶舱分支。
- [ ] 从 `projects`、`demands`、`tasks`、`flows` 派生 KPI、需求热力、资源负荷、预算排行、甘特条和风险洞察。
- [ ] 项目相关元素调用 `onOpenProjectDetail(project.id)`。
- [ ] 不引入 `gaoguan` 独立数据文件。

### Task 3: 高管驾驶舱样式

**Files:**
- Modify: `src/styles.css`

- [ ] 新增 `.executive-dashboard` 命名空间样式。
- [ ] dark 样式使用当前系统暗色变量和高管大屏视觉。
- [ ] light 样式通过现有非 `.theme-dark` 变量提供浅色版本。
- [ ] 主内容宽度使用当前布局剩余区域，避免居中窄容器。

### Task 4: 验证

**Files:**
- Build output may update `dist/` if build emits files.

- [ ] 运行 `npm run build`。
- [ ] 运行 `git diff --check`。
- [ ] 检查 `dashboard` 页面在高管和管理员角色下可渲染。
- [ ] 检查点击项目能进入项目详情。
