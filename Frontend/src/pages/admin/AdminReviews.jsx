// frontend/src/pages/admin/AdminReviews.jsx
import { useEffect, useState } from 'react';
import api from '../../config/axios';
import { Star, Trash2, Check, X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // --- START OF FIX 1 ---
      // The correct API route is /reviews/admin/all
      const { data } = await api.get(`/reviews/admin/all?status=${filter}`);
      // The data is in `data.data`
      setReviews(data.data || []);
      // --- END OF FIX 1 ---
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error(error.response?.data?.message || 'Failed to load reviews');
      setLoading(false);
      setReviews([]); // Set to empty on error
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await api.delete(`/reviews/${id}`);
        toast.success('Review deleted successfully');
        fetchReviews();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete review');
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      // --- START OF FIX 2 ---
      // The API route we will create is /reviews/:id/approve
      // It's a PUT request to update the status.
      await api.put(`/reviews/${id}/approve`);
      // --- END OF FIX 2 ---
      toast.success('Review approved');
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve review');
    }
  };
  
  // --- START OF FIX 5 (NEW FUNCTION) ---
  // A function to disapprove a review
  const handleDisapprove = async (id) => {
    try {
      // This route is new, we will add it to the backend
      await api.put(`/reviews/${id}/disapprove`);
      toast.success('Review set to pending');
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update review');
    }
  };
  // --- END OF FIX 5 ---

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
        <p className="text-gray-600 mt-1">Manage customer product reviews</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reviews found</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{review.title}</h3>
                      <p className="text-sm text-gray-600">
                        by {review.user?.name} • {new Date(review.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm font-medium text-gray-700">{review.rating}/5</span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{review.comment}</p>

                  {/* Review images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.map((img, index) => (
                        <a key={index} href={img.url} target="_blank" rel="noopener noreferrer">
                          <img src={img.url} alt={`review-img-${index}`} className="w-16 h-16 object-cover rounded-lg border" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Product:</span>
                    <span>{review.product?.name}</span>
                  </div>

                  {/* --- START OF FIX 3 --- */}
                  {/* Changed `review.status` to `review.isApproved` to match your model */}
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                    review.isApproved
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {review.isApproved ? 'Approved' : 'Pending'}
                  </span>
                  {/* --- END OF FIX 3 --- */}

                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* --- START OF FIX 4 --- */}
                  {/* Logic to show Approve or Disapprove button */}
                  {!review.isApproved ? (
                    <button
                      onClick={() => handleApprove(review._id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDisapprove(review._id)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Set as Pending"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  {/* --- END OF FIX 4 --- */}
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReviews;