export class GitHubCliError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = "GitHubCliError";
  }
}

export const githubGraphql = async <T>(query: string, variables: Record<string, string | number | boolean | undefined> = {}): Promise<T> => {
  const response = await fetch("/api/github/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const payload = (await response.json()) as T & { message?: string; code?: string };

  if (!response.ok) {
    throw new GitHubCliError(payload.message ?? "GitHub CLI request failed.", payload.code);
  }

  return payload;
};
