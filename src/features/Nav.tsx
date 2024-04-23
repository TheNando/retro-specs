import { useState } from "preact/hooks";

import { UserIcon } from "../assets/UserIcon";
import { useUser } from "../libs/queries";
import { pat, user } from "../libs/utils";
import { Repo } from "./Repo";

const Avatar = () => {
  const { data: userData, isSuccess } = useUser();
  const [hide, setHide] = useState(false);

  if (!isSuccess) {
    return null;
  }

  user.value = userData;

  const isOpen = !hide && !pat.value ? "tooltip-open" : "";

  const showModal = () => {
    setHide(true);
    const modal = document.getElementById("config_modal") as HTMLDialogElement;
    modal.showModal();
  };

  return (
    <div
      class={`tooltip tooltip-info tooltip-left ${isOpen}`}
      data-tip={user.value.name ?? "Click here to add config"}
    >
      <button
        class="btn btn-ghost btn-circle avatar mt-1"
        onClick={showModal}
        role="button"
        tabindex={0}
      >
        <div class="w-10 rounded-full">
          {user.value.name ? <img src={user.value.avatar_url} /> : <UserIcon />}
        </div>
      </button>
    </div>
  );
};

export const Nav = () => {
  return (
    <div class="navbar bg-neutral text-neutral-content px-10">
      <div class="flex-1 text-xl gap-3">
        <img src="./public/3d-glasses.png" class="circle-icon" />
        <span>Retro Specs</span>
      </div>

      <div class="flex-none gap-3">
        <Repo />
        <Avatar />
      </div>
    </div>
  );
};
