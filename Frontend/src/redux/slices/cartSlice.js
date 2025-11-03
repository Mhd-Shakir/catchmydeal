// frontend/src/redux/slices/cartSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/axios';

const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  loading: false,
  error: null,
};

// Helper functions
const extractCartItems = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (responseData?.cart?.items && Array.isArray(responseData.cart.items)) return responseData.cart.items;
  if (responseData?.items && Array.isArray(responseData.items)) return responseData.items;
  if (responseData?.data?.cart?.items && Array.isArray(responseData.data.cart.items)) return responseData.data.cart.items;
  // This is a new fallback for the data structure in your controller
  if (responseData?.data?.items && Array.isArray(responseData.data.items)) return responseData.data.items; 
  return [];
};

const calculateCartTotals = (items) => {
  if (!Array.isArray(items)) return { totalItems: 0, totalPrice: 0 };
  return {
    totalItems: items.length,
    totalPrice: items.reduce((total, item) => {
      // Use item.price (from controller) or item.product.price (from populate)
      const price = Number(item.price || item.product?.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return total + (price * quantity);
    }, 0)
  };
};

// Async Thunks
export const getCart = createAsyncThunk('cart/getCart', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cart');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
  }
});

// --- THIS FUNCTION IS NOW FIXED ---
export const addToCart = createAsyncThunk('cart/addToCart', async (itemData, { rejectWithValue }) => {
  try {
    // FIX: Changed URL from '/cart' to '/cart/items'
    const { data } = await api.post('/cart/items', itemData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add item to cart');
  }
});
// --- END OF FIX ---

// --- THIS FUNCTION IS NOW FIXED ---
export const updateCartItem = createAsyncThunk('cart/updateCartItem', async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    // FIX: Changed URL from '/cart/:itemId' to '/cart/items/:itemId'
    const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update cart item');
  }
});
// --- END OF FIX ---

// --- THIS FUNCTION IS NOW FIXED ---
export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (itemId, { rejectWithValue }) => {
  try {
    // FIX: Changed URL from '/cart/:itemId' to '/cart/items/:itemId'
    const { data } = await api.delete(`/cart/items/${itemId}`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to remove item from cart');
  }
});
// --- END OF FIX ---

export const clearCart = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.delete('/cart');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
  }
});

export const syncCart = createAsyncThunk('cart/syncCart', async (guestCartData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart/sync', guestCartData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to sync cart');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    localClearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
    },
  },
  extraReducers: (builder) => {
    // Reusable handlers
    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || 'An unexpected error occurred';
    };

    const handleFulfilled = (state, action) => {
      state.loading = false;
      // Use the helper function to safely get the items array
      const items = extractCartItems(action.payload);
      const totals = calculateCartTotals(items);
      state.items = items;
      state.totalItems = totals.totalItems;
      state.totalPrice = totals.totalPrice;
    };

    const handlePending = (state) => {
      state.loading = true;
      state.error = null;
    };

    builder
      // Get cart
      .addCase(getCart.pending, handlePending)
      .addCase(getCart.fulfilled, handleFulfilled)
      .addCase(getCart.rejected, (state, action) => {
        handleRejected(state, action);
        state.items = []; // Ensure items is always an array on error
      })
      // Add to cart
      .addCase(addToCart.pending, handlePending)
      .addCase(addToCart.fulfilled, handleFulfilled)
      .addCase(addToCart.rejected, handleRejected)
      // Update cart item
      .addCase(updateCartItem.pending, handlePending)
      .addCase(updateCartItem.fulfilled, handleFulfilled)
      .addCase(updateCartItem.rejected, handleRejected)
      // Remove from cart
      .addCase(removeFromCart.pending, handlePending)
      .addCase(removeFromCart.fulfilled, handleFulfilled)
      .addCase(removeFromCart.rejected, handleRejected)
      // Clear cart
      .addCase(clearCart.pending, handlePending)
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.totalItems = 0;
        state.totalPrice = 0;
      })
      .addCase(clearCart.rejected, handleRejected)
      // Sync cart
      .addCase(syncCart.pending, handlePending)
      .addCase(syncCart.fulfilled, handleFulfilled)
      .addCase(syncCart.rejected, handleRejected);
  },
});

export const { clearError, localClearCart } = cartSlice.actions;
export default cartSlice.reducer;