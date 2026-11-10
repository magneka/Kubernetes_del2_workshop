import { ButtonLink } from '../../components/Button';
import { DemoLabel, PageHero, Section } from '../../components/Section';

const brand: { name: string; hex: string; border?: boolean }[] = [
  { name: 'Primær', hex: '#748849' },
  { name: 'Primær mørk', hex: '#405B06' },
  { name: 'Dyp oliven', hex: '#262C03' },
  { name: 'Primær lys', hex: '#A9C273' },
  { name: 'CTA myk', hex: '#C9E098' },
  { name: 'Blek', hex: '#E5EFCA' },
  { name: 'Aksent', hex: '#FFF1A9' },
  { name: 'Lerret', hex: '#FFFFF2', border: true },
];

const semantic = [
  { name: 'Suksess', hex: '#4f7a2f' },
  { name: 'Advarsel', hex: '#b8860b' },
  { name: 'Fare', hex: '#b23b2e' },
  { name: 'Info', hex: '#3d6b6b' },
];

const spacing = [4, 8, 12, 16, 24, 32, 48, 64];
const radii: { px: number; label: string }[] = [
  { px: 4, label: '4' },
  { px: 8, label: '8' },
  { px: 14, label: '14' },
  { px: 24, label: '24' },
  { px: 999, label: 'pill' },
];

export default function ColorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Designsystem"
        title="Farger"
        lead="Fargepalett, semantiske farger samt skalaer for avstand og avrunding."
        actions={
          <ButtonLink to="/ds" variant="outline" icon="fa-solid fa-arrow-left">
            Alle komponenter
          </ButtonLink>
        }
      />
      <Section
        id="colors"
        title="Farger"
        lead="Hver nyanse er hentet fra Ulrikens faktiske stiler på uc.no (mosegrønt på kremfarget lerret med en varm gul aksent)."
      >
        <DemoLabel first>Merkevarepalett</DemoLabel>
        <div className="swatches">
          {brand.map((c) => (
            <div key={c.hex} className="swatch">
              <div
                className="chip"
                style={c.border ? { background: c.hex, borderBottom: '1px solid #ddd' } : { background: c.hex }}
              />
              <div className="meta">
                <b>{c.name}</b>
                <span>{c.hex}</span>
              </div>
            </div>
          ))}
        </div>

        <DemoLabel>Semantiske farger</DemoLabel>
        <div className="swatches">
          {semantic.map((c) => (
            <div key={c.hex} className="swatch">
              <div className="chip" style={{ background: c.hex }} />
              <div className="meta">
                <b>{c.name}</b>
                <span>{c.hex.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-5" style={{ marginTop: 'var(--sp-6)' }}>
          <div className="col-12 col-lg-6">
            <p className="demo-label">Avstandsskala</p>
            <div className="scale-row">
              {spacing.map((s, i) => (
                <div key={s} className="scale-box" style={{ width: `${s}px`, height: `${32 + i * 8}px` }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <p className="demo-label">Skala for border-radius</p>
            <div className="scale-row">
              {radii.map((r) => (
                <div key={r.label} className="radius-box" style={{ borderRadius: `${r.px}px` }}>
                  {r.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
