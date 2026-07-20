import { useQuery } from "@tanstack/react-query";
import { getReviewedPullRequests } from "../getReviewedPullRequests";
import type { PrRange } from "../prRange";
import { isRepository, rememberRepository } from "../repositoryHistory";

export const useReviewedPullRequestsQuery = (repository: string, range: PrRange) =>
  useQuery({
    queryKey: ["github", "reviewed-pull-requests", repository, range],
    queryFn: async () => {
      const pulls = await getReviewedPullRequests(repository, range);
      rememberRepository(repository);
      return pulls;
    },
    enabled: isRepository(repository),
  });
