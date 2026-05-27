import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function FilterPanel({
  title = "筛选",
  eyebrow,
  summary,
  activeCount = 0,
  children
}: {
  title?: string;
  eyebrow?: string;
  summary: string;
  activeCount?: number;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, []);

  return (
    <div className={`filter-panel${expanded ? " expanded" : ""}`}>
      <button className="filter-panel-toggle" type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        <span className="filter-panel-title">
          <SlidersHorizontal size={16} />
          <span>
            {eyebrow ? <small>{eyebrow}</small> : null}
            <strong>{title}</strong>
          </span>
        </span>
        <span className="filter-panel-summary">
          {activeCount > 0 ? <i>{activeCount} 项筛选</i> : null}
          <em>{summary}</em>
          <b>{expanded ? "收起" : "筛选"}</b>
          <ChevronDown size={16} />
        </span>
      </button>
      <div className="filter-panel-body">{children}</div>
    </div>
  );
}
