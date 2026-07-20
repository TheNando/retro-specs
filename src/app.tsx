import { useState } from "preact/hooks";
import { prRanges, type PrRange } from "./client/prRange";
import { ConfigModal } from "./libs/ConfigModal";
import { LineOfCodeChart } from "./libs/LineOfCodeChart";
import { MergedPrsChart } from "./libs/MergedPrsChart";
import { Nav } from "./libs/Nav";
import { PullsTable } from "./libs/PullsTable";
import { ReviewsChart } from "./libs/ReviewsChart";
import { TableTabs, type TableTab } from "./libs/TableTabs";

const rangeStorageKey = "pr_range";
const tabStorageKey = "pr_tab";

const savedRange = () => {
  const value = window.localStorage.getItem(rangeStorageKey);
  return prRanges.some((range) => range.value === value)
    ? (value as PrRange)
    : "last-week";
};

const savedTab = (): TableTab => {
  const value = window.localStorage.getItem(tabStorageKey);
  return value === "merged-prs" || value === "reviews" || value === "loc" ? value : "pulls";
};

export const App = () => {
  const [activeTab, setActiveTab] = useState<TableTab>(savedTab);
  const [range, setRange] = useState<PrRange>(savedRange);
  const updateActiveTab = (tab: TableTab) => {
    window.localStorage.setItem(tabStorageKey, tab);
    setActiveTab(tab);
  };
  const updateRange = (value: PrRange) => {
    window.localStorage.setItem(rangeStorageKey, value);
    setRange(value);
  };

  return (
    <>
      <Nav />

      <div class="container mx-auto">
        <div class="grid grid-cols-4 gap-4 mt-10">
          <TableTabs
            activeTab={activeTab}
            onSelect={updateActiveTab}
            range={range}
            onRangeChange={updateRange}
          />
          {activeTab === "pulls" ? (
            <PullsTable range={range} />
          ) : activeTab === "merged-prs" ? (
            <MergedPrsChart range={range} />
          ) : activeTab === "loc" ? (
            <LineOfCodeChart range={range} />
          ) : (
            <ReviewsChart range={range} />
          )}
        </div>
        <ConfigModal />
      </div>
    </>
  );
};
