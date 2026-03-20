export interface ShapeAnalysis {
  overallScore: number;
  bfEstimate: number;
  metrics: {
    volume: number;
    definition: number;
    symmetry: number;
    density: number;
  };
  proportions: {
    description: string;
    imbalances: string[];
  };
  analysis: {
    strengths: string[];
    weaknesses: string[];
    summary: string;
    pumpAnalysis?: {
      vascularityScore: number;
      volumeIncrease: string;
      comparison: string;
    };
  };
  symmetryRanking?: {
    score: number;
    position: number;
    percentile: number;
    globalPosition: string;
  };
  recommendations: {
    trainingFocus: string;
    correctiveExercises: string[];
    dietPhase: 'Cutting' | 'Bulking' | 'Recomposição';
    macros: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
    tips: string[];
  };
}

export interface EvolutionEntry {
  date: string;
  score: number;
  bf: number;
  weight: number;
  volume: number;
  definition: number;
  symmetry: number;
  consistency?: number; // 0-100%
  photo?: string;
}

export interface UserProfile {
  weight: number;
  height: number;
  goal: 'Cutting' | 'Bulking' | 'Recomposição';
  wristCircumference?: number;
  ankleCircumference?: number;
  trainingDays?: string[]; // ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
  completedWorkouts?: string[]; // ['2026-03-19', '2026-03-21']
  waterIntake?: number; // cups
  gymLevel?: 'Básica' | 'Média' | 'Elite';
}

export interface FoodAnalysis {
  items: {
    name: string;
    estimatedWeight: number;
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  }[];
  totalMacros: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
}

export interface ExerciseAnalysis {
  exerciseName: string;
  biomechanicsScore: number;
  errors: string[];
  corrections: string[];
  summary: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  technique: string;
  rest: string;
  tip: string;
  completed?: boolean;
}

export interface TrainingDay {
  day: string;
  title: string;
  focus: string;
  exercises: Exercise[];
  macros?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface TrainingPlan {
  days: TrainingDay[];
}

export interface MealItem {
  name: string;
  amount: string;
}

export interface Meal {
  id: string;
  title: string;
  time: string;
  items: MealItem[];
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
  tip: string;
}

export interface MealPlan {
  meals: Meal[];
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}
