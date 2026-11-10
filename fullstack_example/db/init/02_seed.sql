-- Seed data for development. Plaintext dev logins are documented in .env.example.

SET NAMES utf8mb4;

INSERT INTO users (username, email, password_hash, role) VALUES
  ('admin',  'admin@example.no',         '$2y$10$5NTshNwiL.Ggb7OtpAOC3uKZF54Ttxg3UO9hj15eusQtj/4GJnR22', 'admin'),
  ('kari',   'kari.nordmann@example.no', '$2y$10$FuQK1HO5XPcl6Ne.5GROseK/JrCTuc5H1lXi1yDKV6ifwvcnJZLM6', 'user'),
  ('ola',    'ola.hansen@example.no',    '$2y$10$kaBRJ/uX37ZbhO1v79vFt.1Qb9YiDiEzvPx0lzKSJfEs7MsEy767a', 'user'),
  ('ingrid', 'ingrid.berg@example.no',   '$2y$10$uyjj/60VS6iQnXrkSp6edOSt30PqYKiabxZqSVQlvY6J3/nUZbsPm', 'user'),
  ('erik',   'erik.johansen@example.no', '$2y$10$exC6LzDkLvFxOGinDl5DnepG5VUEeoxmcjBYNoOw5s8HdZOh/DVA2', 'user');

INSERT INTO customers (name, email, phone, address) VALUES
  ('Kari Nordmann',      'kari.nordmann@example.no',      '+47 912 34 567', 'Storgata 1, 0155 Oslo'),
  ('Ola Hansen AS',      'post@olahansen.example.no',     '+47 223 45 678', 'Bryggen 12, 5003 Bergen'),
  ('Ingrid Berg',        'ingrid.berg@example.no',        '+47 955 55 123', 'Solveien 7, 7010 Trondheim'),
  ('Nordlys Bygg AS',    'kontor@nordlysbygg.example.no', '+47 776 12 345', 'Industriveien 4, 9008 Tromsø'),
  ('Fjordtun Barnehage', 'kontakt@fjordtun.example.no',   '+47 404 99 000', 'Fjordveien 22, 4005 Stavanger');

INSERT INTO clients (name, company, contact_person, email, phone) VALUES
  ('Nordic Retail',      'Nordic Retail ASA',       'Lise Moen',   'lise.moen@nordicretail.example.no', '+47 900 11 222'),
  ('Vestlandske Energi', 'Vestlandske Energi AS',   'Thomas Dahl', 'thomas.dahl@vestenergi.example.no', '+47 981 22 333'),
  ('Blå Kaffebar',       'Blå Kaffe Drift ANS',     'Mari Strand', 'mari@blakaffe.example.no',          '+47 412 34 444'),
  ('Polarkontoret',      'Polar Consulting AS',     'Henrik Lund', 'henrik.lund@polar.example.no',      '+47 470 55 666'),
  ('Østlandsposten',     'Østlandsposten Media AS', 'Silje Aas',   'silje.aas@ostposten.example.no',    '+47 928 77 888');

INSERT INTO orders (customer_id, client_id, order_date, status, total_amount, description) VALUES
  (1, 1,    '2026-01-12', 'shipped',    1499.00,  'Kontorstoler (4 stk)'),
  (2, NULL, '2026-02-03', 'processing', 8750.50,  'Årlig vedlikeholdsavtale'),
  (3, 3,    '2026-03-18', 'pending',     320.00,  'Kaffemaskin-service'),
  (4, 4,    '2026-05-07', 'cancelled',  2600.00,  'Konsulenttimer, mai'),
  (5, 5,    '2026-09-21', 'pending',   12400.00,  'Trykking av årsrapport');
