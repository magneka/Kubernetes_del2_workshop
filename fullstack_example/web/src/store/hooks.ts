import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AsyncThunk } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './index';
import { users, customers, clients, orders } from './index';
import type { ResourceState, ThunkCfg } from './resourceFactory';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

// Loads the resource on mount so lists are fresh whenever a page is opened.
function useLoaded<T>(
  select: (s: RootState) => ResourceState<T>,
  fetchAll: AsyncThunk<T[], void, ThunkCfg>,
): ResourceState<T> {
  const dispatch = useAppDispatch();
  const state = useAppSelector(select);
  useEffect(() => {
    void dispatch(fetchAll());
  }, [dispatch, fetchAll]);
  return state;
}

export const useUsers = () => useLoaded((s) => s.users, users.fetchAll);
export const useCustomers = () => useLoaded((s) => s.customers, customers.fetchAll);
export const useClients = () => useLoaded((s) => s.clients, clients.fetchAll);
export const useOrders = () => useLoaded((s) => s.orders, orders.fetchAll);
