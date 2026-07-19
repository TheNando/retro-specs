import { githubGraphql } from "./githubGraphql";
import { getRangeLimit, getRangeStart, type PrRange } from "./prRange";

export type MergedPullRequestStat = {
  author: string;
  name: string | null;
  prs: number;
};

type PullRequestNode = {
  author: { login: string; name?: string | null; } | null;
  updatedAt: string;
};

type PullRequestPage = {
  nodes: PullRequestNode[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null; };
};

const mergedPullRequestsQuery = `
  query MergedPullRequests($owner: String!, $name: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(states: MERGED, first: $first, after: $after, orderBy: { field: UPDATED_AT, direction: DESC }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          author { login ... on User { name } }
          updatedAt
        }
      }
    }
  }
`;

const parseRepository = (repository: string) => {
  const [owner, name, ...rest] = repository.trim().split("/");
  if (!owner || !name || rest.length) throw new Error("Enter a repository as owner/repository.");
  return { owner, name };
};

export const getMergedPullRequests = async (repository: string, range: PrRange): Promise<MergedPullRequestStat[]> => {
  const { owner, name } = parseRepository(repository);
  const pulls: PullRequestNode[] = [];
  const since = getRangeStart(range);
  const limit = getRangeLimit(range);
  let after: string | undefined;

  do {
    const data = await githubGraphql<{ data: { repository: { pullRequests: PullRequestPage; } | null; }; }>(
      mergedPullRequestsQuery,
      { owner, name, first: limit ?? 100, after }
    );

    if (!data.data.repository) throw new Error(`Repository ${repository} was not found or is inaccessible.`);

    const page = data.data.repository.pullRequests;
    pulls.push(...page.nodes.filter((pull) => !since || new Date(pull.updatedAt) > since));
    const hasPrsInRange = !since || page.nodes.some((pull) => new Date(pull.updatedAt) > since);
    after = !limit && hasPrsInRange && page.pageInfo.hasNextPage ? page.pageInfo.endCursor ?? undefined : undefined;
  } while (after);

  const stats = new Map<string, { name: string | null; prs: number; }>();
  for (const pull of pulls) {
    if (!pull.author) continue;
    const stat = stats.get(pull.author.login) ?? { name: pull.author.name ?? null, prs: 0 };
    stat.prs += 1;
    stats.set(pull.author.login, stat);
  }

  return [...stats.entries()]
    .map(([author, stat]) => ({ author, ...stat }))
    .sort((a, b) => a.prs - b.prs);
};
