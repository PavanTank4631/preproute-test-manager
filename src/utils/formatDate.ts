export function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
