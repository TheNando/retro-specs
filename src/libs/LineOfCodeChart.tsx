import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "preact/hooks";
import { GitHubCliError } from "../client/githubGraphql";
import { useLineOfCodeQuery } from "../client/queries/useLineOfCodeQuery";
import { useViewerQuery } from "../client/queries/useViewerQuery";
import type { PrRange } from "../client/prRange";
import { getMoniker } from "./monikers";
import { repo } from "./utils";

const errorMessage = (error: unknown) => {
  if (error instanceof GitHubCliError && error.code === "GH_UNAUTHORIZED") {
    return "GitHub CLI is not authenticated. Run `gh auth login` in your terminal, then reload Retro Specs.";
  }
  return error instanceof Error
    ? error.message
    : "Unable to load line of code statistics.";
};

type LineOfCodeChartProps = {
  range: PrRange;
};

const formatLines = (value: number) => Math.round(Math.abs(value)).toLocaleString();

export const LineOfCodeChart = ({ range }: LineOfCodeChartProps) => {
  const repository = repo.value;
  const {
    data: stats,
    error,
    isFetching,
    refetch,
  } = useLineOfCodeQuery(repository, range);
  const { data: viewer } = useViewerQuery();
  const useOriginalNames = window.localStorage.getItem("pr_origin") === "true";
  const data = useMemo(() => {
    const monikers = new Map<string, string>();
    return stats?.map((stat) => {
      const isViewer = stat.author === viewer?.login;
      if (!isViewer && !useOriginalNames && !monikers.has(stat.author))
        monikers.set(stat.author, getMoniker(stat.author));
      return {
        additions: stat.averageAdditions,
        deletions: -stat.averageDeletions,
        isViewer,
        name: useOriginalNames ? stat.name ?? stat.author : isViewer ? stat.author : monikers.get(stat.author)!,
      };
    });
  }, [stats, useOriginalNames, viewer?.login]);

  return (
    <div class="card bg-base-300 shadow-xl col-span-4">
      <div class="card-body">
        <h2 class="card-title">LoC</h2>
        {!repository.trim() ? (
          <p class="text-base-content/70">
            Enter a repository above to load line of code statistics.
          </p>
        ) : error ? (
          <div class="alert alert-error">
            <span>{errorMessage(error)}</span>
            <button class="btn btn-sm" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : isFetching && !data ? (
          <div class="flex justify-center py-8">
            <span
              class="loading loading-spinner loading-md"
              aria-label="Loading line of code statistics"
            />
          </div>
        ) : !data?.length ? (
          <p class="text-base-content/70">
            No merged pull requests match the selected range.
          </p>
        ) : (
          <div class="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barCategoryGap={2} stackOffset="sign">
                <XAxis
                  angle={-45}
                  dataKey="name"
                  height={70}
                  textAnchor="end"
                />
                <YAxis tickFormatter={formatLines} />
                <Tooltip
                  formatter={(value: number, key: string) => [
                    formatLines(value),
                    key === "additions" ? "Average added" : "Average removed",
                  ]}
                />
                <Bar
                  dataKey="additions"
                  fill="#22c55e"
                  name="Average added"
                  stackId="lines"
                >
                  {data.map((entry) => (
                    <Cell
                      key={`${entry.name}-additions`}
                      stroke={entry.isViewer ? "#fff" : undefined}
                      strokeWidth={entry.isViewer ? 2 : 0}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="deletions"
                  fill="#ef4444"
                  name="Average removed"
                  stackId="lines"
                >
                  {data.map((entry) => (
                    <Cell
                      key={`${entry.name}-deletions`}
                      stroke={entry.isViewer ? "#fff" : undefined}
                      strokeWidth={entry.isViewer ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
