import { repo, updateSignal } from "./utils";

export const Repo = () => (
  <input
    class="input input-bordered w-64"
    placeholder="{owner}/{repo}"
    type="text"
    onInput={updateSignal(repo)}
    value={repo}
  />
);
