import { useMemo } from 'react';
import { DataTable, type Column } from '../components/DataTable';
import { customers } from '../store';
import { useAppDispatch, useCustomers } from '../store/hooks';
import type { Customer } from '../types';
import { formatDate } from '../utils';
import { ListPage, RowActions, useDeleteFlow } from './shared';

export default function CustomerListPage() {
  const dispatch = useAppDispatch();
  const state = useCustomers();
  const del = useDeleteFlow<Customer>((id) => dispatch(customers.remove(id)).unwrap());

  const columns = useMemo<Column<Customer>[]>(
    () => [
      { key: 'id', header: '#', align: 'right' },
      { key: 'name', header: 'Navn', render: (c) => <b>{c.name}</b> },
      { key: 'email', header: 'E-post' },
      { key: 'phone', header: 'Telefon' },
      { key: 'address', header: 'Adresse' },
      { key: 'created_at', header: 'Opprettet', render: (c) => formatDate(c.created_at) },
    ],
    [],
  );

  return (
    <ListPage
      title="Kunder"
      icon="fa-solid fa-address-book"
      newTo="/customers/new"
      newLabel="Ny kunde"
      state={state}
      onRetry={() => void dispatch(customers.fetchAll())}
      del={del}
      describe={(c) => `Kunden «${c.name}»`}
    >
      <DataTable
        rows={state.items}
        columns={columns}
        rowKey={(c) => c.id}
        itemLabel="kunder"
        filterPlaceholder="Filtrer kunder…"
        initialSort={{ key: 'name', dir: 1 }}
        actions={(c) => <RowActions editTo={`/customers/${c.id}/edit`} onDelete={() => del.ask(c)} />}
      />
    </ListPage>
  );
}
