import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type GraphqlRequest = {
  query?: unknown;
  variables?: unknown;
};

export type GithubGraphqlResult = {
  status: number;
  body: unknown;
};

const unauthorizedMessage =
  "GitHub CLI is not authenticated. Run `gh auth login` in your terminal, then reload Retro Specs.";

const isUnauthorized = (message: string) =>
  /not logged into|authentication failed|requires authentication|gh auth login/i.test(message);

export const handleGithubGraphql = async (request: string): Promise<GithubGraphqlResult> => {
  try {
    const { query, variables = {} } = JSON.parse(request) as GraphqlRequest;

    if (typeof query !== "string" || !query.trim() || typeof variables !== "object" || variables === null) {
      return { status: 400, body: { message: "A GraphQL query and variables are required." } };
    }

    const args = ["api", "graphql", "--raw-field", `query=${query}`];
    for (const [name, value] of Object.entries(variables as Record<string, string | number | boolean | undefined>)) {
      if (value !== undefined) args.push("--field", `${name}=${value}`);
    }

    const { stdout } = await execFileAsync("gh", args, { maxBuffer: 5 * 1024 * 1024 });
    return { status: 200, body: JSON.parse(stdout) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub CLI failed to run.";
    if (isUnauthorized(message)) {
      return { status: 401, body: { code: "GH_UNAUTHORIZED", message: unauthorizedMessage } };
    }
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        status: 503,
        body: {
          code: "GH_CLI_UNAVAILABLE",
          message: "GitHub CLI (`gh`) is required. Install it and authenticate with `gh auth login`.",
        },
      };
    }
    return { status: 502, body: { code: "GH_GRAPHQL_FAILED", message } };
  }
};
