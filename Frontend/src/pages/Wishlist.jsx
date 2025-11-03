// ==========================================
// FILE 6: frontend/src/pages/Wishlist.jsx
// ==========================================
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, X } from 'lucide-react';
import { getWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';
import { addToCart } from '../redux/slices/cartSlice';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { items: wishlistItems, loading } = useSelector((state) => state.wishlist);

  const products = wishlistItems
    .filter(item => item.product)
    .map(item => ({
        ...item.product,
        wishlistItemId: item._id,
        productId: item.product._id
    }));

  useEffect(() => {
    dispatch(getWishlist());
  }, [dispatch]);

  const handleRemove = async (productId) => {
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error(error || 'Failed to remove from wishlist');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      if (product.stock === 0) {
        toast.error("Product is out of stock");
        return;
      }
      
      await dispatch(addToCart({ 
        productId: product.productId,
        quantity: 1 
      })).unwrap();
      
      toast.success('Added to cart');
      await dispatch(removeFromWishlist(product.productId));
    } catch (error) {
      toast.error(error || 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 md:w-10 md:h-10 text-red-500" fill="currentColor" />
            MY WISHLIST
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            {products?.length || 0} {products?.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {/* Empty State */}
        {!products || products.length === 0 ? (
          <div className="text-center py-16 md:py-24 bg-white/5 border border-white/10 rounded">
            <Heart className="w-16 h-16 md:w-20 md:h-20 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-semibold mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-400 mb-6 text-sm md:text-base">
              Start adding products you love!
            </p>
            <Link
              to="/shop"
              className="inline-block bg-white text-black px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {products.map((product) => (
                <div
                  key={product.productId}
                  className="bg-white/5 border border-white/10 hover:border-white/30 transition-all overflow-hidden rounded relative group"
                >
                  <button
                    onClick={() => handleRemove(product.productId)}
                    className="absolute top-2 right-2 z-10 bg-black/80 rounded-full p-1.5 hover:bg-red-600 transition-colors"
                    title="Remove from wishlist"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>

                  <Link to={`/products/${product.productId}`}>
                    <div className="aspect-square overflow-hidden bg-black">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <ShoppingCart className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-2 md:p-3">
                    <Link to={`/products/${product.productId}`}>
                      <h3 className="text-xs md:text-sm font-medium text-white truncate hover:text-gray-300 transition-colors mb-1">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {product.brand && (
                      <p className="text-[10px] md:text-xs text-gray-400 mb-2 truncate uppercase">{product.brand}</p>
                    )}

                    <div className="mb-2">
                      <span className="text-sm md:text-base font-bold text-white">
                        ₹{product.price?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 bg-white text-black py-1.5 md:py-2 px-2 text-[10px] md:text-xs font-semibold uppercase hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                        disabled={product.stock === 0}
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span className="hidden sm:inline">{product.stock === 0 ? 'Out of Stock' : 'Add'}</span>
                      </button>
                      <button
                        onClick={() => handleRemove(product.productId)}
                        className="bg-red-600/20 text-red-500 py-1.5 md:py-2 px-2 hover:bg-red-600/30 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/shop"
                className="inline-block bg-white text-black px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;