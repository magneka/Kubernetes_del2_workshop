import { useMemo } from 'react';
import { Badge } from '../components/Badge';
import { DataTable, type Column } from '../components/DataTable';
import { users } from '../store';
import { useAppDispatch, useUsers } from '../store/hooks';
import type { User } from '../types';
import { roleLabel } from '../types';
import { formatDate } from '../utils';
import { ListPage, RowActions, useDeleteFlow } from './shared';

export default function UserListPage() {
  const dispatch = useAppDispatch();
  const state = useUsers();
  const del = useDeleteFlow<User>((id) => dispatch(users.remove(id)).unwrap());

  const columns = useMemo<Column<User>[]>(
    () => [
      { key: 'id', header: '#', align: 'right' },
      { key: 'username', header: 'Brukernavn', render: (u) => <b>{u.username}</b> },
      { key: 'email', header: 'E-post' },
      {
        key: 'role',
        header: 'Rolle',
        value: (u) => roleLabel[u.role] ?? u.role,
        render: (u) => (
          <Badge variant={u.role === 'admin' ? 'warning' : 'success'} icon={u.role === 'admin' ? 'fa-solid fa-shield-halved' : 'fa-solid fa-user'}>
            {roleLabel[u.role] ?? u.role}
          </Badge>
        ),
      },
      { key: 'created_at', header: 'Opprettet', render: (u) => formatDate(u.created_at) },
    ],
    [],
  );

  return (
    <ListPage
      title="Brukere"
      icon="fa-solid fa-users"
      newTo="/users/new"
      newLabel="Ny bruker"
      state={state}
      onRetry={() => void dispatch(users.fetchAll())}
      del={del}
      describe={(u) => `Brukeren «${u.username}»`}
    >
      <DataTable
        rows={state.items}
        columns={columns}
        rowKey={(u) => u.id}
        itemLabel="brukere"
        filterPlaceholder="Filtrer brukere…"
        initialSort={{ key: 'username', dir: 1 }}
        actions={(u) => <RowActions editTo={`/users/${u.id}/edit`} onDelete={() => del.ask(u)} />}
      />
    </ListPage>
  );
}
