import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api/client';

export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ResourceState<T> {
  items: T[];
  status: LoadStatus;
  error: string | null;
}

export type ThunkCfg = { rejectValue: string };

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function createResource<T extends { id: number }, TInput>(name: string) {
  const path = `/${name}`;

  const fetchAll = createAsyncThunk<T[], void, ThunkCfg>(`${name}/fetchAll`, async (_, { rejectWithValue }) => {
    try {
      return (await api.get<T[] | null>(path)) ?? [];
    } catch (e) {
      return rejectWithValue(message(e));
    }
  });

  const create = createAsyncThunk<T, TInput, ThunkCfg>(`${name}/create`, async (data, { rejectWithValue }) => {
    try {
      return await api.post<T>(path, data);
    } catch (e) {
      return rejectWithValue(message(e));
    }
  });

  const update = createAsyncThunk<T, { id: number; data: TInput }, ThunkCfg>(
    `${name}/update`,
    async ({ id, data }, { rejectWithValue }) => {
      try {
        return await api.put<T>(`${path}/${id}`, data);
      } catch (e) {
        return rejectWithValue(message(e));
      }
    },
  );

  const remove = createAsyncThunk<number, number, ThunkCfg>(`${name}/remove`, async (id, { rejectWithValue }) => {
    try {
      await api.del(`${path}/${id}`);
      return id;
    } catch (e) {
      return rejectWithValue(message(e));
    }
  });

  const initialState: ResourceState<T> = { items: [], status: 'idle', error: null };

  const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(fetchAll.pending, (state) => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(fetchAll.fulfilled, (state, action) => {
          const s = state as ResourceState<T>;
          s.status = 'succeeded';
          s.items = action.payload;
        })
        .addCase(fetchAll.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload ?? action.error.message ?? 'Ukjent feil';
        })
        .addCase(create.fulfilled, (state, action) => {
          (state as ResourceState<T>).items.push(action.payload);
        })
        .addCase(update.fulfilled, (state, action) => {
          const s = state as ResourceState<T>;
          const i = s.items.findIndex((x) => x.id === action.meta.arg.id);
          if (i >= 0) s.items[i] = action.payload;
        })
        .addCase(remove.fulfilled, (state, action) => {
          const s = state as ResourceState<T>;
          s.items = s.items.filter((x) => x.id !== action.payload);
        });
    },
  });

  return { reducer: slice.reducer, fetchAll, create, update, remove };
}
