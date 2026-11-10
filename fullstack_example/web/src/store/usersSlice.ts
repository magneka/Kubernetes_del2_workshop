import { createResource } from './resourceFactory';
import type { User, UserInput } from '../types';

export const users = createResource<User, UserInput>('users');
