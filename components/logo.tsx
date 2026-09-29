export function Logo() {
  return (
    <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
      <span
        aria-hidden
        className="grid h-6 w-8 place-items-center rounded-lg bg-linear-to-b from-accent-500 from-50% to-brand-600 to-50% text-star-400"
      >
        ★
      </span>
      <span className="font-script text-3xl font-normal leading-none tracking-normal">
        Faso <span className="text-brand-600">Emploi</span>
      </span>
    </span>
  );
}
