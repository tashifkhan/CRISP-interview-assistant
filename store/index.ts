import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'localforage';
import { interviewSlice } from '@/store/interviewSlice';
import { combineReducers } from 'redux';

const rootReducer = combineReducers({
  interview: interviewSlice.reducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['interview'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer as any);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export const persistor = persistStore(store);

// Helper to fully reset persisted state (IndexedDB via localforage)
export async function resetPersistedStore() {
  try {
    // Purge redux-persist state
    await persistor.purge();
    // Clear the underlying storage bucket (localforage)
    await storage.clear();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to reset persisted store', e);
  }
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
