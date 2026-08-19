"use client";

import { ReactLenis, type LenisRef } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const lenisOptions = {
  autoRaf: true,
  lerp: 0.1,
  duration: 1.2,
  smoothWheel: true,
  anchors: true,
  stopInertiaOnNavigate: true,
  respectReducedMotion: true,
} as const;

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<LenisRef | null>(null);

  useEffect(() => {
    lenisRef.current?.lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return (
    <ReactLenis root options={lenisOptions} ref={lenisRef}>
      {children}
    </ReactLenis>
  );
}
