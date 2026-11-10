import { useMemo } from 'react';
import { Badge, type BadgeVariant } from '../components/Badge';
import { DataTable, type Column } from '../components/DataTable';
import { orders } from '../store';
import { useAppDispatch, useClients, useCustomers, useOrders } from '../store/hooks';
import type { Order, OrderStatus } from '../types';
import { statusLabel } from '../types';
import { formatDate, formatMoney } from '../utils';
import { ListPage, RowActions, useDeleteFlow } from './shared';

const statusBadge: Record<OrderStatus, { variant: BadgeVariant; icon: string }> = {
  pending: { variant: 'warning', icon: 'fa-solid fa-hourglass-half' },
  processing: { variant: 'warning', icon: 'fa-solid fa-gears' },
  shipped: { variant: 'success', icon: 'fa-solid fa-truck' },
  cancelled: { variant: 'danger', icon: 'fa-solid fa-ban' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const b = statusBadge[status] ?? { variant: undefined, icon: 'fa-solid fa-circle' };
  return (
    <Badge variant={b.variant} icon={b.icon}>
      {statusLabel[status] ?? status}
    </Badge>
  );
}

export default function OrderListPage() {
  const dispatch = useAppDispatch();
  const state = useOrders();
  const customerState = useCustomers();
  const clientState = useClients();
  const del = useDeleteFlow<Order>((id) => dispatch(orders.remove(id)).unwrap());

  const columns = useMemo<Column<Order>[]>(() => {
    const customerName = new Map(customerState.items.map((c) => [c.id, c.name]));
    const clientName = new Map(clientState.items.map((c) => [c.id, c.name]));
    const custOf = (o: Order) => customerName.get(o.customer_id) ?? `Kunde #${o.customer_id}`;
    const clientOf = (o: Order) => (o.client_id == null ? '' : (clientName.get(o.client_id) ?? `Klient #${o.client_id}`));
    return [
      { key: 'id', header: 'Ordre', align: 'right', render: (o) => <b>#{o.id}</b> },
      { key: 'order_date', header: 'Dato', render: (o) => formatDate(o.order_date) },
      { key: 'customer', header: 'Kunde', value: custOf },
      {
        key: 'client',
        header: 'Klient',
        value: clientOf,
        render: (o) => clientOf(o) || <span style={{ color: 'var(--muted)' }}>–</span>,
      },
      {
        key: 'status',
        header: 'Status',
        value: (o) => statusLabel[o.status] ?? o.status,
        render: (o) => <StatusBadge status={o.status} />,
      },
      {
        key: 'total_amount',
        header: 'Beløp',
        align: 'right',
        value: (o) => Number(o.total_amount),
        render: (o) => formatMoney(o.total_amount),
      },
      { key: 'description', header: 'Beskrivelse', sortable: false },
    ];
  }, [customerState.items, clientState.items]);

  return (
    <ListPage
      title="Ordrer"
      icon="fa-solid fa-receipt"
      newTo="/orders/new"
      newLabel="Ny ordre"
      state={state}
      onRetry={() => void dispatch(orders.fetchAll())}
      del={del}
      describe={(o) => `Ordre #${o.id}`}
    >
      <DataTable
        rows={state.items}
        columns={columns}
        rowKey={(o) => o.id}
        itemLabel="ordrer"
        filterPlaceholder="Filtrer ordrer…"
        initialSort={{ key: 'order_date', dir: -1 }}
        actions={(o) => <RowActions editTo={`/orders/${o.id}/edit`} onDelete={() => del.ask(o)} />}
      />
    </ListPage>
  );
}
