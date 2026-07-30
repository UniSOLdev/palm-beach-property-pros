"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks image load state and handles cached images where `onLoad` may fire
 * before React attaches the handler (causes permanent skeleton overlay).
 */
export function useImageLoaded(src?: string) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const markLoaded = useCallback(() => {
    setLoaded(true);
  }, []);

  const setRef = useCallback(
    (node: HTMLImageElement | null) => {
      imgRef.current = node;
      if (node?.complete && node.naturalHeight > 0) {
        setLoaded(true);
      }
    },
    [],
  );

  useEffect(() => {
    setLoaded(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalHeight > 0) {
      setLoaded(true);
    }
  }, [src]);

  return { loaded, markLoaded, setRef, imgRef };
}
