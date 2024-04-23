import type { JSX } from "preact/jsx-runtime";
import { Signal, effect, signal } from "@preact/signals";
import type { UserResource } from "./types";

/* Constants */

export const BEARER_HEADERS = new Headers({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${window.localStorage.getItem("gh_pat")}`,
  "X-GitHub-Api-Version": "2022-11-28",
});

export const TOKEN_HEADERS = new Headers({
  Accept: "application/vnd.github+json",
  Authorization: `token ${window.localStorage.getItem("gh_pat")}`,
  "X-GitHub-Api-Version": "2022-11-28",
});

/* Signals */

/**
 * Updates the provided signal with the value of the input element.
 */
export const signalInput =
  (signal: Signal) => (event: JSX.TargetedEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    signal.value = target.value;
  };

export const pat = signal(window.localStorage.getItem("gh_pat") ?? "");

effect(() => window.localStorage.setItem("gh_pat", pat.value));

export const repo = signal(window.localStorage.getItem("gh_repo") ?? "");

effect(() => window.localStorage.setItem("gh_repo", repo.value));

export const user = signal<UserResource>({} as UserResource);

/* Utils */

/**
 * Listens for changes to the input signal and calls the provided effect after
 * the specified delay.
 */
export const debouncedEffect = (
  signal: Signal<any>,
  effect: () => void,
  delay: number
) => {
  let timeoutId: Timer;

  // Watch for changes to the input signal
  signal.subscribe(() => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(effect, delay);
  });
};

type FetchOptions<T> = {
  headers?: Headers;
  select?: (arg: any) => T;
};

/**
 * Fetches JSON from the provided URL using the provided headers.
 */
export const fetchJson = <T>(
  url: string,
  { headers = BEARER_HEADERS, select = (arg) => arg }: FetchOptions<T> = {}
): Promise<T> =>
  fetch(url, { headers })
    .then((response) => response.json())
    .then((json) => select(json));
