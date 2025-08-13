
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { UserIcon, CameraIcon, CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export const EditProfile = () => {
  const { user, isLoading, refreshAuth } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);

    try {
      // In a real app, this would make an API call to update user profile
      // For now, we'll simulate the update
      setTimeout(async () => {
        setSuccess(true);
        await refreshAuth(); // Refresh auth state to get updated user data
        setIsSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Profile update error:', error);
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, avatar: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please login to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="hover-glow"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Profile Card */}
        <div className="elegant-card bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-primary/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">Edit Profile</h1>
            <p className="text-muted-foreground">Update your account information</p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-lg text-center">
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted mx-auto mb-4 border-4 border-primary/20">
                  {formData.avatar ? (
                    <img 
                      src={formData.avatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-premium">
                      <UserIcon className="h-12 w-12 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-4 right-0 bg-primary hover:bg-primary/90 rounded-full p-2 cursor-pointer transition-colors">
                  <CameraIcon className="h-4 w-4 text-primary-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Click the camera icon to upload a new photo
              </p>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* User Info */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Account Information</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="font-medium">Role:</span> {user.role}</p>
                <p><span className="font-medium">User ID:</span> {user.id}</p>
                <p><span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleDateString()}</p>
                <p><span className="font-medium">Last Updated:</span> {new Date(user.updated_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                variant="premium"
                size="lg"
                disabled={isSaving}
                className="min-w-[200px]"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>

        {/* Security Section */}
        <div className="elegant-card bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-primary/20 mt-8">
          <h2 className="text-xl font-bold text-gradient mb-4">Security Settings</h2>
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
              Logout from All Devices
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
