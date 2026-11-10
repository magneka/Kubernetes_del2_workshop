import { useState, type FormEvent } from 'react';
import { Alert } from '../../components/Alert';
import { Button, ButtonLink } from '../../components/Button';
import { Choice, FormGroup, Input, Range, Select, Switch, Textarea } from '../../components/Form';
import { PageHero, Section } from '../../components/Section';
import { PageOverlay } from '../../components/Spinner';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const USERNAME_RE = /^[a-z0-9]+$/i;

export default function FormsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('ada!');
  const [overlay, setOverlay] = useState(false);

  const nameError = name.trim() ? null : 'Skriv inn fullt navn.';
  const e = email.trim();
  const emailError = e && EMAIL_RE.test(e) ? null : 'Skriv inn en gyldig e-postadresse.';
  const u = username.trim();
  const usernameError = !u || USERNAME_RE.test(u) ? null : 'Brukernavnet inneholder ugyldige tegn.';
  const valid = !nameError && !emailError && !usernameError;

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!valid) return;
    setOverlay(true);
    setTimeout(() => setOverlay(false), 1400);
  };

  return (
    <>
      <PageHero
        eyebrow="Designsystem"
        title="Skjema"
        lead="Skjemakontroller med validering, hjelpetekst og feilmeldinger."
        actions={
          <ButtonLink to="/ds" variant="outline" icon="fa-solid fa-arrow-left">
            Alle komponenter
          </ButtonLink>
        }
      />
      <Section
        id="forms"
        title="Skjemakontroller"
        lead="Etiketter over, hjelpetekst under. Ugyldige kontroller får rød kantlinje og feilmelding; deaktiverte kontroller blir helt grå. Obligatoriske felt er merket med en stjerne."
      >
        <form id="demoForm" noValidate onSubmit={onSubmit}>
          {!valid && (
            <Alert variant="danger" style={{ marginBottom: 'var(--sp-5)' }}>
              <b>Det er feil i skjemaet.</b> Se over de markerte feltene før du sender inn.
            </Alert>
          )}

          <div className="panel">
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <FormGroup
                  label="Fullt navn"
                  htmlFor="f-name"
                  required
                  help="Slik det skal stå på navneskiltet ditt."
                  error={nameError}
                >
                  <Input id="f-name" name="name" placeholder="Ada Lovelace" value={name} onChange={(ev) => setName(ev.target.value)} />
                </FormGroup>
              </div>
              <div className="col-12 col-md-6">
                <FormGroup
                  label="E-post"
                  htmlFor="f-email"
                  required
                  help="Vi bruker den bare til å kontakte deg."
                  error={emailError}
                >
                  <Input id="f-email" type="email" name="email" placeholder="deg@uc.no" value={email} onChange={(ev) => setEmail(ev.target.value)} />
                </FormGroup>
              </div>
              <div className="col-12 col-md-6">
                <FormGroup label="Rolle" htmlFor="f-role" help="Valgfritt — hjelper oss å tilpasse innhold.">
                  <Select id="f-role" name="role" defaultValue="">
                    <option value="">Velg…</option>
                    <option>Frontend-utvikler</option>
                    <option>Backend-utvikler</option>
                    <option>Designer</option>
                  </Select>
                </FormGroup>
              </div>
              <div className="col-12 col-md-6">
                <FormGroup
                  label="Brukernavn"
                  htmlFor="f-username"
                  required
                  help="Kun bokstaver og tall."
                  error={usernameError}
                >
                  <Input id="f-username" name="username" value={username} onChange={(ev) => setUsername(ev.target.value)} />
                </FormGroup>
              </div>
              <div className="col-12">
                <FormGroup label="Melding" htmlFor="f-msg" help="Markdown støttes.">
                  <Textarea id="f-msg" name="msg" placeholder="Fortell oss litt om prosjektet ditt…" />
                </FormGroup>
              </div>
              <div className="col-12 col-md-4">
                <FormGroup label="Kontonivå" htmlFor="f-tier" disabled help="Administreres av administratoren din.">
                  <Input id="f-tier" defaultValue="Enterprise (låst)" disabled />
                </FormGroup>
              </div>
              <div className="col-12 col-md-4">
                <FormGroup label="Erfaring" htmlFor="f-exp" help="År med erfaring.">
                  <Range id="f-exp" min={0} max={10} defaultValue={6} />
                </FormGroup>
              </div>
              <div className="col-12 col-md-4">
                <div className="form-group">
                  <label className="form-label">Varsler</label>
                  <Switch style={{ marginTop: 8 }} label="E-postoppdateringer" defaultChecked />
                  <span className="form-help" style={{ marginTop: 10 }}>
                    Slå av eller på for å melde deg inn eller ut.
                  </span>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label className="form-label">Interesser</label>
                  <Choice label="Sky og Azure" defaultChecked />
                  <Choice label="Mobil" />
                  <Choice label="KI (kommer snart)" disabled />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label className="form-label">Foretrukket kontakt</label>
                  <Choice radio name="contact" label="E-post" defaultChecked />
                  <Choice radio name="contact" label="Telefon" />
                  <Choice radio name="contact" label="Faks (utilgjengelig)" disabled />
                </div>
              </div>
            </div>

            <hr />
            <div className="util-row">
              <Button type="submit" icon="fa-solid fa-paper-plane" disabled={!valid}>
                {' '}
                Send inn
              </Button>
              <Button variant="outline" onClick={() => setUsername((v) => (v === 'ada' ? 'ada!' : 'ada'))}>
                Bytt skjemagyldighet
              </Button>
              <span className="form-help" style={{ margin: 0 }}>
                {valid ? 'Skjemaet er gyldig — innsending er aktivert.' : 'Skjemaet har feil — innsending er deaktivert.'}
              </span>
            </div>
          </div>
        </form>
      </Section>
      <PageOverlay open={overlay} />
    </>
  );
}
