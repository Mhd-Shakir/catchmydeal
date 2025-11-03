import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProductById, getSimilarProducts } from '../redux/slices/productSlice';
import { getProductReviews, createReview, deleteReview, markReviewHelpful } from '../redux/slices/reviewSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { addToWishlist } from '../redux/slices/wishlistSlice';
import { FaStar, FaHeart, FaShoppingCart, FaMinus, FaPlus, FaThumbsUp, FaTrash, FaCamera, FaTimes, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { product, loading, similarProducts = [], similarLoading } = useSelector((state) => state.products);
  const { reviews = [], stats = {}, submitLoading } = useSelector((state) => state.reviews);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    console.log('📄 Product ID changed:', id);
    dispatch(getProductById(id));
    dispatch(getProductReviews({ productId: id, limit: 20 }));
    dispatch(getSimilarProducts(id));
  }, [dispatch, id]);

  useEffect(() => {
    console.log('📦 Similar Products State:', similarProducts);
    console.log('📦 Similar Products Type:', typeof similarProducts);
    console.log('📦 Similar Products Is Array:', Array.isArray(similarProducts));
    console.log('⏳ Similar Loading:', similarLoading);
  }, [similarProducts, similarLoading]);

  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast.error('Product out of stock');
      return;
    }
    dispatch(addToCart({ productId: product._id, quantity }));
    toast.success('Added to cart');
  };

  // ✅ FIXED: handleAddToWishlist with proper async/await
  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }
    
    try {
      await dispatch(addToWishlist(product._id)).unwrap();
      toast.success('Added to wishlist');
    } catch (error) {
      // Handle specific error messages
      if (error === 'Product already in wishlist') {
        toast.error('Product is already in your wishlist');
      } else {
        toast.error(error || 'Failed to add to wishlist');
      }
    }
  };

  const handleBuyNow = () => {
    if (product.stock === 0) {
      toast.error('Product out of stock');
      return;
    }
    const buyNowItem = {
      _id: `buynow-${product._id}-${Date.now()}`,
      product: product,
      price: product.price,
      quantity: quantity,
      name: product.name,
      image: product.images?.[0]?.url || 'https://via.placeholder.com/300x400?text=No+Image'
    };
    navigate('/checkout', {
      state: { selectedItems: [buyNowItem], isBuyNow: true }
    });
  };

  const handleWriteReviewClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to write a review', {
        duration: 4000,
        icon: '🔒',
      });
      navigate('/login', { state: { from: `/product/${id}`, message: 'Login to write a review' } });
      return;
    }
    setShowReviewForm(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + reviewImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Use blob URLs for UI previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);

    // Read files as Data URIs for the backend
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewImages(prev => [...prev, reader.result]); 
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = reviewImages.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setReviewImages(newImages);
    setPreviewImages(newPreviews);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to write a review');
      navigate('/login');
      return;
    }

    if (!reviewTitle.trim() || !reviewComment.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    const reviewData = {
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
      images: reviewImages,
    };

    try {
      await dispatch(createReview({ productId: id, reviewData })).unwrap();
      toast.success('Review submitted successfully!');
      
      setShowReviewForm(false);
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
      setReviewImages([]);
      setPreviewImages([]);
      
      dispatch(getProductReviews({ productId: id, limit: 20 }));
    } catch (error) {
      toast.error(error || 'Failed to submit review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await dispatch(deleteReview(reviewId)).unwrap();
        toast.success('Review deleted');
        dispatch(getProductReviews({ productId: id, limit: 20 }));
      } catch (error) {
        toast.error(error || 'Failed to delete review');
      }
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      toast.error('Please login to mark as helpful');
      navigate('/login');
      return;
    }
    try {
      await dispatch(markReviewHelpful(reviewId)).unwrap();
      toast.success('Marked as helpful');
    } catch (error) {
      toast.error(error || 'Already marked as helpful');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-black text-white min-h-screen">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 tracking-tight uppercase">Product Not Found</h2>
        <button
          onClick={() => navigate('/shop')}
          className="border border-white px-5 sm:px-6 py-2.5 sm:py-3 hover:bg-white hover:text-black transition-colors uppercase text-xs sm:text-sm tracking-widest"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const productImages = product.images && product.images.length > 0 ? product.images : [{ url: '/placeholder.jpg' }];
  const userHasReviewed = Array.isArray(reviews) && reviews.some(review => review.user?._id === user?._id);

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-3 sm:space-y-4">
            <div className="border border-white/20 overflow-hidden bg-white/5">
              <img
                src={productImages[selectedImage]?.url || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-64 sm:h-96 md:h-[500px] lg:h-[600px] object-cover"
              />
            </div>
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {productImages.map((image, index) => (
                  <button
                    key={`product-img-${index}`}
                    onClick={() => setSelectedImage(index)}
                    className={`border overflow-hidden transition-colors ${
                      selectedImage === index ? 'border-white' : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-16 sm:h-20 md:h-24 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <span className="text-xs sm:text-sm text-gray-400 uppercase tracking-widest">
                {(typeof product.category === 'object' ? product.category.name : product.category) || 'Uncategorized'}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-2 sm:mt-3 mb-4 sm:mb-6 tracking-tight leading-tight">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex flex-wrap items-center gap-3 pb-4 sm:pb-6 border-b border-white/10">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={`rating-star-${i}`}
                      className={`${
                        i < Math.round(stats.averageRating || 0)
                          ? 'text-white'
                          : 'text-white/20'
                      } w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5`}
                    />
                  ))}
                </div>
                <span className="text-gray-400 text-xs sm:text-sm">
                  {stats.averageRating > 0 ? stats.averageRating : '0.0'} ({stats.totalReviews || 0} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="pb-6 sm:pb-8 border-b border-white/10">
              <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 md:gap-4 mb-2">
                <span className="text-3xl sm:text-4xl md:text-5xl font-bold">₹{product.price}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg sm:text-xl md:text-2xl text-gray-500 line-through">
                      ₹{product.originalPrice}
                    </span>
                    <span className="border border-white px-2 sm:px-3 py-1 text-xs font-bold tracking-wider">
                      {discountPercentage}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Inclusive of all taxes</p>
            </div>

            {/* Stock Status */}
            <div className="pb-6 sm:pb-8 border-b border-white/10">
              {product.stock > 0 ? (
                <p className="text-xs sm:text-sm">
                  <span className="font-semibold uppercase tracking-wide">In Stock</span>
                  <span className="text-gray-400 ml-2">({product.stock} available)</span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm">
                  <span className="font-semibold uppercase tracking-wide text-red-400">Out of Stock</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div className="pb-6 sm:pb-8 border-b border-white/10">
              <h3 className="font-bold mb-2 sm:mb-3 uppercase tracking-wide text-xs sm:text-sm">Description</h3>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">{product.description}</p>
            </div>

            {product.brand && (
              <div className="pb-6 sm:pb-8 border-b border-white/10">
                <p className="text-xs sm:text-sm">
                  <span className="font-semibold uppercase tracking-wide">Brand:</span>{' '}
                  <span className="text-gray-400">
                    {(typeof product.brand === 'object' ? product.brand.name : product.brand)}
                  </span>
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <label className="block font-bold mb-3 sm:mb-4 uppercase tracking-wide text-xs sm:text-sm">Quantity:</label>
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 sm:w-12 sm:h-12 border border-white/30 hover:bg-white hover:text-black transition-colors flex items-center justify-center font-bold"
                >
                  <FaMinus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <span className="text-xl sm:text-2xl font-bold w-12 sm:w-16 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="w-10 h-10 sm:w-12 sm:h-12 border border-white/30 hover:bg-white hover:text-black transition-colors flex items-center justify-center font-bold disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
                >
                  <FaPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-white text-black py-3 sm:py-3.5 md:py-4 font-bold hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 transition-colors uppercase text-xs sm:text-sm tracking-widest"
              >
                <FaShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="w-full border-2 border-white text-white py-3 sm:py-3.5 md:py-4 font-bold hover:bg-white hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors uppercase text-xs sm:text-sm tracking-widest"
              >
                Buy Now
              </button>
              <button
                onClick={handleAddToWishlist}
                className="w-full border border-white/30 text-white py-3 sm:py-3.5 md:py-4 font-semibold hover:bg-white/5 flex items-center justify-center gap-2 sm:gap-3 transition-colors uppercase text-xs sm:text-sm tracking-widest"
              >
                <FaHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Add to Wishlist
              </button>
            </div>

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="pt-8 sm:pt-10 md:pt-12 border-t border-white/10">
                <h3 className="font-bold mb-4 sm:mb-6 uppercase tracking-wide text-xs sm:text-sm">Specifications</h3>
                <div className="space-y-3 sm:space-y-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    value && (
                      <div key={key} className="flex flex-col sm:flex-row border-b border-white/10 pb-3 sm:pb-4 gap-1 sm:gap-0">
                        <span className="font-medium sm:w-1/3 capitalize text-xs sm:text-sm uppercase tracking-wide">{key}:</span>
                        <span className="text-gray-400 sm:w-2/3 text-xs sm:text-sm">{value}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products Section */}
        <div className="mt-12 sm:mt-16 md:mt-20 pt-8 sm:pt-10 md:pt-12 border-t border-white/10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 tracking-tight uppercase">You May Also Like</h2>
          
          {similarLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : Array.isArray(similarProducts) && similarProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {similarProducts.map((item) => (
                <Link
                  key={item._id}
                  to={`/products/${item._id}`}
                  className="group"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <div className="bg-white/5 border border-white/10 hover:border-white/30 transition-all overflow-hidden rounded">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={item?.images?.[0]?.url || '/placeholder.jpg'}
                        alt={item?.name || 'Product'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2 sm:p-3">
                      <h3 className="text-xs sm:text-sm font-medium text-white truncate">
                        {item?.name || 'Unknown Product'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs sm:text-sm font-bold">₹{item?.price?.toLocaleString('en-IN') || '0'}</p>
                        {item?.originalPrice && (
                          <p className="text-xs text-gray-500 line-through">₹{item.originalPrice}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded">
              <p className="text-gray-400">No similar products found in this category</p>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mt-12 sm:mt-16 md:mt-20 pt-8 sm:pt-10 md:pt-12 border-t border-white/10">
          {/* Rating Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-1 text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight uppercase">Customer Reviews</h2>
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <span className="text-5xl font-bold">{stats?.averageRating || '0.0'}</span>
                <div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={`overview-star-${i}`}
                        className={`${
                          i < Math.round(stats?.averageRating || 0)
                            ? 'text-white'
                            : 'text-white/20'
                        } w-5 h-5`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{stats?.totalReviews || 0} reviews</p>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="lg:col-span-2">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats?.ratingDistribution?.[star] || 0;
                  const percentage = (stats?.totalReviews || 0) > 0 ? (count / (stats?.totalReviews || 1)) * 100 : 0;
                  return (
                    <div key={`dist-${star}`} className="flex items-center gap-3">
                      <span className="text-sm w-8">{star}★</span>
                      <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-white h-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Write Review Button */}
          {isAuthenticated && !userHasReviewed && (
            <button
              onClick={handleWriteReviewClick}
              className="mb-8 border-2 border-white px-6 py-3 font-bold hover:bg-white hover:text-black transition-colors uppercase text-sm tracking-widest"
            >
              Write a Review
            </button>
          )}

          {/* Already Reviewed Message */}
          {isAuthenticated && userHasReviewed && (
            <div className="mb-8 border border-white/20 bg-white/5 p-4 rounded text-center">
              <FaCheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-gray-300">You have already reviewed this product</p>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && isAuthenticated && !userHasReviewed && (
            <form onSubmit={handleSubmitReview} className="mb-12 border border-white/20 p-6 bg-white/5">
              <h3 className="text-xl font-bold mb-6 uppercase tracking-wide">Write Your Review</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 uppercase tracking-wide">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`form-star-${star}`}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <FaStar
                        className={`w-8 h-8 ${
                          star <= reviewRating ? 'text-white' : 'text-white/20'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 uppercase tracking-wide">Review Title</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Summarize your review"
                  className="w-full bg-black border border-white/30 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-white"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 uppercase tracking-wide">Your Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell us about your experience with this product"
                  rows="6"
                  className="w-full bg-black border border-white/30 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-white resize-none"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 uppercase tracking-wide">
                  Add Photos (Optional)
                </label>
                <div className="flex flex-wrap gap-4">
                  {previewImages.map((preview, index) => (
                    <div key={`preview-${index}`} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-24 h-24 object-cover border border-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-white text-black rounded-full p-1 hover:bg-gray-200"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {reviewImages.length < 5 && (
                    <label className="w-24 h-24 border-2 border-dashed border-white/30 flex items-center justify-center cursor-pointer hover:border-white/60 transition-colors">
                      <FaCamera className="w-6 h-6 text-gray-400" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">Max 5 images, up to 5MB each</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-white text-black px-8 py-3 font-bold hover:bg-gray-200 disabled:opacity-50 transition-colors uppercase text-sm tracking-widest"
                >
                  {submitLoading ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewRating(5);
                    setReviewTitle('');
                    setReviewComment('');
                    setReviewImages([]);
                    setPreviewImages([]);
                  }}
                  className="border border-white/30 px-8 py-3 font-semibold hover:bg-white/5 transition-colors uppercase text-sm tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {!Array.isArray(reviews) || reviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="border-b border-white/10 pb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-bold text-lg">
                        {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{review.user?.name || 'Anonymous'}</h4>
                          {review.verified && (
                            <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                              <FaCheckCircle className="w-3 h-3" />
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={`review-star-${review._id}-${i}`}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-white' : 'text-white/20'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isAuthenticated && user?._id === review.user?._id && (
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete review"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h5 className="font-bold text-lg mb-2">{review.title}</h5>
                  <p className="text-gray-300 mb-4 leading-relaxed">{review.comment}</p>

                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {review.images.map((image, index) => (
                        <img
                          key={`review-img-${review._id}-${index}`}
                          src={image.url}
                          alt={`Review ${index + 1}`}
                          className="w-20 h-20 object-cover border border-white/20 cursor-pointer hover:border-white/60 transition-colors"
                          onClick={() => window.open(image.url, '_blank')}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleMarkHelpful(review._id)}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      isAuthenticated 
                        ? 'text-gray-400 hover:text-white cursor-pointer' 
                        : 'text-gray-600 cursor-not-allowed'
                    }`}
                    title={!isAuthenticated ? 'Login to mark as helpful' : ''}
                  >
                    <FaThumbsUp className="w-4 h-4" />
                    <span>Helpful ({review.helpful || 0})</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;