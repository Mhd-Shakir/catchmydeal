// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

// Layouts & Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import AdminLayout from './components/common/AdminLayout';
import ScrollToTop from './components/common/ScrollToTop';

// Redux actions
import { getWishlist } from './redux/slices/wishlistSlice';
import { getCart } from './redux/slices/cartSlice';

// Public Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductPage from './pages/ProductPage';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AddProduct from './pages/admin/AddProduct';
import AdminReviews from './pages/admin/AdminReviews';
import AdminSettings from './pages/admin/AdminSettings';

// --- Axios Global Configuration ---
// The correct URL is injected here by Vercel/Vite environment variable (VITE_API_URL).
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

// Request interceptor to add the authorization token to headers
axios.interceptors.request.use(
  (config) => {
    // Only attempt to get token if running in a browser
    if (typeof window !== 'undefined') { 
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh on 401 Unauthorized errors
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 and if the request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error("No refresh token available.");
        }
        
        // This refresh call itself uses the global axios instance, so we don't need the window check here.
        const { data } = await axios.post('/api/auth/refresh', { refreshToken }); 
        
        localStorage.setItem('token', data.accessToken);
        
        // Update the header of the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        // Retry the original request with the new token
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        
        // Only redirect to login if not already on login/register page
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Layout wrapper component to reduce repetition
const PageLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-grow">
      {children}
    </main>
    <Footer />
  </div>
);

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // ----------------------------------------------------------------------
    // 🛑 THE CRITICAL FIX: Skip this logic if the app is NOT running in a browser environment
    // The 'window' object is undefined during Vercel's server-side build process.
    if (typeof window === 'undefined') {
        return; 
    }
    // ----------------------------------------------------------------------
    
    // Load user data when authenticated
    if (isAuthenticated) {
      // Fetch wishlist and cart silently (don't block UI on errors)
      dispatch(getWishlist()).catch((err) => {
        console.error('Failed to load wishlist:', err);
      });
      
      dispatch(getCart()).catch((err) => {
        console.error('Failed to load cart:', err);
      });
    }
  }, [dispatch, isAuthenticated]);

  return (
    <Router>
      <ScrollToTop />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            zIndex: 9999,
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        {/* Public Routes with Header/Footer */}
        <Route path="/" element={<PageLayout><Home /></PageLayout>} />
        <Route path="/shop" element={<PageLayout><Shop /></PageLayout>} />
        
        {/* Product Routes - Support both /product/:id AND /products/:id */}
        <Route path="/product/:id" element={<PageLayout><ProductPage /></PageLayout>} />
        <Route path="/products/:id" element={<PageLayout><ProductPage /></PageLayout>} />
        
        <Route path="/login" element={<PageLayout><Login /></PageLayout>} />
        <Route path="/register" element={<PageLayout><Register /></PageLayout>} />
        <Route path="/checkout" element={<PageLayout><Checkout /></PageLayout>} />

        {/* Protected Routes with Header/Footer */}
        <Route path="/cart" element={
          <ProtectedRoute>
            <PageLayout><Cart /></PageLayout>
          </ProtectedRoute>
        } />
        
        {/* Orders Routes - List & Details */}
        <Route path="/orders" element={
          <ProtectedRoute>
            <PageLayout><Orders /></PageLayout>
          </ProtectedRoute>
        } />

        <Route path="/orders/:id" element={
          <ProtectedRoute>
            <PageLayout><OrderDetails /></PageLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/wishlist" element={
          <ProtectedRoute>
            <PageLayout><Wishlist /></PageLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <PageLayout><Profile /></PageLayout>
          </ProtectedRoute>
        } />

        {/* Admin Routes - No Header/Footer, uses AdminLayout with sidebar */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/add" element={<AddProduct />} />
          
          {/* This new route handles editing a product by its ID */}
          <Route path="products/edit/:id" element={<AddProduct />} />

          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* 404 Not Found Route */}
        <Route path="*" element={
          <PageLayout>
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
              <div className="text-center py-20">
                <h1 className="text-6xl font-bold mb-4">404</h1>
                <p className="text-xl text-gray-400 mb-8">Page Not Found</p>
                <a 
                  href="/" 
                  className="inline-block bg-white text-black px-8 py-3 font-bold hover:bg-gray-200 transition uppercase tracking-wide"
                >
                  Go Home
                </a>
              </div>
            </div>
          </PageLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;