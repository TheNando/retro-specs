import { GitHubCliError } from "../client/githubGraphql";
import type { PullRequest } from "../client/getPullRequests";
import { usePullRequestsQuery } from "../client/queries/usePullRequestsQuery";
import { repo } from "./utils";

const getStatusPriority = (pull: PullRequest): string => {
  if (pull.checksState === "failed") return "failed";
  if (pull.hasReviews) return "reviewed";
  if (pull.hasComments) return "comments";
  if (pull.checksState === "passed") return "passed";
  return "open";
};

const badgeClass = (status: string) =>
  [
    "badge",
    status === "failed" ? "badge-error" : status === "reviewed" ? "badge-success" : status === "comments" ? "badge-info" : status === "passed" ? "badge-ghost" : "badge-neutral",
  ].join(" ");

const errorMessage = (error: unknown) => {
  if (error instanceof GitHubCliError && error.code === "GH_UNAUTHORIZED") {
    return "GitHub CLI is not authenticated. Run `gh auth login` in your terminal, then reload Repo Snitch.";
  }
  return error instanceof Error ? error.message : "Unable to load pull requests.";
};

export const PullsTable = () => {
  const repository = repo.value;
  const { data: pulls, error, isFetching, refetch } = usePullRequestsQuery(repository);

  const [owner, repoName] = repository.split("/");
  const prUrl = (number: number) => `https://github.com/${owner}/${repoName}/pull/${number}`;
  const prFilesUrl = (number: number) => `https://github.com/${owner}/${repoName}/pull/${number}/files`;

  return (
    <div class="card bg-base-300 shadow-xl col-span-4">
      <div class="card-body">
        {!repository.trim() ? (
          <p class="text-base-content/70">Enter a repository above to load its open pull requests.</p>
        ) : error ? (
          <div class="alert alert-error">
            <span>{errorMessage(error)}</span>
            <button class="btn btn-sm" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : isFetching && !pulls ? (
          <div class="flex justify-center py-8">
            <span class="loading loading-spinner loading-md" aria-label="Loading pull requests" />
          </div>
        ) : (
          <table class="table">
            <thead>
              <tr>
                <th></th>
                <th>User</th>
                <th>Status</th>
                <th>Branch</th>
                <th>Title</th>
              </tr>
            </thead>
            <tbody>
              {pulls?.map((pull) => {
                const status = getStatusPriority(pull);
                return (
                  <tr key={pull.id}>
                    <td>
                      <a href={prUrl(pull.id)} target="_blank" rel="noopener noreferrer" class="link link-primary">
                        #{pull.id}
                      </a>
                    </td>
                    <td>
                      <div class="avatar">
                        <div class="w-8 rounded-full">
                          {pull.userImg && <img src={pull.userImg} alt="" />}
                        </div>
                      </div>
                    </td>
                    <td>
                      <a href={prFilesUrl(pull.id)} target="_blank" rel="noopener noreferrer">
                        <span class={badgeClass(status)}>{status}</span>
                      </a>
                    </td>
                    <td>{pull.branch}</td>
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
