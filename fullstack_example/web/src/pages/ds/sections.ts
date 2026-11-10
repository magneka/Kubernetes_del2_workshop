// Design-system reference pages: one per section of design_system/uc-design8.html.
export interface DsSection {
  slug: string;
  label: string;
  icon: string;
}

export const dsSections: DsSection[] = [
  { slug: 'grid', label: 'Grid', icon: 'fa-solid fa-table-cells' },
  { slug: 'panels', label: 'Paneler', icon: 'fa-solid fa-square' },
  { slug: 'colors', label: 'Farger', icon: 'fa-solid fa-palette' },
  { slug: 'type', label: 'Typografi', icon: 'fa-solid fa-font' },
  { slug: 'tabs', label: 'Faner', icon: 'fa-solid fa-folder' },
  { slug: 'forms', label: 'Skjema', icon: 'fa-solid fa-pen-to-square' },
  { slug: 'buttons', label: 'Knapper', icon: 'fa-solid fa-hand-pointer' },
  { slug: 'tables', label: 'Tabeller', icon: 'fa-solid fa-table' },
  { slug: 'modals', label: 'Modaler', icon: 'fa-solid fa-window-restore' },
  { slug: 'spinner', label: 'Spinner', icon: 'fa-solid fa-spinner' },
  { slug: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-column' },
];
