import { Link } from 'react-router-dom';
import { ButtonLink } from '../../components/Button';
import { PageHero } from '../../components/Section';
import { dsSections } from './sections';

export default function DsIndexPage() {
  return (
    <PageHero
      small={false}
      eyebrow="Designsystem · uc.no"
      title="Ulriken Design System"
      lead="Et helhetlig, tilgjengelig komponentbibliotek bygget på Ulrikens egne merkevaretokens — mosegrønn palett, varmt kremfarget lerret og Montserrat-typografi — hentet direkte fra de gjengitte stilene på uc.no."
      actions={
        <>
          <ButtonLink to="/ds/grid" variant="primary" size="lg" icon="fa-solid fa-layer-group">
            Utforsk komponentene
          </ButtonLink>
          <ButtonLink to="/ds/colors" variant="outline" size="lg">
            Se fargene
          </ButtonLink>
        </>
      }
    >
      <div style={{ marginTop: 'var(--sp-5)' }} className="toc">
        {dsSections.map((s) => (
          <Link key={s.slug} to={`/ds/${s.slug}`}>
            {s.label}
          </Link>
        ))}
      </div>
    </PageHero>
  );
}
