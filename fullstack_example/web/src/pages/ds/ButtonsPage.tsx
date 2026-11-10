import { useState } from 'react';
import { Button, ButtonLink } from '../../components/Button';
import { DemoLabel, PageHero, Section } from '../../components/Section';

export default function ButtonsPage() {
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState('Lagre endringer');

  const save = () => {
    setLoading(true);
    setLabel('Lagrer…');
    setTimeout(() => {
      setLoading(false);
      setLabel('Lagret!');
      setTimeout(() => setLabel('Lagre endringer'), 1200);
    }, 1400);
  };

  return (
    <>
      <PageHero
        eyebrow="Designsystem"
        title="Knapper"
        lead="Stiler, størrelser, ikoner og tilstander."
        actions={
          <ButtonLink to="/ds" variant="outline" icon="fa-solid fa-arrow-left">
            Alle komponenter
          </ButtonLink>
        }
      />
      <Section id="buttons" title="Knapper">
        <DemoLabel first>Stiler</DemoLabel>
        <div className="util-row">
          <Button variant="primary" tip="Primær handling">Primær</Button>
          <Button variant="secondary" tip="Sekundær handling">Sekundær</Button>
          <Button variant="accent" tip="Fremhevet CTA">Aksent</Button>
          <Button variant="soft" tip="Myk grønn">Myk</Button>
          <Button variant="outline" tip="Omriss">Omriss</Button>
          <Button variant="ghost" tip="Minimal">Ghost</Button>
          <Button variant="danger" tip="Destruktiv">Fare</Button>
        </div>

        <DemoLabel>Størrelser</DemoLabel>
        <div className="util-row">
          <Button size="sm">Liten</Button>
          <Button>Standard</Button>
          <Button size="lg">Stor</Button>
        </div>

        <DemoLabel>Ikoner, tekst og tilstander</DemoLabel>
        <div className="util-row">
          <Button icon="fa-solid fa-download">Ikon + tekst</Button>
          <Button variant="outline" icon="fa-solid fa-heart">Lik</Button>
          <Button iconOnly icon="fa-solid fa-gear" tip="Kun ikon" aria-label="Innstillinger" />
          <Button variant="soft" iconOnly icon="fa-solid fa-plus" aria-label="Legg til" />
          <Button icon="fa-solid fa-ban" disabled>Deaktivert</Button>
          <Button loading={loading} onClick={save}>{label}</Button>
        </div>
        <p className="form-help" style={{ marginTop: 'var(--sp-3)' }}>
          Hold musepekeren over en knapp ovenfor for å se verktøytipset.
        </p>
      </Section>
    </>
  );
}
