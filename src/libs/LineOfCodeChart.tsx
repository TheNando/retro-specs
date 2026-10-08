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
import { Age } from "./Age";
import { getMoniker } from "./monikers";
import { repo, useSelectedAuthor } from "./utils";

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
  const [selectedAuthor, toggleAuthor] = useSelectedAuthor(
    "loc_selected_author",
    viewer?.login,
  );
  const useOriginalNames = window.localStorage.getItem("pr_origin") === "true";
  const data = useMemo(() => {
    const monikers = new Map<string, string>();
    return stats?.map((stat) => {
      const isViewer = stat.author === viewer?.login;
      if (!isViewer && !useOriginalNames && !monikers.has(stat.author))
        monikers.set(stat.author, getMoniker(stat.author));
      return {
        author: stat.author,
        additions: stat.averageAdditions,
        deletions: -stat.averageDeletions,
        isViewer,
        name: useOriginalNames ? stat.name ?? stat.author : isViewer ? stat.author : monikers.get(stat.author)!,
        pulls: stat.pulls,
      };
    });
  }, [stats, useOriginalNames, viewer?.login]);
  const selected = data?.find((entry) => entry.author === selectedAuthor);
  const selectedPulls = selected?.pulls
    .slice()
    .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));
  const selectStrip = (state?: { activeTooltipIndex?: number }) => {
    const index = state?.activeTooltipIndex;
    if (index === undefined) return;
    toggleAuthor(data?.[index]?.author ?? null);
  };
  const barFill = (author: string, color: string, selectedColor: string) =>
    author === selectedAuthor ? selectedColor : color;

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
          <>
            <div class="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  barCategoryGap={2}
                  stackOffset="sign"
                  onClick={selectStrip}
                  style={{ cursor: "pointer" }}
                >
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
                        fill={barFill(entry.author, "#22c55e", "#86efac")}
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
                        fill={barFill(entry.author, "#ef4444", "#fca5a5")}
                        stroke={entry.isViewer ? "#fff" : undefined}
                        strokeWidth={entry.isViewer ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {selected && selectedPulls && (
              <div>
                <h3 class="font-semibold mb-2">
                  {selected.name} ({selectedPulls.length})
                </h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th class="text-center" scope="col">Merged</th>
                      <th class="text-center" scope="col">PR</th>
                      <th class="text-center" scope="col">Added</th>
                      <th class="text-center" scope="col">Removed</th>
                      <th scope="col">Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPulls.map((pull) => (
                      <tr key={pull.number}>
                        <td class="text-center">
                          <Age
                            date={pull.mergedAt}
                            tooltip={`Merged: ${new Date(pull.mergedAt).toLocaleString()}`}
                          />
                        </td>
                        <td class="text-center">
                          <a
                            href={pull.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="link link-primary"
                          >
                            #{pull.number}
                          </a>
                        </td>
                        <td class="text-center text-success">
                          +{formatLines(pull.additions)}
                        </td>
                        <td class="text-center text-error">
                          -{formatLines(pull.deletions)}
                        </td>
                        <td>{pull.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
