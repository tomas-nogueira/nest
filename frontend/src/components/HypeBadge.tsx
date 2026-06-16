import { AnimatedFireIcon, getFireTier } from "./AnimatedFireIcon";
import { cn } from "../lib/utils";

const hypeBadgeClasses = {
  spark: "bg-red-50 text-red-700 ring-red-100",
  large: "bg-orange-50 text-orange-700 ring-orange-100",
  blue: "bg-sky-50 text-sky-700 ring-sky-100",
  gold: "bg-yellow-50 text-amber-800 ring-yellow-200 shadow-[0_0_18px_rgba(250,204,21,0.28)]",
};

type HypeBadgeProps = {
  hype: number;
  className?: string;
  iconSize?: number;
  compact?: boolean;
  animateNumber?: boolean;
};

const HYPE_TOOLTIP = "Hype aumenta quando seus posts ou comentarios recebem upvotes.";

const HypeBadge = ({ hype, className, iconSize = 20, compact = false, animateNumber = true }: HypeBadgeProps) => {
  const tier = getFireTier(hype);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full py-1 pl-1 text-xs font-medium ring-1",
        compact ? "pr-2" : "pr-3",
        hypeBadgeClasses[tier],
        className,
      )}
      title={HYPE_TOOLTIP}
      aria-label={`Hype ${hype}. ${HYPE_TOOLTIP}`}
    >
      <AnimatedFireIcon size={iconSize} hype={hype} />
      <span>
        {compact ? null : "Hype: "}
        <span className={cn(animateNumber && hype >= 50 && "hype-number--enter")}>{hype}</span>
      </span>
    </span>
  );
};

export { HypeBadge };
