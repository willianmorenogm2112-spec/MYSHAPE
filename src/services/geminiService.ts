import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (process.env.GEMINI_API_KEY as string) || "";

export const analyzeShape = async (images: { front?: string; back?: string; side?: string }, profile: { weight: number; goal: string }, isPump: boolean = false) => {
  if (!API_KEY) {
    throw new Error("Chave de API não encontrada. Por favor, adicione VITE_GEMINI_API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const parts = [
    {
      text: `Você é um juiz profissional de fisiculturismo e coach de alta performance. 
      Analise as imagens deste físico (frente, costas e lado, se disponíveis) e forneça um feedback detalhado EM PORTUGUÊS.
      Considere o peso do usuário (${profile.weight}kg) e o objetivo (${profile.goal}).
      
      ${isPump ? "ESTA É UMA FOTO PÓS-TREINO (PUMP). Compare com o estado de repouso esperado para este físico, analisando vascularização e volume temporário." : ""}
      
      IMPORTANTE: Todas as descrições, análises, pontos fortes, pontos fracos e dicas DEVEM estar em português do Brasil.
      
      Retorne os dados estritamente no formato JSON seguindo este esquema:
      {
        "overallScore": number (0-100),
        "bfEstimate": number (estimativa de percentual de gordura),
        "metrics": {
          "volume": number (0-100),
          "definition": number (0-100),
          "symmetry": number (0-100),
          "density": number (0-100)
        },
        "proportions": {
          "description": string (em português),
          "imbalances": string[] (ex: ["Braço esquerdo levemente menor"])
        },
        "analysis": {
          "strengths": string[] (em português),
          "weaknesses": string[] (em português),
          "summary": string (em português),
          "pumpAnalysis": {
            "vascularityScore": number (0-100),
            "volumeIncrease": string (ex: "Aumento de 2cm nos bíceps"),
            "comparison": string (comparação com estado de repouso)
          } (opcional, apenas se isPump for true)
        },
        "symmetryRanking": {
          "score": number (0-100),
          "position": number,
          "percentile": number,
          "globalPosition": string (ex: "Top 5% da comunidade")
        },
        "recommendations": {
          "trainingFocus": string (em português),
          "correctiveExercises": string[] (em português),
          "dietPhase": "Cutting" | "Bulking" | "Recomposição",
          "macros": {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fats": number
          },
          "tips": string[] (em português)
        }
      }`
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

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [{ parts }],
    config: {
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
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
              "tip": "Foco na fase excêntrica (4 seg)"
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
  return JSON.parse(response.text || "{}");
};

export const analyzeFoodPhoto = async (image: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [
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
    config: {
      responseMimeType: "application/json",
    }
  });
  return JSON.parse(response.text || "{}");
};

export const analyzeExerciseVideo = async (videoData: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [
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
    config: {
      responseMimeType: "application/json",
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateMealPlan = async (analysis: any, profile: any, dietAnswers: any) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `Você é um nutricionista esportivo de elite. Com base na análise do físico: ${JSON.stringify(analysis)} 
    e no perfil do usuário: ${JSON.stringify(profile)}, crie um plano de refeições diário detalhado.
    Respostas do Quiz de Dieta: ${JSON.stringify(dietAnswers)}
    
    Retorne os dados estritamente no formato JSON seguindo este esquema:
    {
      "meals": [
        {
          "id": "meal-1",
          "title": "Refeição 01 - Café da Manhã (Pre-Workout)",
          "time": "07:00h",
          "items": [
            { "name": "Arroz Branco", "amount": "200g" },
            { "name": "Frango Grelhado", "amount": "150g" }
          ],
          "macros": {
            "protein": 45,
            "carbs": 60,
            "fats": 8,
            "calories": 492
          },
          "tip": "Consumir 1h antes do treino"
        }
      ],
      "totalMacros": {
        "calories": 2550,
        "protein": 180,
        "carbs": 300,
        "fats": 70
      }
    }
    
    USE PORTUGUÊS DO BRASIL.`,
    config: {
      responseMimeType: "application/json",
    }
  });
  return JSON.parse(response.text || "{}");
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
  return JSON.parse(response.text || "{}");
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
  return JSON.parse(response.text || "{}");
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
