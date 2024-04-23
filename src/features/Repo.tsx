import { useSignal } from "@preact/signals";
import { debouncedEffect, repo, signalInput } from "../libs/utils";

type Repo = {
  branch: string;
  id: number;
  state: string;
  title: string;
  userImg: string;
};

export const Repo = () => {
  const buffer = useSignal(repo.value);

  // Update repo only when the buffer hasn't changed for 500ms
  debouncedEffect(buffer, () => (repo.value = buffer.value), 500);

  return (
    <div class="col-span-1">
      <input
        class="input input-bordered w-full"
        placeholder="{owner}/{repo}"
        type="text"
        onInput={signalInput(buffer)}
        value={buffer}
      />
    </div>
  );
};
