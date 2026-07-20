export const ConfigModal = () => (
  <dialog id="config_modal" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Configuration</h3>

      <p class="py-4">
        Retro Specs uses your existing GitHub CLI authentication.
        <br />
        Run <code>gh auth login</code> in a terminal if GitHub access is
        unavailable.
      </p>

      <div class="modal-action">
        <form method="dialog">
          <button class="btn">Close</button>
        </form>
      </div>
    </div>
  </dialog>
);
