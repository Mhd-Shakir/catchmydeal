// frontend/src/components/common/Header.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaShoppingCart, FaHeart, FaSearch, FaBars, FaTimes, FaBox, FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaUser, FaUserCircle } from 'react-icons/fa';
import { logout } from '../../redux/slices/authSlice';
import toast from 'react-hot-toast';
import pocketmoney_logo from "../../assets/pocketmoney_logo.png";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- START OF DROPDOWN FIX ---
  const [shopTimer, setShopTimer] = useState(null);
  const [profileTimer, setProfileTimer] = useState(null);
  // --- END OF DROPDOWN FIX ---
  
  // --- START OF CART FIX ---
  const [guestCartCount, setGuestCartCount] = useState(0);
  // --- END OF CART FIX ---

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { totalItems } = useSelector((state) => state.cart);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      if (currentScrollY < 10) {
        setIsBottomNavVisible(false);
      } else if (currentScrollY > lastScrollY) {
        setIsBottomNavVisible(true);
      } else {
        setIsBottomNavVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  // This effect syncs the guest cart count from localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      const updateGuestCartCount = () => {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        setGuestCartCount(guestCart.length);
      };

      updateGuestCartCount(); // Initial check

      // Listen for the custom event from ProductCard
      window.addEventListener('guestCartUpdated', updateGuestCartCount);
      // Listen for storage changes (e.g., from other tabs)
      window.addEventListener('storage', updateGuestCartCount);

      return () => {
        window.removeEventListener('guestCartUpdated', updateGuestCartCount);
        window.removeEventListener('storage', updateGuestCartCount);
      };
    } else {
      // If user logs in, reset guest count
      setGuestCartCount(0);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/');
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${searchQuery}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setIsMobileSearchOpen(false);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  // Dropdown handlers (Shop)
  const handleShopEnter = () => {
    if (shopTimer) {
      clearTimeout(shopTimer); // Cancel any pending "close" timer
      setShopTimer(null);
    }
    setIsShopDropdownOpen(true); // Open the menu
  };

  const handleShopLeave = () => {
    // Start a timer to close the menu
    const timer = setTimeout(() => {
      setIsShopDropdownOpen(false);
    }, 200); // 200ms delay
    setShopTimer(timer);
  };

  // Dropdown handlers (Profile)
  const handleProfileEnter = () => {
    if (profileTimer) {
      clearTimeout(profileTimer); // Cancel any pending "close" timer
      setProfileTimer(null);
    }
    setIsProfileDropdownOpen(true); // Open the menu
  };

  const handleProfileLeave = () => {
    // Start a timer to close the menu
    const timer = setTimeout(() => {
      setIsProfileDropdownOpen(false);
    }, 200); // 200ms delay
    setProfileTimer(timer);
  };
  
  // This variable will hold the correct cart count to display (Authenticated vs. Guest)
  const displayCartCount = isAuthenticated ? totalItems : guestCartCount;

  return (
    <>
      <header className={`bg-black fixed top-0 left-0 right-0 z-50 text-white border-b border-white/20 transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="w-full px-4 py-4">
            <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
              <Link to="/" className="flex items-center gap-3 flex-shrink-0">
                <div className="w-24 lg:w-32 h-10 lg:h-12">
                  <img src={pocketmoney_logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
              </Link>

              <nav className="flex items-center gap-6 lg:gap-10">
                <Link to="/" className="text-base lg:text-lg font-medium hover:text-gray-300 transition whitespace-nowrap">
                  Home
                </Link>
                
                <div 
                  className="relative"
                  onMouseEnter={handleShopEnter}
                  onMouseLeave={handleShopLeave}
                >
                  <button className="text-base lg:text-lg font-medium hover:text-gray-300 transition whitespace-nowrap">
                    Shop
                  </button>
                  {isShopDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-black border border-white/20 rounded shadow-lg py-2 z-50">
                      <Link
                        to="/shop?category=Men"
                        className="block px-4 py-3 hover:bg-white/10 transition"
                      >
                        Men
                      </Link>
                      <Link
                        to="/shop?category=Women"
                        className="block px-4 py-3 hover:bg-white/10 transition"
                      >
                        Women
                      </Link>
                      <Link
                        to="/shop?category=Accessories"
                        className="block px-4 py-3 hover:bg-white/10 transition"
                      >
                        Accessories
                      </Link>
                    </div>
                  )}
                </div>

                <Link to="/about" className="text-base lg:text-lg font-medium hover:text-gray-300 transition whitespace-nowrap">
                  About
                </Link>
              </nav>

              <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="text-xl lg:text-2xl hover:text-gray-300 transition"
                >
                  <FaSearch />
                </button>

                <Link to="/wishlist" className="relative text-xl lg:text-2xl hover:text-gray-300 transition">
                  <FaHeart />
                  {wishlistItems?.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>

                <Link to="/cart" className="relative text-xl lg:text-2xl hover:text-gray-300 transition">
                  <FaShoppingCart />
                  {displayCartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {displayCartCount}
                    </span>
                  )}
                </Link>

                {isAuthenticated ? (
                  <div 
                    className="relative"
                    onMouseEnter={handleProfileEnter}
                    onMouseLeave={handleProfileLeave}
                  >
                    <button className="text-xl lg:text-2xl hover:text-gray-300 transition">
                      <FaUserCircle />
                    </button>
                    {isProfileDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-black border border-white/20 rounded shadow-lg py-2 z-50">
                        <Link
                          to="/profile"
                          className="block px-4 py-3 hover:bg-white/10 transition"
                        >
                          Profile
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-4 py-3 hover:bg-white/10 transition"
                        >
                          Orders
                        </Link>
                        {user?.role === 'admin' && (
                          <Link
                            to="/admin"
                            className="block px-4 py-3 hover:bg-white/10 transition"
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-3 text-red-400 hover:bg-white/10 transition"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/login" className="text-xl lg:text-2xl hover:text-gray-300 transition">
                    <FaUser />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center flex-shrink-0">
                <div className="w-28 h-10">
                  <img src={pocketmoney_logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
              </Link>

              <div className="flex items-center gap-4 flex-shrink-0">
                <button
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="text-xl hover:text-gray-300 transition"
                >
                  <FaSearch />
                </button>

                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="text-2xl hover:text-gray-300 transition"
                >
                  <FaBars />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="h-[72px] md:h-[80px]"></div>

      {/* Mobile Bottom Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-white/20 z-40 transition-transform duration-300 ${
        isBottomNavVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex items-center justify-around py-3 px-2">
          <Link to="/" className="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition min-w-0 flex-1">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-xs">Home</span>
          </Link>

          <Link to="/shop" className="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition min-w-0 flex-1">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            <span className="text-xs">Shop</span>
          </Link>

          <Link to="/orders" className="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition min-w-0 flex-1">
            <FaBox className="text-xl" />
            <span className="text-xs">Orders</span>
          </Link>

          <Link to="/wishlist" className="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition relative min-w-0 flex-1">
            <FaHeart className="text-xl" />
            {wishlistItems?.length > 0 && (
              <span className="absolute top-0 right-1/4 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {wishlistItems.length}
              </span>
            )}
            <span className="text-xs">Wishlist</span>
          </Link>

          <Link to="/cart" className="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition relative min-w-0 flex-1">
            <FaShoppingCart className="text-xl" />
            {displayCartCount > 0 && (
              <span className="absolute top-0 right-1/4 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {displayCartCount}
              </span>
            )}
            <span className="text-xs">Cart</span>
          </Link>
        </div>
      </div>

      {/* Desktop Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] hidden md:flex">
          <div className="w-3/4 bg-black border-r border-white/20 p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-white text-2xl font-bold">Search</h2>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-white text-3xl hover:text-gray-300 transition"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                // --- FIX APPLIED HERE: Changed 'e.g' to 'e' ---
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-4 bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded focus:outline-none focus:bg-white/15 focus:border-white/40 transition text-lg"
                autoFocus
              />
              <button
                type="submit"
                className="w-full mt-4 bg-white text-black font-bold px-6 py-4 rounded hover:bg-gray-200 transition text-lg"
              >
                Search
              </button>
            </form>
          </div>
          <div 
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          />
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex">
          <div 
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          <div className="w-[85%] bg-black h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-white text-xl font-bold">Menu</h2>
                <button
                  onClick={closeMobileMenu}
                  className="text-white text-2xl hover:text-gray-300 transition"
                >
                  <FaTimes />
                </button>
              </div>

              <nav className="flex flex-col gap-6 mb-8">
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className="text-white text-lg font-medium hover:text-gray-300 transition"
                >
                  Home
                </Link>

                <div className="flex flex-col gap-3">
                  <p className="text-white text-lg font-medium">Shop</p>
                  <Link
                    to="/shop?category=Men"
                    onClick={closeMobileMenu}
                    className="text-white/70 pl-4 hover:text-white transition"
                  >
                    Men
                  </Link>
                  <Link
                    to="/shop?category=Women"
                    onClick={closeMobileMenu}
                    className="text-white/70 pl-4 hover:text-white transition"
                  >
                    Women
                  </Link>
                  <Link
                    to="/shop?category=Accessories"
                    onClick={closeMobileMenu}
                    className="text-white/70 pl-4 hover:text-white transition"
                  >
                    Accessories
                  </Link>
                </div>

                <Link
                  to="/about"
                  onClick={closeMobileMenu}
                  className="text-white text-lg font-medium hover:text-gray-300 transition"
                >
                  About
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={closeMobileMenu}
                      className="text-white text-lg font-medium hover:text-gray-300 transition"
                    >
                      Profile
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={closeMobileMenu}
                        className="text-white text-lg font-medium hover:text-gray-300 transition"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-red-400 text-lg font-medium hover:text-red-300 transition text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="text-white text-lg font-medium hover:text-gray-300 transition"
                  >
                    Login
                  </Link>
                )}
              </nav>

              <div className="border-t border-white/20 pt-6">
                <p className="text-white text-sm font-medium mb-4">Follow Us</p>
                <div className="flex gap-4">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-2xl hover:text-blue-500 transition"
                  >
                    <FaFacebook />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-2xl hover:text-pink-500 transition"
                  >
                    <FaInstagram />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-2xl hover:text-blue-400 transition"
                  >
                    <FaTwitter />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-2xl hover:text-red-500 transition"
                  >
                    <FaYoutube />
                  </a>
                </div>
              </div>

              <div className="border-t border-white/20 mt-6 pt-6">
                <p className="text-white text-sm font-medium mb-2">Contact</p>
                <a
                  href="mailto:support@pocketmoney.com"
                  className="text-white/70 text-sm hover:text-white transition break-all"
                >
                  support@pocketmoney.com
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[100] md:hidden bg-black overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-white text-xl font-bold">Search</h2>
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="text-white text-2xl hover:text-gray-300 transition"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="w-full mb-8">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-4 bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded focus:outline-none focus:bg-white/15 focus:border-white/40 transition text-lg"
                autoFocus
              />
              <button
                type="submit"
                className="w-full mt-4 bg-white text-black font-bold px-6 py-4 rounded hover:bg-gray-200 transition text-lg"
              >
                Search
              </button>
            </form>

            <div className="flex gap-6 justify-center flex-wrap">
              <Link 
                to="/wishlist" 
                onClick={() => setIsMobileSearchOpen(false)}
                className="flex flex-col items-center gap-2"
              >
                <div className="relative text-white text-3xl hover:text-gray-300 transition">
                  <FaHeart />
                  {wishlistItems?.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {wishlistItems.length}
                    </span>
                  )}
                </div>
                <span className="text-white text-sm">Wishlist</span>
              </Link>

              <Link 
                to="/orders" 
                onClick={() => setIsMobileSearchOpen(false)}
                className="flex flex-col items-center gap-2"
              >
                <div className="text-white text-3xl hover:text-gray-300 transition">
                  <FaBox />
                </div>
                <span className="text-white text-sm">Orders</span>
              </Link>

              <Link 
                to="/cart" 
                onClick={() => setIsMobileSearchOpen(false)}
                className="flex flex-col items-center gap-2"
              >
                <div className="relative text-white text-3xl hover:text-gray-300 transition">
                  <FaShoppingCart />
                  {displayCartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {displayCartCount}
                    </span>
                  )}
                </div>
                <span className="text-white text-sm">Cart</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;