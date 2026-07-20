import { useEffect, useMemo, useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import { repositoryHistory } from "../client/repositoryHistory";
import { repo } from "./utils";

const selectedRepositoryStorageKey = "gh_repo";

export const Repo = () => {
  const [value, setValue] = useState(
    window.localStorage.getItem(selectedRepositoryStorageKey) ?? "",
  );
  const [isFiltering, setIsFiltering] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const matches = useMemo(() => {
    const normalizedValue = value.trim().toLowerCase();
    const search = isFiltering ? normalizedValue : "";
    return repositoryHistory.value.filter(
      (repository) =>
        repository.toLowerCase() !== normalizedValue &&
        repository.toLowerCase().includes(search),
    );
  }, [value, repositoryHistory.value]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      repo.value = value.trim();
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [value]);

  const updateValue = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    setValue(event.currentTarget.value);
    setIsFiltering(true);
    setIsOpen(true);
  };

  const selectRepository = (repository: string) => {
    setValue(repository);
    setIsOpen(false);
  };

  return (
    <div class="relative w-64">
      <input
        aria-autocomplete="list"
        aria-controls="repository-history"
        aria-expanded={isOpen && matches.length > 0}
        class="input input-bordered w-full"
        onBlur={() => window.setTimeout(() => setIsOpen(false), 100)}
        onFocus={() => {
          setIsFiltering(false);
          setIsOpen(true);
        }}
        onInput={updateValue}
        placeholder="{owner}/{repo}"
        role="combobox"
        type="text"
        value={value}
      />
      {isOpen && matches.length > 0 && (
        <ul
          class="menu absolute z-10 mt-1 w-full rounded-box bg-base-100 p-1 text-base-content shadow-lg"
          id="repository-history"
          role="listbox"
        >
          {matches.map((repository) => (
            <li key={repository} role="option" aria-selected={repository === value}>
              <button
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectRepository(repository)}
              >
                {repository}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
