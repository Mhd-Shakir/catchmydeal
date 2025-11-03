import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaShoppingBag, FaHeart, FaSignOutAlt, FaCamera, FaLock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../config/axios';
import { logout, updateUser } from '../redux/slices/authSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      // Get the default address (first address in array)
      const defaultAddress = user.addresses && user.addresses.length > 0 ? user.addresses[0] : null;

      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: defaultAddress?.addressLine1 || '',
          city: defaultAddress?.city || '',
          state: defaultAddress?.state || '',
          pincode: defaultAddress?.pincode || '',
          country: defaultAddress?.country || 'India'
        }
      });
    }

    fetchOrderStats();
  }, [user, isAuthenticated, navigate]);

  const fetchOrderStats = async () => {
    try {
      const { data } = await api.get('/orders/user-stats');
      if (data.success) {
        setOrderStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send data in the format backend expects
      const updateData = {
        name: profileData.name,
        phone: profileData.phone,
        address: {
          street: profileData.address.street,
          city: profileData.address.city,
          state: profileData.address.state,
          pincode: profileData.address.pincode,
          country: profileData.address.country
        }
      };

      const { data } = await api.put('/users/profile', updateData);
      
      if (data.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        
        // Update Redux store with new user data
        dispatch(updateUser(data.user));
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }

    if (passwordData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      const { data } = await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (data.success) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border-2 border-white p-6">
              {/* Profile Picture */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-black text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white text-black p-2 rounded-full hover:bg-gray-200 transition">
                    <FaCamera className="text-sm" />
                  </button>
                </div>
                <h3 className="text-xl font-bold mt-4">{user?.name}</h3>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                    activeTab === 'profile' ? 'bg-white text-black' : 'hover:bg-gray-800'
                  }`}
                >
                  <FaUser />
                  <span className="font-medium">Profile Info</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                    activeTab === 'orders' ? 'bg-white text-black' : 'hover:bg-gray-800'
                  }`}
                >
                  <FaShoppingBag />
                  <span className="font-medium">My Orders</span>
                </button>

                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                    activeTab === 'wishlist' ? 'bg-white text-black' : 'hover:bg-gray-800'
                  }`}
                >
                  <FaHeart />
                  <span className="font-medium">Wishlist</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                    activeTab === 'security' ? 'bg-white text-black' : 'hover:bg-gray-800'
                  }`}
                >
                  <FaLock />
                  <span className="font-medium">Security</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-900 hover:text-white transition mt-4 border-t-2 border-gray-700"
                >
                  <FaSignOutAlt />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>

            {/* Stats Card */}
            <div className="bg-gray-900 border-2 border-white p-6 mt-8">
              <h3 className="text-lg font-bold mb-4">Order Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Orders</span>
                  <span className="font-bold">{orderStats.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pending</span>
                  <span className="font-bold text-yellow-500">{orderStats.pendingOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Completed</span>
                  <span className="font-bold text-green-500">{orderStats.completedOrders}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-700">
                  <span className="text-gray-400">Total Spent</span>
                  <span className="font-bold">₹{orderStats.totalSpent.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Info Tab */}
            {activeTab === 'profile' && (
              <div className="bg-gray-900 border-2 border-white p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Profile Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-white text-black px-4 py-2 font-bold hover:bg-gray-200 transition"
                    >
                      <FaEdit /> Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2 border-2 border-white text-white px-4 py-2 font-bold hover:bg-white hover:text-black transition"
                    >
                      <FaTimes /> Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <FaUser /> Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          disabled
                          className="w-full p-3 bg-black border-2 border-gray-700 outline-none text-white opacity-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          maxLength="10"
                          className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <FaMapMarkerAlt /> Address Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Street Address</label>
                        <input
                          type="text"
                          name="address.street"
                          value={profileData.address.street}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter your street address"
                          className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white disabled:opacity-50"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">City</label>
                          <input
                            type="text"
                            name="address.city"
                            value={profileData.address.city}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="City"
                            className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-2">State</label>
                          <input
                            type="text"
                            name="address.state"
                            value={profileData.address.state}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="State"
                            className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Pincode</label>
                          <input
                            type="text"
                            name="address.pincode"
                            value={profileData.address.pincode}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Pincode"
                            maxLength="6"
                            className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-white text-black py-3 font-bold hover:bg-gray-200 transition uppercase tracking-wide disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <FaSave /> {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-gray-900 border-2 border-white p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6">My Orders</h2>
                <div className="text-center py-12">
                  <FaShoppingBag className="text-6xl mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-4">View your order history</p>
                  <button
                    onClick={() => navigate('/orders')}
                    className="bg-white text-black px-6 py-3 font-bold hover:bg-gray-200 transition uppercase tracking-wide"
                  >
                    View All Orders
                  </button>
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="bg-gray-900 border-2 border-white p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>
                <div className="text-center py-12">
                  <FaHeart className="text-6xl mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-4">Your wishlist is empty</p>
                  <button
                    onClick={() => navigate('/shop')}
                    className="bg-white text-black px-6 py-3 font-bold hover:bg-gray-200 transition uppercase tracking-wide"
                  >
                    Browse Products
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-gray-900 border-2 border-white p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FaLock /> Security Settings
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                          className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter new password"
                          className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Confirm new password"
                          className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black py-3 font-bold hover:bg-gray-200 transition uppercase tracking-wide disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>

                {/* Account Actions */}
                <div className="mt-8 p-4 bg-red-900/20 border border-red-600">
                  <h3 className="text-lg font-bold mb-2 text-red-500">Danger Zone</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button className="bg-red-600 text-white px-6 py-2 font-bold hover:bg-red-700 transition">
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;