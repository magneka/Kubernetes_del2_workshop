import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FormGroup, Input, Select, Textarea } from '../components/Form';
import { orders } from '../store';
import { useAppDispatch, useClients, useCustomers, useOrders } from '../store/hooks';
import type { Order, OrderInput, OrderStatus } from '../types';
import { ORDER_STATUSES, statusLabel } from '../types';
import { emptyToNull, today } from '../utils';
import { FormPage, useEntityForm, type Errors } from './shared';

interface OrderForm {
  customer_id: string;
  client_id: string;
  order_date: string;
  status: OrderStatus;
  total_amount: string;
  description: string;
}

const empty: OrderForm = {
  customer_id: '',
  client_id: '',
  order_date: today(),
  status: 'pending',
  total_amount: '',
  description: '',
};

const toForm = (o: Order): OrderForm => ({
  customer_id: String(o.customer_id),
  client_id: o.client_id == null ? '' : String(o.client_id),
  order_date: (o.order_date ?? '').slice(0, 10),
  status: o.status,
  total_amount: String(o.total_amount ?? ''),
  description: o.description ?? '',
});

function validate(f: OrderForm): Errors<OrderForm> {
  const e: Errors<OrderForm> = {};
  if (!f.customer_id) e.customer_id = 'Velg en kunde.';
  if (!f.order_date) e.order_date = 'Ordredato er påkrevd.';
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(f.order_date)) e.order_date = 'Ugyldig dato.';
  const amount = Number(f.total_amount.replace(',', '.'));
  if (f.total_amount.trim() === '') e.total_amount = 'Beløp er påkrevd.';
  else if (!Number.isFinite(amount) || amount < 0) e.total_amount = 'Beløpet må være et positivt tall.';
  else if (amount >= 1e8) e.total_amount = 'Beløpet er for stort.';
  if (!ORDER_STATUSES.includes(f.status)) e.status = 'Ugyldig status.';
  return e;
}

export default function OrderFormPage() {
  const dispatch = useAppDispatch();
  const state = useOrders();
  const customerState = useCustomers();
  const clientState = useClients();
  const f = useEntityForm({ state, empty, toForm, validate });

  const save = useCallback(
    async (form: OrderForm) => {
      const data: OrderInput = {
        customer_id: Number(form.customer_id),
        client_id: form.client_id ? Number(form.client_id) : null,
        order_date: form.order_date,
        status: form.status,
        total_amount: Math.round(Number(form.total_amount.replace(',', '.')) * 100) / 100,
        description: emptyToNull(form.description),
      };
      if (f.editId !== null) await dispatch(orders.update({ id: f.editId, data })).unwrap();
      else await dispatch(orders.create(data)).unwrap();
    },
    [dispatch, f.editId],
  );

  const sortedCustomers = [...customerState.items].sort((a, b) => a.name.localeCompare(b.name, 'nb'));
  const sortedClients = [...clientState.items].sort((a, b) => a.name.localeCompare(b.name, 'nb'));

  return (
    <FormPage
      title={f.isEdit ? `Rediger ordre #${f.editId}` : 'Ny ordre'}
      icon="fa-solid fa-cart-plus"
      listTo="/orders"
      listLabel="Alle ordrer"
      entityLabel="Ordre"
      isEdit={f.isEdit}
      loading={f.loading}
      notFound={f.notFound}
      loadError={f.loadError}
      success={f.success}
      onClearSuccess={f.clearSuccess}
      error={f.error}
      onClearError={f.clearError}
      showErrorSummary={f.showErrorSummary}
      saving={f.saving}
      onSubmit={(e) => void f.submit(e, save, f.isEdit ? 'Ordren er oppdatert.' : 'Ordren er opprettet.')}
    >
      <div className="col-12 col-md-6">
        <FormGroup
          label="Kunde"
          htmlFor="customer_id"
          required
          error={f.errors.customer_id}
          help={
            customerState.status === 'succeeded' && customerState.items.length === 0 ? (
              <>
                Ingen kunder finnes. <Link to="/customers/new">Registrer en kunde</Link> først.
              </>
            ) : (
              'Kunden som har bestilt.'
            )
          }
        >
          <Select id="customer_id" value={f.form.customer_id} onChange={(e) => f.set('customer_id', e.target.value)}>
            <option value="">{customerState.status === 'loading' ? 'Laster kunder…' : 'Velg kunde…'}</option>
            {sortedCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormGroup>
      </div>
      <div className="col-12 col-md-6">
        <FormGroup label="Klient" htmlFor="client_id" help="Valgfritt – klienten ordren gjelder." error={f.errors.client_id}>
          <Select id="client_id" value={f.form.client_id} onChange={(e) => f.set('client_id', e.target.value)}>
            <option value="">{clientState.status === 'loading' ? 'Laster klienter…' : 'Ingen klient'}</option>
            {sortedClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company ? `${c.name} (${c.company})` : c.name}
              </option>
            ))}
          </Select>
        </FormGroup>
      </div>
      <div className="col-12 col-md-4">
        <FormGroup label="Ordredato" htmlFor="order_date" required error={f.errors.order_date}>
          <Input id="order_date" type="date" value={f.form.order_date} onChange={(e) => f.set('order_date', e.target.value)} />
        </FormGroup>
      </div>
      <div className="col-12 col-md-4">
        <FormGroup label="Status" htmlFor="status" required error={f.errors.status}>
          <Select id="status" value={f.form.status} onChange={(e) => f.set('status', e.target.value as OrderStatus)}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </Select>
        </FormGroup>
      </div>
      <div className="col-12 col-md-4">
        <FormGroup label="Totalbeløp (NOK)" htmlFor="total_amount" required error={f.errors.total_amount}>
          <Input
            id="total_amount"
            inputMode="decimal"
            placeholder="0,00"
            value={f.form.total_amount}
            onChange={(e) => f.set('total_amount', e.target.value)}
          />
        </FormGroup>
      </div>
      <div className="col-12">
        <FormGroup label="Beskrivelse" htmlFor="description" error={f.errors.description}>
          <Textarea
            id="description"
            rows={4}
            placeholder="Hva gjelder ordren?"
            value={f.form.description}
            onChange={(e) => f.set('description', e.target.value)}
          />
        </FormGroup>
      </div>
    </FormPage>
  );
}
