import { createResource } from './resourceFactory';
import type { Order, OrderInput } from '../types';

export const orders = createResource<Order, OrderInput>('orders');
