import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { WorkoutPlan, WorkoutDay, Exercise } from '../../types';
import { Dumbbell, Check, Clock } from 'lucide-react';

export const ClientWorkout = () => {
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'workoutPlans'),
      where('clientId', '==', user.uid),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setPlan({ id: doc.id, ...doc.data() } as WorkoutPlan);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleExercise = async (dayIndex: number, exerciseIndex: number) => {
    if (!plan || !user) return;

    const newSchedule = [...plan.schedule];
    const exercise = newSchedule[dayIndex].exercises[exerciseIndex];
    exercise.completed = !exercise.completed;

    await updateDoc(doc(db, 'workoutPlans', plan.id), {
      schedule: newSchedule
    });
  };

  if (loading) return <div>Cargando...</div>;
  if (!plan) return <div className="p-6">No tienes un plan de entrenamiento activo</div>;

  const today = new Date().getDay();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const todayName = dayNames[today];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{plan.name}</h2>
          <p className="text-gray-600">{plan.goal} • {plan.difficulty}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {plan.schedule.map((day, dayIndex) => (
          <DayCard 
            key={day.day} 
            day={day} 
            isToday={day.day === todayName}
            onToggleExercise={(exIndex) => toggleExercise(dayIndex, exIndex)}
          />
        ))}
      </div>
    </div>
  );
};

const DayCard = ({ day, isToday, onToggleExercise }: { day: WorkoutDay; isToday: boolean; onToggleExercise: (index: number) => void }) => {
  if (day.restDay) {
    return (
      <div className={p-6 rounded-lg ${isToday ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-100'}}>
        <h3 className="font-semibold text-lg">{day.day}</h3>
        <p className="text-gray-600">Día de descanso 💤</p>
      </div>
    );
  }

  return (
    <div className={p-6 rounded-lg shadow ${isToday ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white'}}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">{day.day}</h3>
        {isToday && <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">Hoy</span>}
      </div>

      <div className="space-y-3">
        {day.exercises.map((exercise, index) => (
          <div 
            key={exercise.id}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              exercise.completed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => onToggleExercise(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  exercise.completed ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-300'
                }`}
              >
                {exercise.completed && <Check className="w-5 h-5" />}
              </button>
              <div>
                <p className={font-medium ${exercise.completed ? 'line-through text-gray-500' : ''}}>
                  {exercise.name}
                </p>
                <p className="text-sm text-gray-600">{exercise.muscleGroup}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Dumbbell className="w-4 h-4" />
                {exercise.sets} x {exercise.reps}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {exercise.rest}s
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};