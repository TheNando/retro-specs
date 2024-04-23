import { useQuery } from "@tanstack/react-query";
import { idb } from "../libs/idb";
import { getMoniker } from "../libs/monikers";
import type { PullRequest, PullRequestResource } from "../libs/types";
import { fetchJson, user } from "../libs/utils";

const PR_PARAMS = new URLSearchParams({
  direction: "desc",
  per_page: "100",
  sort: "updated",
  state: "closed",
});

const TODAY = new Date();
const MONTH_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

const fetchPullRequests = async (repo: string, params: URLSearchParams) =>
  fetchJson<PullRequest[]>(
    `https://api.github.com/repos/${repo}/pulls?${params}`,
    {
      select: (response) =>
        response.map(
          (pr: PullRequestResource): PullRequest => ({
            created_at: new Date(pr.created_at),
            id: pr.id,
            number: pr.number,
            repo: pr.base.repo.full_name,
            updated_at: new Date(pr.updated_at),
            user: {
              avatar_url: pr.user.avatar_url,
              login: pr.user.login,
            },
          })
        ),
    }
  );

const getLastMonthPrs = async (repo: string) => {
  const params = new URLSearchParams(PR_PARAMS);
  let page = 1;
  let allPrs: PullRequest[] = [];
  let shouldExit = false;

  while (!shouldExit) {
    params.set("page", page.toString());

    const prs = (await fetchPullRequests(repo, params)).filter(
      (pr) => pr.updated_at > MONTH_AGO
    );

    allPrs = [...allPrs, ...prs];
    page += 1;

    if (prs.length < 100) {
      shouldExit = true;
    }
  }

  return allPrs;
};

const updatePrCache = async (repo: string, prs: PullRequest[]) => {
  let idbPrs: Map<number, PullRequest>;
  const toAdd: PullRequest[] = [];
  const toPut: PullRequest[] = [];

  // Get cached PRs for repo from last month
  try {
    const cached = new Map(
      (
        await idb.pullRequests
          .where(["repo", "updated_at"])
          .between([repo, MONTH_AGO], [repo, TODAY])
          .toArray()
      ).map((pr) => [pr.id, pr])
    );
    idbPrs = cached;

    console.info(`[${repo}]: Found ${cached.size} cached PRs from last month`);
  } catch (error) {
    console.error(`[${repo}]: Error querying IDB for cached PRs: ${error}`);
  }

  // Sort into PRs to add and PRs to update
  prs.forEach((pr) => {
    const idbPr = idbPrs.get(pr.id);

    if (!idbPr) {
      toAdd.push(pr);
    } else if (idbPr.updated_at.getTime() !== pr.updated_at.getTime()) {
      toPut.push(pr);
    }
  });

  // Add PRs that are not cached
  try {
    await idb.pullRequests.bulkAdd(toAdd);
    console.info(`[${repo}]: Added ${toAdd.length} PRs to IDB`);
  } catch (error) {
    console.error(`[${repo}]: Error adding PRs to IDB: ${error}`);
  }

  // Update PRs that have changed since last cached
  try {
    await idb.pullRequests.bulkPut(toPut);
    console.info(`[${repo}]: Updating ${toPut.length} PRs in IDB`);
  } catch (error) {
    console.error(`[${repo}]: Error updating PRs in IDB: ${error}`);
  }
};

const calculatePrStats = (prs: PullRequest[]) => {
  const statsMap = prs.reduce((stats, pr) => {
    stats[pr.user.login] = (stats[pr.user.login] || 0) + 1;
    return stats;
  }, {} as Record<string, number>);

  return Object.keys(statsMap)
    .map((stat) => ({
      name: user.value.login === stat ? user.value.login : getMoniker(),
      prs: statsMap[stat],
    }))
    .sort((a, b) => (a.prs > b.prs ? 1 : -1));
};

// Collect stats for all closed pull requests from the last month
const getPrStats = async (repo: string) => {
  // Get last month's PRs
  const monthPrs = await getLastMonthPrs(repo);

  // Update PR cache
  await updatePrCache(repo, monthPrs);

  // Calculate stats
  return calculatePrStats(monthPrs);
};

export const usePrStatsQuery = (repo: string) =>
  useQuery({
    queryKey: ["pr-stats", repo],
    queryFn: () => getPrStats(repo),
  });
