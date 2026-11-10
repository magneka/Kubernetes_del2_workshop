import { useState } from 'react';
import { Alert, type AlertVariant } from '../../components/Alert';
import { ButtonLink } from '../../components/Button';
import { Jumbotron } from '../../components/Jumbotron';
import { Panel } from '../../components/Panel';
import { DemoLabel, PageHero, Section } from '../../components/Section';

interface AlertDef {
  id: string;
  variant: AlertVariant;
  title: string;
  text: string;
}

const alertDefs: AlertDef[] = [
  { id: 'success', variant: 'success', title: 'Utrullet.', text: 'Endringene dine er live i produksjon.' },
  { id: 'info', variant: 'info', title: 'Obs.', text: 'En ny komponentversjon er tilgjengelig.' },
  { id: 'warning', variant: 'warning', title: 'Vær forsiktig.', text: 'Denne handlingen påvirker alle miljøer.' },
  { id: 'danger', variant: 'danger', title: 'Feilet.', text: 'Bygget kunne ikke fullføres.' },
];

export default function PanelsPage() {
  const [hidden, setHidden] = useState<string[]>([]);

  return (
    <>
      <PageHero
        eyebrow="Designsystem"
        title="Paneler"
        lead="Paneler, varsler og jumbotroner uten skygger."
        actions={
          <ButtonLink to="/ds" variant="outline" icon="fa-solid fa-arrow-left">
            Alle komponenter
          </ButtonLink>
        }
      />
      <Section id="panels" title="Paneler, varsler og jumbotroner">
        <DemoLabel first>Paneler — farger og kantlinjer (ingen skygger)</DemoLabel>
        <div className="row g-4">
          <div className="col-12 col-md-6 col-lg-3">
            <Panel icon="fa-solid fa-cube" header=" Standard">
              <p style={{ margin: 0 }}>Nøytral flate med en myk kantlinje. Bruker gridet inni for layout.</p>
            </Panel>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <Panel variant="primary" icon="fa-solid fa-leaf" header=" Primær">
              <p style={{ margin: 0 }}>Blek mosegrønn bakgrunn med lysegrønn kantlinje.</p>
            </Panel>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <Panel variant="accent" icon="fa-solid fa-star" header=" Aksent">
              <p style={{ margin: 0 }}>Varmt gult fremhevingspanel fra nettstedets aksent.</p>
            </Panel>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <Panel variant="dark" icon="fa-solid fa-moon" header=" Mørk">
              <p style={{ margin: 0 }}>Dyp olivenfarget panel for kontrastblokker.</p>
            </Panel>
          </div>
        </div>

        <DemoLabel>Panel med nøstet gridlayout</DemoLabel>
        <Panel left icon="fa-solid fa-table-columns" header=" Innholdspanel">
          <div className="row g-3">
            <div className="col-12 col-md-8">
              <p style={{ margin: 0 }}>
                Paneler støtter et responsivt grid internt. Denne kroppen spenner over 8 kolonner på nettbrett og opp,
                med sidepanelet ved siden av.
              </p>
            </div>
            <div className="col-12 col-md-4">
              <div className="panel panel-outline" style={{ padding: 'var(--sp-3)' }}>
                <b>Sidepanel</b>
                <br />
                <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-2)' }}>col-md-4</span>
              </div>
            </div>
          </div>
        </Panel>

        <DemoLabel>Varsler</DemoLabel>
        <div className="stack">
          {alertDefs
            .filter((a) => !hidden.includes(a.id))
            .map((a) => (
              <Alert
                key={a.id}
                variant={a.variant}
                title={a.title}
                onClose={() => setHidden((h) => [...h, a.id])}
              >
                {a.text}
              </Alert>
            ))}
        </div>

        <DemoLabel>Jumbotroner</DemoLabel>
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <Jumbotron small title="Lys jumbo" lead="Kompakt heltepanel i merkevaregradienten." />
          </div>
          <div className="col-12 col-md-6">
            <Jumbotron small variant="accent" title="Aksent-jumbo" lead="Varm gul variant for kampanjer." />
          </div>
        </div>
        <Jumbotron
          variant="dark"
          full
          style={{ marginTop: 'var(--sp-4)' }}
          eyebrow="Full bredde"
          eyebrowStyle={{ color: 'var(--accent)' }}
          title="Vi tør å kalle oss eksperter."
        >
          <p style={{ maxWidth: '60ch' }}>
            En jumbotron i nesten full bredde som strekker seg kant til kant — ideell for landingsseksjoner og
            handlingsoppfordringer.
          </p>
          <ButtonLink to="/ds/buttons" variant="accent" size="lg">
            Kom i gang
          </ButtonLink>
        </Jumbotron>
      </Section>
    </>
  );
}
