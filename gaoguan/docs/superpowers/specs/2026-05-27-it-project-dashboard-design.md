# IT Project Chairman Dashboard Design

## Goal

Build a professional chairman-facing IT project management dashboard with a desktop command-center view and an H5 mobile summary view.

## Decisions

- Overall layout: business undertaking analysis layout.
- Visual style: dark command-center style, restrained navy background, blue/cyan primary data, amber warning, red critical risk.
- Demand module: total funnel plus department heatmap.
- Resource module: two separate decision charts.
  - People: department by week workload heatmap.
  - Money: project-level budget execution, actual spend, forecast deviation, and spend-progress quadrant.
- Delivery module: current-month key project roadmap Gantt chart with previous/next month navigation.
- Risk module: chairman management insight cards, written as impact, reason, and suggested action.
- Mobile H5: separate single-column layout, not a shrunken desktop. Prioritize KPIs, risks, key project status, and drill tabs.

## Desktop Layout

The desktop first screen uses a dark board with top filters, six KPI cards, and a two-column dashboard:

- Left top: demand undertaking funnel plus department heatmap.
- Right top and middle: resource investment, with people and money separated.
- Left middle: current-month key project Gantt roadmap.
- Bottom full width: risk insight cards.

The board uses dense but organized information. Cards use subtle borders and limited elevation. No decorative blobs or marketing-style hero.

## Mobile H5 Layout

The H5 view is optimized for executive quick checks:

- Header with date, month, and department context.
- Four priority KPI cards: completed demand, high risks, peak workload, forecast overspend.
- Tabs: overview, resources, delivery, risks.
- Overview shows the demand funnel, key project status, and two top risk cards.

## Mock Data

Prototype data should be intentionally full:

- 8 departments.
- 12 key projects.
- Monthly demand counts by department.
- Weekly workload percentages by department.
- Project budget, actual spend, forecast spend, delivery progress, and risk status.
- 5-8 risk insights derived from demand/resource/delivery data.

## Interactions

- Department filter updates all modules.
- Month navigation switches the Gantt month.
- H5 tabs switch mobile content sections.
- Risk cards remain readable at desktop and mobile widths.

## Implementation Notes

- Empty workspace, so create a new Vite React app structure.
- Use local mock data and CSS/SVG/CSS chart primitives for speed and deterministic rendering.
- Keep files focused:
  - `src/data.js` for mock data and derived selectors.
  - `src/App.jsx` for layout and components.
  - `src/styles.css` for visual system and responsive behavior.

## Self Review

- No placeholder requirements remain.
- Desktop and H5 are explicitly separate responsive experiences.
- People and money are separate charts.
- Risk language is management-oriented, not a generic risk list.
- Scope is one prototype application and is suitable for one implementation plan.
