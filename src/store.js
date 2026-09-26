import { configureStore, createSlice } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import createWebStorage from 'redux-persist/es/storage/createWebStorage'

const storage =
  typeof window !== 'undefined'
    ? createWebStorage('local')
    : {
        getItem: () => Promise.resolve(null),
        setItem: (_k, value) => Promise.resolve(value),
        removeItem: () => Promise.resolve(),
      }

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: '' },
  reducers: {
    signedIn: (state, action) => ({ ...state, ...action.payload }),
    signedOut: () => ({ user: null, token: '' }),
  },
})

const persistedAuth = persistReducer(
  {
    key: 'fieldnotes-auth',
    storage,
    whitelist: ['user', 'token'],
  },
  authSlice.reducer
)

export const store = configureStore({
  reducer: {
    auth: persistedAuth,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
          'persist/FLUSH',
          'persist/PAUSE',
          'persist/PURGE',
        ],
      },
    }),
})

export const persistor = persistStore(store)
export const authActions = authSlice.actions