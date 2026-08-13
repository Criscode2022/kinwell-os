export function labelize(value: string) {
  return (value || '').replace(/_/g, ' ');
}

export function statusClass(status: string) {
  const map: Record<string, string> = {
    taken: 'bg-bottle-50 text-bottle-700',
    upcoming: 'bg-brass-400/15 text-brass-700',
    due: 'bg-rose-400/15 text-rose-600',
    skipped: 'bg-ink-100 text-ink-600',
    missed: 'bg-rose-400/20 text-rose-600',
    scheduled: 'bg-bottle-50 text-bottle-700',
    completed: 'bg-ink-100 text-ink-700',
    cancelled: 'bg-ink-100 text-ink-500',
    no_show: 'bg-rose-400/15 text-rose-600',
    open: 'bg-brass-400/15 text-brass-700',
    doing: 'bg-bottle-50 text-bottle-700',
    done: 'bg-ink-100 text-ink-600',
    good: 'bg-bottle-50 text-bottle-700',
    ok: 'bg-ink-100 text-ink-700',
    low: 'bg-brass-400/20 text-brass-700',
    unwell: 'bg-rose-400/20 text-rose-600',
    poor: 'bg-rose-400/15 text-rose-600',
    restless: 'bg-brass-400/20 text-brass-700',
    active: 'bg-bottle-50 text-bottle-700',
  };
  return map[status] || 'bg-ink-100 text-ink-700';
}

export function ageFrom(dob: string | null) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}
