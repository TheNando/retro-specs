import { useQuery } from "@tanstack/react-query";
import { getLineOfCode } from "../getLineOfCode";
import type { PrRange } from "../prRange";
import { isRepository, rememberRepository } from "../repositoryHistory";

export const useLineOfCodeQuery = (repository: string, range: PrRange) =>
  useQuery({
    queryKey: ["github", "line-of-code", repository, range],
    queryFn: async () => {
      const stats = await getLineOfCode(repository, range);
      rememberRepository(repository);
      return stats;
    },
    enabled: isRepository(repository),
  });
