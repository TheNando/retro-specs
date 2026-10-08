import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { handleGithubGraphql } from "./server/githubGraphql";

const sendJson = (res: import("node:http").ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

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
            const { status, body } = await handleGithubGraphql(request);
            sendJson(res, status, body);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to read request.";
            sendJson(res, 502, { code: "GH_GRAPHQL_FAILED", message });
          }
        });
      },
    },
  ],
});
