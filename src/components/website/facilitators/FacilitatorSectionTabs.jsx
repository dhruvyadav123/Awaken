"use client";

import { Children, useState } from "react";

const tabs = [
  { id: "about", label: "About" },
  { id: "sessions", label: "Sessions" },
  { id: "courses", label: "Courses" },
  { id: "classes", label: "Classes & Workshops" },
];

export default function FacilitatorSectionTabs({ children }) {
  const panels = Children.toArray(children);
  const availableTabs = tabs.filter((tab) => panels.some((panel) => panel?.props?.id === tab.id));
  const [activeId, setActiveId] = useState(availableTabs[0]?.id || "about");

  return (
    <div className="mt-12">
      <div className="relative left-1/2 w-screen -translate-x-1/2">
        <nav
          aria-label="Facilitator sections"
          role="tablist"
          className="w-full rounded-2xl border border-[#d9e6d8] bg-[#f4f8f2] p-2 shadow-[0_8px_24px_rgba(40,75,49,0.05)]"
        >
          <div className="flex w-full gap-1 overflow-x-auto overscroll-x-contain">
            {availableTabs.map((tab) => {
              const active = tab.id === activeId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`${tab.id}-panel`}
                  onClick={() => setActiveId(tab.id)}
                  className={`min-h-11 min-w-[130px] flex-1 shrink-0 rounded-xl px-4 text-center text-sm font-semibold whitespace-nowrap transition sm:px-5 ${active ? "bg-[#72a37a] text-white shadow-[0_5px_14px_rgba(83,132,91,0.22)]" : "text-[#567360] hover:bg-white hover:text-[#3f7650]"}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <div>
        {panels.map((panel) => {
          const id = panel?.props?.id;
          const active = id === activeId;
          return (
            <div key={id || panel.key} id={`${id}-panel`} role="tabpanel" aria-hidden={!active} hidden={!active}>
              {panel}
            </div>
          );
        })}
      </div>
    </div>
  );
}
