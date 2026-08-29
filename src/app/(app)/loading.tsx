export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-48 rounded-lg bg-border-light dark:bg-border-dark" />
      <div className="h-4 w-32 rounded bg-border-light dark:bg-border-dark" />
      <div className="h-20 w-full rounded-xl bg-border-light dark:bg-border-dark mt-4" />
      <div className="space-y-3 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full rounded-xl bg-border-light dark:bg-border-dark" />
        ))}
      </div>
    </div>
  );
}
