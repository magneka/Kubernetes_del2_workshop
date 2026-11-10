import { Badge } from '../../components/Badge';
import { ButtonLink } from '../../components/Button';
import { BarChart, Donut, Legend } from '../../components/Charts';
import { Panel } from '../../components/Panel';
import { PageHero, Section } from '../../components/Section';
import { StatCard } from '../../components/StatCard';

const events: { event: string; user: string; when: string; variant: 'success' | 'warning' | 'danger'; status: string }[] = [
  { event: 'Merget PR #482', user: 'Ada', when: '2 min siden', variant: 'success', status: 'Vellykket' },
  { event: 'Utrulling til staging', user: 'Ola', when: '18 min siden', variant: 'success', status: 'Vellykket' },
  { event: 'Bygg #1290', user: 'CI', when: '41 min siden', variant: 'warning', status: 'Treg' },
  { event: 'Utrulling til prod', user: 'Kari', when: '1 t siden', variant: 'danger', status: 'Rullet tilbake' },
];

export default function DashboardPage() {
  return (
    <>
      <PageHero
        eyebrow="Designsystem"
        title="Dashboard"
        lead="Nøkkeltall, diagrammer og siste aktivitet."
        actions={
          <ButtonLink to="/ds" variant="outline" icon="fa-solid fa-arrow-left">
            Alle komponenter
          </ButtonLink>
        }
      />
      <Section id="dashboard" title="Dashboard">
        <div className="row g-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard icon="fa-solid fa-users" value="1 284" label="Aktive brukere" trend={{ direction: 'up', text: '12.4%' }} />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard icon="fa-solid fa-code-branch" value="37" label="Utrullinger" trend={{ direction: 'up', text: '4.1%' }} />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard icon="fa-solid fa-clock" value="99.9%" label="Oppetid" trend={{ direction: 'up', text: '0.2%' }} />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard icon="fa-solid fa-bug" value="6" label="Åpne saker" trend={{ direction: 'down', text: '18%' }} />
          </div>
        </div>

        <div className="row g-4" style={{ marginTop: 'var(--sp-2)' }}>
          <div className="col-12 col-lg-7">
            <Panel icon="fa-solid fa-chart-column" header=" Ukentlige commits">
              <BarChart
                max={102 / 0.88}
                bars={[
                  { label: 'Man', value: 52 },
                  { label: 'Tir', value: 81 },
                  { label: 'Ons', value: 64 },
                  { label: 'Tor', value: 102 },
                  { label: 'Fre', value: 72 },
                  { label: 'Lør', value: 34 },
                  { label: 'Søn', value: 25 },
                ]}
              />
            </Panel>
          </div>
          <div className="col-12 col-lg-5">
            <Panel icon="fa-solid fa-chart-pie" header=" Teknologifordeling">
              <div className="row g-4" style={{ alignItems: 'center' }}>
                <div className="col-auto">
                  <Donut
                    center="62%"
                    centerLabel="Frontend"
                    slices={[
                      { label: 'Frontend', value: 62, color: '#405B06' },
                      { label: 'Backend', value: 22, color: '#A9C273' },
                      { label: 'Drift', value: 16, color: '#F2D544' },
                    ]}
                  />
                </div>
                <div className="col">
                  <Legend
                    items={[
                      { label: 'Frontend · 62%', color: '#405B06' },
                      { label: 'Backend · 22%', color: '#A9C273' },
                      { label: 'Drift · 16%', color: '#F2D544' },
                    ]}
                  />
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <Panel style={{ marginTop: 'var(--sp-4)' }} icon="fa-solid fa-list-check" header=" Siste aktivitet">
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="tbl hoverable" style={{ minWidth: 480 }}>
              <thead>
                <tr>
                  <th>Hendelse</th>
                  <th>Bruker</th>
                  <th>Når</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.event}>
                    <td>{e.event}</td>
                    <td>{e.user}</td>
                    <td>{e.when}</td>
                    <td>
                      <Badge variant={e.variant}>{e.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Section>
    </>
  );
}
