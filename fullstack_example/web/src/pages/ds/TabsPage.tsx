import { ButtonLink } from '../../components/Button';
import { DemoLabel, PageHero, Section } from '../../components/Section';
import { Tabs } from '../../components/Tabs';

const p0 = { margin: 0 };
const h4 = { marginTop: 0 };

export default function TabsPage() {
  return (
    <>
      <PageHero
        eyebrow="Designsystem"
        title="Faner"
        lead="Understreket, pille- og innrammede faner."
        actions={
          <ButtonLink to="/ds" variant="outline" icon="fa-solid fa-arrow-left">
            Alle komponenter
          </ButtonLink>
        }
      />
      <Section id="tabs" title="Fanekontroller">
        <div className="row g-5">
          <div className="col-12 col-lg-6">
            <DemoLabel first>Understreket faner (med en deaktivert fane)</DemoLabel>
            <Tabs
              tabs={[
                {
                  id: 'u1',
                  label: 'Oversikt',
                  content: <p style={p0}>Oversiktspanelet. Den tredje fanen er deaktivert og kan ikke velges.</p>,
                },
                {
                  id: 'u2',
                  label: 'Detaljer',
                  content: <p style={p0}>Detaljert innhold som vises når den andre fanen er aktiv.</p>,
                },
                { id: 'u3', label: 'Arkivert', disabled: true, content: null },
              ]}
            />

            <DemoLabel>Pillefaner (farget)</DemoLabel>
            <Tabs
              variant="pills"
              tabs={[
                { id: 'p1', label: 'Dag', content: <p style={p0}>Dagstall.</p> },
                { id: 'p2', label: 'Uke', content: <p style={p0}>Ukestall.</p> },
                { id: 'p3', label: 'Måned', content: <p style={p0}>Månedstall.</p> },
              ]}
            />
          </div>

          <div className="col-12 col-lg-6">
            <DemoLabel first>Innrammede faner med kantlinje rundt innholdet</DemoLabel>
            <Tabs
              variant="bordered"
              tabs={[
                {
                  id: 'b1',
                  label: 'Profil',
                  content: (
                    <>
                      <h4 style={h4}>Profil</h4>
                      <p style={p0}>Innrammet fanestrip koblet til et omrammet innholdsområde.</p>
                    </>
                  ),
                },
                {
                  id: 'b2',
                  label: 'Innstillinger',
                  content: (
                    <>
                      <h4 style={h4}>Innstillinger</h4>
                      <p style={p0}>Innstillingsinnhold ligger i samme innrammede boks.</p>
                    </>
                  ),
                },
                {
                  id: 'b3',
                  label: 'Fakturering',
                  content: (
                    <>
                      <h4 style={h4}>Fakturering</h4>
                      <p style={p0}>Faktureringsinnhold i den innrammede beholderen.</p>
                    </>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </Section>
    </>
  );
}
