export interface User {
  uid: string;
  email: string;
  role: 'client' | 'coach';
  displayName: string;
  photoURL?: string;
  createdAt: Date;
}

export interface ClientProfile {
  uid: string;
  coachId: string;
  personalInfo: {
    name: string;
    birthDate: Date;
    gender: 'male' | 'female' | 'other';
    height: number;
    initialWeight: number;
    currentWeight: number;
    targetWeight: number;
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    goal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_health';
  };
  medicalInfo: {
    conditions: string[];
    injuries: string[];
    dietaryRestrictions: string[];
  };
  progress: ProgressEntry[];
  photos: PhotoEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressEntry {
  id: string;
  date: Date;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  notes?: string;
}

export interface PhotoEntry {
  id: string;
  date: Date;
  url: string;
  type: 'front' | 'side' | 'back';
}

export interface NutritionPlan {
  id: string;
  clientId: string;
  coachId: string;
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  meals: Meal[];
  waterIntake: number;
  supplements?: string[];
  notes: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  foods: FoodItem[];
  calories: number;
}

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface WorkoutPlan {
  id: string;
  clientId: string;
  coachId: string;
  name: string;
  goal: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  schedule: WorkoutDay[];
  notes: string;
  startDate: Date;
  isActive: boolean;
}

export interface WorkoutDay {
  day: string;
  exercises: Exercise[];
  restDay: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  rest: number;
  videoUrl?: string;
  notes?: string;
  completed?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'client' | 'coach';
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  read: boolean;
}

export interface Chat {
  id: string;
  clientId: string;
  coachId: string;
  clientName: string;
  coachName: string;
  lastMessage?: Message;
  unreadCount: {
    client: number;
    coach: number;
  };
  updatedAt: Date;
}