import { useMemo, useState } from 'react';
import { Badge } from '../../components/Badge';
import { ButtonLink } from '../../components/Button';
import { DataTable, type Column } from '../../components/DataTable';
import { PageHero, Section } from '../../components/Section';

type Status = 'Active' | 'Paused' | 'Done';

interface Project {
  name: string;
  owner: string;
  progress: number;
  status: Status;
}

const projects: Project[] = [
  { name: 'Fjord Portal', owner: 'Ada', progress: 82, status: 'Active' },
  { name: 'Bergen CRM', owner: 'Ola', progress: 45, status: 'Active' },
  { name: 'Ulriken App', owner: 'Kari', progress: 100, status: 'Done' },
  { name: 'Cable Cam', owner: 'Per', progress: 12, status: 'Paused' },
  { name: 'Skyline API', owner: 'Ada', progress: 67, status: 'Active' },
  { name: 'Trail Maps', owner: 'Nina', progress: 90, status: 'Done' },
  { name: 'Weather Sync', owner: 'Ola', progress: 33, status: 'Paused' },
  { name: 'Ticket Hub', owner: 'Kari', progress: 58, status: 'Active' },
  { name: 'Summit Docs', owner: 'Per', progress: 75, status: 'Active' },
  { name: 'Green Deploy', owner: 'Nina', progress: 100, status: 'Done' },
  { name: 'Cliff Notes', owner: 'Ada', progress: 20, status: 'Paused' },
  { name: 'Ridge Runner', owner: 'Ola', progress: 88, status: 'Active' },
];

const statusView: Record<Status, { variant: 'success' | 'warning'; icon: string; text: string }> = {
  Active: { variant: 'success', icon: 'fa-solid fa-play', text: 'Aktiv' },
  Paused: { variant: 'warning', icon: 'fa-solid fa-pause', text: 'Pause' },
  Done: { variant: 'success', icon: 'fa-solid fa-check', text: 'Ferdig' },
};

const columns: Column<Project>[] = [
  { key: 'name', header: 'Prosjekt ', render: (p) => <b>{p.name}</b> },
  { key: 'owner', header: 'Eier ' },
  { key: 'progress', header: 'Fremdrift ', align: 'right', render: (p) => `${p.progress}%` },
  {
    key: 'status',
    header: 'Status ',
    value: (p) => statusView[p.status].text,
    render: (p) => (
      <Badge variant={statusView[p.status].variant} icon={statusView[p.status].icon}>
        {' '}
        {statusView[p.status].text}
      </Badge>
    ),
  },
];

export default function TablesPage() {
  const [status, setStatus] = useState('');
  const rows = useMemo(() => projects.filter((p) => !status || p.status === status), [status]);

  return (
    <>
      <PageHero
        eyebrow="Designsystem"
        title="Tabeller"
        lead="Responsive tabeller med filter, sortering og paginering."
        actions={
          <ButtonLink to="/ds" variant="outline" icon="fa-solid fa-arrow-left">
            Alle komponenter
          </ButtonLink>
        }
      />
      <Section id="tables" title="Tabeller" lead="Responsive tabeller med filter-/sorteringshode og pagineringsbunn.">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(p) => p.name}
          filterPlaceholder="Filtrer prosjekter…"
          itemLabel="prosjekter"
          pageSizes={[5]}
          initialSort={{ key: 'name', dir: 1 }}
          toolbar={
            <select
              className="form-select"
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: 'auto', padding: '10px 40px 10px 14px', fontSize: 'var(--fs-2)' }}
            >
              <option value="">Alle statuser</option>
              <option value="Active">Aktiv</option>
              <option value="Paused">Pause</option>
              <option value="Done">Ferdig</option>
            </select>
          }
        />
      </Section>
    </>
  );
}
