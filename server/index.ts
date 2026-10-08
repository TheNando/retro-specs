import index from "../index.html";
import { handleGithubGraphql } from "./githubGraphql";

const server = Bun.serve({
  routes: {
    "/": index,
    "/api/github/graphql": {
      POST: async (req) => {
        const { status, body } = await handleGithubGraphql(await req.text());
        return Response.json(body, { status });
      },
      GET: () => Response.json({ message: "Only POST is supported." }, { status: 405 }),
    },
  },
});

console.log(`Retro Specs running at ${server.url}`);
