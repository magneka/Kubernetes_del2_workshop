import { useCallback } from 'react';
import { FormGroup, Input, Textarea } from '../components/Form';
import { customers } from '../store';
import { useAppDispatch, useCustomers } from '../store/hooks';
import type { Customer, CustomerInput } from '../types';
import { emptyToNull, isEmail, isPhone } from '../utils';
import { FormPage, useEntityForm, type Errors } from './shared';

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const empty: CustomerForm = { name: '', email: '', phone: '', address: '' };
const toForm = (c: Customer): CustomerForm => ({
  name: c.name,
  email: c.email ?? '',
  phone: c.phone ?? '',
  address: c.address ?? '',
});

function validate(f: CustomerForm): Errors<CustomerForm> {
  const e: Errors<CustomerForm> = {};
  if (!f.name.trim()) e.name = 'Navn er påkrevd.';
  else if (f.name.trim().length > 255) e.name = 'Navnet kan ha maks 255 tegn.';
  if (f.email.trim() && !isEmail(f.email)) e.email = 'Skriv inn en gyldig e-postadresse.';
  if (f.phone.trim() && !isPhone(f.phone)) e.phone = 'Ugyldig telefonnummer.';
  if (f.address.length > 500) e.address = 'Adressen kan ha maks 500 tegn.';
  return e;
}

export default function CustomerFormPage() {
  const dispatch = useAppDispatch();
  const state = useCustomers();
  const f = useEntityForm({ state, empty, toForm, validate });

  const save = useCallback(
    async (form: CustomerForm) => {
      const data: CustomerInput = {
        name: form.name.trim(),
        email: emptyToNull(form.email),
        phone: emptyToNull(form.phone),
        address: emptyToNull(form.address),
      };
      if (f.editId !== null) await dispatch(customers.update({ id: f.editId, data })).unwrap();
      else await dispatch(customers.create(data)).unwrap();
    },
    [dispatch, f.editId],
  );

  return (
    <FormPage
      title={f.isEdit ? 'Rediger kunde' : 'Ny kunde'}
      icon="fa-solid fa-address-card"
      listTo="/customers"
      listLabel="Alle kunder"
      entityLabel="Kunde"
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
      onSubmit={(e) => void f.submit(e, save, f.isEdit ? 'Kunden er oppdatert.' : 'Kunden er opprettet.')}
    >
      <div className="col-12 col-md-6">
        <FormGroup label="Navn" htmlFor="name" required help="Fullt navn eller firmanavn." error={f.errors.name}>
          <Input id="name" placeholder="Kari Nordmann" value={f.form.name} onChange={(e) => f.set('name', e.target.value)} />
        </FormGroup>
      </div>
      <div className="col-12 col-md-6">
        <FormGroup label="E-post" htmlFor="email" error={f.errors.email}>
          <Input
            id="email"
            type="email"
            placeholder="kari@eksempel.no"
            value={f.form.email}
            onChange={(e) => f.set('email', e.target.value)}
          />
        </FormGroup>
      </div>
      <div className="col-12 col-md-6">
        <FormGroup label="Telefon" htmlFor="phone" help="F.eks. +47 55 00 00 00" error={f.errors.phone}>
          <Input id="phone" type="tel" value={f.form.phone} onChange={(e) => f.set('phone', e.target.value)} />
        </FormGroup>
      </div>
      <div className="col-12">
        <FormGroup label="Adresse" htmlFor="address" error={f.errors.address}>
          <Textarea
            id="address"
            placeholder="Gateadresse, postnummer og sted"
            value={f.form.address}
            onChange={(e) => f.set('address', e.target.value)}
          />
        </FormGroup>
      </div>
    </FormPage>
  );
}
