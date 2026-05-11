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
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "./lib/supabase";
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
} from "./types";
import Markdown from "react-markdown";
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
  Cell
} from "recharts";
import confetti from "canvas-confetti";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "analyze" | "diet" | "training" | "coach" | "evolution" | "dashboard"
  >("dashboard");
  const [isCompetitionMode, setIsCompetitionMode] = useState(false);
  const [isPumpMode, setIsPumpMode] = useState(false);
  const [images, setImages] = useState<{
    front?: string;
    back?: string;
    side?: string;
  }>({});
  const [profile, setProfile] = useState<UserProfile>({
    weight: 80,
    height: 180,
    goal: "Recomposição",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  const saveData = () => {
    const data = {
      profile,
      analysisCount,
      waterIntake,
      evolutionHistory,
      personalizedTraining,
      mealPlan,
      isPremium,
      subscriptionExpiryDate,
      lastDietGenerationDate,
      lastTrainingGenerationDate,
      completedWorkouts,
    };
    localStorage.setItem("shape_analyzer_data", JSON.stringify(data));
    alert("Dados salvos com sucesso!");
  };

  const loadData = () => {
    const saved = localStorage.getItem("shape_analyzer_data");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setProfile(data.profile || profile);
        setAnalysisCount(data.analysisCount || analysisCount);
        setWaterIntake(data.waterIntake || waterIntake);
        setEvolutionHistory(data.evolutionHistory || evolutionHistory);
        setPersonalizedTraining(
          data.personalizedTraining || personalizedTraining,
        );
        setMealPlan(data.mealPlan || mealPlan);
        setIsPremium(data.isPremium || isPremium);
        setSubscriptionExpiryDate(
          data.subscriptionExpiryDate || subscriptionExpiryDate,
        );
        setLastDietGenerationDate(
          data.lastDietGenerationDate || lastDietGenerationDate,
        );
        setLastTrainingGenerationDate(
          data.lastTrainingGenerationDate || lastTrainingGenerationDate,
        );
        setCompletedWorkouts(data.completedWorkouts || completedWorkouts);
        alert("Dados carregados com sucesso!");
      } catch (e) {
        console.error("Failed to parse shape_analyzer_data:", e);
        alert("Erro ao carregar dados salvos. O arquivo pode estar corrompido.");
      }
    } else {
      alert("Nenhum dado salvo encontrado.");
    }
  };

  const [result, setResult] = useState<ShapeAnalysis | null>(null);
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
  const [evolutionHistory, setEvolutionHistory] = useState<EvolutionEntry[]>([
    {
      date: "Out",
      score: 58,
      bf: 22,
      weight: 90,
      volume: 50,
      definition: 40,
      symmetry: 60,
      consistency: 70,
      photo:
        "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80",
    },
    {
      date: "Nov",
      score: 60,
      bf: 21,
      weight: 88,
      volume: 52,
      definition: 45,
      symmetry: 62,
      consistency: 75,
      photo:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80",
    },
    {
      date: "Dez",
      score: 62,
      bf: 20,
      weight: 87,
      volume: 55,
      definition: 50,
      symmetry: 65,
      consistency: 78,
      photo:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
    },
    {
      date: "Jan",
      score: 65,
      bf: 18,
      weight: 85,
      volume: 60,
      definition: 55,
      symmetry: 70,
      consistency: 80,
      photo:
        "https://images.unsplash.com/photo-1594882645126-14020914d58d?w=400&q=80",
    },
    {
      date: "Fev",
      score: 68,
      bf: 17,
      weight: 84,
      volume: 62,
      definition: 58,
      symmetry: 72,
      consistency: 85,
      photo:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
    },
    {
      date: "Mar",
      score: 72,
      bf: 16,
      weight: 82,
      volume: 65,
      definition: 65,
      symmetry: 75,
      consistency: 90,
      photo:
        "https://images.unsplash.com/photo-1517838276537-222297432acc?w=400&q=80",
    },
  ]);

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
    experienceLevel: 'INTERMEDIÁRIO'
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
    manualDay: 'Segunda'
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
  const [userData, setUserData] = useState({
    name: "WILLIAN MORENO",
    avatar: "https://i.pravatar.cc/150?u=willianmorenogm2112@gmail.com"
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Workour Flow State
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [activeWorkoutSession, setActiveWorkoutSession] = useState<{
    dayName: string;
    exercises: any[];
    startTime: number;
    completedAt?: number;
    logs: { exerciseIndex: number, setIndex: number, reps: number, weight?: number }[];
  } | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [workoutStatus, setWorkoutStatus] = useState<'exercising' | 'resting' | 'completed'>('exercising');
  const [restTimeLeft, setRestTimeLeft] = useState(60);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [trainingLoadingMessage, setTrainingLoadingMessage] = useState('Montando sua divisão de treino...');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
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

        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: authName,
              display_name: authName.split(' ')[0]
            }
          }
        });
        if (error) throw error;
        alert("Verifique seu e-mail para confirmar o cadastro!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
    setActiveWorkoutSession({
      dayName: day.nome_dia || day.musculo_foco,
      exercises: day.exercicios,
      startTime: Date.now(),
      logs: []
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
      colors: ['#00ff88', '#ffffff', '#00cc6a']
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
              className="w-full py-3 bg-[#00ff88]/10 border border-emerald-500/30 text-emerald-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2 my-4"
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
              className="w-full py-3 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 hover:text-black transition-all flex items-center justify-center gap-2 my-4"
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
              className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3 my-6"
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
        { weight: profile.weight, goal: profile.goal },
        isPumpMode,
      );
      setResult(data);
      setAnalysisCount((prev) => prev + 1);

      // Update evolution history
      const today = new Date().toLocaleDateString("pt-BR", { month: "short" });
      setEvolutionHistory((prev) => [
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
      ]);
    } catch (err) {
      console.error(err);
      setError(
        "Erro ao analisar o shape. Verifique sua conexão ou chave de API.",
      );
    } finally {
      clearInterval(messageInterval);
      setIsAnalyzing(false);
      setIsScanning(false);
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
            className="bg-[#111112] border-2 border-emerald-500/50 rounded-3xl p-6 md:p-8 max-w-md w-full relative overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.2)]"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[100px]" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/10 blur-[100px]" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    Padrão <span className="text-[#00cc6a] italic">Ouro</span>
                  </h2>
                  <p className="text-[#6b7280] text-sm">
                    Desbloqueie o potencial máximo do seu shape.
                  </p>
                </div>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="close-button p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-zinc-500" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  {
                    icon: <Zap className="w-5 h-5 text-emerald-400" />,
                    title: "Análises Ilimitadas",
                    desc: "Sem limites de 3 fotos por mês.",
                  },
                  {
                    icon: <Target className="w-5 h-5 text-orange-400" />,
                    title: "Coach IA Elite",
                    desc: "Respostas instantâneas e profundas.",
                  },
                  {
                    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
                    title: "Projeção de Futuro",
                    desc: "Veja seu shape com 5% de BF.",
                  },
                  {
                    icon: <Shield className="w-5 h-5 text-orange-400" />,
                    title: "Biomecânica Avançada",
                    desc: "Análise de vídeo dos seus treinos.",
                  },
                  {
                    icon: <Box className="w-5 h-5 text-emerald-400" />,
                    title: "Rota Ativa",
                    desc: "Ajustes diários na sua dieta e treino.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/40 transition-all group"
                  >
                    <div className="mt-1 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">
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
                  className="p-4 rounded-2xl bg-white/5 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all text-left group"
                >
                  <span className="text-zinc-400 text-xs block mb-1">
                    Mensal
                  </span>
                  <span className="text-white font-bold text-lg block">
                    R$ 29,90
                  </span>
                  <span className="text-emerald-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                    Selecionar →
                  </span>
                </button>
                <button
                  onClick={() => {
                    setIsPremium(true);
                    setSubscriptionExpiryDate(null); // Lifetime
                    setShowPremiumModal(false);
                  }}
                  className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500 text-left relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 bg-emerald-500 text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">
                    VITALÍCIO
                  </div>
                  <span className="text-zinc-400 text-xs block mb-1">
                    Pagamento Único
                  </span>
                  <span className="text-white font-bold text-lg block">
                    R$ 197,00
                  </span>
                  <span className="text-emerald-400 text-[10px]">
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
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95"
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
            className="bg-[#111112] border border-emerald-500/30 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <Box className="w-6 h-6 text-emerald-500" /> Lista de Compras
                Inteligente
              </h2>
              <button
                onClick={() => setShowShoppingListModal(false)}
                className="close-button p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {shoppingList.categories.map((cat: any, i: number) => (
                <div key={i} className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg inline-block">
                    {cat.name}
                  </h3>
                  <div className="space-y-2">
                    {cat.items.map((item: any, j: number) => (
                      <div
                        key={j}
                        className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5"
                      >
                        <span className="text-sm text-white/80">
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-emerald-500">
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
            className="bg-[#111112] border border-orange-500/30 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-orange-500" /> Dia de Rota
                (Sugestões)
              </h2>
              <button
                onClick={() => setShowRouteDayModal(false)}
                className="close-button p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-4">
              {routeDayPlan.suggestions.map((s: any, i: number) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                      {s.meal}
                    </span>
                    <span className="text-xs font-bold text-white/40">
                      {s.place}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white">{s.choice}</h4>
                  <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
                    <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-white/60 italic">{s.tip}</p>
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
            className="bg-[#111112] border border-emerald-500/30 rounded-3xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <Zap className="w-6 h-6 text-emerald-500" /> Análise de Prato
              </h2>
              <button
                onClick={() => setFoodAnalysis(null)}
                className="close-button p-2 hover:bg-white/5 rounded-full transition-colors"
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
                    color: "text-emerald-500",
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
                    className="p-3 rounded-xl bg-white/5 border border-white/5 text-center"
                  >
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">
                      {m.label}
                    </p>
                    <p className={`text-sm font-black ${m.color}`}>{m.val}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Itens Identificados
                </h4>
                {foodAnalysis.items.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <span className="text-sm text-white/80">
                      {item.name} ({item.estimatedWeight}g)
                    </span>
                    <span className="text-xs font-bold text-emerald-500">
                      {item.calories} kcal
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setFoodAnalysis(null)}
                className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all"
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
            className="bg-[#111112] border border-blue-500/30 rounded-3xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <Video className="w-6 h-6 text-blue-500" /> Biomecânica IA
              </h2>
              <button
                onClick={() => setExerciseAnalysis(null)}
                className="close-button p-2 hover:bg-white/5 rounded-full transition-colors"
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
                      className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-xs text-white/80"
                    >
                      • {error}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Correções Necessárias
                </h4>
                <div className="space-y-2">
                  {exerciseAnalysis.corrections.map(
                    (correction: string, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-white/80"
                      >
                        • {correction}
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 italic text-xs text-white/60 leading-relaxed">
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
      <div className="min-h-screen bg-[#030508] flex items-center justify-center text-[#f0f0f0]">
        <RefreshCw className="w-8 h-8 text-[#00ff88] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030508] flex justify-center text-[#f0f0f0] font-sans selection:bg-[#00ff88]/30">
        <div className="w-full max-w-[390px] bg-[#080c10] min-h-screen relative flex flex-col items-center justify-center p-6">
          <div className="w-full space-y-8 animate-fade-in-up">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-[24px] bg-[#00ff88]/10 flex items-center justify-center border border-[#00ff88]/20 shadow-[0_0_30px_rgba(0,255,136,0.1)]">
                  <Zap className="w-8 h-8 text-[#00ff88] fill-current" />
                </div>
              </div>
              <h1 className="text-[28px] font-display font-bold text-white uppercase tracking-tight">
                {isRegistering ? "Criar Conta" : "Bem-vindo"}
              </h1>
              <p className="text-[#6b7280] text-[14px]">
                {isRegistering 
                  ? "Comece sua jornada para o shape inexplicável." 
                  : "Entre para continuar evoluindo seu físico."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <AnimatePresence mode="wait">
                {isRegistering && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-widest ml-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280]" />
                      <input 
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-white focus:border-[#00ff88]/30 focus:bg-white/10 outline-none transition-all placeholder:text-[#3a3a3a]"
                        placeholder="Ex: João Silva"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280]" />
                  <input 
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-white focus:border-[#00ff88]/30 focus:bg-white/10 outline-none transition-all placeholder:text-[#3a3a3a]"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-widest ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280]" />
                  <input 
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-white focus:border-[#00ff88]/30 focus:bg-white/10 outline-none transition-all placeholder:text-[#3a3a3a]"
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
                    <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-widest ml-1">Confirmar Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280]" />
                      <input 
                        type="password"
                        required
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-white focus:border-[#00ff88]/30 focus:bg-white/10 outline-none transition-all placeholder:text-[#3a3a3a]"
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
                className="w-full h-14 bg-[#00ff88] text-[#050505] font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(0,255,136,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
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

            <div className="text-center">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-[12px] font-bold text-[#6b7280] hover:text-[#00ff88] transition-colors"
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
    <div className="min-h-screen bg-[#030508] flex justify-center text-[#f0f0f0] font-sans selection:bg-[#00ff88]/30">
      <div className="w-full max-w-[390px] bg-[#080c10] min-h-screen relative flex flex-col shadow-2xl overflow-hidden">
        <PremiumModal />
        <ShoppingListModal />
        <RouteDayModal />
        <FoodAnalysisModal />
        <ExerciseAnalysisModal />

        {/* Header */}
        <header className="border-b border-[#00ff88]/10 bg-[#080c10]/90 backdrop-blur-[20px] sticky top-0 z-50">
          <div className="px-4 h-[64px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#00ff88] fill-current drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]" />
              <span className="font-display font-normal text-[22px] tracking-wide text-[#f0f0f0] mt-1">
                MEU SHAPE
              </span>
            </div>
            {user && (
              <button 
                onClick={handleLogout}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#6b7280] hover:bg-white/10 hover:text-white transition-all"
                title="Sair"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111827] border border-white/5 rounded-full">
                <Flame className="w-3.5 h-3.5 text-[#ffb800]" />
                <span className="text-[10px] font-bold text-[#ffb800]">
                  12<span className="text-[#6b7280]">d</span>
                </span>
              </div>
              <button
                onClick={saveData}
                className="w-8 h-8 rounded-full bg-[#111827] border border-white/5 flex items-center justify-center text-[12px] font-bold text-[#f0f0f0] active:scale-95 transition-transform"
              >
                WM
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pt-4 pb-[80px] overflow-x-hidden overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-6 pb-12 px-6"
              >
                {/* Header Section */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex-1">
                    <h1 className="text-[10px] font-bold text-[var(--color-neon)] uppercase tracking-[0.2em] opacity-80">Bem-vindo de volta!</h1>
                    {isEditingProfile ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          value={userData.name} 
                          onChange={(e) => setUserData({ ...userData, name: e.target.value.toUpperCase() })}
                          className="text-[24px] font-display text-[#f0f0f0] font-bold tracking-tight bg-transparent border-b border-[var(--color-neon)] outline-none w-full max-w-[200px]"
                          onBlur={() => setIsEditingProfile(false)}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <h2 
                        onClick={() => setIsEditingProfile(true)}
                        className="text-[24px] font-display text-[#f0f0f0] font-bold tracking-tight cursor-pointer hover:text-[var(--color-neon)] transition-colors"
                      >
                        {userData.name}
                      </h2>
                    )}
                  </div>
                  <div className="relative group">
                    <input
                      type="file"
                      id="avatarInput"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setUserData({ ...userData, avatar: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div 
                      className="w-12 h-12 rounded-full bg-[#111827] border-2 border-[var(--color-neon)] overflow-hidden shadow-[0_0_15px_rgba(0,255,136,0.2)] cursor-pointer"
                      onClick={() => document.getElementById('avatarInput')?.click()}
                    >
                      <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regeneração Muscular - More Compact */}
                <div className="bg-[var(--color-bg-card)] border border-white/5 rounded-[28px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[14px] uppercase font-bold text-[#6b7280] tracking-widest flex items-center gap-2">
                          <Droplets className="w-3.5 h-3.5 text-[var(--color-neon)]"/>
                          Regeneração
                        </h2>
                        <span className="text-[10px] font-bold text-[var(--color-neon)] bg-[var(--color-neon)]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Status: Bom</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {[
                            { muscle: 'Peito', recovery: 80 },
                            { muscle: 'Costas', recovery: 20 },
                            { muscle: 'Pernas', recovery: 50 },
                            { muscle: 'Braços', recovery: 100 },
                        ].map((item) => (
                            <div key={item.muscle} className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">
                                    <span>{item.muscle}</span>
                                    <span className="text-white">{item.recovery}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#050505] rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-[var(--color-neon)] shadow-[0_0_8px_var(--color-neon)] transition-all duration-1000" style={{ width: `${item.recovery}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Grid - Tighter */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Perfil', icon: <Info className="w-5 h-5"/>, tab: 'analyze' },
                        { label: 'Dieta', icon: <Utensils className="w-5 h-5"/>, tab: 'diet' },
                        { label: 'Treino', icon: <Dumbbell className="w-5 h-5"/>, tab: 'training' },
                        { label: 'Evolução', icon: <TrendingUp className="w-5 h-5"/>, tab: 'evolution' },
              ].map((item) => (
                        <button key={item.label} onClick={() => setActiveTab(item.tab as any)} 
                            className="bg-[var(--color-bg-card)] hover:bg-[#111827] active:scale-95 p-5 rounded-[24px] flex flex-col items-center gap-3 transition-all border border-white/5 shadow-[0_4px_15px_rgba(0,0,0,0.2)] group"
                        >
                            <div className="text-[#6b7280] group-hover:text-[var(--color-neon)] transition-colors">{item.icon}</div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">{item.label}</span>
                        </button>
                    ))}
                </div>
                
                {/* Next Workout Card - More Compact */}
                <div className="relative bg-gradient-to-br from-[#111827] to-[#050505] border border-white/5 rounded-[28px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.4)] overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Dumbbell size={100} />
                    </div>
                    <h3 className="text-[11px] font-bold text-[#6b7280] uppercase tracking-widest mb-1 opacity-70">Próximo Treino</h3>
                    <p className="text-[18px] font-bold text-white mb-4">Pernas Completo</p>
                    <button 
                      onClick={() => {
                        if (trainingPlan) {
                          startWorkout(trainingPlan.dias[trainingDayIndex]);
                        } else {
                          setActiveTab('training');
                        }
                      }}
                      className="w-full bg-[var(--color-neon)] text-[#050505] font-black text-[12px] uppercase tracking-widest py-3.5 rounded-xl shadow-[0_0_15px_rgba(0,255,136,0.2)] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all"
                    >
                        Iniciar Treino
                    </button>
                </div>
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
                {/* Hero Section */}
                <div className="mt-6 mb-2">
                  <h1 className="font-display text-[36px] leading-[0.9] text-[#f0f0f0] tracking-tight">
                    ANALISE SEU SHAPE
                  </h1>
                  <p className="text-[13px] text-[#6b7280] italic mt-1.5">
                    IA que enxerga o que o espelho não mostra
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
                    {(["front", "back", "side"] as const).map((type) => (
                      <div key={type} className="space-y-2">
                        <div
                          onClick={() =>
                            document.getElementById(`input-${type}`)?.click()
                          }
                          className={`aspect-square rounded-[16px] border-2 border-dashed border-[#00ff88]/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#00ff88] hover:shadow-[0_0_20px_rgba(0,255,136,0.15)] transition-all overflow-hidden relative shadow-[inset_0_0_30px_rgba(0,255,136,0.05)] ${images[type] ? "border-solid border-[#00ff88]" : ""}`}
                        >
                          {images[type] ? (
                            <>
                              <img
                                src={images[type]}
                                loading="lazy"
                                className={`w-full h-full object-cover transition-all duration-700 ${isCompetitionMode ? "sepia-[0.5] contrast-[1.2] brightness-[0.8] saturate-[1.5]" : ""} ${isScanning ? "brightness-[0.3]" : ""}`}
                              />
                              <div className="absolute inset-0 bg-black/40" />
                              <div className="absolute top-2 right-2 w-5 h-5 bg-[#00ff88] rounded-full flex items-center justify-center shadow-lg">
                                <Check className="w-3 h-3 text-[#080c10]" />
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
                                    className="absolute left-0 right-0 h-1 bg-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.8)] z-10"
                                  />
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <Camera className="w-6 h-6 text-[#6b7280] mb-1" />
                              <span className="text-[10px] uppercase font-bold text-[#6b7280] tracking-wider text-center px-1">
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
                              <span className="text-[8px] font-black text-[#f0f0f0] uppercase tracking-widest">
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
                      <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-widest pl-1">
                        Peso (kg)
                      </label>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
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
                          className="w-full bg-[#111827] border border-[#1f2937] rounded-[12px] pl-9 pr-4 py-3 focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all text-[14px] text-[#f0f0f0]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-widest pl-1">
                        Objetivo
                      </label>
                      <div className="relative">
                        <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                        <select
                          value={profile.goal}
                          onChange={(e) =>
                            setProfile((p) => ({
                              ...p,
                              goal: e.target.value as any,
                            }))
                          }
                          className="w-full appearance-none bg-[#111827] border border-[#1f2937] rounded-[12px] pl-9 pr-4 py-3 focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all text-[14px] text-[#f0f0f0]"
                        >
                          <option value="Cutting">Cutting</option>
                          <option value="Bulking">Bulking</option>
                          <option value="Recomposição">Recomposição</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || isScanning}
                    className="w-full h-[60px] rounded-[16px] flex items-center justify-center gap-2 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-[#080c10] shadow-[0_8px_32px_rgba(0,255,136,0.3)] transition-all active:scale-[0.97] active:shadow-[0_2px_10px_rgba(0,255,136,0.3)] disabled:opacity-50"
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

                  <div className="p-4 bg-[#0d1117] border border-white/5 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                        Análises Restantes
                      </span>
                      <span
                        className={`text-[10px] font-bold ${isPremium ? "text-[#00ff88]" : analysisCount >= 3 ? "text-[#ff4444]" : "text-[#00ff88]"}`}
                      >
                        {isPremium
                          ? "Ilimitado"
                          : `${Math.max(0, 3 - analysisCount)}/3`}
                      </span>
                    </div>
                    {!isPremium && (
                      <>
                        <div className="h-1 bg-[#111827] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${analysisCount >= 3 ? "bg-[#ff4444]" : "bg-[#00ff88]"}`}
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
                <div className="p-5 rounded-[20px] bg-[#0d1117] border border-[rgba(255,255,255,0.06)] space-y-4">
                  <h3 className="text-[16px] font-display uppercase tracking-wide text-[#f0f0f0] flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#00ff88]" /> Limite
                    Genético Natural
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Punho (cm)"
                      type="number"
                      inputMode="decimal"
                      className="bg-[#111827] border border-[#1f2937] rounded-[12px] px-4 py-3 text-[14px] text-[#f0f0f0] focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all"
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
                      className="bg-[#111827] border border-[#1f2937] rounded-[12px] px-4 py-3 text-[14px] text-[#f0f0f0] focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all"
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
                    className="w-full py-3 bg-[#111827] border border-[rgba(255,255,255,0.04)] rounded-[12px] text-[12px] font-bold text-[#f0f0f0] uppercase tracking-widest transition-all hover:bg-[#1f2937] active:scale-[0.97]"
                  >
                    Calcular Potencial
                  </button>
                  {limitResult && (
                    <div className="p-5 bg-[#00ff88]/5 border border-[#00ff88]/10 rounded-[16px] space-y-3 mt-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] text-[#6b7280] uppercase font-bold mb-1">
                            Peso Limite Estimado
                          </p>
                          <p className="text-[24px] font-display text-[#00ff88]">
                            {limitResult.maxMass}
                            <span className="text-[14px]">kg</span>{" "}
                            <span className="text-[10px] text-[#6b7280] font-sans">
                              @ 10% BF
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-[#00ff88]/60 uppercase tracking-widest">
                            Potencial
                          </p>
                          <p className="text-[20px] font-display text-[#f0f0f0]">
                            {Math.round(
                              (limitResult.currentMass / limitResult.maxMass) *
                                100,
                            )}
                            %
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#111827] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, (limitResult.currentMass / limitResult.maxMass) * 100)}%`,
                          }}
                          className="h-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a]"
                        />
                      </div>
                      <p className="text-[10px] text-[#6b7280] italic text-center">
                        Você está a{" "}
                        {Math.round(
                          (limitResult.currentMass / limitResult.maxMass) * 100,
                        )}
                        % do seu limite genérico estimado.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Results */}
                <div className="space-y-6">
                  {!result && !isAnalyzing ? (
                    <div className="h-full min-h-[500px] border border-white/5 rounded-[24px] bg-[#0d1117] flex flex-col items-center justify-center p-12 text-center shadow-2xl">
                      <div className="w-24 h-24 rounded-full bg-[#00ff88]/5 flex items-center justify-center mb-6 animate-pulse">
                        <Target className="w-12 h-12 text-[#00ff88]/50" />
                      </div>
                      <h2 className="text-[20px] font-display font-medium text-[#f0f0f0] mb-3 tracking-wide">
                        PRONTO PARA A ANÁLISE?
                      </h2>
                      <p className="text-[#6b7280] text-[14px] max-w-xs leading-relaxed">
                        Envie suas fotos para descobrir assimetrias, pontos
                        fracos e gerar seu protocolo focado com inteligência
                        artificial.
                      </p>
                    </div>
                  ) : isAnalyzing ? (
                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 space-y-8 relative overflow-hidden bg-[#0d1117] rounded-[24px]">
                      <div className="absolute inset-0 z-0">
                        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#00ff88] rounded-full animate-ping opacity-20" />
                        <div
                          className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-[#00ff88] rounded-full animate-ping opacity-10"
                          style={{ animationDelay: "0.5s" }}
                        />
                      </div>
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-[120px] h-[120px] relative flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-4 border-[#00ff88]/10" />
                          <div className="absolute inset-0 rounded-full border-4 border-t-[#00ff88] animate-[spin_1.5s_linear_infinite]" />
                          <Zap className="w-10 h-10 text-[#00ff88] animate-pulse drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]" />
                        </div>
                      </div>
                      <div className="text-center space-y-3 z-10 w-full max-w-xs">
                        <h3 className="font-display text-[24px] leading-none text-[#f0f0f0] tracking-wide animate-pulse">
                          {loadingMessage}
                        </h3>
                        <div className="h-1 bg-[#111827] rounded-full overflow-hidden w-full relative">
                          <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-[#00ff88] rounded-full animate-[translateX_2s_ease-in-out_infinite]" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 pb-12 relative animate-fade-in-up">
                      {/* Score Hero */}
                      <div className="relative flex flex-col items-center justify-center py-6">
                        <div className="absolute top-0 right-0 bg-[#111827] border border-[#1f2937] px-3 py-1.5 rounded-[8px] flex flex-col items-end">
                          <span className="text-[9px] uppercase tracking-widest text-[#6b7280] font-bold">
                            Gordura
                          </span>
                          <span className="text-[14px] font-display text-[#f0f0f0] tracking-wider">
                            {result.bfEstimate}% BF
                          </span>
                        </div>

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
                                <stop offset="0%" stopColor="#00ff88" />
                                <stop offset="100%" stopColor="#00cc6a" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="flex items-baseline">
                              <span className="font-display font-black text-[80px] leading-none text-[#f0f0f0] tracking-[-2px]">
                                {result.overallScore}
                              </span>
                              <span className="text-[20px] font-display text-[#6b7280]">
                                /100
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`px-4 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-widest ${result.bfEstimate < 10 ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20" : result.bfEstimate < 15 ? "bg-[#00cc6a]/10 text-[#00cc6a] border-[#00cc6a]/20" : result.bfEstimate < 20 ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-[#374151]/20 text-[#6b7280] border-[#374151]"}`}
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
                        <div className="bg-[#0d1117] border border-white/5 rounded-[16px] p-3 flex flex-col justify-between">
                          <span className="text-[10px] uppercase font-bold text-[#6b7280] mb-2">
                            BF%
                          </span>
                          <div>
                            <p className="font-display text-[24px] text-[#f0f0f0] leading-none mb-1">
                              {result.bfEstimate}%
                            </p>
                            <div className="h-1 bg-[#111827] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-500 rounded-full"
                                style={{
                                  width: `${Math.min(100, 100 - (result.bfEstimate - 5) * 4)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#0d1117] border border-white/5 rounded-[16px] p-3 flex flex-col justify-between">
                          <span className="text-[10px] uppercase font-bold text-[#6b7280] mb-2">
                            Simetria
                          </span>
                          <div>
                            <p className="font-display text-[24px] text-[#f0f0f0] leading-none mb-1">
                              {result.metrics.symmetry}/10
                            </p>
                            <div className="h-1 bg-[#111827] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#00ff88] rounded-full"
                                style={{
                                  width: `${result.metrics.symmetry * 10}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#0d1117] border border-white/5 rounded-[16px] p-3 flex flex-col justify-between">
                          <span className="text-[10px] uppercase font-bold text-[#6b7280] mb-2">
                            Volume
                          </span>
                          <div>
                            <p className="font-display text-[24px] text-[#f0f0f0] leading-none mb-1">
                              {result.metrics.volume}/10
                            </p>
                            <div className="h-1 bg-[#111827] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#00cc6a] rounded-full"
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
                            className={`px-5 py-2.5 rounded-full text-[11px] uppercase tracking-widest transition-all whitespace-nowrap border flex-shrink-0 ${analysisFilter === f ? "bg-[#00ff88] border-[#00ff88] text-[#080c10] font-bold shadow-[0_4px_12px_rgba(0,255,136,0.2)]" : "bg-transparent border-[#1f2937] text-[#6b7280] font-medium hover:border-white/20"}`}
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
                            className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${activeAccordion === "fat" ? "bg-[#111827] border-white/10" : "bg-[#0d1117] border-[rgba(255,255,255,0.06)]"}`}
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
                                  className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[14px] ${result.bfEstimate > 18 ? "bg-[#ffb800]/10 text-[#ffb800]" : "bg-[#00ff88]/10 text-[#00ff88]"}`}
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
                                  <h4 className="text-[14px] font-semibold text-[#f0f0f0] leading-tight">
                                    Gordura Corporal
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded-[6px] bg-[#111827] border border-[#1f2937] text-[12px] font-bold text-[#f0f0f0]">
                                  {result.bfEstimate}%
                                </span>
                                <ChevronDown
                                  className={`w-5 h-5 text-[#6b7280] transition-transform duration-300 ${activeAccordion === "fat" ? "rotate-180 text-[#f0f0f0]" : ""}`}
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
                                <div className="bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-4 flex flex-col gap-3">
                                  <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.04)]">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#ffb800]" />
                                      <span className="text-[12px] text-[#6b7280]">
                                        Fase Recomendada
                                      </span>
                                    </div>
                                    <span className="text-[12px] font-bold text-[#f0f0f0]">
                                      {result.recommendations.dietPhase}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                                      <span className="text-[12px] text-[#6b7280]">
                                        Calorias Sugeridas
                                      </span>
                                    </div>
                                    <span className="text-[12px] font-bold text-[#f0f0f0]">
                                      {result.recommendations.macros.calories}{" "}
                                      kcal
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[13px] text-[#6b7280] italic leading-relaxed">
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
                            className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${activeAccordion === "sym" ? "bg-[#111827] border-white/10" : "bg-[#0d1117] border-[rgba(255,255,255,0.06)]"}`}
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
                                  className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[14px] ${result.metrics.symmetry >= 80 ? "bg-[#00ff88]/10 text-[#00ff88]" : result.metrics.symmetry >= 60 ? "bg-[#ffb800]/10 text-[#ffb800]" : "bg-[#ff4444]/10 text-[#ff4444]"}`}
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
                                  <h4 className="text-[14px] font-semibold text-[#f0f0f0] leading-tight">
                                    Simetria Muscular
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded-[6px] bg-[#111827] border border-[#1f2937] text-[12px] font-bold text-[#f0f0f0]">
                                  {result.metrics.symmetry >= 80
                                    ? "Boa"
                                    : result.metrics.symmetry >= 60
                                      ? "Regular"
                                      : "Fraca"}
                                </span>
                                <ChevronDown
                                  className={`w-5 h-5 text-[#6b7280] transition-transform duration-300 ${activeAccordion === "sym" ? "rotate-180 text-[#f0f0f0]" : ""}`}
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
                                <div className="bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-4 flex flex-col gap-0">
                                  {result.proportions.imbalances.map(
                                    (imb, i) => (
                                      <div
                                        key={i}
                                        className={`flex justify-between items-start gap-4 py-3 ${i < result.proportions.imbalances.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}
                                      >
                                        <div className="flex items-start gap-2 pt-0.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#ffb800] mt-1 shrink-0" />
                                          <span className="text-[12px] text-[#f0f0f0]">
                                            {imb}
                                          </span>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                                <p className="text-[13px] text-[#6b7280] italic leading-relaxed">
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
                            className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${activeAccordion === "def" ? "bg-[#111827] border-white/10" : "bg-[#0d1117] border-[rgba(255,255,255,0.06)]"}`}
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
                                  className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[14px] ${result.metrics.definition >= 75 ? "bg-[#00ff88]/10 text-[#00ff88]" : "bg-[#ffb800]/10 text-[#ffb800]"}`}
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
                                  <h4 className="text-[14px] font-semibold text-[#f0f0f0] leading-tight">
                                    Definição Muscular
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded-[6px] bg-[#111827] border border-[#1f2937] text-[12px] font-bold text-[#f0f0f0]">
                                  {result.metrics.definition >= 75
                                    ? "Boa"
                                    : "Regular"}
                                </span>
                                <ChevronDown
                                  className={`w-5 h-5 text-[#6b7280] transition-transform duration-300 ${activeAccordion === "def" ? "rotate-180 text-[#f0f0f0]" : ""}`}
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
                                  <div className="bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-3 text-center">
                                    <p className="text-[10px] text-[#6b7280] uppercase font-bold mb-1">
                                      Densidade
                                    </p>
                                    <p className="text-[20px] font-display text-[#f0f0f0]">
                                      {result.metrics.density}%
                                    </p>
                                  </div>
                                  <div className="bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-3 text-center">
                                    <p className="text-[10px] text-[#6b7280] uppercase font-bold mb-1">
                                      Volume
                                    </p>
                                    <p className="text-[20px] font-display text-[#f0f0f0]">
                                      {result.metrics.volume}%
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-[#00ff88]/5 border border-[#00ff88]/10 rounded-[12px] p-4 flex flex-col gap-0 mt-2">
                                  <p className="text-[11px] font-bold text-[#00ff88] uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <Award className="w-4 h-4" /> Pontos Fortes
                                  </p>
                                  {result.analysis.strengths
                                    .slice(0, 3)
                                    .map((s, i) => (
                                      <div
                                        key={i}
                                        className={`flex items-start gap-2 py-2 ${i < 2 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] mt-1 shrink-0" />
                                        <span className="text-[12px] text-[#f0f0f0] leading-tight">
                                          {s}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </motion.div>

                      {/* Additional Content (Radar + Comparison) - Only in 'Tudo' */}
                      {analysisFilter === "Tudo" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 px-1">
                          <div className="bg-[#0d1117] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-5 aspect-square flex flex-col items-center justify-center overflow-hidden">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
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
                                  <PolarGrid stroke="#1f2937" />
                                  <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{ fill: "#6b7280", fontSize: 9 }}
                                  />
                                  <Radar
                                    name="Shape"
                                    dataKey="A"
                                    stroke="#00ff88"
                                    fill="#00ff88"
                                    fillOpacity={0.2}
                                  />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="bg-[#0d1117] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-5 flex flex-col justify-center space-y-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280] flex items-center gap-2">
                              <Camera className="w-4 h-4" /> Comparativo
                              Quinzenal
                            </h4>
                            {evolutionHistory.length > 1 ? (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <div className="aspect-[3/4] rounded-[12px] overflow-hidden border border-[#1f2937]">
                                    <img
                                      src={
                                        evolutionHistory[
                                          evolutionHistory.length - 2
                                        ].photo || images.front
                                      }
                                      className="w-full h-full object-cover grayscale opacity-50"
                                    />
                                  </div>
                                  <p className="text-[9px] font-bold text-[#6b7280] text-center uppercase tracking-tighter">
                                    Anterior
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <div className="aspect-[3/4] rounded-[12px] overflow-hidden border border-[#00ff88]/50 shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                                    <img
                                      src={images.front}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <p className="text-[9px] font-bold text-[#00ff88] text-center uppercase tracking-tighter">
                                    Atual
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#1f2937] rounded-[12px] p-6">
                                <Camera className="w-8 h-8 text-[#1f2937] mb-2" />
                                <p className="text-[10px] text-[#6b7280] uppercase font-bold text-center">
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
                                className="w-full h-[60px] bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-[#080c10] font-display text-[20px] uppercase tracking-wide rounded-[16px] active:scale-[0.97] transition-all shadow-[0_8px_32px_rgba(0,255,136,0.3)] flex items-center justify-center gap-2"
                              >
                                <Zap className="w-5 h-5 fill-current" />
                                <span>Ver Plano Corretivo</span>
                              </button>
                              <p className="text-center text-[10px] text-[#6b7280] font-bold uppercase mt-4 tracking-widest">
                                Plano Integrado de Treino + Dieta
                              </p>
                            </>
                          ) : isGeneratingCorrectivePlan ? (
                            <div className="space-y-4 animate-pulse">
                              <div className="h-24 bg-[#111827] rounded-[20px] border border-[rgba(255,255,255,0.06)]" />
                              <div className="grid grid-cols-2 gap-3">
                                <div className="h-32 bg-[#111827] rounded-[20px] border border-[rgba(255,255,255,0.06)]" />
                                <div className="h-32 bg-[#111827] rounded-[20px] border border-[rgba(255,255,255,0.06)]" />
                              </div>
                              <div className="h-40 bg-[#111827] rounded-[20px] border border-[rgba(255,255,255,0.06)]" />
                              <p className="text-center text-[10px] text-[#00ff88] font-bold uppercase tracking-widest">
                                A inteligência artificial está desenhando seu
                                shape...
                              </p>
                            </div>
                          ) : (
                            correctivePlan && (
                              <div className="space-y-4 bg-[#111827] border-l-4 border-l-[#00ff88] border-y border-r border-[#1f2937] rounded-[20px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                                <h3 className="text-[18px] font-display uppercase text-[#f0f0f0] flex items-center gap-2">
                                  <Trophy className="w-5 h-5 text-[#00ff88]" />{" "}
                                  Plano Corretivo
                                </h3>
                                <div className="p-3 bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px]">
                                  <p className="text-[13px] font-medium text-[#00ff88]">
                                    {correctivePlan.summary}
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px] flex flex-col gap-0">
                                    <h4 className="text-[10px] font-bold uppercase text-[#6b7280] tracking-widest mb-2">
                                      Foco do Treino
                                    </h4>
                                    {correctivePlan.trainingFocus.map(
                                      (f: any, i: number) => (
                                        <div
                                          key={i}
                                          className={`flex items-start gap-2 py-2 ${i < correctivePlan.trainingFocus.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] mt-1 shrink-0" />
                                          <span className="text-[12px] text-[#f0f0f0] leading-tight">
                                            {f}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                  <div className="p-3 bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px] flex flex-col gap-0">
                                    <h4 className="text-[10px] font-bold uppercase text-[#6b7280] tracking-widest mb-2">
                                      Dicas de Dieta
                                    </h4>
                                    {correctivePlan.dietFocus.map(
                                      (d: any, i: number) => (
                                        <div
                                          key={i}
                                          className={`flex items-start gap-2 py-2 ${i < correctivePlan.dietFocus.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] mt-1 shrink-0" />
                                          <span className="text-[12px] text-[#f0f0f0] leading-tight">
                                            {d}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>

                                <div className="p-3 bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px] flex flex-col gap-0">
                                  <h4 className="text-[10px] font-bold uppercase text-[#6b7280] tracking-widest mb-2">
                                    Alvos Prioritários
                                  </h4>
                                  {correctivePlan.priorityExercises.map(
                                    (ex: any, i: number) => (
                                      <div
                                        key={i}
                                        className={`flex justify-between items-center text-[12px] py-3 ${i < correctivePlan.priorityExercises.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}
                                      >
                                        <strong className="text-[#00ff88] font-bold">
                                          {ex.name}
                                        </strong>
                                        <span className="text-[#6b7280] text-right">
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
                                    className="flex-1 py-3 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-[#080c10] rounded-[12px] text-center text-[13px] font-bold uppercase transition-all shadow-[0_4px_15px_rgba(0,255,136,0.2)]"
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
                                    className="flex-1 py-3 bg-[#080c10] border border-[rgba(255,255,255,0.04)] text-[#f0f0f0] rounded-[12px] text-center text-[13px] font-bold uppercase hover:bg-[#1f2937] transition-all"
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
                        <div className="p-6 rounded-[20px] bg-[#00ff88]/5 border border-[#00ff88]/10 mt-6 space-y-4">
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-[#00ff88]" />
                            <h3 className="text-[20px] font-display text-[#f0f0f0] uppercase tracking-wide">
                              Análise de Pump
                            </h3>
                          </div>
                          <div className="grid md:grid-cols-3 gap-3">
                            <div className="p-3 rounded-[12px] bg-[#080c10] border border-[rgba(255,255,255,0.04)]">
                              <p className="text-[10px] font-bold text-[#6b7280] uppercase mb-1">
                                Vascularização
                              </p>
                              <p className="text-[24px] font-display text-[#00ff88]">
                                {result.analysis.pumpAnalysis.vascularityScore}
                                <span className="text-[14px]">/100</span>
                              </p>
                            </div>
                            <div className="p-3 rounded-[12px] bg-[#080c10] border border-[rgba(255,255,255,0.04)] flex flex-col justify-center">
                              <p className="text-[10px] font-bold text-[#6b7280] uppercase mb-1">
                                Volume
                              </p>
                              <p className="text-[14px] font-bold text-[#f0f0f0]">
                                {result.analysis.pumpAnalysis.volumeIncrease}
                              </p>
                            </div>
                            <div className="p-3 rounded-[12px] bg-[#080c10] border border-[rgba(255,255,255,0.04)]">
                              <p className="text-[10px] font-bold text-[#6b7280] uppercase mb-1">
                                Comparação
                              </p>
                              <p className="text-[12px] text-[#f0f0f0] leading-tight">
                                {result.analysis.pumpAnalysis.comparison}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
    {/* MODE SELECTION */}
    {!dietPlan && !isGeneratingDiet && !dietMode && (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0d1117] rounded-[24px] border border-[rgba(255,255,255,0.06)] min-h-[500px]">
        <div className="w-24 h-24 rounded-full bg-[#00ff88]/5 flex items-center justify-center mb-6">
          <Utensils className="w-12 h-12 text-[#00ff88]/50" />
        </div>
        <h2 className="text-[20px] font-display font-medium text-[#f0f0f0] mb-3 tracking-wide">ESCOLHA SEU CAMINHO</h2>
        <p className="text-[#6b7280] text-[14px] max-w-sm text-center mb-8">Baseie sua dieta na inteligência artificial do seu shape ou calcule a partir de dados manuais.</p>
        
        <div className="grid md:grid-cols-2 gap-4 w-full max-w-2xl">
          <button 
            onClick={() => setDietMode('premium')}
            disabled={!result}
            className={`relative p-6 rounded-[20px] border flex flex-col items-start transition-all text-left group ${!result ? 'bg-[#0a0f16] border-[#1f2937] opacity-60 cursor-not-allowed' : 'bg-[#0d1117] border-[#00ff88]/30 hover:border-[#00ff88] cursor-pointer'}`}
          >
            <div className="absolute top-4 right-4 px-2 py-1 bg-[#00ff88]/10 text-[#00ff88] text-[9px] font-bold uppercase rounded-md tracking-wider">Premium</div>
            <Sparkles className={`w-8 h-8 mb-4 ${!result ? 'text-[#6b7280]' : 'text-[#00ff88]'}`} />
            <h3 className="text-[16px] font-display text-[#f0f0f0] mb-1">Dieta Inteligente</h3>
            <p className="text-[12px] text-[#6b7280]">Baseada na sua análise de shape.</p>
            {!result && <div className="mt-4 text-[10px] text-[#ffb800] bg-[#ffb800]/10 px-2 py-1 rounded">Faça uma análise de foto primeiro.</div>}
          </button>
          
          <button 
            onClick={() => setDietMode('free')}
            className="relative p-6 rounded-[20px] bg-[#0d1117] border border-[rgba(255,255,255,0.1)] hover:border-white/30 flex flex-col items-start transition-all cursor-pointer text-left group"
          >
            <div className="absolute top-4 right-4 px-2 py-1 bg-[#1f2937] text-[#f0f0f0] text-[9px] font-bold uppercase rounded-md tracking-wider">Grátis</div>
            <Calculator className="w-8 h-8 text-[#f0f0f0] mb-4" />
            <h3 className="text-[16px] font-display text-[#f0f0f0] mb-1">Dieta Personalizada</h3>
            <p className="text-[12px] text-[#6b7280]">Calculada pelos seus dados.</p>
          </button>
        </div>
      </div>
    )}

    {/* LOADER */}
    {isGeneratingDiet && (
      <div className="flex flex-col items-center justify-center p-12 bg-[#0d1117] rounded-[24px] border border-[rgba(255,255,255,0.06)] min-h-[500px]">
        <div className="w-[120px] h-[120px] relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-[#00ff88]/10" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#00ff88] animate-[spin_1.5s_linear_infinite]" />
          <Utensils className="w-10 h-10 text-[#00ff88] animate-pulse drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]" />
        </div>
        <h2 className="text-[20px] font-display text-[#f0f0f0] animate-pulse tracking-wide">{dietLoadingMessage}</h2>
        <div className="mt-8 space-y-4 w-full max-w-md opacity-20">
          <div className="h-20 bg-white/10 rounded-[16px] animate-pulse" />
          <div className="h-20 bg-white/10 rounded-[16px] animate-pulse delay-75" />
          <div className="h-20 bg-white/10 rounded-[16px] animate-pulse delay-150" />
        </div>
      </div>
    )}

    {/* PREMIUM FORM */}
    {!dietPlan && !isGeneratingDiet && dietMode === 'premium' && (
      <div className="space-y-6 animate-fade-in-up">
        <button onClick={() => setDietMode(null)} className="flex items-center gap-2 text-[#6b7280] hover:text-[#f0f0f0] text-[12px] font-bold uppercase tracking-wider transition-colors pt-2"><ArrowLeft className="w-4 h-4"/> Voltar</button>
        
        {/* Resumo da Análise */}
        <div className="bg-[#111827] border-l-4 border-l-[#00ff88] border-y border-r border-[#1f2937] rounded-[20px] p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[14px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">Última Análise Salva</h3>
              <p className="text-[24px] font-display text-[#f0f0f0] leading-none">{result?.overallScore}<span className="text-[14px] text-[#6b7280]">/100</span></p>
            </div>
            <button onClick={() => setActiveTab('analyze')} className="bg-[#1f2937] text-[#f0f0f0] px-3 py-1.5 rounded-[8px] text-[10px] font-bold uppercase">Refazer Análise</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-2 text-center">
              <p className="text-[9px] text-[#6b7280] uppercase font-bold">Categoria</p>
              <p className="text-[12px] font-bold text-[#00ff88]">{result?.bfEstimate < 10 ? "Atleta" : result?.bfEstimate < 15 ? "Atlético" : result?.bfEstimate < 20 ? "Fitness" : "Evolução"}</p>
            </div>
            <div className="bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-2 text-center">
              <p className="text-[9px] text-[#6b7280] uppercase font-bold">BF%</p>
              <p className="text-[12px] font-bold text-[#f0f0f0]">{result?.bfEstimate}%</p>
            </div>
            <div className="bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-2 text-center">
              <p className="text-[9px] text-[#6b7280] uppercase font-bold">Objetivo</p>
              <p className="text-[12px] font-bold text-[#ffb800]">{result?.recommendations?.dietPhase}</p>
            </div>
          </div>
        </div>

        {/* Inputs adicionais */}
        <div className="bg-[#0d1117] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 space-y-6">
          <h3 className="text-[18px] font-display text-[#f0f0f0] uppercase tracking-wide flex items-center gap-2"><Settings2 className="w-5 h-5 text-[#00ff88]"/> Ajustes Finos</h3>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Sexo</label>
               <div className="flex bg-[#111827] rounded-[12px] p-1 border border-[#1f2937]">
                 <button onClick={() => setDietFormPremium(p => ({...p, gender: 'M'}))} className={`flex-1 py-2 text-[12px] font-bold rounded-[8px] transition-all ${dietFormPremium.gender === 'M' ? 'bg-[#1f2937] text-[#00ff88]' : 'text-[#6b7280]'}`}>MAS</button>
                 <button onClick={() => setDietFormPremium(p => ({...p, gender: 'F'}))} className={`flex-1 py-2 text-[12px] font-bold rounded-[8px] transition-all ${dietFormPremium.gender === 'F' ? 'bg-[#1f2937] text-[#ffb800]' : 'text-[#6b7280]'}`}>FEM</button>
               </div>
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Idade</label>
               <input type="tel" inputMode="numeric" value={dietFormPremium.age || ''} onChange={(e) => setDietFormPremium(p => ({...p, age: parseInt(e.target.value) || 0}))} className="w-full bg-[#111827] border border-[#1f2937] text-[#f0f0f0] h-[40px] px-3 rounded-[12px] focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_2px_rgba(0,255,136,0.1)] text-[14px]" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Altura (cm)</label>
               <input type="tel" inputMode="numeric" value={dietFormPremium.height || ''} onChange={(e) => setDietFormPremium(p => ({...p, height: parseInt(e.target.value) || 0}))} className="w-full bg-[#111827] border border-[#1f2937] text-[#f0f0f0] h-[40px] px-3 rounded-[12px] focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_2px_rgba(0,255,136,0.1)] text-[14px]" />
             </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Dias de Treino por Semana</label>
            <div className="flex gap-2">
              {[1,2,3,4,5,6,7].map(d => (
                <button key={d} onClick={() => setDietFormPremium(p => ({...p, trainingDays: d}))} className={`flex-1 aspect-square rounded-[10px] font-bold text-[14px] flex items-center justify-center transition-all border ${dietFormPremium.trainingDays === d ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]' : 'bg-[#111827] border-[#1f2937] text-[#6b7280] hover:border-white/20'}`}>{d}</button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Restrições Alimentares</label>
            <div className="flex flex-wrap gap-2">
              {['Sem glúten', 'Sem lactose', 'Vegano', 'Vegetariano', 'Sem amendoim'].map(r => (
                <button 
                  key={r}
                  onClick={() => setDietFormPremium(p => ({...p, restrictions: p.restrictions.includes(r) ? p.restrictions.filter(x => x !== r) : [...p.restrictions, r]}))}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border outline-none ${dietFormPremium.restrictions.includes(r) ? 'bg-[#ffb800]/10 border-[#ffb800] text-[#ffb800]' : 'bg-[#111827] border-[#1f2937] text-[#6b7280] hover:border-white/20'}`}
                >{r}</button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerateDietPremium} className="w-full h-[56px] bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-[#080c10] font-display text-[18px] uppercase tracking-wide rounded-[16px] active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(0,255,136,0.3)] mt-4">
            Gerar Dieta Premium
          </button>
        </div>
      </div>
    )}

    {/* FREE FORM */}
    {!dietPlan && !isGeneratingDiet && dietMode === 'free' && (
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
            <button onClick={() => setDietMode(null)} className="flex items-center gap-2 text-[#6b7280] hover:text-[#f0f0f0] text-[12px] font-bold uppercase tracking-wider transition-colors pt-2"><ArrowLeft className="w-4 h-4"/> Voltar</button>
            <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider bg-[#111827] px-3 py-1 rounded-full border border-[#1f2937]">Passo {dietFreeStep} de 2</div>
        </div>

        {dietFreeStep === 1 ? (
          <div className="bg-[#0d1117] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 space-y-6">
            <h3 className="text-[20px] font-display text-[#f0f0f0] uppercase tracking-wide mb-2 flex items-center gap-2">Seus Dados</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Nome</label>
                <input type="text" placeholder="Como quer ser chamado?" value={dietFormFree.name} onChange={(e) => setDietFormFree(p => ({...p, name: e.target.value}))} className="w-full bg-[#111827] border border-[#1f2937] text-[#f0f0f0] h-[48px] px-4 rounded-[12px] focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_2px_rgba(0,255,136,0.1)] text-[14px]" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Sexo</label>
                   <div className="flex bg-[#111827] rounded-[12px] p-1 border border-[#1f2937] h-[48px]">
                     <button onClick={() => setDietFormFree(p => ({...p, gender: 'M'}))} className={`flex-1 text-[12px] font-bold rounded-[8px] transition-all flex items-center justify-center gap-1 ${dietFormFree.gender === 'M' ? 'bg-[#1f2937] text-[#00ff88]' : 'text-[#6b7280]'}`}>MAS</button>
                     <button onClick={() => setDietFormFree(p => ({...p, gender: 'F'}))} className={`flex-1 text-[12px] font-bold rounded-[8px] transition-all flex items-center justify-center gap-1 ${dietFormFree.gender === 'F' ? 'bg-[#1f2937] text-[#ffb800]' : 'text-[#6b7280]'}`}>FEM</button>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Idade</label>
                   <input type="tel" inputMode="numeric" value={dietFormFree.age || ''} onChange={(e) => setDietFormFree(p => ({...p, age: parseInt(e.target.value) || 0}))} className="w-full bg-[#111827] border border-[#1f2937] text-[#f0f0f0] h-[48px] px-4 rounded-[12px] focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_2px_rgba(0,255,136,0.1)] text-[14px] text-center" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Altura (cm)</label>
                   <input type="tel" inputMode="numeric" value={dietFormFree.height || ''} onChange={(e) => setDietFormFree(p => ({...p, height: parseInt(e.target.value) || 0}))} className="w-full bg-[#111827] border border-[#1f2937] text-[#f0f0f0] h-[48px] px-4 rounded-[12px] focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_2px_rgba(0,255,136,0.1)] text-[14px] text-center" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Peso (kg)</label>
                   <input type="tel" inputMode="numeric" value={dietFormFree.weight || ''} onChange={(e) => setDietFormFree(p => ({...p, weight: parseInt(e.target.value) || 0}))} className="w-full bg-[#111827] border border-[#1f2937] text-[#f0f0f0] h-[48px] px-4 rounded-[12px] focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_2px_rgba(0,255,136,0.1)] text-[14px] text-center" />
                 </div>
              </div>
            </div>

            <button onClick={() => setDietFreeStep(2)} disabled={!dietFormFree.name || !dietFormFree.age || !dietFormFree.weight || !dietFormFree.height} className="w-full h-[56px] bg-[#f0f0f0] text-[#080c10] font-bold text-[14px] uppercase tracking-wider rounded-[16px] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2">
              Próximo Passo <ArrowRight className="w-4 h-4"/>
            </button>
          </div>
        ) : (
          <div className="bg-[#0d1117] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 space-y-6">
            <h3 className="text-[20px] font-display text-[#f0f0f0] uppercase tracking-wide mb-2 flex items-center gap-2">Preferências</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Objetivo</label>
                <div className="grid grid-cols-1 gap-2">
                  {['PERDER GORDURA', 'GANHAR MASSA', 'MANUTENÇÃO'].map(o => (
                    <button key={o} onClick={() => setDietFormFree(p => ({...p, objective: o}))} className={`p-4 rounded-[12px] border text-left transition-all ${dietFormFree.objective === o ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]' : 'bg-[#111827] border-[#1f2937] text-[#6b7280] hover:border-white/20'}`}>
                      <span className="font-bold text-[14px] uppercase tracking-wider">{o}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Nível de Atividade</label>
                <div className="grid grid-cols-2 gap-2">
                  {['SEDENTÁRIO', 'LEVE', 'MODERADO', 'INTENSO'].map(a => (
                    <button key={a} onClick={() => setDietFormFree(p => ({...p, activityLevel: a}))} className={`py-3 rounded-[10px] text-[11px] font-bold uppercase transition-all border ${dietFormFree.activityLevel === a ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]' : 'bg-[#111827] border-[#1f2937] text-[#6b7280] hover:border-white/20'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Refeições por dia</label>
                <div className="flex gap-2">
                  {[3,4,5,6].map(n => (
                    <button key={n} onClick={() => setDietFormFree(p => ({...p, mealsPerDay: n}))} className={`flex-1 aspect-square rounded-[10px] font-bold text-[16px] flex items-center justify-center transition-all border ${dietFormFree.mealsPerDay === n ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]' : 'bg-[#111827] border-[#1f2937] text-[#6b7280] hover:border-white/20'}`}>{n}</button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Restrições Alimentares</label>
                <div className="flex flex-wrap gap-2">
                  {['Sem glúten', 'Sem lactose', 'Vegano', 'Vegetariano', 'Sem amendoim'].map(r => (
                    <button 
                      key={r}
                      onClick={() => setDietFormFree(p => ({...p, restrictions: p.restrictions.includes(r) ? p.restrictions.filter(x => x !== r) : [...p.restrictions, r]}))}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border outline-none ${dietFormFree.restrictions.includes(r) ? 'bg-[#ffb800]/10 border-[#ffb800] text-[#ffb800]' : 'bg-[#111827] border-[#1f2937] text-[#6b7280] hover:border-white/20'}`}
                    >{r}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
               <button onClick={() => setDietFreeStep(1)} className="w-[56px] h-[56px] bg-[#111827] border border-[#1f2937] text-[#f0f0f0] rounded-[16px] active:scale-[0.98] transition-all flex items-center justify-center shrink-0">
                 <ArrowLeft className="w-5 h-5"/>
               </button>
               <button onClick={handleGenerateDietFree} disabled={!dietFormFree.objective || !dietFormFree.activityLevel} className="flex-1 h-[56px] bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-[#080c10] font-display text-[18px] uppercase tracking-wide rounded-[16px] active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(0,255,136,0.3)] disabled:opacity-50">
                 Gerar Plano
               </button>
            </div>
          </div>
        )}
      </div>
    )}

    {/* EXIBIÇÃO DO PLANO GERADO */}
    {dietPlan && (
      <div className="space-y-6 animate-fade-in-up">
        {/* Macros Header */}
        <div className="bg-[#0d1117] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 relative overflow-hidden flex flex-col items-center">
           {dietMode === 'premium' && (
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff88]/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
           )}
           <h3 className="text-[12px] font-bold text-[#6b7280] uppercase tracking-widest mb-6">Suas Metas Diárias</h3>
           
           <div className="relative w-[180px] h-[180px] mb-6">
             <PieChart width={180} height={180}>
                <Pie
                  data={[
                    { name: 'Proteína', value: dietPlan.resumo_metabolico.proteina_g * 4, color: '#00ff88' },
                    { name: 'Carbo', value: dietPlan.resumo_metabolico.carbo_g * 4, color: '#ffb800' },
                    { name: 'Gordura', value: dietPlan.resumo_metabolico.gordura_g * 9, color: '#3b82f6' }
                  ]}
                  cx={90}
                  cy={90}
                  innerRadius={70}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {
                    [
                      { name: 'Proteína', value: dietPlan.resumo_metabolico.proteina_g * 4, color: '#00ff88' },
                      { name: 'Carbo', value: dietPlan.resumo_metabolico.carbo_g * 4, color: '#ffb800' },
                      { name: 'Gordura', value: dietPlan.resumo_metabolico.gordura_g * 9, color: '#3b82f6' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  }
                </Pie>
             </PieChart>
             <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-[36px] font-display text-[#f0f0f0] leading-none tracking-wide">{dietPlan.resumo_metabolico.meta_calorica}</span>
                <span className="text-[12px] text-[#6b7280] font-bold uppercase tracking-widest">Kcal</span>
             </div>
           </div>

           <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
             <div className="flex flex-col items-center">
               <div className="w-3 h-3 rounded-full bg-[#00ff88] mb-2" />
               <span className="text-[10px] text-[#6b7280] uppercase font-bold tracking-widest mb-1">Proteína</span>
               <span className="text-[18px] font-display text-[#f0f0f0]">{dietPlan.resumo_metabolico.proteina_g}g</span>
             </div>
             <div className="flex flex-col items-center">
               <div className="w-3 h-3 rounded-full bg-[#ffb800] mb-2" />
               <span className="text-[10px] text-[#6b7280] uppercase font-bold tracking-widest mb-1">Carbo</span>
               <span className="text-[18px] font-display text-[#f0f0f0]">{dietPlan.resumo_metabolico.carbo_g}g</span>
             </div>
             <div className="flex flex-col items-center">
               <div className="w-3 h-3 rounded-full bg-[#3b82f6] mb-2" />
               <span className="text-[10px] text-[#6b7280] uppercase font-bold tracking-widest mb-1">Gordura</span>
               <span className="text-[18px] font-display text-[#f0f0f0]">{dietPlan.resumo_metabolico.gordura_g}g</span>
             </div>
           </div>
        </div>

        {/* Refeições */}
        <div className="space-y-4">
          <h3 className="text-[18px] font-display text-[#f0f0f0] uppercase tracking-wide flex items-center gap-2 px-2"><Utensils className="w-5 h-5 text-[#ffb800]"/> Refeições</h3>
          {dietPlan.refeicoes.map((meal: any, idx: number) => {
             // Determinar cor baseada na ordem ou horário
             let accentColor = 'bg-[#00ff88] text-[#00ff88]';
             if (idx === 0) accentColor = 'bg-[#ffb800] text-[#ffb800]';
             else if (idx === 1) accentColor = 'bg-[#00ff88] text-[#00ff88]';
             else if (idx === 2) accentColor = 'bg-[#3b82f6] text-[#3b82f6]';
             else accentColor = 'bg-[#a855f7] text-[#a855f7]';
             
             const isExpanded = expandedMeals[idx];

             return (
               <div key={idx} className={`bg-[#0d1117] border border-[rgba(255,255,255,0.06)] rounded-[20px] overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : ''}`}>
                 <button 
                   onClick={() => setExpandedMeals(p => ({...p, [idx]: !p[idx]}))}
                   className="w-full p-5 flex items-center justify-between cursor-pointer focus:outline-none"
                 >
                   <div className="flex items-center gap-4">
                     <div className={`px-2 py-1 rounded-[6px] ${accentColor.split(' ')[0]}/10 border ${accentColor.split(' ')[0].replace('bg-', 'border-')}/20`}>
                       <span className={`text-[12px] font-bold ${accentColor.split(' ')[1]}`}>{meal.horario}</span>
                     </div>
                     <div className="text-left">
                       <h4 className="text-[16px] font-display text-[#f0f0f0]">{meal.nome}</h4>
                       <p className="text-[12px] text-[#6b7280]">{meal.calorias} kcal</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="hidden sm:flex items-center gap-3 mr-2">
                        <span className="text-[10px] text-[#6b7280] font-bold">P: {meal.proteina_g}g</span>
                        <span className="text-[10px] text-[#6b7280] font-bold">C: {meal.carbo_g}g</span>
                        <span className="text-[10px] text-[#6b7280] font-bold">G: {meal.gordura_g}g</span>
                     </div>
                     <ChevronDown className={`w-5 h-5 text-[#6b7280] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#f0f0f0]' : ''}`} />
                   </div>
                 </button>
                 
                 <AnimatePresence>
                   {isExpanded && (
                     <motion.div
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: "auto", opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       className="overflow-hidden"
                     >
                       <div className="px-5 pb-5 pt-0 space-y-2">
                         <div className="h-px w-full bg-[rgba(255,255,255,0.04)] mb-4" />
                         {meal.opcoes.map((item: any, i: number) => (
                           <div key={i} className="flex justify-between items-center p-3 rounded-[12px] bg-[#111827] border border-[#1f2937]">
                             <div className="flex items-center gap-3">
                               <div className="w-1.5 h-1.5 rounded-full bg-[#f0f0f0]" />
                               <span className="text-[14px] text-[#f0f0f0] font-medium">{item.alimento}</span>
                             </div>
                             <div className="text-right">
                               <span className="text-[14px] font-bold text-[#f0f0f0] block">{item.quantidade}</span>
                               {item.calorias && <span className="text-[10px] text-[#6b7280]">{item.calorias} kcal</span>}
                             </div>
                           </div>
                         ))}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             )
          })}
        </div>

        {/* Dicas de Timing */}
        {dietPlan.dicas_timing && dietPlan.dicas_timing.length > 0 && (
          <div className="bg-[#111827] border-l-4 border-l-[#ffb800] border-y border-r border-[#1f2937] rounded-[20px] p-6 space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <h3 className="text-[16px] font-display text-[#f0f0f0] uppercase tracking-wide flex items-center gap-2"><Clock className="w-5 h-5 text-[#ffb800]"/> Dicas de Timing</h3>
            <div className="space-y-3">
              {dietPlan.dicas_timing.map((dica: string, i: number) => (
                <div key={i} className={`flex items-start gap-3 ${i < dietPlan.dicas_timing.length - 1 ? 'pb-3 border-b border-[rgba(255,255,255,0.04)]' : ''}`}>
                  <div className="w-5 h-5 rounded-full bg-[#ffb800]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 text-[#ffb800]" />
                  </div>
                  <p className="text-[13px] text-[#f0f0f0] leading-relaxed">{dica}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observação Especial */}
        {dietPlan.observacao_especial && (
           <div className="bg-[#0d1117] border border-[#1f2937] rounded-[20px] p-6">
             <div className="flex gap-4 items-start">
               <div className="w-10 h-10 rounded-full bg-[#00ff88]/10 flex items-center justify-center shrink-0"><MessageSquare className="w-5 h-5 text-[#00ff88]" /></div>
               <p className="text-[14px] text-[#6b7280] italic leading-relaxed pt-2">"{dietPlan.observacao_especial}"</p>
             </div>
           </div>
        )}

        {/* Lista de Compras */}
        {dietPlan.lista_compras && dietPlan.lista_compras.length > 0 && (
          <div className={`bg-[#0d1117] border border-[rgba(255,255,255,0.06)] rounded-[20px] overflow-hidden transition-all duration-300 ${expandedShoppingList ? 'shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : ''}`}>
             <button 
               onClick={() => setExpandedShoppingList(p => !p)}
               className="w-full p-5 flex items-center justify-between cursor-pointer focus:outline-none"
             >
               <div className="flex items-center gap-4">
                 <div className="px-2 py-1 rounded-[6px] bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center">
                   <ShoppingCart className="w-5 h-5 text-[#3b82f6]" />
                 </div>
                 <div className="text-left">
                   <h4 className="text-[16px] font-display text-[#f0f0f0] uppercase">Lista de Compras</h4>
                   <p className="text-[12px] text-[#6b7280]">{dietPlan.lista_compras.length} itens</p>
                 </div>
               </div>
               <ChevronDown className={`w-5 h-5 text-[#6b7280] transition-transform duration-300 ${expandedShoppingList ? 'rotate-180 text-[#f0f0f0]' : ''}`} />
             </button>
             
             <AnimatePresence>
               {expandedShoppingList && (
                 <motion.div
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: "auto", opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="overflow-hidden"
                 >
                   <div className="px-5 pb-5 pt-0 space-y-4">
                     <div className="h-px w-full bg-[rgba(255,255,255,0.04)] mb-4" />
                     <div className="flex flex-wrap gap-2">
                        {dietPlan.lista_compras.map((item: string, i: number) => (
                           <div key={i} className="px-3 py-1.5 rounded-full bg-[#111827] border border-[#1f2937] text-[#f0f0f0] text-[12px] font-medium">
                              {item}
                           </div>
                        ))}
                     </div>
                     <button 
                       onClick={() => {
                         navigator.clipboard.writeText(dietPlan.lista_compras.join('\\n'));
                         alert("Lista copiada para a área de transferência!");
                       }}
                       className="w-full h-[48px] bg-[#111827] text-[#f0f0f0] font-bold text-[12px] uppercase tracking-wider rounded-[12px] hover:bg-[#1f2937] border border-[#1f2937] transition-all flex items-center justify-center gap-2 mt-4"
                     >
                       <ShoppingCart className="w-4 h-4"/> Copiar Lista
                     </button>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-4 text-center">
          {dietMode === 'premium' ? (
            <p className="text-[12px] font-bold text-[#00ff88] uppercase tracking-widest"><Sparkles className="w-4 h-4 inline-block mr-1 -mt-1"/> Plano gerado com base na sua análise de shape</p>
          ) : (
            <div className="bg-[#080c10] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 max-w-sm mx-auto">
              <h4 className="text-[14px] font-bold text-[#f0f0f0] mb-2 uppercase tracking-wide">Quer mais precisão?</h4>
              <p className="text-[12px] text-[#6b7280] mb-4">Faça sua análise de shape por IA para receber um plano focado em corrigir suas assimetrias reais.</p>
              <button onClick={() => setActiveTab('analyze')} className="w-full h-[40px] bg-[#1f2937] text-[#f0f0f0] text-[11px] font-bold uppercase rounded-[10px] hover:bg-[#374151] transition-colors">Fazer Análise de Shape</button>
            </div>
          )}
        </div>

        {/* Floating Regenerate Button */}
        <button 
          onClick={() => {
            setDietPlan(null);
            setDietMode(null);
          }} 
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 md:right-8 bg-[#111827] border border-[#1f2937] text-[#f0f0f0] px-4 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 flex items-center gap-2 hover:border-[#6b7280] transition-colors active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-[12px] font-bold uppercase tracking-wider">Regerar</span>
        </button>
      </div>
    )}
  </motion.div>
)}
`
            {activeTab === "training" && (
  <motion.div
    key="training"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-4xl mx-auto space-y-6 pb-12 px-2"
  >
    {/* SUB-TAB NAV */}
    <div className="flex bg-[#0d1117] p-1 rounded-[16px] border border-[rgba(255,255,255,0.06)]">
      <button onClick={() => setTrainingTab('generator')} className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider rounded-[12px] transition-all ${trainingTab === 'generator' ? 'bg-[#1f2937] text-white' : 'text-[#6b7280]'}`}>Gerar Plano</button>
      <button onClick={() => setTrainingTab('my-plan')} className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider rounded-[12px] transition-all ${trainingTab === 'my-plan' ? 'bg-[#1f2937] text-white' : 'text-[#6b7280]'}`}>Meu Plano</button>
    </div>

    {trainingTab === 'generator' ? (
      <>
    {/* MODE SELECTION */}
    {!trainingPlan && !isGeneratingTraining && !trainingMode && (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0d1117] rounded-[24px] border border-[rgba(255,255,255,0.06)] min-h-[500px]">
        <div className="w-24 h-24 rounded-full bg-[#00ff88]/5 flex items-center justify-center mb-6">
          <Dumbbell className="w-12 h-12 text-[#00ff88]/50" />
        </div>
        <h2 className="text-[20px] font-display font-medium text-[#f0f0f0] mb-3 tracking-wide">ESCOLHA O TREINO</h2>
        <p className="text-[#6b7280] text-[14px] max-w-sm text-center mb-8">Treine com inteligência IA baseada no seu shape ou personalize o seu treino manual.</p>
        
        <div className="grid md:grid-cols-2 gap-4 w-full max-w-2xl">
          <button 
            onClick={() => setTrainingMode('premium')}
            className={`relative p-6 rounded-[20px] border flex flex-col items-start transition-all text-left group bg-[#0d1117] border-[#00ff88]/30 hover:border-[#00ff88] cursor-pointer`}
          >
            <div className="absolute top-4 right-4 px-2 py-1 bg-[#00ff88]/10 text-[#00ff88] text-[9px] font-bold uppercase rounded-md tracking-wider">Premium</div>
            <Sparkles className={`w-8 h-8 mb-4 ${!result ? 'text-[#6b7280]' : 'text-[#00ff88]'}`} />
            <h3 className="text-[16px] font-display text-[#f0f0f0] mb-1">Treino Inteligente</h3>
            <p className="text-[12px] text-[#6b7280]">Baseado na sua análise de shape e assimetrias.</p>
            {!result && <div className="mt-4 text-[10px] text-[#ffb800] bg-[#ffb800]/10 px-2 py-1 rounded">Faça uma análise de foto primeiro.</div>}
          </button>
          
          <button 
            onClick={() => setTrainingMode('free')}
            className="relative p-6 rounded-[20px] bg-[#0d1117] border border-[rgba(255,255,255,0.1)] hover:border-white/30 flex flex-col items-start transition-all cursor-pointer text-left group"
          >
            <div className="absolute top-4 right-4 px-2 py-1 bg-[#1f2937] text-[#f0f0f0] text-[9px] font-bold uppercase rounded-md tracking-wider">Grátis</div>
            <Dumbbell className="w-8 h-8 text-[#f0f0f0] mb-4" />
            <h3 className="text-[16px] font-display text-[#f0f0f0] mb-1">Treino Personalizado</h3>
            <p className="text-[12px] text-[#6b7280]">Calculado pelos seus dados manuais.</p>
          </button>
        </div>
      </div>
    )}

    {/* Redirect to My Plan if plan exists */}
    {trainingPlan && !isGeneratingTraining && !trainingMode && (
         <div className="flex flex-col items-center justify-center p-8 bg-[#0d1117] rounded-[24px] border border-[rgba(255,255,255,0.06)] min-h-[300px]">
             <h2 className="text-[20px] font-display font-medium text-[#f0f0f0] mb-4">Você já tem um treino!</h2>
             <button onClick={() => setTrainingTab('my-plan')} className="bg-[#00ff88] text-[#080c10] px-6 py-3 rounded-full font-bold uppercase text-[12px]">Ver Meu Treino</button>
         </div>
    )}

    {/* PREMIUM FORM */}
    {!trainingPlan && !isGeneratingTraining && trainingMode === 'premium' && (
      <div className="space-y-6 animate-fade-in-up">
        <button onClick={() => setTrainingMode(null)} className="flex items-center gap-2 text-[#6b7280] hover:text-[#f0f0f0] text-[12px] font-bold uppercase tracking-wider transition-colors pt-2"><ArrowLeft className="w-4 h-4"/> Voltar</button>
        
        {/* Resumo da Análise */}
        <div className="bg-[#111827] border-l-4 border-l-[#00ff88] border-y border-r border-[#1f2937] rounded-[20px] p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[14px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">Última Análise Salva</h3>
              <p className="text-[24px] font-display text-[#f0f0f0] leading-none">{result?.overallScore}<span className="text-[14px] text-[#6b7280]">/100</span></p>
            </div>
            <button onClick={() => setActiveTab('analyze')} className="bg-[#1f2937] text-[#f0f0f0] px-3 py-1.5 rounded-[8px] text-[10px] font-bold uppercase">Refazer Análise</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-2 text-center">
              <p className="text-[9px] text-[#6b7280] uppercase font-bold">BF%</p>
              <p className="text-[12px] font-bold text-[#f0f0f0]">{result?.bfEstimate}%</p>
            </div>
            <div className="bg-[#080c10] border border-[rgba(255,255,255,0.04)] rounded-[12px] p-2 text-center">
              <p className="text-[9px] text-[#6b7280] uppercase font-bold">Objetivo</p>
              <p className="text-[12px] font-bold text-[#ffb800]">{result?.recommendations?.dietPhase}</p>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="bg-[#0d1117] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 space-y-6">
          <h3 className="text-[18px] font-display text-[#f0f0f0] uppercase tracking-wide flex items-center gap-2"><Settings2 className="w-5 h-5 text-[#00ff88]"/> Ajustes de Treino</h3>
          
           <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Dias por Semana</label>
            <div className="flex gap-2">
              {[2,3,4,5,6].map(d => (
                <button key={d} onClick={() => setTrainingFormPremium(p => ({...p, trainingDays: d}))} className={`flex-1 aspect-square rounded-[10px] font-bold text-[14px] flex items-center justify-center transition-all border ${trainingFormPremium.trainingDays === d ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]' : 'bg-[#111827] border-[#1f2937] text-[#6b7280] hover:border-white/20'}`}>{d}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Equipamento</label>
            <div className="flex flex-wrap gap-2">
              {['Barra/Anilhas', 'Halteres', 'Máquinas', 'Polia', 'Peso Corporal'].map(e => (
                <button 
                  key={e}
                  onClick={() => setTrainingFormPremium(p => ({...p, equipment: p.equipment.includes(e) ? p.equipment.filter(x => x !== e) : [...p.equipment, e]}))}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border outline-none ${trainingFormPremium.equipment.includes(e) ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]' : 'bg-[#111827] border-[#1f2937] text-[#6b7280] hover:border-white/20'}`}
                >{e}</button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerateTrainingPremium} className="w-full h-[56px] bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-[#080c10] font-display text-[18px] uppercase tracking-wide rounded-[16px] active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(0,255,136,0.3)] mt-4">
            Gerar Treino
          </button>
        </div>
      </div>
    )}

    {/* FREE FORM */}
    {!trainingPlan && !isGeneratingTraining && trainingMode === 'free' && (
      <div className="space-y-6 animate-fade-in-up">
        <button onClick={() => setTrainingMode(null)} className="flex items-center gap-2 text-[#6b7280] hover:text-[#f0f0f0] text-[12px] font-bold uppercase tracking-wider transition-colors pt-2"><ArrowLeft className="w-4 h-4"/> Voltar</button>

        <div className="bg-[#0d1117] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 space-y-4">
          <h3 className="text-[18px] font-display text-[#f0f0f0] uppercase tracking-wide flex items-center gap-2"><Dumbbell className="w-5 h-5 text-[#3b82f6]"/> Criar Treino Manual</h3>
          
          <input type="text" placeholder="Nome do exercício" className="w-full p-4 rounded-[12px] bg-[#111827] border border-[#1f2937] text-white" 
            onChange={(e) => setTrainingFormFree(p => ({...p, manualExercise: e.target.value}))} />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Séries" className="p-4 rounded-[12px] bg-[#111827] border border-[#1f2937] text-white" 
                onChange={(e) => setTrainingFormFree(p => ({...p, manualSeries: e.target.value}))} />
            <input type="text" placeholder="Repetições" className="p-4 rounded-[12px] bg-[#111827] border border-[#1f2937] text-white" 
                onChange={(e) => setTrainingFormFree(p => ({...p, manualReps: e.target.value}))} />
            <select className="col-span-2 p-4 rounded-[12px] bg-[#111827] border border-[#1f2937] text-white" onChange={(e) => setTrainingFormFree(p => ({...p, manualDay: e.target.value}))}>
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
           }} className="w-full h-[56px] bg-[#1f2937] text-[#f0f0f0] font-display text-[16px] uppercase tracking-wide rounded-[16px] transition-all hover:bg-[#2d3748]">
            Adicionar Exercício
          </button>
          
           <button onClick={() => setTrainingMode(null)} className="w-full h-[56px] bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-[#080c10] font-display text-[18px] uppercase tracking-wide rounded-[16px] active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(0,255,136,0.3)] mt-4">
            Finalizar Treino
          </button>
        </div>
      </div>
    )}

    {/* LOADER */}
    {isGeneratingTraining && (
      <div className="flex flex-col items-center justify-center p-12 bg-[#0d1117] rounded-[24px] border border-[rgba(255,255,255,0.06)] min-h-[500px]">
        <div className="w-[120px] h-[120px] relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-[#00ff88]/10" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#00ff88] animate-[spin_1.5s_linear_infinite]" />
          <Dumbbell className="w-10 h-10 text-[#00ff88] animate-pulse drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]" />
        </div>
        <h2 className="text-[20px] font-display text-[#f0f0f0] animate-pulse tracking-wide">{trainingLoadingMessage}</h2>
      </div>
    )}
      </>
    ) : (
    // MEU PLANO TAB
    <div className="space-y-6 animate-fade-in-up">
        {trainingPlan ? (
            <div className="space-y-6">
                <div className="bg-[#0d1117] border border-white/5 rounded-[28px] p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                      <div className="space-y-1">
                        <h2 className="text-[18px] font-display text-white uppercase tracking-wider">Treino {trainingPlan.divisao}</h2>
                        <p className="text-[11px] text-[var(--color-neon)] font-bold uppercase tracking-widest">{trainingPlan.dias[trainingDayIndex].musculo_foco}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setIsEditing(!isEditing)} className="p-2 bg-white/5 rounded-xl text-[#6b7280] hover:text-white transition-colors">
                          <Settings2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                        <span>Progresso do Treino</span>
                        <span>0/{trainingPlan.dias[trainingDayIndex].exercicios.length} concluídos</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--color-neon)] transition-all" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                      {trainingPlan.dias.map((dia: any, i: number) => (
                          <button key={i} onClick={() => setTrainingDayIndex(i)} 
                            className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${trainingDayIndex === i ? 'bg-[var(--color-neon)] text-[#080c10] shadow-[0_0_15px_rgba(0,255,136,0.3)]' : 'bg-white/5 text-[#6b7280] hover:bg-white/10'}`}
                          >
                          {dia.nome_dia.substring(0,3)}
                          </button>
                      ))}
                    </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[12px] font-bold text-[#6b7280] uppercase tracking-widest">Exercícios</h3>
                    <button onClick={() => startWorkout(trainingPlan.dias[trainingDayIndex])} className="text-[11px] font-black text-[var(--color-neon)] uppercase tracking-wider bg-[var(--color-neon)]/10 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[var(--color-neon)]/20 transition-all">
                      <Play className="w-3.5 h-3.5 fill-current"/> Iniciar Todos
                    </button>
                  </div>

                  {trainingPlan.dias[trainingDayIndex].exercicios.map((ex: any, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="group relative bg-[#0d1117] border border-white/5 rounded-[24px] p-5 hover:border-[var(--color-neon)]/30 transition-all cursor-pointer overflow-hidden shadow-lg"
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
                                    }} className="bg-transparent text-[16px] font-bold text-white border-b border-white/10 outline-none" />
                                ) : (
                                    <h4 className="text-[16px] font-bold text-white group-hover:text-[var(--color-neon)] transition-colors">{ex.nome}</h4>
                                )}
                              </div>
                            </div>
                            <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#6b7280] hover:bg-[var(--color-neon)] hover:text-black transition-all">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </button>
                          </div>
                          
                          <div className="flex gap-4 relative z-10">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Séries</span>
                                {isEditing ? (
                                    <input value={ex.series} onChange={(e) => {
                                        const newPlan = {...trainingPlan};
                                        newPlan.dias[trainingDayIndex].exercicios[i].series = e.target.value;
                                        setTrainingPlan(newPlan);
                                    }} className="w-8 bg-transparent text-[11px] font-bold text-white border-b border-white/10 text-center outline-none" />
                                ) : (
                                    <span className="text-[11px] font-black text-white">{ex.series}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Reps</span>
                                {isEditing ? (
                                    <input value={ex.repeticoes} onChange={(e) => {
                                        const newPlan = {...trainingPlan};
                                        newPlan.dias[trainingDayIndex].exercicios[i].repeticoes = e.target.value;
                                        setTrainingPlan(newPlan);
                                    }} className="w-8 bg-transparent text-[11px] font-bold text-white border-b border-white/10 text-center outline-none" />
                                ) : (
                                    <span className="text-[11px] font-black text-white">{ex.repeticoes}</span>
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
            <div className="flex flex-col items-center justify-center p-12 bg-[#0d1117] rounded-[32px] border border-white/5 text-center">
              <Dumbbell className="w-12 h-12 text-[#6b7280] opacity-20 mb-4" />
              <p className="text-[#6b7280] text-[14px] uppercase font-bold tracking-widest">Nenhum plano gerado ainda.</p>
              <button onClick={() => setTrainingTab('generator')} className="mt-6 text-[11px] font-black text-[var(--color-neon)] uppercase tracking-wider border border-[var(--color-neon)]/30 px-6 py-2 rounded-full hover:bg-[var(--color-neon)]/10 transition-all">Ir para Gerador</button>
            </div>
        )}
    </div>

    )}
  </motion.div>
)}

            {activeTab === "evolution" && (
              <motion.div
                key="evolution"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                <div className="p-5 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div>
                      <h2 className="text-3xl font-black italic uppercase italic">
                        Dashboard de Evolução
                      </h2>
                      <p className="text-white/40 text-sm">
                        Acompanhe seu progresso mensal e métricas de elite.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setActiveTab("analyze")}
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Nova Entrada
                      </button>
                      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 self-start">
                        {(["1m", "6m", "all"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setEvolutionFilter(f)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${evolutionFilter === f ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-white/40 hover:bg-white/5"}`}
                          >
                            {f === "1m"
                              ? "1 Mês"
                              : f === "6m"
                                ? "6 Meses"
                                : "Tudo"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {[
                      {
                        label: "Média Treinos/Semana",
                        value: (completedWorkouts.length / 4).toFixed(1),
                        icon: <Dumbbell className="w-4 h-4" />,
                        color: "text-emerald-500",
                      },
                      {
                        label: "Consistência Dieta",
                        value: `${evolutionHistory[evolutionHistory.length - 1].consistency}%`,
                        icon: <Utensils className="w-4 h-4" />,
                        color: "text-blue-500",
                      },
                      {
                        label: "Meta de Água Batida",
                        value: `${Math.round((waterIntake / waterGoal) * 100)}% Hoje`,
                        icon: <Droplets className="w-4 h-4" />,
                        color: "text-cyan-500",
                      },
                      {
                        label: "Evolução de Score",
                        value: `+${evolutionHistory[evolutionHistory.length - 1].score - evolutionHistory[0].score}`,
                        icon: <TrendingUp className="w-4 h-4" />,
                        color: "text-orange-500",
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 group hover:border-white/10 transition-all"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}
                        >
                          {stat.icon}
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
                            {stat.label}
                          </p>
                          <p className="text-xl font-black italic text-white/90">
                            {stat.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="h-[300px] md:h-[350px] w-full bg-white/[0.01] rounded-3xl p-4 md:p-6 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <RechartsResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={
                          evolutionFilter === "1m"
                            ? evolutionHistory.slice(-2)
                            : evolutionFilter === "6m"
                              ? evolutionHistory.slice(-6)
                              : evolutionHistory
                        }
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff05"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#ffffff20"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          stroke="#ffffff20"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          dx={-10}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0A0A0B",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "16px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                            padding: "12px",
                          }}
                          itemStyle={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                          }}
                          labelStyle={{
                            fontSize: "10px",
                            color: "rgba(255,255,255,0.4)",
                            marginBottom: "8px",
                            fontWeight: "black",
                            textTransform: "uppercase",
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: "10px",
                            fontWeight: "black",
                            textTransform: "uppercase",
                            paddingBottom: "20px",
                            opacity: 0.6,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#10b981"
                          strokeWidth={4}
                          dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          name="Score Geral"
                        />
                        <Line
                          type="monotone"
                          dataKey="bf"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
                          name="BF %"
                        />
                        <Line
                          type="monotone"
                          dataKey="consistency"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                          name="Consistência %"
                        />
                      </LineChart>
                    </RechartsResponsiveContainer>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="text-lg font-black italic uppercase flex items-center gap-2">
                        <Camera className="w-5 h-5 text-emerald-500" /> Galeria
                        de Evolução Mensal
                      </h3>
                      <div className="flex items-center gap-2 md:gap-3">
                        <button
                          onClick={() => setShowGhostOverlay(!showGhostOverlay)}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showGhostOverlay ? "bg-orange-500 text-black" : "bg-white/5 text-white/40 border border-white/10"}`}
                        >
                          Ghost Overlay {showGhostOverlay ? "ON" : "OFF"}
                        </button>
                        <button className="text-[10px] font-black uppercase text-white/40 hover:text-emerald-500 transition-all border-b border-white/10">
                          Ver Todas as Fotos
                        </button>
                      </div>
                    </div>

                    {showGhostOverlay && evolutionHistory.length >= 2 && (
                      <div className="space-y-4">
                        <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] group">
                          {/* Current Photo (After) */}
                          <img
                            src={
                              evolutionHistory[evolutionHistory.length - 1]
                                .photo
                            }
                            className="absolute inset-0 w-full h-full object-cover"
                            alt="Current"
                          />
                          {/* Selected Photo (Before) */}
                          <img
                            src={evolutionHistory[comparisonIndex].photo}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{
                              clipPath: `inset(0 ${100 - ghostSlider}% 0 0)`,
                            }}
                            alt="Previous"
                          />
                          {/* Slider Line */}
                          <div
                            className="absolute top-0 bottom-0 w-1 bg-emerald-500 z-20"
                            style={{ left: `${ghostSlider}%` }}
                          >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                              <Zap className="w-4 h-4 text-black fill-current" />
                            </div>
                          </div>
                          {/* Invisible Range Input */}
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={ghostSlider}
                            onChange={(e) =>
                              setGhostSlider(Number(e.target.value))
                            }
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                          />
                          <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 z-20 pointer-events-none">
                            <p className="text-[10px] font-black uppercase text-emerald-500 text-center">
                              Comparação:{" "}
                              {evolutionHistory[comparisonIndex].date} vs Atual
                            </p>
                          </div>
                        </div>
                        <p className="text-center text-[10px] text-white/40 uppercase font-black">
                          Selecione uma foto abaixo para comparar
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
                      {evolutionHistory
                        .filter((e) => e.photo)
                        .map((entry, i) => {
                          const originalIndex = evolutionHistory.findIndex(
                            (e) => e.date === entry.date,
                          );
                          return (
                            <motion.div
                              key={i}
                              whileHover={{ scale: 1.05, y: -5 }}
                              onClick={() => {
                                if (showGhostOverlay) {
                                  setComparisonIndex(originalIndex);
                                }
                              }}
                              className={`aspect-[3/4] rounded-2xl overflow-hidden border relative group cursor-pointer shadow-xl transition-all ${showGhostOverlay && comparisonIndex === originalIndex ? "border-emerald-500 ring-2 ring-emerald-500/50" : "border-white/10"}`}
                            >
                              <img
                                src={entry.photo}
                                loading="lazy"
                                alt={entry.date}
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-3">
                                <span className="text-[10px] font-black uppercase text-white tracking-widest">
                                  {entry.date}
                                </span>
                                <span className="text-[8px] font-bold text-emerald-500 uppercase">
                                  {entry.weight}kg
                                </span>
                              </div>
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                <span className="text-[8px] font-black text-white/60">
                                  {i + 1}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      {/* Placeholder for missing months */}
                      {Array.from({
                        length: Math.max(
                          0,
                          6 - evolutionHistory.filter((e) => e.photo).length,
                        ),
                      }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-2 bg-white/[0.01] group hover:border-emerald-500/20 transition-all"
                        >
                          <Camera className="w-6 h-6 text-white/5 group-hover:text-emerald-500/20 transition-colors" />
                          <span className="text-[8px] font-black text-white/5 uppercase tracking-widest">
                            Mês{" "}
                            {evolutionHistory.filter((e) => e.photo).length +
                              i +
                              1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/40">
                      Histórico de Análises Detalhado
                    </h3>
                    <div className="grid gap-3">
                      {evolutionHistory
                        .slice()
                        .reverse()
                        .map((entry, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-5">
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-500/10 flex flex-col items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                                <span className="text-[10px] md:text-xs font-black text-emerald-500">
                                  {entry.date}
                                </span>
                                <span className="text-[7px] md:text-[8px] font-bold text-emerald-500/60 uppercase">
                                  2026
                                </span>
                              </div>
                              <div>
                                <p className="font-black italic uppercase text-xs md:text-sm tracking-tight">
                                  Check-in de Performance
                                </p>
                                <div className="flex flex-wrap gap-2 md:gap-3 mt-1">
                                  <span className="text-[9px] md:text-[10px] text-white/40 uppercase font-black">
                                    {entry.weight}kg
                                  </span>
                                  <span className="text-[9px] md:text-[10px] text-white/20 hidden md:inline">
                                    |
                                  </span>
                                  <span className="text-[9px] md:text-[10px] text-orange-500 uppercase font-black">
                                    {entry.bf}% BF
                                  </span>
                                  <span className="text-[9px] md:text-[10px] text-white/20 hidden md:inline">
                                    |
                                  </span>
                                  <span className="text-[9px] md:text-[10px] text-blue-500 uppercase font-black">
                                    {entry.consistency}% Consistência
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                <p className="text-2xl font-black italic text-emerald-500 leading-none">
                                  {entry.score}
                                </p>
                              </div>
                              <p className="text-[8px] font-black uppercase text-white/20 mt-1">
                                Score de Elite
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                    {/* Premium Card Integration */}
                    {!isPremium && (
                      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Crown className="w-6 h-6 text-black" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500">
                              Upgrade Padrão Ouro
                            </h4>
                            <p className="text-xs text-white/60">
                              Quer levar seu shape ao próximo nível? Conheça o
                              Plano Padrão Ouro.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPremiumModal(true)}
                          className="px-6 py-3 bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-emerald-400 transition-all"
                        >
                          Saiba Mais
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "coach" && (
              <motion.div
                key="coach"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-3xl mx-auto h-[70vh] md:h-[600px] flex flex-col rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <Shield className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Treinador IA Elite</h4>
                      <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />{" "}
                        Online Agora
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/5 rounded-full transition-all">
                    <Info className="w-5 h-5 text-white/20" />
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
                            className="p-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white/60 hover:bg-emerald-500 hover:text-black hover:border-emerald-400 transition-all text-left"
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
                        className={`max-w-[90%] p-4 rounded-2xl text-sm ${msg.role === "user" ? "bg-emerald-500 text-black font-medium" : "bg-white/5 border border-white/10 text-white/80"}`}
                      >
                        {msg.role === "user"
                          ? msg.text
                          : renderCoachMessage(msg.text)}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-1">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-black/50 border-t border-white/5">
                  <div className="relative">
                    <input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Pergunte algo ao Coach..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-500 text-black rounded-xl font-bold hover:bg-emerald-400 transition-all"
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
                <div className="bg-[#111] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase italic">
                      {selectedExercise}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedExercise(null);
                        setExerciseDetail(null);
                      }}
                      className="p-2 hover:bg-white/5 rounded-full"
                    >
                      <RefreshCw className="w-5 h-5 rotate-45" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                    {isFetchingExercise ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                        <p className="text-xs font-bold uppercase tracking-widest text-white/40">
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
                className="fixed inset-0 z-[100] bg-[var(--color-bg-deep)] text-white flex flex-col"
              >
                {/* Header */}
                <div className="h-[72px] px-6 flex items-center justify-between border-b border-white/5 bg-[var(--color-bg-card)]/50 backdrop-blur-xl">
                  <button 
                    onClick={() => {
                      if (confirm('Deseja realmente sair do treino? Seu progresso atual não será salvo.')) {
                        setIsWorkoutActive(false);
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <h3 className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.2em] mb-0.5">Treino Ativo</h3>
                    <p className="text-[14px] font-display font-medium text-white uppercase tracking-wider">{activeWorkoutSession.dayName}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[var(--color-neon)]/10 px-3 py-1.5 rounded-xl border border-[var(--color-neon)]/20">
                    <Clock className="w-3.5 h-3.5 text-[var(--color-neon)]" />
                    <span className="text-[12px] font-black text-[var(--color-neon)] font-mono">{formatTime(elapsedTime)}</span>
                  </div>
                </div>

                {/* Progress Bar Top */}
                <div className="px-6 py-4 bg-[var(--color-bg-card)]/30">
                  <div className="flex justify-between text-[9px] font-bold text-[#6b7280] uppercase tracking-widest mb-2">
                    <span>Progresso do Treino</span>
                    <span>{currentExerciseIndex + 1} de {activeWorkoutSession.exercises.length} exercícios</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
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
                        <h2 className="text-[28px] font-display font-bold text-white uppercase tracking-tight">TREINO FINALIZADO!</h2>
                        <p className="text-[#6b7280] text-[14px] max-w-xs">Parabéns! Mais um degrau subido na sua evolução física. O shape está vindo.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                          <p className="text-[10px] font-bold text-[#6b7280] uppercase mb-1">Tempo Total</p>
                          <p className="text-[18px] font-black text-white">{formatTime(elapsedTime)}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                          <p className="text-[10px] font-bold text-[#6b7280] uppercase mb-1">Exercícios</p>
                          <p className="text-[18px] font-black text-white">{activeWorkoutSession.exercises.length}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsWorkoutActive(false)}
                        className="w-full max-w-sm py-4 bg-[var(--color-neon)] text-[#050505] font-black uppercase tracking-widest rounded-2xl shadow-[0_0_25px_rgba(0,255,136,0.4)]"
                      >
                        Salvar e Sair
                      </button>
                    </motion.div>
                  ) : (
                    <div className="p-6 space-y-8">
                      {/* Exercise Header */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-[var(--color-neon)]/20 text-[var(--color-neon)] px-2 py-0.5 rounded-md uppercase tracking-widest border border-[var(--color-neon)]/20">
                            {activeWorkoutSession.exercises[currentExerciseIndex].musculo_foco || 'Base'}
                          </span>
                        </div>
                        <h2 className="text-[32px] font-display font-bold leading-none text-white">{activeWorkoutSession.exercises[currentExerciseIndex].nome}</h2>
                      </div>

                      {/* Animation Placeholder */}
                      <div className="aspect-video w-full bg-[var(--color-bg-card)] rounded-[32px] border border-white/5 flex items-center justify-center relative overflow-hidden group shadow-inner">
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-deep)] to-transparent opacity-40"></div>
                        <Dumbbell className="w-16 h-16 text-[var(--color-neon)] opacity-30 animate-pulse" />
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                           <button 
                             onClick={() => handleShowExerciseDetail(activeWorkoutSession.exercises[currentExerciseIndex].nome)}
                             className="text-[10px] font-bold text-[#6b7280] uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:text-white transition-colors"
                           >
                             Ver Dica de Execução
                           </button>
                        </div>
                      </div>

                      {/* Series Tracking */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[12px] font-bold text-[#6b7280] uppercase tracking-widest">Séries & Repetições</h4>
                          <span className="text-[14px] font-black text-white">Série {currentSetIndex + 1} de {activeWorkoutSession.exercises[currentExerciseIndex].series}</span>
                        </div>

                        {/* Set Indicators */}
                        <div className="flex gap-2">
                          {Array.from({ length: parseInt(activeWorkoutSession.exercises[currentExerciseIndex].series) || 3 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < currentSetIndex ? 'bg-[var(--color-neon)] shadow-[0_0_8px_var(--color-neon)]' : i === currentSetIndex ? 'bg-white/20 animate-pulse' : 'bg-white/5'}`}
                            ></div>
                          ))}
                        </div>

                        {/* Rep Counter */}
                        <div className="bg-[var(--color-bg-card)] rounded-[32px] p-8 border border-white/5 flex items-center justify-between shadow-2xl relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-neon)]/10"></div>
                           <div className="text-center flex-1">
                             <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.2em] mb-2">Meta</p>
                             <p className="text-[32px] font-black text-white">{activeWorkoutSession.exercises[currentExerciseIndex].repeticoes}</p>
                           </div>
                           <div className="w-[2px] h-12 bg-white/5"></div>
                           <div className="text-center flex-1">
                             <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.2em] mb-2">Sua Carga</p>
                             <div className="flex items-center justify-center gap-2">
                                <span className="text-[24px] font-black text-[var(--color-neon)]">—</span>
                                <span className="text-[10px] font-bold text-[#6b7280]">KG</span>
                             </div>
                           </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {workoutStatus === 'resting' ? (
                        <div className="bg-[var(--color-neon)]/5 border border-[var(--color-neon)]/20 rounded-[32px] p-8 text-center space-y-6 relative overflow-hidden">
                          <motion.div 
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
                            className="absolute inset-0 bg-gradient-to-br from-[var(--color-neon)]/5 to-transparent pointer-events-none"
                          ></motion.div>
                          <div className="relative z-10">
                            <p className="text-[12px] font-bold text-[#6b7280] uppercase tracking-widest mb-2">Tempo de Descanso</p>
                            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                              <svg className="w-full h-full -rotate-90">
                                <circle 
                                  cx="64" cy="64" r="60" 
                                  stroke="currentColor" 
                                  strokeWidth="6" 
                                  fill="transparent" 
                                  className="text-white/5"
                                />
                                <motion.circle 
                                  cx="64" cy="64" r="60" 
                                  stroke="currentColor" 
                                  strokeWidth="6" 
                                  fill="transparent" 
                                  className="text-[var(--color-neon)]"
                                  strokeDasharray="377"
                                  animate={{ strokeDashoffset: 377 - (377 * (restTimeLeft / 60)) }}
                                  transition={{ duration: 1, ease: 'linear' }}
                                />
                              </svg>
                              <span className="absolute text-[32px] font-mono font-black text-white">{restTimeLeft}s</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setWorkoutStatus('exercising');
                              setRestTimeLeft(0);
                            }}
                            className="w-full relative z-10 py-4 bg-white/5 text-white font-bold uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                          >
                            Pular Descanso
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            const totalSets = parseInt(activeWorkoutSession.exercises[currentExerciseIndex].series) || 3;
                            if (currentSetIndex + 1 < totalSets) {
                              setCurrentSetIndex(prev => prev + 1);
                              setWorkoutStatus('resting');
                              setRestTimeLeft(60);
                              if (navigator.vibrate) navigator.vibrate(100);
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
                          className="w-full h-[80px] bg-[var(--color-neon)] text-[#050505] font-black text-[16px] uppercase tracking-[0.2em] rounded-[24px] shadow-[0_10px_30px_rgba(0,255,136,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                          <Check className="w-6 h-6 stroke-[4px]" /> Concluir Série
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                {workoutStatus !== 'completed' && (
                  <div className="p-6 bg-[var(--color-bg-card)]/50 backdrop-blur-xl border-t border-white/5 flex gap-4">
                    <button 
                      disabled={currentExerciseIndex === 0}
                      onClick={() => {
                        setCurrentExerciseIndex(prev => prev - 1);
                        setCurrentSetIndex(0);
                        setWorkoutStatus('exercising');
                      }}
                      className="flex-1 py-4 bg-white/5 text-[#6b7280] disabled:opacity-30 font-bold uppercase tracking-widest rounded-2xl border border-white/5"
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
                      className="flex-1 py-4 bg-white/10 text-white font-bold uppercase tracking-widest rounded-2xl border border-white/10"
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
        <nav className="fixed bottom-6 left-6 right-6 z-[60] bg-[#0d1117]/80 backdrop-blur-2xl border border-white/5 rounded-[32px] pb-[env(safe-area-inset-bottom)] px-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between h-[72px]">
            {[
              { id: "dashboard", icon: <Target />, label: "Início" },
              { id: "analyze", icon: <Camera />, label: "Análise" },
              { id: "diet", icon: <Utensils />, label: "Dieta" },
              { id: "training", icon: <Dumbbell />, label: "Treino" },
              { id: "evolution", icon: <TrendingUp />, label: "Evolução" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center gap-1 transition-all p-2 rounded-2xl ${activeTab === tab.id ? "text-[var(--color-neon)]" : "text-[#6b7280] hover:text-white"}`}
              >
                <div className={`${activeTab === tab.id ? "scale-100" : "scale-90"}`}>{tab.icon}</div>
                <span className="text-[9px] uppercase font-bold tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
