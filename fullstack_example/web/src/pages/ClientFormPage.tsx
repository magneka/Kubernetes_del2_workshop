import { useCallback } from 'react';
import { FormGroup, Input } from '../components/Form';
import { clients } from '../store';
import { useAppDispatch, useClients } from '../store/hooks';
import type { Client, ClientInput } from '../types';
import { emptyToNull, isEmail, isPhone } from '../utils';
import { FormPage, useEntityForm, type Errors } from './shared';

interface ClientForm {
  name: string;
  company: string;
  contact_person: string;
  email: string;
  phone: string;
}

const empty: ClientForm = { name: '', company: '', contact_person: '', email: '', phone: '' };
const toForm = (c: Client): ClientForm => ({
  name: c.name,
  company: c.company ?? '',
  contact_person: c.contact_person ?? '',
  email: c.email ?? '',
  phone: c.phone ?? '',
});

function validate(f: ClientForm): Errors<ClientForm> {
  const e: Errors<ClientForm> = {};
  if (!f.name.trim()) e.name = 'Navn er påkrevd.';
  if (f.email.trim() && !isEmail(f.email)) e.email = 'Skriv inn en gyldig e-postadresse.';
  if (f.phone.trim() && !isPhone(f.phone)) e.phone = 'Ugyldig telefonnummer.';
  return e;
}

export default function ClientFormPage() {
  const dispatch = useAppDispatch();
  const state = useClients();
  const f = useEntityForm({ state, empty, toForm, validate });

  const save = useCallback(
    async (form: ClientForm) => {
      const data: ClientInput = {
        name: form.name.trim(),
        company: emptyToNull(form.company),
        contact_person: emptyToNull(form.contact_person),
        email: emptyToNull(form.email),
        phone: emptyToNull(form.phone),
      };
      if (f.editId !== null) await dispatch(clients.update({ id: f.editId, data })).unwrap();
      else await dispatch(clients.create(data)).unwrap();
    },
    [dispatch, f.editId],
  );

  return (
    <FormPage
      title={f.isEdit ? 'Rediger klient' : 'Ny klient'}
      icon="fa-solid fa-briefcase"
      listTo="/clients"
      listLabel="Alle klienter"
      entityLabel="Klient"
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
      onSubmit={(e) => void f.submit(e, save, f.isEdit ? 'Klienten er oppdatert.' : 'Klienten er opprettet.')}
    >
      <div className="col-12 col-md-6">
        <FormGroup label="Navn" htmlFor="name" required error={f.errors.name}>
          <Input id="name" placeholder="Fjord Logistikk" value={f.form.name} onChange={(e) => f.set('name', e.target.value)} />
        </FormGroup>
      </div>
      <div className="col-12 col-md-6">
        <FormGroup label="Firma" htmlFor="company" help="Juridisk firmanavn, hvis annet enn navn." error={f.errors.company}>
          <Input id="company" value={f.form.company} onChange={(e) => f.set('company', e.target.value)} />
        </FormGroup>
      </div>
      <div className="col-12 col-md-6">
        <FormGroup label="Kontaktperson" htmlFor="contact_person" error={f.errors.contact_person}>
          <Input
            id="contact_person"
            value={f.form.contact_person}
            onChange={(e) => f.set('contact_person', e.target.value)}
          />
        </FormGroup>
      </div>
      <div className="col-12 col-md-6">
        <FormGroup label="E-post" htmlFor="email" error={f.errors.email}>
          <Input id="email" type="email" value={f.form.email} onChange={(e) => f.set('email', e.target.value)} />
        </FormGroup>
      </div>
      <div className="col-12 col-md-6">
        <FormGroup label="Telefon" htmlFor="phone" error={f.errors.phone}>
          <Input id="phone" type="tel" value={f.form.phone} onChange={(e) => f.set('phone', e.target.value)} />
        </FormGroup>
      </div>
    </FormPage>
  );
}
