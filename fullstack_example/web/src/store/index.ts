import { configureStore } from '@reduxjs/toolkit';
import { users } from './usersSlice';
import { customers } from './customersSlice';
import { clients } from './clientsSlice';
import { orders } from './ordersSlice';

export const store = configureStore({
  reducer: {
    users: users.reducer,
    customers: customers.reducer,
    clients: clients.reducer,
    orders: orders.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { users, customers, clients, orders };
