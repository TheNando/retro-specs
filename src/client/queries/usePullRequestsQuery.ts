import { useQuery } from "@tanstack/react-query";
import { getPullRequests } from "../getPullRequests";
import type { PrRange } from "../prRange";

export const usePullRequestsQuery = (repository: string, range: PrRange) =>
  useQuery({
    queryKey: ["github", "pull-requests", repository, range],
    queryFn: () => getPullRequests(repository, range),
    enabled: Boolean(repository.trim()),
  });
