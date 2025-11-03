import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/axios';

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  lastFetch: null,
};

// Create order
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      console.log('📤 Sending order request:', orderData);
      
      const { data } = await api.post('/orders', orderData);
      
      console.log('✅ Order created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Create order error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create order'
      );
    }
  }
);

// Get user orders
export const getUserOrders = createAsyncThunk(
  'orders/getUserOrders',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/orders');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch orders'
      );
    }
  }
);

// Export alias for backward compatibility
export const getMyOrders = getUserOrders;

// Get single order
export const getOrderById = createAsyncThunk(
  'orders/getOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch order'
      );
    }
  }
);

// Cancel order
export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/cancel`, { reason });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to cancel order'
      );
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    updateOrderInList: (state, action) => {
      const updatedOrder = action.payload;
      
      // ✅ Ensure orders is always an array
      if (!Array.isArray(state.orders)) {
        state.orders = [];
      }
      
      const index = state.orders.findIndex(order => order._id === updatedOrder._id);
      if (index !== -1) {
        state.orders[index] = updatedOrder;
      }
      if (state.currentOrder?._id === updatedOrder._id) {
        state.currentOrder = updatedOrder;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        
        // ✅ FIXED: Safely extract order from response
        const order = action.payload.data || action.payload;
        
        console.log('🎯 Extracted order:', order);
        
        state.currentOrder = order;
        
        // ✅ CRITICAL FIX: Ensure orders is an array before unshift
        if (!Array.isArray(state.orders)) {
          console.warn('⚠️ state.orders was not an array, initializing as empty array');
          state.orders = [];
        }
        
        // Add new order to the beginning of the array
        state.orders.unshift(order);
        
        console.log('✅ Order added to state. Total orders:', state.orders.length);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get user orders
      .addCase(getUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        
        // ✅ FIXED: Safely extract orders array
        const ordersData = action.payload.data;
        
        // Ensure we always have an array
        if (Array.isArray(ordersData)) {
          state.orders = ordersData;
        } else if (ordersData && Array.isArray(ordersData.orders)) {
          state.orders = ordersData.orders;
        } else if (Array.isArray(action.payload)) {
          state.orders = action.payload;
        } else {
          console.warn('⚠️ Unexpected orders data format:', action.payload);
          state.orders = [];
        }
        
        state.lastFetch = Date.now();
        
        console.log('✅ Orders loaded:', state.orders.length);
      })
      .addCase(getUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.orders = [];
      })
      
      // Get single order
      .addCase(getOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrderById.fulfilled, (state, action) => {
        state.loading = false;
        
        // ✅ FIXED: Safely extract order
        const order = action.payload.data || action.payload;
        state.currentOrder = order;
        
        // ✅ Ensure orders is an array
        if (!Array.isArray(state.orders)) {
          state.orders = [];
        }
        
        // Update the order in the list if it exists
        const index = state.orders.findIndex(o => o._id === order._id);
        if (index !== -1) {
          state.orders[index] = order;
        }
      })
      .addCase(getOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Cancel order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        
        // ✅ FIXED: Safely extract order
        const order = action.payload.data || action.payload;
        state.currentOrder = order;
        
        // ✅ Ensure orders is an array
        if (!Array.isArray(state.orders)) {
          state.orders = [];
        }
        
        const index = state.orders.findIndex((o) => o._id === order._id);
        if (index !== -1) {
          state.orders[index] = order;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentOrder, updateOrderInList } = orderSlice.actions;
export default orderSlice.reducer;