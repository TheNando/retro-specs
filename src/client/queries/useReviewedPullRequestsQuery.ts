import { useQuery } from "@tanstack/react-query";
import { getReviewedPullRequests } from "../getReviewedPullRequests";
import type { PrRange } from "../prRange";

export const useReviewedPullRequestsQuery = (repository: string, range: PrRange) =>
  useQuery({
    queryKey: ["github", "reviewed-pull-requests", repository, range],
    queryFn: () => getReviewedPullRequests(repository, range),
    enabled: Boolean(repository.trim()),
  });
