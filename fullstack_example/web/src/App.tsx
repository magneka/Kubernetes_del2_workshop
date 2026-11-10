import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Alert } from './components/Alert';
import { ButtonLink } from './components/Button';
import { Section } from './components/Section';
import HomePage from './pages/HomePage';
import UserListPage from './pages/UserListPage';
import UserFormPage from './pages/UserFormPage';
import CustomerListPage from './pages/CustomerListPage';
import CustomerFormPage from './pages/CustomerFormPage';
import ClientListPage from './pages/ClientListPage';
import ClientFormPage from './pages/ClientFormPage';
import OrderListPage from './pages/OrderListPage';
import OrderFormPage from './pages/OrderFormPage';
import { DsIndexPage, dsPages } from './pages/ds';

function NotFound() {
  return (
    <Section title="Siden finnes ikke" style={{ paddingTop: 'var(--sp-7)' }}>
      <div className="stack">
        <Alert variant="warning" title="Fant ikke siden.">
          Sjekk adressen eller gå tilbake til forsiden.
        </Alert>
        <div className="util-row">
          <ButtonLink to="/" icon="fa-solid fa-house">
            Til forsiden
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="users" element={<UserListPage />} />
          <Route path="users/new" element={<UserFormPage />} />
          <Route path="users/:id/edit" element={<UserFormPage />} />
          <Route path="customers" element={<CustomerListPage />} />
          <Route path="customers/new" element={<CustomerFormPage />} />
          <Route path="customers/:id/edit" element={<CustomerFormPage />} />
          <Route path="clients" element={<ClientListPage />} />
          <Route path="clients/new" element={<ClientFormPage />} />
          <Route path="clients/:id/edit" element={<ClientFormPage />} />
          <Route path="orders" element={<OrderListPage />} />
          <Route path="orders/new" element={<OrderFormPage />} />
          <Route path="orders/:id/edit" element={<OrderFormPage />} />
          <Route path="ds" element={<DsIndexPage />} />
          {Object.entries(dsPages).map(([slug, Page]) => (
            <Route key={slug} path={`ds/${slug}`} element={<Page />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
