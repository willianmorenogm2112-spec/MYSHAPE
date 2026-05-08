import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, Camera, Zap, Target, Shield, Info, RefreshCw, 
  ChevronRight, Award, Dumbbell, Utensils, MessageSquare, 
  TrendingUp, TrendingDown, Scale, Calculator, Crown, Play, Box, Video, Trophy, Sparkles, Lock,
  Droplets, Flame, Calendar, Check, Minus, Clock, X, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  ResponsiveContainer
} from 'recharts';
import { analyzeShape, chatWithCoach, projectShape, generatePersonalizedTraining, generateMealPlan, getExerciseDetails, generateShoppingList, generateRouteDayPlan, analyzeFoodPhoto, analyzeExerciseVideo } from './services/geminiService';
import { ShapeAnalysis, UserProfile, EvolutionEntry, TrainingPlan, MealPlan } from './types';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer as RechartsResponsiveContainer } from 'recharts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'diet' | 'training' | 'coach' | 'evolution'>('analyze');
  const [isCompetitionMode, setIsCompetitionMode] = useState(false);
  const [isPumpMode, setIsPumpMode] = useState(false);
  const [images, setImages] = useState<{ front?: string; back?: string; side?: string }>({});
  const [profile, setProfile] = useState<UserProfile>({ weight: 80, height: 180, goal: 'Recomposição' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProjecting, setIsProjecting] = useState(false);
  const [projectedImage, setProjectedImage] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [evolutionFilter, setEvolutionFilter] = useState<'1m' | '6m' | 'all'>('all');
  const [projectionValue, setProjectionValue] = useState(50);
  const [showComparison, setShowComparison] = useState(false);
  const [showGhostOverlay, setShowGhostOverlay] = useState(false);
  const [personalizedTraining, setPersonalizedTraining] = useState<TrainingPlan | null>(null);
  const [isGeneratingTraining, setIsGeneratingTraining] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false);
  const [shoppingList, setShoppingList] = useState<any>(null);
  const [routeDayPlan, setRouteDayPlan] = useState<any>(null);
  const [isGeneratingShoppingList, setIsGeneratingShoppingList] = useState(false);
  const [isGeneratingRouteDayPlan, setIsGeneratingRouteDayPlan] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [showRouteDayModal, setShowRouteDayModal] = useState(false);
  const [isAnalyzingFood, setIsAnalyzingFood] = useState(false);
  const [foodAnalysis, setFoodAnalysis] = useState<any>(null);
  const [isAnalyzingExercise, setIsAnalyzingExercise] = useState(false);
  const [exerciseAnalysis, setExerciseAnalysis] = useState<any>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [lastDietGenerationDate, setLastDietGenerationDate] = useState<string | null>(null);
  const [lastTrainingGenerationDate, setLastTrainingGenerationDate] = useState<string | null>(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const waterGoal = 3500; // 3.5 Liters

  useEffect(() => {
    if (subscriptionExpiryDate) {
      const expiry = new Date(subscriptionExpiryDate);
      const now = new Date();
      if (now > expiry) {
        setIsPremium(false);
        setSubscriptionExpiryDate(null);
        alert('Sua assinatura Padrão Ouro expirou. Renove para manter seu progresso!');
      }
    }
  }, [subscriptionExpiryDate]);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
    if (!hasSeenOnboarding) {
      setShowOnboardingModal(true);
    }
    loadData();
  }, []);

  const handleFinishOnboarding = () => {
    localStorage.setItem('has_seen_onboarding', 'true');
    setShowOnboardingModal(false);
  };

  const handleAddWater = (amount: number) => {
    setWaterIntake(prev => {
      const newVal = Math.min(prev + amount, waterGoal * 1.5);
      return newVal;
    });
  };

  const handleResetWater = () => {
    setWaterIntake(0);
  };

  const handleAnalyzeExercise = async (videoFile: File) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setIsAnalyzingExercise(true);
    setExerciseAnalysis(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(videoFile);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const analysis = await analyzeExerciseVideo(base64);
        setExerciseAnalysis(analysis);
        setIsAnalyzingExercise(false);
      };
    } catch (error) {
      console.error(error);
      alert('Erro ao analisar vídeo. Tente novamente.');
      setIsAnalyzingExercise(false);
    }
  };

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
      completedWorkouts
    };
    localStorage.setItem('shape_analyzer_data', JSON.stringify(data));
    // Removed intrusive alert
  };

  const loadData = () => {
    const saved = localStorage.getItem('shape_analyzer_data');
    if (saved) {
      const data = JSON.parse(saved);
      setProfile(data.profile || profile);
      setAnalysisCount(data.analysisCount || analysisCount);
      setWaterIntake(data.waterIntake || waterIntake);
      setEvolutionHistory(data.evolutionHistory || evolutionHistory);
      setPersonalizedTraining(data.personalizedTraining || personalizedTraining);
      setMealPlan(data.mealPlan || mealPlan);
      setIsPremium(data.isPremium || isPremium);
      setSubscriptionExpiryDate(data.subscriptionExpiryDate || subscriptionExpiryDate);
      setLastDietGenerationDate(data.lastDietGenerationDate || lastDietGenerationDate);
      setLastTrainingGenerationDate(data.lastTrainingGenerationDate || lastTrainingGenerationDate);
      setCompletedWorkouts(data.completedWorkouts || completedWorkouts);
      // Removed intrusive alert
    }
  };

  const [result, setResult] = useState<ShapeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'coach'; text: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [limitResult, setLimitResult] = useState<{ maxMass: number; currentMass: number } | null>(null);
  const [evolutionHistory, setEvolutionHistory] = useState<EvolutionEntry[]>([
    { date: 'Out', score: 58, bf: 22, weight: 90, volume: 50, definition: 40, symmetry: 60, consistency: 70, photo: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80' },
    { date: 'Nov', score: 60, bf: 21, weight: 88, volume: 52, definition: 45, symmetry: 62, consistency: 75, photo: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80' },
    { date: 'Dez', score: 62, bf: 20, weight: 87, volume: 55, definition: 50, symmetry: 65, consistency: 78, photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80' },
    { date: 'Jan', score: 65, bf: 18, weight: 85, volume: 60, definition: 55, symmetry: 70, consistency: 80, photo: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=400&q=80' },
    { date: 'Fev', score: 68, bf: 17, weight: 84, volume: 62, definition: 58, symmetry: 72, consistency: 85, photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80' },
    { date: 'Mar', score: 72, bf: 16, weight: 82, volume: 65, definition: 65, symmetry: 75, consistency: 90, photo: 'https://images.unsplash.com/photo-1517838276537-222297432acc?w=400&q=80' },
  ]);
  const [dietAnswers, setDietAnswers] = useState<{
    objective?: string;
    activityLevel?: string;
    mealsPerDay?: number;
  }>({});
  const [showDietQuiz, setShowDietQuiz] = useState(true);
  const [trainingAnswers, setTrainingAnswers] = useState<{
    daysPerWeek?: number;
    experienceLevel?: string;
    injuries?: string;
    focus?: string;
    selectedDays?: string[];
  }>({
    selectedDays: []
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
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      setExerciseDetail('Erro ao carregar detalhes do exercício.');
    } finally {
      setIsFetchingExercise(false);
    }
  };

  const handleSwapFood = (mealName: string) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    console.log(`Trocando alimento para: ${mealName}. Nossa IA está calculando o melhor substituto...`);
  };

  const handleFinishWorkout = () => {
    const today = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][new Date().getDay()];
    handleCheckIn(today);
  };

  const renderCoachMessage = (text: string) => {
    const parts = text.split(/(\[BUTTON:[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[BUTTON:')) {
        const btnParts = part.slice(1, -1).split(':');
        const type = btnParts[1];
        const value = btnParts[2];
        
        if (type === 'VIEW_EXERCISE') {
          return (
            <button 
              key={i}
              onClick={() => handleShowExerciseDetail(value)}
              className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2 my-4"
            >
              <Dumbbell className="w-4 h-4" /> Ver Biomecânica: {value}
            </button>
          );
        }
        if (type === 'SWAP_FOOD') {
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
        if (type === 'FINISH_WORKOUT') {
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
        <div key={i} className="prose prose-invert prose-emerald max-w-none prose-sm">
          <Markdown rehypePlugins={[rehypeRaw]}>{part}</Markdown>
        </div>
      );
    });
  };

  const handleProjectShape = async (type: 'fat-loss' | 'muscle-gain') => {
    if (!images.front) return;
    setIsProjecting(true);
    try {
      const projected = await projectShape(images.front, type);
      setProjectedImage(projected);
    } catch (err) {
      console.error(err);
      setError('Erro ao projetar o shape.');
    } finally {
      setIsProjecting(false);
    }
  };

  const handleGenerateTraining = async () => {
    if (!result) return;
    
    if (!isPremium && lastTrainingGenerationDate) {
      const last = new Date(lastTrainingGenerationDate);
      const now = new Date();
      const diff = now.getTime() - last.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      if (days < 7) {
        alert('No plano Free, você só pode gerar um novo treino uma vez por semana.');
        setShowPremiumModal(true);
        return;
      }
    }

    setIsGeneratingTraining(true);
    setShowTrainingQuiz(false);
    try {
      const plan = await generatePersonalizedTraining(result, profile, trainingAnswers);
      setPersonalizedTraining(plan);
      setLastTrainingGenerationDate(new Date().toISOString());
      if (trainingAnswers.selectedDays) {
        setProfile(prev => ({ ...prev, trainingDays: trainingAnswers.selectedDays }));
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao gerar treino personalizado.');
    } finally {
      setIsGeneratingTraining(false);
    }
  };

  const handleCheckIn = (day: string) => {
    const today = new Date().toISOString().split('T')[0];
    const checkInId = `${today}_${day}`;
    if (completedWorkouts.includes(checkInId)) {
      setCompletedWorkouts(prev => prev.filter(id => id !== checkInId));
    } else {
      setCompletedWorkouts(prev => [...prev, checkInId]);
      
      // Update evolution history with new consistency
      const totalDays = profile.trainingDays?.length || 0;
      if (totalDays > 0) {
        const completedTodayCount = completedWorkouts.filter(id => id.startsWith(today)).length + 1;
        const consistency = Math.min(100, Math.round((completedTodayCount / totalDays) * 100));
        
        setEvolutionHistory(prev => {
          const last = prev[prev.length - 1];
          const newEntry = { ...last, consistency };
          return [...prev.slice(0, -1), newEntry];
        });
      }
    }
  };

  const toggleExerciseCompletion = (dayIndex: number, exerciseIndex: number) => {
    if (!personalizedTraining) return;
    const newPlan = { ...personalizedTraining };
    const exercise = newPlan.days[dayIndex].exercises[exerciseIndex];
    exercise.completed = !exercise.completed;
    setPersonalizedTraining({ ...newPlan });
  };

  const handleGenerateMealPlan = async () => {
    if (!result) return;

    if (!isPremium && lastDietGenerationDate) {
      const last = new Date(lastDietGenerationDate);
      const now = new Date();
      const diff = now.getTime() - last.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      if (days < 7) {
        alert('No plano Free, você só pode gerar uma nova dieta uma vez por semana.');
        setShowPremiumModal(true);
        return;
      }
    }

    setIsGeneratingMealPlan(true);
    try {
      const plan = await generateMealPlan(result, profile, dietAnswers);
      setMealPlan(plan);
      setLastDietGenerationDate(new Date().toISOString());
      setShowDietQuiz(false);
    } catch (err) {
      console.error(err);
      setError('Erro ao gerar plano de refeições.');
    } finally {
      setIsGeneratingMealPlan(false);
    }
  };

  const handleGenerateShoppingList = async () => {
    if (!mealPlan) {
      setError('Gere um plano de refeições primeiro.');
      return;
    }
    setIsGeneratingShoppingList(true);
    try {
      const list = await generateShoppingList(mealPlan);
      setShoppingList(list);
      setShowShoppingListModal(true);
    } catch (err) {
      console.error(err);
      setError('Erro ao gerar lista de compras.');
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
      setError('Erro ao gerar plano de rota.');
    } finally {
      setIsGeneratingRouteDayPlan(false);
    }
  };

  const handleFoodPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setError('Erro ao analisar foto de comida.');
        } finally {
          setIsAnalyzingFood(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExerciseVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setError('Erro ao analisar vídeo de exercício.');
        } finally {
          setIsAnalyzingExercise(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (type: 'front' | 'back' | 'side') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => ({ ...prev, [type]: reader.result as string }));
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!images.front) {
      setError('Pelo menos a foto de frente é necessária para análise.');
      return;
    }
    if (!isPremium && analysisCount >= 3) {
      setShowPremiumModal(true);
      return;
    }
    
    setIsScanning(true);
    setError(null);
    
    // Simulate scanning animation for 1.5 seconds
    setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const data = await analyzeShape(images, { weight: profile.weight, goal: profile.goal }, isPumpMode);
        setResult(data);
        setAnalysisCount(prev => prev + 1);
        
        // Update evolution history
        const today = new Date().toLocaleDateString('pt-BR', { month: 'short' });
        setEvolutionHistory(prev => [...prev, {
          date: today,
          score: data.overallScore,
          bf: data.bfEstimate,
          weight: profile.weight,
          volume: data.metrics.volume,
          definition: data.metrics.definition,
          symmetry: data.metrics.symmetry,
          consistency: 0,
          photo: images.front
        }]);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro ao analisar o shape. Verifique sua conexão ou chave de API.');
      } finally {
        setIsAnalyzing(false);
        setIsScanning(false);
      }
    }, 1500);
  };

  const handleSendMessage = async (msg?: string) => {
    const messageToSend = msg || inputMessage;
    if (!messageToSend.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', text: messageToSend }]);
    if (!msg) setInputMessage('');
    setIsChatLoading(true);
    try {
      const response = await chatWithCoach(messageToSend, { result, profile });
      setChatMessages(prev => [...prev, { role: 'coach', text: response || 'Desculpe, tive um problema.' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'coach', text: 'Erro ao conectar com o coach.' }]);
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
    
    const maxMassLbs = Math.pow(h, 1.5) * (Math.sqrt(w)/22.66 + Math.sqrt(a)/17.01) * (bf/224 + 1);
    const maxMassKg = maxMassLbs * 0.453592;
    
    setLimitResult({
      maxMass: Math.round(maxMassKg),
      currentMass: profile.weight
    });
  };

  const radarData = result ? [
    { subject: 'Volume', A: result.metrics.volume, fullMark: 100 },
    { subject: 'Definição', A: result.metrics.definition, fullMark: 100 },
    { subject: 'Simetria', A: result.metrics.symmetry, fullMark: 100 },
    { subject: 'Densidade', A: result.metrics.density, fullMark: 100 },
  ] : [];

  const OnboardingModal = () => (
    <AnimatePresence>
      {showOnboardingModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[#0A0A0B] border border-emerald-500/30 rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full relative overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.15)]"
          >
            {/* Background Glows */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/5 blur-[120px] rounded-full" />

            <div className="relative z-10 space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <Zap className="w-7 h-7 text-black fill-current" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">
                    Meu <span className="text-emerald-500">Shape</span>
                  </h1>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight uppercase">
                  BEM-VINDO AO SEU NOVO FÍSICO!
                </h2>
                <p className="text-white/40 text-sm max-w-md mx-auto">
                  A inteligência artificial de elite para transformar sua estética e performance.
                </p>
              </div>

              {/* Content Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Free Resources */}
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-500 font-black uppercase text-[10px] tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Recursos Gratuitos
                  </div>
                  <h3 className="text-sm font-bold">Comece sua evolução agora:</h3>
                  <ul className="space-y-3">
                    {[
                      { icon: <Camera className="w-4 h-4" />, text: "3 Análises de Shape/mês (BF e Simetria)" },
                      { icon: <Dumbbell className="w-4 h-4" />, text: "Protocolo de Treino Básico adaptado" },
                      { icon: <Utensils className="w-4 h-4" />, text: "Sugestão de Dieta Base (Macros)" }
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs text-white/60">
                        <div className="p-1.5 rounded-lg bg-white/5 text-emerald-500">
                          {item.icon}
                        </div>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Premium Resources */}
                <div className="p-6 rounded-3xl bg-amber-500/[0.02] border border-amber-500/30 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full -mr-12 -mt-12" />
                  <div className="absolute top-4 right-4">
                    <Crown className="w-5 h-5 text-amber-500 fill-current animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 text-amber-500 font-black uppercase text-[10px] tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
                    Padrão Ouro
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-tight">DESBLOQUEIE O PADRÃO OURO (OPCIONAL):</h3>
                  <ul className="space-y-3">
                    {[
                      { icon: <Zap className="w-4 h-4" />, text: "Análises Ilimitadas" },
                      { icon: <Camera className="w-4 h-4" />, text: "Foto-Dieta IA Instantânea" },
                      { icon: <TrendingUp className="w-4 h-4" />, text: "Exercícios Corretivos e Biomecânica" },
                      { icon: <MessageSquare className="w-4 h-4" />, text: "Chat Direto com Coach IA 24/7" }
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs text-white/80">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                          {item.icon}
                        </div>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleFinishOnboarding}
                className="w-full py-5 bg-emerald-500 text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)]"
              >
                ENTRAR NO MEU SHAPE
              </button>
            </div>
          </motion.div>
        </motion.div>
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
            className="bg-[#0A0A0B] border-2 border-amber-500/50 rounded-[2.5rem] p-8 max-w-md w-full relative overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.2)]"
          >
            {/* Background Glows */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[100px] rounded-full" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-5 h-5 text-amber-500 fill-current" />
                    <span className="text-amber-500 font-black uppercase text-[10px] tracking-[0.3em]">Upgrade de Elite</span>
                  </div>
                  <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Padrão <span className="text-amber-500">Ouro</span></h2>
                  <p className="text-white/40 text-xs mt-1">Domine sua genética com tecnologia de ponta.</p>
                </div>
                <button onClick={() => setShowPremiumModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6 text-white/20" />
                </button>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  { icon: <Zap className="w-5 h-5 text-amber-500" />, title: "Análises Ilimitadas", desc: "Sem limites de 3 fotos por mês." },
                  { icon: <Target className="w-5 h-5 text-amber-500" />, title: "Coach IA Elite", desc: "Respostas instantâneas e profundas." },
                  { icon: <Sparkles className="w-5 h-5 text-amber-500" />, title: "Projeção de Futuro", desc: "Veja seu shape com 5% de BF." },
                  { icon: <Shield className="w-5 h-5 text-amber-500" />, title: "Biomecânica Avançada", desc: "Análise de vídeo dos seus treinos." },
                  { icon: <Box className="w-5 h-5 text-amber-500" />, title: "Rota Ativa", desc: "Ajustes diários na sua dieta e treino." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/40 transition-all group">
                    <div className="mt-1 group-hover:scale-110 transition-transform p-2 rounded-xl bg-amber-500/10">{item.icon}</div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight">{item.title}</h4>
                      <p className="text-white/30 text-[10px] leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => {
                    setIsPremium(true);
                    setSubscriptionExpiryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
                    setShowPremiumModal(false);
                    saveData();
                  }}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all text-left group"
                >
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest block mb-1">Mensal</span>
                  <span className="text-white font-black text-xl block tracking-tighter">R$ 29,90</span>
                </button>
                <button 
                  onClick={() => {
                    setIsPremium(true);
                    setSubscriptionExpiryDate(null); // Lifetime
                    setShowPremiumModal(false);
                    saveData();
                  }}
                  className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500 text-left relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 bg-amber-500 text-[8px] font-black px-2 py-0.5 rounded-bl-lg text-black">VITALÍCIO</div>
                  <span className="text-amber-500/60 text-[10px] font-black uppercase tracking-widest block mb-1">Único</span>
                  <span className="text-white font-black text-xl block tracking-tighter">R$ 197,00</span>
                </button>
              </div>

              <button 
                onClick={() => {
                  setIsPremium(true);
                  setSubscriptionExpiryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
                  setShowPremiumModal(false);
                  saveData();
                }}
                className="w-full py-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_0_40px_rgba(245,158,11,0.3)] active:scale-95"
              >
                QUERO MEU SHAPE DE ELITE
              </button>
              <p className="text-center text-white/20 text-[9px] mt-6 uppercase tracking-[0.2em] font-medium">Garantia de 7 dias ou seu dinheiro de volta</p>
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
                <Box className="w-6 h-6 text-emerald-500" /> Lista de Compras Inteligente
              </h2>
              <button onClick={() => setShowShoppingListModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {shoppingList.categories.map((cat: any, i: number) => (
                <div key={i} className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg inline-block">{cat.name}</h3>
                  <div className="space-y-2">
                    {cat.items.map((item: any, j: number) => (
                      <div key={j} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-sm text-white/80">{item.name}</span>
                        <span className="text-xs font-bold text-emerald-500">{item.amount}</span>
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
                <Sparkles className="w-6 h-6 text-orange-500" /> Dia de Rota (Sugestões)
              </h2>
              <button onClick={() => setShowRouteDayModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-4">
              {routeDayPlan.suggestions.map((s: any, i: number) => (
                <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">{s.meal}</span>
                    <span className="text-xs font-bold text-white/40">{s.place}</span>
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
              <button onClick={() => setFoodAnalysis(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Cal', val: foodAnalysis.totalMacros.calories, color: 'text-emerald-500' },
                  { label: 'Prot', val: foodAnalysis.totalMacros.protein, color: 'text-blue-500' },
                  { label: 'Carb', val: foodAnalysis.totalMacros.carbs, color: 'text-orange-500' },
                  { label: 'Gord', val: foodAnalysis.totalMacros.fats, color: 'text-red-500' },
                ].map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">{m.label}</p>
                    <p className={`text-sm font-black ${m.color}`}>{m.val}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Itens Identificados</h4>
                {foodAnalysis.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-sm text-white/80">{item.name} ({item.estimatedWeight}g)</span>
                    <span className="text-xs font-bold text-emerald-500">{item.calories} kcal</span>
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
              <button onClick={() => setExerciseAnalysis(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Exercício</p>
                  <h3 className="text-lg font-black italic uppercase">{exerciseAnalysis.exerciseName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Score Técnico</p>
                  <p className="text-2xl font-black text-blue-500">{exerciseAnalysis.biomechanicsScore}%</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1">
                  <X className="w-3 h-3" /> Erros Identificados
                </h4>
                <div className="space-y-2">
                  {exerciseAnalysis.errors.map((error: string, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-xs text-white/80">
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
                  {exerciseAnalysis.corrections.map((correction: string, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-white/80">
                      • {correction}
                    </div>
                  ))}
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

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-emerald-500/30">
      <PremiumModal />
      <OnboardingModal />
      <ShoppingListModal />
      <RouteDayModal />
      <FoodAnalysisModal />
      <ExerciseAnalysisModal />
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Zap className="w-5 h-5 text-black fill-current" />
            </div>
            <span className="font-display font-bold tracking-tight text-lg md:xl italic uppercase">Meu <span className="text-emerald-500">Shape</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
            <button 
              onClick={() => setActiveTab('analyze')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'analyze' ? 'bg-emerald-500 text-black' : 'hover:bg-white/5'}`}
            >
              Análise
            </button>
            <button 
              onClick={() => setActiveTab('diet')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'diet' ? 'bg-emerald-500 text-black' : 'hover:bg-white/5'}`}
            >
              Dieta
            </button>
            <button 
              onClick={() => setActiveTab('training')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'training' ? 'bg-emerald-500 text-black' : 'hover:bg-white/5'}`}
            >
              Treino
            </button>
            <button 
              onClick={() => setActiveTab('evolution')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'evolution' ? 'bg-emerald-500 text-black' : 'hover:bg-white/5'}`}
            >
              Evolução
            </button>
            <button 
              onClick={() => setActiveTab('coach')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'coach' ? 'bg-emerald-500 text-black' : 'hover:bg-white/5'}`}
            >
              Coach
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={saveData}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all"
              title="Salvar Dados"
            >
              <Box className="w-4 h-4 text-white/60" />
            </button>
            <button 
              onClick={() => setShowPremiumModal(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
            >
              <Crown className="w-3 h-3 md:w-4 md:h-4 text-orange-400" /> {isPremium ? 'Premium' : 'Seja Premium'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'analyze' && (
            <motion.div 
              key="analyze"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8"
            >
              {/* Left: Inputs */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-5 md:p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                      <Camera className="w-5 h-5 text-emerald-500" /> Captura Multi-Ângulo
                    </h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsPumpMode(!isPumpMode)}
                        className={`flex-1 md:flex-none px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-1 ${isPumpMode ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10 text-white/40'}`}
                      >
                        <Zap className={`w-3 h-3 ${isPumpMode ? 'fill-current' : ''}`} />
                        Pump {isPumpMode ? 'ON' : 'OFF'}
                      </button>
                      <button 
                        onClick={() => setIsCompetitionMode(!isCompetitionMode)}
                        className={`flex-1 md:flex-none px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-1 ${isCompetitionMode ? 'bg-orange-500 border-orange-400 text-black shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-white/5 border-white/10 text-white/40'}`}
                      >
                        <Shield className={`w-3 h-3 ${isCompetitionMode ? 'fill-current' : ''}`} />
                        Stage {isCompetitionMode ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {(['front', 'back', 'side'] as const).map((type) => (
                      <div key={type} className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-white/40 text-center">{type === 'front' ? 'Frente' : type === 'back' ? 'Costas' : 'Lado'}</p>
                        <div 
                          onClick={() => document.getElementById(`input-${type}`)?.click()}
                          className={`aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-all overflow-hidden relative ${images[type] ? 'border-solid border-emerald-500' : ''}`}
                        >
                          {images[type] ? (
                            <>
                              <img 
                                src={images[type]} 
                                loading="lazy"
                                className={`w-full h-full object-cover transition-all duration-700 ${isCompetitionMode ? 'sepia-[0.5] contrast-[1.2] brightness-[0.8] saturate-[1.5]' : ''} ${isScanning ? 'brightness-[0.3]' : ''}`} 
                              />
                              {isScanning && (
                                <>
                                  <motion.div 
                                    initial={{ top: '0%' }}
                                    animate={{ top: '100%' }}
                                    transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
                                    className="absolute left-0 right-0 h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)] z-10"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest animate-pulse">Escaneando Biometria...</span>
                                  </div>
                                </>
                              )}
                            </>
                          ) : (
                            <Upload className="w-6 h-6 text-white/20" />
                          )}
                          {isCompetitionMode && images[type] && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-2">
                              <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Stage Filter</span>
                            </div>
                          )}
                          <input id={`input-${type}`} type="file" className="hidden" onChange={handleImageUpload(type)} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase">Peso (kg)</label>
                      <input 
                        type="number" 
                        value={profile.weight}
                        onChange={(e) => setProfile(p => ({ ...p, weight: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase">Objetivo</label>
                      <select 
                        value={profile.goal}
                        onChange={(e) => setProfile(p => ({ ...p, goal: e.target.value as any }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all"
                      >
                        <option value="Cutting">Cutting</option>
                        <option value="Bulking">Bulking</option>
                        <option value="Recomposição">Recomposição</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || isScanning}
                    className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-50"
                  >
                    {isScanning ? 'Escaneando...' : (isAnalyzing ? 'Processando Biometria...' : (!isPremium && analysisCount >= 3 ? 'Limite Mensal Atingido' : 'Iniciar Análise Pro'))}
                  </button>
                  
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold text-center animate-pulse">
                      {error}
                    </div>
                  )}

                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-white/40 uppercase">Análises Restantes</span>
                      <span className={`text-[10px] font-bold ${isPremium ? 'text-emerald-500' : (analysisCount >= 3 ? 'text-red-500' : 'text-emerald-500')}`}>
                        {isPremium ? 'Ilimitado' : `${Math.max(0, 3 - analysisCount)}/3`}
                      </span>
                    </div>
                    {!isPremium && (
                      <>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${analysisCount >= 3 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(100, (analysisCount / 3) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[8px] text-white/20 mt-2 italic text-center">Sua evolução não pode parar. Garanta análises ilimitadas sendo Premium.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Natural Limit Calculator */}
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-emerald-500" /> Limite Genético Natural
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      placeholder="Punho (cm)" 
                      type="number"
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm"
                      onChange={(e) => setProfile(p => ({ ...p, wristCircumference: Number(e.target.value) }))}
                    />
                    <input 
                      placeholder="Tornozelo (cm)" 
                      type="number"
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm"
                      onChange={(e) => setProfile(p => ({ ...p, ankleCircumference: Number(e.target.value) }))}
                    />
                  </div>
                  <button 
                    onClick={calculateNaturalLimit}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Calcular Potencial
                  </button>
                  {limitResult && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-white/60 mb-1">Seu peso máximo natural estimado:</p>
                          <p className="text-2xl font-black text-emerald-500">{limitResult.maxMass}kg <span className="text-xs text-white/40 font-normal">@ 10% BF</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">Potencial</p>
                          <p className="text-lg font-black italic text-white">{Math.round((limitResult.currentMass / limitResult.maxMass) * 100)}%</p>
                        </div>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (limitResult.currentMass / limitResult.maxMass) * 100)}%` }}
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                        />
                      </div>
                      <p className="text-[10px] text-white/40 italic text-center">Você está a {Math.round((limitResult.currentMass / limitResult.maxMass) * 100)}% do seu limite genérico estimado.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Results */}
              <div className="lg:col-span-7 space-y-6">
                {!result && !isAnalyzing ? (
                  <div className="h-full min-h-[500px] border border-white/5 rounded-3xl bg-white/[0.01] flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/5 flex items-center justify-center mb-6 animate-pulse">
                      <Target className="w-12 h-12 text-emerald-500/20" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Pronto para o Check-in?</h2>
                    <p className="text-white/40 max-w-sm">Envie suas fotos para gerar o gráfico de teia, estimativa de BF e plano corretivo.</p>
                  </div>
                ) : isAnalyzing ? (
                  <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 space-y-8">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
                      <Zap className="absolute inset-0 m-auto w-10 h-10 text-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter">Analisando Fibras</h3>
                      <p className="text-white/40">Calculando densidade e assimetrias...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 pb-12">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 md:p-6 rounded-3xl bg-emerald-500 text-black shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Score Geral</p>
                        <p className="text-4xl md:text-5xl font-black italic">{result.overallScore}</p>
                      </div>
                      <div className="p-5 md:p-6 rounded-3xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">BF Estimado</p>
                        <p className="text-4xl md:text-5xl font-black italic text-emerald-500">{result.bfEstimate}%</p>
                      </div>
                      <div className="p-5 md:p-6 rounded-3xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Status</p>
                        <p className="text-xl md:text-2xl font-black italic uppercase mt-2">{result.recommendations.dietPhase}</p>
                      </div>
                    </div>

                    {/* Spider Chart & Proportions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 aspect-square flex flex-col items-center justify-center overflow-hidden">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Atributos do Shape</h4>
                        <div className="w-full h-full max-w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                              <PolarGrid stroke="#ffffff10" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff40', fontSize: 9 }} />
                              <Radar
                                name="Shape"
                                dataKey="A"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.5}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" /> Simetria & Proporção
                        </h4>
                        <p className="text-sm text-white/70 leading-relaxed italic">"{result.proportions.description}"</p>
                        <div className="space-y-2">
                          {result.proportions.imbalances.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-orange-400 bg-orange-400/10 p-3 rounded-xl">
                              <Info className="w-3 h-3 shrink-0" /> {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <Shield className="w-5 h-5" />
                        <h4 className="font-black uppercase text-[10px] tracking-widest">Feedback do Coach IA</h4>
                      </div>
                      <p className="text-lg md:text-xl font-medium leading-relaxed italic">"{result.analysis.summary}"</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-6 border-t border-white/5">
                        <div className="space-y-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <Award className="w-4 h-4" /> Pontos de Elite
                          </p>
                          <ul className="space-y-3">
                            {result.analysis.strengths.map((s, i) => (
                              <li key={i} className="text-sm flex items-start gap-2 text-white/80">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                            <Info className="w-4 h-4" /> Pontos Críticos ⚠️
                          </p>
                          <ul className="space-y-3">
                            {result.analysis.weaknesses.map((w, i) => (
                              <li key={i} className="text-sm flex items-start gap-2 text-white/80">
                                <ChevronRight className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> 
                                <button 
                                  onClick={() => {
                                    handleShowExerciseDetail(w.split(' ')[0]);
                                  }}
                                  className="hover:text-orange-400 hover:underline transition-all text-left"
                                >
                                  {w}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Button */}
                    {evolutionHistory.length > 1 && (
                      <div className="flex justify-center">
                        <button 
                          onClick={() => isPremium ? setShowComparison(!showComparison) : setShowPremiumModal(true)}
                          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 relative overflow-hidden"
                        >
                          <RefreshCw className={`w-4 h-4 ${showComparison ? 'rotate-180' : ''} transition-transform`} />
                          {showComparison ? 'Ocultar Comparativo' : 'Comparar com Mês Passado'}
                          {!isPremium && <Lock className="w-3 h-3 text-white/20 ml-2" />}
                        </button>
                      </div>
                    )}

                    {showComparison && evolutionHistory.length > 1 && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-3xl">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-white/40 uppercase text-center">Mês Passado ({evolutionHistory[evolutionHistory.length - 2].date})</p>
                          <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10">
                            <img src={evolutionHistory[evolutionHistory.length - 2].photo || images.front} className="w-full h-full object-cover" />
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-black text-white/60">{evolutionHistory[evolutionHistory.length - 2].score} pts</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-emerald-500 uppercase text-center">Hoje ({evolutionHistory[evolutionHistory.length - 1].date})</p>
                          <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <img src={images.front} className="w-full h-full object-cover" />
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-black text-emerald-500">{result.overallScore} pts</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shape Projection Section */}
                    <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6 relative overflow-hidden">
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-emerald-500" />
                          <h3 className="text-xl md:text-2xl font-bold italic uppercase">Projeção de Futuro (IA)</h3>
                        </div>
                        {!isPremium && (
                          <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Premium
                          </span>
                        )}
                      </div>
                      
                      <div className="relative">
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${!isPremium ? 'blur-xl grayscale pointer-events-none opacity-40' : ''}`}>
                          <div className="space-y-4">
                            <div className="flex flex-col gap-3">
                              <button 
                                onClick={() => isPremium ? handleProjectShape('fat-loss') : setShowPremiumModal(true)}
                                disabled={isProjecting || !images.front}
                                className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                              >
                                {isProjecting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <TrendingDown className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />}
                                Simular -5kg
                                {!isPremium && <Lock className="w-4 h-4 text-white/20 absolute right-4" />}
                              </button>
                              <button 
                                onClick={() => isPremium ? handleProjectShape('muscle-gain') : setShowPremiumModal(true)}
                                disabled={isProjecting || !images.front}
                                className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                              >
                                {isProjecting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />}
                                Simular +5kg
                                {!isPremium && <Lock className="w-4 h-4 text-white/20 absolute right-4" />}
                              </button>
                            </div>
                            {projectedImage && (
                              <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <img src={projectedImage} loading="lazy" className="w-full h-full object-cover" alt="Projected" />
                              </div>
                            )}
                          </div>
                          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-center text-center space-y-4">
                            <p className="text-sm text-white/60 italic leading-relaxed">"Nossa IA analisa sua estrutura óssea e inserções musculares para projetar seu potencial máximo estético."</p>
                            <div className="flex justify-center gap-8">
                              <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-white/40 mb-1">Tempo Est.</p>
                                <p className="text-xl font-black text-emerald-500">12-16 Sem</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-white/40 mb-1">Dificuldade</p>
                                <p className="text-xl font-black text-orange-500">Alta</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {!isPremium && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
                            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                              <Lock className="w-8 h-8 text-orange-500" />
                            </div>
                            <h4 className="text-xl font-black italic uppercase mb-2">Recurso Premium</h4>
                            <p className="text-sm text-white/60 max-w-xs mb-6">Desbloqueie a Projeção de Futuro com IA e veja seu potencial máximo.</p>
                            <button 
                              onClick={() => setShowPremiumModal(true)}
                              className="px-8 py-4 bg-orange-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-orange-500/20 active:scale-95"
                            >
                              Desbloquear Agora
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col justify-center text-center space-y-4">
                        <Zap className="w-10 h-10 text-emerald-500 mx-auto" />
                        <h4 className="font-bold">Treino Corretivo</h4>
                        <p className="text-xs text-white/40 leading-relaxed">
                          {personalizedTraining ? 'Seu treino personalizado já está pronto para consulta.' : 'Baseado na sua análise, podemos gerar um protocolo de treino focado em corrigir suas assimetrias.'}
                        </p>
                        <button 
                          onClick={() => {
                            setActiveTab('training');
                            if (!personalizedTraining) handleGenerateTraining();
                          }}
                          className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 text-xs"
                        >
                          <Dumbbell className="w-4 h-4" />
                          {personalizedTraining ? 'Ver Treino Gerado' : 'Gerar Treino Completo'}
                        </button>
                      </div>
                      <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col justify-center text-center space-y-4">
                        <Utensils className="w-10 h-10 text-emerald-500 mx-auto" />
                        <h4 className="font-bold">Dieta Personalizada</h4>
                        <p className="text-xs text-white/40 leading-relaxed">
                          {mealPlan ? 'Seu plano nutricional já está disponível.' : 'Gere um plano de refeições com gramagens exatas baseadas no seu shape.'}
                        </p>
                        <button 
                          onClick={() => {
                            setActiveTab('diet');
                            if (!mealPlan) handleGenerateMealPlan();
                          }}
                          className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 text-xs"
                        >
                          <Utensils className="w-4 h-4" />
                          {mealPlan ? 'Ver Dieta Gerada' : 'Gerar Dieta'}
                        </button>
                      </div>
                    </div>

                    {/* Pump Analysis Section */}
                    {result.analysis.pumpAnalysis && (
                      <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 space-y-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-6 h-6 text-emerald-500" />
                          <h3 className="text-2xl font-bold italic uppercase tracking-tighter">Análise de Pump</h3>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                            <p className="text-[10px] font-black text-white/40 uppercase">Vascularização</p>
                            <p className="text-2xl font-black text-emerald-500">{result.analysis.pumpAnalysis.vascularityScore}/100</p>
                          </div>
                          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                            <p className="text-[10px] font-black text-white/40 uppercase">Aumento de Volume</p>
                            <p className="text-sm font-bold">{result.analysis.pumpAnalysis.volumeIncrease}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                            <p className="text-[10px] font-black text-white/40 uppercase">Comparação</p>
                            <p className="text-xs text-white/60">{result.analysis.pumpAnalysis.comparison}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'diet' && (
            <motion.div 
              key="diet"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {showDietQuiz ? (
                <div className="p-6 md:p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-8 max-w-2xl mx-auto relative overflow-hidden">
                  {/* Progress Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ 
                        width: !dietAnswers.objective ? '0%' : 
                               !dietAnswers.activityLevel ? '33%' : 
                               !dietAnswers.mealsPerDay ? '66%' : '100%' 
                      }}
                      className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  </div>

                  <div className="text-center space-y-2 pt-4">
                    <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">
                      Passo { !dietAnswers.objective ? '1' : !dietAnswers.activityLevel ? '2' : '3' } de 3
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Configuração de Dieta</h2>
                    <p className="text-zinc-400 text-sm">Ajuste fino para máxima performance.</p>
                  </div>

                  <div className="space-y-8">
                    {/* Objective Card */}
                    <div ref={dietStep1Ref} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-5">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-500" /> Qual seu objetivo principal?
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['Perder Gordura', 'Ganhar Massa', 'Manutenção'].map((obj) => (
                          <button
                            key={obj}
                            onClick={() => {
                              setDietAnswers(prev => ({ ...prev, objective: obj }));
                              scrollToNext(dietStep2Ref);
                            }}
                            className={`py-3 px-4 rounded-full border transition-all text-xs font-bold uppercase tracking-tight ${dietAnswers.objective === obj ? 'bg-green-500 border-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                          >
                            {obj}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Activity Level Card */}
                    <div ref={dietStep2Ref} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-5">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-500" /> Nível de Atividade Física
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['Sedentário', 'Leve', 'Moderado', 'Intenso'].map((level) => (
                          <button
                            key={level}
                            onClick={() => {
                              setDietAnswers(prev => ({ ...prev, activityLevel: level }));
                              scrollToNext(dietStep3Ref);
                            }}
                            className={`py-3 px-2 rounded-full border transition-all text-xs font-bold uppercase tracking-tight ${dietAnswers.activityLevel === level ? 'bg-green-500 border-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Meals Card */}
                    <div ref={dietStep3Ref} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-5">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-emerald-500" /> Refeições por dia
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {[3, 4, 5, 6].map((num) => (
                          <button
                            key={num}
                            onClick={() => setDietAnswers(prev => ({ ...prev, mealsPerDay: num }))}
                            className={`py-3 rounded-full border transition-all text-xs font-bold ${dietAnswers.mealsPerDay === num ? 'bg-green-500 border-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleGenerateMealPlan()}
                      disabled={!dietAnswers.objective || !dietAnswers.activityLevel || !dietAnswers.mealsPerDay || isGeneratingMealPlan}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-400 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      {isGeneratingMealPlan ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-5 h-5 fill-current" />
                          Gerar Plano Nutricional
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Hydration Counter */}
                  <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <Droplets className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-blue-400">Hidratação Diária</h4>
                        <p className="text-2xl font-black italic">{waterIntake} / {waterGoal} <span className="text-[10px] uppercase not-italic opacity-40">ml</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setWaterIntake(prev => Math.max(0, prev - 250))}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 font-bold"
                      >
                        -250
                      </button>
                      <button 
                        onClick={() => setWaterIntake(prev => prev + 250)}
                        className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-400 transition-all shadow-lg font-bold"
                      >
                        +250
                      </button>
                    </div>
                  </div>

                  {/* Macro Progress Bars */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {[
                      { label: 'Calorias', value: result.recommendations.macros.calories, unit: 'kcal', color: 'bg-emerald-500', icon: <Zap className="w-3 h-3" />, current: 1800 },
                      { label: 'Proteína', value: result.recommendations.macros.protein, unit: 'g', color: 'bg-blue-500', icon: <Flame className="w-3 h-3" />, current: 120 },
                      { label: 'Carbos', value: result.recommendations.macros.carbs, unit: 'g', color: 'bg-orange-500', icon: <Utensils className="w-3 h-3" />, current: 150 },
                      { label: 'Gordura', value: result.recommendations.macros.fats, unit: 'g', color: 'bg-red-500', icon: <Droplets className="w-3 h-3" />, current: 45 },
                    ].map((macro, i) => (
                      <div key={i} className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/5 space-y-2 md:space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1">
                            {macro.icon} {macro.label}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm md:text-base font-black text-white">{macro.current}</span>
                          <span className="text-[8px] md:text-[10px] text-white/20 uppercase">/ {macro.value}{macro.unit}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${macro.color} transition-all duration-1000`} 
                            style={{ width: `${Math.min(100, (macro.current / macro.value) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Premium Diet Tools */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <button 
                        onClick={() => isPremium ? handleGenerateShoppingList() : setShowPremiumModal(true)}
                        className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 flex flex-col md:flex-row items-center gap-2 md:gap-3 hover:bg-emerald-500/10 transition-all group"
                      >
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Box className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500">Lista de Compras</p>
                          <p className="text-[8px] md:text-[9px] text-white/40 hidden md:block">Gerar lista inteligente</p>
                        </div>
                        {!isPremium && <Lock className="w-3 h-3 text-white/20 md:ml-auto" />}
                      </button>
                      <button 
                        onClick={() => isPremium ? handleGenerateRouteDayPlan() : setShowPremiumModal(true)}
                        className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 flex flex-col md:flex-row items-center gap-2 md:gap-3 hover:bg-orange-500/10 transition-all group"
                      >
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-orange-500">Dia de Rota</p>
                          <p className="text-[8px] md:text-[9px] text-white/40 hidden md:block">Sugestões fora de casa</p>
                        </div>
                        {!isPremium && <Lock className="w-3 h-3 text-white/20 md:ml-auto" />}
                      </button>
                    </div>

                  {/* FOTO-MACRO (IA) Button */}
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFoodPhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      disabled={isAnalyzingFood}
                    />
                    <button 
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-400 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3"
                    >
                      {isAnalyzingFood ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-5 h-5 fill-current" />
                          <span>⚡ FOTO-MACRO (IA) - Analisar Meu Prato</span>
                          {!isPremium && <Lock className="w-4 h-4" />}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Meal Plan List */}
                  {mealPlan ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black italic uppercase flex items-center gap-2">
                          <Utensils className="w-5 h-5 text-emerald-500" /> Cardápio Estratégico
                        </h3>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setShowDietQuiz(true)}
                            className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-emerald-500 transition-all"
                          >
                            Refazer Quiz
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-6">
                        {mealPlan.meals.map((meal, i) => (
                          <motion.div 
                            key={meal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-black bg-emerald-500 text-black px-2 py-0.5 rounded-md uppercase">{meal.time}</span>
                                  <h4 className="text-lg font-black italic uppercase text-white/90">{meal.title}</h4>
                                </div>
                                <div className="flex gap-3">
                                  <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">P: {meal.macros.protein}g</span>
                                  <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">C: {meal.macros.carbs}g</span>
                                  <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">G: {meal.macros.fats}g</span>
                                  <span className="text-[9px] text-emerald-500/60 uppercase font-bold tracking-widest">{meal.macros.calories} kcal</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => !isPremium ? setShowPremiumModal(true) : console.log('Trocando alimento...')}
                                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-emerald-500 hover:border-emerald-500/30 transition-all group-hover:scale-110 flex items-center gap-2"
                                title="Trocar Alimento (Premium)"
                              >
                                <RefreshCw className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-tighter hidden group-hover:block">Trocar Alimento</span>
                                {!isPremium && <Lock className="w-3 h-3" />}
                              </button>
                            </div>

                            <div className="grid gap-2 mb-4 relative z-10">
                              {meal.items.map((item, j) => (
                                <div key={j} className="flex justify-between items-center p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                                    <span className="text-sm text-white/80 font-medium">{item.name}</span>
                                  </div>
                                  <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg">{item.amount}</span>
                                </div>
                              ))}
                            </div>

                            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3 relative z-10">
                              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Info className="w-3.5 h-3.5 text-emerald-500" />
                              </div>
                              <p className="text-[11px] text-white/60 leading-relaxed italic font-medium">{meal.tip}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <button 
                        onClick={handleGenerateMealPlan}
                        disabled={isGeneratingMealPlan}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold text-emerald-500 uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${isGeneratingMealPlan ? 'animate-spin' : ''}`} />
                        Regerar Cardápio Completo
                      </button>
                    </div>
                  ) : (
                    <div className="p-12 text-center border border-white/5 rounded-3xl bg-white/[0.01] space-y-4">
                      <Utensils className="w-12 h-12 text-white/10 mx-auto mb-2" />
                      <h3 className="text-xl font-black italic uppercase">Plano Estratégico</h3>
                      <p className="text-white/40 text-sm max-w-md mx-auto">Gere seu cardápio com gramagens exatas baseadas no seu shape e objetivo de {dietAnswers.objective}.</p>
                      <button 
                        onClick={handleGenerateMealPlan}
                        disabled={isGeneratingMealPlan}
                        className="px-12 py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                      >
                        {isGeneratingMealPlan ? 'Gerando...' : 'Gerar Cardápio Agora'}
                      </button>
                    </div>
                  )}
                  {/* Premium Card Integration */}
                  {!isPremium && (
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <Crown className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500">Upgrade Padrão Ouro</h4>
                          <p className="text-xs text-white/60">Quer levar seu shape ao próximo nível? Conheça o Plano Padrão Ouro.</p>
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
                  {/* Premium Card Integration */}
                  {!isPremium && (
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <Crown className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500">Upgrade Padrão Ouro</h4>
                          <p className="text-xs text-white/60">Quer levar seu shape ao próximo nível? Conheça o Plano Padrão Ouro.</p>
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
              )}
            </motion.div>
          )}

          {activeTab === 'training' && (
            <motion.div 
              key="training"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {!result ? (
                <div className="p-12 text-center border border-white/5 rounded-3xl bg-white/[0.01]">
                  <Dumbbell className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40">Analise seu físico para identificar pontos fracos e gerar o treino corretivo.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Crown className={`w-5 h-5 ${isPremium ? 'text-emerald-500' : 'text-white/20'}`} />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest">Plano de Treino</p>
                        <p className="text-[10px] text-white/40">{isPremium ? 'Personalizado por IA' : 'Genérico Baseado no Shape'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsPremium(!isPremium)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPremium ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                    >
                      {isPremium ? 'Premium Ativo' : 'Mudar para Premium'}
                    </button>
                  </div>

                  {showTrainingQuiz ? (
                    <div className="p-6 md:p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-8 relative overflow-hidden max-w-2xl mx-auto">
                      {/* Progress Bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ 
                            width: !trainingAnswers.daysPerWeek ? '0%' : 
                                   (trainingAnswers.selectedDays?.length === 0) ? '25%' : 
                                   !trainingAnswers.experienceLevel ? '50%' : 
                                   !trainingAnswers.focus ? '75%' : '100%' 
                          }}
                          className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <div className="space-y-1">
                          <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-500 uppercase tracking-widest">
                            Passo { !trainingAnswers.daysPerWeek ? '1' : (trainingAnswers.selectedDays?.length === 0) ? '2' : !trainingAnswers.experienceLevel ? '3' : '4' } de 4
                          </div>
                          <h3 className="text-2xl font-black italic uppercase tracking-tighter">Configurar Treino</h3>
                        </div>
                        <button onClick={() => setShowTrainingQuiz(false)} className="text-xs font-black uppercase text-zinc-500 hover:text-white transition-colors">Voltar</button>
                      </div>
                      
                      <div className="space-y-8">
                        {/* Days per Week Card */}
                        <div ref={trainingStep1Ref} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-5">
                          <p className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-500" /> Dias por Semana
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[3, 4, 5, 6].map((num) => (
                              <button
                                key={num}
                                onClick={() => {
                                  setTrainingAnswers(prev => ({ ...prev, daysPerWeek: num }));
                                  scrollToNext(trainingStep2Ref);
                                }}
                                className={`py-3 rounded-full border transition-all text-xs font-bold ${trainingAnswers.daysPerWeek === num ? 'bg-green-500 border-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                              >
                                {num} Dias
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Selected Days Card */}
                        <div ref={trainingStep2Ref} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-5">
                          <p className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" /> Quais dias você vai treinar?
                          </p>
                          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((day) => (
                              <button
                                key={day}
                                onClick={() => {
                                  const current = trainingAnswers.selectedDays || [];
                                  if (current.includes(day)) {
                                    setTrainingAnswers(prev => ({ ...prev, selectedDays: current.filter(d => d !== day) }));
                                  } else {
                                    setTrainingAnswers(prev => ({ ...prev, selectedDays: [...current, day] }));
                                    if ((current.length + 1) === trainingAnswers.daysPerWeek) {
                                      scrollToNext(trainingStep3Ref);
                                    }
                                  }
                                }}
                                className={`py-2.5 rounded-full border transition-all text-[10px] font-bold ${trainingAnswers.selectedDays?.includes(day) ? 'bg-green-500 border-green-400 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Experience Level Card */}
                        <div ref={trainingStep3Ref} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-5">
                          <p className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <Award className="w-4 h-4 text-emerald-500" /> Nível de Experiência
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['Iniciante', 'Intermediário', 'Avançado'].map((level) => (
                              <button
                                key={level}
                                onClick={() => {
                                  setTrainingAnswers(prev => ({ ...prev, experienceLevel: level }));
                                  scrollToNext(trainingStep4Ref);
                                }}
                                className={`py-3 rounded-full border transition-all text-[11px] font-bold uppercase tracking-tight ${trainingAnswers.experienceLevel === level ? 'bg-green-500 border-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Focus Card */}
                        <div ref={trainingStep4Ref} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-5">
                          <p className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-500" /> Foco Principal
                          </p>
                          <select 
                            onChange={(e) => {
                              setTrainingAnswers(prev => ({ ...prev, focus: e.target.value }));
                              scrollToNext(trainingButtonRef);
                            }}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-emerald-500 text-zinc-300 appearance-none"
                          >
                            <option value="">Selecione o Foco</option>
                            <option value="Hipertrofia Geral">Hipertrofia Geral</option>
                            <option value="Força Bruta">Força Bruta</option>
                            <option value="Condicionamento">Condicionamento</option>
                            <option value="Correção de Pontos Fracos">Correção de Pontos Fracos</option>
                          </select>
                        </div>

                        <button 
                          ref={trainingButtonRef}
                          onClick={handleGenerateTraining}
                          disabled={!trainingAnswers.daysPerWeek || !trainingAnswers.experienceLevel || isGeneratingTraining}
                          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-400 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                          {isGeneratingTraining ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Zap className="w-5 h-5 fill-current" />
                              Gerar Planilha Completa
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-8 text-center border border-white/5 rounded-3xl bg-white/[0.01] space-y-4">
                        <Dumbbell className="w-12 h-12 text-white/10 mx-auto mb-2" />
                        <h3 className="text-xl font-black italic uppercase">Planilha de Treino</h3>
                        <p className="text-white/40 text-sm max-w-md mx-auto">Configure sua rotina semanal e receba um treino corretivo baseado nos seus pontos fracos.</p>
                        <button 
                          onClick={() => setShowTrainingQuiz(true)}
                          className="px-12 py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                        >
                          Configurar Treino Agora
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Analisar Execução do Exercício (IA) Button */}
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="video/*" 
                      onChange={handleExerciseVideoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      disabled={isAnalyzingExercise}
                    />
                    <button 
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-400 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3"
                    >
                      {isAnalyzingExercise ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Video className="w-5 h-5" />
                          <span>Analisar Execução do Exercício (IA)</span>
                          {!isPremium && <Lock className="w-4 h-4" />}
                        </>
                      )}
                    </button>
                  </div>

                  {personalizedTraining && !showTrainingQuiz ? (
                    <>
                      {/* Calendário de Consistência */}
                      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-500" /> Consistência Semanal
                          </h4>
                          <div className="flex items-center gap-1 text-orange-500 font-bold text-xs italic">
                            <Zap className="w-3 h-3 fill-current" /> 5 DIAS SEGUIDOS 🔥
                          </div>
                        </div>
                        <div className="flex justify-between items-center px-2">
                          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((day, i) => {
                            const isTrainingDay = profile.trainingDays?.includes(day);
                            const today = new Date().toISOString().split('T')[0];
                            const isChecked = completedWorkouts.some(id => id.includes(day));
                            
                            return (
                              <div key={day} className="flex flex-col items-center gap-2">
                                <span className="text-[10px] font-bold text-white/20 uppercase">{day}</span>
                                <div 
                                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                    isChecked 
                                      ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                                      : isTrainingDay 
                                        ? 'bg-white/5 border-white/10 text-white/40' 
                                        : 'bg-transparent border-dashed border-white/5 text-white/10'
                                  }`}
                                >
                                  {isChecked ? <Check className="w-5 h-5 stroke-[3]" /> : isTrainingDay ? <Dumbbell className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Treino do Dia */}
                      {personalizedTraining.days.map((dayPlan, dayIdx) => (
                        <div key={dayIdx} className="space-y-6">
                          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-start">
                              <div>
                                <h3 className="text-2xl font-black italic uppercase text-emerald-500">{dayPlan.title}</h3>
                                <p className="text-sm text-white/40 font-medium">{dayPlan.focus}</p>
                              </div>
                              {dayPlan.macros && (
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Meta Nutricional</p>
                                  <p className="text-lg font-black italic text-white/80">{dayPlan.macros.calories} KCAL</p>
                                </div>
                              )}
                            </div>
                            <Dumbbell className="absolute -right-6 -bottom-6 w-32 h-32 text-white/[0.02] -rotate-12" />
                          </div>

                          <div className="grid gap-4">
                            {dayPlan.exercises.map((ex, exIdx) => (
                              <motion.div 
                                key={exIdx}
                                whileHover={{ scale: 1.01 }}
                                className={`p-3 md:p-5 rounded-2xl border transition-all flex items-center gap-4 ${ex.completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.02] border-white/5'}`}
                              >
                                <button 
                                  onClick={() => toggleExerciseCompletion(dayIdx, exIdx)}
                                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${ex.completed ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/20 hover:border-emerald-500/50'}`}
                                >
                                  {ex.completed && <Check className="w-4 h-4 stroke-[3]" />}
                                </button>
                                
                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className={`text-sm md:text-base font-bold transition-all ${ex.completed ? 'text-emerald-500 line-through opacity-50' : 'text-white'}`}>{ex.name}</h5>
                                      <button 
                                        onClick={() => handleShowExerciseDetail(ex.name)}
                                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                      >
                                        <Info className="w-3 h-3 text-white/20 hover:text-emerald-500" />
                                      </button>
                                    </div>
                                    <span className="text-[9px] md:text-[10px] font-black bg-white/5 px-2 py-1 rounded-md text-white/40 uppercase">{ex.sets}X {ex.reps}</span>
                                  </div>
                                  <div className="flex gap-3 text-[9px] md:text-[10px] font-medium text-white/30 uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-emerald-500" /> {ex.technique}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-emerald-500" /> {ex.rest}</span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Botão Flutuante de Conclusão */}
                      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50">
                        <button 
                          onClick={() => {
                            const today = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][new Date().getDay()];
                            handleCheckIn(today);
                          }}
                          className="w-full py-5 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                          <Trophy className="w-6 h-6" />
                          Concluir Treino de Hoje
                        </button>
                      </div>

                      <button 
                        onClick={() => setShowTrainingQuiz(true)}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold text-white/40 uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Ajustar e Regerar Protocolo
                      </button>

                      {/* Integrated Premium Card */}
                      <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -mr-32 -mt-32 group-hover:bg-emerald-500/10 transition-all duration-700" />
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <Crown className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div>
                            <h4 className="text-lg font-black italic uppercase text-white/90">Quer levar seu shape ao próximo nível?</h4>
                            <p className="text-sm text-white/40">Conheça o Plano Padrão Ouro e desbloqueie todo seu potencial.</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowPremiumModal(true)}
                          className="px-8 py-3 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 relative z-10"
                        >
                          Saiba Mais
                        </button>
                      </div>
                    </>
                  ) : !showTrainingQuiz && (
                    <div className="space-y-6">
                      <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-black italic uppercase mb-2">Foco: {result.recommendations.trainingFocus}</h3>
                          <p className="text-sm text-white/40">Detectamos assimetrias que precisam de volume compensatório.</p>
                        </div>
                        <button 
                          onClick={() => setShowTrainingQuiz(true)}
                          className="px-8 py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all"
                        >
                          Gerar Treino Completo
                        </button>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-emerald-500" /> Exercícios Corretivos
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {result.recommendations.correctiveExercises.map((ex, i) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="font-bold text-xs">{ex}</span>
                                <ChevronRight className="w-4 h-4 text-emerald-500" />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Play className="w-6 h-6 text-emerald-500" />
                          </div>
                          <h4 className="text-sm font-bold">Análise de Biomecânica</h4>
                          <p className="text-[10px] text-white/40">Grave um vídeo e nossa IA corrigirá sua postura.</p>
                          <button className="text-[10px] font-black uppercase text-emerald-500 border-b border-emerald-500/30">Iniciar</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'evolution' && (
            <motion.div 
              key="evolution"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-black italic uppercase italic">Dashboard de Evolução</h2>
                    <p className="text-white/40 text-sm">Acompanhe seu progresso mensal e métricas de elite.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setActiveTab('analyze')}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Nova Entrada
                    </button>
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 self-start">
                      {(['1m', '6m', 'all'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setEvolutionFilter(f)}
                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${evolutionFilter === f ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:bg-white/5'}`}
                        >
                          {f === '1m' ? '1 Mês' : f === '6m' ? '6 Meses' : 'Tudo'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { 
                      label: 'Média Treinos/Semana', 
                      value: (completedWorkouts.length / 4).toFixed(1), 
                      icon: <Dumbbell className="w-4 h-4" />, 
                      color: 'text-emerald-500' 
                    },
                    { 
                      label: 'Consistência Dieta', 
                      value: `${evolutionHistory[evolutionHistory.length - 1].consistency}%`, 
                      icon: <Utensils className="w-4 h-4" />, 
                      color: 'text-blue-500' 
                    },
                    { 
                      label: 'Meta de Água Batida', 
                      value: `${Math.round((waterIntake / waterGoal) * 100)}% Hoje`, 
                      icon: <Droplets className="w-4 h-4" />, 
                      color: 'text-cyan-500' 
                    },
                    { 
                      label: 'Evolução de Score', 
                      value: `+${evolutionHistory[evolutionHistory.length - 1].score - evolutionHistory[0].score}`, 
                      icon: <TrendingUp className="w-4 h-4" />, 
                      color: 'text-orange-500' 
                    },
                  ].map((stat, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 group hover:border-white/10 transition-all">
                      <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">{stat.label}</p>
                        <p className="text-xl font-black italic text-white/90">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-[350px] w-full bg-white/[0.01] rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <RechartsResponsiveContainer width="100%" height="100%">
                    <LineChart data={
                      evolutionFilter === '1m' ? evolutionHistory.slice(-2) :
                      evolutionFilter === '6m' ? evolutionHistory.slice(-6) :
                      evolutionHistory
                    }>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
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
                          backgroundColor: '#0A0A0B', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '16px',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                          padding: '12px'
                        }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                        labelStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: 'black', textTransform: 'uppercase' }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', paddingBottom: '20px', opacity: 0.6 }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} name="Score Geral" />
                      <Line type="monotone" dataKey="bf" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }} name="BF %" />
                      <Line type="monotone" dataKey="consistency" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} name="Consistência %" />
                    </LineChart>
                  </RechartsResponsiveContainer>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black italic uppercase flex items-center gap-2">
                      <Camera className="w-5 h-5 text-emerald-500" /> Galeria de Evolução Mensal
                    </h3>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setShowGhostOverlay(!showGhostOverlay)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showGhostOverlay ? 'bg-orange-500 text-black' : 'bg-white/5 text-white/40 border border-white/10'}`}
                      >
                        Ghost Overlay {showGhostOverlay ? 'ON' : 'OFF'}
                      </button>
                      <button className="text-[10px] font-black uppercase text-white/40 hover:text-emerald-500 transition-all border-b border-white/10">Ver Todas as Fotos</button>
                    </div>
                  </div>
                  
                  {showGhostOverlay && evolutionHistory.length >= 2 && (
                    <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <img 
                        src={evolutionHistory[evolutionHistory.length - 1].photo} 
                        className="absolute inset-0 w-full h-full object-cover" 
                        alt="Current"
                      />
                      <img 
                        src={evolutionHistory[evolutionHistory.length - 2].photo} 
                        className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" 
                        alt="Previous"
                      />
                      <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
                        <p className="text-[10px] font-black uppercase text-emerald-500 text-center">Comparação: Atual vs Anterior</p>
                      </div>
                    </div>
                  )}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
                          {evolutionHistory.filter(e => e.photo).map((entry, i) => (
                            <motion.div 
                              key={i}
                              whileHover={{ scale: 1.05, y: -5 }}
                              className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 relative group cursor-pointer shadow-xl"
                            >
                              <img src={entry.photo} loading="lazy" alt={entry.date} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-3">
                                <span className="text-[10px] font-black uppercase text-white tracking-widest">{entry.date}</span>
                                <span className="text-[8px] font-bold text-emerald-500 uppercase">{entry.weight}kg</span>
                              </div>
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                <span className="text-[8px] font-black text-white/60">{i + 1}</span>
                              </div>
                            </motion.div>
                          ))}
                          {/* Placeholder for missing months */}
                          {Array.from({ length: Math.max(0, 6 - evolutionHistory.filter(e => e.photo).length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-2 bg-white/[0.01] group hover:border-emerald-500/20 transition-all">
                              <Camera className="w-6 h-6 text-white/5 group-hover:text-emerald-500/20 transition-colors" />
                              <span className="text-[8px] font-black text-white/5 uppercase tracking-widest">Mês {evolutionHistory.filter(e => e.photo).length + i + 1}</span>
                            </div>
                          ))}
                        </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Histórico de Análises Detalhado</h3>
                  <div className="grid gap-3">
                    {evolutionHistory.slice().reverse().map((entry, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex flex-col items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                            <span className="text-xs font-black text-emerald-500">{entry.date}</span>
                            <span className="text-[8px] font-bold text-emerald-500/60 uppercase">2026</span>
                          </div>
                          <div>
                            <p className="font-black italic uppercase text-sm tracking-tight">Check-in de Performance</p>
                            <div className="flex gap-3 mt-1">
                              <span className="text-[10px] text-white/40 uppercase font-black">{entry.weight}kg</span>
                              <span className="text-[10px] text-white/20">|</span>
                              <span className="text-[10px] text-orange-500 uppercase font-black">{entry.bf}% BF</span>
                              <span className="text-[10px] text-white/20">|</span>
                              <span className="text-[10px] text-blue-500 uppercase font-black">{entry.consistency}% Consistência</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <p className="text-2xl font-black italic text-emerald-500 leading-none">{entry.score}</p>
                          </div>
                          <p className="text-[8px] font-black uppercase text-white/20 mt-1">Score de Elite</p>
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
                          <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500">Upgrade Padrão Ouro</h4>
                          <p className="text-xs text-white/60">Quer levar seu shape ao próximo nível? Conheça o Plano Padrão Ouro.</p>
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

          {activeTab === 'coach' && (
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
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Online Agora
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
                      <p className="text-sm max-w-xs">Tire dúvidas sobre seu shape, dieta ou protocolos de treino.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                      {[
                        "Como está minha simetria?",
                        "Sugira um treino de foco em ombros",
                        "Minha dieta está adequada para cutting?",
                        "Como melhorar minha definição abdominal?"
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
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-emerald-500 text-black font-medium' : 'bg-white/5 border border-white/10 text-white/80'}`}>
                      {msg.role === 'user' ? msg.text : renderCoachMessage(msg.text)}
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
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
                  <h3 className="text-xl font-black uppercase italic">{selectedExercise}</h3>
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
                      <p className="text-xs font-bold uppercase tracking-widest text-white/40">Consultando Biomecânica...</p>
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
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/5 z-[60] pb-safe">
        <div className="flex items-center justify-around h-16">
          {[
            { id: 'analyze', icon: <Camera className="w-5 h-5" />, label: 'Análise' },
            { id: 'diet', icon: <Utensils className="w-5 h-5" />, label: 'Dieta' },
            { id: 'training', icon: <Dumbbell className="w-5 h-5" />, label: 'Treino' },
            { id: 'evolution', icon: <TrendingUp className="w-5 h-5" />, label: 'Evolução' },
            { id: 'coach', icon: <MessageSquare className="w-5 h-5" />, label: 'Coach' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${activeTab === tab.id ? 'text-emerald-500' : 'text-white/40'}`}
            >
              {tab.icon}
              <span className="text-[9px] font-bold uppercase tracking-widest">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div layoutId="bottomNav" className="absolute bottom-0 w-8 h-1 bg-emerald-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
