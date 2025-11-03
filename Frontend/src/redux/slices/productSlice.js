// frontend/src/redux/slices/productSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/axios';

const initialState = {
  products: [],
  product: null,
  similarProducts: [],
  // --- START OF FIX: Added state for product reviews ---
  productReviews: [],
  reviewsLoading: false,
  // --- END OF FIX ---
  categories: [],
  brands: [],
  pagination: {
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1,
  },
  loading: false,
  similarLoading: false,
  error: null,
  filters: {
    category: '',
    search: '',
    minPrice: 0,
    maxPrice: 10000,
    sort: '-createdAt',
  },
};

// Async Thunks
export const getProducts = createAsyncThunk(
  'products/getProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const { data } = await api.get(`/products?${queryParams}`);
      console.log('✅ Products API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Products API Error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch products'
      );
    }
  }
);

export const getProductById = createAsyncThunk(
  'products/getProductById',
  async (productId, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching product:', productId);
      const { data } = await api.get(`/products/${productId}`);
      console.log('✅ Product fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch product'
      );
    }
  }
);

// --- START OF FIX: Added getProductReviews thunk ---
export const getProductReviews = createAsyncThunk(
  'products/getProductReviews',
  async (productId, { rejectWithValue }) => {
    try {
      // Calls the correct route: GET /api/reviews/:productId
      const { data } = await api.get(`/reviews/${productId}`);
      return data.data; // Return the reviews array
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch reviews'
      );
    }
  }
);
// --- END OF FIX ---

export const getSimilarProducts = createAsyncThunk(
  'products/getSimilarProducts',
  async (productId, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching similar products for:', productId);
      const { data } = await api.get(`/products/${productId}/similar`);
      console.log('✅ Similar products fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching similar products:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch similar products'
      );
    }
  }
);

export const getCategories = createAsyncThunk(
  'products/getCategories',
  async (_, { rejectWithValue }) => {
    try {
      // ✅ FIXED: Changed from /products/categories/list to /products/categories
      const { data } = await api.get('/products/categories');
      console.log('✅ Categories API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Categories API Error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch categories'
      );
    }
  }
);

export const getFeaturedProducts = createAsyncThunk(
  'products/getFeaturedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/products?featured=true&limit=8');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch featured products'
      );
    }
  }
);

export const getNewArrivals = createAsyncThunk(
  'products/getNewArrivals',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/products?sort=-createdAt&limit=6');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch new arrivals'
      );
    }
  }
);

export const getProductsByCategory = createAsyncThunk(
  'products/getProductsByCategory',
  async (category, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/products?category=${category}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch products by category'
      );
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (searchTerm, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/products?search=${searchTerm}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to search products'
      );
    }
  }
);

// --- START OF FIX: Rewrote addProductReview thunk ---
export const addProductReview = createAsyncThunk(
  'products/addProductReview',
  // reviewData should be the FormData object from your form
  async (reviewData, { rejectWithValue }) => {
    try {
      // Calls the correct route: POST /api/reviews
      // Sends FormData, which our backend now expects
      const { data } = await api.post('/reviews', reviewData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data; // Return the new review object
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add review'
      );
    }
  }
);
// --- END OF FIX ---

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearProduct: (state) => {
      state.product = null;
      state.similarProducts = [];
      state.productReviews = []; // --- ADDED ---
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: '',
        search: '',
        minPrice: 0,
        maxPrice: 10000,
        sort: '-createdAt',
      };
    },
  },
  extraReducers: (builder) => {
    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || 'An unexpected error occurred';
    };

    builder
      // Get all products
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ FIXED: Backend returns data in action.payload.data
        state.products = action.payload.data || [];
        state.pagination = {
          totalProducts: action.payload.pagination?.totalProducts || 0,
          totalPages: action.payload.pagination?.totalPages || 1,
          currentPage: action.payload.pagination?.currentPage || 1,
        };
        // Extract unique brands from products
        if (action.payload.data) {
          const uniqueBrands = [...new Set(action.payload.data.map(p => p.brand).filter(Boolean))];
          state.brands = uniqueBrands;
        }
        console.log('✅ Products stored in Redux:', state.products.length);
      })
      .addCase(getProducts.rejected, handleRejected)
      
      // Get single product
      .addCase(getProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.productReviews = []; // --- ADDED: Clear old reviews
      })
      .addCase(getProductById.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ FIXED: Backend returns data in action.payload.data
        state.product = action.payload.data || action.payload.product;
      })
      .addCase(getProductById.rejected, handleRejected)
      
      // --- START OF FIX: Added reducers for getProductReviews ---
      .addCase(getProductReviews.pending, (state) => {
        state.reviewsLoading = true;
      })
      .addCase(getProductReviews.fulfilled, (state, action) => {
        state.reviewsLoading = false;
        state.productReviews = action.payload; // Payload is the reviews array
      })
      .addCase(getProductReviews.rejected, (state, action) => {
        state.reviewsLoading = false;
        state.error = action.payload;
      })
      // --- END OF FIX ---
      
      // Get similar products
      .addCase(getSimilarProducts.pending, (state) => {
        state.similarLoading = true;
        state.error = null;
      })
      .addCase(getSimilarProducts.fulfilled, (state, action) => {
        state.similarLoading = false;
        // ✅ FIXED: Backend returns data in action.payload.data
        state.similarProducts = action.payload.data || action.payload.products || [];
        console.log('✅ Similar products stored in Redux:', action.payload.data?.length);
      })
      .addCase(getSimilarProducts.rejected, (state, action) => {
        state.similarLoading = false;
        state.error = action.payload || 'Failed to load similar products';
        state.similarProducts = [];
        console.log('❌ Similar products error:', action.payload);
      })

      // Get categories
      .addCase(getCategories.pending, (state) => {
        state.error = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        // ✅ FIXED: Backend returns data in action.payload.data
        state.categories = action.payload.data || action.payload.categories || [];
        console.log('✅ Categories stored in Redux:', state.categories);
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.error = action.payload || 'Failed to load categories';
      })
      
      // Get featured products
      .addCase(getFeaturedProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getFeaturedProducts.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ FIXED: Backend returns data in action.payload.data
        state.products = action.payload.data || action.payload.products || [];
      })
      .addCase(getFeaturedProducts.rejected, handleRejected)
      
      // Get new arrivals
      .addCase(getNewArrivals.pending, (state) => {
        state.loading = true;
      })
      .addCase(getNewArrivals.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ FIXED: Backend returns data in action.payload.data
        state.products = action.payload.data || action.payload.products || [];
      })
      .addCase(getNewArrivals.rejected, handleRejected)
      
      // Get products by category
      .addCase(getProductsByCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProductsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ FIXED: Backend returns data in action.payload.data
        state.products = action.payload.data || action.payload.products || [];
      })
      .addCase(getProductsByCategory.rejected, handleRejected)
      
      // Search products
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ FIXED: Backend returns data in action.payload.data
        state.products = action.payload.data || action.payload.products || [];
      })
      .addCase(searchProducts.rejected, handleRejected)
      
      // --- START OF FIX: Updated addProductReview reducer ---
      .addCase(addProductReview.pending, (state) => {
        state.loading = true; // Or a specific 'reviewLoading' state
        state.error = null;
      })
      .addCase(addProductReview.fulfilled, (state, action) => {
        state.loading = false;
        // Add the new review to the list of reviews
        state.productReviews.unshift(action.payload);
        // Also update the product's average rating in the main product object
        if (state.product) {
          state.product.averageRating = action.payload.averageRating;
          state.product.numReviews = action.payload.numReviews;
        }
      })
      .addCase(addProductReview.rejected, handleRejected);
      // --- END OF FIX ---
  },
});

// ✅ FIXED: Add getCategories to the export list
export const { clearError, clearProduct, setFilters, clearFilters } = productSlice.actions;
export default productSlice.reducer;