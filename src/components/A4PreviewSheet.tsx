import React, { useEffect, useRef, useState } from 'react';

const A4_LOGICAL_WIDTH = 740;
const A4_MIN_HEIGHT = Math.round(A4_LOGICAL_WIDTH * 1.4142); // 1047px exact A4 ratio

interface A4PreviewSheetProps {
  children: React.ReactNode;
}

/**
 * Renders any printable document at an exact 740px A4 logical width and
 * proportionally scales it down via CSS transform to fit its container.
 * In @media print, CSS resets the transform to 1:1 full-page A4.
 */
export function A4PreviewSheet({ children }: A4PreviewSheetProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number>(A4_MIN_HEIGHT);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const updateMetrics = () => {
      const availWidth = outer.clientWidth;
      if (availWidth <= 0) return;
      const nextScale = Math.min(1, availWidth / A4_LOGICAL_WIDTH);
      const naturalHeight = Math.max(A4_MIN_HEIGHT, inner.scrollHeight);
      setScale(nextScale);
      setScaledHeight(Math.ceil(naturalHeight * nextScale));
    };

    updateMetrics();

    const ro = new ResizeObserver(updateMetrics);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="a4-preview-outer relative w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      style={{ height: `${scaledHeight}px` }}
    >
      <div
        ref={innerRef}
        className="a4-preview-inner origin-top-left bg-white"
        style={{
          width: `${A4_LOGICAL_WIDTH}px`,
          minHeight: `${A4_MIN_HEIGHT}px`,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
