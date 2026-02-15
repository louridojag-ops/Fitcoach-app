import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Utensils, 
  Dumbbell, 
  TrendingUp, 
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  userRole: 'client' | 'coach';
}

const coachLinks = [
  { to: '/coach/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/coach/clients', icon: Users, label: 'Mis Clientes' },
  { to: '/coach/messages', icon: MessageSquare, label: 'Mensajes' },
];

const clientLinks = [
  { to: '/client/dashboard', icon: LayoutDashboard, label: 'Mi Progreso' },
  { to: '/client/workout', icon: Dumbbell, label: 'Mi Entrenamiento' },
  { to: '/client/nutrition', icon: Utensils, label: 'Mi Alimentación' },
  { to: '/client/messages', icon: MessageSquare, label: 'Mensajes' },
];

export const Sidebar = ({ userRole }: SidebarProps) => {
  const location = useLocation();
  const links = userRole === 'coach' ? coachLinks : clientLinks;

  return (
    <aside className="w-64 bg-white shadow-md">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">FitCoach Pro</h1>
      </div>
      <nav className="mt-6">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};