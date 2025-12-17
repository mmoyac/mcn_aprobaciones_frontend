'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { LogOut, Home, FileText, ShoppingCart, Menu, X } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ usuario: string; nombre: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      router.push('/login');
    } else {
      setUser(authApi.getUser());
    }
  }, [router]);

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Header */}
          <div className="flex items-center justify-between h-16">
            {/* Logo y Nav Desktop */}
            <div className="flex items-center space-x-8">
              <h1 className="text-lg sm:text-xl font-bold text-white">Aprobaciones</h1>
              
              {/* Navigation Desktop */}
              <nav className="hidden md:flex space-x-4">
                <a
                  href="/dashboard"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Tablero</span>
                </a>
                <a
                  href="/dashboard/presupuestos"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Presupuestos</span>
                </a>
                <a
                  href="/dashboard/ordenes-compra"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden lg:inline">Órdenes de Compra</span>
                  <span className="lg:hidden">Órdenes</span>
                </a>
              </nav>
            </div>

            {/* User Info y Actions Desktop */}
            <div className="hidden sm:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.nombre}</p>
                <p className="text-xs text-slate-400">{user.usuario}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 md:hidden">
              <div className="text-right mr-2">
                <p className="text-xs font-medium text-white truncate max-w-24">{user.nombre.split(' ')[0]}</p>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-700 bg-slate-800">
              <nav className="px-2 pt-2 pb-3 space-y-1">
                <a
                  href="/dashboard"
                  className="flex items-center space-x-3 px-3 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="w-5 h-5" />
                  <span>Tablero</span>
                </a>
                <a
                  href="/dashboard/presupuestos"
                  className="flex items-center space-x-3 px-3 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FileText className="w-5 h-5" />
                  <span>Presupuestos</span>
                </a>
                <a
                  href="/dashboard/ordenes-compra"
                  className="flex items-center space-x-3 px-3 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Órdenes de Compra</span>
                </a>
                <div className="border-t border-slate-700 pt-3">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-white">{user.nombre}</p>
                    <p className="text-xs text-slate-400">{user.usuario}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3 py-3 w-full text-left rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
