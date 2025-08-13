
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/utils/auth';
import { useAuth } from '@/hooks/useAuth';
import { HeartIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      await refreshAuth(); // Refresh auth state after login
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const demoUsers = [
    { email: 'admin@dhikasari.com', password: 'password', name: 'Super Admin', role: 'admin' },
    { email: 'dhika@dhikasari.com', password: 'password', name: 'Dhika Pratama', role: 'admin' },
    { email: 'sari@dhikasari.com', password: 'password', name: 'Sari Dewi', role: 'admin' }
  ];

  const handleDemoLogin = async (demoUser: any) => {
    setIsLoading(true);
    setError('');
    
    try {
      await login(demoUser.email, demoUser.password);
      await refreshAuth();
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-rose-gold/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-56 h-56 bg-accent/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="elegant-card bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-primary/20 shadow-premium">
          {/* Header */}
          <div className="text-center mb-8">
            <HeartIcon className="h-16 w-16 text-primary mx-auto mb-4 floating" />
            <h1 className="text-3xl font-bold text-gradient mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Dhika & Sari Wedding</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dhikasari.com"
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Demo password: "password"
              </p>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="premium"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Auto Login Demo */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-sm font-medium text-center text-muted-foreground mb-4">
              Quick Demo Login
            </p>
            <div className="grid grid-cols-1 gap-2">
              {demoUsers.map((user, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin(user)}
                  disabled={isLoading}
                  className="justify-start text-left hover-glow"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.role}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>© 2025 Dhika & Sari Wedding</p>
            <p>Secure Admin Access</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
