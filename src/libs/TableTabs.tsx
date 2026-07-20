import type { JSX } from "preact/jsx-runtime";
import { prRanges, type PrRange } from "../client/prRange";

export type TableTab = "pulls" | "merged-prs" | "reviews" | "loc";

type TableTabsProps = {
  activeTab: TableTab;
  onSelect: (tab: TableTab) => void;
  range: PrRange;
  onRangeChange: (range: PrRange) => void;
};

export const TableTabs = ({
  activeTab,
  onSelect,
  range,
  onRangeChange,
}: TableTabsProps) => {
  const selectRange = (event: JSX.TargetedEvent<HTMLSelectElement>) =>
    onRangeChange(event.currentTarget.value as PrRange);

  return (
    <>
      <div class="col-span-1"></div>
      <div class="col-span-2 flex items-center gap-3">
        <div role="tablist" class="tabs tabs-boxed flex-1 items-center px-2">
          <button
            role="tab"
            class={`tab ${activeTab === "pulls" ? "tab-active" : ""}`}
            onClick={() => onSelect("pulls")}
          >
            Pulls
          </button>
          <button
            role="tab"
            class={`tab ${activeTab === "merged-prs" ? "tab-active" : ""}`}
            onClick={() => onSelect("merged-prs")}
          >
            Merged
          </button>
          <button
            role="tab"
            class={`tab ${activeTab === "reviews" ? "tab-active" : ""}`}
            onClick={() => onSelect("reviews")}
          >
            Reviews
          </button>
          <button
            role="tab"
            class={`tab ${activeTab === "loc" ? "tab-active" : ""}`}
            onClick={() => onSelect("loc")}
          >
            LoC
          </button>
        </div>
        <select
          class="select select-bordered select-sm"
          aria-label="Pull request range"
          value={range}
          onChange={selectRange}
        >
          {prRanges.map((option) => (
            <option value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </>
  );
};
