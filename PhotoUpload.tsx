import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../../services/firebase';
import { Camera, Upload, X, Check } from 'lucide-react';

interface PhotoUploadProps {
  clientId: string;
}

type PhotoType = 'front' | 'side' | 'back';

export const PhotoUpload = ({ clientId }: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<PhotoType>('front');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!preview || !fileInputRef.current?.files?.[0]) return;
    
    setUploading(true);
    try {
      const file = fileInputRef.current.files[0];
      const timestamp = Date.now();
      const storageRef = ref(storage, progress-photos/${clientId}/${selectedType}_${timestamp}.jpg);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await addDoc(collection(db, 'clients', clientId, 'photos'), {
        url,
        type: selectedType,
        date: serverTimestamp(),
        timestamp
      });
      
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      alert('Foto subida exitosamente');
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Camera className="w-5 h-5 mr-2" />
        Subir Foto de Progreso
      </h3>
      
      <div className="flex space-x-2 mb-4">
        {(['front', 'side', 'back'] as PhotoType[]).map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg capitalize ${
              selectedType === type 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'front' ? 'Frente' : type === 'side' ? 'Lateral' : 'Espalda'}
          </button>
        ))}
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-64 mx-auto rounded-lg object-cover"
            />
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer"
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Haz clic para seleccionar foto</p>
            <p className="text-sm text-gray-400 mt-1">PNG, JPG hasta 10MB</p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {preview && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        >
          {uploading ? (
            'Subiendo...'
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Confirmar Subida
            </>
          )}
        </button>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Consejos para la foto:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Usa ropa ajustada o traje de baño</li>
          <li>• Buena iluminación natural de frente</li>
          <li>• Fondo neutro y despejado</li>
          <li>• Postura relajada, mirada al frente</li>
          <li>• Toma la foto a la misma hora y lugar</li>
        </ul>
      </div>
    </div>
  );
};