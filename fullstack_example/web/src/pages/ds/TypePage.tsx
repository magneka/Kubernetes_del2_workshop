import { Link } from 'react-router-dom';
import { ButtonLink } from '../../components/Button';
import { DemoLabel, PageHero, Section } from '../../components/Section';

export default function TypePage() {
  return (
    <>
      <PageHero
        eyebrow="Designsystem"
        title="Typografi"
        lead="Overskrifter, løpende tekst, skriftvekter og kode."
        actions={
          <ButtonLink to="/ds" variant="outline" icon="fa-solid fa-arrow-left">
            Alle komponenter
          </ButtonLink>
        }
      />
      <Section
        id="type"
        title="Typografi"
        lead="Montserrat er uc.nos faktiske brukergrensesnitt-skrift (lest fra beregnede stiler). JetBrains Mono er lagt til for kode."
      >
        <div className="row g-5">
          <div className="col-12 col-lg-7">
            <DemoLabel first>Overskrifter og løpende tekst</DemoLabel>
            <div className="type-row">
              <span className="tag">h1 / 600</span>
              <h1 style={{ margin: 0 }}>Overskrift én</h1>
            </div>
            <div className="type-row">
              <span className="tag">h2 / 500</span>
              <h2 style={{ margin: 0 }}>Overskrift to</h2>
            </div>
            <div className="type-row">
              <span className="tag">h3 / 600</span>
              <h3 style={{ margin: 0 }}>Overskrift tre</h3>
            </div>
            <div className="type-row">
              <span className="tag">h4 / 600</span>
              <h4 style={{ margin: 0 }}>Overskrift fire</h4>
            </div>
            <p style={{ marginTop: 'var(--sp-4)' }}>
              Brødteksten bruker Montserrat i vekt 300, i samsvar med nettstedet. Ulriken er et ansatteid IT-konsulentselskap
              i Bergen, og denne løpende teksten viser hvor behagelig grunnstørrelsen og linjehøyden føles over lengre
              avsnitt med innhold. <Link to="/ds/type">Innebygde lenker</Link> får den olivenfargede merkevarefargen.
            </p>
          </div>
          <div className="col-12 col-lg-5">
            <p className="demo-label">Skriftvekter og stiler</p>
            <div className="weights">
              <span className="w300">Lys 300</span>
              <span className="w400">Vanlig 400</span>
              <span className="w500">Medium 500</span>
              <span className="w600">Halvfet 600</span>
              <span className="w700">Fet 700</span>
            </div>
            <div className="weights" style={{ marginTop: 'var(--sp-3)' }}>
              <span className="w400" style={{ fontStyle: 'italic' }}>
                Kursiv
              </span>
              <span className="w600" style={{ fontStyle: 'italic' }}>
                Fet kursiv
              </span>
              <span className="w400" style={{ textDecoration: 'underline' }}>
                Understreket
              </span>
            </div>

            <p className="demo-label" style={{ marginTop: 'var(--sp-5)' }}>
              Kode — JetBrains Mono
            </p>
            <pre className="code-block">
              <span className="com">{'// Ulriken designtokens'}</span>
              {'\n'}
              <span className="kw">const</span>
              {' theme = {\n  primary: '}
              <span className="str">{"'#748849'"}</span>
              {',\n  accent:  '}
              <span className="str">{"'#FFF1A9'"}</span>
              {',\n  canvas:  '}
              <span className="str">{"'#FFFFF2'"}</span>
              {'\n};'}
            </pre>
          </div>
        </div>
      </Section>
    </>
  );
}
