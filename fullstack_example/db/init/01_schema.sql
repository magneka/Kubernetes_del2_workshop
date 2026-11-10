-- Application schema (MySQL 8.4). The database itself is created by the image via MYSQL_DATABASE.

-- The image's init client defaults to latin1; without this, UTF-8 text (æøå) is double-encoded.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            INT           NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)   NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customers (
  id         INT           NOT NULL AUTO_INCREMENT,
  name       VARCHAR(255)  NOT NULL,
  email      VARCHAR(255)  NULL,
  phone      VARCHAR(50)   NULL,
  address    VARCHAR(500)  NULL,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clients (
  id             INT           NOT NULL AUTO_INCREMENT,
  name           VARCHAR(255)  NOT NULL,
  company        VARCHAR(255)  NULL,
  contact_person VARCHAR(255)  NULL,
  email          VARCHAR(255)  NULL,
  phone          VARCHAR(50)   NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id           INT                NOT NULL AUTO_INCREMENT,
  customer_id  INT                NOT NULL,
  client_id    INT                NULL,
  order_date   DATE               NOT NULL,
  status       ENUM('pending','processing','shipped','cancelled') NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2)      NOT NULL DEFAULT 0.00,
  description  TEXT               NULL,
  created_at   TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_customer_id (customer_id),
  KEY idx_orders_client_id (client_id),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_client FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
