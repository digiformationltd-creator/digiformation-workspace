import { useEffect, useRef, useState } from "react";

type Spark = { id: number; x: number; y: number; color: string; size: number };

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

/**
 * Global rainbow cursor aura.
 * Follows the cursor across the whole page with a subtle glow + tiny sparks.
 * Hidden whenever the cursor is over any element marked with `data-no-aura`
 * (or inside such an element).
 */
export function RainbowCursor() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [on, setOn] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const lastEmit = useRef(0);
  const idRef = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const blocked = !!target?.closest?.("[data-no-aura]");
      if (blocked) {
        if (on) setOn(false);
        return;
      }
      setPos({ x: e.clientX, y: e.clientY });
      if (!on) setOn(true);

      const now = performance.now();
      if (now - lastEmit.current < 70) return;
      lastEmit.current = now;

      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const jitterX = e.clientX + (Math.random() - 0.5) * 18;
      const jitterY = e.clientY + (Math.random() - 0.5) * 18;
      const id = ++idRef.current;
      const size = 3 + Math.random() * 4;

      setSparks((prev) => [
        ...prev.slice(-14),
        { id, x: jitterX, y: jitterY, color, size },
      ]);
      window.setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== id));
      }, 700);
    };

    const onLeave = () => setOn(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [on]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {/* soft rainbow glow following cursor */}
      <div
        aria-hidden
        className="absolute h-20 w-20 rounded-full blur-2xl transition-opacity duration-200"
        style={{
          left: pos.x - 40,
          top: pos.y - 40,
          opacity: on ? 0.35 : 0,
          background:
            "conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ec4899, #ef4444)",
        }}
      />
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
            boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
          }}
        />
      ))}
    </div>
  );
}
