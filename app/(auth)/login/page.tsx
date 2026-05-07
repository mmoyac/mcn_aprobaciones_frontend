'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useTenant } from '@/lib/context/TenantContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const CREDS_KEY = 'mcn_saved_creds';

export default function LoginPage() {
  const router = useRouter();
  const { tenant, isLoading: isTenantLoading } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState({
    usuario: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CREDS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(atob(saved));
        setCredentials({ usuario: parsed.usuario, password: parsed.password });
        setRememberMe(true);
      } catch {
        localStorage.removeItem(CREDS_KEY);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.login(credentials);
      if (rememberMe) {
        localStorage.setItem(CREDS_KEY, btoa(JSON.stringify(credentials)));
      } else {
        localStorage.removeItem(CREDS_KEY);
      }
      // Pequeña pausa para que la cookie se propague antes de la navegación
      await new Promise(resolve => setTimeout(resolve, 50));
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {tenant?.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.nombre}
                  className="h-16 w-16 object-cover rounded-full"
                />
              ) : (
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full"
                  style={{ background: 'linear-gradient(135deg, var(--tenant-secondary), var(--tenant-primary))' }}
                >
                  <LogIn className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Aprobaciones</h1>
            {/* Badge del tenant */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700 border border-slate-600 mt-1">
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tenant-primary)' }}></span>
              <span className="text-sm text-slate-300">
                {isTenantLoading ? 'Cargando...' : (tenant?.nombre ?? 'Tenant desconocido')}
              </span>
            </div>
            <p className="text-slate-400 mt-3">Ingresa tus credenciales</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-slate-300 mb-2">
                Usuario
              </label>
              <input
                id="usuario"
                type="text"
                required
                value={credentials.usuario}
                onChange={(e) => setCredentials({ ...credentials, usuario: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Ingresa tu usuario"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative" suppressHydrationWarning>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  data-lpignore="true"
                  data-1p-ignore
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-teal-500 cursor-pointer"
              />
              <span className="text-sm text-slate-400">Recordar mis datos</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(to right, var(--tenant-secondary), var(--tenant-primary))' }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          © 2026 Desarrollado por{' '}
          <a
            href="https://lexasconsultores.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
          >
            Lexas Consultores
          </a>
        </p>
      </div>
    </div>
  );
}
