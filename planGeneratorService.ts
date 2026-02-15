import { ClientProfile, NutritionPlan, WorkoutPlan, Exercise, Meal, FoodItem } from '../types';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface BodyMetrics {
  bmi: number;
  bmr: number;
  tdee: number;
  bodyFat?: number;
  lbm: number;
}

export class PlanGeneratorService {
  private static foodDatabase: Record<string, FoodItem[]> = {
    proteins: [
      { name: 'Pechuga de pollo', portion: '150g', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
      { name: 'Salmón', portion: '150g', calories: 208, protein: 20, carbs: 0, fats: 13 },
      { name: 'Huevos', portion: '3 unidades', calories: 210, protein: 18, carbs: 1.2, fats: 15 },
      { name: 'Atún en lata', portion: '150g', calories: 132, protein: 28, carbs: 0, fats: 1 },
      { name: 'Res magra', portion: '150g', calories: 186, protein: 26, carbs: 0, fats: 8 },
      { name: 'Tofu', portion: '150g', calories: 114, protein: 12, carbs: 3, fats: 6 },
    ],
    carbs: [
      { name: 'Arroz integral', portion: '100g cocido', calories: 111, protein: 2.6, carbs: 23, fats: 0.9 },
      { name: 'Avena', portion: '80g', calories: 304, protein: 10, carbs: 52, fats: 5 },
      { name: 'Batata', portion: '200g', calories: 172, protein: 3, carbs: 40, fats: 0.1 },
      { name: 'Quinoa', portion: '100g cocida', calories: 120, protein: 4.4, carbs: 21, fats: 1.9 },
      { name: 'Pasta integral', portion: '100g cocida', calories: 124, protein: 5, carbs: 25, fats: 0.5 },
    ],
    fats: [
      { name: 'Aguacate', portion: '1/2 unidad', calories: 160, protein: 2, carbs: 8.5, fats: 14.7 },
      { name: 'Almendras', portion: '30g', calories: 184, protein: 6, carbs: 6, fats: 16 },
      { name: 'Aceite de oliva', portion: '15ml', calories: 120, protein: 0, carbs: 0, fats: 14 },
    ],
    vegetables: [
      { name: 'Brócoli', portion: '150g', calories: 51, protein: 4.3, carbs: 10, fats: 0.6 },
      { name: 'Espinacas', portion: '100g', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
      { name: 'Pimientos', portion: '150g', calories: 46, protein: 1.5, carbs: 9, fats: 0.4 },
    ],
    fruits: [
      { name: 'Manzana', portion: '1 mediana', calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
      { name: 'Plátano', portion: '1 mediano', calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
      { name: 'Arándanos', portion: '100g', calories: 57, protein: 0.7, carbs: 14, fats: 0.3 },
    ]
  };

  private static exerciseDatabase: Record<string, Partial<Exercise>[]> = {
    chest: [
      { name: 'Press de banca con barra', muscleGroup: 'Pecho', sets: 4, reps: '8-10', rest: 90 },
      { name: 'Press inclinado con mancuernas', muscleGroup: 'Pecho', sets: 3, reps: '10-12', rest: 75 },
      { name: 'Aperturas con mancuernas', muscleGroup: 'Pecho', sets: 3, reps: '12-15', rest: 60 },
      { name: 'Fondos en paralelas', muscleGroup: 'Pecho', sets: 3, reps: '10-12', rest: 75 },
    ],
    back: [
      { name: 'Peso muerto convencional', muscleGroup: 'Espalda', sets: 4, reps: '6-8', rest: 120 },
      { name: 'Dominadas', muscleGroup: 'Espalda', sets: 4, reps: '8-10', rest: 90 },
      { name: 'Remo con barra', muscleGroup: 'Espalda', sets: 4, reps: '8-10', rest: 90 },
      { name: 'Jalón al pecho', muscleGroup: 'Espalda', sets: 3, reps: '10-12', rest: 75 },
    ],
    legs: [
      { name: 'Sentadilla trasera', muscleGroup: 'Piernas', sets: 4, reps: '8-10', rest: 120 },
      { name: 'Prensa de piernas', muscleGroup: 'Piernas', sets: 4, reps: '10-12', rest: 90 },
      { name: 'Peso muerto rumano', muscleGroup: 'Piernas', sets: 4, reps: '10-12', rest: 90 },
      { name: 'Zancadas caminando', muscleGroup: 'Piernas', sets: 3, reps: '12 cada pierna', rest: 60 },
    ],
    shoulders: [
      { name: 'Press militar con barra', muscleGroup: 'Hombros', sets: 4, reps: '8-10', rest: 90 },
      { name: 'Elevaciones laterales', muscleGroup: 'Hombros', sets: 4, reps: '12-15', rest: 60 },
      { name: 'Elevaciones frontales', muscleGroup: 'Hombros', sets: 3, reps: '12-15', rest: 60 },
    ],
    arms: [
      { name: 'Curl de bíceps con barra', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', rest: 60 },
      { name: 'Curl martillo', muscleGroup: 'Bíceps', sets: 3, reps: '10-12', rest: 60 },
      { name: 'Extensión de tríceps en polea', muscleGroup: 'Tríceps', sets: 4, reps: '12-15', rest: 60 },
    ],
    core: [
      { name: 'Plancha frontal', muscleGroup: 'Core', sets: 3, reps: '45-60 seg', rest: 45 },
      { name: 'Crunch abdominal', muscleGroup: 'Core', sets: 3, reps: '15-20', rest: 45 },
      { name: 'Elevación de piernas', muscleGroup: 'Core', sets: 3, reps: '12-15', rest: 45 },
    ]
  };

  static calculateMetrics(client: ClientProfile): BodyMetrics {
    const { height, currentWeight, birthDate, gender, activityLevel } = client.personalInfo;
    const age = this.calculateAge(birthDate);
    
    const heightInMeters = height / 100;
    const bmi = currentWeight / (heightInMeters * heightInMeters);
    
    let bmr = (10 * currentWeight) + (6.25 * height) - (5 * age);
    bmr += gender === 'male' ? 5 : -161;
    
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const tdee = Math.round(bmr * activityMultipliers[activityLevel]);
    
    const bodyFat = gender === 'male' 
      ? (1.20 * bmi) + (0.23 * age) - 16.2
      : (1.20 * bmi) + (0.23 * age) - 5.4;
    
    const lbm = currentWeight * (1 - (bodyFat / 100));
    
    return { bmi, bmr, tdee, bodyFat, lbm };
  }

  static async generateNutritionPlan(clientId: string, coachId: string, client: ClientProfile): Promise<string> {
    const metrics = this.calculateMetrics(client);
    const { goal, medicalInfo } = client.personalInfo;
    
    let targetCalories = metrics.tdee;
    let macroStrategy: 'balanced' | 'lowCarb' | 'highProtein' = 'balanced';
    
    switch (goal) {
      case 'lose_weight':
        targetCalories -= 500;
        macroStrategy = 'lowCarb';
        break;
      case 'gain_muscle':
        targetCalories += 300;
        macroStrategy = 'highProtein';
        break;
      case 'maintain':
        macroStrategy = 'balanced';
        break;
      case 'improve_health':
        targetCalories = metrics.tdee;
        macroStrategy = 'balanced';
        break;
    }

    if (medicalInfo.conditions.includes('diabetes')) {
      macroStrategy = 'lowCarb';
    }

    const macros = this.calculateMacros(targetCalories, metrics.lbm, macroStrategy, goal);
    const meals = this.generateMeals(targetCalories, macros, medicalInfo.dietaryRestrictions);
    
    const planRef = doc(collection(db, 'nutritionPlans'));
    const plan: Omit<NutritionPlan, 'id'> = {
      clientId,
      coachId,
      dailyCalories: targetCalories,
      macros,
      meals,
      waterIntake: Math.round(metrics.lbm * 40),
      supplements: this.recommendSupplements(client, metrics),
      notes: Plan generado automáticamente. Estrategia: ${macroStrategy},
      startDate: new Date(),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      isActive: true
    };
    
    await setDoc(planRef, {
      ...plan,
      startDate: serverTimestamp(),
      endDate: serverTimestamp()
    });
    
    return planRef.id;
  }

  static async generateWorkoutPlan(clientId: string, coachId: string, client: ClientProfile): Promise<string> {
    const { activityLevel, goal, medicalInfo } = client.personalInfo;
    const metrics = this.calculateMetrics(client);
    
    const experienceLevel = this.determineExperienceLevel(activityLevel, metrics.bmi);
    const trainingDays = this.determineTrainingFrequency(experienceLevel, goal);
    const splitType = this.determineSplitType(trainingDays, goal);
    const schedule = this.generateSchedule(splitType, trainingDays, experienceLevel, medicalInfo.injuries);
    
    const volumeModifier = goal === 'lose_weight' ? 1.2 : 1.0;

    const planRef = doc(collection(db, 'workoutPlans'));
    const plan: Omit<WorkoutPlan, 'id'> = {
      clientId,
      coachId,
      name: this.generatePlanName(goal, experienceLevel),
      goal: goal === 'lose_weight' ? 'Pérdida de grasa' : 
            goal === 'gain_muscle' ? 'Hipertrofia muscular' : 
            goal === 'improve_health' ? 'Salud y condición' : 'Mantenimiento',
      difficulty: experienceLevel,
      duration: 4,
      schedule: schedule.map(day => ({
        ...day,
        exercises: day.exercises.map(ex => ({
          ...ex,
          sets: Math.round(ex.sets! * volumeModifier),
          id: Math.random().toString(36).substr(2, 9)
        }))
      })),
      notes: Plan ${splitType}. Frecuencia: ${trainingDays} días/semana,
      startDate: new Date(),
      isActive: true
    };
    
    await setDoc(planRef, {
      ...plan,
      startDate: serverTimestamp()
    });
    
    return planRef.id;
  }

  private static calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  private static calculateMacros(calories: number, lbm: number, strategy: string, goal: string) {
    let protein = 0, carbs = 0, fats = 0;
    
    switch (strategy) {
      case 'highProtein':
        protein = Math.round(lbm * 2.2);
        fats = Math.round((calories * 0.25) / 9);
        carbs = Math.round((calories - (protein * 4) - (fats * 9)) / 4);
        break;
      case 'lowCarb':
        protein = Math.round(lbm * 2.0);
        fats = Math.round((calories * 0.40) / 9);
        carbs = Math.round((calories * 0.15) / 4);
        break;
      case 'balanced':
      default:
        protein = goal === 'gain_muscle' ? Math.round(lbm * 2.0) : Math.round(lbm * 1.6);
        fats = Math.round((calories * 0.30) / 9);
        carbs = Math.round((calories - (protein * 4) - (fats * 9)) / 4);
    }
    
    return { protein, carbs, fats };
  }

  private static generateMeals(calories: number, macros: any, restrictions: string[]): Meal[] {
    const mealDistribution = [
      { name: 'Desayuno', calories: 0.25, time: '08:00' },
      { name: 'Snack AM', calories: 0.10, time: '11:00' },
      { name: 'Almuerzo', calories: 0.30, time: '14:00' },
      { name: 'Snack PM', calories: 0.10, time: '17:00' },
      { name: 'Cena', calories: 0.25, time: '20:00' }
    ];

    const isVegan = restrictions.includes('vegan');
    const isVegetarian = restrictions.includes('vegetarian') || isVegan;
    const noGluten = restrictions.includes('gluten-free');

    return mealDistribution.map(meal => {
      const targetCalories = Math.round(calories * meal.calories);
      
      const foods: FoodItem[] = [];
      
      const proteinSources = isVegan 
        ? this.foodDatabase.proteins.filter(f => ['Tofu'].includes(f.name))
        : isVegetarian 
        ? this.foodDatabase.proteins.filter(f => ['Huevos', 'Tofu'].includes(f.name))
        : this.foodDatabase.proteins;
      
      const mainProtein = proteinSources[Math.floor(Math.random() * proteinSources.length)];
      foods.push(mainProtein);

      if (meal.name !== 'Cena') {
        const carb = this.foodDatabase.carbs[Math.floor(Math.random() * this.foodDatabase.carbs.length)];
        if (!noGluten || !['Pasta integral'].includes(carb.name)) {
          foods.push(carb);
        }
      }

      const veg = this.foodDatabase.vegetables[Math.floor(Math.random() * this.foodDatabase.vegetables.length)];
      foods.push(veg);

      if (meal.name === 'Desayuno' || meal.name === 'Cena') {
        const fat = this.foodDatabase.fats[Math.floor(Math.random() * this.foodDatabase.fats.length)];
        foods.push(fat);
      }

      if (meal.name.includes('Snack')) {
        const fruit = this.foodDatabase.fruits[Math.floor(Math.random() * this.foodDatabase.fruits.length)];
        foods.push(fruit);
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: meal.name,
        time: meal.time,
        foods,
        calories: foods.reduce((sum, f) => sum + f.calories, 0)
      };
    });
  }

  private static recommendSupplements(client: ClientProfile, metrics: BodyMetrics): string[] {
    const supplements: string[] = [];
    const { goal, dietaryRestrictions } = client.personalInfo;
    
    if (goal === 'gain_muscle') {
      supplements.push('Proteína whey (post-entreno)');
      supplements.push('Creatina monohidratada (5g diarios)');
    }
    
    if (goal === 'lose_weight') {
      supplements.push('Cafeína (pre-entreno)');
      supplements.push('Omega-3 (2g diarios)');
    }
    
    if (metrics.bodyFat && metrics.bodyFat > 25) {
      supplements.push('Vitamina D3 (2000 UI)');
    }
    
    if (dietaryRestrictions.includes('vegetarian') || dietaryRestrictions.includes('vegan')) {
      supplements.push('B12 (1000mcg)');
    }
    
    return supplements;
  }

  private static determineExperienceLevel(activityLevel: string, bmi: number) {
    if (activityLevel === 'sedentary' || bmi > 30) return 'beginner';
    if (activityLevel === 'very_active') return 'advanced';
    return 'intermediate';
  }

  private static determineTrainingFrequency(level: string, goal: string): number {
    const frequencies: any = {
      beginner: 3,
      intermediate: goal === 'lose_weight' ? 5 : 4,
      advanced: goal === 'lose_weight' ? 6 : 5
    };
    return frequencies[level];
  }

  private static determineSplitType(days: number, goal: string): string {
    if (days <= 3) return 'fullBody';
    if (days === 4) return 'upperLower';
    if (days === 5) return 'pushPullLegs';
    return 'broSplit';
  }

  private static generateSchedule(splitType: string, days: number, level: string, injuries: string[]) {
    const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const schedule: any[] = [];
    
    const splitPatterns: Record<string, string[][]> = {
      fullBody: [['legs', 'chest', 'back', 'shoulders', 'arms']],
      upperLower: [['chest', 'back', 'shoulders', 'arms'], ['legs', 'core']],
      pushPullLegs: [['chest', 'shoulders', 'arms'], ['back', 'arms'], ['legs', 'core']],
      broSplit: [['chest'], ['back'], ['legs'], ['shoulders'], ['arms', 'core']]
    };

    const pattern = splitPatterns[splitType];
    let patternIndex = 0;
    let dayIndex = 0;

    weekDays.forEach((day, idx) => {
      const isRestDay = (splitType === 'fullBody' && idx !== 0 && idx !== 2 && idx !== 4) ||
                       (splitType === 'upperLower' && (idx === 2 || idx === 5 || idx === 6)) ||
                       (splitType === 'pushPullLegs' && (idx === 3 || idx === 6)) ||
                       (splitType === 'broSplit' && (idx === 5 || idx === 6));

      if (isRestDay || dayIndex >= days) {
        schedule.push({ day, restDay: true, exercises: [] });
        return;
      }

      const muscleGroups = pattern[patternIndex % pattern.length];
      
      const exercises = muscleGroups.flatMap((group: string) => {
        const groupExercises = this.exerciseDatabase[group] || [];
        return groupExercises
          .filter((ex: any) => !injuries.some((inj: string) => 
            ex.muscleGroup?.toLowerCase().includes(inj.toLowerCase())
          ))
          .slice(0, level === 'beginner' ? 2 : 3);
      });

      schedule.push({
        day,
        restDay: false,
        exercises: exercises.map((ex: any) => ({
          ...ex,
          completed: false
        }))
      });

      patternIndex++;
      dayIndex++;
    });

    return schedule;
  }

  private static generatePlanName(goal: string, level: string): string {
    const names: any = {
      lose_weight: { beginner: 'Quema de Grasa Básico', intermediate: 'Definición Avanzada', advanced: 'Shred Intenso' },
      gain_muscle: { beginner: 'Hipertrofia Inicial', intermediate: 'Masa Muscular', advanced: 'Volumen Extremo' },
      maintain: { beginner: 'Condición Física', intermediate: 'Mantenimiento Activo', advanced: 'Rendimiento' },
      improve_health: { beginner: 'Salud y Bienestar', intermediate: 'Fitness Funcional', advanced: 'Atleta' }
    };
    return names[goal]?.[level] || 'Plan Personalizado';
  }
}