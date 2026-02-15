import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ClientProfile } from '../../types';
import { PlanGeneratorService } from '../../services/planGeneratorService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Dumbbell, Utensils, MessageSquare, Play } from 'lucide-react';

export const CoachClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'nutrition' | 'workout'>('overview');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'clients', id), (doc) => {
      if (doc.exists()) {
        setClient({ uid: doc.id, ...doc.data() } as ClientProfile);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleGeneratePlans = async () => {
    if (!client || !id) return;
    setGenerating(true);

    try {
      const coachId = client.coachId;
      await PlanGeneratorService.generateNutritionPlan(id, coachId, client);
      await PlanGeneratorService.generateWorkoutPlan(id, coachId, client);
      alert('Planes generados exitosamente');
    } catch (error) {
      console.error(error);
      alert('Error al generar planes');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (!client) return <div>Cliente no encontrado</div>;

  const progressData = client.progress.map(p => ({
    date: format(p.date.toDate ? p.date.toDate() : p.date, 'dd/MM'),
    weight: p.weight
  }));

  const weightLost = client.personalInfo.initialWeight - client.personalInfo.currentWeight;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {client.personalInfo.name[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{client.personalInfo.name}</h2>
            <p className="text-gray-600">{client.personalInfo.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                {client.personalInfo.currentWeight} kg
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">
                -{weightLost} kg
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleGeneratePlans}
          disabled={generating}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Play className="w-4 h-4 mr-2" />
          {generating ? 'Generando...' : 'Generar Planes'}
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={FileText} label="Resumen" />
        <TabButton active={activeTab === 'nutrition'} onClick={() => setActiveTab('nutrition')} icon={Utensils} label="Nutrición" />
        <TabButton active={activeTab === 'workout'} onClick={() => setActiveTab('workout')} icon={Dumbbell} label="Entrenamiento" />
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Evolución de Peso</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
              <div className="space-y-3">
                <InfoRow label="Edad" value={calculateAge(client.personalInfo.birthDate) + ' años'} />
                <InfoRow label="Altura" value={client.personalInfo.height + ' cm'} />
                <InfoRow label="Género" value={client.personalInfo.gender === 'male' ? 'Masculino' : 'Femenino'} />
                <InfoRow label="Actividad" value={client.personalInfo.activityLevel} />
                <InfoRow label="Objetivo" value={client.personalInfo.goal.replace('_', ' ')} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Historial de Progreso</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Fecha</th>
                  <th className="text-left py-2">Peso</th>
                  <th className="text-left py-2">Cambio</th>
                  <th className="text-left py-2">Notas</th>
                </tr>
              </thead>
              <tbody>
                {[...client.progress].reverse().map((entry, index, arr) => {
                  const prevWeight = arr[index + 1]?.weight || client.personalInfo.initialWeight;
                  const change = entry.weight - prevWeight;
                  return (
                    <tr key={entry.id} className="border-b border-gray-100">
                      <td className="py-2">{format(entry.date.toDate ? entry.date.toDate() : entry.date, 'dd/MM/yyyy')}</td>
                      <td className="py-2">{entry.weight} kg</td>
                      <td className={py-2 ${change < 0 ? 'text-green-600' : 'text-red-600'}}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)} kg
                      </td>
                      <td className="py-2 text-gray-600">{entry.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'nutrition' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Plan Nutricional</h3>
          <p className="text-gray-600">El plan nutricional se mostrará aquí una vez generado.</p>
        </div>
      )}

      {activeTab === 'workout' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Plan de Entrenamiento</h3>
          <p className="text-gray-600">El plan de entrenamiento se mostrará aquí una vez generado.</p>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
      active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-2 border-b border-gray-100">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const calculateAge = (birthDate: Date) => {
  const today = new Date();
  const birth = birthDate.toDate ? birthDate.toDate() : birthDate;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};