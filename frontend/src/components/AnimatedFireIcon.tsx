import { useId, type CSSProperties } from "react";
import { Flame } from "lucide-react";

type FireIconProps = {
  hype?: number;
  size?: number;
};

type FireTier = "spark" | "large" | "blue" | "gold";

type FireTierConfig = {
  className: string;
  core: string;
  outerStops: [string, string, string];
  innerStops: [string, string, string];
  particleCount: number;
  speed: string;
  intensity: number;
};

const getFireTier = (hype: number): FireTier => {
  if (hype >= 100) {
    return "gold";
  }

  if (hype >= 50) {
    return "blue";
  }

  if (hype >= 25) {
    return "large";
  }

  return "spark";
};

const tierConfig: Record<FireTier, FireTierConfig> = {
  spark: {
    className: "hype-fire--spark",
    core: "#FFF176",
    outerStops: ["#FFB300", "#FF6D00", "#E53935"],
    innerStops: ["#FFF176", "#FFCA28", "#FF8F00"],
    particleCount: 3,
    speed: "1.35s",
    intensity: 1,
  },
  large: {
    className: "hype-fire--large",
    core: "#FFF59D",
    outerStops: ["#FFD54F", "#FF6D00", "#D84315"],
    innerStops: ["#FFF9C4", "#FFD54F", "#F57C00"],
    particleCount: 4,
    speed: "1.05s",
    intensity: 1.16,
  },
  blue: {
    className: "hype-fire--blue",
    core: "#E0F7FA",
    outerStops: ["#B3E5FC", "#03A9F4", "#1565C0"],
    innerStops: ["#FFFFFF", "#80DEEA", "#00ACC1"],
    particleCount: 5,
    speed: "0.85s",
    intensity: 1.22,
  },
  gold: {
    className: "hype-fire--gold",
    core: "#FFFFFF",
    outerStops: ["#FFFFFF", "#FFD700", "#FF8F00"],
    innerStops: ["#FFFFFF", "#FFF176", "#FFB300"],
    particleCount: 7,
    speed: "0.68s",
    intensity: 1.32,
  },
};

const getParticleStyle = (index: number, total: number, size: number, intensity: number): CSSProperties => {
  const offset = index - (total - 1) / 2;
  const dotSize = size * (0.055 + index * 0.003);

  return {
    width: dotSize,
    height: dotSize,
    left: `${50 + offset * 8}%`,
    bottom: `${14 + (index % 2) * 4}%`,
    animationDelay: `${index * 0.12}s`,
    "--particle-x": `${offset * size * 0.045}px`,
    "--particle-y": `${-size * (0.42 + intensity * 0.12)}px`,
    "--particle-mid-x": `${offset * size * 0.045 * 0.45}px`,
    "--particle-mid-y": `${-size * (0.42 + intensity * 0.12) * 0.35}px`,
  } as CSSProperties;
};

export function AnimatedFireIcon({ hype = 0, size = 80 }: FireIconProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const tier = getFireTier(hype);
  const config = tierConfig[tier];
  const outerFireId = `${id}OuterFire`;
  const innerFireId = `${id}InnerFire`;

  if (tier === "spark") {
    return (
      <Flame
        style={{ width: size, height: size }}
        className="shrink-0 fill-orange-100 text-orange-600 [stroke-width:2.75]"
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={`hype-fire ${config.className}`}
      style={
        {
          width: size,
          height: size,
          "--fire-speed": config.speed,
          "--fire-intensity": config.intensity,
          "--fire-enter-scale": 1.28 * config.intensity,
          "--fire-idle-scale": 1 + 0.05 * config.intensity,
          "--fire-rotate": `${1.5 * config.intensity}deg`,
          "--fire-rotate-negative": `${-1.5 * config.intensity}deg`,
          "--fire-glow-scale": 1.14 * config.intensity,
          "--fire-outer-scale": 1 + 0.045 * config.intensity,
          "--fire-outer-y": `${-1 * config.intensity}px`,
          "--fire-inner-scale": 1 + 0.08 * config.intensity,
          "--fire-inner-y": `${-2 * config.intensity}px`,
          "--fire-core-scale": 1 + 0.1 * config.intensity,
          "--fire-inner-speed": `${Number.parseFloat(config.speed) * 0.75}s`,
          "--fire-core-speed": `${Number.parseFloat(config.speed) * 0.6}s`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <span className="hype-fire__aura" />
      <span className="hype-fire__glow" />

      {Array.from({ length: config.particleCount }, (_, index) => (
        <span
          key={index}
          className="hype-fire__particle"
          style={getParticleStyle(index, config.particleCount, size, config.intensity)}
        />
      ))}

      <svg width={size} height={size} viewBox="0 0 100 100" className="hype-fire__svg" fill="none">
        <path
          className="hype-fire__outer"
          d="M50 94C31 94 18 81 18 64C18 47 31 38 36 25C39 17 38 10 37 6C50 14 59 28 59 43C65 38 68 30 69 22C79 32 85 46 85 62C85 81 69 94 50 94Z"
          fill={`url(#${outerFireId})`}
        />
        <path
          className="hype-fire__inner"
          d="M51 85C40 85 32 78 32 67C32 57 40 51 43 42C45 36 45 31 44 27C53 34 58 43 57 53C61 50 63 45 64 40C70 47 73 56 73 65C73 78 63 85 51 85Z"
          fill={`url(#${innerFireId})`}
        />
        <path
          className="hype-fire__core"
          d="M51 79C45 79 40 75 40 68C40 62 45 58 47 52C48 48 48 44 47 41C54 47 58 54 58 62C61 60 62 57 63 54C67 59 69 64 69 69C69 76 61 79 51 79Z"
          fill={config.core}
        />

        <defs>
          <linearGradient id={outerFireId} x1="50" y1="6" x2="50" y2="94">
            <stop stopColor={config.outerStops[0]} />
            <stop offset="0.45" stopColor={config.outerStops[1]} />
            <stop offset="1" stopColor={config.outerStops[2]} />
          </linearGradient>
          <linearGradient id={innerFireId} x1="52" y1="27" x2="52" y2="85">
            <stop stopColor={config.innerStops[0]} />
            <stop offset="0.5" stopColor={config.innerStops[1]} />
            <stop offset="1" stopColor={config.innerStops[2]} />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

export { getFireTier };
