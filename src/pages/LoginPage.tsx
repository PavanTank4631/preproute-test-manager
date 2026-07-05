import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      const res = await authApi.login(data.userId, data.password);
      const { token, user } = res.data.data;
      setAuth(token, user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setApiError(msg);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon lg">P</div>
          <h1>Welcome back</h1>
          <p>Sign in to manage your tests</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {apiError && <div className="alert alert-error">{apiError}</div>}

          <div className="form-group">
            <label className="form-label">User ID</label>
            <input
              className={`form-input ${errors.userId ? 'input-error' : ''}`}
              placeholder="Enter your user ID"
              {...register('userId')}
            />
            {errors.userId && <span className="field-error">{errors.userId.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter your password"
              {...register('password')}
            />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
