import { githubGraphql } from "./githubGraphql";
import { getRangeLimit, getRangeStart, type PrRange } from "./prRange";

export type ReviewedPullRequestStat = {
  author: string;
  name: string | null;
  comments: number;
  approvals: number;
};

type PullRequestReview = {
  author: { login: string; name?: string | null; } | null;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING";
};

type PullRequestNode = {
  updatedAt: string;
  reviews: { nodes: PullRequestReview[]; };
};

type PullRequestPage = {
  nodes: PullRequestNode[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null; };
};

const reviewedPullRequestsQuery = `
  query ReviewedPullRequests($owner: String!, $name: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(states: MERGED, first: $first, after: $after, orderBy: { field: UPDATED_AT, direction: DESC }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          updatedAt
          reviews(first: 100) {
            nodes {
              author { login ... on User { name } }
              state
            }
          }
        }
      }
    }
  }
`;

const excludedReviewers = new Set(["coderabbitai"]);

const parseRepository = (repository: string) => {
  const [owner, name, ...rest] = repository.trim().split("/");
  if (!owner || !name || rest.length) throw new Error("Enter a repository as owner/repository.");
  return { owner, name };
};

export const getReviewedPullRequests = async (repository: string, range: PrRange): Promise<ReviewedPullRequestStat[]> => {
  const { owner, name } = parseRepository(repository);
  const pulls: PullRequestNode[] = [];
  const since = getRangeStart(range);
  const limit = getRangeLimit(range);
  let after: string | undefined;

  do {
    const data = await githubGraphql<{ data: { repository: { pullRequests: PullRequestPage; } | null; }; }>(
      reviewedPullRequestsQuery,
      { owner, name, first: limit ?? 100, after }
    );

    if (!data.data.repository) throw new Error(`Repository ${repository} was not found or is inaccessible.`);

    const page = data.data.repository.pullRequests;
    pulls.push(...page.nodes.filter((pull) => !since || new Date(pull.updatedAt) > since));
    const hasPrsInRange = !since || page.nodes.some((pull) => new Date(pull.updatedAt) > since);
    after = !limit && hasPrsInRange && page.pageInfo.hasNextPage ? page.pageInfo.endCursor ?? undefined : undefined;
  } while (after);

  const stats = new Map<string, { name: string | null; comments: number; approvals: number; }>();
  for (const pull of pulls) {
    const commenters = new Map<string, string | null>();
    const approvers = new Map<string, string | null>();

    for (const review of pull.reviews.nodes) {
      if (!review.author) continue;
      if (review.state === "APPROVED") approvers.set(review.author.login, review.author.name ?? null);
      if (review.state === "COMMENTED" || review.state === "CHANGES_REQUESTED") commenters.set(review.author.login, review.author.name ?? null);
    }

    for (const [author, name] of commenters) {
      const stat = stats.get(author) ?? { name, comments: 0, approvals: 0 };
      stat.comments += 1;
      stats.set(author, stat);
    }
    for (const [author, name] of approvers) {
      const stat = stats.get(author) ?? { name, comments: 0, approvals: 0 };
      stat.approvals += 1;
      stats.set(author, stat);
    }
  }

  return [...stats.entries()]
    .filter(([author]) => !excludedReviewers.has(author.toLowerCase()))
    .map(([author, stat]) => ({ author, ...stat }))
    .sort((a, b) => a.comments + a.approvals - (b.comments + b.approvals));
};
