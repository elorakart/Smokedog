"use client";

import { useMemo } from "react";
import {
  Anchor,
  Bike,
  Bell,
  Bookmark,
  Brush,
  Building2,
  Camera,
  Car,
  Cat,
  Circle,
  Clock,
  Cloud,
  Compass,
  Crown,
  Diamond,
  Droplet,
  Eye,
  Flag,
  Flame,
  Flower2,
  Ghost,
  Gift,
  Headphones,
  Heart,
  Hexagon,
  Home,
  Hourglass,
  Key,
  Leaf,
  Lock,
  Mail,
  MapPin,
  Mic,
  Moon,
  Mountain,
  Music,
  Octagon,
  Palette,
  Pencil,
  Phone,
  Plane,
  Radio,
  Rocket,
  Scissors,
  Ship,
  Smile,
  Snowflake,
  Square,
  Star,
  Sun,
  Target,
  TreePine,
  Triangle,
  Trophy,
  Tv,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { symbolKey } from "@/lib/games/spot-it/symbols";

const ICON_MAP: Record<string, LucideIcon> = {
  circle: Circle,
  square: Square,
  triangle: Triangle,
  star: Star,
  heart: Heart,
  diamond: Diamond,
  hexagon: Hexagon,
  octagon: Octagon,
  moon: Moon,
  sun: Sun,
  cloud: Cloud,
  zap: Zap,
  flame: Flame,
  droplet: Droplet,
  snowflake: Snowflake,
  leaf: Leaf,
  flower: Flower2,
  tree: TreePine,
  mountain: Mountain,
  waves: Waves,
  anchor: Anchor,
  compass: Compass,
  "map-pin": MapPin,
  home: Home,
  building: Building2,
  car: Car,
  plane: Plane,
  ship: Ship,
  bike: Bike,
  rocket: Rocket,
  key: Key,
  lock: Lock,
  bell: Bell,
  clock: Clock,
  hourglass: Hourglass,
  camera: Camera,
  music: Music,
  mic: Mic,
  headphones: Headphones,
  radio: Radio,
  tv: Tv,
  phone: Phone,
  mail: Mail,
  gift: Gift,
  crown: Crown,
  trophy: Trophy,
  target: Target,
  flag: Flag,
  bookmark: Bookmark,
  scissors: Scissors,
  pencil: Pencil,
  brush: Brush,
  palette: Palette,
  eye: Eye,
  smile: Smile,
  ghost: Ghost,
  cat: Cat,
};

function hashSeed(symbols: number[]): number {
  return symbols.reduce((a, b) => (a * 31 + b) >>> 0, 7);
}

function layoutFor(symbols: number[]) {
  const seed = hashSeed(symbols);
  const n = symbols.length;
  return symbols.map((id, i) => {
    const angle = ((seed + i * 47) % 360) + i * (360 / n);
    const rad = ((angle % 360) * Math.PI) / 180;
    const radius = 18 + ((seed + i * 13) % 22);
    const size = 18 + ((seed + i * 19) % 16);
    const rot = (seed + i * 29) % 360;
    return {
      id,
      x: 50 + Math.cos(rad) * radius,
      y: 50 + Math.sin(rad) * radius,
      size,
      rot,
    };
  });
}

export function SpotItCard({
  symbols,
  onPick,
  disabled,
  flashId,
  size = "md",
}: {
  symbols: number[];
  onPick?: (symbolId: number) => void;
  disabled?: boolean;
  flashId?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const items = useMemo(() => layoutFor(symbols), [symbols]);
  const dim =
    size === "lg" ? "w-[min(92vw,22rem)]" : size === "sm" ? "w-40" : "w-56";

  return (
    <div
      className={`relative aspect-square ${dim} rounded-full border-2 border-white/20 bg-gradient-to-br from-[#1a2230] to-[#0c1018] shadow-lg`}
    >
      {items.map((item) => {
        const key = symbolKey(item.id);
        const Icon = ICON_MAP[key] ?? Circle;
        const flashing = flashId === item.id;
        return (
          <button
            key={`${item.id}-${item.x}`}
            type="button"
            disabled={disabled || !onPick}
            onClick={() => onPick?.(item.id)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1 text-ink transition hover:scale-110 disabled:cursor-default ${
              flashing ? "scale-125 text-crimson-glow" : "text-ink"
            }`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.size}%`,
              height: `${item.size}%`,
              transform: `translate(-50%, -50%) rotate(${item.rot}deg)`,
            }}
          >
            <Icon className="h-full w-full" strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
