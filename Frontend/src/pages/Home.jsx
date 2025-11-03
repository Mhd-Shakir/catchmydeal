// frontend/src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Truck, Lock, RotateCcw, Star, CreditCard, Gift } from 'lucide-react';
import { getNewArrivals, getCategories } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard';
import banner1 from "../assets/pocketmoney_img_1.jpg";
import banner2 from "../assets/pocketmoney_img_2.jpg";
import banner3 from "../assets/pocketmoney_img_3.jpg";
import icon from "../assets/pocketmonet_icon-nobg.png"
import logo from "../assets/pocketmoney-nobg.png"
import men from "../assets/categories_men.jpg"
import women from "../assets/categories_women.jpg"
import accessories from "../assets/categories_accessories.jpg"

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products = [], loading, categories: dbCategories = [] } = useSelector((state) => state.products || {});
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const banners = [banner1, banner2, banner3];

  // This map translates database names (e.g., 'mens-clothing') 
  // into display-friendly names and their correct images.
  const categoryDisplayMap = {
    'mens-clothing': {
      displayName: 'Men',
      image: men,
    },
    'womens-clothing': {
      displayName: 'Women',
      image: women,
    },
    'accessories': {
      displayName: 'Accessories',
      image: accessories,
    },
  };

  // Category images map for the *fallback* logic
  const categoryImages = {
    'Men': men,
    'Women': women,
    'Accessories': accessories,
  };

  useEffect(() => {
    dispatch(getNewArrivals({ limit: 24 }));
    dispatch(getCategories());
  }, [dispatch]);

  // ✅ DEBUG: Add logging to check data structure
  useEffect(() => {
    console.log('🏠 HOME DEBUG - Products:', {
      type: typeof products,
      isArray: Array.isArray(products),
      length: products?.length,
      firstProduct: products?.[0]
    });
  }, [products]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleDragStart = (clientX) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleDragMove = (clientX) => {
    if (!isDragging) return;
    
    const diff = clientX - startX;
    if (Math.abs(diff) > 80) {
      if (diff > 0) {
        prevBanner();
      } else {
        nextBanner();
      }
      setIsDragging(false);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/shop?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="bg-black text-white">
      {/* Banner Carousel Section */}
      <section className="relative overflow-hidden bg-black">
        <div className="relative w-full">
          <div 
            className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] xl:h-[90vh] cursor-grab active:cursor-grabbing select-none"
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onMouseMove={(e) => handleDragMove(e.clientX)}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
            onTouchEnd={handleDragEnd}
          >
            <div 
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            >
              {banners.map((banner, index) => (
                <div key={`banner-${index}`} className="w-full h-full flex-shrink-0">
                  <img 
                    src={banner} 
                    alt={`Pocket Money Banner ${index + 1}`}
                    className="w-full h-full object-cover object-center pointer-events-none"
                  />
                </div>
              ))}
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 z-[1] pointer-events-none" />

            <div className="absolute inset-0 flex items-center justify-center z-[2] pointer-events-none">
              <div className="max-w-4xl mx-auto px-4 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 xl:w-60 xl:h-60 -mb-6 sm:-mb-8 md:-mb-12 lg:-mb-16 xl:-mb-20">
                    <img 
                      src={icon} 
                      alt="Pocket Money Icon" 
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>
                  
                  <div className="w-44 h-auto sm:w-56 md:w-72 lg:w-80 xl:w-96 mb-0.5 sm:mb-1 md:mb-1">
                    <img 
                      src={logo} 
                      alt="Pocket Money Logo" 
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm sm:text-base md:text-lg lg:text-xl text-white font-light drop-shadow-lg px-4 mb-1 sm:mb-1.5 md:mb-2"
                  >
                    Premium quality. Affordable prices. Smart shopping.
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="pointer-events-auto"
                  >
                    <Link
                      to="/shop"
                      className="inline-block bg-white text-black px-6 sm:px-10 md:px-12 py-2.5 sm:py-3 md:py-3.5 text-xs sm:text-sm font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors shadow-xl"
                    >
                      Shop Now
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 tracking-tight">
            SHOP BY CATEGORY
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto">
            {Array.isArray(dbCategories) && dbCategories.length > 0 ? (
              // Map over the categories from the database
              dbCategories.filter(Boolean).map((category) => {
                // Find the display info (name and image) from our map
                const displayInfo = categoryDisplayMap[category.name.toLowerCase()];

                // If this category (e.g., 'electronics') isn't in our map, don't show it
                if (!displayInfo) {
                  return null;
                }

                return (
                  <button
                    key={`category-${displayInfo.displayName}`}
                    // Pass the clean display name (e.g., "Men") to the click handler
                    onClick={() => handleCategoryClick(displayInfo.displayName)}
                    className="group bg-white/5 border border-white/10 hover:border-white/30 transition-all overflow-hidden rounded cursor-pointer"
                  >
                    <div className="aspect-square overflow-hidden relative">
                      <img 
                        src={displayInfo.image} // Use the correct image from the map
                        alt={displayInfo.displayName} // Use the correct alt text
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold tracking-wide uppercase text-white z-10 px-2 text-center">
                          {displayInfo.displayName} {/* Show the clean display name */}
                        </h3>
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              // Fallback logic if categories aren't loaded yet
              ['Men', 'Women', 'Accessories'].map((category) => (
                <button
                  key={`default-category-${category}`}
                  onClick={() => handleCategoryClick(category)}
                  className="group bg-white/5 border border-white/10 hover:border-white/30 transition-all overflow-hidden rounded cursor-pointer"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img 
                      src={categoryImages[category]}
                      alt={category}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold tracking-wide uppercase text-white z-10 px-2 text-center">
                        {category}
                      </h3>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Liquid Scrolling Text */}
      <section className="py-6 bg-black overflow-hidden">
        <div className="liquid-scroll-container">
          <div className="liquid-scroll-text">
            NEW NEW NEW NEW NEW NEW NEW NEW NEW NEW NEW NEW NEW NEW NEW NEW
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <div className="flex justify-end items-center mb-8 md:mb-12">
            <Link 
              to="/shop" 
              className="text-xs sm:text-sm tracking-widest uppercase hover:text-gray-300 transition-colors border-b border-white pb-1"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : Array.isArray(products) && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto">
              {products.filter(Boolean).map((product) => {
                if (!product || !product._id) {
                  console.warn('⚠️ Skipping invalid product:', product);
                  return null;
                }
                
                return (
                  // Using variant="compact" for the desired minimalist look on the homepage
                  <ProductCard 
                    key={`home-product-${product._id}`}
                    product={product} 
                    variant="compact"
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No products available yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/5 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">WHY CHOOSE US</h2>
          </div>

          <div className="relative">
            <div className="overflow-hidden">
              <div 
                className="flex gap-8 md:gap-12"
                style={{
                  animation: 'scroll 18s linear infinite'
                }}
              >
                {[
                  { Icon: Truck, title: 'Free Shipping', desc: 'Orders above ₹500' },
                  { Icon: Lock, title: 'Secure Payment', desc: '100% secure' },
                  { Icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy' },
                  { Icon: Star, title: 'Premium Quality', desc: 'Top-notch materials' },
                  { Icon: CreditCard, title: 'Flexible Payment', desc: 'Multiple options' },
                  { Icon: Gift, title: 'Gift Wrapping', desc: 'Free packaging' },
                  { Icon: Truck, title: 'Free Shipping', desc: 'Orders above ₹500' },
                  { Icon: Lock, title: 'Secure Payment', desc: '100% secure' },
                  { Icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy' },
                  { Icon: Star, title: 'Premium Quality', desc: 'Top-notch materials' },
                  { Icon: CreditCard, title: 'Flexible Payment', desc: 'Multiple options' },
                  { Icon: Gift, title: 'Gift Wrapping', desc: 'Free packaging' },
                  { Icon: Truck, title: 'Free Shipping', desc: 'Orders above ₹500' },
                  { Icon: Lock, title: 'Secure Payment', desc: '100% secure' },
                  { Icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy' },
                  { Icon: Star, title: 'Premium Quality', desc: 'Top-notch materials' },
                  { Icon: CreditCard, title: 'Flexible Payment', desc: 'Multiple options' },
                  { Icon: Gift, title: 'Gift Wrapping', desc: 'Free packaging' },
                ].map((feature, index) => (
                  <div 
                    key={`feature-${feature.title}-${index}`}
                    className="flex-shrink-0 w-36 sm:w-44 md:w-48 text-center"
                  >
                    <feature.Icon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-white" strokeWidth={1.5} />
                    <h3 className="text-xs sm:text-sm font-semibold mb-2 tracking-wide uppercase">{feature.title}</h3>
                    <p className="text-gray-400 text-[10px] sm:text-xs">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-66.666%);
          }
        }

        .liquid-scroll-container {
          width: 100%;
          overflow: hidden;
          position: relative;
        }

        .liquid-scroll-text {
          display: inline-block;
          white-space: nowrap;
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: 0.3em;
          animation: liquidScroll 20s linear infinite;
          background: linear-gradient(90deg, #ffffff 0%, #e0e0e0 25%, #ffffff 50%, #e0e0e0 75%, #ffffff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: liquidScroll 20s linear infinite, shimmer 3s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
        }

        @keyframes liquidScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @media (max-width: 640px) {
          .liquid-scroll-text {
            font-size: 1rem;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .liquid-scroll-text {
            font-size: 1.5rem;
          }
        }
      `}</style>

      {/* CTA Section */}
      <section className="py-24 bg-white text-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6 tracking-tight">READY TO START?</h2>
          <div className="w-32 h-px bg-black mx-auto mb-6" />
          <p className="text-xl mb-12 text-gray-600 max-w-2xl mx-auto font-light">
            Join thousands of satisfied customers. Quality products at prices that make sense.
          </p> 
          <Link
            to="/shop"
            className="inline-block bg-black text-white px-12 py-4 text-sm font-bold tracking-widest uppercase hover:bg-gray-900 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">STAY UPDATED</h3>
          <p className="text-gray-400 mb-8 text-sm sm:text-base">Subscribe to get special offers and updates</p>
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-white/5 border border-white/20 px-4 sm:px-6 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 text-sm sm:text-base"
              />
              <button className="bg-white text-black px-6 sm:px-8 py-3 font-semibold uppercase text-sm hover:bg-gray-200 transition-colors whitespace-nowrap">
                Join
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;