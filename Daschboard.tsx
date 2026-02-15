import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import { ClientProfile } from '../../types';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Users, Activity, MessageCircle } from 'lucide-react';

export const CoachDashboard = () => {
  const { user } = useAuthStore();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, newThisMonth: 0, messages: 0 });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'clients'), where('coachId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as ClientProfile[];
      
      setClients(clientsData);
      
      const now = new Date();
      const thisMonth = clientsData.filter(c => 
        c.createdAt.toDate().getMonth() === now.getMonth()
      ).length;
      
      setStats({
        total: clientsData.length,
        active: clientsData.filter(c => c.progress.length > 0).length,
        newThisMonth: thisMonth,
        messages: 0
      });
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <Link
          to="/coach/clients/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Users} title="Total Clientes" value={stats.total} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Activity} title="Clientes Activos" value={stats.active} color="bg-green-100 text-green-600" />
        <StatCard icon={TrendingUp} title="Nuevos este mes" value={stats.newThisMonth} color="bg-purple-100 text-purple-600" />
        <StatCard icon={MessageCircle} title="Mensajes" value={stats.messages} color="bg-orange-100 text-orange-600" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Mis Clientes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {clients.map(client => (
            <ClientRow key={client.uid} client={client} />
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, color }: any) => (
  <div className={p-6 rounded-lg ${color} flex items-center}>
    <div className="p-3 bg-white rounded-full bg-opacity-30">
      <Icon className="w-6 h-6" />
    </div>
    <div className="ml-4">
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const ClientRow = ({ client }: { client: ClientProfile }) => {
  const lastProgress = client.progress[client.progress.length - 1];
  const daysSinceUpdate = lastProgress 
    ? Math.floor((Date.now() - lastProgress.date.toDate().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
          {client.personalInfo?.name?.[0] || '?'}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-900">{client.personalInfo?.name || 'Sin nombre'}</p>
          <p className="text-sm text-gray-500">
            {client.personalInfo?.currentWeight || '--'} kg | Objetivo: {client.personalInfo?.goal}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {daysSinceUpdate !== null && (
          <span className={text-sm ${daysSinceUpdate > 7 ? 'text-red-600' : 'text-green-600'}}>
            {daysSinceUpdate === 0 ? 'Actualizado hoy' : Hace ${daysSinceUpdate} días}
          </span>
        )}
        <Link 
          to={/coach/clients/${client.uid}}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Ver detalle →
        </Link>
      </div>
    </div>
  );
};