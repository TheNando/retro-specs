import Dexie, { type EntityTable } from "dexie";
import type { PullRequest } from "./types";

export const idb = new Dexie("retro-specs") as Dexie & {
  pullRequests: EntityTable<PullRequest, "id">;
};

idb.version(1).stores({
  pullRequests: "++id, [repo+updated_at]",
});
