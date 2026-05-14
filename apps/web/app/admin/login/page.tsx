'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearTokens } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { loginSchema } from '@spa/shared';
import type { LoginInput } from '@spa/shared';

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const [fields, setFields] = useState<LoginInput>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'CUSTOMER') {
      clearTokens();
      void logout();
      window.setTimeout(() => setError('Tài khoản không có quyền truy cập'), 0);
      return;
    }
    router.replace(user.role === 'DOCTOR' ? '/admin/my-schedule' : '/admin/dashboard');
  }, [user, logout, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse(fields);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf7f4] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B76E79]">
            K-Beauty
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#3d2b25]">Admin</h1>
          <p className="mt-2 text-sm text-[#8a6a62]">Đăng nhập khu vực quản trị</p>
        </div>

        <div className="rounded-2xl border border-[#ede4de] bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Field
              label="Email"
              name="email"
              type="email"
              value={fields.email}
              onChange={handleChange}
              error={fieldErrors.email}
              autoComplete="email"
            />
            <Field
              label="Mật khẩu"
              name="password"
              type="password"
              value={fields.password}
              onChange={handleChange}
              error={fieldErrors.password}
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#B76E79] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#a35d68] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

interface FieldProps {
  label: string;
  name: keyof LoginInput;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  autoComplete: string;
}

function Field({ label, name, type, value, onChange, error, autoComplete }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#6b4c41]"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={`w-full rounded-lg border bg-[#fdfaf8] px-4 py-2.5 text-sm text-[#3d2b25] transition focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40 ${
          error ? 'border-red-300' : 'border-[#ddd0ca] focus:border-[#B76E79]'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
