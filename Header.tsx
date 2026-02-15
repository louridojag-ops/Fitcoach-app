import { useAuthStore } from '../../store/authStore';
import { User } from '../../types';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  user: User;
}

export const Header = ({ user }: HeaderProps) => {
  const logout = useAuthStore(state => state.logout);

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">Bienvenido,</p>
        <p className="font-semibold text-gray-800">{user.displayName}</p>
      </div>
      <button
        onClick={logout}
        className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Cerrar sesión
      </button>
    </header>
  );
};