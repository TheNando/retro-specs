const formatAge = (date: string) => {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const mins = Math.round(diff / (1000 * 60));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h`;
  return `${Math.round(diff / (1000 * 60 * 60 * 24))}d`;
};

type AgeProps = {
  date: string;
  tooltip: string;
};

export const Age = ({ date, tooltip }: AgeProps) => (
  <div
    class="tooltip tooltip-right before:whitespace-pre-line before:text-left"
    data-tip={tooltip}
  >
    {formatAge(date)}
  </div>
);
