import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type GraphqlRequest = {
  query?: unknown;
  variables?: unknown;
};

const unauthorizedMessage =
  "GitHub CLI is not authenticated. Run `gh auth login` in your terminal, then reload Repo Snitch.";

const sendJson = (res: import("node:http").ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const isUnauthorized = (message: string) =>
  /not logged into|authentication failed|requires authentication|gh auth login/i.test(message);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    {
      name: "github-cli-graphql",
      configureServer(server) {
        server.middlewares.use("/api/github/graphql", async (req, res) => {
          if (req.method !== "POST") {
            sendJson(res, 405, { message: "Only POST is supported." });
            return;
          }

          try {
            const request = await new Promise<string>((resolve, reject) => {
              let body = "";
              req.on("data", (chunk) => (body += chunk));
              req.on("end", () => resolve(body));
              req.on("error", reject);
            });
            const { query, variables = {} } = JSON.parse(request) as GraphqlRequest;

            if (typeof query !== "string" || !query.trim() || typeof variables !== "object" || variables === null) {
              sendJson(res, 400, { message: "A GraphQL query and variables are required." });
              return;
            }

            const args = ["api", "graphql", "--raw-field", `query=${query}`];
            for (const [name, value] of Object.entries(variables as Record<string, string | number | boolean | undefined>)) {
              if (value !== undefined) args.push("--field", `${name}=${value}`);
            }

            const { stdout } = await execFileAsync("gh", args, { maxBuffer: 5 * 1024 * 1024 });
            sendJson(res, 200, JSON.parse(stdout));
          } catch (error) {
            const message = error instanceof Error ? error.message : "GitHub CLI failed to run.";
            if (isUnauthorized(message)) {
              sendJson(res, 401, { code: "GH_UNAUTHORIZED", message: unauthorizedMessage });
              return;
            }
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
              sendJson(res, 503, {
                code: "GH_CLI_UNAVAILABLE",
                message: "GitHub CLI (`gh`) is required. Install it and authenticate with `gh auth login`.",
              });
              return;
            }
            sendJson(res, 502, { code: "GH_GRAPHQL_FAILED", message });
          }
        });
      },
    },
  ],
});
