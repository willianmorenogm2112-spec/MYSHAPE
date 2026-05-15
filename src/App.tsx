import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  Camera,
  Zap,
  Target,
  Shield,
  Info,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Award,
  Dumbbell,
  Utensils,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Scale,
  Calculator,
  Crown,
  Play,
  Box,
  Video,
  Trophy,
  Sparkles,
  Lock,
  Droplets,
  Flame,
  Calendar,
  Check,
  Minus,
  Clock,
  X,
  Plus,
  ArrowLeft,
  ArrowRight,
  Settings2,
  ShoppingCart,
  User,
  Mail,
  LogOut,
  Settings,
  ShieldCheck,
  Bell,
  Activity,
  Ruler,
  Moon,
  Sun,
  ShieldAlert,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db, googleProvider } from "./lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import Markdown from 'react-markdown';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  analyzeShape,
  chatWithCoach,
  projectShape,
  generatePersonalizedTraining,
  generateMealPlan,
  generateTrainingPlan,
  getExerciseDetails,
  generateShoppingList,
  generateRouteDayPlan,
  analyzeFoodPhoto,
  analyzeExerciseVideo,
  generateCorrectivePlan,
} from "./services/geminiService";
import {
  ShapeAnalysis,
  UserProfile,
  EvolutionEntry,
  TrainingPlan,
  MealPlan,
  ShapeAnalysisHistoryItem,
  ProgressCheckIn,
  Badge,
  WorkoutHistoryItem,
} from "./types";
import rehypeRaw from "rehype-raw";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer as RechartsResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import confetti from "canvas-confetti";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [isAdvancedMode, setIsAdvancedMode] = useState(() => {
    return localStorage.getItem("advanced_mode") === "true";
  });
  const [focoMuscular, setFocoMuscular] = useState(() => {
    return localStorage.getItem("foco_muscular") || "Equilibrado";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPoseInstructions, setShowPoseInstructions] = useState(false);

  const getAvatar = (email?: string, name?: string) => {
    if (!email && !name) return `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback`;
    const seed = email || name;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  const [activeTab, setActiveTab] = useState<
    "analyze" | "diet" | "training" | "coach" | "profile" | "dashboard" | "recovery"
  >("dashboard");
  const [profileTab, setProfileTab] = useState<"resumo" | "historico" | "fotos" | "musculos">("resumo");
  const [historySubTab, setHistorySubTab] = useState<"treinos" | "analises">("treinos");
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInPhotos, setCheckInPhotos] = useState<{front?: string, back?: string, side?: string}>({});
  const [checkInWeight, setCheckInWeight] = useState(0);
  const [checkInBf, setCheckInBf] = useState<number | "">("");
  const [checkInNotes, setCheckInNotes] = useState("");
  const [progressCheckIns, setProgressCheckIns] = useState<ProgressCheckIn[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<ShapeAnalysisHistoryItem[]>([]);
  const [badges, setBadges] = useState<Badge[]>([
    { id: '1', name: 'Primeira Análise', description: 'Realizou sua primeira análise de shape.', icon: '🏆', locked: true },
    { id: '2', name: '7 Dias de Foco', description: '7 dias seguidos de streak.', icon: '🔥', locked: true },
    { id: '3', name: 'Guerreiro do Mês', description: '30 dias seguidos de streak.', icon: '🎖️', locked: true },
    { id: '4', name: 'Iniciador', description: 'Primeiro treino gerado.', icon: '💪', locked: true },
    { id: '5', name: 'Defensor da Dieta', description: 'Reduziu 2% de BF.', icon: '🥗', locked: true },
    { id: '6', name: 'Aesthetic', description: 'Conseguiu score acima de 70.', icon: '✨', locked: true },
    { id: '7', name: 'Veterano', description: 'Completou 10 treinos.', icon: '⚔️', locked: true },
  ]);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [isCompetitionMode, setIsCompetitionMode] = useState(false);
  const [isPumpMode, setIsPumpMode] = useState(false);
  const [images, setImages] = useState<{
    front?: string;
    back?: string;
    side?: string;
  }>({});
  const [profile, setProfile] = useState<UserProfile>({
    name: "WILLIAN MORENO",
    avatar: "https://i.pravatar.cc/150?u=willianmorenogm2112@gmail.com",
    weight: 80,
    height: 180,
    goal: "Recomposição",
    startDate: "Maio 2024",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisModel, setAnalysisModel] = useState<'fast' | 'best'>('fast');
  const [isScanning, setIsScanning] = useState(false);
  const [isProjecting, setIsProjecting] = useState(false);
  const [projectedImage, setProjectedImage] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState<
    string | null
  >(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Detectando composição corporal...",
  );
  const [evolutionFilter, setEvolutionFilter] = useState<"1m" | "6m" | "all">(
    "all",
  );
  const [projectionValue, setProjectionValue] = useState(50);
  const [showComparison, setShowComparison] = useState(false);
  const [showGhostOverlay, setShowGhostOverlay] = useState(false);
  const [comparisonIndex, setComparisonIndex] = useState(0);
  const [ghostSlider, setGhostSlider] = useState(50);

  const [personalizedTraining, setPersonalizedTraining] =
    useState<TrainingPlan | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false);
  const [shoppingList, setShoppingList] = useState<any>(null);
  const [routeDayPlan, setRouteDayPlan] = useState<any>(null);
  const [isGeneratingShoppingList, setIsGeneratingShoppingList] =
    useState(false);
  const [isGeneratingRouteDayPlan, setIsGeneratingRouteDayPlan] =
    useState(false);
  const [correctivePlan, setCorrectivePlan] = useState<any>(null);
  const [isGeneratingCorrectivePlan, setIsGeneratingCorrectivePlan] =
    useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [showRouteDayModal, setShowRouteDayModal] = useState(false);
  const [isAnalyzingFood, setIsAnalyzingFood] = useState(false);
  const [foodAnalysis, setFoodAnalysis] = useState<any>(null);
  const [isAnalyzingExercise, setIsAnalyzingExercise] = useState(false);
  const [exerciseAnalysis, setExerciseAnalysis] = useState<any>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [lastDietGenerationDate, setLastDietGenerationDate] = useState<
    string | null
  >(null);
  const [lastTrainingGenerationDate, setLastTrainingGenerationDate] = useState<
    string | null
  >(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const waterGoal = 3500; // 3.5 Liters
  
  useEffect(() => {
    if (waterIntake > 0) {
      saveData();
    }
  }, [waterIntake]);

  useEffect(() => {
    if (subscriptionExpiryDate) {
      const expiry = new Date(subscriptionExpiryDate);
      const now = new Date();
      if (now > expiry) {
        setIsPremium(false);
        setSubscriptionExpiryDate(null);
        alert(
          "Sua assinatura Padrão Ouro expirou. Renove para manter seu progresso!",
        );
      }
    }
  }, [subscriptionExpiryDate]);

  const [result, setResult] = useState<ShapeAnalysis | null>(null);
  const getMuscleStatus = (muscleName: string) => {
    // Normalization map
    const normalization: Record<string, string[]> = {
      'Peito': ['Peitoral', 'Peito', 'Chest', 'Supino', 'Peito Superior', 'Peito Inferior'],
      'Costas Superior': ['Costas', 'Dorsal', 'Lates', 'Trapezio', 'Latissimo', 'Romboides'],
      'Costas Inferior': ['Lombar', 'Eretores', 'Lower Back'],
      'Ombros': ['Ombro', 'Deltoides', 'Ombros', 'Deltoide Anterior', 'Deltoide Lateral', 'Deltoide Posterior'],
      'Bíceps': ['Biceps', 'Bíceps', 'Braço Anterior'],
      'Tríceps': ['Triceps', 'Tríceps', 'Braço Posterior'],
      'Abdômen': ['Abdomen', 'Abdômen', 'Core', 'Abs', 'Obliquos'],
      'Quadríceps': ['Quadriceps', 'Quadríceps', 'Coxa Anterior', 'Pernas'],
      'Posteriores': ['Isquiotibiais', 'Posterior de Coxa', 'Hamstrings', 'Pernas'],
      'Glúteos': ['Gluteos', 'Glúteos', 'Gluteo Maior'],
      'Panturrilhas': ['Panturrilhas', 'Gastrocnemio', 'Soleo']
    };

    const searchNames = normalization[muscleName] || [muscleName];

    // Look in workoutHistory for last workout containing any of these names
    const lastWorkout = [...workoutHistory].reverse().find(w => 
      w.muscles.some((m: string) => searchNames.some(sn => m.toLowerCase().includes(sn.toLowerCase())))
    );

    if (!lastWorkout) return { 
      color: 'var(--color-overlay)', 
      status: 'Sem Dados', 
      days: '?', 
      text: 'text-[var(--color-text-muted)]', 
      bg: 'bg-[var(--color-surface)]',
      desc: 'Sem registros recentes de estímulo para este grupo muscular.'
    };
    
    const diffTime = Math.abs(new Date().getTime() - new Date(lastWorkout.date.split(' ').reverse().join('-')).getTime());
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    if (diffDays <= 1) return { 
      color: 'var(--error)', 
      status: 'Recuperando', 
      days: diffDays, 
      text: 'text-[var(--error)]', 
      bg: 'bg-[var(--error)]/20',
      desc: 'Micro-lesões em reparo. Evite treinar este grupo hoje para maximizar a síntese proteica.'
    };
    if (diffDays === 2) return { 
      color: 'var(--secondary)', 
      status: 'Em Transição', 
      days: diffDays, 
      text: 'text-[var(--secondary)]', 
      bg: 'bg-[var(--secondary)]/20',
      desc: 'Nível moderado de fadiga residual. Treino possível, mas com volume controlado.'
    };
    return { 
      color: 'var(--primary)', 
      status: 'Pronto p/ Treino', 
      days: diffDays, 
      text: 'text-[var(--primary)]', 
      bg: 'bg-[var(--primary)]/20',
      desc: 'Recuperação total atingida. Este grupo está no pico de prontidão para novos estímulos.'
    };
  };

  const handleSaveProfile = async () => {
    saveData();
    setShowProfileSettings(false);
  };

  const handleSaveCheckIn = () => {
    const newCheckIn: ProgressCheckIn = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      weight: checkInWeight,
      bf: typeof checkInBf === 'number' ? checkInBf : undefined,
      notes: checkInNotes,
      photos: { ...checkInPhotos }
    };
    const updated = [newCheckIn, ...progressCheckIns];
    setProgressCheckIns(updated);
    localStorage.setItem("progress_checkins", JSON.stringify(updated));
    saveData();
    setShowCheckInModal(false);
    setCheckInPhotos({});
    setCheckInNotes("");
    setCheckInWeight(0);
    setCheckInBf("");
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const settingsAvatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>, shouldSaveImmediately = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfile((prev) => ({ ...prev, avatar: base64 }));
        if (shouldSaveImmediately) {
          saveData({ profile: { ...profile, avatar: base64 } });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [analysisFilter, setAnalysisFilter] = useState<
    "Tudo" | "Gordura" | "Simetria" | "Definição" | "Plano"
  >("Tudo");
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "coach"; text: string }[]
  >([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [limitResult, setLimitResult] = useState<{
    maxMass: number;
    currentMass: number;
  } | null>(null);
  const [evolutionHistory, setEvolutionHistory] = useState<EvolutionEntry[]>([]);
  const [timeFilter, setTimeFilter] = useState<'1M' | '3M' | '6M' | 'ALL'>('ALL');

  useEffect(() => {
    if (evolutionHistory.length >= 2) {
      setComparisonIndex(evolutionHistory.length - 2);
    }
  }, [evolutionHistory.length]);
  const [dietAnswers, setDietAnswers] = useState<{
    objective?: string;
    activityLevel?: string;
    mealsPerDay?: number;
  }>({});
  const [showDietQuiz, setShowDietQuiz] = useState(true);
  
  // New Diet State
  const [dietMode, setDietMode] = useState<'premium' | 'free' | null>(null);
  const [dietFormPremium, setDietFormPremium] = useState({ age: 25, gender: 'M', height: 175, trainingDays: 5, restrictions: [] as string[] });
  const [dietFormFree, setDietFormFree] = useState({ name: '', gender: 'M', age: 25, height: 175, weight: 70, objective: '', activityLevel: '', mealsPerDay: 4, restrictions: [] as string[] });
  const [dietFreeStep, setDietFreeStep] = useState(1);
  const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);
  const [dietPlan, setDietPlan] = useState<any | null>(null);
  const [expandedMeals, setExpandedMeals] = useState<Record<number, boolean>>({});
  const [expandedShoppingList, setExpandedShoppingList] = useState(false);
  const [dietLoadingMessage, setDietLoadingMessage] = useState('Calculando seus macros...');

  // New Training State
  const [trainingMode, setTrainingMode] = useState<'premium' | 'free' | null>(null);
  const [trainingTab, setTrainingTab] = useState<'generator' | 'my-plan'>('generator');
  const [isEditing, setIsEditing] = useState(false);
  const [trainingFormPremium, setTrainingFormPremium] = useState({
    trainingDays: 5,
    equipment: [] as string[],
    timePerSession: '60min',
    experienceLevel: 'INTERMEDIÁRIO',
    focusMuscle: '',
    planName: 'Meu Plano IA',
    generationModel: 'fast' as 'fast' | 'best'
  });
  const [trainingFormFree, setTrainingFormFree] = useState({
    objective: '',
    experienceLevel: 'INTERMEDIÁRIO',
    trainingDays: 4,
    equipment: [] as string[],
    timePerSession: '60min',
    priorityGroups: [] as string[],
    manualExercise: '',
    manualSeries: '',
    manualReps: '',
    manualDay: 'Segunda',
    generationModel: 'fast' as 'fast' | 'best'
  });
  const [trainingFreeStep, setTrainingFreeStep] = useState(1);
  const [isGeneratingTraining, setIsGeneratingTraining] = useState(false);
  const [trainingPlan, setTrainingPlan] = useState<any | null>(null);

  useEffect(() => {
    if (trainingPlan && trainingTab === 'generator') {
      setTrainingTab('my-plan');
    }
  }, [trainingPlan, trainingTab]);
  const [trainingDayIndex, setTrainingDayIndex] = useState(0);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Workout Flow State
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [activeWorkoutSession, setActiveWorkoutSession] = useState<{
    dayName: string;
    exercises: any[];
    startTime: number;
    completedAt?: number;
    isAdapted?: boolean;
    logs: { exerciseIndex: number, setIndex: number, reps: number, weight?: number }[];
  } | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [workoutStatus, setWorkoutStatus] = useState<'exercising' | 'resting' | 'completed'>('exercising');
  const [restTimeLeft, setRestTimeLeft] = useState(60);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [trainingLoadingMessage, setTrainingLoadingMessage] = useState('Montando sua divisão de treino...');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
      if (user) {
        setProfile(prev => ({
          ...prev,
          name: user.displayName || prev.name,
          avatar: user.photoURL || getAvatar(user.email || undefined, user.displayName || undefined)
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isRegistering) {
        if (authPassword !== authConfirmPassword) {
          throw new Error("As senhas não coincidem.");
        }
        if (authName.length < 3) {
          throw new Error("Por favor, insira seu nome completo.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        await updateProfile(userCredential.user, {
          displayName: authName,
          photoURL: getAvatar(authEmail, authName)
        });
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const syncDataWithFirebase = async (userId: string, dataToSave: any) => {
    try {
      await setDoc(doc(db, 'user_data', userId), {
        data: dataToSave,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Erro ao sincronizar com Firebase:", e);
    }
  };

  const loadDataFromFirebase = async (userId: string) => {
    try {
      const docRef = doc(db, 'user_data', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data;
        setProfile(cloudData.profile || profile);
        setAnalysisCount(cloudData.analysisCount || 0);
        setWaterIntake(cloudData.waterIntake || 0);
        setEvolutionHistory(cloudData.evolutionHistory || []);
        setPersonalizedTraining(cloudData.personalizedTraining || null);
        setMealPlan(cloudData.mealPlan || null);
        setDietPlan(cloudData.dietPlan || null);
        setTrainingPlan(cloudData.trainingPlan || null);
        setImages(cloudData.images || images);
        setIsPremium(cloudData.isPremium || false);
        setSubscriptionExpiryDate(cloudData.subscriptionExpiryDate || null);
        setLastDietGenerationDate(cloudData.lastDietGenerationDate || null);
        setLastTrainingGenerationDate(cloudData.lastTrainingGenerationDate || null);
        setCompletedWorkouts(cloudData.completedWorkouts || []);
        setProgressCheckIns(cloudData.progressCheckIns || []);
        setWorkoutHistory(cloudData.workoutHistory || []);
        setAnalysisHistory(cloudData.analysisHistory || []);
        setBadges(cloudData.badges || badges);
        if (cloudData.trainingDayIndex !== undefined) {
          setTrainingDayIndex(cloudData.trainingDayIndex);
        }
        
        localStorage.setItem("shape_analyzer_data", JSON.stringify(cloudData));
      }
    } catch (e) {
      console.error("Erro ao carregar dados do Firebase:", e);
    }
  };

  useEffect(() => {
    if (user) {
      loadDataFromFirebase(user.uid);
    }
  }, [user]);

  const saveData = async (overrides: any = {}) => {
    const data = {
      profile,
      analysisCount,
      waterIntake,
      evolutionHistory,
      personalizedTraining,
      mealPlan,
      dietPlan,
      trainingPlan,
      images,
      isPremium,
      subscriptionExpiryDate,
      lastDietGenerationDate,
      lastTrainingGenerationDate,
      completedWorkouts,
      progressCheckIns,
      workoutHistory,
      analysisHistory,
      badges,
      trainingDayIndex,
      ...overrides
    };

    localStorage.setItem("shape_analyzer_data", JSON.stringify(data));
    
    if (user) {
      await syncDataWithFirebase(user.uid, data);
    }
  };

  const [trainingAnswers, setTrainingAnswers] = useState<{
    daysPerWeek?: number;
    experienceLevel?: string;
    injuries?: string;
    focus?: string;
    selectedDays?: string[];
  }>({
    selectedDays: [],
  });
  const [showTrainingQuiz, setShowTrainingQuiz] = useState(false);
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([]);

  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [exerciseDetail, setExerciseDetail] = useState<string | null>(null);
  const [isFetchingExercise, setIsFetchingExercise] = useState(false);

  // Refs for auto-scroll
  const trainingStep1Ref = useRef<HTMLDivElement>(null);
  const trainingStep2Ref = useRef<HTMLDivElement>(null);
  const trainingStep3Ref = useRef<HTMLDivElement>(null);
  const trainingStep4Ref = useRef<HTMLDivElement>(null);
  const trainingButtonRef = useRef<HTMLButtonElement>(null);

  const dietStep1Ref = useRef<HTMLDivElement>(null);
  const dietStep2Ref = useRef<HTMLDivElement>(null);
  const dietStep3Ref = useRef<HTMLDivElement>(null);

  const scrollToNext = (ref: React.RefObject<HTMLElement | null>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const handleShowExerciseDetail = async (name: string) => {
    setSelectedExercise(name);
    setIsFetchingExercise(true);
    try {
      const detail = await getExerciseDetails(name);
      setExerciseDetail(detail);
    } catch (err) {
      console.error(err);
      setExerciseDetail("Erro ao carregar detalhes do exercício.");
    } finally {
      setIsFetchingExercise(false);
    }
  };

  // Workout Timers
  useEffect(() => {
    let interval: any;
    if (isWorkoutActive && workoutStatus === 'exercising') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive, workoutStatus]);

  useEffect(() => {
    let interval: any;
    if (isWorkoutActive && workoutStatus === 'resting' && restTimeLeft > 0) {
      interval = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            // End rest
            setWorkoutStatus('exercising');
            playBeep(880, 0.2);
            if (navigator.vibrate) navigator.vibrate(200);
            return 0;
          }
          if (prev <= 4) {
            playBeep(440, 0.05); // Countdown beeps
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive, workoutStatus, restTimeLeft]);

  const startWorkout = (day: any) => {
    // Bio-Mapeamento Adaptativo: Check for fatigue
    const fatiguedMuscles = day.exercicios.reduce((acc: string[], ex: any) => {
        const muscle = ex.musculo_foco || '';
        const status = getMuscleStatus(muscle);
        if (typeof status.days === 'number' && status.days <= 1 && !acc.includes(muscle)) {
            acc.push(muscle);
        }
        return acc;
    }, []);

    if (fatiguedMuscles.length > 0 || analysisHistory[0]?.posture?.detected) {
        let warning = "";
        if (fatiguedMuscles.length > 0) {
            warning += `BIO-ALERTA: Os grupos [${fatiguedMuscles.join(', ')}] ainda estão em fase de reparo biológico intenso.\n`;
        }
        if (analysisHistory[0]?.posture?.detected) {
            warning += `CORREÇÃO POSTURAL: Detectamos [${analysisHistory[0].posture.issue}]. Injetando protocolo corretivo: ${analysisHistory[0].posture.corrective_exercise.nome}.\n`;
        }
        
        if (!confirm(`${warning}\nProsseguir com as adaptações de segurança?`)) {
            return;
        }
    }

    const baseExercises = [...day.exercicios];
    // Inject corrective exercise if needed
    if (analysisHistory[0]?.posture?.detected) {
        baseExercises.unshift({
            ...analysisHistory[0].posture.corrective_exercise,
            musculo_foco: 'Postura'
        });
    }

    setActiveWorkoutSession({
      dayName: day.nome_dia || day.musculo_foco,
      exercises: baseExercises,
      startTime: Date.now(),
      logs: [],
      isAdapted: fatiguedMuscles.length > 0 || !!analysisHistory[0]?.posture?.detected
    });
    setIsWorkoutActive(true);
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setWorkoutStatus('exercising');
    setElapsedTime(0);
    setRestTimeLeft(60);
  };
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const playBeep = (freq = 880, duration = 0.1) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("AudioContext not supported or blocked");
    }
  };

  const finishWorkoutSession = () => {
    if (!activeWorkoutSession) return;
    
    const session = {
      ...activeWorkoutSession,
      completedAt: Date.now(),
      duration: elapsedTime
    };

    const newWorkoutHistoryItem: WorkoutHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleString('pt-BR'),
      title: activeWorkoutSession.dayName,
      muscles: Array.from(new Set(activeWorkoutSession.exercises.map((ex: any) => ex.grupo_muscular || ex.musculo_foco || 'Geral'))),
      exercisesCount: activeWorkoutSession.exercises.length,
      duration: Math.floor(elapsedTime / 60),
      completed: true,
      exercises: activeWorkoutSession.exercises.map((ex: any) => ({
        name: ex.nome,
        sets: []
      }))
    };
    setWorkoutHistory(prev => [newWorkoutHistoryItem, ...prev]);
    
    // Also mark as completed for today's UI
    const today = new Date().toISOString().split("T")[0];
    const checkInId = `${today}_${activeWorkoutSession.dayName}`;
    setCompletedWorkouts(prev => [...prev, checkInId]);
    setTrainingDayIndex((trainingDayIndex + 1) % (trainingPlan?.dias.length || 1));
    
    saveData({ 
        workoutHistory: [newWorkoutHistoryItem, ...workoutHistory],
        completedWorkouts: [...completedWorkouts, checkInId],
        trainingDayIndex: (trainingDayIndex + 1) % (trainingPlan?.dias.length || 1)
    });
    
    // Save to history
    const saved = localStorage.getItem("workout_history") || "[]";
    try {
      const history = JSON.parse(saved);
      localStorage.setItem("workout_history", JSON.stringify([...history, session]));
    } catch (e) {
      console.error("Failed to parse workout_history:", e);
      localStorage.setItem("workout_history", JSON.stringify([session]));
    }
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#ffffff', '#1d4ed8']
    });
    
    playBeep(440, 0.1);
    setTimeout(() => playBeep(554.37, 0.1), 100);
    setTimeout(() => playBeep(659.25, 0.2), 200);

    setWorkoutStatus('completed');
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  };

  const handleSwapFood = (mealName: string) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    alert(
      `Trocando alimento para: ${mealName}. Nossa IA está calculando o melhor substituto...`,
    );
  };

  const handleFinishWorkout = () => {
    const today = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][
      new Date().getDay()
    ];
    handleCheckIn(today);
  };

  const renderCoachMessage = (text: string) => {
    const parts = text.split(/(\[BUTTON:[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("[BUTTON:")) {
        const btnParts = part.slice(1, -1).split(":");
        const type = btnParts[1];
        const value = btnParts[2];

        if (type === "VIEW_EXERCISE") {
          return (
            <button
              key={i}
              onClick={() => handleShowExerciseDetail(value)}
              className="w-full py-3 bg-[#2563eb]/10 border border-blue-600/30 text-blue-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 my-4"
            >
              <Dumbbell className="w-4 h-4" /> Ver Biomecânica: {value}
            </button>
          );
        }
        if (type === "SWAP_FOOD") {
          return (
            <button
              key={i}
              onClick={() => handleSwapFood(value)}
              className="w-full py-3 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 my-4"
            >
              <RefreshCw className="w-4 h-4" /> Trocar Alimento: {value}
            </button>
          );
        }
        if (type === "FINISH_WORKOUT") {
          return (
            <button
              key={i}
              onClick={handleFinishWorkout}
              className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3 my-6"
            >
              <Trophy className="w-6 h-6" /> Concluir Treino de Hoje
            </button>
          );
        }
      }
      return (
        <div
          key={i}
          className="prose prose-invert prose-emerald max-w-none prose-sm"
        >
          <Markdown rehypePlugins={[rehypeRaw]}>{part}</Markdown>
        </div>
      );
    });
  };

  const handleProjectShape = async (type: "fat-loss" | "muscle-gain") => {
    if (!images.front) return;
    setIsProjecting(true);
    try {
      const projected = await projectShape(images.front, type);
      setProjectedImage(projected);
    } catch (err) {
      console.error(err);
      setError("Erro ao projetar o shape.");
    } finally {
      setIsProjecting(false);
    }
  };

  const handleGenerateCorrectivePlan = async () => {
    if (!result) return;

    if (!isPremium && correctivePlan) {
      alert("Seja Premium para gerar novos planos ou espere 7 dias.");
      setShowPremiumModal(true);
      return;
    }

    setIsGeneratingCorrectivePlan(true);
    try {
      const plan = await generateCorrectivePlan(result, profile);
      setCorrectivePlan(plan);
    } catch (err) {
      console.error(err);
      setError("Erro ao gerar plano corretivo. Tente novamente.");
    } finally {
      setIsGeneratingCorrectivePlan(false);
    }
  };

  const handleGenerateTrainingPremium = async () => {
    if (!result) return;
    
    setIsGeneratingTraining(true);
    setTrainingLoadingMessage("Analisando suas assimetrias...");
    
    const msgs = ["Analisando assimetrias...", "Montando sua divisão de treino...", "Selecionando exercícios corretivos...", "Finalizando seu plano..."];
    let i = 0;
    const interval = setInterval(() => {
      setTrainingLoadingMessage(msgs[i % msgs.length]);
      i++;
    }, 2000);

    const payload = {
        ...trainingFormPremium,
        analise_shape: {
            bf: result.bfEstimate,
            score: result.overallScore,
            categoria: result.recommendations?.dietPhase,
            assimetrias: result.proportions?.imbalances || []
        }
    };

    try {
      const plan = await generateTrainingPlan(true, payload);
      setTrainingPlan(plan);
      setTrainingDayIndex(0);
      setTrainingTab('my-plan');
      setTrainingMode(null);
      saveData({ trainingPlan: plan });
    } catch (err) {
      console.error(err);
      setError("Erro ao gerar plano de treino.");
    } finally {
      clearInterval(interval);
      setIsGeneratingTraining(false);
    }
  };

  const handleGenerateTrainingFree = async () => {
    setIsGeneratingTraining(true);
    setTrainingLoadingMessage("Montando divisão...");
    
    const msgs = ["Montando sua divisão de treino...", "Selecionando melhores exercícios...", "Finalizando seu plano..."];
    let i = 0;
    const interval = setInterval(() => {
      setTrainingLoadingMessage(msgs[i % msgs.length]);
      i++;
    }, 2000);

    try {
      const plan = await generateTrainingPlan(false, trainingFormFree);
      setTrainingPlan(plan);
      setTrainingDayIndex(0);
      setTrainingTab('my-plan');
      setTrainingMode(null);
      saveData({ trainingPlan: plan });
    } catch (err) {
      console.error(err);
      setError("Erro ao gerar plano de treino.");
    } finally {
      clearInterval(interval);
      setIsGeneratingTraining(false);
    }
  };

  const handleCheckIn = (day: string) => {
    const today = new Date().toISOString().split("T")[0];
    const checkInId = `${today}_${day}`;
    if (completedWorkouts.includes(checkInId)) {
      setCompletedWorkouts((prev) => prev.filter((id) => id !== checkInId));
    } else {
      setCompletedWorkouts((prev) => [...prev, checkInId]);

      // Update evolution history with new consistency
      const totalDays = profile.trainingDays?.length || 0;
      if (totalDays > 0) {
        const completedTodayCount =
          completedWorkouts.filter((id) => id.startsWith(today)).length + 1;
        const consistency = Math.min(
          100,
          Math.round((completedTodayCount / totalDays) * 100),
        );

        setEvolutionHistory((prev) => {
          const last = prev[prev.length - 1];
          const newEntry = { ...last, consistency };
          return [...prev.slice(0, -1), newEntry];
        });
      }
    }
  };

  const toggleExerciseCompletion = (
    dayIndex: number,
    exerciseIndex: number,
  ) => {
    if (!personalizedTraining) return;
    const newPlan = { ...personalizedTraining };
    const exercise = newPlan.days[dayIndex].exercises[exerciseIndex];
    exercise.completed = !exercise.completed;
    setPersonalizedTraining({ ...newPlan });
  };

  const handleGenerateDietPremium = async () => {
    if (!result) return;
    
    // TMB Mifflin-St Jeor
    // Homens: (10 x peso em kg) + (6,25 x altura em cm) - (5 x idade em anos) + 5
    // Mulheres: (10 x peso em kg) + (6,25 x altura em cm) - (5 x idade em anos) - 161
    const tmb = dietFormPremium.gender === 'M' 
      ? (10 * profile.weight) + (6.25 * dietFormPremium.height) - (5 * dietFormPremium.age) + 5
      : (10 * profile.weight) + (6.25 * dietFormPremium.height) - (5 * dietFormPremium.age) - 161;
      
    // Fator de atividade
    let activityFactor = 1.2;
    if (dietFormPremium.trainingDays >= 3 && dietFormPremium.trainingDays <= 4) activityFactor = 1.375;
    else if (dietFormPremium.trainingDays === 5) activityFactor = 1.55;
    else if (dietFormPremium.trainingDays >= 6) activityFactor = 1.725;
    
    const get = tmb * activityFactor;
    
    // Meta Calórica (baseada na categoria do result ou objetivo)
    let metaCalorica = get;
    const goal = result.recommendations?.dietPhase || 'Recomposição';
    if (goal === 'Cutting' || result.bfEstimate > 15) metaCalorica = get - (get * 0.20);
    else if (goal === 'Bulking' || result.bfEstimate < 10) metaCalorica = get + (get * 0.15);
    else metaCalorica = get - (get * 0.10); // Recomposição
    
    // Macros
    const proteina = profile.weight * 2.2;
    const gordura = (metaCalorica * 0.25) / 9;
    const carbo = (metaCalorica - (proteina * 4) - (gordura * 9)) / 4;
    
    const payload = {
      peso: profile.weight,
      ...dietFormPremium,
      analise_shape: {
        bf: result.bfEstimate,
        score: result.overallScore,
        categoria: goal,
        assimetrias: result.proportions?.imbalances || []
      },
      calculos_base: {
        tmb: Math.round(tmb),
        get: Math.round(get),
        meta_calorica: Math.round(metaCalorica),
        proteina_g: Math.round(proteina),
        gordura_g: Math.round(gordura),
        carbo_g: Math.round(carbo)
      }
    };

    setIsGeneratingDiet(true);
    setDietLoadingMessage("Calculando seus macros...");
    
    // Animação de textos
    const msgs = ["Montando suas refeições...", "Analisando assimetrias...", "Finalizando seu plano..."];
    let i = 0;
    const interval = setInterval(() => {
      setDietLoadingMessage(msgs[i % msgs.length]);
      i++;
    }, 2000);

    try {
      const plan = await generateMealPlan(true, payload);
      setDietPlan(plan);
      saveData();
    } catch (err) {
      console.error(err);
      setError("Erro ao gerar plano de refeições.");
    } finally {
      clearInterval(interval);
      setIsGeneratingDiet(false);
    }
  };

  const handleGenerateDietFree = async () => {
    // TMB Mifflin-St Jeor
    const tmb = dietFormFree.gender === 'M' 
      ? (10 * dietFormFree.weight) + (6.25 * dietFormFree.height) - (5 * dietFormFree.age) + 5
      : (10 * dietFormFree.weight) + (6.25 * dietFormFree.height) - (5 * dietFormFree.age) - 161;
      
    // Fator de atividade
    let activityFactor = 1.2; // Sedentário
    if (dietFormFree.activityLevel === 'LEVE') activityFactor = 1.375;
    else if (dietFormFree.activityLevel === 'MODERADO') activityFactor = 1.55;
    else if (dietFormFree.activityLevel === 'INTENSO') activityFactor = 1.725;
    
    const get = tmb * activityFactor;
    
    // Meta Calórica (baseada na categoria do result ou objetivo)
    let metaCalorica = get;
    if (dietFormFree.objective === 'PERDER GORDURA') metaCalorica = get - (get * 0.20);
    else if (dietFormFree.objective === 'GANHAR MASSA') metaCalorica = get + (get * 0.15);
    
    // Macros
    const proteina = dietFormFree.weight * 2.2;
    const gordura = (metaCalorica * 0.25) / 9;
    const carbo = (metaCalorica - (proteina * 4) - (gordura * 9)) / 4;
    
    const payload = {
      ...dietFormFree,
      calculos_base: {
        tmb: Math.round(tmb),
        get: Math.round(get),
        meta_calorica: Math.round(metaCalorica),
        proteina_g: Math.round(proteina),
        gordura_g: Math.round(gordura),
        carbo_g: Math.round(carbo)
      }
    };

    setIsGeneratingDiet(true);
    setDietLoadingMessage("Calculando seus macros...");
    
    // Animação de textos
    const msgs = ["Montando suas refeições...", "Ajustando calorias...", "Finalizando..."];
    let i = 0;
    const interval = setInterval(() => {
      setDietLoadingMessage(msgs[i % msgs.length]);
      i++;
    }, 2000);

    try {
      const plan = await generateMealPlan(false, payload);
      setDietPlan(plan);
      saveData();
    } catch (err) {
      console.error(err);
      setError("Erro ao gerar plano de refeições.");
    } finally {
      clearInterval(interval);
      setIsGeneratingDiet(false);
    }
  };

  const handleGenerateShoppingList = async () => {
    if (!mealPlan) {
      setError("Gere um plano de refeições primeiro.");
      return;
    }
    setIsGeneratingShoppingList(true);
    try {
      const list = await generateShoppingList(mealPlan);
      setShoppingList(list);
      setShowShoppingListModal(true);
    } catch (err) {
      console.error(err);
      setError("Erro ao gerar lista de compras.");
    } finally {
      setIsGeneratingShoppingList(false);
    }
  };

  const handleGenerateRouteDayPlan = async () => {
    setIsGeneratingRouteDayPlan(true);
    try {
      const plan = await generateRouteDayPlan(profile, dietAnswers);
      setRouteDayPlan(plan);
      setShowRouteDayModal(true);
    } catch (err) {
      console.error(err);
      setError("Erro ao gerar plano de rota.");
    } finally {
      setIsGeneratingRouteDayPlan(false);
    }
  };

  const handleFoodPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isPremium) {
        setShowPremiumModal(true);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setIsAnalyzingFood(true);
        try {
          const analysis = await analyzeFoodPhoto(base64);
          setFoodAnalysis(analysis);
        } catch (err) {
          console.error(err);
          setError("Erro ao analisar foto de comida.");
        } finally {
          setIsAnalyzingFood(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExerciseVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isPremium) {
        setShowPremiumModal(true);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setIsAnalyzingExercise(true);
        try {
          const analysis = await analyzeExerciseVideo(base64);
          setExerciseAnalysis(analysis);
        } catch (err) {
          console.error(err);
          setError("Erro ao analisar vídeo de exercício.");
        } finally {
          setIsAnalyzingExercise(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload =
    (type: "front" | "back" | "side") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages((prev) => ({ ...prev, [type]: reader.result as string }));
          setResult(null);
          setError(null);
        };
        reader.readAsDataURL(file);
      }
    };

  const handleAnalyze = async () => {
    let hasPhoto = !!images.front || !!images.back || !!images.side;

    if (!profile.gender) {
      setError("Por favor, selecione seu sexo antes de iniciar a análise.");
      return;
    }

    if (!isPremium && analysisCount >= 3) {
      setShowPremiumModal(true);
      return;
    }

    setIsScanning(true);
    setIsAnalyzing(true);
    setError(null);

    const messages = [
      "Detectando composição corporal...",
      "Calculando percentual de gordura...",
      "Analisando simetria muscular...",
      "Gerando plano personalizado...",
    ];
    let msgIndex = 0;
    setLoadingMessage(messages[0]);

    const messageInterval = setInterval(() => {
      msgIndex = msgIndex + 1;
      if (msgIndex < messages.length) {
        setLoadingMessage(messages[msgIndex]);
      }
    }, 1500);

    try {
      const data = await analyzeShape(
        images,
        { 
          weight: profile.weight, 
          height: profile.height, 
          goal: profile.goal, 
          age: profile.age, 
          gender: profile.gender, 
          gymLevel: profile.gymLevel 
        },
        isPumpMode,
        analysisModel
      );
      setResult(data);
      setAnalysisCount((prev) => prev + 1);

      const newAnalysisHistoryItem: ShapeAnalysisHistoryItem = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
        timestamp: Date.now(),
        category: data.overallScore >= 90 ? 'Elite' : data.overallScore >= 75 ? 'Atlético' : data.overallScore >= 60 ? 'Fitness' : 'Iniciante',
        frontPhoto: images.front
      };
      setAnalysisHistory(prev => {
        const newHistory = [newAnalysisHistoryItem, ...prev];
        saveData({ analysisHistory: newHistory });
        return newHistory;
      });

      // Update evolution history
      const today = new Date().toLocaleDateString("pt-BR", { month: "short" });
      setEvolutionHistory((prev) => {
        const newEvolution = [
          ...prev,
          {
            date: today,
            score: data.overallScore,
            bf: data.bfEstimate,
            weight: profile.weight,
            volume: data.metrics.volume,
            definition: data.metrics.definition,
            symmetry: data.metrics.symmetry,
            consistency: 0,
            photo: images.front,
          },
        ];
        saveData({ evolutionHistory: newEvolution });
        return newEvolution;
      });
    } catch (err) {
      console.error(err);
      setError(
        "Erro ao analisar o shape. Verifique sua conexão ou chave de API.",
      );
    } finally {
      clearInterval(messageInterval);
      setIsAnalyzing(false);
      setIsScanning(false);
      saveData();
    }
  };

  const handleSendMessage = async (msg?: string) => {
    const messageToSend = msg || inputMessage;
    if (!messageToSend.trim()) return;

    setChatMessages((prev) => [...prev, { role: "user", text: messageToSend }]);
    if (!msg) setInputMessage("");
    setIsChatLoading(true);
    try {
      const response = await chatWithCoach(messageToSend, { result, profile });
      setChatMessages((prev) => [
        ...prev,
        { role: "coach", text: response || "Desculpe, tive um problema." },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "coach", text: "Erro ao conectar com o coach." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const calculateNaturalLimit = () => {
    if (!profile.wristCircumference || !profile.ankleCircumference) return;
    // Casey Butt's formula simplified
    // Max Mass (lbs) = H^1.5 * (sqrt(W)/22.66 + sqrt(A)/17.01) * (BF/224 + 1)
    const h = profile.height / 2.54; // to inches
    const w = profile.wristCircumference / 2.54;
    const a = profile.ankleCircumference / 2.54;
    const bf = result?.bfEstimate || 15;

    const maxMassLbs =
      Math.pow(h, 1.5) *
      (Math.sqrt(w) / 22.66 + Math.sqrt(a) / 17.01) *
      (bf / 224 + 1);
    const maxMassKg = maxMassLbs * 0.453592;

    setLimitResult({
      maxMass: Math.round(maxMassKg),
      currentMass: profile.weight,
    });
  };

  const radarData = result
    ? [
        { subject: "Volume", A: result.metrics.volume, fullMark: 100 },
        { subject: "Definição", A: result.metrics.definition, fullMark: 100 },
        { subject: "Simetria", A: result.metrics.symmetry, fullMark: 100 },
        { subject: "Densidade", A: result.metrics.density, fullMark: 100 },
      ]
    : [];

  const PoseInstructionsModal = () => (
    <AnimatePresence>
      {showPoseInstructions && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPoseInstructions(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="relative w-full max-w-[360px] bg-[var(--color-bg)] rounded-[32px] overflow-hidden border border-[var(--color-border)] shadow-2xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white uppercase italic tracking-wider">GUIA DE POSES</h3>
                <button 
                  onClick={() => setShowPoseInstructions(false)}
                  className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center text-[var(--primary)] shrink-0 border border-[var(--primary)]/20">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black text-white uppercase mb-1">POSIÇÃO</h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">Fique em pé, com as pernas levemente afastadas e braços relaxados ao lado do corpo.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center text-[var(--primary)] shrink-0 border border-[var(--primary)]/20">
                    <Sun className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black text-white uppercase mb-1">ILUMINAÇÃO</h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">Procure um local bem iluminado, de preferência com luz frontal para evitar sombras profundas.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center text-[var(--primary)] shrink-0 border border-[var(--primary)]/20">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black text-white uppercase mb-1">ENQUADRAMENTO</h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">O corpo deve estar centralizado na foto, da cabeça aos joelhos (ou pés).</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <p className="text-[10px] text-amber-500 font-bold text-center">Para melhores resultados, use roupas de treino justas ou roupa íntima.</p>
                </div>
              </div>

              <button 
                onClick={() => setShowPoseInstructions(false)}
                className="w-full bg-[var(--primary)] text-[var(--on-primary)] font-black uppercase py-4 rounded-xl shadow-lg mt-8 active:scale-95 transition-all text-[12px] tracking-widest"
              >
                ENTENDI, VAMOS LÁ
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const PremiumModal = () => (
    <AnimatePresence>
      {showPremiumModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[var(--color-surface)] shadow-xl border-2 border-blue-600/50 rounded-3xl p-6 md:p-8 max-w-md w-full relative overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.1)]"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[100px]" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/10 blur-[100px]" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-[var(--color-text)] mb-1">
                    Padrão <span className="text-[#1d4ed8] italic">Ouro</span>
                  </h2>
                  <p className="text-[var(--color-text-muted)] text-sm">
                    Desbloqueie o potencial máximo do seu shape.
                  </p>
                </div>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="close-button p-2 hover:bg-[var(--color-overlay)] rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-zinc-500" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  {
                    icon: <Zap className="w-5 h-5 text-blue-500" />,
                    title: "Análises Ilimitadas",
                    desc: "Sem limites de 3 fotos por mês.",
                  },
                  {
                    icon: <Target className="w-5 h-5 text-orange-400" />,
                    title: "Coach IA Elite",
                    desc: "Respostas instantâneas e profundas.",
                  },
                  {
                    icon: <Sparkles className="w-5 h-5 text-blue-500" />,
                    title: "Projeção de Futuro",
                    desc: "Veja seu shape com 5% de BF.",
                  },
                  {
                    icon: <Shield className="w-5 h-5 text-orange-400" />,
                    title: "Biomecânica Avançada",
                    desc: "Análise de vídeo dos seus treinos.",
                  },
                  {
                    icon: <Box className="w-5 h-5 text-blue-500" />,
                    title: "Rota Ativa",
                    desc: "Ajustes diários na sua dieta e treino.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-3.5 rounded-2xl bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] hover:border-blue-600/40 transition-all group"
                  >
                    <div className="mt-1 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-[var(--color-text)] font-bold text-sm">
                        {item.title}
                      </h4>
                      <p className="text-zinc-500 text-[11px] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => {
                    setIsPremium(true);
                    setSubscriptionExpiryDate(
                      new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000,
                      ).toISOString(),
                    );
                    setShowPremiumModal(false);
                  }}
                  className="p-4 rounded-2xl bg-[var(--color-overlay)] border border-blue-600/30 hover:bg-blue-600/10 transition-all text-left group"
                >
                  <span className="text-zinc-400 text-xs block mb-1">
                    Mensal
                  </span>
                  <span className="text-[var(--color-text)] font-bold text-lg block">
                    R$ 29,90
                  </span>
                  <span className="text-blue-500 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                    Selecionar →
                  </span>
                </button>
                <button
                  onClick={() => {
                    setIsPremium(true);
                    setSubscriptionExpiryDate(null); // Lifetime
                    setShowPremiumModal(false);
                  }}
                  className="p-4 rounded-2xl bg-blue-600/10 border border-blue-600 text-left relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 bg-blue-600 text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">
                    VITALÍCIO
                  </div>
                  <span className="text-zinc-400 text-xs block mb-1">
                    Pagamento Único
                  </span>
                  <span className="text-[var(--color-text)] font-bold text-lg block">
                    R$ 197,00
                  </span>
                  <span className="text-blue-500 text-[10px]">
                    Melhor Valor
                  </span>
                </button>
              </div>

              <button
                onClick={() => {
                  setIsPremium(true);
                  setSubscriptionExpiryDate(
                    new Date(
                      Date.now() + 30 * 24 * 60 * 60 * 1000,
                    ).toISOString(),
                  );
                  setShowPremiumModal(false);
                }}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95"
              >
                QUERO MEU SHAPE DE ELITE
              </button>
              <p className="text-center text-zinc-600 text-[10px] mt-4 uppercase tracking-widest">
                Garantia de 7 dias ou seu dinheiro de volta
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ShoppingListModal = () => (
    <AnimatePresence>
      {showShoppingListModal && shoppingList && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[var(--color-surface)] shadow-xl border border-blue-600/30 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <Box className="w-6 h-6 text-blue-600" /> Lista de Compras
                Inteligente
              </h2>
              <button
                onClick={() => setShowShoppingListModal(false)}
                className="close-button p-2 hover:bg-[var(--color-overlay)] rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {shoppingList.categories.map((cat: any, i: number) => (
                <div key={i} className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-600/10 px-3 py-1 rounded-lg inline-block">
                    {cat.name}
                  </h3>
                  <div className="space-y-2">
                    {cat.items.map((item: any, j: number) => (
                      <div
                        key={j}
                        className="flex justify-between items-center p-3 rounded-xl bg-[var(--color-overlay)] border border-[var(--color-border-subtle)]"
                      >
                        <span className="text-sm text-[var(--color-text)]/80">
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-blue-600">
                          {item.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const RouteDayModal = () => (
    <AnimatePresence>
      {showRouteDayModal && routeDayPlan && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[var(--color-surface)] shadow-xl border border-orange-500/30 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-orange-500" /> Dia de Rota
                (Sugestões)
              </h2>
              <button
                onClick={() => setShowRouteDayModal(false)}
                className="close-button p-2 hover:bg-[var(--color-overlay)] rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-4">
              {routeDayPlan.suggestions.map((s: any, i: number) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                      {s.meal}
                    </span>
                    <span className="text-xs font-bold text-[var(--color-text)]/40">
                      {s.place}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[var(--color-text)]">{s.choice}</h4>
                  <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
                    <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--color-text)]/60 italic">{s.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const FoodAnalysisModal = () => (
    <AnimatePresence>
      {foodAnalysis && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[var(--color-surface)] shadow-xl border border-blue-600/30 rounded-3xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <Zap className="w-6 h-6 text-blue-600" /> Análise de Prato
              </h2>
              <button
                onClick={() => setFoodAnalysis(null)}
                className="close-button p-2 hover:bg-[var(--color-overlay)] rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    label: "Cal",
                    val: foodAnalysis.totalMacros.calories,
                    color: "text-blue-600",
                  },
                  {
                    label: "Prot",
                    val: foodAnalysis.totalMacros.protein,
                    color: "text-blue-500",
                  },
                  {
                    label: "Carb",
                    val: foodAnalysis.totalMacros.carbs,
                    color: "text-orange-500",
                  },
                  {
                    label: "Gord",
                    val: foodAnalysis.totalMacros.fats,
                    color: "text-red-500",
                  },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] text-center"
                  >
                    <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text)]/40 mb-1">
                      {m.label}
                    </p>
                    <p className={`text-sm font-black ${m.color}`}>{m.val}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]/40">
                  Itens Identificados
                </h4>
                {foodAnalysis.items.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 rounded-xl bg-[var(--color-overlay)] border border-[var(--color-border-subtle)]"
                  >
                    <span className="text-sm text-[var(--color-text)]/80">
                      {item.name} ({item.estimatedWeight}g)
                    </span>
                    <span className="text-xs font-bold text-blue-600">
                      {item.calories} kcal
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setFoodAnalysis(null)}
                className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all"
              >
                Adicionar ao Dia de Hoje
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ExerciseAnalysisModal = () => (
    <AnimatePresence>
      {exerciseAnalysis && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[var(--color-surface)] shadow-xl border border-blue-500/30 rounded-3xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <Video className="w-6 h-6 text-blue-500" /> Biomecânica IA
              </h2>
              <button
                onClick={() => setExerciseAnalysis(null)}
                className="close-button p-2 hover:bg-[var(--color-overlay)] rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                    Exercício
                  </p>
                  <h3 className="text-lg font-black italic uppercase">
                    {exerciseAnalysis.exerciseName}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                    Score Técnico
                  </p>
                  <p className="text-2xl font-black text-blue-500">
                    {exerciseAnalysis.biomechanicsScore}%
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1">
                  <X className="w-3 h-3" /> Erros Identificados
                </h4>
                <div className="space-y-2">
                  {exerciseAnalysis.errors.map((error: string, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-xs text-[var(--color-text)]/80"
                    >
                      • {error}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Correções Necessárias
                </h4>
                <div className="space-y-2">
                  {exerciseAnalysis.corrections.map(
                    (correction: string, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-blue-600/5 border border-blue-600/10 text-xs text-[var(--color-text)]/80"
                      >
                        • {correction}
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] italic text-xs text-[var(--color-text)]/60 leading-relaxed">
                {exerciseAnalysis.summary}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text)]">
        <RefreshCw className="w-8 h-8 text-[#2563eb] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex justify-center text-[var(--color-text)] font-sans selection:bg-[#2563eb]/30">
        <div className="w-full max-w-[390px] bg-[var(--color-bg)] min-h-screen relative flex flex-col items-center justify-center p-6">
          <div className="w-full space-y-8 animate-fade-in-up">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-[24px] bg-[#2563eb]/10 flex items-center justify-center border border-[#2563eb]/20 shadow-[0_0_30px_rgba(0,255,136,0.1)]">
                  <Zap className="w-8 h-8 text-[#2563eb] fill-current" />
                </div>
              </div>
              <h1 className="text-[28px] font-display font-bold text-[var(--color-text)] uppercase tracking-tight">
                {isRegistering ? "Criar Conta" : "Bem-vindo"}
              </h1>
              <p className="text-[var(--color-text-muted)] text-[14px]">
                {isRegistering 
                  ? "Comece sua jornada para o shape inexplicável." 
                  : "Entre para continuar evoluindo seu físico."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {/* Google Button at the top */}
              <button 
                onClick={handleGoogleLogin}
                type="button"
                className="w-full h-14 bg-[var(--color-surface)] text-[#3c4043] font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-md active:scale-[0.98] mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z" />
                  <path fill="#FBBC05" d="M16.04 18.013c-1.09.363-2.26.56-3.414.56a7.077 7.077 0 0 1-7.36-4.909L1.24 16.78a11.965 11.965 0 0 0 10.76 7.22c3.136 0 6.002-1.036 8.243-2.782l-4.203-3.205z" />
                  <path fill="#4285F4" d="M23.714 12.218c0-.838-.077-1.643-.21-2.422H12v4.582h6.573c-.282 1.486-1.123 2.741-2.382 3.586l4.203 3.205c2.454-2.264 3.868-5.591 3.868-9.364l-.55-.585z" />
                  <path fill="#34A853" d="M5.266 14.235a7.077 7.077 0 0 1 0-4.47L1.24 6.65a11.965 11.965 0 0 0 0 10.7c1.442-2.923 4.026-3.115 4.026-3.115z" />
                </svg>
                Continuar com o Google
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-border)]"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="bg-[var(--color-bg)] px-3 text-[var(--color-text-muted)]">Ou use seu email</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isRegistering && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                      <input 
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full h-14 bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] rounded-2xl pl-12 pr-4 text-[var(--color-text)] focus:border-[#2563eb]/30 focus:bg-[var(--color-border)] outline-none transition-all placeholder:text-[#3a3a3a]"
                        placeholder="Ex: João Silva"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                  <input 
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full h-14 bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] rounded-2xl pl-12 pr-4 text-[var(--color-text)] focus:border-[#2563eb]/30 focus:bg-[var(--color-border)] outline-none transition-all placeholder:text-[#3a3a3a]"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                  <input 
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full h-14 bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] rounded-2xl pl-12 pr-4 text-[var(--color-text)] focus:border-[#2563eb]/30 focus:bg-[var(--color-border)] outline-none transition-all placeholder:text-[#3a3a3a]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isRegistering && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Confirmar Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                      <input 
                        type="password"
                        required
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        className="w-full h-14 bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] rounded-2xl pl-12 pr-4 text-[var(--color-text)] focus:border-[#2563eb]/30 focus:bg-[var(--color-border)] outline-none transition-all placeholder:text-[#3a3a3a]"
                        placeholder="••••••••"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {authError && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <p className="text-[12px] text-red-500 text-center font-medium">{authError}</p>
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full h-14 bg-[#2563eb] text-[#ffffff] font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.15)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                {authLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isRegistering ? "Finalizar Cadastro" : "Entrar no App"}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center space-y-4 mt-6">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-[12px] font-bold text-[var(--color-text-muted)] hover:text-[#2563eb] transition-colors"
              >
                {isRegistering 
                  ? "Já tem uma conta? Entre aqui." 
                  : "Não tem uma conta? Cadastre-se agora."}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex justify-center text-[var(--color-text)] font-sans selection:bg-[#2563eb]/30">
      <div className="w-full max-w-[390px] bg-[var(--color-bg)] min-h-screen relative flex flex-col shadow-2xl overflow-hidden">
        <PoseInstructionsModal />
        <PremiumModal />
        <ShoppingListModal />
        <RouteDayModal />
        <FoodAnalysisModal />
        <ExerciseAnalysisModal />

        {/* Header */}
        <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg)]/95 backdrop-blur-xl sticky top-0 z-50">
          <div className="px-5 h-[70px] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-neon)]/10 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                <Zap className="w-5 h-5 text-[var(--color-neon)] fill-current" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="font-display font-black text-[18px] tracking-tight text-[var(--color-text)] uppercase italic">
                  MEU SHAPE
                </span>
                <span className="text-[8px] font-black text-[var(--color-neon)] uppercase tracking-[0.3em] opacity-80">
                  AI EVOLUTION
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] rounded-full">
                <Flame className="w-3.5 h-3.5 text-[#ffb800]" />
                <span className="text-[10px] font-black text-[#ffb800]">
                  {completedWorkouts?.length || 0}<span className="text-[var(--color-text-muted)]">d</span>
                </span>
              </div>
              
              <div className="flex items-center gap-1 p-1 bg-[var(--color-overlay)] rounded-full border border-[var(--color-border-subtle)]">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-all group"
                  title="Tema"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 group-active:scale-90 transition-transform" /> : <Moon className="w-4 h-4 group-active:scale-90 transition-transform" />}
                </button>
                <div className="w-[1px] h-4 bg-[var(--color-border)] mx-0.5" />
                <button 
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-all group"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4 group-active:scale-90 transition-transform" />
                </button>
                <div className="w-[1px] h-4 bg-[var(--color-border)] mx-0.5" />
                <button
                  onClick={() => setShowProfileSettings(true)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-neon)] to-[#1e40af] border border-[var(--color-border)] flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
                >
                  <img src={profile.avatar || getAvatar(user?.email || undefined, user?.displayName || undefined)} className="w-full h-full object-cover" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pt-4 pb-[100px] overflow-x-hidden overflow-y-auto relative cyber-grid">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8 pb-12 px-6"
              >
                {/* Header Section */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex-1">
                    <h1 className="text-[11px] font-black text-[var(--primary)] uppercase tracking-[0.3em] neo-glow-text mb-1">COMMAND CENTER</h1>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-[var(--primary)] rounded-full neo-glow-primary"></div>
                        {isEditingProfile ? (
                        <div className="flex items-center gap-2">
                            <input 
                            value={profile.name} 
                            onChange={(e) => setProfile({ ...profile, name: e.target.value.toUpperCase() })}
                            className="text-[28px] font-display text-[var(--color-text)] font-black tracking-wider bg-transparent border-b border-[var(--primary)]/50 outline-none w-full max-w-[200px]"
                            onBlur={() => setIsEditingProfile(false)}
                            autoFocus
                            />
                        </div>
                        ) : (
                        <h2 
                            onClick={() => setIsEditingProfile(true)}
                            className="text-[28px] font-display text-[var(--color-text)] font-black tracking-wider cursor-pointer hover:text-[var(--primary)] transition-all uppercase"
                        >
                            {profile.name}
                        </h2>
                        )}
                    </div>
                  </div>
              <div className="relative group">
                    <input
                      type="file"
                      ref={avatarInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleAvatarChange(e, true)}
                    />
                    <button 
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-14 h-14 rounded-xl rotate-3 bg-[var(--color-surface)] border-2 border-[var(--primary)]/40 overflow-hidden neo-glow-primary cursor-pointer active:rotate-0 transition-all flex items-center justify-center p-0"
                    >
                      <img 
                        src={profile.avatar || getAvatar(user?.email || undefined, user?.displayName || undefined)} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    </button>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center shadow-lg border border-[var(--color-bg)] pointer-events-none">
                        <Camera className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>

                {/* Performance Stats Bar */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 p-4 glass-card rounded-[24px]">
                        <span className="text-[10px] uppercase font-black text-[var(--color-text-muted)] tracking-widest pl-1">Próximo Treino</span>
                        <div className="flex items-center gap-3 mt-1.5">
                            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[14px] font-display font-black text-[var(--color-text)] uppercase tracking-wider">{trainingPlan?.dias[trainingDayIndex]?.nome || 'OFF'}</span>
                                <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest">Ativo</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-4 glass-card rounded-[24px]">
                        <span className="text-[10px] uppercase font-black text-[var(--color-text-muted)] tracking-widest pl-1">Status Bio</span>
                        <div className="flex items-center gap-3 mt-1.5">
                            <div className="w-10 h-10 rounded-xl bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--secondary)] border border-[var(--secondary)]/20">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[14px] font-display font-black text-[var(--color-text)] uppercase tracking-wider">{workoutHistory.length > 0 ? 'Mapeado' : 'Aguardando'}</span>
                                <span className="text-[10px] font-bold text-[var(--secondary)] uppercase tracking-widest">{workoutHistory.length > 0 ? 'Sincronizado' : 'Inativo'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Latest Scan Result Summary Dashboard */}
                {analysisHistory.length > 0 && (
                  <div className="space-y-4">
                    {analysisHistory[0]?.posture?.detected && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-[24px] p-4 flex items-start gap-4 animate-pulse">
                            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-500">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 italic">Desvio Postural Detectado</p>
                                <h4 className="text-sm font-black text-[var(--color-text)] uppercase">{analysisHistory[0].posture.issue}</h4>
                                <p className="text-[10px] text-[var(--color-text-muted)] font-medium mt-1">Sugerido: {analysisHistory[0].posture.correction}</p>
                            </div>
                        </div>
                    )}

                    <button 
                      onClick={() => {
                          setResult(analysisHistory[0]);
                          setActiveTab('analyze');
                      }}
                      className="w-full relative group"
                    >
                    <div className="bg-[var(--color-surface)] border border-[var(--primary)]/20 rounded-[32px] p-6 overflow-hidden relative shadow-2xl">
                        <div className="absolute top-0 right-0 p-4">
                           <Shield className="w-8 h-8 text-[var(--primary)]/10 group-hover:text-[var(--primary)]/20 transition-colors" />
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="relative w-20 h-20 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="40" cy="40" r="36" fill="transparent" stroke="var(--color-border-subtle)" strokeWidth="4" />
                                    <circle cx="40" cy="40" r="36" fill="transparent" stroke="var(--primary)" strokeWidth="4" strokeDasharray="226" strokeDashoffset={226 - (226 * analysisHistory[0].overallScore) / 100} />
                                </svg>
                                <span className="absolute text-xl font-display font-black text-[var(--color-text)] tracking-wider">{analysisHistory[0].overallScore}</span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.3em] mb-1">Última Auditoria</p>
                                <h3 className="text-xl font-black text-[var(--color-text)] uppercase italic leading-tight mb-2">SCORE: {analysisHistory[0].overallScore}/100</h3>
                                <div className="flex items-center gap-3">
                                    <div className="px-2 py-1 bg-[var(--color-overlay)] rounded-lg border border-[var(--color-border-subtle)]">
                                        <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">{analysisHistory[0].date}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="w-3.5 h-3.5 text-[var(--secondary)]" />
                                        <span className="text-[10px] font-black text-[var(--secondary)] uppercase">Ver Detalhes</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                        </div>
                    </div>
                  </button>
                 </div>
                )}

                {/* Analysis Prompts */}
                {!analysisHistory.length ? (
                  <div className="glass-card border-[32px] border-transparent rounded-[32px] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden neo-glow-primary border-none shadow-none mb-8 bg-gradient-to-br from-[var(--primary)]/10 to-[#0b0f14]">
                    <div className="absolute inset-0 cyber-grid opacity-20"></div>
                    <div className="w-24 h-24 rounded-2xl bg-[var(--primary)]/20 flex items-center justify-center mb-6 backdrop-blur-md border border-[var(--primary)]/30 rotate-12 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
                      <Camera className="w-12 h-12 text-[var(--primary)]" />
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-wider mb-3 font-display italic">Descubra seu BF%</h3>
                    <p className="text-[14px] text-[var(--color-text-muted)] max-w-[280px] mb-8 leading-relaxed font-medium">
                      A inteligência artificial <span className="text-[var(--primary)]">analisa sua biometria</span> e cria um protocolo de evolução personalizado.
                    </p>
                    <button 
                      onClick={() => {
                        setResult(null);
                        setImages({});
                        setActiveTab('analyze');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full relative overflow-hidden group bg-[var(--primary)] text-[var(--on-primary)] text-[16px] font-black uppercase py-5 rounded-2xl tracking-[0.3em] shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                         INICIAR SCANNER
                         <Zap className="w-5 h-5 fill-current" />
                      </span>
                    </button>
                  </div>
                ) : ((Date.now() - (analysisHistory[0].timestamp || 0)) > 30 * 24 * 60 * 60 * 1000) && (
                  <div className="glass-card border border-[var(--primary)]/30 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--primary)] shadow-[0_0_15px_var(--primary-glow)]"></div>
                    <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0 border border-[var(--primary)]/20">
                      <Camera className="w-6 h-6 text-[var(--primary)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[13px] font-black text-[var(--color-text)] uppercase tracking-widest italic">Check-in Mensal Pendente</h3>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-1 leading-tight font-medium">Sua biometria pode ter mudado. Atualize sua análise agora!</p>
                    </div>
                    <button 
                      onClick={() => {
                        setResult(null);
                        setImages({});
                        setActiveTab('analyze');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[10px] font-black uppercase text-[var(--on-primary)] bg-[var(--primary)] hover:brightness-110 transition-all px-5 py-2.5 rounded-xl shrink-0 neo-glow-primary"
                    >
                      Scan Agora
                    </button>
                  </div>
                )}

                {analysisHistory.length > 0 && (
                  <>
                    {/* Muscle Bio-Mapping - Main Hub Style */}
                    <div 
                        onClick={() => setActiveTab('recovery')}
                        className="relative glass-card border border-[var(--primary)]/20 rounded-[32px] p-6 overflow-hidden cursor-pointer group active:scale-[0.98] transition-all"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/5 blur-[50px] pointer-events-none group-hover:bg-[var(--primary)]/10 transition-all"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--secondary)]/5 blur-[50px] pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="relative z-10 flex justify-between items-center mb-8">
                            <h2 className="text-[12px] uppercase font-black text-[var(--color-text)] tracking-[0.3em] flex items-center gap-2 italic">
                              <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_8px_var(--primary-glow)]"></div>
                              MAPEAMENTO BIOMÉTRICO
                            </h2>
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] font-black text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded-full uppercase tracking-widest border border-[var(--primary)]/20">SINC_ATIVO</span>
                                <ChevronRight className="w-4 h-4 text-[var(--outline)]" />
                            </div>
                        </div>
                        
                        <div className="relative z-10 grid grid-cols-2 gap-x-10 gap-y-6">
                             {[
                                { name: 'Peito', label: 'Peitoral' },
                                { name: 'Costas Superior', label: 'Dorsais' },
                                { name: 'Quadríceps', label: 'Inferiores' },
                                { name: 'Abdômen', label: 'Core' },
                            ].map((item) => {
                                const status = getMuscleStatus(item.name);
                                return (
                                <div key={item.name} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-0.5">{item.label}</span>
                                          <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }}></div>
                                            <span className="text-[8px] font-bold uppercase tracking-[0.1em]" style={{ color: status.color }}>
                                                {status.status}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="text-[16px] font-display font-black tracking-wider text-white">
                                           {status.status === 'Pronto p/ Treino' ? '100%' : status.status === 'Recuperando' ? '45%' : status.status === 'Em Transição' ? '75%' : '0%'}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: status.status === 'Pronto p/ Treino' ? '100%' : status.status === 'Recuperando' ? '45%' : status.status === 'Em Transição' ? '75%' : '5%' }}
                                          transition={{ duration: 1.5, ease: "easeOut" }}
                                          className="h-full relative"
                                          style={{ backgroundColor: status.color, boxShadow: `0 0 10px ${status.color}80` }}
                                        >
                                            <div className="absolute top-0 right-0 w-1 h-full bg-white opacity-50"></div>
                                        </motion.div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Training Action Card (Quick Start) */}
                    {trainingPlan && (
                      <div className="relative glass-card border border-[var(--primary)]/20 rounded-[28px] p-6 shadow-lg overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform">
                            <Dumbbell size={80} />
                        </div>
                        <h3 className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1 italic">Treino Carregado</h3>
                        <p className="text-[18px] font-display font-black text-white mb-4 uppercase tracking-wide">
                          {trainingPlan.dias[trainingDayIndex]?.nome_dia}
                        </p>
                        <button 
                          onClick={() => startWorkout(trainingPlan.dias[trainingDayIndex])}
                          className="w-full bg-[var(--primary)] text-[var(--on-primary)] font-black text-[12px] uppercase tracking-[0.2em] py-4 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:scale-[1.01] transition-all"
                        >
                            INICIAR PROTOCOLO
                        </button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === "analyze" && (
              <motion.div
                key="analyze"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {!result && !isAnalyzing && (
                  <div className="flex flex-col gap-6">
                    {/* Hero Section */}
                    <div className="mt-8 mb-4 relative">
                      <div className="absolute -top-10 -left-6 w-32 h-32 bg-[var(--color-neon)]/20 blur-[50px] rounded-full pointer-events-none"></div>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 blur-[40px] rounded-full pointer-events-none"></div>
                      
                      <div className="relative inline-block mb-3">
                      <button
                        onClick={() => setShowPoseInstructions(true)}
                        className="bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5 hover:bg-[var(--primary)]/20 transition-all"
                      >
                        <Info className="w-3 h-3" />
                        COMO TIRAR A FOTO?
                      </button>
                      </div>
                      
                      <h1 className="font-display text-[48px] leading-[0.9] text-[var(--color-text)] font-black tracking-tighter italic uppercase">
                        ANÁLISE DE <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] neo-glow-text">SHAPE</span>
                      </h1>
                      <p className="text-[14px] text-[var(--color-text-muted)] mt-5 max-w-[300px] leading-relaxed font-medium">
                        Nossa IA avançada <span className="text-[var(--primary)]">digitaliza sua composição corporal</span> em segundos para um veredito objetivo.
                      </p>
                    </div>

                    {/* Main Inputs */}
                    <div className="space-y-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3 rounded-[12px] bg-[#ff4444]/10 border border-[#ff4444]/20 text-[#ff4444] text-[11px] font-bold uppercase tracking-wider text-center"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3 text-center text-[var(--color-text-muted)] text-[11px] mb-2 px-2">
                      <p>📸 Não é obrigatório enviar as 3 fotos, mas para uma análise mais detalhada é recomendado.</p>
                      <p className="mt-1 flex items-center justify-center gap-1"><Lock className="w-3 h-3"/> Privacidade 100% garantida: Suas fotos não são salvas e ninguém terá acesso a elas.</p>
                    </div>
                    {(["front", "back", "side"] as const).map((type) => (
                      <div key={type} className="space-y-2">
                        <div
                          onClick={() =>
                            document.getElementById(`input-${type}`)?.click()
                          }
                          className={`aspect-square rounded-[16px] border-2 border-dashed border-[#2563eb]/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#2563eb] hover:shadow-[0_0_20px_rgba(0,255,136,0.15)] transition-all overflow-hidden relative shadow-[inset_0_0_30px_rgba(0,255,136,0.05)] ${images[type] ? "border-solid border-[#2563eb]" : ""}`}
                        >
                          {images[type] ? (
                            <>
                              <img
                                src={images[type]}
                                loading="lazy"
                                className={`w-full h-full object-cover transition-all duration-700 ${isCompetitionMode ? "sepia-[0.5] contrast-[1.2] brightness-[0.8] saturate-[1.5]" : ""} ${isScanning ? "brightness-[0.3]" : ""}`}
                              />
                              <div className="absolute inset-0 bg-black/40" />
                              <div className="absolute top-2 right-2 w-5 h-5 bg-[#2563eb] rounded-full flex items-center justify-center shadow-lg">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                              {isScanning && (
                                <>
                                  <motion.div
                                    initial={{ top: "0%" }}
                                    animate={{ top: "100%" }}
                                    transition={{
                                      duration: 1.5,
                                      repeat: Infinity,
                                      repeatType: "reverse",
                                      ease: "linear",
                                    }}
                                    className="absolute left-0 right-0 h-1 bg-[#2563eb] shadow-[0_0_15px_rgba(0,255,136,0.8)] z-10"
                                  />
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <Camera className="w-6 h-6 text-[var(--color-text-muted)] mb-1" />
                              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider text-center px-1">
                                {type === "front"
                                  ? "Frente"
                                  : type === "back"
                                    ? "Costas"
                                    : "Lado"}
                              </span>
                            </>
                          )}
                          {isCompetitionMode && images[type] && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080c10] to-transparent flex items-end justify-center pb-2 pt-6">
                              <span className="text-[8px] font-black text-[var(--color-text)] uppercase tracking-widest">
                                Stage
                              </span>
                            </div>
                          )}
                          <input
                            id={`input-${type}`}
                            type="file"
                            className="hidden"
                            onChange={handleImageUpload(type)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest pl-1">
                        Altura (cm)
                      </label>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                          type="number"
                          value={profile.height}
                          onChange={(e) =>
                            setProfile((p) => ({
                              ...p,
                              height: Number(e.target.value),
                            }))
                          }
                          className="w-full bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] rounded-[12px] pl-9 pr-4 py-3 focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all text-[14px] text-[var(--color-text)]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest pl-1">
                        Peso (kg)
                      </label>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                          type="number"
                          inputMode="decimal"
                          value={profile.weight}
                          onChange={(e) =>
                            setProfile((p) => ({
                              ...p,
                              weight: Number(e.target.value),
                            }))
                          }
                          className="w-full bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] rounded-[12px] pl-9 pr-4 py-3 focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all text-[14px] text-[var(--color-text)]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest pl-1">
                        Objetivo
                      </label>
                      <div className="relative">
                        <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <select
                          value={profile.goal}
                          onChange={(e) =>
                            setProfile((p) => ({
                              ...p,
                              goal: e.target.value as any,
                            }))
                          }
                          className="w-full appearance-none bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] rounded-[12px] pl-9 pr-4 py-3 focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all text-[14px] text-[var(--color-text)]"
                        >
                          <option value="Cutting">Cutting</option>
                          <option value="Bulking">Bulking</option>
                          <option value="Recomposição">Recomposição</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest pl-1">Sexo Biológico</label>
                      <div className="flex bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] rounded-[12px] p-1">
                        <button onClick={() => setProfile(p => ({...p, gender: 'Masculino'}))} className={`flex-1 py-2 text-[12px] font-bold rounded-[8px] transition-all ${profile.gender === 'Masculino' ? 'bg-[var(--color-surface)] shadow-sm text-[#2563eb]' : 'text-[var(--color-text-muted)]'}`}>MASCULINO</button>
                        <button onClick={() => setProfile(p => ({...p, gender: 'Feminino'}))} className={`flex-1 py-2 text-[12px] font-bold rounded-[8px] transition-all ${profile.gender === 'Feminino' ? 'bg-[var(--color-surface)] shadow-sm text-[#ffb800]' : 'text-[var(--color-text-muted)]'}`}>FEMININO</button>
                      </div>
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest pl-1">
                        Idade
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                          type="number"
                          value={profile.age || 25}
                          onChange={(e) =>
                            setProfile((p) => ({
                              ...p,
                              age: Number(e.target.value),
                            }))
                          }
                          className="w-full bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] rounded-[12px] pl-9 pr-4 py-3 focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all text-[14px] text-[var(--color-text)]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Motor da IA (Velocidade vs Qualidade)</label>
                    <div className="flex bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] rounded-[12px] p-1">
                      <button onClick={() => setAnalysisModel('best')} className={`flex-1 py-2.5 text-[12px] font-bold rounded-[8px] transition-all flex items-center justify-center gap-2 ${analysisModel === 'best' ? 'bg-[var(--color-surface)] shadow-sm text-purple-400' : 'text-[var(--color-text-muted)]'}`}><Sparkles className="w-4 h-4"/> MELHOR IA</button>
                      <button onClick={() => setAnalysisModel('fast')} className={`flex-1 py-2.5 text-[12px] font-bold rounded-[8px] transition-all flex items-center justify-center gap-2 ${analysisModel === 'fast' ? 'bg-[var(--color-surface)] shadow-sm text-[#2563eb]' : 'text-[var(--color-text-muted)]'}`}><Zap className="w-4 h-4"/> RÁPIDO</button>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      {analysisModel === 'fast' ? 'Rápido (cerca de 5-10 segundos)' : 'Qualidade máxima da IA Pro (pode levar 30-60 segundos)'}
                    </p>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || isScanning}
                    className="w-full h-[60px] rounded-[16px] flex items-center justify-center gap-2 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-[0_8px_32px_rgba(37,99,235,0.2)] transition-all active:scale-[0.97] active:shadow-[0_2px_10px_rgba(37,99,235,0.2)] disabled:opacity-50"
                  >
                    <Zap className="w-5 h-5 fill-current" />
                    <span className="font-display text-[20px] mt-1 tracking-wide">
                      {isScanning || isAnalyzing
                        ? loadingMessage
                        : !isPremium && analysisCount >= 3
                          ? "LIMITE MENSAL ATINGIDO"
                          : "INICIAR ANÁLISE PRO"}
                    </span>
                  </button>

                  <div className="p-4 bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                        Análises Restantes
                      </span>
                      <span
                        className={`text-[10px] font-bold ${isPremium ? "text-[#2563eb]" : analysisCount >= 3 ? "text-[#ff4444]" : "text-[#2563eb]"}`}
                      >
                        {isPremium
                          ? "Ilimitado"
                          : `${Math.max(0, 3 - analysisCount)}/3`}
                      </span>
                    </div>
                    {!isPremium && (
                      <>
                        <div className="h-1 bg-[var(--color-surface)] shadow-sm rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${analysisCount >= 3 ? "bg-[#ff4444]" : "bg-[#2563eb]"}`}
                            style={{
                              width: `${Math.min(100, (analysisCount / 3) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-[#374151] mt-2 italic text-center">
                          Sua evolução não pode parar. Garanta análises
                          ilimitadas sendo PRO.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Natural Limit Calculator */}
                <div className="p-5 rounded-[20px] bg-[var(--color-bg)] border border-[rgba(255,255,255,0.06)] space-y-4">
                  <h3 className="text-[16px] font-display uppercase tracking-wide text-[var(--color-text)] flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#2563eb]" /> Limite
                    Genético Natural
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Punho (cm)"
                      type="number"
                      inputMode="decimal"
                      className="bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] rounded-[12px] px-4 py-3 text-[14px] text-[var(--color-text)] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all"
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          wristCircumference: Number(e.target.value),
                        }))
                      }
                    />
                    <input
                      placeholder="Tornozelo (cm)"
                      type="number"
                      inputMode="decimal"
                      className="bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] rounded-[12px] px-4 py-3 text-[14px] text-[var(--color-text)] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all"
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          ankleCircumference: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <button
                    onClick={calculateNaturalLimit}
                    className="w-full py-3 bg-[var(--color-surface)] shadow-sm border border-[rgba(255,255,255,0.04)] rounded-[12px] text-[12px] font-bold text-[var(--color-text)] uppercase tracking-widest transition-all hover:bg-[var(--color-surface)] shadow-sm active:scale-[0.97]"
                  >
                    Calcular Potencial
                  </button>
                  {limitResult && (
                    <div className="p-5 bg-[#2563eb]/5 border border-[#2563eb]/10 rounded-[16px] space-y-3 mt-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold mb-1">
                            Peso Limite Estimado
                          </p>
                          <p className="text-[24px] font-display text-[#2563eb]">
                            {limitResult.maxMass}
                            <span className="text-[14px]">kg</span>{" "}
                            <span className="text-[10px] text-[var(--color-text-muted)] font-sans">
                              @ 10% BF
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-[#2563eb]/60 uppercase tracking-widest">
                            Potencial
                          </p>
                          <p className="text-[20px] font-display text-[var(--color-text)]">
                            {Math.round(
                              (limitResult.currentMass / limitResult.maxMass) *
                                100,
                            )}
                            %
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[var(--color-surface)] shadow-sm rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, (limitResult.currentMass / limitResult.maxMass) * 100)}%`,
                          }}
                          className="h-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8]"
                        />
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)] italic text-center">
                        Você está a{" "}
                        {Math.round(
                          (limitResult.currentMass / limitResult.maxMass) * 100,
                        )}
                        % do seu limite genérico estimado.
                      </p>
                    </div>
                  )}
                </div>
                </div>
              )}

                {/* Right: Results */}
                <div className="space-y-6">
                  {isAnalyzing ? (
                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 space-y-8 relative overflow-hidden bg-[var(--color-bg)] rounded-[24px]">
                      <div className="absolute inset-0 z-0">
                        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#2563eb] rounded-full animate-ping opacity-20" />
                        <div
                          className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-[#2563eb] rounded-full animate-ping opacity-10"
                          style={{ animationDelay: "0.5s" }}
                        />
                      </div>
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-[120px] h-[120px] relative flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-4 border-[#2563eb]/10" />
                          <div className="absolute inset-0 rounded-full border-4 border-t-[#2563eb] animate-[spin_1.5s_linear_infinite]" />
                          <Zap className="w-10 h-10 text-[#2563eb] animate-pulse drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]" />
                        </div>
                      </div>
                      <div className="text-center space-y-3 z-10 w-full max-w-xs">
                        <h3 className="font-display text-[24px] leading-none text-[var(--color-text)] tracking-wide animate-pulse">
                          {loadingMessage}
                        </h3>
                        <div className="h-1 bg-[var(--color-surface)] shadow-sm rounded-full overflow-hidden w-full relative">
                          <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-[#2563eb] rounded-full animate-[translateX_2s_ease-in-out_infinite]" />
                        </div>
                      </div>
                    </div>
                  ) : result ? (
                    <div className="space-y-6 pb-12 relative animate-fade-in-up">
                      {/* Score Hero */}
                      <div className="relative flex flex-col items-center justify-center py-6">
                        <div className="absolute top-0 right-0 p-4">
                          <button 
                            onClick={() => {
                              if (confirm("Deseja realizar um novo scan? Isso limpará o resultado atual.")) {
                                setResult(null);
                                setImages({});
                              }
                            }}
                            className="bg-[var(--color-surface-hover)] border border-[var(--color-border)] px-4 py-2 rounded-xl text-[10px] font-black uppercase text-[var(--color-text)] hover:bg-[var(--color-border-subtle)] transition-all flex items-center gap-2 shadow-sm"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Novo Scan
                          </button>
                        </div>

                        {/* Comparison Card if history exists */}
                        {analysisHistory.length > 1 && (
                          <div className="absolute top-0 left-0 bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] px-3 py-2 rounded-xl flex flex-col items-start max-w-[120px]">
                            <span className="text-[8px] uppercase tracking-widest text-[var(--color-text-muted)] font-black mb-1">Evolução</span>
                            {(() => {
                              const prev = analysisHistory[1];
                              const scoreDiff = result.overallScore - prev.overallScore;
                              const bfDiff = result.bfEstimate - prev.bfEstimate;
                              return (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <span className={`text-[10px] font-bold ${scoreDiff >= 0 ? 'text-[#2563eb]' : 'text-red-500'}`}>
                                      {scoreDiff >= 0 ? '+' : ''}{scoreDiff} pts
                                    </span>
                                    <TrendingUp className={`w-3 h-3 ${scoreDiff >= 0 ? 'text-[#2563eb]' : 'text-red-500 rotate-180'}`} />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-[10px] font-bold ${bfDiff <= 0 ? 'text-[#2563eb]' : 'text-red-500'}`}>
                                      {bfDiff > 0 ? '+' : ''}{bfDiff.toFixed(1)}% BF
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        <div className="relative w-[200px] h-[200px] flex items-center justify-center mb-4">
                          <svg
                            className="w-full h-full transform -rotate-90"
                            viewBox="0 0 100 100"
                          >
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="#111827"
                              strokeWidth="6"
                            />
                            <motion.circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="url(#scoreGradient)"
                              strokeWidth="6"
                              strokeDasharray="283"
                              initial={{ strokeDashoffset: 283 }}
                              animate={{
                                strokeDashoffset:
                                  283 - (283 * result.overallScore) / 100,
                              }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient
                                id="scoreGradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#2563eb" />
                                <stop offset="100%" stopColor="#1d4ed8" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="flex items-baseline">
                              <span className="font-display font-black text-[80px] leading-none text-[var(--color-text)] tracking-[-2px]">
                                {result.overallScore}
                              </span>
                              <span className="text-[20px] font-display text-[var(--color-text-muted)]">
                                /100
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`px-4 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-widest ${result.bfEstimate < 10 ? "bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]/20" : result.bfEstimate < 15 ? "bg-[#1d4ed8]/10 text-[#1d4ed8] border-[#1d4ed8]/20" : result.bfEstimate < 20 ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-[#374151]/20 text-[var(--color-text-muted)] border-[#374151]"}`}
                        >
                          Categoria:{" "}
                          {result.bfEstimate < 10
                            ? "Atleta Elite"
                            : result.bfEstimate < 15
                              ? "Atlético"
                              : result.bfEstimate < 20
                                ? "Fitness"
                                : "Evolução"}
                        </div>
                      </div>

                      {/* Mini Stats Row */}
                      <div className="grid grid-cols-3 gap-3 px-1">
                        <div className="bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-[16px] p-3 flex flex-col justify-between">
                          <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-2">
                            BF%
                          </span>
                          <div>
                            <p className="font-display text-[24px] text-[var(--color-text)] leading-none mb-1">
                              {result.bfEstimate}%
                            </p>
                            <div className="h-1 bg-[var(--color-surface)] shadow-sm rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-500 rounded-full"
                                style={{
                                  width: `${Math.min(100, 100 - (result.bfEstimate - 5) * 4)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-[16px] p-3 flex flex-col justify-between">
                          <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-2">
                            Simetria
                          </span>
                          <div>
                            <p className="font-display text-[24px] text-[var(--color-text)] leading-none mb-1">
                              {result.metrics.symmetry}/10
                            </p>
                            <div className="h-1 bg-[var(--color-surface)] shadow-sm rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#2563eb] rounded-full"
                                style={{
                                  width: `${result.metrics.symmetry * 10}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-[16px] p-3 flex flex-col justify-between">
                          <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-2">
                            Volume
                          </span>
                          <div>
                            <p className="font-display text-[24px] text-[var(--color-text)] leading-none mb-1">
                              {result.metrics.volume}/10
                            </p>
                            <div className="h-1 bg-[var(--color-surface)] shadow-sm rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#1d4ed8] rounded-full"
                                style={{
                                  width: `${result.metrics.volume * 10}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Filter Chips */}
                      <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide no-scrollbar px-1">
                        {[
                          "Tudo",
                          "Gordura",
                          "Simetria",
                          "Definição",
                          "Plano",
                        ].map((f) => (
                          <button
                            key={f}
                            onClick={() => {
                              setAnalysisFilter(f as any);
                              if (f !== "Tudo" && f !== "Plano") {
                                setActiveAccordion(
                                  f === "Gordura"
                                    ? "fat"
                                    : f === "Simetria"
                                      ? "sym"
                                      : "def",
                                );
                              } else if (f === "Tudo") {
                                setActiveAccordion(null);
                              }
                            }}
                            className={`px-5 py-2.5 rounded-full text-[11px] uppercase tracking-widest transition-all whitespace-nowrap border flex-shrink-0 ${analysisFilter === f ? "bg-[#2563eb] border-[#2563eb] text-white font-bold shadow-[0_4px_12px_rgba(37,99,235,0.15)]" : "bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] font-medium hover:border-black/20"}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>

                      {/* Accordion Sections */}
                      <motion.div
                        className="space-y-4 px-1"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset }) => {
                          const swipe = offset.x;
                          const tabs = [
                            "Tudo",
                            "Gordura",
                            "Simetria",
                            "Definição",
                            "Plano",
                          ];
                          const idx = tabs.indexOf(analysisFilter);
                          if (swipe < -50 && idx < tabs.length - 1) {
                            const nextTab = tabs[idx + 1];
                            setAnalysisFilter(nextTab as any);
                            if (nextTab !== "Tudo" && nextTab !== "Plano") {
                              setActiveAccordion(
                                nextTab === "Gordura"
                                  ? "fat"
                                  : nextTab === "Simetria"
                                    ? "sym"
                                    : "def",
                              );
                            } else if (nextTab === "Tudo") {
                              setActiveAccordion(null);
                            }
                          } else if (swipe > 50 && idx > 0) {
                            const prevTab = tabs[idx - 1];
                            setAnalysisFilter(prevTab as any);
                            if (prevTab !== "Tudo" && prevTab !== "Plano") {
                              setActiveAccordion(
                                prevTab === "Gordura"
                                  ? "fat"
                                  : prevTab === "Simetria"
                                    ? "sym"
                                    : "def",
                              );
                            } else if (prevTab === "Tudo") {
                              setActiveAccordion(null);
                            }
                          }
                        }}
                      >
                        {/* Body Fat Section */}
                        {(analysisFilter === "Tudo" ||
                          analysisFilter === "Gordura") && (
                          <div
                            className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${activeAccordion === "fat" ? "bg-[var(--color-surface)] shadow-sm border-[var(--color-border)]" : "bg-[var(--color-bg)] border-[rgba(255,255,255,0.06)]"}`}
                          >
                            <button
                              onClick={() =>
                                setActiveAccordion(
                                  activeAccordion === "fat" ? null : "fat",
                                )
                              }
                              className="w-full p-[20px] flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[14px] ${result.bfEstimate > 18 ? "bg-[#ffb800]/10 text-[#ffb800]" : "bg-[#2563eb]/10 text-[#2563eb]"}`}
                                >
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M12 2v20" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                  </svg>
                                </div>
                                <div className="text-left flex flex-col pt-1">
                                  <h4 className="text-[14px] font-semibold text-[var(--color-text)] leading-tight">
                                    Gordura Corporal
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded-[6px] bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] text-[12px] font-bold text-[var(--color-text)]">
                                  {result.bfEstimate}%
                                </span>
                                <ChevronDown
                                  className={`w-5 h-5 text-[var(--color-text-muted)] transition-transform duration-300 ${activeAccordion === "fat" ? "rotate-180 text-[var(--color-text)]" : ""}`}
                                />
                              </div>
                            </button>

                            <motion.div
                              initial={false}
                              animate={{
                                height: activeAccordion === "fat" ? "auto" : 0,
                                opacity: activeAccordion === "fat" ? 1 : 0,
                              }}
                              className="overflow-hidden"
                            >
                              <div className="px-[20px] pb-[20px] space-y-4">
                                <div className="bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-4 flex flex-col gap-3">
                                  <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.04)]">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#ffb800]" />
                                      <span className="text-[12px] text-[var(--color-text-muted)]">
                                        Fase Recomendada
                                      </span>
                                    </div>
                                    <span className="text-[12px] font-bold text-[var(--color-text)]">
                                      {result.recommendations.dietPhase}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                                      <span className="text-[12px] text-[var(--color-text-muted)]">
                                        Calorias Sugeridas
                                      </span>
                                    </div>
                                    <span className="text-[12px] font-bold text-[var(--color-text)]">
                                      {result.recommendations.macros.calories}{" "}
                                      kcal
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[13px] text-[var(--color-text-muted)] italic leading-relaxed">
                                  "{result.analysis.summary.split(".")[0]}."
                                </p>
                              </div>
                            </motion.div>
                          </div>
                        )}

                        {/* Symmetry Section */}
                        {(analysisFilter === "Tudo" ||
                          analysisFilter === "Simetria") && (
                          <div
                            className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${activeAccordion === "sym" ? "bg-[var(--color-surface)] shadow-sm border-[var(--color-border)]" : "bg-[var(--color-bg)] border-[rgba(255,255,255,0.06)]"}`}
                          >
                            <button
                              onClick={() =>
                                setActiveAccordion(
                                  activeAccordion === "sym" ? null : "sym",
                                )
                              }
                              className="w-full p-[20px] flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[14px] ${result.metrics.symmetry >= 80 ? "bg-[#2563eb]/10 text-[#2563eb]" : result.metrics.symmetry >= 60 ? "bg-[#ffb800]/10 text-[#ffb800]" : "bg-[#ff4444]/10 text-[#ff4444]"}`}
                                >
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="m19 11-7-7-7 7" />
                                    <path d="M12 4v16" />
                                    <path d="m5 13 7 7 7-7" />
                                  </svg>
                                </div>
                                <div className="text-left flex flex-col pt-1">
                                  <h4 className="text-[14px] font-semibold text-[var(--color-text)] leading-tight">
                                    Simetria Muscular
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded-[6px] bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] text-[12px] font-bold text-[var(--color-text)]">
                                  {result.metrics.symmetry >= 80
                                    ? "Boa"
                                    : result.metrics.symmetry >= 60
                                      ? "Regular"
                                      : "Fraca"}
                                </span>
                                <ChevronDown
                                  className={`w-5 h-5 text-[var(--color-text-muted)] transition-transform duration-300 ${activeAccordion === "sym" ? "rotate-180 text-[var(--color-text)]" : ""}`}
                                />
                              </div>
                            </button>

                            <motion.div
                              initial={false}
                              animate={{
                                height: activeAccordion === "sym" ? "auto" : 0,
                                opacity: activeAccordion === "sym" ? 1 : 0,
                              }}
                              className="overflow-hidden"
                            >
                              <div className="px-[20px] pb-[20px] space-y-4">
                                <div className="bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-4 flex flex-col gap-0">
                                  {result.proportions.imbalances.map(
                                    (imb, i) => (
                                      <div
                                        key={i}
                                        className={`flex justify-between items-start gap-4 py-3 ${i < result.proportions.imbalances.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}
                                      >
                                        <div className="flex items-start gap-2 pt-0.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#ffb800] mt-1 shrink-0" />
                                          <span className="text-[12px] text-[var(--color-text)]">
                                            {imb}
                                          </span>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                                <p className="text-[13px] text-[var(--color-text-muted)] italic leading-relaxed">
                                  "{result.proportions.description}"
                                </p>
                              </div>
                            </motion.div>
                          </div>
                        )}

                        {/* Definition Section */}
                        {(analysisFilter === "Tudo" ||
                          analysisFilter === "Definição") && (
                          <div
                            className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${activeAccordion === "def" ? "bg-[var(--color-surface)] shadow-sm border-[var(--color-border)]" : "bg-[var(--color-bg)] border-[rgba(255,255,255,0.06)]"}`}
                          >
                            <button
                              onClick={() =>
                                setActiveAccordion(
                                  activeAccordion === "def" ? null : "def",
                                )
                              }
                              className="w-full p-[20px] flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[14px] ${result.metrics.definition >= 75 ? "bg-[#2563eb]/10 text-[#2563eb]" : "bg-[#ffb800]/10 text-[#ffb800]"}`}
                                >
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M12 20V10" />
                                    <path d="M18 20V4" />
                                    <path d="M6 20v-4" />
                                  </svg>
                                </div>
                                <div className="text-left flex flex-col pt-1">
                                  <h4 className="text-[14px] font-semibold text-[var(--color-text)] leading-tight">
                                    Definição Muscular
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded-[6px] bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] text-[12px] font-bold text-[var(--color-text)]">
                                  {result.metrics.definition >= 75
                                    ? "Boa"
                                    : "Regular"}
                                </span>
                                <ChevronDown
                                  className={`w-5 h-5 text-[var(--color-text-muted)] transition-transform duration-300 ${activeAccordion === "def" ? "rotate-180 text-[var(--color-text)]" : ""}`}
                                />
                              </div>
                            </button>

                            <motion.div
                              initial={false}
                              animate={{
                                height: activeAccordion === "def" ? "auto" : 0,
                                opacity: activeAccordion === "def" ? 1 : 0,
                              }}
                              className="overflow-hidden"
                            >
                              <div className="px-[20px] pb-[20px] space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-3 text-center">
                                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold mb-1">
                                      Densidade
                                    </p>
                                    <p className="text-[20px] font-display text-[var(--color-text)]">
                                      {result.metrics.density}%
                                    </p>
                                  </div>
                                  <div className="bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-3 text-center">
                                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold mb-1">
                                      Volume
                                    </p>
                                    <p className="text-[20px] font-display text-[var(--color-text)]">
                                      {result.metrics.volume}%
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-[#2563eb]/5 border border-[#2563eb]/10 rounded-[12px] p-4 flex flex-col gap-0 mt-2">
                                  <p className="text-[11px] font-bold text-[#2563eb] uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <Award className="w-4 h-4" /> Pontos Fortes
                                  </p>
                                  {result.analysis.strengths
                                    .slice(0, 3)
                                    .map((s, i) => (
                                      <div
                                        key={i}
                                        className={`flex items-start gap-2 py-2 ${i < 2 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb] mt-1 shrink-0" />
                                        <span className="text-[12px] text-[var(--color-text)] leading-tight">
                                          {s}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        )}

                        {/* Posture Section */}
                        {result.posture && (
                            <div
                                className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${activeAccordion === "posture" ? "bg-[var(--color-surface)] shadow-sm border-[var(--color-border)]" : "bg-[var(--color-bg)] border-[rgba(255,255,255,0.06)]"}`}
                            >
                                <button
                                    onClick={() =>
                                        setActiveAccordion(
                                            activeAccordion === "posture" ? null : "posture",
                                        )
                                    }
                                    className="w-full p-[20px] flex items-center justify-between group cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[14px] ${result.posture.detected ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"}`}
                                        >
                                            <ShieldAlert className="w-[18px] h-[18px]" />
                                        </div>
                                        <div className="text-left flex flex-col pt-1">
                                            <h4 className="text-[14px] font-semibold text-[var(--color-text)] leading-tight">
                                                Análise Postural
                                            </h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded-[6px] bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] text-[12px] font-bold ${result.posture.detected ? "text-amber-500" : "text-green-500"}`}>
                                            {result.posture.detected ? "DESVIO" : "OK"}
                                        </span>
                                        <ChevronDown
                                            className={`w-5 h-5 text-[var(--color-text-muted)] transition-transform duration-300 ${activeAccordion === "posture" ? "rotate-180 text-[var(--color-text)]" : ""}`}
                                        />
                                    </div>
                                </button>

                                <motion.div
                                    initial={false}
                                    animate={{
                                        height: activeAccordion === "posture" ? "auto" : 0,
                                        opacity: activeAccordion === "posture" ? 1 : 0,
                                    }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-[20px] pb-[20px] space-y-4">
                                        {result.posture.detected ? (
                                            <>
                                                <div className="bg-amber-500/5 border border-amber-500/10 rounded-[12px] p-4 text-left">
                                                    <p className="text-[10px] text-amber-600 uppercase font-black tracking-widest mb-2">ALERTA BIOMÉTRICO</p>
                                                    <h5 className="text-[14px] font-black text-white uppercase italic mb-1">{result.posture.issue}</h5>
                                                    <p className="text-[12px] text-[var(--color-text-muted)] italic leading-relaxed">"{result.posture.correction}"</p>
                                                </div>
                                                
                                                <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-[16px] p-4 relative overflow-hidden">
                                                    <p className="text-[10px] text-[var(--primary)] uppercase font-black tracking-widest mb-3">EXERCÍCIO CORRETIVO IA</p>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shrink-0">
                                                            <Activity className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h6 className="text-[13px] font-black text-white uppercase tracking-wider">{result.posture.corrective_exercise.nome}</h6>
                                                            <div className="flex gap-4 mt-1">
                                                                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{result.posture.corrective_exercise.series}</span>
                                                                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{result.posture.corrective_exercise.repeticoes}</span>
                                                            </div>
                                                            <p className="text-[11px] text-[var(--color-text-muted)] mt-2 italic leading-tight">POR QUÊ: {result.posture.corrective_exercise.why}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="bg-green-500/5 border border-green-500/10 rounded-[12px] p-4 text-center">
                                                <p className="text-[12px] text-green-500 font-bold uppercase tracking-widest">Postura detectada como estável e simétrica.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                      </motion.div>

                      {/* Additional Content (Radar + Comparison) - Only in 'Tudo' */}
                      {analysisFilter === "Tudo" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 px-1">
                          <div className="bg-[var(--color-bg)] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-5 aspect-square flex flex-col items-center justify-center overflow-hidden">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                              Radar do Shape
                            </h4>
                            <div className="w-full h-full max-w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart
                                  cx="50%"
                                  cy="50%"
                                  outerRadius="70%"
                                  data={radarData}
                                >
                                  <PolarGrid stroke="#e2e8f0" />
                                  <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{ fill: "#6b7280", fontSize: 9 }}
                                  />
                                  <Radar
                                    name="Shape"
                                    dataKey="A"
                                    stroke="#2563eb"
                                    fill="#2563eb"
                                    fillOpacity={0.2}
                                  />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="bg-[var(--color-bg)] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-5 flex flex-col justify-center space-y-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] flex items-center gap-2">
                              <Camera className="w-4 h-4" /> Comparativo
                              Quinzenal
                            </h4>
                            {evolutionHistory.length > 1 ? (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <div className="aspect-[3/4] rounded-[12px] overflow-hidden border border-[var(--color-border)]">
                                    <img
                                      src={
                                        evolutionHistory[
                                          evolutionHistory.length - 2
                                        ].photo || images.front
                                      }
                                      className="w-full h-full object-cover grayscale opacity-50"
                                    />
                                  </div>
                                  <p className="text-[9px] font-bold text-[var(--color-text-muted)] text-center uppercase tracking-tighter">
                                    Anterior
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <div className="aspect-[3/4] rounded-[12px] overflow-hidden border border-[#2563eb]/50 shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                                    <img
                                      src={images.front}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <p className="text-[9px] font-bold text-[#2563eb] text-center uppercase tracking-tighter">
                                    Atual
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[var(--color-border)] rounded-[12px] p-6">
                                <Camera className="w-8 h-8 text-[var(--color-text-muted)] mb-2" />
                                <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold text-center">
                                  Aguardando mais fotos...
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Button & Corrective Plan */}
                      {(analysisFilter === "Tudo" ||
                        analysisFilter === "Plano") && (
                        <div className="pt-2 px-1">
                          {!isGeneratingCorrectivePlan && !correctivePlan ? (
                            <>
                              <button
                                onClick={handleGenerateCorrectivePlan}
                                className="w-full h-[60px] bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white font-display text-[20px] uppercase tracking-wide rounded-[16px] active:scale-[0.97] transition-all shadow-[0_8px_32px_rgba(37,99,235,0.2)] flex items-center justify-center gap-2"
                              >
                                <Zap className="w-5 h-5 fill-current" />
                                <span>Ver Plano Corretivo</span>
                              </button>
                              <p className="text-center text-[10px] text-[var(--color-text-muted)] font-bold uppercase mt-4 tracking-widest">
                                Plano Integrado de Treino + Dieta
                              </p>
                            </>
                          ) : isGeneratingCorrectivePlan ? (
                            <div className="space-y-4 animate-pulse">
                              <div className="h-24 bg-[var(--color-surface)] shadow-sm rounded-[20px] border border-[rgba(255,255,255,0.06)]" />
                              <div className="grid grid-cols-2 gap-3">
                                <div className="h-32 bg-[var(--color-surface)] shadow-sm rounded-[20px] border border-[rgba(255,255,255,0.06)]" />
                                <div className="h-32 bg-[var(--color-surface)] shadow-sm rounded-[20px] border border-[rgba(255,255,255,0.06)]" />
                              </div>
                              <div className="h-40 bg-[var(--color-surface)] shadow-sm rounded-[20px] border border-[rgba(255,255,255,0.06)]" />
                              <p className="text-center text-[10px] text-[#2563eb] font-bold uppercase tracking-widest">
                                A inteligência artificial está desenhando seu
                                shape...
                              </p>
                            </div>
                          ) : (
                            correctivePlan && (
                              <div className="space-y-4 bg-[var(--color-surface)] shadow-sm border-l-4 border-l-[#2563eb] border-y border-r border-[var(--color-border)] rounded-[20px] p-5 shadow-lg">
                                <h3 className="text-[18px] font-display uppercase text-[var(--color-text)] flex items-center gap-2">
                                  <Trophy className="w-5 h-5 text-[#2563eb]" />{" "}
                                  Plano Corretivo
                                </h3>
                                <div className="p-3 bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] rounded-[12px]">
                                  <p className="text-[13px] font-medium text-[#2563eb]">
                                    {correctivePlan.summary}
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] rounded-[12px] flex flex-col gap-0">
                                    <h4 className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-widest mb-2">
                                      Foco do Treino
                                    </h4>
                                    {correctivePlan.trainingFocus.map(
                                      (f: any, i: number) => (
                                        <div
                                          key={i}
                                          className={`flex items-start gap-2 py-2 ${i < correctivePlan.trainingFocus.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb] mt-1 shrink-0" />
                                          <span className="text-[12px] text-[var(--color-text)] leading-tight">
                                            {f}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                  <div className="p-3 bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] rounded-[12px] flex flex-col gap-0">
                                    <h4 className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-widest mb-2">
                                      Dicas de Dieta
                                    </h4>
                                    {correctivePlan.dietFocus.map(
                                      (d: any, i: number) => (
                                        <div
                                          key={i}
                                          className={`flex items-start gap-2 py-2 ${i < correctivePlan.dietFocus.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb] mt-1 shrink-0" />
                                          <span className="text-[12px] text-[var(--color-text)] leading-tight">
                                            {d}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>

                                <div className="p-3 bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] rounded-[12px] flex flex-col gap-0">
                                  <h4 className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-widest mb-2">
                                    Alvos Prioritários
                                  </h4>
                                  {correctivePlan.priorityExercises.map(
                                    (ex: any, i: number) => (
                                      <div
                                        key={i}
                                        className={`flex justify-between items-center text-[12px] py-3 ${i < correctivePlan.priorityExercises.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}
                                      >
                                        <strong className="text-[#2563eb] font-bold">
                                          {ex.name}
                                        </strong>
                                        <span className="text-[var(--color-text-muted)] text-right">
                                          {ex.reason}
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setActiveTab("training");
                                      if (!trainingPlan) {
                                        if (result) handleGenerateTrainingPremium();
                                        else handleGenerateTrainingFree();
                                      }
                                      window.scrollTo({
                                        top: 0,
                                        behavior: "smooth",
                                      });
                                    }}
                                    className="flex-1 py-3 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white rounded-[12px] text-center text-[13px] font-bold uppercase transition-all shadow-[0_4px_15px_rgba(37,99,235,0.15)]"
                                  >
                                    Ir para o Treino
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveTab("diet");
                                      if (!dietPlan) {
                                        if (result) handleGenerateDietPremium();
                                        else handleGenerateDietFree();
                                      }
                                      window.scrollTo({
                                        top: 0,
                                        behavior: "smooth",
                                      });
                                    }}
                                    className="flex-1 py-3 bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] text-[var(--color-text)] rounded-[12px] text-center text-[13px] font-bold uppercase hover:bg-[var(--color-surface)] shadow-sm transition-all"
                                  >
                                    Ir para a Dieta
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* Pump Analysis Section */}
                      {result.analysis.pumpAnalysis && (
                        <div className="p-6 rounded-[20px] bg-[#2563eb]/5 border border-[#2563eb]/10 mt-6 space-y-4">
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-[#2563eb]" />
                            <h3 className="text-[20px] font-display text-[var(--color-text)] uppercase tracking-wide">
                              Análise de Pump
                            </h3>
                          </div>
                          <div className="grid md:grid-cols-3 gap-3">
                            <div className="p-3 rounded-[12px] bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)]">
                              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1">
                                Vascularização
                              </p>
                              <p className="text-[24px] font-display text-[#2563eb]">
                                {result.analysis.pumpAnalysis.vascularityScore}
                                <span className="text-[14px]">/100</span>
                              </p>
                            </div>
                            <div className="p-3 rounded-[12px] bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] flex flex-col justify-center">
                              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1">
                                Volume
                              </p>
                              <p className="text-[14px] font-bold text-[var(--color-text)]">
                                {result.analysis.pumpAnalysis.volumeIncrease}
                              </p>
                            </div>
                            <div className="p-3 rounded-[12px] bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)]">
                              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1">
                                Comparação
                              </p>
                              <p className="text-[12px] text-[var(--color-text)] leading-tight">
                                {result.analysis.pumpAnalysis.comparison}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Full Markdown Report Section */}
                      {result.fullMarkdownReport && (
                        <div className="p-6 rounded-[20px] bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] mt-6 space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-[#2563eb]" />
                            <h3 className="text-[20px] font-display text-[var(--color-text)] uppercase tracking-wide">
                              Relatório Profissional
                            </h3>
                          </div>
                          <div className="markdown-body prose prose-invert prose-green max-w-none">
                            <Markdown>{result.fullMarkdownReport}</Markdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}

            {activeTab === "diet" && (
  <motion.div
    key="diet"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-4xl mx-auto space-y-6 pb-12 px-2"
  >
    <div className="flex flex-col items-center justify-center p-8 bg-[var(--color-bg)] rounded-[24px] border border-[var(--color-border-subtle)] min-h-[500px]">
      <div className="w-24 h-24 rounded-full bg-[#ffb800]/10 flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ffb800]"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      </div>
      <h2 className="text-[20px] font-display font-medium text-[var(--color-text)] mb-3 tracking-wide">ABA EM MANUTENÇÃO</h2>
      <p className="text-[var(--color-text-muted)] text-[14px] max-w-sm text-center mb-8">Estamos preparando melhorias exclusivas para a área de Dieta. Em breve teremos novidades para o seu shape!</p>
    </div>
  </motion.div>
)}

            {activeTab === "training" && (
  <motion.div
    key="training"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-4xl mx-auto space-y-6 pb-12 px-2"
  >
    {/* Workout Completed Status */}
    {completedWorkouts.some(id => id.includes(new Date().toISOString().split('T')[0])) && (
      <div className="bg-[#2563eb]/10 border border-[#2563eb]/30 rounded-2xl p-4 flex items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-[12px] font-black text-[#2563eb] uppercase tracking-widest">Treino de Hoje Concluído</h3>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold">Obrigado pelo esforço. Aproveite o descanso e a dieta.</p>
        </div>
      </div>
    )}

    {/* SUB-TAB NAV */}
    <div className="flex bg-[var(--color-bg)] p-1 rounded-[16px] border border-[rgba(255,255,255,0.06)]">
      <button onClick={() => setTrainingTab('generator')} className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider rounded-[12px] transition-all ${trainingTab === 'generator' ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>Gerar Plano</button>
      <button onClick={() => setTrainingTab('my-plan')} className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider rounded-[12px] transition-all ${trainingTab === 'my-plan' ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>Meu Plano</button>
    </div>

    {trainingTab === 'generator' ? (
      <>
    {/* MODE SELECTION */}
    {!trainingPlan && !isGeneratingTraining && !trainingMode && (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--color-bg)] rounded-[24px] border border-[rgba(255,255,255,0.06)] min-h-[500px]">
        <div className="w-24 h-24 rounded-full bg-[#2563eb]/5 flex items-center justify-center mb-6">
          <Dumbbell className="w-12 h-12 text-[#2563eb]/50" />
        </div>
        <h2 className="text-[20px] font-display font-medium text-[var(--color-text)] mb-3 tracking-wide">ESCOLHA O TREINO</h2>
        <p className="text-[var(--color-text-muted)] text-[14px] max-w-sm text-center mb-8">Treine com inteligência IA baseada no seu shape ou personalize o seu treino manual.</p>
        
        <div className="grid md:grid-cols-2 gap-4 w-full max-w-2xl">
          <button 
            onClick={() => {
              if (!result) {
                setActiveTab('analyze');
                setResult(null); // ensure form shows up
              } else {
                setTrainingMode('premium');
              }
            }}
            className={`relative p-8 rounded-[24px] border flex flex-col items-start transition-all text-left group bg-[#0a0f16] border-[#2563eb]/30 hover:border-[#2563eb] hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] cursor-pointer overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563eb]/10 blur-[40px] pointer-events-none group-hover:bg-[#2563eb]/20 transition-all"></div>
            
            <div className="absolute top-5 right-5 px-3 py-1 bg-[#2563eb]/10 text-[#2563eb] border border-[#2563eb]/20 text-[9px] font-black uppercase rounded-full tracking-widest backdrop-blur-sm z-10">AI Powered</div>
            <Zap className={`w-10 h-10 mb-5 relative z-10 ${!result ? 'text-[var(--color-text-muted)]' : 'text-[#2563eb] group-hover:animate-pulse'}`} />
            <h3 className="text-[18px] font-black uppercase tracking-widest text-white mb-2 relative z-10">Smart Training Engine</h3>
            <p className="text-[12px] text-white/50 leading-relaxed relative z-10">Plano neural adaptativo gerado focado na sua biometria e nível atual de recuperação.</p>
            {!result && <div className="mt-5 text-[10px] text-[#ffb800] bg-[#ffb800]/10 border border-[#ffb800]/20 px-3 py-2 rounded-xl w-full text-center relative z-10 font-bold uppercase tracking-widest flex justify-center items-center gap-2"><Target className="w-3 h-3"/> Requer Escaneamento</div>}
          </button>
          
          <button 
            onClick={() => setTrainingMode('free')}
            className="relative p-8 rounded-[24px] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-black/30 flex flex-col items-start transition-all cursor-pointer text-left group overflow-hidden"
          >
            <div className="absolute top-5 right-5 px-3 py-1 bg-[var(--color-surface)] shadow-sm text-[var(--color-text-muted)] border border-[var(--color-border)] text-[9px] font-black uppercase rounded-full tracking-widest z-10">Manual</div>
            <Dumbbell className="w-10 h-10 text-[var(--color-text)] mb-5 relative z-10" />
            <h3 className="text-[18px] font-black uppercase tracking-widest text-[var(--color-text)] mb-2 relative z-10">Construtor Padrão</h3>
            <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed relative z-10">Protocolo hipertrófico construído através de input de dados manuais (altura, peso, objetivo).</p>
          </button>
        </div>
      </div>
    )}

    {/* Redirect to My Plan if plan exists */}
    {trainingPlan && !isGeneratingTraining && !trainingMode && (
         <div className="flex flex-col items-center justify-center p-8 bg-[var(--color-bg)] rounded-[24px] border border-[rgba(255,255,255,0.06)] min-h-[400px]">
             <h2 className="text-[20px] font-display font-medium text-[var(--color-text)] mb-2 uppercase tracking-tight">Você já tem um plano!</h2>
             <p className="text-[14px] text-[var(--color-text-muted)] mb-8 text-center max-w-xs">Deseja seguir seu plano atual ou criar uma nova periodização baseada nos dados atuais?</p>
             <div className="flex flex-col gap-3 w-full max-w-xs">
               <button onClick={() => setTrainingTab('my-plan')} className="w-full h-[52px] bg-[var(--color-neon)] text-white rounded-2xl font-black uppercase text-[12px] shadow-[0_8px_20px_rgba(37,99,235,0.15)]">Continuar Plano Atual</button>
               <button onClick={() => setTrainingMode('premium')} className="w-full h-[52px] bg-[var(--color-overlay)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl font-black uppercase text-[12px] hover:bg-[var(--color-border)] transition-all">Regerar Novo Plano (IA)</button>
             </div>
         </div>
    )}

    {/* PREMIUM FORM */}
    {!isGeneratingTraining && trainingMode === 'premium' && (
      <div className="space-y-6 animate-fade-in-up">
        <button onClick={() => setTrainingMode(null)} className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-[12px] font-bold uppercase tracking-wider transition-colors pt-2"><ArrowLeft className="w-4 h-4"/> Voltar</button>
        
        {/* Resumo da Análise */}
        <div className="bg-[var(--color-surface)] shadow-sm border-l-4 border-l-[#2563eb] border-y border-r border-[var(--color-border)] rounded-[20px] p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[14px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Última Análise Salva</h3>
              <p className="text-[24px] font-display text-[var(--color-text)] leading-none">{result?.overallScore}<span className="text-[14px] text-[var(--color-text-muted)]">/100</span></p>
            </div>
            <button onClick={() => setActiveTab('analyze')} className="bg-[var(--color-surface)] shadow-sm text-[var(--color-text)] px-3 py-1.5 rounded-[8px] text-[10px] font-bold uppercase">Refazer Análise</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-2 text-center">
              <p className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold">BF%</p>
              <p className="text-[12px] font-bold text-[var(--color-text)]">{result?.bfEstimate}%</p>
            </div>
            <div className="bg-[var(--color-bg)] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-2 text-center">
              <p className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold">Objetivo</p>
              <p className="text-[12px] font-bold text-[#ffb800]">{result?.recommendations?.dietPhase}</p>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="bg-[var(--color-bg)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 space-y-6">
          <h3 className="text-[18px] font-display text-[var(--color-text)] uppercase tracking-wide flex items-center gap-2"><Settings2 className="w-5 h-5 text-[#2563eb]"/> Ajustes de Treino</h3>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Nome do Plano</label>
            <input 
              type="text" 
              value={trainingFormPremium.planName}
              onChange={(e) => setTrainingFormPremium(p => ({...p, planName: e.target.value}))}
              placeholder="Ex: Treino Mutante, Foco Verão..."
              className="w-full bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] rounded-[12px] px-4 py-3 focus:outline-none focus:border-[#2563eb] text-[14px] text-[var(--color-text)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Músculo com Foco Extra (Opcional)</label>
            <input 
              type="text" 
              value={trainingFormPremium.focusMuscle}
              onChange={(e) => setTrainingFormPremium(p => ({...p, focusMuscle: e.target.value}))}
              placeholder="Ex: Peitoral superior, Panturrilhas..."
              className="w-full bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] rounded-[12px] px-4 py-3 focus:outline-none focus:border-[#2563eb] text-[14px] text-[var(--color-text)]"
            />
            <p className="text-[10px] text-[var(--color-text-muted)]">A IA ainda fará a correção baseada na sua foto, mas dará ênfase extra aqui.</p>
          </div>

           <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Dias por Semana</label>
            <div className="flex gap-2">
              {[2,3,4,5,6].map(d => (
                <button key={d} onClick={() => setTrainingFormPremium(p => ({...p, trainingDays: d}))} className={`flex-1 aspect-square rounded-[10px] font-bold text-[14px] flex items-center justify-center transition-all border ${trainingFormPremium.trainingDays === d ? 'bg-[#2563eb]/10 border-[#2563eb] text-[#2563eb]' : 'bg-[var(--color-surface)] shadow-sm border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-black/20'}`}>{d}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Equipamento</label>
            <div className="flex flex-wrap gap-2">
              {['Barra/Anilhas', 'Halteres', 'Máquinas', 'Polia', 'Peso Corporal'].map(e => (
                <button 
                  key={e}
                  onClick={() => setTrainingFormPremium(p => ({...p, equipment: p.equipment.includes(e) ? p.equipment.filter(x => x !== e) : [...p.equipment, e]}))}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border outline-none ${trainingFormPremium.equipment.includes(e) ? 'bg-[#2563eb]/10 border-[#2563eb] text-[#2563eb]' : 'bg-[var(--color-surface)] shadow-sm border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-black/20'}`}
                >{e}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Motor da IA (Velocidade vs Qualidade)</label>
            <div className="flex bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] rounded-[12px] p-1">
              <button onClick={() => setTrainingFormPremium(p => ({...p, generationModel: 'best'}))} className={`flex-1 py-2.5 text-[12px] font-bold rounded-[8px] transition-all flex items-center justify-center gap-2 ${trainingFormPremium.generationModel === 'best' ? 'bg-[var(--color-surface)] shadow-sm text-purple-400' : 'text-[var(--color-text-muted)]'}`}><Sparkles className="w-4 h-4"/> MELHOR IA</button>
              <button onClick={() => setTrainingFormPremium(p => ({...p, generationModel: 'fast'}))} className={`flex-1 py-2.5 text-[12px] font-bold rounded-[8px] transition-all flex items-center justify-center gap-2 ${trainingFormPremium.generationModel === 'fast' ? 'bg-[var(--color-surface)] shadow-sm text-[#2563eb]' : 'text-[var(--color-text-muted)]'}`}><Zap className="w-4 h-4"/> RÁPIDO</button>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {trainingFormPremium.generationModel === 'fast' ? 'Rápido (cerca de 5-10 segundos)' : 'Qualidade máxima da IA Pro (pode levar 30-60 segundos)'}
            </p>
          </div>

          <button onClick={handleGenerateTrainingPremium} className="w-full h-[56px] bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white font-display text-[18px] uppercase tracking-wide rounded-[16px] active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(37,99,235,0.2)] mt-4">
            Gerar Treino
          </button>
        </div>
      </div>
    )}

    {/* FREE FORM */}
    {!isGeneratingTraining && trainingMode === 'free' && (
      <div className="space-y-6 animate-fade-in-up">
        <button onClick={() => setTrainingMode(null)} className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-[12px] font-bold uppercase tracking-wider transition-colors pt-2"><ArrowLeft className="w-4 h-4"/> Voltar</button>

        <div className="bg-[var(--color-bg)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 space-y-4">
          <h3 className="text-[18px] font-display text-[var(--color-text)] uppercase tracking-wide flex items-center gap-2"><Dumbbell className="w-5 h-5 text-[#3b82f6]"/> Criar Treino Manual</h3>
          
          <input type="text" placeholder="Nome do exercício" className="w-full p-4 rounded-[12px] bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] text-[var(--color-text)]" 
            onChange={(e) => setTrainingFormFree(p => ({...p, manualExercise: e.target.value}))} />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Séries" className="p-4 rounded-[12px] bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] text-[var(--color-text)]" 
                onChange={(e) => setTrainingFormFree(p => ({...p, manualSeries: e.target.value}))} />
            <input type="text" placeholder="Repetições" className="p-4 rounded-[12px] bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] text-[var(--color-text)]" 
                onChange={(e) => setTrainingFormFree(p => ({...p, manualReps: e.target.value}))} />
            <select className="col-span-2 p-4 rounded-[12px] bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] text-[var(--color-text)]" onChange={(e) => setTrainingFormFree(p => ({...p, manualDay: e.target.value}))}>
                <option value="Segunda">Segunda-feira</option>
                <option value="Terça">Terça-feira</option>
                <option value="Quarta">Quarta-feira</option>
                <option value="Quinta">Quinta-feira</option>
                <option value="Sexta">Sexta-feira</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
            </select>
          </div>
           
           <button onClick={() => {
             const newExercise = {nome: trainingFormFree.manualExercise, series: trainingFormFree.manualSeries, repeticoes: trainingFormFree.manualReps};
             const day = trainingFormFree.manualDay || "Segunda";
             
             let newPlan = trainingPlan ? {...trainingPlan} : {divisao: "Personalizado", foco_principal: "Treino Personalizado", dias: []};
             let dayIndex = newPlan.dias.findIndex((d: any) => d.nome_dia === day);
             if (dayIndex === -1) {
                 newPlan.dias.push({nome_dia: day, musculo_foco: "Geral", exercicios: [newExercise]});
             } else {
                 newPlan.dias[dayIndex].exercicios.push(newExercise);
             }
             setTrainingPlan(newPlan);
           }} className="w-full h-[56px] bg-[var(--color-surface)] shadow-sm text-[var(--color-text)] font-display text-[16px] uppercase tracking-wide rounded-[16px] transition-all hover:bg-[var(--color-surface-hover)]">
            Adicionar Exercício
          </button>
          
           <button onClick={() => setTrainingMode(null)} className="w-full h-[56px] bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white font-display text-[18px] uppercase tracking-wide rounded-[16px] active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(37,99,235,0.2)] mt-4">
            Finalizar Treino
          </button>
        </div>
      </div>
    )}

    {/* LOADER */}
    {isGeneratingTraining && (
      <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-bg)] rounded-[24px] border border-[rgba(255,255,255,0.06)] min-h-[500px]">
        <div className="w-[120px] h-[120px] relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-[#2563eb]/10" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#2563eb] animate-[spin_1.5s_linear_infinite]" />
          <Dumbbell className="w-10 h-10 text-[#2563eb] animate-pulse drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]" />
        </div>
        <h2 className="text-[20px] font-display text-[var(--color-text)] animate-pulse tracking-wide">{trainingLoadingMessage}</h2>
      </div>
    )}
      </>
    ) : (
    // MEU PLANO TAB
    <div className="space-y-6 animate-fade-in-up">
        {trainingPlan ? (
            <div className="space-y-6">
                <div className="bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-[28px] p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-neon)]/5 to-transparent pointer-events-none hover:opacity-70 transition-opacity duration-500"></div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                      <div className="space-y-1">
                        <h2 className="text-[18px] font-display text-[var(--color-text)] uppercase tracking-wider">{trainingPlan.nome_do_plano || `Metodologia ${trainingPlan.divisao}`}</h2>
                        <h3 className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mt-1">Foco de Hoje</h3>
                        <p className="text-[14px] text-[var(--color-neon)] font-black uppercase tracking-widest">{trainingPlan.dias[trainingDayIndex].musculo_foco}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button onClick={() => setIsEditing(!isEditing)} className="p-2 bg-[var(--color-overlay)] rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                          <Settings2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                        <span>Progresso do Treino</span>
                        <span>0/{trainingPlan.dias[trainingDayIndex].exercicios.length} concluídos</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--color-overlay)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--color-neon)] transition-all" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar relative z-10">
                      {trainingPlan.dias.map((dia: any, i: number) => (
                          <button key={i} onClick={() => setTrainingDayIndex(i)} 
                            className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 w-[88px] h-[80px] rounded-[24px] transition-all relative overflow-hidden flex-none snap-center ${trainingDayIndex === i ? 'bg-gradient-to-br from-[var(--color-neon)] to-[#3b82f6] border-none shadow-[0_8px_25px_rgba(37,99,235,0.2)] scale-105 z-10' : 'bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-overlay)] opacity-70'}`}
                          >
                           <span className={`text-[9px] uppercase tracking-[0.2em] font-black ${trainingDayIndex === i ? 'text-white/60' : 'text-[var(--color-text-muted)]'}`}>Treino</span>
                           <span className={`text-2xl font-black italic ${trainingDayIndex === i ? 'text-white' : 'text-[var(--color-text)]/50'}`}>{String.fromCharCode(65 + i)}</span>
                          </button>
                      ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                    <h3 className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Série {String.fromCharCode(65 + trainingDayIndex)}: {trainingPlan.dias[trainingDayIndex].exercicios.length} Exercícios</h3>
                    <div className="flex gap-2">
                      <button onClick={() => startWorkout(trainingPlan.dias[trainingDayIndex])} className="text-[11px] font-black text-white uppercase tracking-wider bg-[var(--color-neon)] px-6 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                        <Play className="w-4 h-4 fill-current"/> INICIAR TREINO
                      </button>
                    </div>
                  </div>

                  {trainingPlan.dias[trainingDayIndex].exercicios.map((ex: any, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="group relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-[24px] p-5 hover:border-[var(--color-neon)]/30 transition-all cursor-pointer overflow-hidden shadow-lg"
                      >
                          <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black bg-gradient-to-r from-[var(--color-neon)]/20 to-transparent text-[var(--color-neon)] px-2 py-0.5 rounded-md uppercase tracking-tighter border border-[var(--color-neon)]/10">Base</span>
                                {isEditing ? (
                                    <input value={ex.nome} onChange={(e) => {
                                        const newPlan = {...trainingPlan};
                                        newPlan.dias[trainingDayIndex].exercicios[i].nome = e.target.value.toUpperCase();
                                        setTrainingPlan(newPlan);
                                    }} className="bg-transparent text-[16px] font-bold text-[var(--color-text)] border-b border-[var(--color-border)] outline-none" />
                                ) : (
                                    <h4 className="text-[16px] font-bold text-[var(--color-text)] group-hover:text-[var(--color-neon)] transition-colors">{ex.nome}</h4>
                                )}
                              </div>
                              {ex.why && (
                                <p className="text-[11px] text-[var(--color-text-muted)] italic leading-relaxed mt-1">
                                  {ex.why}
                                </p>
                              )}
                            </div>
                            <button className="w-8 h-8 rounded-full bg-[var(--color-overlay)] flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-neon)] hover:text-white transition-all">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </button>
                          </div>
                          
                          <div className="flex gap-4 relative z-10">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-overlay)] border border-[var(--color-border-subtle)]">
                                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Séries</span>
                                {isEditing ? (
                                    <input value={ex.series} onChange={(e) => {
                                        const newPlan = {...trainingPlan};
                                        newPlan.dias[trainingDayIndex].exercicios[i].series = e.target.value;
                                        setTrainingPlan(newPlan);
                                    }} className="w-8 bg-transparent text-[11px] font-bold text-[var(--color-text)] border-b border-[var(--color-border)] text-center outline-none" />
                                ) : (
                                    <span className="text-[11px] font-black text-[var(--color-text)]">{ex.series}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-overlay)] border border-[var(--color-border-subtle)]">
                                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Reps</span>
                                {isEditing ? (
                                    <input value={ex.repeticoes} onChange={(e) => {
                                        const newPlan = {...trainingPlan};
                                        newPlan.dias[trainingDayIndex].exercicios[i].repeticoes = e.target.value;
                                        setTrainingPlan(newPlan);
                                    }} className="w-8 bg-transparent text-[11px] font-bold text-[var(--color-text)] border-b border-[var(--color-border)] text-center outline-none" />
                                ) : (
                                    <span className="text-[11px] font-black text-[var(--color-text)]">{ex.repeticoes}</span>
                                )}
                              </div>
                          </div>
                          
                          {/* Glow background on hover */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-neon)]/5 blur-[50px] rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                  ))}
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-bg)] rounded-[32px] border border-[var(--color-border-subtle)] text-center">
              <Dumbbell className="w-12 h-12 text-[var(--color-text-muted)] opacity-20 mb-4" />
              <p className="text-[var(--color-text-muted)] text-[14px] uppercase font-bold tracking-widest">Nenhum plano gerado ainda.</p>
              <button onClick={() => setTrainingTab('generator')} className="mt-6 text-[11px] font-black text-[var(--color-neon)] uppercase tracking-wider border border-[var(--color-neon)]/30 px-6 py-2 rounded-full hover:bg-[var(--color-neon)]/10 transition-all">Ir para Gerador</button>
            </div>
        )}
    </div>

    )}
  </motion.div>
)}

            {activeTab === "recovery" && (
              <motion.div
                key="recovery"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl mx-auto space-y-6 pb-24 px-4"
              >
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-center space-y-1 py-4">
                    <h2 className="text-2xl font-black text-[var(--color-text)] uppercase italic">Status de Recuperação</h2>
                    <p className="text-[10px] text-[#2563eb] font-bold uppercase tracking-widest">Bio-Mapeamento de Fadiga Muscular</p>
                  </div>

                  {/* Bio-Mapping Status Center */}
                  <div className="relative glass-card border border-[var(--primary)]/20 rounded-[40px] p-8 overflow-hidden min-h-[500px] flex flex-col items-center">
                      <div className="absolute inset-0 cyber-grid opacity-10"></div>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 blur-[80px]"></div>
                      
                      {/* Scanning Line Animation */}
                      <motion.div 
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent z-10 opacity-30 shadow-[0_0_10px_var(--primary-glow)] pointer-events-none"
                      />

                      <div className="relative z-10 w-full flex flex-col items-center">
                        <div className="flex justify-between w-full mb-8">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.3em] italic">BIO_SCAN_ACTIVE</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                 <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_8px_var(--primary-glow)]"></div>
                                 <span className="text-[14px] font-display font-black text-white italic tracking-wider">MÁQUINA BIOMÉTRICA</span>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">PRECISÃO</span>
                              <div className="text-[14px] font-display font-black text-[var(--primary)] italic neo-glow-text">98.4%</div>
                           </div>
                        </div>

                        <div className="relative w-64 h-96 flex gap-4">
                            <div className="flex-1 relative group">
                               <div className="relative w-full h-full">
                                  <svg viewBox="0 0 100 200" className="w-full h-full filter drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">
                                     {/* Simple Human Outline */}
                                     <path d="M50 15 c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zM36 34c-6 0-11 5-11 11v35c0 3 2 6 5 6h4v100c0 4 3 7 7 7h18c4 0 7-3 7-7v-100h4c3 0 5-3 5-6v-35c0-6-5-11-11-11z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                                     
                                     {/* Front Muscles */}
                                     <circle cx="35" cy="45" r="7" fill={getMuscleStatus('Ombros').color} onClick={() => setSelectedMuscle('Ombros')} className="cursor-pointer hover:opacity-80 transition-opacity" />
                                     <circle cx="65" cy="45" r="7" fill={getMuscleStatus('Ombros').color} onClick={() => setSelectedMuscle('Ombros')} className="cursor-pointer hover:opacity-80 transition-opacity" />
                                     
                                     <path d="M40 45 h20 v15 h-20 z" fill={getMuscleStatus('Peito').color} onClick={() => setSelectedMuscle('Peito')} className="cursor-pointer hover:opacity-80 transition-opacity" />
                                     
                                     <path d="M30 45 l-8 30" stroke={getMuscleStatus('Bíceps').color} strokeWidth="5" strokeLinecap="round" onClick={() => setSelectedMuscle('Bíceps')} className="cursor-pointer opacity-70" />
                                     <path d="M70 45 l 8 30" stroke={getMuscleStatus('Bíceps').color} strokeWidth="5" strokeLinecap="round" onClick={() => setSelectedMuscle('Bíceps')} className="cursor-pointer opacity-70" />
                                     
                                     <rect x="42" y="62" width="16" height="25" rx="3" fill={getMuscleStatus('Abdômen').color} onClick={() => setSelectedMuscle('Abdômen')} className="cursor-pointer hover:opacity-80 transition-opacity" />
                                     
                                     <path d="M40 95 l-5 80" stroke={getMuscleStatus('Quadríceps').color} strokeWidth="10" strokeLinecap="round" onClick={() => setSelectedMuscle('Quadríceps')} className="cursor-pointer opacity-70" />
                                     <path d="M60 95 l 5 80" stroke={getMuscleStatus('Quadríceps').color} strokeWidth="10" strokeLinecap="round" onClick={() => setSelectedMuscle('Quadríceps')} className="cursor-pointer opacity-70" />
                                  </svg>
                                  <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase text-center mt-3 tracking-[0.4em]">FRONT_VIEW</p>
                               </div>
                            </div>
                            
                            <div className="flex-1 relative group">
                               <div className="relative w-full h-full">
                                  <svg viewBox="0 0 100 200" className="w-full h-full filter drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">
                                     <path d="M50 15 c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zM36 34c-6 0-11 5-11 11v35c0 3 2 6 5 6h4v100c0 4 3 7 7 7h18c4 0 7-3 7-7v-100h4c3 0 5-3 5-6v-35c0-6-5-11-11-11z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                                     
                                     {/* Back Muscles */}
                                     <path d="M35 45 h30 l-5 25 h-20 z" fill={getMuscleStatus('Costas Superior').color} onClick={() => setSelectedMuscle('Costas Superior')} className="cursor-pointer hover:opacity-80" />
                                     <rect x="44" y="72" width="12" height="15" fill={getMuscleStatus('Costas Inferior').color} onClick={() => setSelectedMuscle('Costas Inferior')} className="cursor-pointer hover:opacity-80" />
                                     
                                     <path d="M30 45 l-8 30" stroke={getMuscleStatus('Tríceps').color} strokeWidth="5" strokeLinecap="round" onClick={() => setSelectedMuscle('Tríceps')} className="cursor-pointer opacity-70" />
                                     <path d="M70 45 l 8 30" stroke={getMuscleStatus('Tríceps').color} strokeWidth="5" strokeLinecap="round" onClick={() => setSelectedMuscle('Tríceps')} className="cursor-pointer opacity-70" />
                                     
                                     <circle cx="43" cy="95" r="7" fill={getMuscleStatus('Glúteos').color} onClick={() => setSelectedMuscle('Glúteos')} className="cursor-pointer" />
                                     <circle cx="57" cy="95" r="7" fill={getMuscleStatus('Glúteos').color} onClick={() => setSelectedMuscle('Glúteos')} className="cursor-pointer" />
                                     
                                     <path d="M40 105 l-5 70" stroke={getMuscleStatus('Posteriores').color} strokeWidth="10" strokeLinecap="round" onClick={() => setSelectedMuscle('Posteriores')} className="cursor-pointer opacity-70" />
                                     <path d="M60 105 l 5 70" stroke={getMuscleStatus('Posteriores').color} strokeWidth="10" strokeLinecap="round" onClick={() => setSelectedMuscle('Posteriores')} className="cursor-pointer opacity-70" />
                                  </svg>
                                  <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase text-center mt-3 tracking-[0.4em]">BACK_VIEW</p>
                               </div>
                            </div>
                        </div>
                      </div>

                      <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between border-t border-white/5 pt-6">
                        {[
                          { label: 'OPT', color: 'var(--primary)' },
                          { label: 'LOW', color: 'var(--accent)' },
                          { label: 'STRESS', color: 'var(--error)' },
                          { label: 'NULL', color: '#1a202c' },
                        ].map(l => (
                          <div key={l.label} className="flex flex-col items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color, boxShadow: `0 0 10px ${l.color}` }}></div>
                              <span className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">{l.label}</span>
                          </div>
                        ))}
                      </div>
                  </div>

                  {/* Fatigue Legend */}
                  <div className="flex items-center justify-center gap-4 bg-[var(--color-overlay)] p-4 rounded-2xl border border-[var(--color-border-subtle)]">
                      {[
                        { label: 'Pronto', color: 'bg-[var(--primary)]' },
                        { label: 'Em Reparo', color: 'bg-[var(--secondary)]' },
                        { label: 'Fadigado', color: 'bg-[var(--error)]' },
                        { label: 'Sem Dados', color: 'bg-[var(--outline)]' },
                      ].map(l => (
                        <div key={l.label} className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${l.color} shadow-sm`}></div>
                            <span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">{l.label}</span>
                        </div>
                      ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {selectedMuscle ? (
                      <motion.div 
                        key="selected"
                        initial={{ height: 0, opacity: 0, scale: 0.95 }}
                        animate={{ height: 'auto', opacity: 1, scale: 1 }}
                        exit={{ height: 0, opacity: 0, scale: 0.95 }}
                        className="glass-card border border-[var(--primary)]/20 rounded-3xl p-6 relative overflow-hidden"
                      >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 blur-[40px] rounded-full pointer-events-none"></div>
                          <button 
                            onClick={() => setSelectedMuscle(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-[var(--color-overlay)] rounded-full transition-colors z-10"
                          >
                            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                          </button>
                          <div className="flex items-start gap-5 relative z-10">
                            <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center ${getMuscleStatus(selectedMuscle).bg} transition-all duration-500`}>
                                <Activity className={`w-8 h-8 ${getMuscleStatus(selectedMuscle).text}`} />
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                   <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] italic">Análise de Grupo</p>
                                   <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${getMuscleStatus(selectedMuscle).bg} ${getMuscleStatus(selectedMuscle).text}`}>
                                      {getMuscleStatus(selectedMuscle).status}
                                   </div>
                                </div>
                                <h4 className="text-2xl font-black text-[var(--color-text)] uppercase italic leading-none">{selectedMuscle}</h4>
                                <div className="p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border-subtle)]">
                                   <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed font-medium">
                                      {getMuscleStatus(selectedMuscle).desc}
                                   </p>
                                </div>
                                <div className="flex items-center gap-4 pt-1">
                                   <div className="flex flex-col">
                                      <span className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Último Estímulo</span>
                                      <span className="text-[12px] font-bold text-[var(--color-text)]">{getMuscleStatus(selectedMuscle).days} {getMuscleStatus(selectedMuscle).days === 1 ? 'dia' : 'dias'} atrás</span>
                                   </div>
                                   <div className="w-px h-6 bg-[var(--color-border-subtle)]" />
                                   <div className="flex flex-col">
                                      <span className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Protocolo</span>
                                      <span className={`text-[12px] font-bold ${(typeof getMuscleStatus(selectedMuscle).days === 'number' && (getMuscleStatus(selectedMuscle).days as number) <= 1) ? 'text-[var(--error)]' : 'text-[var(--primary)]'}`}>
                                         {(typeof getMuscleStatus(selectedMuscle).days === 'number' && (getMuscleStatus(selectedMuscle).days as number) <= 1) ? 'Repouso Total' : 'Hipertrofia Ativa'}
                                      </span>
                                   </div>
                                </div>
                            </div>
                          </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="info"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] rounded-3xl p-6 text-center"
                      >
                         <p className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                            Clique em um grupo muscular no mapa acima para ver o veredito biológico.
                         </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-lg mx-auto pb-32 pt-4 px-6"
              >
                {/* User Identity Section */}
                <section className="flex flex-col items-center mb-10">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full p-[2px] bg-gradient-to-tr from-[var(--primary)] via-[var(--secondary)] to-[var(--tertiary)] neo-glow-primary">
                      <div className="w-full h-full rounded-full overflow-hidden border-4 border-[var(--color-bg)] bg-[var(--color-surface)] flex items-center justify-center">
                        {profile.avatar ? (
                          <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-12 h-12 text-[var(--color-text-muted)]" />
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-[var(--primary)] text-[#001f29] p-1 rounded-full flex items-center justify-center border-2 border-[var(--color-bg)]">
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-[var(--color-text)] text-center mb-1 tracking-tight uppercase">
                    {profile.name || user?.user_metadata?.full_name || 'ATLETA SHAPE IA'}
                  </h1>
                  <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[var(--secondary-container)] border border-[var(--secondary)]/30">
                    <span className="material-symbols-outlined text-[var(--secondary)] text-[14px]">track_changes</span>
                    <span className="text-[10px] font-bold text-[var(--secondary)] tracking-[0.15em] uppercase">FOCO: {profile.goal}</span>
                  </div>
                </section>

                {/* Stats Grid */}
                <section className="grid grid-cols-2 gap-4 mb-10">
                  {/* Score Card */}
                  <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center transition-transform active:scale-95">
                    <div className="mb-3 relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full">
                        <circle className="text-white/5" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4"></circle>
                        <circle 
                          className="text-[var(--primary)] progress-ring" 
                          cx="32" 
                          cy="32" 
                          fill="transparent" 
                          r="28" 
                          stroke="currentColor" 
                          strokeDasharray="175.9" 
                          strokeDashoffset={175.9 - (175.9 * (result?.overallScore || (evolutionHistory.length > 0 ? evolutionHistory[evolutionHistory.length-1].score : 0))) / 100} 
                          strokeLinecap="round" 
                          strokeWidth="4"
                        ></circle>
                      </svg>
                      <span className="absolute font-bold text-lg text-[var(--primary)]">
                        {result?.overallScore || (evolutionHistory.length > 0 ? evolutionHistory[evolutionHistory.length-1].score : 0)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--outline)] uppercase tracking-widest">SHAPE SCORE</span>
                  </div>
                  {/* BF Card */}
                  <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center transition-transform active:scale-95">
                    <div className="mb-3">
                      <span className="material-symbols-outlined text-[var(--secondary)] text-[32px]">monitor_weight</span>
                    </div>
                    <span className="text-2xl font-bold text-[var(--secondary)] tracking-tight">
                      {result?.bfEstimate || (evolutionHistory.length > 0 ? evolutionHistory[evolutionHistory.length-1].bf : 0)}%
                    </span>
                    <span className="text-[10px] font-bold text-[var(--outline)] uppercase tracking-widest">BODY FAT</span>
                  </div>
                  {/* Streak Card */}
                  <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center transition-transform active:scale-95">
                    <div className="mb-3">
                      <span className="material-symbols-outlined text-[var(--tertiary)] text-[32px]">local_fire_department</span>
                    </div>
                    <span className="text-2xl font-bold text-[var(--tertiary)] tracking-tight">14</span>
                    <span className="text-[10px] font-bold text-[var(--outline)] uppercase tracking-widest">DIAS SEGUIDOS</span>
                  </div>
                  {/* Total Workouts Card */}
                  <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center transition-transform active:scale-95">
                    <div className="mb-3">
                      <span className="material-symbols-outlined text-[var(--primary)] text-[32px]">fitness_center</span>
                    </div>
                    <span className="text-2xl font-bold text-[var(--primary)] tracking-tight">
                      {completedWorkouts?.length || 0}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--outline)] uppercase tracking-widest">TREINOS TOTAL</span>
                  </div>
                </section>

                {/* Evolution Section */}
                <section className="glass-card rounded-[32px] p-8 mb-10 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50"></div>
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex flex-col">
                        <h2 className="text-[12px] font-black text-white uppercase tracking-[0.3em] italic mb-1">DATA EVOLUTION</h2>
                        <span className="text-[8px] font-bold text-[var(--primary)] uppercase tracking-widest neo-glow-text">SHAPE_SCORE_LOG</span>
                    </div>
                    <div className="flex gap-1.5 p-1 glass-card border-none rounded-xl">
                      {(['1M', '3M', '6M', 'ALL'] as const).map((filter) => (
                        <button 
                          key={filter}
                          onClick={() => setTimeFilter(filter)}
                          className={`px-3 py-1.5 rounded-lg transition-all text-[9px] font-black tracking-widest ${
                            timeFilter === filter 
                              ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-[0_0_15px_var(--primary-glow)]" 
                              : "text-[var(--color-text-muted)] hover:text-white"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-64 w-full relative">
                    <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
                    {evolutionHistory.length > 0 ? (
                      <RechartsResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                          data={evolutionHistory.filter(h => {
                            if (timeFilter === 'ALL') return true;
                            const hDate = new Date(h.date);
                            const now = new Date();
                            const diffMonths = (now.getFullYear() - hDate.getFullYear()) * 12 + (now.getMonth() - hDate.getMonth());
                            if (timeFilter === '1M') return diffMonths <= 1;
                            if (timeFilter === '3M') return diffMonths <= 3;
                            if (timeFilter === '6M') return diffMonths <= 6;
                            return true;
                          })}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: 'var(--color-text-muted)', fontWeight: 800 }}
                            tickFormatter={(str) => {
                              try {
                                const date = new Date(str);
                                return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                              } catch { return str; }
                            }}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: 'var(--color-text-muted)', fontWeight: 800 }}
                            domain={[0, 'auto']}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(11, 15, 20, 0.9)', 
                              border: '1px solid var(--primary)',
                              borderRadius: '16px',
                              fontSize: '11px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                              backdropFilter: 'blur(10px)'
                            }}
                            itemStyle={{ color: 'var(--primary)' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="var(--primary)" 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#colorScore)" 
                            animationDuration={1500}
                            animationEasing="ease-in-out"
                            dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4, stroke: 'var(--color-bg)' }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--primary)', className: 'neo-glow-primary' }}
                          />
                        </AreaChart>
                      </RechartsResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-[24px] bg-white/2">
                        <TrendingUp className="w-12 h-12 text-[var(--primary)] mb-4 opacity-20" />
                        <h4 className="text-[14px] font-black text-white uppercase tracking-widest mb-2 font-display italic">Nenhum Registro</h4>
                        <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest max-w-[180px]">
                          Complete seu primeiro scan para mapear sua evolução biotecnológica.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Achievements Section */}
                <section className="mb-10 overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[14px] font-bold text-[var(--color-text)] uppercase tracking-wide">CONQUISTAS</h2>
                    <button className="text-[var(--primary)] text-[11px] font-bold uppercase tracking-widest">Ver Tudo</button>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
                    {badges.map((badge) => (
                      <div key={badge.id} className={`flex-shrink-0 flex flex-col items-center w-24 transition-all ${badge.locked ? 'opacity-40 grayscale' : ''}`}>
                        <div className={`w-16 h-16 rounded-full bg-[var(--color-surface)] flex items-center justify-center border ${badge.locked ? 'border-[var(--outline)]/30' : 'border-[var(--primary)]/30 neo-glow-primary'} mb-3`}>
                          {badge.locked ? (
                             <Lock className="w-8 h-8 text-[var(--outline)]" />
                          ) : (
                             <span className="text-3xl">{badge.icon}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-center font-bold text-[var(--color-text)] leading-tight uppercase tracking-tight">
                          {badge.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Account Actions */}
                <section className="space-y-4 mb-20 px-2">
                  <button 
                    onClick={() => setShowProfileSettings(true)}
                    className="w-full flex items-center justify-between p-5 glass-card rounded-2xl hover:bg-white/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-[var(--outline)]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[var(--color-text)] uppercase tracking-wide">Configurações</p>
                        <p className="text-[11px] text-[var(--outline)]">Privacidade e Perfil</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--outline)]" />
                  </button>

                  <div className="w-full flex items-center justify-between p-5 glass-card rounded-2xl text-left bg-[#006782]/5 relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-[#006782]/20 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[var(--color-text)] uppercase tracking-wide flex items-center gap-2">
                          Meu Shape PRO 
                          <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-[8px] text-[var(--on-primary)] font-black">ATIVO</span>
                        </p>
                        <p className="text-[11px] text-[var(--outline)]">Plano Premium Vitalício</p>
                      </div>
                    </div>
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-[var(--primary)]/10 rounded-full blur-2xl group-hover:scale-150 transition-all"></div>
                  </div>

                  <button className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-all text-left mt-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-red-400" />
                      </div>
                      <p className="text-[13px] font-bold text-red-400 uppercase tracking-wide">Sair da Conta</p>
                    </div>
                  </button>
                </section>
              </motion.div>
            )}
            {activeTab === "coach" && (
              <motion.div
                key="coach"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-3xl mx-auto h-[70vh] md:h-[600px] flex flex-col rounded-3xl bg-black/[0.02] border border-[var(--color-border-subtle)] overflow-hidden"
              >
                <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-black/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Treinador IA Elite</h4>
                      <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" />{" "}
                        Online Agora
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-[var(--color-overlay)] rounded-full transition-all">
                    <Info className="w-5 h-5 text-[var(--color-text)]/20" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                      <div className="space-y-2 opacity-40">
                        <MessageSquare className="w-12 h-12 mx-auto" />
                        <p className="text-sm max-w-xs">
                          Tire dúvidas sobre seu shape, dieta ou protocolos de
                          treino.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-md">
                        {[
                          "Como está minha simetria?",
                          "Sugira um treino de foco em ombros",
                          "Minha dieta está adequada para cutting?",
                          "Como melhorar minha definição abdominal?",
                        ].map((q) => (
                          <button
                            key={q}
                            onClick={() => handleSendMessage(q)}
                            className="p-3 bg-[var(--color-overlay)] border border-[var(--color-border)] rounded-xl text-[10px] font-bold text-[var(--color-text)]/60 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[90%] p-4 rounded-2xl text-sm ${msg.role === "user" ? "bg-blue-600 text-white font-medium" : "bg-[var(--color-overlay)] border border-[var(--color-border)] text-[var(--color-text)]/80"}`}
                      >
                        {msg.role === "user"
                          ? msg.text
                          : renderCoachMessage(msg.text)}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[var(--color-overlay)] border border-[var(--color-border)] p-4 rounded-2xl flex gap-1">
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-black/50 border-t border-[var(--color-border-subtle)]">
                  <div className="relative">
                    <input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Pergunte algo ao Coach..."
                      className="w-full bg-[var(--color-overlay)] border border-[var(--color-border)] rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-blue-600 transition-all"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedExercise && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
              >
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase italic">
                      {selectedExercise}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedExercise(null);
                        setExerciseDetail(null);
                      }}
                      className="p-2 hover:bg-[var(--color-overlay)] rounded-full"
                    >
                      <RefreshCw className="w-5 h-5 rotate-45" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                    {isFetchingExercise ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/40">
                          Consultando Biomecânica...
                        </p>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-emerald max-w-none">
                        <Markdown>{exerciseDetail}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MODO TREINO ATIVO OVERLAY */}
          <AnimatePresence>
            {isWorkoutActive && activeWorkoutSession && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[100] bg-[var(--color-bg-deep)] text-[var(--color-text)] flex flex-col"
              >
                {/* Header */}
                <div className="h-[72px] px-6 flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/50 backdrop-blur-xl">
                  <button 
                    onClick={() => {
                      if (confirm('Deseja realmente sair do treino? Seu progresso atual não será salvo.')) {
                        setIsWorkoutActive(false);
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-[var(--color-overlay)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <h3 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-0.5">Treino Ativo</h3>
                    <p className="text-[14px] font-display font-medium text-[var(--color-text)] uppercase tracking-wider">{activeWorkoutSession.dayName}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[var(--color-neon)]/10 px-3 py-1.5 rounded-xl border border-[var(--color-neon)]/20">
                    <Clock className="w-3.5 h-3.5 text-[var(--color-neon)]" />
                    <span className="text-[12px] font-black text-[var(--color-neon)] font-mono">{formatTime(elapsedTime)}</span>
                  </div>
                </div>

                {/* Progress Bar Top */}
                <div className="px-6 py-4 bg-[var(--color-bg-card)]/30">
                  <div className="flex justify-between text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2">
                    <span>Progresso do Treino</span>
                    <span>{currentExerciseIndex + 1} de {activeWorkoutSession.exercises.length} exercícios</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--color-overlay)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--color-neon)] shadow-[0_0_10px_var(--color-neon)] transition-all duration-500" 
                      style={{ width: `${((currentExerciseIndex + 1) / activeWorkoutSession.exercises.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                  {workoutStatus === 'completed' ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6"
                    >
                      <div className="w-24 h-24 rounded-full bg-[var(--color-neon)]/10 flex items-center justify-center mb-2">
                        <Trophy className="w-12 h-12 text-[var(--color-neon)]" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-[28px] font-display font-bold text-[var(--color-text)] uppercase tracking-tight">TREINO FINALIZADO!</h2>
                        <p className="text-[var(--color-text-muted)] text-[14px] max-w-xs">Parabéns! Mais um degrau subido na sua evolução física. O shape está vindo.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        <div className="bg-[var(--color-overlay)] rounded-2xl p-4 border border-[var(--color-border-subtle)]">
                          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Tempo Total</p>
                          <p className="text-[18px] font-black text-[var(--color-text)]">{formatTime(elapsedTime)}</p>
                        </div>
                        <div className="bg-[var(--color-overlay)] rounded-2xl p-4 border border-[var(--color-border-subtle)]">
                          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Exercícios</p>
                          <p className="text-[18px] font-black text-[var(--color-text)]">{activeWorkoutSession.exercises.length}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsWorkoutActive(false)}
                        className="w-full max-w-sm py-4 bg-[var(--color-neon)] text-[#ffffff] font-black uppercase tracking-widest rounded-2xl shadow-[0_0_25px_rgba(0,255,136,0.4)]"
                      >
                        Salvar e Sair
                      </button>
                    </motion.div>
                  ) : (
                    <div className="p-6 space-y-8">
                      {/* Exercise Header */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black bg-[var(--primary)]/20 text-[var(--primary)] px-2 py-0.5 rounded-md uppercase tracking-widest border border-[var(--primary)]/20">
                                    {activeWorkoutSession.exercises[currentExerciseIndex].musculo_foco || 'Base'}
                                </span>
                                <div className="flex items-center gap-1.5 text-[8px] font-black text-[var(--secondary)] uppercase tracking-widest bg-[var(--secondary)]/10 px-2 py-0.5 rounded border border-[var(--secondary)]/20">
                                    <Zap className="w-3 h-3" />
                                    <span>Fibra Tipo II (Explosiva)</span>
                                </div>
                            </div>
                            {activeWorkoutSession.isAdapted && (
                                <div className="flex items-center gap-1 text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                                    <ShieldAlert className="w-3 h-3" />
                                    <span>Protocolo Adaptado</span>
                                </div>
                            )}
                        </div>
                        <h2 className="text-[36px] font-display font-black leading-none text-[var(--color-text)] uppercase italic tracking-tighter">{activeWorkoutSession.exercises[currentExerciseIndex].nome}</h2>
                        <div className="p-4 bg-[var(--color-surface-hover)] rounded-2xl border border-[var(--color-border-subtle)] border-l-4 border-l-[var(--primary)]">
                           <p className="text-[11px] text-[var(--color-text-muted)] italic leading-relaxed font-medium">
                              {activeWorkoutSession.exercises[currentExerciseIndex].why || 'Mantenha a cadência controlada na fase excêntrica para máximo recrutamento de fibras.'}
                           </p>
                        </div>
                      </div>

                      {/* Animation Placeholder */}
                      <div className="aspect-video w-full bg-black rounded-[32px] border border-[var(--color-border-subtle)] flex items-center justify-center relative overflow-hidden group shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-deep)] to-transparent opacity-60"></div>
                        <Dumbbell className="w-16 h-16 text-[var(--primary)] opacity-40 animate-bounce" />
                        <div className="absolute inset-x-0 bottom-0 p-6 flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest">Atenção Técnica</span>
                                <span className="text-[12px] font-bold text-white uppercase italic">Pico de Contração de 2s</span>
                            </div>
                           <button 
                             onClick={() => handleShowExerciseDetail(activeWorkoutSession.exercises[currentExerciseIndex].nome)}
                             className="text-[10px] font-black text-white uppercase tracking-widest bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
                           >
                             <Info className="w-4 h-4" />
                             Bio-Guide
                           </button>
                        </div>
                      </div>

                      {/* Series Tracking */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <h4 className="text-[12px] font-black text-[var(--color-text-muted)] uppercase tracking-widest italic">Séries Concluídas</h4>
                            <span className="text-[18px] font-display font-black text-[var(--color-text)] uppercase">{currentSetIndex + 1} <span className="text-[12px] text-[var(--color-text-muted)]">/ {activeWorkoutSession.exercises[currentExerciseIndex].series}</span></span>
                          </div>
                          <div className="flex flex-col items-end">
                            <h4 className="text-[12px] font-black text-[var(--color-text-muted)] uppercase tracking-widest italic">Peso Total (Est.)</h4>
                            <span className="text-[18px] font-display font-black text-[var(--primary)] uppercase">{((parseInt(activeWorkoutSession.exercises[currentExerciseIndex].series) || 3) * (60)).toFixed(0)} <span className="text-[12px] text-[var(--color-text-muted)]">KG</span></span>
                          </div>
                        </div>

                        {/* Set Indicators */}
                        <div className="flex gap-2">
                          {Array.from({ length: parseInt(activeWorkoutSession.exercises[currentExerciseIndex].series) || 3 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`h-2.5 flex-1 rounded-full transition-all duration-700 ${i < currentSetIndex ? 'bg-[var(--primary)] shadow-[0_0_15px_var(--primary-glow)]' : i === currentSetIndex ? 'bg-white/10 animate-pulse border border-[var(--primary)]/30' : 'bg-white/5'}`}
                            ></div>
                          ))}
                        </div>

                        {/* Rep Counter */}
                        <div className="bg-[var(--color-surface-hover)] rounded-[32px] p-8 border border-[var(--color-border-subtle)] flex items-center justify-between shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"></div>
                           <div className="text-center flex-1">
                             <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.3em] mb-2 italic">Meta de Reps</p>
                             <p className="text-[42px] font-display font-black text-[var(--color-text)] italic tracking-tighter leading-none">{activeWorkoutSession.exercises[currentExerciseIndex].repeticoes}</p>
                           </div>
                           <div className="w-[1px] h-16 bg-[var(--color-border-subtle)] mx-4"></div>
                           <div className="text-center flex-1">
                             <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.3em] mb-2 italic">Carga Target</p>
                             <div className="flex flex-col items-center">
                                <div className="flex items-baseline gap-1">
                                    <input 
                                        type="number"
                                        placeholder="0"
                                        className="w-16 bg-transparent text-[32px] font-black text-[var(--primary)] text-center outline-none border-b-2 border-transparent focus:border-[var(--primary)] transition-all"
                                    />
                                    <span className="text-[12px] font-black text-[var(--color-text-muted)] uppercase">KG</span>
                                </div>
                             </div>
                           </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {workoutStatus === 'resting' ? (
                        <div className="bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] rounded-[32px] p-8 text-center space-y-6 relative overflow-hidden shadow-2xl">
                          <div className="absolute top-0 right-0 p-4">
                             <Zap className={`w-6 h-6 ${isAdvancedMode ? 'text-[var(--primary)]' : 'text-[var(--outline)]'}`} />
                          </div>
                          <div className="relative z-10">
                            <p className="text-[12px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-4 italic">Monitor de Recuperação</p>
                            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                              <svg className="w-full h-full -rotate-90">
                                <circle 
                                  cx="96" cy="96" r="90" 
                                  stroke="currentColor" 
                                  strokeWidth="4" 
                                  fill="transparent" 
                                  className="text-[var(--color-border-subtle)]"
                                />
                                <motion.circle 
                                  cx="96" cy="96" r="90" 
                                  stroke="currentColor" 
                                  strokeWidth="8" 
                                  fill="transparent" 
                                  className="text-[var(--primary)]"
                                  strokeDasharray="565"
                                  strokeLinecap="round"
                                  initial={{ strokeDashoffset: 565 }}
                                  animate={{ strokeDashoffset: 565 - (565 * (restTimeLeft / 60)) }}
                                  transition={{ duration: 1, ease: 'linear' }}
                                />
                              </svg>
                              <div className="absolute flex flex-col items-center">
                                <span className="text-[48px] font-display font-black text-[var(--color-text)] tracking-tighter leading-none">{restTimeLeft}</span>
                                <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest mt-1">segundos</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-3 relative z-10">
                            <button 
                              onClick={() => {
                                setWorkoutStatus('exercising');
                                setRestTimeLeft(0);
                              }}
                              className="w-full py-5 bg-[var(--primary)] text-white font-black uppercase tracking-[0.2em] rounded-[20px] shadow-[0_10px_20px_var(--primary-glow)] active:scale-95 transition-all text-sm"
                            >
                              Voltar à Série
                            </button>
                            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">
                               {isAdvancedMode ? "MODO ELITE: Tempo sugerido, controle manual." : "Aguarde o fim do descanso ou pule."}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            const totalSets = parseInt(activeWorkoutSession.exercises[currentExerciseIndex].series) || 3;
                            if (currentSetIndex + 1 < totalSets) {
                              setCurrentSetIndex(prev => prev + 1);
                              if (isAdvancedMode) {
                                  setWorkoutStatus('exercising');
                                  if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                              } else {
                                  setWorkoutStatus('resting');
                                  setRestTimeLeft(60);
                                  if (navigator.vibrate) navigator.vibrate(100);
                              }
                            } else {
                              // Next exercise
                              if (currentExerciseIndex + 1 < activeWorkoutSession.exercises.length) {
                                setCurrentExerciseIndex(prev => prev + 1);
                                setCurrentSetIndex(0);
                                setWorkoutStatus('resting');
                                setRestTimeLeft(60);
                                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                              } else {
                                finishWorkoutSession();
                              }
                            }
                          }}
                          className="w-full h-[80px] bg-[var(--color-neon)] text-[#ffffff] font-black text-[16px] uppercase tracking-[0.2em] rounded-[24px] shadow-[0_10px_30px_rgba(37,99,235,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                          <Check className="w-6 h-6 stroke-[4px]" /> Concluir Série
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                {workoutStatus !== 'completed' && (
                  <div className="p-6 bg-[var(--color-bg-card)]/50 backdrop-blur-xl border-t border-[var(--color-border-subtle)] flex gap-4">
                    <button 
                      disabled={currentExerciseIndex === 0}
                      onClick={() => {
                        setCurrentExerciseIndex(prev => prev - 1);
                        setCurrentSetIndex(0);
                        setWorkoutStatus('exercising');
                      }}
                      className="flex-1 py-4 bg-[var(--color-overlay)] text-[var(--color-text-muted)] disabled:opacity-30 font-bold uppercase tracking-widest rounded-2xl border border-[var(--color-border-subtle)]"
                    >
                      Anterior
                    </button>
                    <button 
                      onClick={() => {
                        if (currentExerciseIndex + 1 < activeWorkoutSession.exercises.length) {
                          setCurrentExerciseIndex(prev => prev + 1);
                          setCurrentSetIndex(0);
                          setWorkoutStatus('exercising');
                        } else {
                          finishWorkoutSession();
                        }
                      }}
                      className="flex-1 py-4 bg-[var(--color-border)] text-[var(--color-text)] font-bold uppercase tracking-widest rounded-2xl border border-[var(--color-border)]"
                    >
                      {currentExerciseIndex + 1 === activeWorkoutSession.exercises.length ? 'Finalizar' : 'Próximo'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-6 left-6 right-6 z-[90] glass-card rounded-[32px] p-2 flex items-center justify-between border-white/5 neo-glow-primary">
          {(["dashboard", "analyze", "recovery", "training", "diet", "profile"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 transition-all relative ${
                  activeTab === tab
                    ? "text-[var(--primary)]"
                    : "text-[var(--color-text-muted)] opacity-50 hover:opacity-100"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute inset-0 bg-[var(--primary)]/5 rounded-2xl blur-md"
                  />
                )}
                {tab === "dashboard" && <Target size={22} className={activeTab === tab ? "neo-glow-text" : ""} />}
                {tab === "analyze" && <Camera size={22} className={activeTab === tab ? "neo-glow-text" : ""} />}
                {tab === "recovery" && <Activity size={22} className={activeTab === tab ? "neo-glow-text" : ""} />}
                {tab === "training" && <Dumbbell size={22} className={activeTab === tab ? "neo-glow-text" : ""} />}
                {tab === "diet" && <Utensils size={22} className={activeTab === tab ? "neo-glow-text" : ""} />}
                {tab === "profile" && <User size={22} className={activeTab === tab ? "neo-glow-text" : ""} />}
                
                <span className="text-[8px] font-black uppercase tracking-[0.1em]">
                  {tab === "dashboard" ? "Hub" : 
                   tab === "analyze" ? "Scan" : 
                   tab === "recovery" ? "Bio" :
                   tab === "training" ? "Gym" :
                   tab === "diet" ? "Dieta" : "Perfil"}
                </span>
                
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="w-1 h-1 bg-[var(--primary)] rounded-full mb-[-8px] shadow-[0_0_8px_var(--primary-glow)]"
                  />
                )}
              </button>
            ),
          )}
        </nav>

        {/* Profile Settings Modal */}
        <AnimatePresence>
          {showProfileSettings && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowProfileSettings(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[32px] overflow-hidden"
              >
                <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                  <h3 className="text-sm font-black text-[var(--color-text)] uppercase tracking-widest">Configurações do Perfil</h3>
                  <button onClick={() => setShowProfileSettings(false)} className="p-2 hover:bg-[var(--color-overlay)] rounded-full"><X className="w-5 h-5 text-[var(--color-text-muted)]" /></button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                  {/* Form fields */}
                  <div className="space-y-4">
                     <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <input
                              type="file"
                              ref={settingsAvatarInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleAvatarChange(e, false)}
                            />
                            <button 
                              onClick={() => settingsAvatarInputRef.current?.click()}
                              className="w-24 h-24 rounded-full bg-[var(--color-surface)] border-2 border-[var(--primary)]/30 flex items-center justify-center overflow-hidden neo-glow-primary relative"
                            >
                               {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-[var(--outline)]" />}
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera className="w-6 h-6 text-white" />
                               </div>
                            </button>
                            <div className="absolute bottom-0 right-0 p-2 bg-[var(--primary)] rounded-full text-white shadow-lg pointer-events-none">
                               <Camera className="w-4 h-4" />
                            </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Nome Completo</label>
                           <input 
                            type="text" value={profile.name || user?.user_metadata?.full_name || ''} 
                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                            className="w-full bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] rounded-2xl px-4 py-3 text-sm text-[var(--color-text)] focus:border-[#2563eb]/50 transition-all outline-none"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Idade</label>
                           <input 
                            type="number" value={profile.age || ''} onChange={(e) => setProfile({...profile, age: Number(e.target.value)})}
                            className="w-full bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] rounded-2xl px-4 py-3 text-sm text-[var(--color-text)] focus:border-[#2563eb]/50 transition-all outline-none"
                           />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Peso (kg)</label>
                           <input 
                            type="number" value={profile.weight} onChange={(e) => setProfile({...profile, weight: Number(e.target.value)})}
                            className="w-full bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] rounded-2xl px-4 py-3 text-sm text-[var(--color-text)] focus:border-[#2563eb]/50 transition-all outline-none"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Altura (cm)</label>
                           <input 
                            type="number" value={profile.height} onChange={(e) => setProfile({...profile, height: Number(e.target.value)})}
                            className="w-full bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] rounded-2xl px-4 py-3 text-sm text-[var(--color-text)] focus:border-[#2563eb]/50 transition-all outline-none"
                           />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Objetivo Principal</label>
                        <select 
                          value={profile.goal} onChange={(e) => setProfile({...profile, goal: e.target.value as any})}
                          className="w-full bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] rounded-2xl px-4 py-3 text-sm text-[var(--color-text)] focus:border-[#2563eb]/50 transition-all outline-none appearance-none"
                        >
                           <option value="Cutting">Cutting</option>
                           <option value="Bulking">Bulking</option>
                           <option value="Recomposição">Recomposição</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-6 pt-4 border-t border-[var(--color-border-subtle)]">
                      <h4 className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest italic">Biometria & Preferências</h4>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between p-4 bg-[var(--color-surface-hover)] rounded-2xl border border-[var(--color-border-subtle)]">
                            <div className="flex flex-col">
                               <span className="text-sm font-black text-[var(--color-text)] uppercase italic">Modo Elite</span>
                               <span className="text-[9px] text-[var(--color-text-muted)] font-bold uppercase">Sem timer de descanso</span>
                            </div>
                            <button 
                                onClick={() => {
                                    const next = !isAdvancedMode;
                                    setIsAdvancedMode(next);
                                    localStorage.setItem('advanced_mode', String(next));
                                }}
                                className={`w-12 h-6 rounded-full transition-all relative ${isAdvancedMode ? 'bg-[var(--primary)]' : 'bg-[var(--outline)]'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${isAdvancedMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                         </div>

                         <div className="flex items-center justify-between p-4 bg-[var(--color-surface-hover)] rounded-2xl border border-[var(--color-border-subtle)]">
                            <div className="flex flex-col">
                               <span className="text-sm font-black text-[var(--color-text)] uppercase italic">Tema da Lab</span>
                               <span className="text-[9px] text-[var(--color-text-muted)] font-bold uppercase">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                            </div>
                            <button 
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className={`w-12 h-6 rounded-full transition-all relative ${isDarkMode ? 'bg-[var(--secondary)]' : 'bg-[var(--primary)]'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                         </div>

                         <div className="space-y-1.5 pt-2">
                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Foco de Engenharia</label>
                            <select 
                                value={focoMuscular} 
                                onChange={(e) => {
                                    setFocoMuscular(e.target.value);
                                    localStorage.setItem('foco_muscular', e.target.value);
                                }}
                                className="w-full bg-[var(--color-overlay)] border border-[var(--color-border-subtle)] rounded-2xl px-4 py-3 text-sm text-[var(--color-text)] focus:border-[var(--primary)]/50 transition-all outline-none uppercase font-bold"
                            >
                                <option value="Equilibrado">Equilibrado (V-Taper)</option>
                                <option value="Peitoral">Foco: Peitoral</option>
                                <option value="Costas">Foco: Dorsais</option>
                                <option value="Pernas">Foco: Pernas</option>
                            </select>
                         </div>
                      </div>
                   </div>

                  <div className="grid grid-cols-2 gap-3 pt-6">
                    <button 
                      onClick={() => {
                        const blob = new Blob([localStorage.getItem("shape_analyzer_data") || '{}'], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'meu-progresso-shapeia.json';
                        a.click();
                      }}
                      className="py-4 bg-[var(--color-overlay)] border border-[var(--color-border)] text-[var(--color-text)] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[var(--color-border)] transition-all"
                    >
                      Exportar Dados
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm('Tem certeza que deseja limpar tudo? Esta ação é irreversível.')) {
                          if(confirm('CONFIRMAÇÃO FINAL: Apagar todos os dados permanentemente?')) {
                            localStorage.clear();
                            window.location.reload();
                          }
                        }
                      }}
                      className="py-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-500/20 transition-all"
                    >
                      Limpar Dados
                    </button>
                  </div>
                </div>
                <div className="p-6 bg-[var(--color-overlay)]">
                   <button 
                    onClick={handleSaveProfile}
                    className="w-full py-4 bg-[#2563eb] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-[#2563eb]/20 active:scale-95 transition-all"
                   >
                    Salvar Perfil
                   </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* New Check-in Modal */}
        <AnimatePresence>
          {showCheckInModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowCheckInModal(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="relative w-full max-w-lg bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[40px] overflow-hidden"
              >
                <div className="p-8 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                  <h3 className="text-lg font-black text-[var(--color-text)] italic uppercase tracking-widest">Novo Check-in Mensal</h3>
                  <button onClick={() => setShowCheckInModal(false)} className="p-2 hover:bg-[var(--color-overlay)] rounded-full"><X className="w-6 h-6 text-[var(--color-text-muted)]" /></button>
                </div>
                <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto no-scrollbar">
                   {/* Photo Upload Area */}
                   <div className="grid grid-cols-3 gap-3">
                      {(['front', 'back', 'side'] as const).map(side => (
                        <div key={side} onClick={() => alert(`Câmera nativa: Tirar foto de ${side === 'front' ? 'frente' : side === 'back' ? 'costas' : 'lado'}`)} className="aspect-[3/4] bg-[var(--color-overlay)] border border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-[#2563eb]/50 cursor-pointer transition-all">
                           <Camera className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-[#2563eb]" />
                           <span className="text-[8px] font-black uppercase text-[var(--color-text-muted)]">{side === 'front' ? 'Frente' : side === 'back' ? 'Costas' : 'Lado'}</span>
                        </div>
                      ))}
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Peso Atual (kg)</label>
                         <input 
                          type="number" value={checkInWeight || ''} onChange={(e) => setCheckInWeight(Number(e.target.value))}
                          placeholder="00.0"
                          className="w-full bg-[var(--color-overlay)] border border-[var(--color-border)] rounded-2xl p-4 text-[var(--color-text)] font-black text-lg focus:border-[#2563eb] transition-all outline-none"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">BF% Manual (Opcional)</label>
                         <input 
                          type="number" value={checkInBf} onChange={(e) => setCheckInBf(e.target.value ? Number(e.target.value) : "")}
                          placeholder="--"
                          className="w-full bg-[var(--color-overlay)] border border-[var(--color-border)] rounded-2xl p-4 text-[var(--color-text)] font-black text-lg focus:border-[#ffb800] transition-all outline-none"
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Anotações Livres</label>
                      <textarea 
                        value={checkInNotes} onChange={(e) => setCheckInNotes(e.target.value)}
                        placeholder="Como você se sente? Notas sobre força, sono, dieta..."
                        className="w-full bg-[var(--color-overlay)] border border-[var(--color-border)] rounded-2xl p-4 text-sm text-[var(--color-text)]/80 h-32 focus:border-[#2563eb] transition-all outline-none resize-none"
                      />
                   </div>
                </div>
                <div className="p-8 bg-[var(--color-overlay)]">
                   <button 
                    onClick={handleSaveCheckIn}
                    className="w-full py-5 bg-[#2563eb] text-white font-black text-sm uppercase tracking-[0.3em] rounded-3xl shadow-xl shadow-[#2563eb]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                   >
                    Salvar Check-in
                   </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
