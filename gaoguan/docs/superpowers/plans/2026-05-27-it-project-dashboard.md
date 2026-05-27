# IT Project Chairman Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite React prototype for a chairman-facing IT project management dashboard with desktop and H5 responsive views.

**Architecture:** A single React SPA uses local mock data and derived selectors. The desktop and mobile views share the same data but render different layouts through responsive CSS and mobile tabs.

**Tech Stack:** Vite, React, plain CSS, local mock data.

---

## File Structure

- Create `package.json`: project scripts and dependencies.
- Create `index.html`: Vite entry page.
- Create `src/main.jsx`: React bootstrap.
- Create `src/data.js`: mock departments, projects, demand, workload, risk insights, and selector helpers.
- Create `src/App.jsx`: dashboard components and interactions.
- Create `src/styles.css`: dark command-center visual system and H5 responsive layout.

## Tasks

### Task 1: Scaffold Vite React

- [ ] Create `package.json`, `index.html`, `src/main.jsx`.
- [ ] Install dependencies with `npm install`.
- [ ] Run `npm run build`; expected result: Vite builds successfully after app files are added.

### Task 2: Add Mock Data

- [ ] Create `src/data.js` with at least 8 departments, 12 projects, demand metrics, workload heatmap data, financial metrics, Gantt ranges, and risk insights.
- [ ] Include helper functions for filtering by department and month.

### Task 3: Build Dashboard UI

- [ ] Create `src/App.jsx` with KPI cards, demand funnel, department heatmap, workload heatmap, project budget view, Gantt roadmap, and risk insight cards.
- [ ] Add department filter, month navigation, and H5 tabs.

### Task 4: Style Desktop and H5

- [ ] Create `src/styles.css` with the dark command-center visual language.
- [ ] Add responsive CSS so desktop uses the full board and mobile uses single-column H5 sections.
- [ ] Ensure text does not overflow buttons, cards, or chart labels.

### Task 5: Verify

- [ ] Run `npm run build`.
- [ ] Start the dev server.
- [ ] Verify the URL loads.
- [ ] Inspect desktop and mobile dimensions with screenshots or browser checks where available.

## Self Review

- Spec coverage: all dashboard modules, H5 layout, interactions, and mock data are covered.
- Placeholder scan: no `TBD`, `TODO`, or deferred requirements.
- Type consistency: component and data names are intentionally simple JavaScript objects.
