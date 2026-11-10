package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

const maxBodyBytes = 1 << 20

type API struct {
	store *Store
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("encode response: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func decodeBody(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(dst); err != nil {
		var mbe *http.MaxBytesError
		switch {
		case errors.As(err, &mbe):
			writeError(w, http.StatusRequestEntityTooLarge, "request body too large")
		case errors.Is(err, io.EOF):
			writeError(w, http.StatusBadRequest, "request body is empty")
		default:
			writeError(w, http.StatusBadRequest, "invalid JSON body")
		}
		return false
	}
	return true
}

func parseID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "invalid id")
		return 0, false
	}
	return id, true
}

// dbError maps a database error to an HTTP response.
func dbError(w http.ResponseWriter, err error) {
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	var me *mysql.MySQLError
	if errors.As(err, &me) {
		switch me.Number {
		case 1062:
			writeError(w, http.StatusConflict, "a record with the same unique value already exists")
			return
		case 1451:
			writeError(w, http.StatusConflict, "record is referenced by other records and cannot be deleted")
			return
		case 1452:
			writeError(w, http.StatusBadRequest, "referenced customer or client does not exist")
			return
		}
	}
	log.Printf("database error: %v", err)
	writeError(w, http.StatusInternalServerError, "internal server error")
}

func notFound(w http.ResponseWriter) { writeError(w, http.StatusNotFound, "not found") }

func (a *API) Health(w http.ResponseWriter, r *http.Request) {
	if err := a.store.Ping(); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "error", "error": "database unreachable"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// ---- generic list/get ----

func listHandler[T any](list func() ([]T, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		items, err := list()
		if err != nil {
			dbError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, items)
	}
}

func getHandler[T any](get func(int64) (*T, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, ok := parseID(w, r)
		if !ok {
			return
		}
		item, err := get(id)
		if err != nil {
			dbError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, item)
	}
}

func deleteHandler(del func(int64) (bool, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, ok := parseID(w, r)
		if !ok {
			return
		}
		found, err := del(id)
		if err != nil {
			dbError(w, err)
			return
		}
		if !found {
			notFound(w)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func hashPassword(pw string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	return string(b), err
}

// ---- users ----

func (a *API) ListUsers() http.HandlerFunc  { return listHandler(a.store.ListUsers) }
func (a *API) GetUser() http.HandlerFunc    { return getHandler(a.store.GetUser) }
func (a *API) DeleteUser() http.HandlerFunc { return deleteHandler(a.store.DeleteUser) }

func (a *API) CreateUser(w http.ResponseWriter, r *http.Request) {
	var in UserInput
	if !decodeBody(w, r, &in) {
		return
	}
	in.Username = strings.TrimSpace(in.Username)
	in.Email = strings.TrimSpace(in.Email)
	in.Role = strings.TrimSpace(in.Role)
	if in.Username == "" || in.Email == "" || in.Password == "" {
		writeError(w, http.StatusBadRequest, "username, email and password are required")
		return
	}
	if len(in.Password) > 72 {
		writeError(w, http.StatusBadRequest, "password must be at most 72 bytes")
		return
	}
	if in.Role == "" {
		in.Role = "user"
	}
	hash, err := hashPassword(in.Password)
	if err != nil {
		log.Printf("hash password: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	id, err := a.store.CreateUser(in, hash)
	if err != nil {
		dbError(w, err)
		return
	}
	u, err := a.store.GetUser(id)
	if err != nil {
		dbError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, u)
}

func (a *API) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	var in UserInput
	if !decodeBody(w, r, &in) {
		return
	}
	in.Username = strings.TrimSpace(in.Username)
	in.Email = strings.TrimSpace(in.Email)
	in.Role = strings.TrimSpace(in.Role)
	if in.Username == "" || in.Email == "" {
		writeError(w, http.StatusBadRequest, "username and email are required")
		return
	}
	if in.Role == "" {
		in.Role = "user"
	}
	hash := ""
	if in.Password != "" {
		if len(in.Password) > 72 {
			writeError(w, http.StatusBadRequest, "password must be at most 72 bytes")
			return
		}
		var err error
		if hash, err = hashPassword(in.Password); err != nil {
			log.Printf("hash password: %v", err)
			writeError(w, http.StatusInternalServerError, "internal server error")
			return
		}
	}
	found, err := a.store.UpdateUser(id, in, hash)
	if err != nil {
		dbError(w, err)
		return
	}
	if !found {
		notFound(w)
		return
	}
	u, err := a.store.GetUser(id)
	if err != nil {
		dbError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, u)
}

// ---- customers ----

func (a *API) ListCustomers() http.HandlerFunc  { return listHandler(a.store.ListCustomers) }
func (a *API) GetCustomer() http.HandlerFunc    { return getHandler(a.store.GetCustomer) }
func (a *API) DeleteCustomer() http.HandlerFunc { return deleteHandler(a.store.DeleteCustomer) }

func (a *API) CreateCustomer(w http.ResponseWriter, r *http.Request) {
	var in Customer
	if !decodeBody(w, r, &in) {
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	id, err := a.store.CreateCustomer(in)
	if err != nil {
		dbError(w, err)
		return
	}
	c, err := a.store.GetCustomer(id)
	if err != nil {
		dbError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

func (a *API) UpdateCustomer(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	var in Customer
	if !decodeBody(w, r, &in) {
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	found, err := a.store.UpdateCustomer(id, in)
	if err != nil {
		dbError(w, err)
		return
	}
	if !found {
		notFound(w)
		return
	}
	c, err := a.store.GetCustomer(id)
	if err != nil {
		dbError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, c)
}

// ---- clients ----

func (a *API) ListClients() http.HandlerFunc  { return listHandler(a.store.ListClients) }
func (a *API) GetClient() http.HandlerFunc    { return getHandler(a.store.GetClient) }
func (a *API) DeleteClient() http.HandlerFunc { return deleteHandler(a.store.DeleteClient) }

func (a *API) CreateClient(w http.ResponseWriter, r *http.Request) {
	var in Client
	if !decodeBody(w, r, &in) {
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	id, err := a.store.CreateClient(in)
	if err != nil {
		dbError(w, err)
		return
	}
	c, err := a.store.GetClient(id)
	if err != nil {
		dbError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

func (a *API) UpdateClient(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	var in Client
	if !decodeBody(w, r, &in) {
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	found, err := a.store.UpdateClient(id, in)
	if err != nil {
		dbError(w, err)
		return
	}
	if !found {
		notFound(w)
		return
	}
	c, err := a.store.GetClient(id)
	if err != nil {
		dbError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, c)
}

// ---- orders ----

func (a *API) ListOrders() http.HandlerFunc  { return listHandler(a.store.ListOrders) }
func (a *API) GetOrder() http.HandlerFunc    { return getHandler(a.store.GetOrder) }
func (a *API) DeleteOrder() http.HandlerFunc { return deleteHandler(a.store.DeleteOrder) }

func validateOrder(o *Order) string {
	if o.CustomerID <= 0 {
		return "customer_id is required"
	}
	if o.ClientID != nil && *o.ClientID <= 0 {
		o.ClientID = nil
	}
	o.OrderDate = strings.TrimSpace(o.OrderDate)
	if o.OrderDate == "" {
		return "order_date is required"
	}
	if _, err := time.Parse("2006-01-02", o.OrderDate); err != nil {
		return "order_date must be in YYYY-MM-DD format"
	}
	if !orderStatuses[o.Status] {
		return "status must be one of: pending, processing, shipped, cancelled"
	}
	if o.TotalAmount < 0 {
		return "total_amount must be >= 0"
	}
	return ""
}

func (a *API) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var in Order
	if !decodeBody(w, r, &in) {
		return
	}
	if msg := validateOrder(&in); msg != "" {
		writeError(w, http.StatusBadRequest, msg)
		return
	}
	id, err := a.store.CreateOrder(in)
	if err != nil {
		dbError(w, err)
		return
	}
	o, err := a.store.GetOrder(id)
	if err != nil {
		dbError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, o)
}

func (a *API) UpdateOrder(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	var in Order
	if !decodeBody(w, r, &in) {
		return
	}
	if msg := validateOrder(&in); msg != "" {
		writeError(w, http.StatusBadRequest, msg)
		return
	}
	found, err := a.store.UpdateOrder(id, in)
	if err != nil {
		dbError(w, err)
		return
	}
	if !found {
		notFound(w)
		return
	}
	o, err := a.store.GetOrder(id)
	if err != nil {
		dbError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, o)
}
