import { useState } from "preact/hooks";
import { GitHubCliError } from "../client/githubGraphql";
import { useViewerQuery } from "../client/queries/useViewerQuery";
import { UserIcon } from "../assets/UserIcon";

const Avatar = () => {
  const { data: user, error } = useViewerQuery();
  const [hide, setHide] = useState(false);
  const isOpen = !hide && !user ? "tooltip-open" : "";

  const showModal = () => {
    setHide(true);
    const modal = document.getElementById("config_modal") as HTMLDialogElement;
    modal.showModal();
  };

  return (
    <>
      {error instanceof GitHubCliError && error.code === "GH_UNAUTHORIZED" && (
        <span class="mr-3 text-sm text-error">Run `gh auth login` to connect GitHub.</span>
      )}
      <div
        class={`tooltip tooltip-info tooltip-left ${isOpen}`}
        data-tip={user?.name ?? "Click for configuration"}
      >
        <button
          class="btn btn-ghost btn-circle avatar mt-1"
          onClick={showModal}
          role="button"
          tabindex={0}
        >
          <div class="w-10 rounded-full">
            {user ? <img src={user.avatarUrl} alt={`${user.login}'s avatar`} /> : <UserIcon />}
          </div>
        </button>
      </div>
    </>
  );
};

export const Nav = () => (
  <div class="navbar bg-neutral text-neutral-content px-4">
    <div class="flex-1 text-xl">Repo Snitch</div>

    <div class="flex-none">
      <Avatar />
    </div>
  </div>
);
