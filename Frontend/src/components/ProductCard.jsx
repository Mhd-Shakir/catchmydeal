import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';
import toast from 'react-hot-toast';

const ProductCard = ({ product, variant = 'default' }) => {
  const isCompact = variant === 'compact';

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const { items: wishlistItems = [] } = useSelector((state) => state.wishlist || { items: [] });

  if (!product || !product._id) {
    console.error('ProductCard: Invalid product data', product);
    return null;
  }

  const isInWishlist = wishlistItems?.some((item) => (item.product?._id || item._id) === product._id);

  const handleBuyNow = async (e) => {
    e.stopPropagation();
    
    if (product.stock === 0) {
      toast.error('Product out of stock');
      return;
    }

    const buyNowItem = {
      _id: `buynow-${product._id}-${Date.now()}`,
      product: product,
      price: product.price,
      quantity: 1,
      name: product.name,
      image: product.images?.[0]?.url || 'https://via.placeholder.com/300x400?text=No+Image'
    };

    sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));

    navigate('/checkout', {
      state: {
        selectedItems: [buyNowItem],
        isBuyNow: true
      }
    });
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    
    if (product.stock === 0) {
      toast.error('Product out of stock');
      return;
    }

    if (!isAuthenticated) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const existingIndex = guestCart.findIndex(item => item.productId === product._id);
      
      if (existingIndex > -1) {
        guestCart[existingIndex].quantity += 1;
      } else {
        guestCart.push({
          productId: product._id,
          quantity: 1,
          product: product,
          price: product.price
        });
      }
      
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      toast.success('Added to cart');
      
      window.dispatchEvent(new Event('guestCartUpdated'));
      
      return;
    }

    dispatch(addToCart({
      productId: product._id,
      quantity: 1,
    }));
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      navigate('/login', { 
        state: { 
          from: window.location.pathname,
          message: 'Login to save items to your wishlist' 
        } 
      });
      return;
    }

    if (isInWishlist) {
      dispatch(removeFromWishlist(product._id));
      toast.success('Removed from wishlist');
    } else {
      dispatch(addToWishlist(product._id));
      toast.success('Added to wishlist');
    }
  };

  const handleClick = () => {
    navigate(`/products/${product._id}`);
  };

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const hasRatings = product.averageRating && product.numReviews > 0;
  const ratingAverage = hasRatings ? Number(product.averageRating) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      // Use w-full to fill grid, remove fixed width
      className="group cursor-pointer relative bg-white/5 border border-white/20 transition-all duration-300 w-full rounded"
      onClick={handleClick}
    >
      {/* Image Container */}
      <div className={`relative w-full bg-black overflow-hidden ${
        // --- START OF FIX 1 ---
        // This makes the image container square in compact mode
        isCompact ? 'aspect-square' : 'h-56'
        // --- END OF FIX 1 ---
      }`}>
        
        {/* --- START OF FIX 2 ---
        // Hide all these details in compact mode */}
        {!isCompact && discountPercentage > 0 && (
          <div className="absolute top-1 left-1 z-10 bg-white text-black px-1 py-0.5 text-[10px] font-bold tracking-wider">
            {discountPercentage}% OFF
          </div>
        )}

        {!isCompact && (
          <button
            onClick={handleWishlist}
            className="absolute top-1 right-1 z-10 p-1 bg-white/90 hover:bg-white backdrop-blur-sm transition-all duration-200"
            aria-label="Add to wishlist"
          >
            <Heart
              className={`w-3 h-3 transition-colors ${
                isInWishlist ? 'fill-black text-black' : 'text-black'
              }`}
            />
          </button>
        )}
        {/* --- END OF FIX 2 --- */}

        {/* Product Image */}
        <img
          src={product.images?.[0]?.url || 'https://via.placeholder.com/300x400?text=No+Image'}
          alt={product.name || 'Product'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* --- START OF FIX 3 ---
        // Hide these overlays in compact mode */}
        {!isCompact && product.stock > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-y-full group-hover:translate-y-0 transition-all duration-300">
            <div className="flex gap-1">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-1 border border-white text-white font-bold text-[10px] hover:bg-white hover:text-black transition-colors duration-200 flex items-center justify-center gap-0.5 uppercase tracking-wider outline-none focus:outline-none"
              >
                <ShoppingCart className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-1 bg-white text-black font-bold text-[10px] hover:bg-gray-200 transition-colors duration-200 uppercase tracking-wider outline-none focus:outline-none"
              >
                Buy
              </button>
            </div>
          </div>
        )}

        {!isCompact && product.stock === 0 && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <span className="text-white font-bold text-[10px] uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
        {/* --- END OF FIX 3 --- */}
      </div>

      {/* Product Details */}
      {/* --- START OF FIX 4 ---
      // This is the new logic.
      // If compact, show ONLY the name.
      // If default, show all the details.
      // --- END OF FIX 4 --- */}
      {isCompact ? (
        // COMPACT UI: Just the name, centered
        <div className="p-3">
          <h3 className="text-white font-semibold text-sm text-center line-clamp-1 leading-tight">
            {product.name || 'Unnamed Product'}
          </h3>
        </div>
      ) : (
        // DEFAULT UI: All details
        <div className="p-2">
          {/* Brand/Category */}
          <div className="mb-1">
            <span className="text-gray-400 text-[10px] uppercase tracking-wider">
              { (typeof product.brand === 'object' ? product.brand.name : product.brand) || 
                (typeof product.category === 'object' ? product.category.name : product.category) || 
                'Product' }
            </span>
          </div>

          {/* Product Name */}
          <h3 className="text-white font-semibold text-xs mb-1 line-clamp-1 leading-tight">
            {product.name || 'Unnamed Product'}
          </h3>

          {/* Price Section */}
          <div className="flex flex-wrap items-baseline gap-1 mb-1">
            <span className="text-white font-bold text-sm">
              ₹{(product.price || 0).toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-gray-500 text-[10px] line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Rating and Stock Info */}
          <div className="flex items-center justify-between gap-1">
            {/* Rating */}
            <div className="flex items-center gap-0.5">
              {hasRatings ? (
                <div className="flex items-center gap-0.5 bg-white text-black px-0.5 py-0.5 text-[10px] font-bold">
                  <span>{ratingAverage.toFixed(1)}</span>
                  <Star className="w-2 h-2 fill-black" />
                </div>
              ) : (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star 
                      key={`empty-star-${product._id}-${index}`} 
                      className="w-2 h-2 text-gray-500" 
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Warning */}
            {product.stock > 0 && product.stock < 10 && (
              <span className="text-orange-400 text-[10px] font-semibold uppercase">
                {product.stock} left
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProductCard;