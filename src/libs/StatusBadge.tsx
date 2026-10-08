export type PullStatus = "failed" | "approved" | "comments" | "passed" | "open";

const badgeColor: Record<PullStatus, string> = {
  failed: "badge-error",
  approved: "badge-success",
  comments: "badge-info",
  passed: "badge-ghost",
  open: "badge-neutral",
};

const badgeEmoji: Record<PullStatus, string> = {
  failed: "❕",
  approved: "✓",
  comments: "💬",
  passed: "👌",
  open: "",
};

const statusLabel = (status: PullStatus) =>
  `${status.charAt(0).toUpperCase()}${status.slice(1)}`;

type StatusBadgeProps = {
  status: PullStatus;
  status2?: PullStatus;
};

const badgeClass = (status: PullStatus) =>
  `badge ${badgeColor[status]} text-white rounded-full w-8 h-8 p-0`;

export const StatusBadge = ({ status, status2 }: StatusBadgeProps) => {
  const label = status2
    ? `${statusLabel(status)} / ${statusLabel(status2)}`
    : statusLabel(status);
  return (
    <div class="tooltip" data-tip={label}>
      {status2 ? (
        <span
          aria-label={label}
          class="relative inline-block align-middle w-8 h-8 rounded-full overflow-hidden"
          role="img"
        >
          <span class="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
            <span class={`${badgeClass(status)} absolute left-0`}>
              {badgeEmoji[status]}
            </span>
          </span>
          <span class="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
            <span class={`${badgeClass(status2)} absolute right-0`}>
              {badgeEmoji[status2]}
            </span>
          </span>
        </span>
      ) : (
        <span aria-label={label} class={badgeClass(status)} role="img">
          {badgeEmoji[status]}
        </span>
      )}
    </div>
  );
};
