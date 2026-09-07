const styles: Record<string, string> = {
  easy: "bg-easy text-easy-foreground",
  moderate: "bg-moderate text-moderate-foreground",
  hard: "bg-hard text-hard-foreground",
};

export function DifficultyBadge({ level }: { level: string }) {
  const key = level?.toLowerCase?.() ?? "easy";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        styles[key] ?? "bg-easy text-easy-foreground"
      }`}
    >
      {key}
    </span>
  );
}
