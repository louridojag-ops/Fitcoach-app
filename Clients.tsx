import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import { ClientProfile } from '../../types';
import { Link } from 'react-router-dom';
import { Plus, Search, Mail, Phone } from 'lucide-react';

export const CoachClients = () => {
  const { user } = useAuthStore();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'clients'), where('coachId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as ClientProfile[];
      setClients(clientsData);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredClients = clients.filter(client => 
    client.personalInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.personalInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.target as HTMLFormElement);
    
    const newClient = {
      coachId: user.uid,
      personalInfo: {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        birthDate: new Date(formData.get('birthDate') as string),
        gender: formData.get('gender'),
        height: Number(formData.get('height')),
        initialWeight: Number(formData.get('weight')),
        currentWeight: Number(formData.get('weight')),
        targetWeight: Number(formData.get('targetWeight')),
        activityLevel: formData.get('activityLevel'),
        goal: formData.get('goal'),
      },
      medicalInfo: {
        conditions: [],
        injuries: [],
        dietaryRestrictions: []
      },
      progress: [],
      photos: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await addDoc(collection(db, 'clients'), newClient);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Mis Clientes</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <ClientCard key={client.uid} client={client} />
        ))}
      </div>

      {showAddModal && (
        <AddClientModal onClose={() => setShowAddModal(false)} onSubmit={handleAddClient} />
      )}
    </div>
  );
};

const ClientCard = ({ client }: { client: ClientProfile }) => {
  const progress = client.personalInfo.initialWeight - client.personalInfo.currentWeight;
  const progressPercent = ((progress / (client.personalInfo.initialWeight - client.personalInfo.targetWeight)) * 100).toFixed(0);

  return (
    <Link to={/coach/clients/${client.uid}} className="block">
      <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
        <div className="flex items-center mb-4">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
            {client.personalInfo?.name?.[0] || '?'}
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-lg">{client.personalInfo?.name || 'Sin nombre'}</h3>
            <p className="text-sm text-gray-500 capitalize">{client.personalInfo?.goal?.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Peso actual:</span>
            <span className="font-medium">{client.personalInfo?.currentWeight} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Objetivo:</span>
            <span className="font-medium">{client.personalInfo?.targetWeight} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Progreso:</span>
            <span className={font-medium ${Number(progressPercent) > 0 ? 'text-green-600' : 'text-red-600'}}>
              {progressPercent}%
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            {client.progress.length} registros
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            {client.photos.length} fotos
          </span>
        </div>
      </div>
    </Link>
  );
};

const AddClientModal = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: (e: React.FormEvent) => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold">Agregar Nuevo Cliente</h3>
      </div>
      
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input name="phone" type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
            <input name="birthDate" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
            <input name="height" type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso actual (kg)</label>
            <input name="weight" type="number" step="0.1" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso objetivo (kg)</label>
            <input name="targetWeight" type="number" step="0.1" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
            <select name="gender" required className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de actividad</label>
            <select name="activityLevel" required className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="sedentary">Sedentario</option>
              <option value="light">Ligero</option>
              <option value="moderate">Moderado</option>
              <option value="active">Activo</option>
              <option value="very_active">Muy activo</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
          <select name="goal" required className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="lose_weight">Perder peso</option>
            <option value="gain_muscle">Ganar músculo</option>
            <option value="maintain">Mantener</option>
            <option value="improve_health">Mejorar salud</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Guardar Cliente
          </button>
        </div>
      </form>
    </div>
  </div>
);