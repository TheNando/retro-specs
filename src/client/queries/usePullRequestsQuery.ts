import { useQuery } from "@tanstack/react-query";
import { getPullRequests } from "../getPullRequests";

export const usePullRequestsQuery = (repository: string) =>
  useQuery({
    queryKey: ["github", "pull-requests", repository],
    queryFn: () => getPullRequests(repository),
    enabled: Boolean(repository.trim()),
  });
