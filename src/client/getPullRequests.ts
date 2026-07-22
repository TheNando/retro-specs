import { githubGraphql } from "./githubGraphql";
import { getRangeLimit, getRangeStart, type PrRange } from "./prRange";

export type PullRequest = {
  id: number;
  branch: string;
  title: string;
  userImg: string;
  userLogin: string;
  checksState: "passed" | "failed" | "pending" | "none";
  hasReviews: boolean;
  hasComments: boolean;
  createdAt: string;
};

type PullRequestNode = {
  number: number;
  title: string;
  headRefName: string | null;
  author: { login: string; avatarUrl: string; } | null;
  comments: { totalCount: number; };
  reviews: { totalCount: number; };
  reviewThreads: { totalCount: number; };
  updatedAt: string;
  createdAt: string;
  commits: { nodes: Array<{ commit: { statusCheckRollup: { state: string; } | null; }; }>; };
};

type PullRequestPage = {
  nodes: PullRequestNode[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null; };
};

const pullRequestsQuery = `
  query PullRequests($owner: String!, $name: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(states: OPEN, first: $first, after: $after, orderBy: { field: UPDATED_AT, direction: DESC }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          number
          title
          headRefName
          author { login avatarUrl }
          comments { totalCount }
          reviews { totalCount }
          reviewThreads(first: 1) { totalCount }
          updatedAt
          createdAt
          commits(last: 1) {
            nodes { commit { statusCheckRollup { state } } }
          }
        }
      }
    }
  }
`;

const checkState = (state: string | undefined): PullRequest["checksState"] => {
  if (!state) return "none";
  if (["FAILURE", "ERROR"].includes(state)) return "failed";
  if (["PENDING", "EXPECTED"].includes(state)) return "pending";
  return state === "SUCCESS" ? "passed" : "none";
};

const parseRepository = (repository: string) => {
  const [owner, name, ...rest] = repository.trim().split("/");
  if (!owner || !name || rest.length) throw new Error("Enter a repository as owner/repository.");
  return { owner, name };
};

export const getPullRequests = async (repository: string, range: PrRange): Promise<PullRequest[]> => {
  const { owner, name } = parseRepository(repository);
  const pulls: PullRequestNode[] = [];
  const since = getRangeStart(range);
  const limit = getRangeLimit(range);
  let after: string | undefined;

  do {
    const data = await githubGraphql<{ data: { repository: { pullRequests: PullRequestPage; } | null; }; }>(pullRequestsQuery, {
      owner,
      name,
      first: limit ?? 100,
      after,
    });

    if (!data.data.repository) throw new Error(`Repository ${repository} was not found or is inaccessible.`);

    const page = data.data.repository.pullRequests;
    pulls.push(...page.nodes.filter((pull) => !since || new Date(pull.updatedAt) > since));
    const hasPrsInRange = !since || page.nodes.some((pull) => new Date(pull.updatedAt) > since);
    after = !limit && hasPrsInRange && page.pageInfo.hasNextPage ? page.pageInfo.endCursor ?? undefined : undefined;
  } while (after);

  return pulls.map((pull) => ({
    id: pull.number,
    branch: pull.headRefName ?? "(deleted branch)",
    title: pull.title,
    userImg: pull.author?.avatarUrl ?? "",
    userLogin: pull.author?.login ?? "",
    checksState: checkState(pull.commits.nodes[0]?.commit.statusCheckRollup?.state),
    hasReviews: pull.reviews.totalCount > 0,
    hasComments: pull.comments.totalCount > 0 || pull.reviewThreads.totalCount > 0,
    createdAt: pull.createdAt,
  }));
};
