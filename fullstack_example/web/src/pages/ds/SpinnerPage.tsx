import { useState } from 'react';
import { Button, ButtonLink } from '../../components/Button';
import { PageHero, Section } from '../../components/Section';
import { PageOverlay, Spinner } from '../../components/Spinner';

export default function SpinnerPage() {
  const [overlay, setOverlay] = useState(false);

  const show = () => {
    setOverlay(true);
    setTimeout(() => setOverlay(false), 2200);
  };

  return (
    <>
      <PageHero
        eyebrow="Designsystem"
        title="Spinner"
        lead="Spinner og fullsides lasteoverlegg."
        actions={
          <ButtonLink to="/ds" variant="outline" icon="fa-solid fa-arrow-left">
            Alle komponenter
          </ButtonLink>
        }
      />
      <Section id="spinner" title="Spinner og overlegg" lead="Et fullsides overlegg med spinner låser siden mens den laster.">
        <div className="util-row">
          <Button icon="fa-solid fa-spinner" onClick={show}>Vis lasteoverlegg</Button>
          <Spinner />
          <Spinner small />
        </div>
      </Section>
      <PageOverlay open={overlay} />
    </>
  );
}
