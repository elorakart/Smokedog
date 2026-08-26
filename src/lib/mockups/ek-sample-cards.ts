export type EkCardStyle = "ledger" | "playful" | "weeb";

export type EkCardKind =
  | "detonation"
  | "defuse"
  | "skip"
  | "attack"
  | "see_future"
  | "shuffle"
  | "taco_cat"
  | "beard_cat";

export type EkSampleCard = {
  id: string;
  kind: EkCardKind;
  label: string;
  shortLabel: string;
  category: "danger" | "save" | "action" | "cat";
};

export const EK_SAMPLE_HAND: EkSampleCard[] = [
  {
    id: "ek-1",
    kind: "detonation",
    label: "Detonation Cat",
    shortLabel: "BOOM",
    category: "danger",
  },
  {
    id: "ek-2",
    kind: "defuse",
    label: "Purr Defuse",
    shortLabel: "Defuse",
    category: "save",
  },
  {
    id: "ek-3",
    kind: "skip",
    label: "Skip Turn",
    shortLabel: "Skip",
    category: "action",
  },
  {
    id: "ek-4",
    kind: "attack",
    label: "Double Attack",
    shortLabel: "Attack",
    category: "action",
  },
  {
    id: "ek-5",
    kind: "see_future",
    label: "See the Future",
    shortLabel: "Future",
    category: "action",
  },
  {
    id: "ek-6",
    kind: "shuffle",
    label: "Shuffle Deck",
    shortLabel: "Shuffle",
    category: "action",
  },
  {
    id: "ek-7",
    kind: "taco_cat",
    label: "Taco Cat",
    shortLabel: "Taco",
    category: "cat",
  },
  {
    id: "ek-8",
    kind: "beard_cat",
    label: "Beard Cat",
    shortLabel: "Beard",
    category: "cat",
  },
];

export type EkCardVisual = {
  bgClass: string;
  borderClass: string;
  textClass: string;
  accentClass: string;
  tagClass: string;
  icon: string;
};

export function ekCardVisual(
  card: EkSampleCard,
  style: EkCardStyle
): EkCardVisual {
  const icons: Record<EkCardKind, string> = {
    detonation: "💣",
    defuse: "🛡",
    skip: "⏭",
    attack: "⚡",
    see_future: "👁",
    shuffle: "🔀",
    taco_cat: "🌮",
    beard_cat: "🧔",
  };

  const base = { icon: icons[card.kind] };

  if (style === "ledger") {
    const categoryStyles: Record<EkSampleCard["category"], Omit<EkCardVisual, "icon">> = {
      danger: {
        bgClass: "bg-manila",
        borderClass: "border-crimson",
        textClass: "text-crimson",
        accentClass: "text-crimson",
        tagClass: "bg-crimson/10 text-crimson",
      },
      save: {
        bgClass: "bg-manila",
        borderClass: "border-crimson/70",
        textClass: "text-crimson",
        accentClass: "text-crimson",
        tagClass: "bg-crimson/10 text-crimson",
      },
      action: {
        bgClass: "bg-manila",
        borderClass: "border-crimson/50",
        textClass: "text-crimson",
        accentClass: "text-crimson/80",
        tagClass: "bg-crimson/8 text-crimson/80",
      },
      cat: {
        bgClass: "bg-manila",
        borderClass: "border-crimson/40",
        textClass: "text-crimson",
        accentClass: "text-crimson/70",
        tagClass: "bg-crimson/5 text-crimson/70",
      },
    };
    return { ...base, ...categoryStyles[card.category] };
  }

  if (style === "playful") {
    const categoryStyles: Record<EkSampleCard["category"], Omit<EkCardVisual, "icon">> = {
      danger: {
        bgClass: "bg-[#FFF3E0]",
        borderClass: "border-[#E65100]",
        textClass: "text-[#BF360C]",
        accentClass: "text-[#E65100]",
        tagClass: "bg-[#FFE0B2] text-[#E65100]",
      },
      save: {
        bgClass: "bg-[#E0F7FA]",
        borderClass: "border-[#00838F]",
        textClass: "text-[#006064]",
        accentClass: "text-[#00838F]",
        tagClass: "bg-[#B2EBF2] text-[#00838F]",
      },
      action: {
        bgClass: "bg-[#FFF8E1]",
        borderClass: "border-[#F57C00]",
        textClass: "text-[#E65100]",
        accentClass: "text-[#F57C00]",
        tagClass: "bg-[#FFECB3] text-[#F57C00]",
      },
      cat: {
        bgClass: "bg-[#F3E5F5]",
        borderClass: "border-[#7B1FA2]",
        textClass: "text-[#6A1B9A]",
        accentClass: "text-[#7B1FA2]",
        tagClass: "bg-[#E1BEE7] text-[#7B1FA2]",
      },
    };
    return { ...base, ...categoryStyles[card.category] };
  }

  const categoryStyles: Record<EkSampleCard["category"], Omit<EkCardVisual, "icon">> = {
    danger: {
      bgClass: "bg-[#FFE4EC]",
      borderClass: "border-[#FF8FAB]",
      textClass: "text-[#C9184A]",
      accentClass: "text-[#FF4D6D]",
      tagClass: "bg-[#FFC2D1] text-[#C9184A]",
    },
    save: {
      bgClass: "bg-[#E8F4FD]",
      borderClass: "border-[#90CAF9]",
      textClass: "text-[#1565C0]",
      accentClass: "text-[#42A5F5]",
      tagClass: "bg-[#BBDEFB] text-[#1565C0]",
    },
    action: {
      bgClass: "bg-[#F3E8FF]",
      borderClass: "border-[#CE93D8]",
      textClass: "text-[#7B1FA2]",
      accentClass: "text-[#AB47BC]",
      tagClass: "bg-[#E1BEE7] text-[#7B1FA2]",
    },
    cat: {
      bgClass: "bg-[#FFF0F5]",
      borderClass: "border-[#F48FB1]",
      textClass: "text-[#AD1457]",
      accentClass: "text-[#EC407A]",
      tagClass: "bg-[#F8BBD9] text-[#AD1457]",
    },
  };
  return { ...base, ...categoryStyles[card.category] };
}

export function cloneSampleHand(): EkSampleCard[] {
  return EK_SAMPLE_HAND.map((c) => ({ ...c }));
}
