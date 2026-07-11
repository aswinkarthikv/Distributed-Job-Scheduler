import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Terminal, ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast('Please enter your email.', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast('Password reset link sent to your inbox.', 'success');
      setEmail('');
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 bg-card border border-border p-8 rounded-xl shadow-xl">
        <div className="flex flex-col items-center select-none">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Terminal className="w-8 h-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground text-center">
            Reset Password
          </h2>
          <p className="mt-1 text-sm text-muted-foreground text-center">
            We will send you instructions to reset your password
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@enterprise.io"
                className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send Link
          </Button>

          <div className="text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ForgotPassword;
