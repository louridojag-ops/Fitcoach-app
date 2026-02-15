import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ClientProfile, ProgressEntry } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PhotoUpload } from '../../components/client/PhotoUpload';
import { PhotoComparison } from '../../components/client/PhotoComparison';

export const ClientDashboard = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');

  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = onSnapshot(
      doc(db, 'clients', user.uid),
      (doc) => {
        if (doc.exists()) {
          setProfile({ uid: doc.id, ...doc.data() } as ClientProfile);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleAddWeight = async () => {
    if (!newWeight || !user) return;
    
    const weight = parseFloat(newWeight);
    if (isNaN(weight)) return;

    const progressEntry: ProgressEntry = {
      id: Date.now().toString(),
      date: new Date(),
      weight,
      notes: ''
    };

    // Actualizar en Firestore
    const clientRef = doc(db, 'clients', user.uid);
    await updateDoc(clientRef, {
      'personalInfo.currentWeight': weight,
      progress: [...(profile?.progress || []), progressEntry],
      updatedAt: new Date()
    });

    setNewWeight('');
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  if (!profile) return <div className="p-6">Completa tu perfil primero</div>;

  const progressData = profile.progress.map(p => ({
    date: format(p.date.toDate ? p.date.toDate() : p.date, 'dd/MM'),
    weight: p.weight
  }));

  const weightLost = profile.personalInfo.initialWeight - profile.personalInfo.currentWeight;
  const progressPercent = ((weightLost / (profile.personalInfo.initialWeight - profile.personalInfo.targetWeight)) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Mi Progreso</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Peso Actual" 
          value={${profile.personalInfo.currentWeight} kg} 
          change={-${weightLost} kg desde inicio}
          positive={weightLost > 0}
        />
        <StatCard 
          title="Objetivo" 
          value={${profile.personalInfo.targetWeight} kg} 
        />
        <StatCard 
          title="Progreso" 
          value={${progressPercent}%} 
        />
        <StatCard 
          title="IMC" 
          value={calculateBMI(profile.personalInfo.currentWeight, profile.personalInfo.height)} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Evolución de Peso</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="mt-4 flex gap-2">
            <input
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Nuevo peso (kg)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleAddWeight}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Actualizar
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <PhotoUpload clientId={user!.uid} />
        </div>
      </div>

      <PhotoComparison clientId={user!.uid} />
    </div>
  );
};

const StatCard = ({ title, value, change, positive }: any) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <p className="text-sm text-gray-600">{title}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {change && (
      <p className={text-sm ${positive ? 'text-green-600' : 'text-red-600'}}>
        {change}
      </p>
    )}
  </div>
);

const calculateBMI = (weight: number, height: number) => {
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};