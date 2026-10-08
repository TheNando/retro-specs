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
import { useMergedPullRequestsQuery } from "../client/queries/useMergedPullRequestsQuery";
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
    : "Unable to load merged pull requests.";
};

type MergedPrsChartProps = {
  range: PrRange;
};

export const MergedPrsChart = ({ range }: MergedPrsChartProps) => {
  const repository = repo.value;
  const {
    data: pulls,
    error,
    isFetching,
    refetch,
  } = useMergedPullRequestsQuery(repository, range);
  const { data: viewer } = useViewerQuery();
  const [selectedAuthor, toggleAuthor] = useSelectedAuthor(
    "merged_selected_author",
    viewer?.login,
  );
  const useOriginalNames = window.localStorage.getItem("pr_origin") === "true";
  const data = useMemo(() => {
    const monikers = new Map<string, string>();
    return pulls?.map((pull) => {
      const isViewer = pull.author === viewer?.login;
      if (useOriginalNames)
        return {
          author: pull.author,
          name: pull.name ?? pull.author,
          prs: pull.prs,
          pulls: pull.pulls,
          isViewer,
        };
      if (!isViewer && !monikers.has(pull.author))
        monikers.set(pull.author, getMoniker(pull.author));
      return {
        author: pull.author,
        name: isViewer ? pull.author : monikers.get(pull.author)!,
        prs: pull.prs,
        pulls: pull.pulls,
        isViewer,
      };
    });
  }, [pulls, useOriginalNames, viewer?.login]);
  const selected = data?.find((entry) => entry.author === selectedAuthor);
  const selectedPulls = selected?.pulls
    .slice()
    .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));
  const selectStrip = (state?: { activeTooltipIndex?: number }) => {
    const index = state?.activeTooltipIndex;
    if (index === undefined) return;
    toggleAuthor(data?.[index]?.author ?? null);
  };

  return (
    <div class="card bg-base-300 shadow-xl col-span-4">
      <div class="card-body">
        <h2 class="card-title">Merged</h2>
        {!repository.trim() ? (
          <p class="text-base-content/70">
            Enter a repository above to load merged pull requests.
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
              aria-label="Loading merged pull requests"
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
                  onClick={selectStrip}
                  style={{ cursor: "pointer" }}
                >
                  <XAxis
                    angle={-45}
                    dataKey="name"
                    height={70}
                    textAnchor="end"
                  />
                  <YAxis dataKey="prs" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="prs">
                    {data.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.author === selectedAuthor
                            ? "#a5adff"
                            : "#7480ff"
                        }
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
