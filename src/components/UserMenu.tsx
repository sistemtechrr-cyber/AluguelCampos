import { User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { profile, signOut, isAdmin, isProprietario } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!profile) return null;

  const roleLabel = isAdmin ? 'Administrador' : isProprietario ? 'Proprietario' : null;
  const roleTextColor = isAdmin ? 'text-blue-600' : isProprietario ? 'text-green-600' : '';
  const avatarBg = isProprietario ? 'bg-green-100' : 'bg-blue-100';
  const avatarIcon = isProprietario ? 'text-green-600' : 'text-blue-600';
  const badgeClass = isAdmin
    ? 'bg-blue-100 text-blue-700'
    : isProprietario
    ? 'bg-green-100 text-green-700'
    : '';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className={`w-8 h-8 ${avatarBg} rounded-full flex items-center justify-center`}>
          <User className={`w-5 h-5 ${avatarIcon}`} />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-gray-900">{profile.nome}</p>
          {roleLabel && (
            <p className={`text-xs font-medium ${roleTextColor}`}>{roleLabel}</p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{profile.nome}</p>
            <p className="text-xs text-gray-500 mt-0.5">{profile.email}</p>
            {roleLabel && (
              <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${badgeClass}`}>
                {roleLabel}
              </span>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
