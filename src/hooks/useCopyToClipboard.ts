import { useCallback, useEffect, useRef, useState } from "react";

export function useCopyToClipboard(delayMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), delayMs);
      } catch {
        // Clipboard access may be denied; fail silently.
      }
    },
    [delayMs]
  );

  return { copy, copied };
}
