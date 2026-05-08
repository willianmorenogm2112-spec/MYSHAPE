import React from 'react';
import { motion } from 'motion/react';
import { Zap, Activity, AlertTriangle, Shield, Thermometer } from 'lucide-react';

interface TelemetryRingProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  size?: number;
}

const TelemetryRing: React.FC<TelemetryRingProps> = ({ label, value, color, icon, size = 180 }) => {
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center group" style={{ width: size, height: size }}>
      {/* Background Glow */}
      <div 
        className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-all group-hover:opacity-40" 
        style={{ backgroundColor: color }}
      />
      
      {/* SVG Ring */}
      <svg className="w-full h-full -rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
          fill="transparent"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          fill="transparent"
          strokeLinecap="round"
          className="drop-shadow-[0_0_8px_rgba(var(--color-rgb),0.8)]"
        />
      </svg>

      {/* Central Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
        <div className="p-2 rounded-full bg-white/5 border border-white/10 text-white/80 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-2xl font-black italic tracking-tighter text-white">
          {Math.round(value)}%
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
          {label}
        </span>
      </div>
    </div>
  );
};

export const RecoveryDashboard: React.FC<{
  muscleRecovery: number;
  cnsReadiness: number;
  injuryRisk: number;
  recommendation: string;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
}> = ({ muscleRecovery, cnsReadiness, injuryRisk, recommendation, status }) => {
  
  const getStatusColor = () => {
    if (status === 'CRITICAL') return 'text-red-500 border-red-500/30 bg-red-500/5';
    if (status === 'WARNING') return 'text-orange-500 border-orange-500/30 bg-orange-500/5';
    return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5';
  };

  const getStatusIcon = () => {
    if (status === 'CRITICAL') return <AlertTriangle className="w-5 h-5" />;
    if (status === 'WARNING') return <Thermometer className="w-5 h-5" />;
    return <Shield className="w-5 h-5" />;
  };

  return (
    <div className="p-8 rounded-[2rem] bg-[#0A0A0B] border border-white/5 relative overflow-hidden space-y-12">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
      />

      {/* Header */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">
              WILLFS Recovery Engine v2.0
            </span>
          </div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Telemetria de <span className="text-emerald-500">Performance</span>
          </h2>
        </div>

        <div className={`px-6 py-3 rounded-2xl border flex items-center gap-3 transition-all ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-xs font-black uppercase tracking-widest">
            STATUS: {status}
          </span>
        </div>
      </div>

      {/* Telemetry Rings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 justify-items-center relative">
        <TelemetryRing 
          label="Muscle Recovery" 
          value={muscleRecovery} 
          color="#10b981" 
          icon={<Zap className="w-5 h-5" />} 
        />
        <TelemetryRing 
          label="CNS Readiness" 
          value={cnsReadiness} 
          color="#3b82f6" 
          icon={<Activity className="w-5 h-5" />} 
        />
        <TelemetryRing 
          label="Injury Risk" 
          value={injuryRisk} 
          color="#f97316" 
          icon={<AlertTriangle className="w-5 h-5" />} 
        />
      </div>

      {/* Recommendation Panel */}
      <div className="relative p-6 rounded-3xl bg-white/[0.02] border border-white/10 group hover:border-emerald-500/30 transition-all">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-transform">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Diretriz do Motor Lógico
            </h4>
            <p className="text-lg font-bold text-white/90 leading-tight italic uppercase">
              "{recommendation}"
            </p>
          </div>
        </div>
      </div>

      {/* Data Matrix Footer */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5 opacity-40">
        <span className="text-[9px] font-black uppercase tracking-widest">Sigmoid Algorithm: ACTIVE</span>
        <span className="text-[9px] font-black uppercase tracking-widest">CNS Matrix: SYNCED</span>
        <span className="text-[9px] font-black uppercase tracking-widest">Neural Threshold: 85%</span>
      </div>
    </div>
  );
};
