export function Badge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    helmet: "bg-green-100 text-green-700",
    no_helmet: "bg-red-100 text-red-700",
    unreadable: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        styles[type] || ""
      }`}
    >
      {type.replace("_", " ").toUpperCase()}
    </span>
  );
}
