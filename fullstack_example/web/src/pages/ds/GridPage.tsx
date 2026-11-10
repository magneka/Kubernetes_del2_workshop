import { ButtonLink } from '../../components/Button';
import { DemoLabel, PageHero, Section } from '../../components/Section';

const hero = (
  <PageHero
    eyebrow="Designsystem"
    title="Grid"
    lead="Et 12-kolonners, fleksbasert og mobil-først grid."
    actions={
      <ButtonLink to="/ds" variant="outline" icon="fa-solid fa-arrow-left">
        Alle komponenter
      </ButtonLink>
    }
  />
);

export default function GridPage() {
  return (
    <>
      {hero}
      <Section
        id="grid"
        containerClassName="grid-demo"
        title="Gridsystem"
        lead={
          <>
            Et 12-kolonners, fleksbasert, mobil-først grid i Bootstrap-stil: <code>.row</code>-wrappere,{' '}
            <code>.col-*</code>-spenn, breakpoint-infikser, <code>.offset-*</code>, auto <code>.col</code> og{' '}
            <code>.g-*</code>-mellomrom.
          </>
        }
      >
        <DemoLabel first>Tolv kolonner</DemoLabel>
        <div className="row g-2">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="col-1">
              <div>1</div>
            </div>
          ))}
        </div>

        <DemoLabel>
          Responsive spenn — <code>.col-12 .col-md-6 .col-lg-4</code>
        </DemoLabel>
        <div className="row g-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="col-12 col-md-6 col-lg-4">
              <div>col-12 · md-6 · lg-4</div>
            </div>
          ))}
        </div>

        <DemoLabel>Offset og auto-kolonner</DemoLabel>
        <div className="row g-3">
          <div className="col-md-4">
            <div>col-md-4</div>
          </div>
          <div className="col-md-4 offset-md-4">
            <div>col-md-4 · offset-md-4</div>
          </div>
        </div>
        <div className="row g-3" style={{ marginTop: 'var(--sp-3)' }}>
          <div className="col">
            <div>.col (auto)</div>
          </div>
          <div className="col-6">
            <div>.col-6</div>
          </div>
          <div className="col">
            <div>.col (auto)</div>
          </div>
        </div>
      </Section>
    </>
  );
}
