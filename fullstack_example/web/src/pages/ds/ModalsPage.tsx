import { useState } from 'react';
import { Button, ButtonLink } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { PageHero, Section } from '../../components/Section';
import { Input, Select } from '../../components/Form';

type ModalId = 'ok' | 'confirm' | 'alert' | 'form';

const iconStyle = { fontSize: 22 } as const;

export default function ModalsPage() {
  const [open, setOpen] = useState<ModalId | null>(null);
  const close = () => setOpen(null);

  return (
    <>
      <PageHero
        eyebrow="Designsystem"
        title="Modaler"
        lead="Modale paneler for bekreftelser, varsler og skjema."
        actions={
          <ButtonLink to="/ds" variant="outline" icon="fa-solid fa-arrow-left">
            Alle komponenter
          </ButtonLink>
        }
      />
      <Section id="modals" title="Modale paneler">
        <div className="util-row">
          <Button icon="fa-regular fa-square-check" onClick={() => setOpen('ok')}>OK / Avbryt</Button>
          <Button variant="outline" icon="fa-solid fa-question" onClick={() => setOpen('confirm')}>Bekreft</Button>
          <Button variant="danger" icon="fa-solid fa-triangle-exclamation" onClick={() => setOpen('alert')}>Varsel</Button>
          <Button variant="soft" icon="fa-solid fa-pen" onClick={() => setOpen('form')}>Skjemamodal</Button>
        </div>
      </Section>

      <Modal
        open={open === 'ok'}
        title="Lagre endringer?"
        onClose={close}
        footer={
          <>
            <Button variant="ghost" onClick={close}>Avbryt</Button>
            <Button onClick={close}>OK</Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>Vil du lagre endringene dine før du forlater denne siden?</p>
      </Modal>

      <Modal
        open={open === 'confirm'}
        title="Bekreft handling"
        icon={<i className="fa-solid fa-circle-question" style={{ ...iconStyle, color: 'var(--primary-dark)' }} />}
        onClose={close}
        footer={
          <>
            <Button variant="outline" onClick={close}>Nei, gå tilbake</Button>
            <Button onClick={close}>Ja, publiser</Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>Er du sikker på at du vil publisere denne komponenten til det delte biblioteket?</p>
      </Modal>

      <Modal
        open={open === 'alert'}
        title="Noe gikk galt"
        icon={<i className="fa-solid fa-triangle-exclamation" style={{ ...iconStyle, color: 'var(--danger)' }} />}
        onClose={close}
        footer={<Button variant="danger" onClick={close}>Lukk</Button>}
      >
        <p style={{ margin: 0 }}>Utrullingen feilet på grunn av en nettverksfeil. Prøv igjen.</p>
      </Modal>

      <Modal
        open={open === 'form'}
        title="Inviter en kollega"
        size="lg"
        onClose={close}
        footer={
          <>
            <Button variant="ghost" onClick={close}>Avbryt</Button>
            <Button icon="fa-solid fa-paper-plane" onClick={close}>Send invitasjon</Button>
          </>
        }
      >
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Navn <span className="req">*</span></label>
              <Input placeholder="Fullt navn" />
              <span className="form-help">Visningsnavnet deres.</span>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">E-post <span className="req">*</span></label>
              <Input type="email" placeholder="navn@uc.no" />
              <span className="form-help">Invitasjonen sendes hit.</span>
            </div>
          </div>
          <div className="col-12">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Rolle</label>
              <Select>
                <option>Utvikler</option>
                <option>Designer</option>
                <option>Admin</option>
              </Select>
              <span className="form-help">Bestemmer tillatelsene deres.</span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
