import { Link } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { ButtonLink } from '../components/Button';
import { BarChart, Donut, Legend } from '../components/Charts';
import { Panel } from '../components/Panel';
import { PageHero, Section } from '../components/Section';
import { Spinner } from '../components/Spinner';
import { StatCard } from '../components/StatCard';
import { useClients, useCustomers, useOrders, useUsers } from '../store/hooks';
import type { ResourceState } from '../store/resourceFactory';
import { ORDER_STATUSES, statusLabel, type OrderStatus } from '../types';
import { formatDate, formatMoney } from '../utils';
import { StatusBadge } from './OrderListPage';

const statusColor: Record<OrderStatus, string> = {
  pending: '#F2D544',
  processing: '#A9C273',
  shipped: '#405B06',
  cancelled: '#b23b2e',
};

function count<T>(s: ResourceState<T>) {
  if (s.status === 'failed') return '–';
  if (s.status !== 'succeeded' && s.items.length === 0) return <Spinner small />;
  return s.items.length.toLocaleString('nb-NO');
}

export default function HomePage() {
  const usersState = useUsers();
  const customersState = useCustomers();
  const clientsState = useClients();
  const ordersState = useOrders();

  const orders = ordersState.items;
  const byStatus = ORDER_STATUSES.map((s) => ({ status: s, n: orders.filter((o) => o.status === s).length }));
  const revenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const shipped = byStatus.find((b) => b.status === 'shipped')?.n ?? 0;
  const shippedPct = orders.length ? Math.round((shipped / orders.length) * 100) : 0;
  const customerName = new Map(customersState.items.map((c) => [c.id, c.name]));
  const recent = [...orders].sort((a, b) => b.order_date.localeCompare(a.order_date) || b.id - a.id).slice(0, 5);

  const failed = [usersState, customersState, clientsState, ordersState].find((s) => s.status === 'failed');

  return (
    <>
      <PageHero
        small={false}
        eyebrow="Ulriken · Ordrestyring"
        title="Velkommen"
        lead="Hold oversikt over brukere, kunder, klienter og ordrer – registrer nye poster eller rediger eksisterende fra menyen."
        actions={
          <>
            <ButtonLink to="/orders/new" size="lg" icon="fa-solid fa-cart-plus">
              Ny ordre
            </ButtonLink>
            <ButtonLink to="/orders" variant="outline" size="lg">
              Se alle ordrer
            </ButtonLink>
          </>
        }
      >
        <div style={{ marginTop: 'var(--sp-5)' }} className="toc">
          <Link to="/users">Brukere</Link>
          <Link to="/customers">Kunder</Link>
          <Link to="/clients">Klienter</Link>
          <Link to="/orders">Ordrer</Link>
          <Link to="/ds">Designsystem</Link>
        </div>
      </PageHero>

      <Section title="Dashboard">
        {failed && (
          <Alert variant="danger" title="Kunne ikke hente data." style={{ marginBottom: 'var(--sp-4)' }}>
            {failed.error}
          </Alert>
        )}

        <div className="row g-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard icon="fa-solid fa-users" value={count(usersState)} label="Brukere" to="/users" />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard icon="fa-solid fa-address-book" value={count(customersState)} label="Kunder" to="/customers" />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard icon="fa-solid fa-building" value={count(clientsState)} label="Klienter" to="/clients" />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard icon="fa-solid fa-receipt" value={count(ordersState)} label="Ordrer" to="/orders" />
          </div>
        </div>

        <div className="row g-4" style={{ marginTop: 'var(--sp-2)' }}>
          <div className="col-12 col-lg-7">
            <Panel header="Ordrer per status" icon="fa-solid fa-chart-column">
              <BarChart bars={byStatus.map((b) => ({ label: statusLabel[b.status], value: b.n }))} />
            </Panel>
          </div>
          <div className="col-12 col-lg-5">
            <Panel header="Statusfordeling" icon="fa-solid fa-chart-pie">
              <div className="row g-4" style={{ alignItems: 'center' }}>
                <div className="col-auto">
                  <Donut
                    slices={byStatus.map((b) => ({
                      label: statusLabel[b.status],
                      value: b.n,
                      color: statusColor[b.status],
                    }))}
                    center={`${shippedPct}%`}
                    centerLabel="Sendt"
                  />
                </div>
                <div className="col">
                  <Legend
                    items={byStatus.map((b) => ({ label: `${statusLabel[b.status]} · ${b.n}`, color: statusColor[b.status] }))}
                  />
                  <p className="form-help" style={{ marginTop: 'var(--sp-4)' }}>
                    Omsetning (ikke kansellert): <b>{formatMoney(revenue)}</b>
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <Panel header="Siste ordrer" icon="fa-solid fa-list-check" style={{ marginTop: 'var(--sp-4)' }}>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="tbl hoverable" style={{ minWidth: 480 }}>
              <thead>
                <tr>
                  <th>Ordre</th>
                  <th>Kunde</th>
                  <th>Dato</th>
                  <th style={{ textAlign: 'right' }}>Beløp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      Ingen ordrer ennå
                    </td>
                  </tr>
                ) : (
                  recent.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link to={`/orders/${o.id}/edit`}>
                          <b>#{o.id}</b>
                        </Link>
                      </td>
                      <td>{customerName.get(o.customer_id) ?? `Kunde #${o.customer_id}`}</td>
                      <td>{formatDate(o.order_date)}</td>
                      <td style={{ textAlign: 'right' }}>{formatMoney(o.total_amount)}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </Section>
    </>
  );
}
