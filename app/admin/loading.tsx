/** Squelette affiché pendant le chargement d'une page du back-office. */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Chargement">
      <div className="h-8 w-56 rounded-lg bg-line" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card h-24" />
        ))}
      </div>
      <div className="card h-72" />
    </div>
  );
}
