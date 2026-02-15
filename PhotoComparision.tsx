import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { PhotoEntry } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Scale } from 'lucide-react';

interface PhotoComparisonProps {
  clientId: string;
}

export const PhotoComparison = ({ clientId }: PhotoComparisonProps) => {
  const [photos, setPhotos] = useState<Record<string, PhotoEntry[]>>({ front: [], side: [], back: [] });
  const [selectedType, setSelectedType] = useState<'front' | 'side' | 'back'>('front');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [compareIndex, setCompareIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'clients', clientId, 'photos'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const grouped: Record<string, PhotoEntry[]> = { front: [], side: [], back: [] };
      
      snapshot.docs.forEach(doc => {
        const photo = { id: doc.id, ...doc.data(), date: doc.data().date.toDate() } as PhotoEntry;
        if (grouped[photo.type]) {
          grouped[photo.type].push(photo);
        }
      });
      
      setPhotos(grouped);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId]);

  const currentPhotos = photos[selectedType];
  const currentPhoto = currentPhotos[currentIndex];
  const comparePhoto = compareIndex !== null ? currentPhotos[compareIndex] : null;

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.min(prev + 1, currentPhotos.length - 1));
    setCompareIndex(null);
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
    setCompareIndex(null);
  };

  const toggleCompare = () => {
    if (compareIndex === null && currentPhotos.length > 1) {
      setCompareIndex(currentIndex === currentPhotos.length - 1 ? currentIndex - 1 : currentPhotos.length - 1);
    } else {
      setCompareIndex(null);
    }
  };

  if (loading) return <div>Cargando fotos...</div>;
  if (currentPhotos.length === 0) return <div>No hay fotos disponibles</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Comparación de Progreso</h3>
        
        <div className="flex space-x-2">
          {(['front', 'side', 'back'] as const).map(type => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
                setCurrentIndex(0);
                setCompareIndex(null);
              }}
              className={`px-3 py-1 rounded text-sm capitalize ${
                selectedType === type ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              {type === 'front' ? 'Frente' : type === 'side' ? 'Lateral' : 'Espalda'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex >= currentPhotos.length - 1}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <p className="font-medium">
            {format(currentPhoto.date, 'dd MMM yyyy', { locale: es })}
          </p>
          <p className="text-sm text-gray-500">
            Foto {currentIndex + 1} de {currentPhotos.length}
          </p>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === 0}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className={grid gap-4 ${comparePhoto ? 'grid-cols-2' : 'grid-cols-1'}}>
        <div className="relative">
          <img
            src={currentPhoto.url}
            alt="Progreso actual"
            className="w-full h-96 object-cover rounded-lg"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {format(currentPhoto.date, 'dd/MM/yyyy')}
          </div>
        </div>

        {comparePhoto && (
          <div className="relative">
            <img
              src={comparePhoto.url}
              alt="Comparación"
              className="w-full h-96 object-cover rounded-lg"
            />
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {format(comparePhoto.date, 'dd/MM/yyyy')}
            </div>
          </div>
        )}
      </div>

      {currentPhotos.length > 1 && (
        <div className="mt-4 flex justify-center space-x-4">
          <button
            onClick={toggleCompare}
            className={`px-4 py-2 rounded-lg flex items-center ${
              compareIndex !== null 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Scale className="w-4 h-4 mr-2" />
            {compareIndex !== null ? 'Cerrar comparación' : 'Comparar con inicio'}
          </button>
        </div>
      )}

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Línea de tiempo</h4>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {currentPhotos.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => {
                setCurrentIndex(idx);
                setCompareIndex(null);
              }}
              className={`flex-shrink-0 relative ${
                idx === currentIndex ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              <img
                src={photo.url}
                alt=""
                className="w-20 h-20 object-cover rounded"
              />
              <span className="text-xs text-gray-500 mt-1 block">
                {format(photo.date, 'dd/MM')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};