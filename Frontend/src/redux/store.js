// frontend/src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import orderReducer from './slices/orderSlice';
import productReducer from './slices/productSlice';
import wishlistReducer from './slices/wishlistSlice';
import reviewReducer from './slices/reviewSlice';

// Better error handling for localStorage
const getUserInfoFromStorage = () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('Error parsing userInfo from localStorage:', error);
    localStorage.removeItem('userInfo');
    return null;
  }
};

const userInfoFromStorage = getUserInfoFromStorage();

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['orders', 'cart', 'wishlist'], // Only persist these slices
  blacklist: ['auth', 'products', 'reviews'], // Don't persist these
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  orders: orderReducer,
  products: productReducer,
  wishlist: wishlistReducer,
  reviews: reviewReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Preloaded state for auth
const preloadedState = {
  auth: {
    user: userInfoFromStorage?.user || null,
    token: userInfoFromStorage?.token || null,
    isAuthenticated: !!userInfoFromStorage && !!userInfoFromStorage.token,
    loading: false,
    error: null,
  },
};

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
        ],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);