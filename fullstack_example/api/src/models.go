package main

import "time"

type User struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// UserInput is the request body for creating/updating users.
type UserInput struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type Customer struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Address   string    `json:"address"`
	CreatedAt time.Time `json:"created_at"`
}

type Client struct {
	ID            int64     `json:"id"`
	Name          string    `json:"name"`
	Company       string    `json:"company"`
	ContactPerson string    `json:"contact_person"`
	Email         string    `json:"email"`
	Phone         string    `json:"phone"`
	CreatedAt     time.Time `json:"created_at"`
}

type Order struct {
	ID          int64     `json:"id"`
	CustomerID  int64     `json:"customer_id"`
	ClientID    *int64    `json:"client_id"`
	OrderDate   string    `json:"order_date"`
	Status      string    `json:"status"`
	TotalAmount float64   `json:"total_amount"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

var orderStatuses = map[string]bool{
	"pending":    true,
	"processing": true,
	"shipped":    true,
	"cancelled":  true,
}
