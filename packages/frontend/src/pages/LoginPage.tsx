import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { LoginBanner } from '../components/auth/LoginBanner';
import { LoginForm } from '../components/auth/LoginForm';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [identifier, setIdentifier] = useState('retailer@moneymb.in');
  const [password, setPassword] = useState('Retailer@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', {
        identifier,
        password,
      });

      const { token, user, wallet } = res.data.data;
      setAuth(token, user, wallet);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid login credentials. Please verify your ID and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 font-sans selection:bg-orange-500 selection:text-white">
      {/* Left Component - Simple Hero Banner */}
      <div className="lg:col-span-6 xl:col-span-7 flex">
        <LoginBanner />
      </div>

      {/* Right Component - Simplified Sign In Form */}
      <div className="lg:col-span-6 xl:col-span-5 flex">
        <LoginForm
          identifier={identifier}
          setIdentifier={setIdentifier}
          password={password}
          setPassword={setPassword}
          loading={loading}
          error={error}
          onSubmit={handleLogin}
        />
      </div>
    </div>
  );
};

export default LoginPage;
