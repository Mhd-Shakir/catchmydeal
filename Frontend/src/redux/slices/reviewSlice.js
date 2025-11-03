// frontend/src/redux/slices/reviewSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/axios';

const initialState = {
  reviews: [],
  stats: {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
  },
  loading: false,
  submitLoading: false,
  error: null,
};

// Get reviews for a product
export const getProductReviews = createAsyncThunk(
  'reviews/getProductReviews',
  async ({ productId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/reviews/${productId}?page=${page}&limit=${limit}`);
      console.log('✅ Reviews API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Reviews API Error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch reviews'
      );
    }
  }
);

// --- START OF FIX ---
// @desc    Create a review
// @desc    This thunk must send FormData to match the backend
export const createReview = createAsyncThunk(
  'reviews/createReview',
  // { reviewFormData } where reviewFormData is the FormData object from the form
  async (reviewFormData, { rejectWithValue }) => { 
    try {
      // Send the FormData directly.
      // The backend expects 'product', 'rating', 'title', 'comment', and 'images'
      const { data } = await api.post('/reviews', reviewFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Review created:', data);
      return data;
    } catch (error) {
      console.error('❌ Review creation error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create review'
      );
    }
  }
);
// --- END OF FIX ---


// Update a review
export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  // { reviewId, reviewFormData } where reviewFormData is the FormData object
  async ({ reviewId, reviewFormData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/reviews/${reviewId}`, reviewFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Review updated:', data);
      return data;
    } catch (error)
 {
      console.error('❌ Review update error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update review'
      );
    }
  }
);

// Delete a review
export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/reviews/${reviewId}`);
      console.log('✅ Review deleted:', data);
      return { reviewId, ...data };
    } catch (error) {
      console.error('❌ Review deletion error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete review'
      );
    }
  }
);

// Mark review as helpful
export const markReviewHelpful = createAsyncThunk(
  'reviews/markReviewHelpful',
  async (reviewId, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/reviews/${reviewId}/helpful`);
      console.log('✅ Review marked helpful:', data);
      return data;
    } catch (error) {
      console.error('❌ Mark helpful error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark review as helpful'
      );
    }
  }
);

// --- START OF FIX ---
// @desc    Get all reviews for Admin Panel
export const getAllReviewsAdmin = createAsyncThunk(
  'reviews/getAllReviewsAdmin',
  async ({ page = 1, limit = 20, status = 'all' }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/reviews/admin/all?page=${page}&limit=${limit}&status=${status}`);
      return data; // This will have { data: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch admin reviews'
      );
    }
  }
);
// --- END OF FIX ---

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearReviews: (state) => {
      state.reviews = [];
      state.stats = {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalReviews: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get product reviews
      .addCase(getProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.data || action.payload.reviews || [];
        
        if (action.payload.stats) {
          state.stats = {
            averageRating: action.payload.stats.averageRating || 0,
            totalReviews: action.payload.stats.totalReviews || 0,
            ratingDistribution: action.payload.stats.ratingDistribution || {
              5: 0,
              4: 0,
              3: 0,
              2: 0,
              1: 0,
            },
          };
        } else {
          // Calculate stats from reviews if not provided
          const reviews = state.reviews;
          const totalReviews = reviews.length;
          const avgRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;
          
          const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          reviews.forEach(r => {
            if (distribution[r.rating] !== undefined) {
              distribution[r.rating]++;
            }
          });

          state.stats = {
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews,
            ratingDistribution: distribution,
          };
        }

        state.pagination = {
          currentPage: action.payload.pagination?.currentPage || 1,
          totalPages: action.payload.pagination?.totalPages || 1,
          totalReviews: action.payload.pagination?.totalReviews || state.reviews.length,
        };
        
        console.log('✅ Reviews stored in Redux:', state.reviews.length);
        console.log('✅ Stats:', state.stats);
      })
      .addCase(getProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load reviews';
      })

      // Create review
      .addCase(createReview.pending, (state) => {
        state.submitLoading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.submitLoading = false;
        const newReview = action.payload.data || action.payload.review;
        if (newReview) {
          state.reviews.unshift(newReview);
          state.stats.totalReviews += 1;
          
          if (state.stats.ratingDistribution[newReview.rating] !== undefined) {
            state.stats.ratingDistribution[newReview.rating]++;
          }
          
          const totalRating = state.reviews.reduce((sum, r) => sum + r.rating, 0);
          state.stats.averageRating = Math.round((totalRating / state.reviews.length) * 10) / 10;
        }
      })
      .addCase(createReview.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload || 'Failed to create review';
      })

      // Update review
      .addCase(updateReview.pending, (state) => {
        state.submitLoading = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.submitLoading = false;
        const updatedReview = action.payload.data || action.payload.review;
        if (updatedReview) {
          const index = state.reviews.findIndex(r => r._id === updatedReview._id);
          if (index !== -1) {
            state.reviews[index] = updatedReview;
          }
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload || 'Failed to update review';
      })

      // Delete review
      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false;
        const deletedReview = state.reviews.find(r => r._id === action.payload.reviewId);
        
        state.reviews = state.reviews.filter(r => r._id !== action.payload.reviewId);
        state.stats.totalReviews -= 1;
        
        if (deletedReview && state.stats.ratingDistribution[deletedReview.rating] !== undefined) {
          state.stats.ratingDistribution[deletedReview.rating]--;
        }
        
        if (state.reviews.length > 0) {
          const totalRating = state.reviews.reduce((sum, r) => sum + r.rating, 0);
          state.stats.averageRating = Math.round((totalRating / state.reviews.length) * 10) / 10;
        } else {
          state.stats.averageRating = 0;
        }
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete review';
      })

      // Mark review helpful
      .addCase(markReviewHelpful.pending, (state) => {
        state.error = null;
      })
      .addCase(markReviewHelpful.fulfilled, (state, action) => {
        const updatedReview = action.payload.data || action.payload.review;
        if (updatedReview) {
          const index = state.reviews.findIndex(r => r._id === updatedReview._id);
          if (index !== -1) {
            state.reviews[index] = updatedReview;
          }
        }
      })
      .addCase(markReviewHelpful.rejected, (state, action) => {
        state.error = action.payload || 'Failed to mark review as helpful';
      })
      
      // --- START OF FIX: Reducers for Admin ---
      .addCase(getAllReviewsAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllReviewsAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllReviewsAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.reviews = [];
      });
      // --- END OF FIX ---
  },
});

export const { clearError, clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer;