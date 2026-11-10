import { useMemo } from 'react';
import { DataTable, type Column } from '../components/DataTable';
import { clients } from '../store';
import { useAppDispatch, useClients } from '../store/hooks';
import type { Client } from '../types';
import { formatDate } from '../utils';
import { ListPage, RowActions, useDeleteFlow } from './shared';

export default function ClientListPage() {
  const dispatch = useAppDispatch();
  const state = useClients();
  const del = useDeleteFlow<Client>((id) => dispatch(clients.remove(id)).unwrap());

  const columns = useMemo<Column<Client>[]>(
    () => [
      { key: 'id', header: '#', align: 'right' },
      { key: 'name', header: 'Navn', render: (c) => <b>{c.name}</b> },
      { key: 'company', header: 'Firma' },
      { key: 'contact_person', header: 'Kontaktperson' },
      { key: 'email', header: 'E-post' },
      { key: 'phone', header: 'Telefon' },
      { key: 'created_at', header: 'Opprettet', render: (c) => formatDate(c.created_at) },
    ],
    [],
  );

  return (
    <ListPage
      title="Klienter"
      icon="fa-solid fa-building"
      newTo="/clients/new"
      newLabel="Ny klient"
      state={state}
      onRetry={() => void dispatch(clients.fetchAll())}
      del={del}
      describe={(c) => `Klienten «${c.name}»`}
    >
      <DataTable
        rows={state.items}
        columns={columns}
        rowKey={(c) => c.id}
        itemLabel="klienter"
        filterPlaceholder="Filtrer klienter…"
        initialSort={{ key: 'name', dir: 1 }}
        actions={(c) => <RowActions editTo={`/clients/${c.id}/edit`} onDelete={() => del.ask(c)} />}
      />
    </ListPage>
  );
}
