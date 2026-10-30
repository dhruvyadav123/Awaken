"use client";

import { Children, useState } from "react";

const tabLabels = [
  ["overview", "Overview"],
  ["curriculum", "Curriculum"],
  ["facilitator", "Facilitator"],
];

export default function CourseDetailTabs({ children }) {
  const panels = Children.toArray(children);
  const availableTabs = tabLabels.filter(([id]) => panels.some((panel) => panel?.props?.["data-course-panel"] === id));
  const [activeTab, setActiveTab] = useState(availableTabs[0]?.[0] || "overview");

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto border-b border-[#e2e7f1] pb-2" role="tablist" aria-label="Course information">
        {availableTabs.map(([id, label]) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${id}-course-panel`}
              onClick={() => setActiveTab(id)}
              className={`min-h-10 shrink-0 rounded-full px-5 text-sm font-semibold transition ${active ? "bg-[#6f66df] !text-white shadow-[0_6px_16px_rgba(91,83,217,0.2)]" : "bg-[#eef0f6] text-[#62677d] hover:bg-[#e5e7f0] hover:text-[#444a68]"}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="pt-7">
        {panels.map((panel) => {
          const id = panel?.props?.["data-course-panel"];
          const active = id === activeTab;
          return (
            <div key={id || panel.key} id={`${id}-course-panel`} role="tabpanel" aria-hidden={!active} hidden={!active}>
              {panel}
            </div>
          );
        })}
      </div>
    </div>
  );
}
