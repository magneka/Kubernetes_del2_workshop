import { createResource } from './resourceFactory';
import type { Customer, CustomerInput } from '../types';

export const customers = createResource<Customer, CustomerInput>('customers');
