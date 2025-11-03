// frontend/src/redux/slices/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/axios';

const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const initialState = {
  user: userInfoFromStorage?.user || null,
  token: userInfoFromStorage?.token || localStorage.getItem('token') || null,
  isAuthenticated: !!userInfoFromStorage,
  loading: false,
  sessionLoading: true, // ✅ FIX: Add this line. App starts in a loading state.
  error: null,
};

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

// Logout user
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      return null;
    } catch (error) {
      return null;
    }
  }
);

// Get current user (Validate session)
export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/me');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user data'
      );
    }
  }
);

// Update profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/auth/profile', profileData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update profile'
      );
    }
  }
);

// Update password
export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/auth/password', passwordData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update password'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    updateUser: (state, action) => {
      state.user = action.payload;
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo) {
        userInfo.user = action.payload;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
      }
    },
    // ✅ FIX: Add this new reducer
    setSessionLoaded: (state) => {
      state.sessionLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken || action.payload.token;
        state.isAuthenticated = true;
        
        localStorage.setItem('userInfo', JSON.stringify({
          user: action.payload.user,
          token: action.payload.accessToken || action.payload.token,
        }));
        localStorage.setItem('token', action.payload.accessToken || action.payload.token);
        if (action.payload.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.refreshToken);
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken || action.payload.token;
        state.isAuthenticated = true;
        
        localStorage.setItem('userInfo', JSON.stringify({
          user: action.payload.user,
          token: action.payload.accessToken || action.payload.token,
        }));
        localStorage.setItem('token', action.payload.accessToken || action.payload.token);
        
        if (action.payload.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.refreshToken);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        authSlice.caseReducers.clearAuth(state);
      })
      // Get Me
      .addCase(getMe.pending, (state) => {
        state.loading = true;
        // Do not change sessionLoading here, it's already true
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true; 
        state.sessionLoading = false; // ✅ FIX: Session check is complete
        
        const token = localStorage.getItem('token'); 
        localStorage.setItem('userInfo', JSON.stringify({
          user: action.payload.user,
          token: token,
        }));
        state.token = token;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.sessionLoading = false; // ✅ FIX: Session check is complete (even if failed)
        authSlice.caseReducers.clearAuth(state);
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo) {
          userInfo.user = action.payload.user;
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Password
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.token) {
          state.token = action.payload.token;
          localStorage.setItem('token', action.payload.token);
          const userInfo = JSON.parse(localStorage.getItem('userInfo'));
          if (userInfo) {
            userInfo.token = action.payload.token;
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
          }
        }
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ✅ FIX: Export the new action
export const { clearError, clearAuth, updateUser, setSessionLoaded } = authSlice.actions;
export default authSlice.reducer;