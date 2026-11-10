import { createResource } from './resourceFactory';
import type { Client, ClientInput } from '../types';

export const clients = createResource<Client, ClientInput>('clients');
