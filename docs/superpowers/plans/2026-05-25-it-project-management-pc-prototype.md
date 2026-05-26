# IT Project Management PC Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished PC web prototype for the IT project management system described in the approved PRD/design spec.

**Architecture:** Create a Vite + React + TypeScript single-page application with static mock data. The app uses one shell layout with sidebar navigation, top role switcher, reusable UI primitives, and page modules for dashboard, demands, projects, tasks, resources, reports, permissions, and notifications.

**Tech Stack:** Vite, React, TypeScript, CSS modules via plain CSS files, lucide-react icons, static in-memory state.

---

## File Structure

- Create `package.json`: npm scripts and dependencies.
- Create `index.html`: Vite entry HTML.
- Create `src/main.tsx`: React bootstrapping.
- Create `src/App.tsx`: global route/page state, role state, task/notification state.
- Create `src/styles.css`: full visual system, layout, responsive desktop behavior.
- Create `src/types.ts`: shared domain types.
- Create `src/data.ts`: roles, metrics, demands, projects, tasks, resources, reports, users, permissions, notifications.
- Create `src/components/Layout.tsx`: sidebar and topbar.
- Create `src/components/ui.tsx`: cards, tags, progress bars, modal, drawer, simple chart helpers.
- Create `src/pages/Dashboard.tsx`: role-aware dashboard.
- Create `src/pages/Demands.tsx`: demand list, filters, new demand modal, detail drawer.
- Create `src/pages/Projects.tsx`: project list and detail drawer.
- Create `src/pages/Tasks.tsx`: kanban board, task detail modal, status change, worklog form.
- Create `src/pages/Resources.tsx`: resource pool, requests, budget/supplier tables.
- Create `src/pages/Reports.tsx`: performance and analytics page.
- Create `src/pages/Permissions.tsx`: users, roles, permission matrix.
- Create `src/pages/Notifications.tsx`: notification list and subscription toggles.

## Tasks

### Task 1: Scaffold the Frontend App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create npm/Vite project files**

Create `package.json` with:

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc && vite build",
    "preview": "vite preview --host 0.0.0.0"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {}
}
```

Create `index.html` with a `div#root` and `/src/main.tsx` module script.

- [ ] **Step 2: Add the React entry**

Create `src/main.tsx` that imports React, ReactDOM, `App`, and `styles.css`, then renders `<App />` into `#root`.

- [ ] **Step 3: Add a temporary shell**

Create `src/App.tsx` with a simple `IT项目管理系统原型` heading so the scaffold can run before feature pages exist.

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 5: Verify scaffold**

Run: `npm run build`

Expected: TypeScript and Vite build complete without errors.

- [ ] **Step 6: Commit scaffold**

Run:

```bash
git add package.json package-lock.json index.html src/main.tsx src/App.tsx src/styles.css
git commit -m "feat: scaffold pc prototype app"
```

### Task 2: Add Domain Types and Mock Data

**Files:**
- Create: `src/types.ts`
- Create: `src/data.ts`

- [ ] **Step 1: Define shared types**

Create `src/types.ts` with string union types for roles, pages, demand statuses, project stages, task statuses, risk levels, notification channels, plus interfaces for dashboard metrics, demands, projects, tasks, resources, reports, users, permissions, and notifications.

- [ ] **Step 2: Add static mock data**

Create `src/data.ts` exporting:

- `roles`
- `navItems`
- `dashboardByRole`
- `demands`
- `projects`
- `initialTasks`
- `resourcePeople`
- `resourceRequests`
- `supplierBudgets`
- `reportData`
- `users`
- `permissionRows`
- `initialNotifications`
- `subscriptionTypes`

Use realistic Chinese business data from the PRD domain, including internal and external implementation examples.

- [ ] **Step 3: Verify data compiles**

Run: `npm run build`

Expected: no TypeScript errors.

- [ ] **Step 4: Commit data layer**

Run:

```bash
git add src/types.ts src/data.ts
git commit -m "feat: add prototype mock data"
```

### Task 3: Build Layout and Shared UI Components

**Files:**
- Create: `src/components/Layout.tsx`
- Create: `src/components/ui.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Create UI primitives**

Create reusable components in `src/components/ui.tsx`: `MetricCard`, `StatusTag`, `ProgressBar`, `Drawer`, `Modal`, `MiniBarChart`, `TrendLine`, `SectionHeader`, and `EmptyState`.

- [ ] **Step 2: Create shell layout**

Create `src/components/Layout.tsx` with `AppLayout`, `Sidebar`, and `Topbar`. It receives current page, role, nav items, notifications count, and callbacks for page/role changes.

- [ ] **Step 3: Wire layout in App**

Update `src/App.tsx` to hold `activePage`, `activeRole`, task state, and notification state. Render a placeholder page body through `AppLayout`.

- [ ] **Step 4: Add full visual system CSS**

Update `src/styles.css` with desktop layout, sidebar, topbar, buttons, tables, cards, tags, drawers, modals, charts, kanban, forms, and responsive constraints.

- [ ] **Step 5: Verify layout**

Run: `npm run build`

Expected: no compile errors.

- [ ] **Step 6: Commit layout**

Run:

```bash
git add src/components/Layout.tsx src/components/ui.tsx src/App.tsx src/styles.css
git commit -m "feat: add prototype layout system"
```

### Task 4: Implement Dashboard, Demands, and Projects Pages

**Files:**
- Create: `src/pages/Dashboard.tsx`
- Create: `src/pages/Demands.tsx`
- Create: `src/pages/Projects.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Build role-aware dashboard**

Create `Dashboard.tsx` rendering role-specific metric cards, stage distribution, resource/budget trend, risk projects, and role-oriented todo list.

- [ ] **Step 2: Build demand management**

Create `Demands.tsx` with filters, demand table, priority/status tags, new demand modal, and demand detail drawer with milestones, comments, linked project, and acceptance score.

- [ ] **Step 3: Build project management**

Create `Projects.tsx` with project table, implementation type tags, risk tags, gantt-style stage bars, and project detail drawer with milestones, tasks, resources, budget, and risk records.

- [ ] **Step 4: Wire pages into App**

Update `App.tsx` to render dashboard, demands, and projects based on `activePage`.

- [ ] **Step 5: Verify pages**

Run: `npm run build`

Expected: no compile errors.

- [ ] **Step 6: Commit pages**

Run:

```bash
git add src/pages/Dashboard.tsx src/pages/Demands.tsx src/pages/Projects.tsx src/App.tsx src/styles.css
git commit -m "feat: add dashboard demand and project pages"
```

### Task 5: Implement Tasks, Resources, Reports, Permissions, and Notifications Pages

**Files:**
- Create: `src/pages/Tasks.tsx`
- Create: `src/pages/Resources.tsx`
- Create: `src/pages/Reports.tsx`
- Create: `src/pages/Permissions.tsx`
- Create: `src/pages/Notifications.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Build task and worklog page**

Create `Tasks.tsx` with kanban columns, task detail modal, status update action, and worklog form that updates local task state.

- [ ] **Step 2: Build resources and budget page**

Create `Resources.tsx` with people resource pool, utilization bars, resource request table, internal person-day summary, and supplier budget table.

- [ ] **Step 3: Build reports page**

Create `Reports.tsx` with delivery score trend, completion rate, budget deviation ranking, risk distribution, and team/supplier score sections.

- [ ] **Step 4: Build permissions page**

Create `Permissions.tsx` with user table, role cards, permission matrix, and project data-scope table.

- [ ] **Step 5: Build notifications page**

Create `Notifications.tsx` with notification list, channel tags, read/unread toggle, and subscription switches.

- [ ] **Step 6: Wire pages into App**

Update `App.tsx` to render all page modules and pass task/notification state callbacks.

- [ ] **Step 7: Verify pages**

Run: `npm run build`

Expected: no compile errors.

- [ ] **Step 8: Commit pages**

Run:

```bash
git add src/pages/Tasks.tsx src/pages/Resources.tsx src/pages/Reports.tsx src/pages/Permissions.tsx src/pages/Notifications.tsx src/App.tsx src/styles.css
git commit -m "feat: complete pc prototype pages"
```

### Task 6: Final Polish and Verification

**Files:**
- Modify: any affected source files

- [ ] **Step 1: Run production build**

Run: `npm run build`

Expected: build completes without errors.

- [ ] **Step 2: Start local dev server**

Run: `npm run dev -- --port 5173`

Expected: Vite serves the app at `http://localhost:5173/`.

- [ ] **Step 3: Manually verify core flows**

Check:

- Sidebar navigation reaches all 8 modules.
- Role switcher changes dashboard title and metrics.
- Demand detail drawer opens and closes.
- New demand modal opens and closes.
- Project detail drawer opens and closes.
- Task detail modal opens, status can change, worklog can be added.
- Notification read state and subscription switches change.
- Desktop view has no obvious overlap or blank main regions.

- [ ] **Step 4: Commit final polish if needed**

Run:

```bash
git add .
git commit -m "chore: polish prototype verification"
```

Only commit if source files changed during polish.

## Self-Review

- Spec coverage: dashboard, demands, projects, tasks/worklog, resources/budget, reports, permissions, notifications, role switcher, static data, and no-backend constraint are covered by Tasks 1-6.
- Placeholder scan: no TBD/TODO/fill-later language is used as implementation instructions.
- Type consistency: shared data and page props will be defined in `src/types.ts`, then imported by data, App, and pages.
