import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useLocation } from 'react-router-dom';
import { getProducts, getCategories } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard'; // Assuming you have this component
import { FaFilter, FaTimes } from 'react-icons/fa';

const Shop = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { 
    products = [], 
    loading, 
    pagination = {}, 
    categories = [], 
    brands = [] 
  } = useSelector((state) => state.products || {});

  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rating: searchParams.get('rating') || '',
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || '-createdAt',
    page: searchParams.get('page') || 1,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  // Update filters when URL changes (e.g., clicking category from home)
  useEffect(() => {
    const categoryFromURL = searchParams.get('category');
    const searchFromURL = searchParams.get('search');
    
    setFilters(prev => ({
      ...prev,
      category: categoryFromURL || '',
      search: searchFromURL || '',
      page: 1
    }));
  }, [location.search, searchParams]);

  // Fetch products when filters change
  useEffect(() => {
    // Build query params for API
    const queryParams = {};
    
    // --- START OF FIX ---
    // Translate display-friendly category from URL (e.g., "Men") 
    // to database-friendly category (e.g., "mens-clothing").
    if (filters.category) {
      const categoryMap = {
        'men': 'mens-clothing',
        'women': 'womens-clothing',
        'accessories': 'accessories',
      };
      const lowerCaseCategory = filters.category.toLowerCase();
      // Use the mapped value if it exists, otherwise pass the category as-is (lowercased)
      queryParams.category = categoryMap[lowerCaseCategory] || lowerCaseCategory;
    }
    // --- END OF FIX ---

    if (filters.brand) queryParams.brand = filters.brand;
    if (filters.minPrice) queryParams.minPrice = filters.minPrice;
    if (filters.maxPrice) queryParams.maxPrice = filters.maxPrice;
    if (filters.rating) queryParams.rating = filters.rating;
    if (filters.search) queryParams.search = filters.search;
    if (filters.sortBy) queryParams.sort = filters.sortBy;
    if (filters.page) queryParams.page = filters.page;

    console.log('🔍 Fetching products with filters:', queryParams);
    dispatch(getProducts(queryParams));
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    // Update URL params
    const params = {};
    Object.keys(newFilters).forEach((k) => {
      // Don't add empty values to URL
      if (newFilters[k]) params[k] = newFilters[k];
    });
    // Reset page on filter change
    delete params.page; 
    setSearchParams(params);
  };

  const clearFilters = () => {
    const newFilters = {
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      search: '',
      sortBy: '-createdAt',
      page: 1,
    };
    setFilters(newFilters);
    setSearchParams({});
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 md:mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2">
              SHOP {filters.category && `- ${filters.category.toUpperCase()}`}
            </h1>
            <div className="w-16 sm:w-20 h-px bg-white"></div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 bg-white text-black px-4 sm:px-5 py-2.5 sm:py-3 font-bold hover:bg-gray-200 transition-colors uppercase text-xs sm:text-sm tracking-widest"
          >
            <FaFilter size={14} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <aside
            className={`${
              showFilters ? 'block' : 'hidden'
            } lg:block w-full lg:w-72 xl:w-80 space-y-4 sm:space-y-6 flex-shrink-0`}
          >
            <div className="bg-white/5 border border-white/20 p-4 sm:p-5 md:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6 pb-4 border-b border-white/10">
                <h3 className="font-bold uppercase tracking-wide text-sm sm:text-base">Filters</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={clearFilters}
                    className="text-xs sm:text-sm text-white hover:text-gray-300 transition-colors uppercase tracking-wide"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden text-white hover:text-gray-300"
                  >
                    <FaTimes size={18} />
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-4 sm:mb-5 md:mb-6">
                <h4 className="font-semibold mb-2 sm:mb-3 uppercase tracking-wide text-xs sm:text-sm">Category</h4>
                <select
                  // Use `filters.category` here, which might be "Men"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-white/20 text-white text-sm focus:outline-none focus:border-white transition-colors"
                >
                  <option value="" className="bg-black">All Categories</option>
                  {/* The categories from DB are e.g., 'mens-clothing' */}
                  {Array.isArray(categories) && categories.filter(Boolean).map((cat) => (
                    <option key={cat._id || cat.name} value={cat.name} className="bg-black">
                      {/* Capitalize for display */}
                      {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div className="mb-4 sm:mb-5 md:mb-6">
                <h4 className="font-semibold mb-2 sm:mb-3 uppercase tracking-wide text-xs sm:text-sm">Brand</h4>
                <select
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-white/20 text-white text-sm focus:outline-none focus:border-white transition-colors"
                >
                  <option value="" className="bg-black">All Brands</option>
                  {Array.isArray(brands) && brands.filter(Boolean).map((brand) => {
                    const brandName = typeof brand === 'object' ? brand.name : brand;
                    const brandKey = typeof brand === 'object' ? brand._id || brand.name : brand;
                    return (
                      <option key={brandKey} value={brandName} className="bg-black">
                        {brandName}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-4 sm:mb-5 md:mb-6">
                <h4 className="font-semibold mb-2 sm:mb-3 uppercase tracking-wide text-xs sm:text-sm">Price Range</h4>
                <div className="flex gap-2 sm:gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-1/2 px-2 sm:px-3 py-2 sm:py-2.5 bg-white/5 border border-white/20 text-white text-sm focus:outline-none focus:border-white transition-colors placeholder:text-gray-600"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-1/2 px-2 sm:px-3 py-2 sm:py-2.5 bg-white/5 border border-white/20 text-white text-sm focus:outline-none focus:border-white transition-colors placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h4 className="font-semibold mb-2 sm:mb-3 uppercase tracking-wide text-xs sm:text-sm">Minimum Rating</h4>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-white/20 text-white text-sm focus:outline-none focus:border-white transition-colors"
                >
                  <option value="" className="bg-black">All Ratings</option>
                  <option value="4" className="bg-black">4★ & above</option>
                  <option value="3" className="bg-black">3★ & above</option>
                  <option value="2" className="bg-black">2★ & above</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Sort and Results */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-white/10">
              <p className="text-gray-400 text-xs sm:text-sm uppercase tracking-wide">
                {pagination?.totalProducts || 0} products found
              </p>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-white/20 text-white text-xs sm:text-sm focus:outline-none focus:border-white transition-colors"
              >
                <option value="-createdAt" className="bg-black">Newest First</option>
                <option value="price" className="bg-black">Price: Low to High</option>
                <option value="-price" className="bg-black">Price: High to Low</option>
                <option value="-rating" className="bg-black">Top Rated</option>
                <option value="-popularity" className="bg-black">Most Popular</option>
              </select>
            </div>

            {/* Products */}
            {loading ? (
              <div className="flex justify-center py-20 sm:py-32">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : !Array.isArray(products) || products.length === 0 ? (
              <div className="text-center py-20 sm:py-32">
                <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-4 sm:mb-6 uppercase tracking-wide">No products found</p>
                <button
                  onClick={clearFilters}
                  className="border border-white px-5 sm:px-6 py-2.5 sm:py-3 text-white hover:bg-white hover:text-black transition-colors uppercase text-xs sm:text-sm tracking-widest"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 justify-items-center">
                  {products.filter(Boolean).map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination?.totalPages > 1 && (
                  <div className="flex flex-wrap justify-center mt-8 sm:mt-10 md:mt-12 gap-2 sm:gap-3">
                    {[...Array(pagination.totalPages)].map((_, index) => (
                      <button
                        key={`page-${index + 1}`}
                        onClick={() => handleFilterChange('page', index + 1)}
                        className={`px-3 sm:px-4 py-2 sm:py-2.5 font-bold transition-colors text-xs sm:text-sm uppercase tracking-wider ${
                          pagination.currentPage === index + 1
                            ? 'bg-white text-black'
                            : 'border border-white/30 text-white hover:bg-white hover:text-black'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Shop;