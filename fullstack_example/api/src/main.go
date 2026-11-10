package main

import (
	"context"
	"errors"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (s *statusWriter) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}

func middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("Access-Control-Allow-Origin", "*")
		h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		h.Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(sw, r)
		log.Printf("%s %s %d %s", r.Method, r.URL.Path, sw.status, time.Since(start))
	})
}

func main() {
	store, err := OpenDB()
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	api := &API{store: store}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", api.Health)

	mux.HandleFunc("GET /api/users", api.ListUsers())
	mux.HandleFunc("GET /api/users/{id}", api.GetUser())
	mux.HandleFunc("POST /api/users", api.CreateUser)
	mux.HandleFunc("PUT /api/users/{id}", api.UpdateUser)
	mux.HandleFunc("DELETE /api/users/{id}", api.DeleteUser())

	mux.HandleFunc("GET /api/customers", api.ListCustomers())
	mux.HandleFunc("GET /api/customers/{id}", api.GetCustomer())
	mux.HandleFunc("POST /api/customers", api.CreateCustomer)
	mux.HandleFunc("PUT /api/customers/{id}", api.UpdateCustomer)
	mux.HandleFunc("DELETE /api/customers/{id}", api.DeleteCustomer())

	mux.HandleFunc("GET /api/clients", api.ListClients())
	mux.HandleFunc("GET /api/clients/{id}", api.GetClient())
	mux.HandleFunc("POST /api/clients", api.CreateClient)
	mux.HandleFunc("PUT /api/clients/{id}", api.UpdateClient)
	mux.HandleFunc("DELETE /api/clients/{id}", api.DeleteClient())

	mux.HandleFunc("GET /api/orders", api.ListOrders())
	mux.HandleFunc("GET /api/orders/{id}", api.GetOrder())
	mux.HandleFunc("POST /api/orders", api.CreateOrder)
	mux.HandleFunc("PUT /api/orders/{id}", api.UpdateOrder)
	mux.HandleFunc("DELETE /api/orders/{id}", api.DeleteOrder())

	srv := &http.Server{
		Addr:              net.JoinHostPort("0.0.0.0", getenv("API_PORT", "8080")),
		Handler:           middleware(mux),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("listening on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)
	<-stop
	log.Println("shutting down")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("shutdown: %v", err)
	}
	store.db.Close()
}
