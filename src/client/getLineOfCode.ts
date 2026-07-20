import { githubGraphql } from "./githubGraphql";
import { getRangeLimit, getRangeStart, type PrRange } from "./prRange";

export type LineOfCodeStat = {
  author: string;
  name: string | null;
  averageAdditions: number;
  averageDeletions: number;
};

type PullRequestNode = {
  additions: number;
  author: { login: string; name?: string | null; } | null;
  deletions: number;
  updatedAt: string;
};

type PullRequestPage = {
  nodes: PullRequestNode[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null; };
};

const lineOfCodeQuery = `
  query LineOfCode($owner: String!, $name: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(states: MERGED, first: $first, after: $after, orderBy: { field: UPDATED_AT, direction: DESC }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          additions
          author { login ... on User { name } }
          deletions
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

export const getLineOfCode = async (
  repository: string,
  range: PrRange,
): Promise<LineOfCodeStat[]> => {
  const { owner, name } = parseRepository(repository);
  const pulls: PullRequestNode[] = [];
  const since = getRangeStart(range);
  const limit = getRangeLimit(range);
  let after: string | undefined;

  do {
    const data = await githubGraphql<{ data: { repository: { pullRequests: PullRequestPage; } | null; }; }>(
      lineOfCodeQuery,
      { owner, name, first: limit ?? 100, after },
    );

    if (!data.data.repository) throw new Error(`Repository ${repository} was not found or is inaccessible.`);

    const page = data.data.repository.pullRequests;
    pulls.push(...page.nodes.filter((pull) => !since || new Date(pull.updatedAt) > since));
    const hasPrsInRange = !since || page.nodes.some((pull) => new Date(pull.updatedAt) > since);
    after = !limit && hasPrsInRange && page.pageInfo.hasNextPage ? page.pageInfo.endCursor ?? undefined : undefined;
  } while (after);

  const stats = new Map<string, { additions: number; deletions: number; name: string | null; prs: number; }>();
  for (const pull of pulls) {
    if (!pull.author) continue;
    const stat = stats.get(pull.author.login) ?? {
      additions: 0,
      deletions: 0,
      name: pull.author.name ?? null,
      prs: 0,
    };
    stat.additions += pull.additions;
    stat.deletions += pull.deletions;
    stat.prs += 1;
    stats.set(pull.author.login, stat);
  }

  return [...stats.entries()]
    .map(([author, stat]) => ({
      author,
      name: stat.name,
      averageAdditions: stat.additions / stat.prs,
      averageDeletions: stat.deletions / stat.prs,
    }))
    .sort((a, b) => b.averageAdditions + b.averageDeletions - (a.averageAdditions + a.averageDeletions));
};
