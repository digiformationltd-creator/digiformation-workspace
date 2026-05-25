import { useEffect, useRef, useState } from "react";

type Spark = {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
};

const COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
];

interface Props {
  children: React.ReactNode;
  /** Radius around the wrapper (in px) within which sparks emit. */
  radius?: number;
  className?: string;
}

/**
 * Wrap children with a mouse-aware aura that emits colorful sparks
 * around the element whenever the cursor is near it (anywhere on the page).
 */
export function LogoAura({ children, radius = 220, className = "" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [glow, setGlow] = useState<{ x: number; y: number; on: boolean }>({
    x: 0,
    y: 0,
    on: false,
  });
  const lastEmit = useRef(0);
  const idRef = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist > radius) {
        if (glow.on) setGlow((g) => ({ ...g, on: false }));
        return;
      }

      // local coords (relative to wrapper)
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      setGlow({ x: localX, y: localY, on: true });

      // throttle spark emission
      const now = performance.now();
      if (now - lastEmit.current < 50) return;
      lastEmit.current = now;

      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const jitterX = localX + (Math.random() - 0.5) * 30;
      const jitterY = localY + (Math.random() - 0.5) * 30;
      const id = ++idRef.current;
      const size = 6 + Math.random() * 10;

      setSparks((prev) => [
        ...prev.slice(-24),
        { id, x: jitterX, y: jitterY, color, size },
      ]);

      window.setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== id));
      }, 900);
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [radius, glow.on]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {/* cursor-following soft rainbow glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-0 h-40 w-40 rounded-full blur-3xl transition-opacity duration-300"
        style={{
          left: glow.x - 80,
          top: glow.y - 80,
          opacity: glow.on ? 0.55 : 0,
          background:
            "conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ec4899, #ef4444)",
        }}
      />

      {/* sparks */}
      <div className="pointer-events-none absolute inset-0 z-30 overflow-visible">
        {sparks.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full spark-pop"
            style={{
              left: s.x - s.size / 2,
              top: s.y - s.size / 2,
              width: s.size,
              height: s.size,
              background: s.color,
              boxShadow: `0 0 ${s.size * 1.5}px ${s.color}`,
            }}
          />
        ))}
      </div>

      {children}
    </div>
  );
}
