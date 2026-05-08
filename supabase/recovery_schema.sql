-- WILLFS Recovery Engine - Supabase Schema
-- Designed for High-Performance Natural Bodybuilding

-- 1. Muscle Groups Master Table
CREATE TABLE muscle_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- e.g., 'Peitoral', 'Tríceps', 'Quadríceps'
    recovery_rate_k FLOAT DEFAULT 0.1, -- 'k' value in sigmoid function
    default_tpico_hours INTEGER DEFAULT 48, -- t_pico in hours
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Exercises Table
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, -- 'Composto', 'Isolador'
    cns_impact_factor FLOAT DEFAULT 1.0, -- Multiplier for CNS fatigue
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Muscle Activation Matrix (The Core of the Secondary Damage Logic)
CREATE TABLE exercise_muscle_activation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    muscle_group_id UUID REFERENCES muscle_groups(id) ON DELETE CASCADE,
    activation_percentage FLOAT NOT NULL, -- 0.0 to 1.0 (e.g., 1.0 for primary, 0.65 for secondary)
    UNIQUE(exercise_id, muscle_group_id)
);

-- 4. User Muscular Status (Current Fatigue State)
CREATE TABLE user_muscle_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Assuming integration with Supabase Auth
    muscle_group_id UUID REFERENCES muscle_groups(id) ON DELETE CASCADE,
    current_damage FLOAT DEFAULT 0.0, -- Cumulative D_efetivo
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, muscle_group_id)
);

-- 5. User CNS Status
CREATE TABLE user_cns_status (
    user_id UUID PRIMARY KEY,
    readiness_score FLOAT DEFAULT 100.0, -- 0 to 100
    last_workout_timestamp TIMESTAMP WITH TIME ZONE,
    recovery_rate_cns FLOAT DEFAULT 0.05 -- Rate at which CNS recovers
);

-- 6. Workout Logs (Historical Data)
CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    exercise_id UUID REFERENCES exercises(id),
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight_kg FLOAT NOT NULL,
    rpe INTEGER, -- 1 to 10
    techniques JSONB, -- e.g., ["drop_set", "fail"]
    rest_seconds INTEGER,
    effective_damage FLOAT,
    cns_fatigue_generated FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Data (Example)
INSERT INTO muscle_groups (name, recovery_rate_k, default_tpico_hours) VALUES 
('Peitoral', 0.08, 48),
('Tríceps Anterior', 0.12, 36),
('Deltoide Anterior', 0.10, 48),
('Quadríceps', 0.07, 72),
('Glúteo', 0.09, 60),
('Lombar', 0.06, 96);

INSERT INTO exercises (name, category, cns_impact_factor) VALUES 
('Supino Reto', 'Composto', 1.5),
('Agachamento Livre', 'Composto', 2.5),
('Rosca Direta', 'Isolador', 0.5);

-- Supino Reto Activation Matrix
INSERT INTO exercise_muscle_activation (exercise_id, muscle_group_id, activation_percentage) 
SELECT e.id, m.id, 1.0 FROM exercises e, muscle_groups m WHERE e.name = 'Supino Reto' AND m.name = 'Peitoral';
INSERT INTO exercise_muscle_activation (exercise_id, muscle_group_id, activation_percentage) 
SELECT e.id, m.id, 0.65 FROM exercises e, muscle_groups m WHERE e.name = 'Supino Reto' AND m.name = 'Tríceps Anterior';
INSERT INTO exercise_muscle_activation (exercise_id, muscle_group_id, activation_percentage) 
SELECT e.id, m.id, 0.5 FROM exercises e, muscle_groups m WHERE e.name = 'Supino Reto' AND m.name = 'Deltoide Anterior';
