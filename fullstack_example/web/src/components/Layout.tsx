import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { dsSections } from '../pages/ds/sections';

interface MenuLink {
  to: string;
  label: string;
}

interface Menu {
  id: string;
  label: string;
  isActive: (path: string) => boolean;
  links: MenuLink[];
}

const menus: Menu[] = [
  {
    id: 'register',
    label: 'Registrer',
    isActive: (p) => /\/(new|\d+\/edit)$/.test(p),
    links: [
      { to: '/users/new', label: 'Ny bruker' },
      { to: '/customers/new', label: 'Ny kunde' },
      { to: '/clients/new', label: 'Ny klient' },
      { to: '/orders/new', label: 'Ny ordre' },
    ],
  },
  {
    id: 'overview',
    label: 'Oversikt',
    isActive: (p) => /^\/(users|customers|clients|orders)\/?$/.test(p),
    links: [
      { to: '/users', label: 'Brukere' },
      { to: '/customers', label: 'Kunder' },
      { to: '/clients', label: 'Klienter' },
      { to: '/orders', label: 'Ordrer' },
    ],
  },
  {
    id: 'ds',
    label: 'Designsystem',
    isActive: (p) => p.startsWith('/ds'),
    links: [{ to: '/ds', label: 'Oversikt' }, ...dsSections.map((s) => ({ to: `/ds/${s.slug}`, label: s.label }))],
  },
];

const allLinks: MenuLink[] = [
  { to: '/', label: 'Hjem' },
  ...menus.flatMap((m) => m.links.map((l) => ({ ...l, label: `${m.label}: ${l.label}` }))),
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setNavOpen(false);
    setOpenMenu(null);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Same behaviour as the design file: any document click closes open dropdowns.
  useEffect(() => {
    const close = () => setOpenMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const search = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const hit =
      allLinks.find((l) => l.label.toLowerCase() === q) ?? allLinks.find((l) => l.label.toLowerCase().includes(q));
    if (hit) {
      navigate(hit.to);
      setQuery('');
    }
  };

  return (
    <>
      <header className="site-header">
        <div className="bar">
          <Link to="/" className="logo">
            <i className="fa-solid fa-mountain-sun" />
            Ulriken
          </Link>
          <button className="hamburger" type="button" aria-label="Vis/skjul meny" onClick={() => setNavOpen((o) => !o)}>
            <i className="fa-solid fa-bars" />
          </button>
          <nav className={navOpen ? 'nav open' : 'nav'}>
            <div className="nav-item">
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Hjem
              </NavLink>
            </div>
            {menus.map((m) => (
              <div key={m.id} className={openMenu === m.id ? 'nav-item open' : 'nav-item'}>
                <button
                  type="button"
                  className={m.isActive(location.pathname) ? 'nav-link active' : 'nav-link'}
                  aria-expanded={openMenu === m.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(openMenu === m.id ? null : m.id);
                  }}
                >
                  {m.label} <i className="fa-solid fa-chevron-down" style={{ fontSize: 11 }} />
                </button>
                <div className="dropdown-menu">
                  {m.links.map((l) => (
                    <Link key={l.to} to={l.to}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <form className="header-search" onSubmit={search} role="search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="search"
                placeholder="Gå til side…"
                aria-label="Søk etter side"
                list="page-list"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <datalist id="page-list">
                {allLinks.map((l) => (
                  <option key={l.to} value={l.label} />
                ))}
              </datalist>
            </form>
          </nav>
        </div>
      </header>

      <main id="top">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-12 col-md-4">
              <div className="logo" style={{ color: '#fff' }}>
                <i className="fa-solid fa-mountain-sun" style={{ color: 'var(--accent)' }} />
                Ulriken
              </div>
              <p style={{ marginTop: 'var(--sp-3)', maxWidth: '36ch' }}>
                Ordrestyring for brukere, kunder, klienter og ordrer. Bygget med Ulriken Design System.
              </p>
            </div>
            {menus.map((m) => (
              <div key={m.id} className={m.id === 'ds' ? 'col-12 col-md-4' : 'col-6 col-md-2'}>
                <h4>{m.label}</h4>
                {(m.id === 'ds' ? m.links.slice(0, 6) : m.links).map((l) => (
                  <Link key={l.to} to={l.to}>
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="bottom">
            <span>© {new Date().getFullYear()} Ulriken. Alle rettigheter reservert.</span>
            <span>Bygget med uc.no-fargepaletten.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
