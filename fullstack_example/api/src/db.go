package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type Store struct {
	db *sql.DB
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// OpenDB connects to MySQL, retrying for up to ~60s.
func OpenDB() (*Store, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&clientFoundRows=true&charset=utf8mb4",
		os.Getenv("MYSQL_USER"), os.Getenv("MYSQL_PASSWORD"),
		getenv("DB_HOST", "mysql"), getenv("DB_PORT", "3306"),
		os.Getenv("MYSQL_DATABASE"))

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	deadline := time.Now().Add(60 * time.Second)
	for {
		err = db.Ping()
		if err == nil {
			return &Store{db: db}, nil
		}
		if time.Now().After(deadline) {
			db.Close()
			return nil, fmt.Errorf("database not reachable: %w", err)
		}
		log.Printf("waiting for database: %v", err)
		time.Sleep(2 * time.Second)
	}
}

func (s *Store) Ping() error { return s.db.Ping() }

func affected(res sql.Result, err error) (bool, error) {
	if err != nil {
		return false, err
	}
	n, err := res.RowsAffected()
	return n > 0, err
}

// ---- users ----

const userCols = "id, username, email, role, created_at"

func scanUser(sc interface{ Scan(...any) error }) (*User, error) {
	var u User
	if err := sc.Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.CreatedAt); err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *Store) ListUsers() ([]User, error) {
	rows, err := s.db.Query("SELECT " + userCols + " FROM users ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []User{}
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *u)
	}
	return out, rows.Err()
}

func (s *Store) GetUser(id int64) (*User, error) {
	return scanUser(s.db.QueryRow("SELECT "+userCols+" FROM users WHERE id = ?", id))
}

func (s *Store) CreateUser(in UserInput, hash string) (int64, error) {
	res, err := s.db.Exec("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
		in.Username, in.Email, hash, in.Role)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

// UpdateUser leaves the password unchanged when hash is empty.
func (s *Store) UpdateUser(id int64, in UserInput, hash string) (bool, error) {
	if hash == "" {
		return affected(s.db.Exec("UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?",
			in.Username, in.Email, in.Role, id))
	}
	return affected(s.db.Exec("UPDATE users SET username = ?, email = ?, role = ?, password_hash = ? WHERE id = ?",
		in.Username, in.Email, in.Role, hash, id))
}

func (s *Store) DeleteUser(id int64) (bool, error) {
	return affected(s.db.Exec("DELETE FROM users WHERE id = ?", id))
}

// ---- customers ----

const customerCols = "id, name, COALESCE(email,''), COALESCE(phone,''), COALESCE(address,''), created_at"

func scanCustomer(sc interface{ Scan(...any) error }) (*Customer, error) {
	var c Customer
	if err := sc.Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.Address, &c.CreatedAt); err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *Store) ListCustomers() ([]Customer, error) {
	rows, err := s.db.Query("SELECT " + customerCols + " FROM customers ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Customer{}
	for rows.Next() {
		c, err := scanCustomer(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *c)
	}
	return out, rows.Err()
}

func (s *Store) GetCustomer(id int64) (*Customer, error) {
	return scanCustomer(s.db.QueryRow("SELECT "+customerCols+" FROM customers WHERE id = ?", id))
}

func (s *Store) CreateCustomer(c Customer) (int64, error) {
	res, err := s.db.Exec("INSERT INTO customers (name, email, phone, address) VALUES (?, NULLIF(?,''), NULLIF(?,''), NULLIF(?,''))",
		c.Name, c.Email, c.Phone, c.Address)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (s *Store) UpdateCustomer(id int64, c Customer) (bool, error) {
	return affected(s.db.Exec("UPDATE customers SET name = ?, email = NULLIF(?,''), phone = NULLIF(?,''), address = NULLIF(?,'') WHERE id = ?",
		c.Name, c.Email, c.Phone, c.Address, id))
}

func (s *Store) DeleteCustomer(id int64) (bool, error) {
	return affected(s.db.Exec("DELETE FROM customers WHERE id = ?", id))
}

// ---- clients ----

const clientCols = "id, name, COALESCE(company,''), COALESCE(contact_person,''), COALESCE(email,''), COALESCE(phone,''), created_at"

func scanClient(sc interface{ Scan(...any) error }) (*Client, error) {
	var c Client
	if err := sc.Scan(&c.ID, &c.Name, &c.Company, &c.ContactPerson, &c.Email, &c.Phone, &c.CreatedAt); err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *Store) ListClients() ([]Client, error) {
	rows, err := s.db.Query("SELECT " + clientCols + " FROM clients ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Client{}
	for rows.Next() {
		c, err := scanClient(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *c)
	}
	return out, rows.Err()
}

func (s *Store) GetClient(id int64) (*Client, error) {
	return scanClient(s.db.QueryRow("SELECT "+clientCols+" FROM clients WHERE id = ?", id))
}

func (s *Store) CreateClient(c Client) (int64, error) {
	res, err := s.db.Exec("INSERT INTO clients (name, company, contact_person, email, phone) VALUES (?, NULLIF(?,''), NULLIF(?,''), NULLIF(?,''), NULLIF(?,''))",
		c.Name, c.Company, c.ContactPerson, c.Email, c.Phone)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (s *Store) UpdateClient(id int64, c Client) (bool, error) {
	return affected(s.db.Exec("UPDATE clients SET name = ?, company = NULLIF(?,''), contact_person = NULLIF(?,''), email = NULLIF(?,''), phone = NULLIF(?,'') WHERE id = ?",
		c.Name, c.Company, c.ContactPerson, c.Email, c.Phone, id))
}

func (s *Store) DeleteClient(id int64) (bool, error) {
	return affected(s.db.Exec("DELETE FROM clients WHERE id = ?", id))
}

// ---- orders ----

const orderCols = "id, customer_id, client_id, DATE_FORMAT(order_date, '%Y-%m-%d'), status, total_amount, COALESCE(description,''), created_at"

func scanOrder(sc interface{ Scan(...any) error }) (*Order, error) {
	var o Order
	var clientID sql.NullInt64
	if err := sc.Scan(&o.ID, &o.CustomerID, &clientID, &o.OrderDate, &o.Status, &o.TotalAmount, &o.Description, &o.CreatedAt); err != nil {
		return nil, err
	}
	if clientID.Valid {
		v := clientID.Int64
		o.ClientID = &v
	}
	return &o, nil
}

func (s *Store) ListOrders() ([]Order, error) {
	rows, err := s.db.Query("SELECT " + orderCols + " FROM orders ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Order{}
	for rows.Next() {
		o, err := scanOrder(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *o)
	}
	return out, rows.Err()
}

func (s *Store) GetOrder(id int64) (*Order, error) {
	return scanOrder(s.db.QueryRow("SELECT "+orderCols+" FROM orders WHERE id = ?", id))
}

func (s *Store) CreateOrder(o Order) (int64, error) {
	res, err := s.db.Exec("INSERT INTO orders (customer_id, client_id, order_date, status, total_amount, description) VALUES (?, ?, ?, ?, ?, NULLIF(?,''))",
		o.CustomerID, o.ClientID, o.OrderDate, o.Status, o.TotalAmount, o.Description)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (s *Store) UpdateOrder(id int64, o Order) (bool, error) {
	return affected(s.db.Exec("UPDATE orders SET customer_id = ?, client_id = ?, order_date = ?, status = ?, total_amount = ?, description = NULLIF(?,'') WHERE id = ?",
		o.CustomerID, o.ClientID, o.OrderDate, o.Status, o.TotalAmount, o.Description, id))
}

func (s *Store) DeleteOrder(id int64) (bool, error) {
	return affected(s.db.Exec("DELETE FROM orders WHERE id = ?", id))
}
