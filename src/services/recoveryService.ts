/**
 * WILLFS Recovery Engine - Core Logic
 * High-Performance Fatigue Simulation for Muscular & CNS Readiness
 */

export interface ExerciseData {
  sets: number;
  reps: number;
  weight: number;
  rpe: number; // 1-10
  techniques: ('drop_set' | 'rest_pause' | 'fail' | 'negative')[];
  restSeconds: number;
  isCompound: boolean;
}

export interface MuscleStatus {
  name: string;
  currentDamage: number; // 0-100
  lastWorkout: Date;
  k: number; // Recovery rate
  tPico: number; // Peak inflammation point (hours)
}

/**
 * Calculates Effective Muscle Damage (D_efetivo)
 * Formula: D_efetivo = (S * R * C) * I_RPE * (1 + Sum(Ti)) * M_descanso
 */
export const calculateEffectiveDamage = (data: ExerciseData): number => {
  const { sets, reps, weight, rpe, techniques, restSeconds, isCompound } = data;

  // 1. Intensity Factor based on RPE (RIR equivalent)
  // Higher RPE (closer to failure) generates more damage
  const intensityRPE = rpe / 10;

  // 2. Techniques Multiplier
  const techniqueMap = {
    'drop_set': 0.15,
    'rest_pause': 0.10,
    'fail': 0.20,
    'negative': 0.12
  };
  const techniqueSum = techniques.reduce((acc, tech) => acc + (techniqueMap[tech] || 0), 0);

  // 3. Rest Penalty (M_descanso)
  // Punish short rests in heavy compound movements
  let restPenalty = 1.0;
  if (isCompound && restSeconds < 120) {
    restPenalty = 1.0 + (120 - restSeconds) / 100;
  }

  // 4. Base Work Volume
  const volume = sets * reps * weight;

  // Final D_efetivo calculation (normalized to a relative scale)
  const dEfetivo = (volume / 1000) * intensityRPE * (1 + techniqueSum) * restPenalty;

  return dEfetivo;
};

/**
 * Sigmoid Recovery Function
 * Rec(t) = 100 / (1 + e^(-k(t - t_pico)))
 * Calculates how much a muscle has recovered after 't' hours
 */
export const calculateCurrentRecovery = (damage: number, hoursPassed: number, k: number, tPico: number): number => {
  // Sigmoid calculates the % of "Recovery State"
  const recoveryFactor = 100 / (1 + Math.exp(-k * (hoursPassed - tPico)));
  
  // Total recovery = 100 - remaining fatigue
  // But we need to apply the damage decay
  const fatigueDecay = damage * (1 - recoveryFactor / 100);
  
  return Math.max(0, 100 - fatigueDecay);
};

/**
 * Calculates CNS Fatigue Impact
 * CNS is affected more by intensity and compound movements than local muscles
 */
export const calculateCNSFatigue = (data: ExerciseData): number => {
  const baseFatigue = (data.weight * data.sets * (data.rpe / 10)) / 500;
  const compoundMultiplier = data.isCompound ? 2.5 : 1.0;
  
  return baseFatigue * compoundMultiplier;
};

/**
 * WILLFS Engine - Global Recommendation Logic
 */
export const getWILLFSReadiness = (cnsScore: number, avgMuscleRecovery: number) => {
  const injuryRisk = (100 - avgMuscleRecovery) * 0.7 + (100 - cnsScore) * 0.3;
  
  let recommendation = "PRONTO PARA O COMBATE. FOCO TOTAL.";
  let status = "OPTIMAL";

  if (cnsScore < 40) {
    recommendation = "ALERTA: FADIGA SISTÊMICA CRÍTICA (SNC). RISCO DE OVERTRAINING. RECOMENDADO DAY-OFF OU DELOAD.";
    status = "CRITICAL";
  } else if (injuryRisk > 60) {
    recommendation = "RISCO DE LESÃO ELEVADO. EVITE CARGAS MÁXIMAS NOS MÚSCULOS FADIGADOS.";
    status = "WARNING";
  }

  return { recommendation, status, injuryRisk };
};
