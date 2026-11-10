import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ResourceState } from '../store/resourceFactory';
import { Alert } from '../components/Alert';
import { Button, ButtonLink } from '../components/Button';
import { ConfirmModal } from '../components/Modal';
import { Panel } from '../components/Panel';
import { PageHero, Section } from '../components/Section';
import { PageOverlay, Spinner } from '../components/Spinner';
import { errorMessage } from '../utils';

export type Errors<F> = Partial<Record<keyof F, string>>;

/* ---------------- Form pages ---------------- */

interface EntityFormOptions<T, F> {
  state: ResourceState<T>;
  empty: F;
  toForm: (item: T) => F;
  validate: (form: F, isEdit: boolean) => Errors<F>;
}

export function useEntityForm<T extends { id: number }, F>({ state, empty, toForm, validate }: EntityFormOptions<T, F>) {
  const { id } = useParams();
  const editId = id !== undefined ? Number(id) : null;
  const isEdit = editId !== null;
  const item = isEdit ? state.items.find((x) => x.id === editId) : undefined;

  const [form, setForm] = useState<F>(empty);
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loadedFor = useRef<number | null>(null);

  useEffect(() => {
    if (item && loadedFor.current !== item.id) {
      loadedFor.current = item.id;
      setForm(toForm(item));
    }
  }, [item, toForm]);

  useEffect(() => {
    if (!isEdit) {
      loadedFor.current = null;
      setForm(empty);
    }
    setSubmitted(false);
    setSuccess(null);
    setError(null);
  }, [isEdit, editId, empty]);

  const allErrors = validate(form, isEdit);
  const hasErrors = Object.keys(allErrors).length > 0;

  const set = <K extends keyof F>(key: K, value: F[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent, save: (form: F) => Promise<unknown>, successText: string) => {
    e.preventDefault();
    setSubmitted(true);
    setSuccess(null);
    setError(null);
    if (hasErrors) return;
    setSaving(true);
    try {
      await save(form);
      setSuccess(successText);
      if (!isEdit) {
        setForm(empty);
        setSubmitted(false);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return {
    isEdit,
    editId,
    item,
    form,
    set,
    errors: (submitted ? allErrors : {}) as Errors<F>,
    showErrorSummary: submitted && hasErrors,
    success,
    clearSuccess: () => setSuccess(null),
    error,
    clearError: () => setError(null),
    saving,
    loading: isEdit && !item && (state.status === 'idle' || state.status === 'loading'),
    notFound: isEdit && !item && state.status === 'succeeded',
    loadError: isEdit && !item && state.status === 'failed' ? state.error : null,
    submit,
  };
}

interface FormPageProps {
  title: string;
  icon: string;
  listTo: string;
  listLabel: string;
  entityLabel: string;
  isEdit: boolean;
  loading: boolean;
  notFound: boolean;
  loadError: string | null;
  success: string | null;
  onClearSuccess: () => void;
  error: string | null;
  onClearError: () => void;
  showErrorSummary: boolean;
  saving: boolean;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}

export function FormPage(p: FormPageProps) {
  return (
    <>
      <PageHero
        eyebrow={p.isEdit ? 'Rediger' : 'Registrer'}
        title={p.title}
        lead={`Fyll ut skjemaet og lagre. Felt merket med * er påkrevd.`}
        actions={
          <ButtonLink to={p.listTo} variant="outline" icon="fa-solid fa-table-list">
            {p.listLabel}
          </ButtonLink>
        }
      />

      <Section>
      {p.loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-7)' }}>
          <Spinner />
        </div>
      ) : p.loadError ? (
        <Alert variant="danger" title="Kunne ikke laste data.">
          {p.loadError}
        </Alert>
      ) : p.notFound ? (
        <Alert variant="warning" title="Fant ikke posten.">
          {p.entityLabel} finnes ikke eller er slettet. <Link to={p.listTo}>Gå til oversikten</Link>.
        </Alert>
      ) : (
        <form noValidate onSubmit={p.onSubmit}>
          <div className="stack" style={{ marginBottom: 'var(--sp-5)' }}>
            {p.success && (
              <Alert variant="success" title="Lagret." onClose={p.onClearSuccess}>
                {p.success} <Link to={p.listTo}>Vis oversikt</Link>.
              </Alert>
            )}
            {p.error && (
              <Alert variant="danger" title="Lagring feilet." onClose={p.onClearError}>
                {p.error}
              </Alert>
            )}
            {p.showErrorSummary && (
              <Alert variant="danger" title="Skjemaet inneholder feil.">
                Rett opp de markerte feltene før du lagrer.
              </Alert>
            )}
          </div>
          <Panel header={p.isEdit ? 'Endre opplysninger' : 'Opplysninger'} icon={p.icon}>
            <div className="row g-4">{p.children}</div>
            <hr />
            <div className="util-row">
              <Button type="submit" icon={p.isEdit ? 'fa-solid fa-floppy-disk' : 'fa-solid fa-plus'} loading={p.saving}>
                {p.isEdit ? 'Lagre endringer' : `Opprett ${p.entityLabel.toLowerCase()}`}
              </Button>
              <ButtonLink to={p.listTo} variant="ghost">
                Avbryt
              </ButtonLink>
              <span className="form-help" style={{ margin: 0 }}>
                Felt merket med <span className="req">*</span> er påkrevd.
              </span>
            </div>
          </Panel>
        </form>
      )}
      </Section>
      <PageOverlay open={p.saving} text="Lagrer…" />
    </>
  );
}

/* ---------------- List pages ---------------- */

export function useDeleteFlow<T extends { id: number }>(remove: (id: number) => Promise<unknown>) {
  const [target, setTarget] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ variant: 'success' | 'danger'; text: string } | null>(null);

  const confirm = async (describe: (item: T) => string) => {
    if (!target) return;
    setDeleting(true);
    try {
      await remove(target.id);
      setMessage({ variant: 'success', text: `${describe(target)} ble slettet.` });
    } catch (e) {
      setMessage({ variant: 'danger', text: `Kunne ikke slette: ${errorMessage(e)}` });
    } finally {
      setDeleting(false);
      setTarget(null);
    }
  };

  return { target, ask: setTarget, cancel: () => setTarget(null), deleting, confirm, message, clearMessage: () => setMessage(null) };
}

interface ListPageProps<T extends { id: number }> {
  title: string;
  icon: string;
  newTo: string;
  newLabel: string;
  state: ResourceState<T>;
  onRetry: () => void;
  del: ReturnType<typeof useDeleteFlow<T>>;
  describe: (item: T) => string;
  children: ReactNode;
}

export function ListPage<T extends { id: number }>(p: ListPageProps<T>) {
  const { del } = p;
  return (
    <>
      <PageHero
        eyebrow="Oversikt"
        title={p.title}
        lead="Filtrer, sorter og bla i listen. Rediger eller slett poster fra handlingskolonnen."
        actions={
          <ButtonLink to={p.newTo} icon="fa-solid fa-plus">
            {p.newLabel}
          </ButtonLink>
        }
      />

      <Section>
      <div className="stack" style={{ marginBottom: 'var(--sp-4)' }}>
        {del.message && (
          <Alert variant={del.message.variant} onClose={del.clearMessage}>
            {del.message.text}
          </Alert>
        )}
        {p.state.status === 'failed' && (
          <Alert variant="danger" title="Kunne ikke hente data.">
            {p.state.error}{' '}
            <Button size="sm" variant="outline" icon="fa-solid fa-rotate" onClick={p.onRetry}>
              Prøv igjen
            </Button>
          </Alert>
        )}
      </div>

      {p.state.status === 'loading' && p.state.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-7)' }}>
          <Spinner />
        </div>
      ) : (
        p.children
      )}
      </Section>

      <ConfirmModal
        open={del.target !== null}
        title="Bekreft sletting"
        message={
          <p style={{ margin: 0 }}>
            Er du sikker på at du vil slette <b>{del.target ? p.describe(del.target) : ''}</b>? Handlingen kan ikke angres.
          </p>
        }
        confirmLabel="Ja, slett"
        cancelLabel="Nei, avbryt"
        loading={del.deleting}
        onConfirm={() => void del.confirm(p.describe)}
        onCancel={del.cancel}
      />
    </>
  );
}

export function RowActions({ editTo, onDelete }: { editTo: string; onDelete: () => void }) {
  return (
    <>
      <ButtonLink to={editTo} variant="soft" size="sm" iconOnly icon="fa-solid fa-pen" aria-label="Rediger" title="Rediger" />
      <Button variant="danger" size="sm" iconOnly icon="fa-solid fa-trash" aria-label="Slett" title="Slett" onClick={onDelete} />
    </>
  );
}
