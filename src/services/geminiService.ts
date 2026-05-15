import { GoogleGenAI, Type } from "@google/genai";

// Using a more robust detection that works with Vite's 'define' and standard env vars
const API_KEY = 
  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
  (import.meta as any).env.VITE_GEMINI_API_KEY || 
  (import.meta as any).env.GEMINI_API_KEY || 
  "AIzaSyAF1t8NzyiSUV82539KyCohxZMOo-SGRP8"; // Updated user API key

if (!API_KEY) {
  console.warn("Gemini API Key not found. Please check your .env or Vercel environment variables.");
}


const safeParseJSON = (text: string) => {
  try {
    // Remove markdown codeblock from start/end if present
    const cleanText = text.replace(/^```json/im, "").replace(/^```/im, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    // Try to extract JSON between first { and last }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        const jsonStr = text.substring(start, end + 1)
          .replace(/\\n/g, "\\\\n") 
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t");
        return JSON.parse(jsonStr);
      } catch (innerE) {
        console.error("Failed to parse extracted JSON:", innerE);
        console.error("String was:", text.substring(start, end + 1));
      }
    }
    return {};
  }
};

export const analyzeShape = async (images: { front?: string; back?: string; side?: string }, profile: { weight: number; height?: number; goal: string; age?: number; gender?: string; gymLevel?: string }, isPump: boolean = false, model: 'fast' | 'best' = 'fast') => {
  if (!API_KEY) {
    throw new Error("API Key not found. Please add GEMINI_API_KEY to secrets.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const definitivePrompt = `Você é um sistema de análise corporal de nível profissional. Sua função não é apenas descrever o físico da pessoa — você age como um treinador elite, especialista em biomecânica, analista postural, consultor de hipertrofia e estrategista de treino e dieta.

Ao receber as fotos, gere uma análise completa, técnica, detalhada e personalizada. NUNCA gere respostas genéricas. Cada análise deve parecer feita exclusivamente para aquele físico.

# PRÉ-ANÁLISE — CONTEXTO DO USUÁRIO
Dados do usuário:
- Sexo e idade: ${profile.gender || 'Não informado'}, ${profile.age || 'Não informado'} anos
- Peso: ${profile.weight}kg
- Altura: ${profile.height ? `${profile.height}cm` : 'Não informado'}
- Objetivo principal: ${profile.goal}
- Nível de experiência: ${profile.gymLevel || 'Não informado'}

# ETAPA 1 — ANÁLISE VISUAL COMPLETA
1.1 Visão Geral do Shape (Biotipo, BF, Nível muscular, Proporção)
1.2 Estrutura Corporal (V-taper, Upper/Lower)
1.3 Análise por Grupo Muscular (Superior, Core, Inferior com notas 0-10)
1.4 Pontos Fortes (3-5 destaques e como potencializar)
1.5 Pontos Fracos (3-5 limitadores e estratégia)
1.6 Simetria e Assimetrias (desvios e como corrigir)
1.7 Análise Postural (desvios e corretivos)
1.8 Condicionamento
1.9 Potencial Genético

# ETAPA 2 — ESTRATÉGIA INTELIGENTE
Decisão e justificativa (Bulk, Cutting, Recomposição, Mini cut).

# ETAPA 3 — PLANO DE TREINO ULTRA PERSONALIZADO
3.1 Parâmetros (divisão, ciclo)
3.2 Treino Detalhado (use tabelas Markdown com: Exercício | Séries | Reps | Cadência | Descanso | Observações)
3.3 Treino Corretivo Integrado
3.4 Progressão
3.5 Cardio

# ETAPA 4 — PLANO NUTRICIONAL ESTRATÉGICO
4.1 Estimativas Calóricas
4.2 Macros
4.3 Plano Alimentar — Dia Típico (Use tabelas: Horário | Refeição | Alimentos | Macros | Objetivo)
4.4 Estratégias Nutricionais
4.5 Suplementação (Tabela: Suplemento | Dosagem | Timing | Justificativa)

# ETAPA 5 — PLANO DE EVOLUÇÃO
Fases 1, 2, 3 e 4. Marcos e reavaliação.

# ETAPA 6 — NOTA GERAL E RESUMO EXECUTIVO
Notas 0-10 para músculos e Resumo final impactante.`;

  const parts = [
    {
      text: `ATENÇÃO: O usuário configurou o seguinte PROMPT DEFINITIVO para a estruturação do relatório:
      
${definitivePrompt}

${isPump ? "ESTA É UMA FOTO PÓS-TREINO (PUMP). Considere a vascularização e o volume temporário." : ""}

Responda em formato JSON seguindo a estrutura técnica solicitada.`
    }
  ];

  if (images.front) {
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: images.front.split(",")[1] }
    } as any);
  }
  if (images.back) {
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: images.back.split(",")[1] }
    } as any);
  }
  if (images.side) {
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: images.side.split(",")[1] }
    } as any);
  }

  const aiModel = model === 'best' ? "gemini-3.1-pro-preview" : "gemini-1.5-flash";

  try {
    const response = await ai.models.generateContent({
      model: aiModel,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          bfEstimate: { type: Type.NUMBER },
          metrics: {
            type: Type.OBJECT,
            properties: {
              volume: { type: Type.NUMBER },
              definition: { type: Type.NUMBER },
              symmetry: { type: Type.NUMBER },
              density: { type: Type.NUMBER }
            },
            required: ["volume", "definition", "symmetry", "density"]
          },
          proportions: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              imbalances: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["description", "imbalances"]
          },
          analysis: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING }
            },
            required: ["strengths", "weaknesses", "summary"]
          },
          posture: {
            type: Type.OBJECT,
            properties: {
              detected: { type: Type.BOOLEAN },
              issue: { type: Type.STRING },
              severity: { type: Type.STRING },
              correction: { type: Type.STRING },
              corrective_exercise: {
                type: Type.OBJECT,
                properties: {
                  nome: { type: Type.STRING },
                  series: { type: Type.STRING },
                  repeticoes: { type: Type.STRING },
                  why: { type: Type.STRING }
                },
                required: ["nome", "series", "repeticoes", "why"]
              }
            },
            required: ["detected", "issue", "severity", "correction", "corrective_exercise"]
          },
          recommendations: {
            type: Type.OBJECT,
            properties: {
              trainingFocus: { type: Type.STRING },
              correctiveExercises: { type: Type.ARRAY, items: { type: Type.STRING } },
              dietPhase: { type: Type.STRING },
              macros: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fats: { type: Type.NUMBER }
                },
                required: ["calories", "protein", "carbs", "fats"]
              },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["trainingFocus", "correctiveExercises", "dietPhase", "macros", "tips"]
          },
          fullMarkdownReport: { type: Type.STRING }
        },
        required: [
          "overallScore", 
          "bfEstimate", 
          "metrics", 
          "proportions", 
          "analysis", 
          "posture",
          "recommendations", 
          "fullMarkdownReport"
        ]
      }
    }
    });

    const parsed = safeParseJSON(response.text || "{}");
    return parsed;
  } catch (error: any) {
    console.error("Gemini API Error (analyzeShape):", error);
    throw error;
  }
};

export const projectShape = async (image: string, type: 'fat-loss' | 'muscle-gain') => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = type === 'fat-loss' 
    ? "Edite esta imagem para simular como o corpo ficaria com -5% de gordura corporal, mantendo a massa muscular e aumentando a definição abdominal e vascularização."
    : "Edite esta imagem para simular como o corpo ficaria com +5kg de massa muscular magra, aumentando o volume dos ombros, peito e braços, mantendo a definição.";

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: {
      parts: [
        { inlineData: { data: image.split(",")[1], mimeType: "image/jpeg" } },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generatePersonalizedTraining = async (analysis: any, profile: any, quizAnswers: any) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `Você é um treinador de elite. Com base na análise do físico: ${JSON.stringify(analysis)} 
    e no perfil do usuário: ${JSON.stringify(profile)}, crie um plano de treinamento semanal PREMIUM e ESPECÍFICO.
    Respostas do Quiz do Usuário: ${JSON.stringify(quizAnswers)}
    Nível da Academia: ${profile.gymLevel || 'Média'}
    
    REGRAS DE EQUIPAMENTO:
    - Se o nível for 'Básica', foque em exercícios com pesos livres (halteres, barras, bancos). Substitua máquinas por variações equivalentes (ex: Extensora por Afundo ou Agachamento Búlgaro).
    - Se o nível for 'Média', use máquinas padrão e polias.
    - Se o nível for 'Elite', inclua máquinas articuladas e equipamentos avançados.
    
    Foque em corrigir as fraquezas mencionadas.
    
    Retorne os dados estritamente no formato JSON seguindo este esquema:
    {
      "days": [
        {
          "day": "Segunda-feira",
          "title": "PUSH (Foco Peitoral Superior)",
          "focus": "Peitoral, Ombros e Tríceps",
          "exercises": [
            {
              "name": "Supino Inclinado com Barra",
              "sets": 4,
              "reps": "5-7",
              "technique": "Carga Máxima",
              "rest": "2 min",
              "tip": "Foco na fase excêntrica (4 seg)",
              "why": "Explicação do porquê este exercício foi escolhido com base na sua análise"
            }
          ],
          "macros": {
            "calories": 2550,
            "protein": 180,
            "carbs": 300,
            "fats": 70
          }
        }
      ]
    }
    
    USE PORTUGUÊS DO BRASIL.`,
    config: {
      responseMimeType: "application/json",
    }
  });
  return safeParseJSON(response.text || "{}");
};

export const analyzeFoodPhoto = async (image: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: {
      parts: [
        { inlineData: { data: image.split(",")[1], mimeType: "image/jpeg" } },
        { text: `Analise esta foto de comida. Identifique os alimentos, estime o peso de cada um e calcule os macros.
      Retorne estritamente no formato JSON seguindo este esquema:
      {
        "items": [
          {
            "name": "Arroz Branco",
            "estimatedWeight": 150,
            "protein": 4,
            "carbs": 42,
            "fats": 0.5,
            "calories": 195
          }
        ],
        "totalMacros": {
          "protein": 45,
          "carbs": 60,
          "fats": 8,
          "calories": 492
        }
      }
      USE PORTUGUÊS DO BRASIL.` }
      ],
    },
    config: {
      responseMimeType: "application/json",
    }
  });
  return safeParseJSON(response.text || "{}");
};

export const analyzeExerciseVideo = async (videoData: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: {
      parts: [
        { inlineData: { data: videoData.split(",")[1], mimeType: "video/mp4" } },
        { text: `Analise a biomecânica deste exercício. Identifique erros de execução e forneça correções pontuais.
      Retorne estritamente no formato JSON seguindo este esquema:
      {
        "exerciseName": "Agachamento Livre",
        "biomechanicsScore": 85,
        "errors": ["Joelhos entrando (valgo dinâmico)", "Tronco muito inclinado à frente"],
        "corrections": ["Force os joelhos para fora", "Mantenha o peito aberto e olhe para frente"],
        "summary": "Sua execução está boa, mas precisa de ajustes na estabilidade do core e joelhos."
      }
      USE PORTUGUÊS DO BRASIL.` }
      ],
    },
    config: {
      responseMimeType: "application/json",
    }
  });
  return safeParseJSON(response.text || "{}");
};

export const generateMealPlan = async (isPremium: boolean, data: any) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const basePrompt = `Você é um nutricionista esportivo de elite.
  
  Crie um plano de dieta detalhado retornando ESTRITAMENTE em formato JSON.
  O usuário enviou os seguintes dados:
  ${JSON.stringify(data)}
  
  ${isPremium ? "Este é um plano PREMIUM baseado em análise de inteligência artificial do físico do usuário. Use as assimetrias e a análise para criar uma observação especial." : "Este é um plano baseado em dados manuais do usuário."}
  
  Gere o plano garantindo que a meta calórica e macros calculados sejam respeitados e divididos nas refeições de forma realista.
  
  Retorne ESTE ESQUEMA JSON EXATO:
  {
    "resumo_metabolico": {
      "tmb": 0,
      "get": 0,
      "meta_calorica": 0,
      "proteina_g": 0,
      "carbo_g": 0,
      "gordura_g": 0
    },
    "refeicoes": [
      {
        "nome": "Café da Manhã",
        "horario": "08:00",
        "calorias": 0,
        "proteina_g": 0,
        "carbo_g": 0,
        "gordura_g": 0,
        "opcoes": [
          {
            "alimento": "Ovo cozido",
            "quantidade": "2 unidades",
            "calorias": 140
          }
        ]
      }
    ],
    "dicas_timing": ["Dica 1", "Dica 2"],
    "lista_compras": ["Item 1", "Item 2"],
    "observacao_especial": "Mensagem motivacional ou focada na análise do shape"
  }
  
  USE PORTUGUÊS DO BRASIL.`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: basePrompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  return safeParseJSON(response.text || "{}");
};

export const generateTrainingPlan = async (isPremium: boolean, data: any) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const basePrompt = `Você é um treinador de elite especialista em biomecânica e hipertrofia.
  
  Crie um plano de treino detalhado retornando ESTRITAMENTE em formato JSON.
  O usuário enviou os seguintes dados:
  ${JSON.stringify(data)}
  
  ${isPremium ? `Este é um plano PREMIUM baseado em análise de inteligência artificial do físico do usuário. 
  MUITO IMPORTANTE: 
  - Se o usuário especificou 'focusMuscle' (${data.focusMuscle}), você DEVE dar ênfase extra nesse músculo no treino, mas SEM ignorar a correção geral baseada na foto (assimetrias e pontos fracos).
  - O nome do plano DEVE ser o 'planName' (${data.planName}) caso o usuário tenha fornecido.` : "Este é um plano baseado em dados manuais do usuário."}
  
  Retorne ESTE ESQUEMA JSON EXATO:
  {
    "nome_do_plano": "O planName fornecido ou um nome criativo",
    "foco_principal": "Descrição do foco do treino",
    "divisao": "Ex: ABC",
    "dias": [
      {
        "nome_dia": "Segunda-feira",
        "musculo_foco": "Peito",
        "exercicios": [
          {
            "nome": "Supino Reto",
            "series": 4,
            "repeticoes": "8-12",
            "descanso_segundos": 90,
            "tecnica_especial": "Normal",
            "grupo_muscular": "Peitoral",
            "prioridade": "normal",
            "why": "Explique o porquê científico/biomecânico deste exercício estar aqui baseado no objetivo/shape do usuário"
          }
        ]
      }
    ]
  }
  
  USE PORTUGUÊS DO BRASIL.`;

  const aiModel = data.generationModel === 'best' ? "gemini-3.1-pro-preview" : "gemini-1.5-flash";

  const response = await ai.models.generateContent({
    model: aiModel,
    contents: basePrompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  return safeParseJSON(response.text || "{}");
};

export const getExerciseDetails = async (exerciseName: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `Explique a execução perfeita do exercício "${exerciseName}".
    Inclua:
    1. Posição Inicial
    2. Movimento (Fase Concêntrica e Excêntrica)
    3. Dica de Ouro (Biomecânica)
    4. Erros Comuns
    Retorne em Markdown estruturado. USE PORTUGUÊS DO BRASIL.`,
  });
  return response.text;
};

export const generateShoppingList = async (mealPlan: any) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `Com base no plano de refeições: ${JSON.stringify(mealPlan)}, gere uma lista de compras inteligente organizada por categorias (Proteínas, Carboidratos, Gorduras, Vegetais/Frutas, Outros).
    Estime as quantidades necessárias para uma semana.
    
    Retorne os dados estritamente no formato JSON seguindo este esquema:
    {
      "categories": [
        {
          "name": "Proteínas",
          "items": [
            { "name": "Peito de Frango", "amount": "2kg" },
            { "name": "Ovos", "amount": "3 dúzias" }
          ]
        }
      ]
    }
    USE PORTUGUÊS DO BRASIL.`,
    config: {
      responseMimeType: "application/json",
    }
  });
  return safeParseJSON(response.text || "{}");
};

export const generateRouteDayPlan = async (profile: any, dietAnswers: any) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `O usuário vai passar o dia fora de casa (Dia de Rota). Com base no perfil: ${JSON.stringify(profile)} e objetivo: ${dietAnswers.objective}, forneça sugestões de refeições práticas que podem ser encontradas em restaurantes, self-services ou lojas de conveniência, mantendo a meta calórica e de macros.
    
    Retorne os dados estritamente no formato JSON seguindo este esquema:
    {
      "suggestions": [
        {
          "place": "Restaurante Self-Service",
          "meal": "Almoço",
          "choice": "Arroz, feijão, grelhado e muita salada",
          "tip": "Evite frituras e molhos pesados"
        },
        {
          "place": "Loja de Conveniência",
          "meal": "Lanche",
          "choice": "Iogurte proteico ou barra de proteína",
          "tip": "Verifique o rótulo para evitar excesso de açúcar"
        }
      ]
    }
    USE PORTUGUÊS DO BRASIL.`,
    config: {
      responseMimeType: "application/json",
    }
  });
  return safeParseJSON(response.text || "{}");
};

export const chatWithCoach = async (message: string, context?: any) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `Você é o motor do Shape Analyzer Pro. Sua missão é manter a interface limpa, funcional e converter o usuário para o Premium.
    Responda à dúvida do usuário de forma técnica e motivadora SEMPRE EM PORTUGUÊS DO BRASIL. 
    
    REGRAS DE FORMATAÇÃO (Obrigatórias):
    1. DIETA: Nunca use blocos de texto. Responda APENAS usando a estrutura de Cards HTML/Tailwind. Cada refeição deve ter um botão "Trocar Alimento" usando a sintaxe: [BUTTON:SWAP_FOOD:MealName].
    2. TREINO: Use tabelas ou listas de cards. Inclua um Checkbox ao lado de cada exercício. No final do treino, renderize o botão "CONCLUIR TREINO DE HOJE" usando a sintaxe: [BUTTON:FINISH_WORKOUT].
    3. COACH IA: Formate as respostas com títulos (h3), negrito em termos técnicos, listas e o botão "Ver Biomecânica" usando a sintaxe: [BUTTON:VIEW_EXERCISE:ExerciseName].
    
    Contexto do usuário: ${JSON.stringify(context)}
    Pergunta: ${message}`,
  });
  return response.text;
};

export const generateCorrectivePlan = async (analysis: any, profile: any) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `Você é um nutricionista e treinador esportivo. Com base na análise do físico: ${JSON.stringify(analysis)} e perfil: ${JSON.stringify(profile)}, emita um PLANO CORRETIVO INTEGRADO.
    Foque especificamente em corrigir assimetrias musculares reveladas na análise.
    Retorne os dados estritamente no formato JSON seguindo este esquema:
    {
      "summary": "Resumo do que precisa ser corrigido",
      "trainingFocus": ["foco 1", "foco 2"],
      "dietFocus": ["dica alimentar associada à correção"],
      "recommendedSplit": "Divisão sugerida ex: Push/Pull/Legs ou ABCD",
      "priorityExercises": [
        { "name": "Exercício Específico", "reason": "Motivo biomecânico ou de simetria" }
      ],
      "macroAdjustments": "Como os macros devem ser ajustados para esse objetivo"
    }
    Use PT-BR.`,
    config: {
      responseMimeType: "application/json",
    }
  });
  return safeParseJSON(response.text || "{}");
};
