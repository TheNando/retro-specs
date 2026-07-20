import {
  Bar,
  BarChart,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "preact/hooks";
import { GitHubCliError } from "../client/githubGraphql";
import { useReviewedPullRequestsQuery } from "../client/queries/useReviewedPullRequestsQuery";
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
    : "Unable to load pull request reviews.";
};

type ReviewsChartProps = {
  range: PrRange;
};

export const ReviewsChart = ({ range }: ReviewsChartProps) => {
  const repository = repo.value;
  const {
    data: pulls,
    error,
    isFetching,
    refetch,
  } = useReviewedPullRequestsQuery(repository, range);
  const { data: viewer } = useViewerQuery();
  const useOriginalNames = window.localStorage.getItem("pr_origin") === "true";
  const data = useMemo(() => {
    const monikers = new Map<string, string>();
    return pulls?.map((pull) => {
      const isViewer = pull.author === viewer?.login;
      if (useOriginalNames) {
        return {
          name: pull.name ?? pull.author,
          comments: pull.comments,
          approvals: pull.approvals,
          isViewer,
        };
      }
      if (!isViewer && !monikers.has(pull.author))
        monikers.set(pull.author, getMoniker(pull.author));
      return {
        name: isViewer ? pull.author : monikers.get(pull.author)!,
        comments: pull.comments,
        approvals: pull.approvals,
        isViewer,
      };
    });
  }, [pulls, useOriginalNames, viewer?.login]);

  return (
    <>
      <div class="card bg-base-300 shadow-xl col-span-4">
        <div class="card-body">
          <h2 class="card-title">Reviews</h2>
          {!repository.trim() ? (
            <p class="text-base-content/70">
              Enter a repository above to load pull request reviews.
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
                aria-label="Loading pull request reviews"
              />
            </div>
          ) : !data?.length ? (
            <p class="text-base-content/70">
              No pull request reviews match the selected range.
            </p>
          ) : (
            <div class="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  barCategoryGap={2}
                  margin={{ top: 32, bottom: 32 }}
                >
                  <XAxis
                    angle={-45}
                    dataKey="name"
                    height={70}
                    textAnchor="end"
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend verticalAlign="top" />
                  <Bar
                    dataKey="comments"
                    name="Comments"
                    stackId="reviews"
                    fill="#2563eb"
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill="#2563eb"
                        stroke={entry.isViewer ? "#fff" : undefined}
                        strokeWidth={entry.isViewer ? 2 : 0}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="approvals"
                    name="Approvals"
                    stackId="reviews"
                    fill="#16a34a"
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill="#16a34a"
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
      {data?.length ? (
        <p class="col-span-4 text-sm text-base-content/70">
          <span class="font-semibold">Note: </span>
          Comments counts PRs with at least one comment, not total comments.
        </p>
      ) : null}
    </>
  );
};
