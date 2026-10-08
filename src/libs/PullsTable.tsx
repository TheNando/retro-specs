import { useState } from "preact/hooks";
import { GitHubCliError } from "../client/githubGraphql";
import type { PullRequest } from "../client/getPullRequests";
import type { PrRange } from "../client/prRange";
import { usePullRequestsQuery } from "../client/queries/usePullRequestsQuery";
import { Age } from "./Age";
import { StatusBadge, type PullStatus } from "./StatusBadge";
import { UserAvatar } from "./UserAvatar";
import { repo } from "./utils";

const getStatusPriority = (pull: PullRequest): PullStatus => {
  if (pull.checksState === "failed") return "failed";
  if (pull.hasReviews) return "approved";
  if (pull.hasComments) return "comments";
  if (pull.checksState === "passed") return "passed";
  return "open";
};

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

type SortColumn = "id" | "userLogin" | "status" | "title" | "createdAt";

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

const ageTooltip = (pull: PullRequest) =>
  `Created: ${new Date(pull.createdAt).toLocaleString()}\nUpdated: ${new Date(pull.updatedAt).toLocaleString()}`;

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

  const [sortBy, setSortBy] = useState<SortColumn>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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
                  class="text-center cursor-pointer"
                  aria-sort={sortBy === "createdAt" ? sortDir === "asc" ? "ascending" : "descending" : "none"}
                  onClick={() => toggleSort("createdAt")}
                  scope="col"
                >
                  {sortIndicator("createdAt")} Age
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
                  aria-sort={sortBy === "id" ? sortDir === "asc" ? "ascending" : "descending" : "none"}
                  class="cursor-pointer"
                  onClick={() => toggleSort("id")}
                  scope="col"
                >
                  {sortIndicator("id")} # / Branch
                </th>
                <th
                  aria-sort={sortBy === "userLogin" ? sortDir === "asc" ? "ascending" : "descending" : "none"}
                  class="text-center cursor-pointer"
                  onClick={() => toggleSort("userLogin")}
                  scope="col"
                >
                  {sortIndicator("userLogin")} User
                </th>
                <th
                  aria-sort={sortBy === "title" ? sortDir === "asc" ? "ascending" : "descending" : "none"}
                  class="cursor-pointer"
                  onClick={() => toggleSort("title")}
                  scope="col"
                >
                  {sortIndicator("title")} Title
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted?.map((pull) => {
                const status = getStatusPriority(pull);
                return (
                  <tr key={pull.id}>
                    <td class="text-center">
                      <Age date={pull.createdAt} tooltip={ageTooltip(pull)} />
                    </td>
                    <td class="text-center">
                      <a
                        href={prFilesUrl(pull.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <StatusBadge status={status} />
                      </a>
                    </td>
                    <td>
                      <div class="flex flex-col">
                        <a
                          href={prUrl(pull.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="link link-primary"
                        >
                          #{pull.id}
                        </a>
                        {pull.branchUrl ? (
                          <a
                            href={pull.branchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="link text-sm max-w-[250px] truncate"
                            title={pull.branch}
                          >
                            {pull.branch}
                          </a>
                        ) : (
                          <span class="text-sm max-w-[250px] truncate" title={pull.branch}>
                            {pull.branch}
                          </span>
                        )}
                      </div>
                    </td>
                    <td class="text-center">
                      <UserAvatar img={pull.userImg} login={pull.userLogin} />
                    </td>
                    <td>{pull.title}</td>
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
