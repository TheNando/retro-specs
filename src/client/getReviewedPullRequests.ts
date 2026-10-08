import { githubGraphql } from "./githubGraphql";
import { getRangeLimit, getRangeStart, type PrRange } from "./prRange";

type PullRequestAuthor = { login: string; name?: string | null; };

type PullRequestOwner = PullRequestAuthor & { avatarUrl: string; };

export type ReviewedPullRequest = {
  number: number;
  title: string;
  url: string;
  mergedAt: string;
  author: PullRequestOwner | null;
  commented: boolean;
  approved: boolean;
};

export type ReviewedPullRequestStat = {
  author: string;
  name: string | null;
  comments: number;
  approvals: number;
  pulls: ReviewedPullRequest[];
};

type PullRequestReview = {
  author: PullRequestAuthor | null;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING";
};

type PullRequestNode = {
  number: number;
  title: string;
  url: string;
  mergedAt: string;
  author: PullRequestOwner | null;
  updatedAt: string;
  reviews: { nodes: PullRequestReview[]; };
};

type ReviewerStat = Omit<ReviewedPullRequestStat, "author">;

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
          number
          title
          url
          mergedAt
          author { login avatarUrl ... on User { name } }
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

  const stats = new Map<string, ReviewerStat>();
  for (const pull of pulls) {
    const commenters = new Map<string, string | null>();
    const approvers = new Map<string, string | null>();

    for (const review of pull.reviews.nodes) {
      if (!review.author) continue;
      if (review.state === "APPROVED") approvers.set(review.author.login, review.author.name ?? null);
      if (review.state === "COMMENTED" || review.state === "CHANGES_REQUESTED") commenters.set(review.author.login, review.author.name ?? null);
    }

    const reviewers = new Map([...commenters, ...approvers]);
    for (const [author, name] of reviewers) {
      const commented = commenters.has(author);
      const approved = approvers.has(author);
      const stat = stats.get(author) ?? { name, comments: 0, approvals: 0, pulls: [] };
      if (commented) stat.comments += 1;
      if (approved) stat.approvals += 1;
      stat.pulls.push({
        number: pull.number,
        title: pull.title,
        url: pull.url,
        mergedAt: pull.mergedAt,
        author: pull.author,
        commented,
        approved,
      });
      stats.set(author, stat);
    }
  }

  return [...stats.entries()]
    .filter(([author]) => !excludedReviewers.has(author.toLowerCase()))
    .map(([author, stat]) => ({ author, ...stat }))
    .sort((a, b) => a.comments + a.approvals - (b.comments + b.approvals));
};
