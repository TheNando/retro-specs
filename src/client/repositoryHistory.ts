import { signal } from "@preact/signals";

const historyStorageKey = "gh_repo_history";
const selectedRepositoryStorageKey = "gh_repo";

const isRepositoryName = (value: unknown): value is string =>
  typeof value === "string" && /^[^/\s]+\/[^/\s]+$/.test(value);

const readHistory = () => {
  try {
    const value = JSON.parse(window.localStorage.getItem(historyStorageKey) ?? "[]");
    return Array.isArray(value)
      ? [...new Set(value.map((repository) => repository.trim()).filter(isRepositoryName))]
      : [];
  } catch {
    return [];
  }
};

export const isRepository = (repository: string) => isRepositoryName(repository.trim());

export const repositoryHistory = signal(readHistory());

export const rememberRepository = (repository: string) => {
  const normalized = repository.trim();
  if (!isRepository(normalized)) return;

  const history = [
    normalized,
    ...repositoryHistory.value.filter(
      (entry) => entry.toLowerCase() !== normalized.toLowerCase(),
    ),
  ];
  repositoryHistory.value = history;
  window.localStorage.setItem(historyStorageKey, JSON.stringify(history));
  window.localStorage.setItem(selectedRepositoryStorageKey, normalized);
};
