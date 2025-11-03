import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import logo from "../assets/pocketmoney_logo.png"
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaShoppingCart } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { name, email, password, confirmPassword } = formData;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, isAuthenticated, user } = useSelector((state) => state.auth);

  const from = location.state?.from || '/';
  const message = location.state?.message;

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check for checkout data in sessionStorage
      const checkoutData = sessionStorage.getItem('checkoutData');
      const buyNowItem = sessionStorage.getItem('buyNowItem');
      
      if (checkoutData) {
        try {
          const data = JSON.parse(checkoutData);
          navigate('/checkout', { 
            state: data,
            replace: true 
          });
          return;
        } catch (error) {
          console.error('Error parsing checkout data:', error);
        }
      }
      
      if (buyNowItem) {
        try {
          const item = JSON.parse(buyNowItem);
          navigate('/checkout', { 
            state: {
              selectedItems: [item],
              isBuyNow: true
            },
            replace: true 
          });
          return;
        } catch (error) {
          console.error('Error parsing buy now item:', error);
        }
      }
      
      // Admin redirect
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, from]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await dispatch(register({ name, email, password })).unwrap();
      toast.success('Registration successful!');
    } catch (error) {
      toast.error(error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo Section */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <img src={logo} alt="" />
          </div>
          
          <h2 className="mt-8 text-2xl font-bold text-white">
            Create your account
          </h2>
          {message && (
            <div className="mt-4 p-3 bg-white border-2 border-white rounded-lg">
              <p className="text-sm text-black text-center font-medium">{message}</p>
            </div>
          )}
          <p className="mt-2 text-sm text-gray-400">
            Or{' '}
            <Link
              to="/login"
              state={location.state}
              className="font-medium text-white hover:text-gray-300 underline"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={onChange}
                  className="appearance-none relative block w-full pl-10 px-3 py-3 border-2 border-white bg-black placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={onChange}
                  className="appearance-none relative block w-full pl-10 px-3 py-3 border-2 border-white bg-black placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={onChange}
                  className="appearance-none relative block w-full pl-10 pr-10 px-3 py-3 border-2 border-white bg-black placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm"
                  placeholder="Create a password (min. 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-white" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-white" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={onChange}
                  className="appearance-none relative block w-full pl-10 pr-10 px-3 py-3 border-2 border-white bg-black placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-white" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 bg-black border-2 border-white rounded focus:ring-2 focus:ring-white"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-white">
              I agree to the{' '}
              <a href="#" className="text-white hover:text-gray-300 underline">
                Terms and Conditions
              </a>
            </label>
          </div>

          <div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border-2 border-white text-sm font-bold rounded-lg text-black bg-white hover:bg-black hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;