export type Role = 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  created_at: string;
}
export interface UserInput {
  username: string;
  email: string;
  role: Role;
  password?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}
export type CustomerInput = Omit<Customer, 'id' | 'created_at'>;

export interface Client {
  id: number;
  name: string;
  company: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}
export type ClientInput = Omit<Client, 'id' | 'created_at'>;

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'cancelled'];

export interface Order {
  id: number;
  customer_id: number;
  client_id: number | null;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  description: string | null;
  created_at: string;
}
export type OrderInput = Omit<Order, 'id' | 'created_at'>;

export const statusLabel: Record<OrderStatus, string> = {
  pending: 'Venter',
  processing: 'Behandles',
  shipped: 'Sendt',
  cancelled: 'Kansellert',
};

export const roleLabel: Record<Role, string> = {
  admin: 'Administrator',
  user: 'Bruker',
};
