import { useQuery } from "@tanstack/react-query";
import { getMergedPullRequests } from "../getMergedPullRequests";
import type { PrRange } from "../prRange";

export const useMergedPullRequestsQuery = (repository: string, range: PrRange) =>
  useQuery({
    queryKey: ["github", "merged-pull-requests", repository, range],
    queryFn: () => getMergedPullRequests(repository, range),
    enabled: Boolean(repository.trim()),
  });
