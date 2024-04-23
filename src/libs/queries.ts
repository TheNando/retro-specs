import { useQuery, type QueryOptions } from "@tanstack/react-query";
import type { PullRequestResource, UserResource } from "./types";
import { BEARER_HEADERS, fetchJson, TOKEN_HEADERS } from "./utils";

export const prsUrl = (repo: string) =>
  `https://api.github.com/repos/${repo}/pulls`;

export const usePullRequests = (
  repo: string,
  options?: QueryOptions<PullRequestResource[]>
) =>
  useQuery({
    ...options,
    queryKey: [repo, "pulls"],
    queryFn: () =>
      fetchJson<PullRequestResource[]>(prsUrl(repo), BEARER_HEADERS),
  });

const userUrl = "https://api.github.com/user";

export const useUser = () =>
  useQuery({
    queryKey: ["user"],
    queryFn: () => fetchJson<UserResource>(userUrl, TOKEN_HEADERS),
  });

// const prUrl = (repo: string, pr: number) =>
//   `https://api.github.com/repos/${repo}/pulls/${pr}`;

// export const usePullRequest = (
//   { repo: string, pr: number },
//   options?: QueryOptions<PullRequestResource[]>
// ) =>
//   useQuery({
//     queryKey: [repo, "pulls", pr],
//     queryFn: () =>
//       fetchJson<PullRequestResource>(prUrl(repo, pr), BEARER_HEADERS),
//     // select: (data): PullRequest[] =>
//     //   data.map((item: any) => ({
//     //     branch: item.head.ref,
//     //     id: item.number,
//     //     state: item.state,
//     //     title: item.title,
//     //     userImg: item.user.avatar_url,
//     //   })),
//   });

// const reviewsUrl = (repo: string, pr: number) =>
//   `https://api.github.com/repos/${repo}/pulls/${pr.toString()}/reviews`;

// export const useReviews = (repo: string, pr: number) =>
//   useQuery({
//     queryKey: [repo, "pulls", pr, "reviews"],
//     queryFn: () => fetchJson<Review>(reviewsUrl(repo, pr), BEARER_HEADERS),
//     // select: (data): Review[] =>
//     //   data.map((item: any) => ({
//     //     title: item.title,
//     //   })),
//   });
