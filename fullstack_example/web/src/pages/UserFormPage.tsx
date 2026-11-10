import { useCallback } from 'react';
import { FormGroup, Input, Select } from '../components/Form';
import { users } from '../store';
import { useAppDispatch, useUsers } from '../store/hooks';
import type { Role, User, UserInput } from '../types';
import { roleLabel } from '../types';
import { isEmail } from '../utils';
import { FormPage, useEntityForm, type Errors } from './shared';

interface UserForm {
  username: string;
  email: string;
  role: Role;
  password: string;
}

const empty: UserForm = { username: '', email: '', role: 'user', password: '' };
const toForm = (u: User): UserForm => ({ username: u.username, email: u.email, role: u.role, password: '' });

function validate(f: UserForm, isEdit: boolean): Errors<UserForm> {
  const e: Errors<UserForm> = {};
  if (!f.username.trim()) e.username = 'Brukernavn er påkrevd.';
  else if (!/^[A-Za-z0-9._-]{3,50}$/.test(f.username.trim()))
    e.username = 'Brukernavn må være 3–50 tegn: bokstaver, tall, punktum, bindestrek eller understrek.';
  if (!f.email.trim()) e.email = 'E-post er påkrevd.';
  else if (!isEmail(f.email)) e.email = 'Skriv inn en gyldig e-postadresse.';
  if (!isEdit && !f.password) e.password = 'Passord er påkrevd.';
  else if (f.password && f.password.length < 8) e.password = 'Passordet må ha minst 8 tegn.';
  return e;
}

export default function UserFormPage() {
  const dispatch = useAppDispatch();
  const state = useUsers();
  const f = useEntityForm({ state, empty, toForm, validate });

  const save = useCallback(
    async (form: UserForm) => {
      const data: UserInput = { username: form.username.trim(), email: form.email.trim(), role: form.role };
      if (form.password) data.password = form.password;
      if (f.editId !== null) await dispatch(users.update({ id: f.editId, data })).unwrap();
      else await dispatch(users.create(data)).unwrap();
    },
    [dispatch, f.editId],
  );

  return (
    <FormPage
      title={f.isEdit ? 'Rediger bruker' : 'Ny bruker'}
      icon={f.isEdit ? 'fa-solid fa-user-pen' : 'fa-solid fa-user-plus'}
      listTo="/users"
      listLabel="Alle brukere"
      entityLabel="Bruker"
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
      onSubmit={(e) => void f.submit(e, save, f.isEdit ? 'Brukeren er oppdatert.' : 'Brukeren er opprettet.')}
    >
      <div className="col-12 col-md-6">
        <FormGroup label="Brukernavn" htmlFor="username" required help="Brukes ved innlogging." error={f.errors.username}>
          <Input
            id="username"
            autoComplete="off"
            placeholder="ola.nordmann"
            value={f.form.username}
            onChange={(e) => f.set('username', e.target.value)}
          />
        </FormGroup>
      </div>
      <div className="col-12 col-md-6">
        <FormGroup label="E-post" htmlFor="email" required help="Vi bruker denne kun til å kontakte brukeren." error={f.errors.email}>
          <Input
            id="email"
            type="email"
            placeholder="ola@uc.no"
            value={f.form.email}
            onChange={(e) => f.set('email', e.target.value)}
          />
        </FormGroup>
      </div>
      <div className="col-12 col-md-6">
        <FormGroup label="Rolle" htmlFor="role" required help="Styrer tilgangsnivå." error={f.errors.role}>
          <Select id="role" value={f.form.role} onChange={(e) => f.set('role', e.target.value as Role)}>
            {(Object.keys(roleLabel) as Role[]).map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </Select>
        </FormGroup>
      </div>
      <div className="col-12 col-md-6">
        <FormGroup
          label="Passord"
          htmlFor="password"
          required={!f.isEdit}
          help={f.isEdit ? 'La feltet stå tomt for å beholde nåværende passord.' : 'Minst 8 tegn.'}
          error={f.errors.password}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={f.form.password}
            onChange={(e) => f.set('password', e.target.value)}
          />
        </FormGroup>
      </div>
    </FormPage>
  );
}
