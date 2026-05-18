"use client";

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, size = 20, readonly = false }: StarRatingProps) {
  return (
    <span style={{ display: "inline-flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: readonly ? "default" : "pointer",
            lineHeight: 1,
            fontSize: size,
            color: n <= value ? "#f59e0b" : "#d1cdc7",
            transition: "color 0.1s",
          }}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
