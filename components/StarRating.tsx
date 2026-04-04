import { Star } from "lucide-react";

export default function StarRating({ stars, size = 20 }: { stars: number; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < stars ? "text-[color:var(--color-green)]" : "text-[color:var(--color-border)]"}
          fill={i < stars ? "var(--color-green)" : "transparent"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}
