import { useState } from "preact/hooks";
import { GitHubCliError } from "../client/githubGraphql";
import type { PullRequest } from "../client/getPullRequests";
import type { PrRange } from "../client/prRange";
import { usePullRequestsQuery } from "../client/queries/usePullRequestsQuery";
import { repo } from "./utils";

const getStatusPriority = (pull: PullRequest): string => {
  if (pull.checksState === "failed") return "failed";
  if (pull.hasReviews) return "approved";
  if (pull.hasComments) return "comments";
  if (pull.checksState === "passed") return "passed";
  return "open";
};

const badgeClass = (status: string) =>
  [
    "badge",
    "text-white",
    status === "failed"
      ? "badge-error"
      : status === "approved"
        ? "badge-success"
        : status === "comments"
          ? "badge-info"
          : status === "passed"
            ? "badge-ghost"
            : "badge-neutral",
  ].join(" ");

const statusLabel = (status: string) =>
  `${status.charAt(0).toUpperCase()}${status.slice(1)}`;

const errorMessage = (error: unknown) => {
  if (error instanceof GitHubCliError && error.code === "GH_UNAUTHORIZED") {
    return "GitHub CLI is not authenticated. Run `gh auth login` in your terminal, then reload Retro Specs.";
  }
  return error instanceof Error
    ? error.message
    : "Unable to load pull requests.";
};

type PullsTableProps = {
  range: PrRange;
};

type SortColumn = "id" | "userLogin" | "status" | "branch" | "title" | "createdAt";

const comparePulls = (a: PullRequest, b: PullRequest, column: SortColumn) => {
  if (column === "id") return a.id - b.id;
  if (column === "createdAt") {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }
  if (column === "status") {
    return getStatusPriority(a).localeCompare(getStatusPriority(b));
  }
  return a[column].localeCompare(b[column]);
};

const formatAge = (createdAt: string) => {
  const diff = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
};

export const PullsTable = ({ range }: PullsTableProps) => {
  const repository = repo.value;
  const {
    data: pulls,
    error,
    isFetching,
    refetch,
  } = usePullRequestsQuery(repository, range);

  const [owner, repoName] = repository.split("/");
  const prUrl = (number: number) =>
    `https://github.com/${owner}/${repoName}/pull/${number}`;
  const prFilesUrl = (number: number) =>
    `https://github.com/${owner}/${repoName}/pull/${number}/files`;

  const [sortBy, setSortBy] = useState<SortColumn>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = pulls?.slice().sort((a, b) => {
    const cmp = comparePulls(a, b, sortBy);
    if (cmp < 0) return sortDir === "asc" ? -1 : 1;
    if (cmp > 0) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const sortIndicator = (column: string) => {
    if (sortBy !== column) return " ";
    return sortDir === "asc" ? "↑ " : "↓ ";
  };

  return (
    <div class="card bg-base-300 shadow-xl col-span-4">
      <div class="card-body">
        {!repository.trim() ? (
          <p class="text-base-content/70">
            Enter a repository above to load its open pull requests.
          </p>
        ) : error ? (
          <div class="alert alert-error">
            <span>{errorMessage(error)}</span>
            <button class="btn btn-sm" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : isFetching && !pulls ? (
          <div class="flex justify-center py-8">
            <span
              class="loading loading-spinner loading-md"
              aria-label="Loading pull requests"
            />
          </div>
        ) : (
          <table class="table">
            <thead>
              <tr>
                <th
                  aria-sort={sortBy === "id" ? sortDir === "asc" ? "ascending" : "descending" : "none"}
                  class="cursor-pointer"
                  onClick={() => toggleSort("id")}
                  scope="col"
                >
                  {sortIndicator("id")} #
                </th>
                <th
                  aria-sort={sortBy === "userLogin" ? sortDir === "asc" ? "ascending" : "descending" : "none"}
                  class="cursor-pointer"
                  onClick={() => toggleSort("userLogin")}
                  scope="col"
                >
                  {sortIndicator("userLogin")} User
                </th>
                <th
                  class="text-center cursor-pointer"
                  aria-sort={sortBy === "status" ? sortDir === "asc" ? "ascending" : "descending" : "none"}
                  onClick={() => toggleSort("status")}
                  scope="col"
                >
                  {sortIndicator("status")} Status
                </th>
                <th
                  aria-sort={sortBy === "branch" ? sortDir === "asc" ? "ascending" : "descending" : "none"}
                  class="cursor-pointer"
                  onClick={() => toggleSort("branch")}
                  scope="col"
                >
                  {sortIndicator("branch")} Branch
                </th>
                <th
                  aria-sort={sortBy === "title" ? sortDir === "asc" ? "ascending" : "descending" : "none"}
                  class="cursor-pointer"
                  onClick={() => toggleSort("title")}
                  scope="col"
                >
                  {sortIndicator("title")} Title
                </th>
                <th
                  class="cursor-pointer"
                  aria-sort={sortBy === "createdAt" ? sortDir === "asc" ? "ascending" : "descending" : "none"}
                  onClick={() => toggleSort("createdAt")}
                  scope="col"
                >
                  {sortIndicator("createdAt")} Age
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted?.map((pull) => {
                const status = getStatusPriority(pull);
                return (
                  <tr key={pull.id}>
                    <td>
                      <a
                        href={prUrl(pull.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="link link-primary"
                      >
                        #{pull.id}
                      </a>
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div class="avatar">
                          <div class="w-8 rounded-full">
                            {pull.userImg && <img src={pull.userImg} alt="" />}
                          </div>
                        </div>
                        <span class="text-sm font-mono">{pull.userLogin}</span>
                      </div>
                    </td>
                    <td class="text-center">
                      <a
                        href={prFilesUrl(pull.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span class={badgeClass(status)}>{statusLabel(status)}</span>
                      </a>
                    </td>
                    <td>{pull.branch}</td>
                    <td>{pull.title}</td>
                    <td>{formatAge(pull.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
