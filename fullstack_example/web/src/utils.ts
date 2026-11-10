export const errorMessage = (e: unknown): string =>
  typeof e === 'string' ? e : e instanceof Error ? e.message : 'Ukjent feil';

export const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
export const isPhone = (v: string) => /^\+?[0-9 ()-]{5,20}$/.test(v.trim());

export const emptyToNull = (v: string): string | null => (v.trim() === '' ? null : v.trim());

const nok = new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' });
export const formatMoney = (v: number | string) => nok.format(Number(v) || 0);

export function formatDate(v: string | null | undefined): string {
  if (!v) return '';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('nb-NO');
}

export const today = () => new Date().toISOString().slice(0, 10);
