import { useQuery } from "@tanstack/react-query";
import { getMergedPullRequests } from "../getMergedPullRequests";
import type { PrRange } from "../prRange";
import { isRepository, rememberRepository } from "../repositoryHistory";

export const useMergedPullRequestsQuery = (repository: string, range: PrRange) =>
  useQuery({
    queryKey: ["github", "merged-pull-requests", repository, range],
    queryFn: async () => {
      const pulls = await getMergedPullRequests(repository, range);
      rememberRepository(repository);
      return pulls;
    },
    enabled: isRepository(repository),
  });
