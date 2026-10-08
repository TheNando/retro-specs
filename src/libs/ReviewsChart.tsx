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
import type { ReviewedPullRequest } from "../client/getReviewedPullRequests";
import { useReviewedPullRequestsQuery } from "../client/queries/useReviewedPullRequestsQuery";
import { useViewerQuery } from "../client/queries/useViewerQuery";
import type { PrRange } from "../client/prRange";
import { Age } from "./Age";
import { getMoniker } from "./monikers";
import { StatusBadge } from "./StatusBadge";
import { UserAvatar } from "./UserAvatar";
import { repo, useSelectedAuthor } from "./utils";

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
  const [selectedAuthor, toggleAuthor] = useSelectedAuthor(
    "reviews_selected_author",
    viewer?.login,
  );
  const useOriginalNames = window.localStorage.getItem("pr_origin") === "true";
  const data = useMemo(() => {
    const monikers = new Map<string, string>();
    return pulls?.map((pull) => {
      const isViewer = pull.author === viewer?.login;
      if (useOriginalNames) {
        return {
          author: pull.author,
          name: pull.name ?? pull.author,
          comments: pull.comments,
          approvals: pull.approvals,
          pulls: pull.pulls,
          isViewer,
        };
      }
      if (!isViewer && !monikers.has(pull.author))
        monikers.set(pull.author, getMoniker(pull.author));
      return {
        author: pull.author,
        name: isViewer ? pull.author : monikers.get(pull.author)!,
        comments: pull.comments,
        approvals: pull.approvals,
        pulls: pull.pulls,
        isViewer,
      };
    });
  }, [pulls, useOriginalNames, viewer?.login]);
  const selected = data?.find((entry) => entry.author === selectedAuthor);
  const selectedPulls = selected?.pulls
    .slice()
    .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));
  const displayName = (author: ReviewedPullRequest["author"]) => {
    if (!author) return "Unknown";
    if (useOriginalNames) return author.name ?? author.login;
    return author.login === viewer?.login
      ? author.login
      : getMoniker(author.login);
  };
  const avatarImg = (author: ReviewedPullRequest["author"]) =>
    author && (useOriginalNames || author.login === viewer?.login)
      ? author.avatarUrl
      : "";
  const selectStrip = (state?: { activeTooltipIndex?: number }) => {
    const index = state?.activeTooltipIndex;
    if (index === undefined) return;
    toggleAuthor(data?.[index]?.author ?? null);
  };
  const barFill = (author: string, color: string, selectedColor: string) =>
    author === selectedAuthor ? selectedColor : color;

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
            <>
              <div class="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    barCategoryGap={2}
                    margin={{ top: 32, bottom: 32 }}
                    onClick={selectStrip}
                    style={{ cursor: "pointer" }}
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
                          fill={barFill(entry.author, "#2563eb", "#60a5fa")}
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
                          fill={barFill(entry.author, "#16a34a", "#4ade80")}
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
                        <th class="text-center" scope="col">Review</th>
                        <th class="text-center" scope="col">PR</th>
                        <th class="text-center" scope="col">Author</th>
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
                            <StatusBadge
                              status={pull.commented ? "comments" : "approved"}
                              status2={
                                pull.commented && pull.approved
                                  ? "approved"
                                  : undefined
                              }
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
                          <td class="text-center">
                            <UserAvatar
                              img={avatarImg(pull.author)}
                              login={displayName(pull.author)}
                            />
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
      {data?.length ? (
        <p class="col-span-4 text-sm text-base-content/70">
          <span class="font-semibold">Note: </span>
          Comments counts PRs with at least one comment, not total comments.
        </p>
      ) : null}
    </>
  );
};
