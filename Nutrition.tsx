import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { NutritionPlan, Meal } from '../../types';
import { Utensils, Droplets, Pill } from 'lucide-react';

export const ClientNutrition = () => {
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'nutritionPlans'),
      where('clientId', '==', user.uid),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setPlan({ id: doc.id, ...doc.data() } as NutritionPlan);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <div>Cargando...</div>;
  if (!plan) return <div className="p-6">No tienes un plan nutricional activo</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Mi Alimentación</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MacroCard title="Calorías" value={plan.dailyCalories} unit="kcal" color="bg-orange-100 text-orange-600" />
        <MacroCard title="Proteínas" value={plan.macros.protein} unit="g" color="bg-red-100 text-red-600" />
        <MacroCard title="Carbohidratos" value={plan.macros.carbs} unit="g" color="bg-yellow-100 text-yellow-600" />
        <MacroCard title="Grasas" value={plan.macros.fats} unit="g" color="bg-blue-100 text-blue-600" />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
        <Droplets className="w-6 h-6 text-blue-600" />
        <div>
          <p className="font-medium">Meta de agua diaria</p>
          <p className="text-2xl font-bold text-blue-600">{plan.waterIntake} ml</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Comidas del día</h3>
        {plan.meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} />
        ))}
      </div>

      {plan.supplements && plan.supplements.length > 0 && (
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Pill className="w-5 h-5 text-purple-600" />
            Suplementos recomendados
          </h3>
          <ul className="space-y-2">
            {plan.supplements.map((supplement, index) => (
              <li key={index} className="flex items-center gap-2 text-purple-800">
                <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                {supplement}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const MacroCard = ({ title, value, unit, color }: { title: string; value: number; unit: string; color: string }) => (
  <div className={p-4 rounded-lg ${color}}>
    <p className="text-sm opacity-80">{title}</p>
    <p className="text-2xl font-bold">{value} <span className="text-sm">{unit}</span></p>
  </div>
);

const MealCard = ({ meal }: { meal: Meal }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="flex justify-between items-center mb-3">
      <h4 className="font-semibold flex items-center gap-2">
        <Utensils className="w-5 h-5 text-gray-400" />
        {meal.name}
      </h4>
      <span className="text-sm text-gray-500">{meal.time}</span>
    </div>
    <div className="space-y-2">
      {meal.foods.map((food, index) => (
        <div key={index} className="flex justify-between text-sm">
          <span>{food.name} <span className="text-gray-500">({food.portion})</span></span>
          <span className="text-gray-600">{food.calories} kcal</span>
        </div>
      ))}
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm font-medium">
      <span>Total</span>
      <span>{meal.calories} kcal</span>
    </div>
  </div>
);