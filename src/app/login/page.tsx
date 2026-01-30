'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      alert('Check your email for the confirmation link!');
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-8">
          <ThemeToggle />
        </div>

        <div className="bg-primary border border-color rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-primary mb-2">
            NGO Access
          </h1>
          <p className="text-secondary mb-8">
            Sign in or create an account
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-primary mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 border input-border rounded-md input-bg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-primary mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border input-border rounded-md input-bg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 btn-primary disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-md transition-colors btn-focus focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary"
              >
                {isSubmitting ? 'Processing...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 border border-color text-primary hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}