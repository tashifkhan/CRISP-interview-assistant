import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'localforage';
import { interviewSlice } from './interviewSlice';
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
