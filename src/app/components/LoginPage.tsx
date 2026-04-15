import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const APP_URL = 'https://teamlinkv1-h88xmyn9y-universalmohiths-projects.vercel.app/';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  onOAuthLogin: (accessToken: string, userData: { email: string, name: string }) => Promise<void>;
  onBack: () => void;
}

type ViewMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

export function LoginPage({ onLogin, onSignup, onOAuthLogin, onBack }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Check if URL has OAuth hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'recovery') {
          // Password recovery callback - show reset password form
          console.log('Password recovery callback detected');
          setViewMode('reset-password');
          setIsLoading(false);
          // Set the session so we can update the password
          const supabase = createClient(
            `https://${projectId}.supabase.co`,
            publicAnonKey
          );
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });
          // Clear the hash
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }

        if (accessToken) {
          console.log('OAuth access token found in URL, processing...');
          setIsLoading(true);

          const supabase = createClient(
            `https://${projectId}.supabase.co`,
            publicAnonKey
          );

          // Get user info with the access token
          const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

          if (userError || !user) {
            console.error('Error getting user from token:', userError);
            setError('Failed to verify OAuth credentials');
            setIsLoading(false);
            // Clear the hash to prevent infinite loops
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }

          console.log('OAuth user verified:', user.email);

          // Extract user info with fallbacks
          const userEmail = user.email || user.user_metadata?.email || `user-${user.id}@oauth.local`;
          const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.preferred_username || 'User';

          const userData = {
            email: userEmail,
            name: userName,
          };

          console.log('Extracted user data:', userData);

          // Clear the hash before calling onOAuthLogin to prevent reprocessing
          window.history.replaceState(null, '', window.location.pathname);

          await onOAuthLogin(accessToken, userData);
        } else {
          // No hash token, check for existing session
          const supabase = createClient(
            `https://${projectId}.supabase.co`,
            publicAnonKey
          );

          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Error getting OAuth session:', error);
            return;
          }

          if (session && session.user) {
            setIsLoading(true);
            console.log('Existing OAuth session found, logging in user:', session.user.email);

            // Extract user info with fallbacks
            const userEmail = session.user.email || session.user.user_metadata?.email || `user-${session.user.id}@oauth.local`;
            const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.user_metadata?.preferred_username || 'User';

            const userData = {
              email: userEmail,
              name: userName,
            };

            console.log('Extracted user data from session:', userData);

            await onOAuthLogin(session.access_token, userData);
          }
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'OAuth login failed');
        setIsLoading(false);
        // Clear the hash on error
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    handleOAuthCallback();
  }, [onOAuthLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (viewMode === 'signup') {
        if (!firstName.trim() || !lastName.trim()) {
          setError('First name and last name are required');
          setIsLoading(false);
          return;
        }
        await onSignup(email, password, firstName, lastName);
      } else if (viewMode === 'login') {
        await onLogin(email, password);
      } else if (viewMode === 'forgot-password') {
        await handlePasswordReset();
      } else if (viewMode === 'reset-password') {
        await handlePasswordUpdate();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: APP_URL,
      });

      if (error) throw error;

      setSuccessMessage('Password reset link sent! Please check your email (including spam folder).');
      setEmail('');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send reset email');
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('New password and confirm password are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    try {
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMessage('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setViewMode('login');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update password');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: APP_URL,
        },
      });

      if (error) {
        setError(error.message || 'Google sign-in failed. Please ensure Google OAuth is configured.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: APP_URL,
        },
      });

      if (error) {
        setError(error.message || 'Facebook sign-in failed. Please ensure Facebook OAuth is configured.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Facebook sign-in failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 3L21 12L3 21V3Z" fill="white"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">TeamLink</span>
          </div>
        </div>

        {/* Login/Signup Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6 dark:text-white">
            {viewMode === 'signup' ? 'Create Account' : viewMode === 'forgot-password' ? 'Reset Password' : viewMode === 'reset-password' ? 'Update Password' : 'Welcome Back!'}
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
            </div>
          )}

          {viewMode === 'forgot-password' && !successMessage && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          )}

          {viewMode === 'reset-password' && !successMessage && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter your new password below.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {viewMode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required={viewMode === 'signup'}
                />
              </div>
            )}

            {viewMode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required={viewMode === 'signup'}
                />
              </div>
            )}

            {viewMode !== 'reset-password' && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required={viewMode !== 'reset-password'}
              />
            </div>
            )}

            {viewMode !== 'forgot-password' && viewMode !== 'reset-password' && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  minLength={6}
                />
              </div>
            )}

            {viewMode === 'reset-password' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    minLength={6}
                  />
                </div>
              </>
            )}

            {viewMode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('forgot-password');
                    setError('');
                    setSuccessMessage('');
                    setIsLoading(false);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Please wait...' :
                viewMode === 'signup' ? 'Sign Up' :
                viewMode === 'forgot-password' ? 'Send Reset Link' :
                viewMode === 'reset-password' ? 'Update Password' :
                'Login'}
            </Button>
          </form>

          {viewMode === 'login' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or</span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 font-medium dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </>
          )}

          <div className="text-center mt-6">
            {viewMode === 'forgot-password' || viewMode === 'reset-password' ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {viewMode === 'reset-password' ? 'Password updated?' : 'Remember your password?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setError('');
                    setSuccessMessage('');
                    setIsLoading(false);
                  }}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold hover:underline"
                >
                  Back to Login
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {viewMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode(viewMode === 'signup' ? 'login' : 'signup');
                    setError('');
                    setSuccessMessage('');
                    setIsLoading(false);
                  }}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold hover:underline"
                >
                  {viewMode === 'signup' ? 'Login' : 'Sign Up'}
                </button>
              </p>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
