import { signal } from "@preact/signals";
import { useState } from "preact/hooks";

export const repo = signal("");

export const useSelectedAuthor = (storageKey: string, defaultAuthor?: string) => {
  const [saved, setSaved] = useState(() => window.localStorage.getItem(storageKey));
  const selectedAuthor = saved === null ? defaultAuthor ?? null : saved || null;
  const toggleAuthor = (author: string | null) => {
    const next = !author || author === selectedAuthor ? "" : author;
    window.localStorage.setItem(storageKey, next);
    setSaved(next);
  };
  return [selectedAuthor, toggleAuthor] as const;
};
