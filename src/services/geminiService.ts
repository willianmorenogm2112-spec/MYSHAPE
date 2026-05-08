import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (process.env.GEMINI_API_KEY as string) || "";

const getMimeType = (dataUrl: string) => {
  const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
  return match ? match[1] : "image/jpeg";
};

const cleanJson = (text: string) => {
  // Remove markdown code blocks if present
  return text.replace(/```json\n?|```/g, "").trim();
};

const aiClient = new GoogleGenAI({ apiKey: API_KEY });

const callGemini = async (model: string, contents: any, isJson: boolean = true) => {
  if (!API_KEY) {
    throw new Error("Chave de API não encontrada. Por favor, adicione VITE_GEMINI_API_KEY.");
  }

  const response = await aiClient.models.generateContent({
    model,
    contents,
    config: isJson ? { responseMimeType: "application/json" } : undefined
  });

  const text = response.text || "{}";
  
  if (!isJson) return text;

  try {
    return JSON.parse(cleanJson(text));
  } catch (e) {
    console.error("Erro ao processar JSON do Gemini:", e, "Texto recebido:", text);
    throw new Error("Resposta da IA em formato inválido. Tente novamente.");
  }
};

export const analyzeShape = async (images: { front?: string; back?: string; side?: string }, profile: { weight: number; goal: string }, isPump: boolean = false) => {
  const parts: any[] = [
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

  if (images.front) parts.push({ inlineData: { mimeType: getMimeType(images.front), data: images.front.split(",")[1] } });
  if (images.back) parts.push({ inlineData: { mimeType: getMimeType(images.back), data: images.back.split(",")[1] } });
  if (images.side) parts.push({ inlineData: { mimeType: getMimeType(images.side), data: images.side.split(",")[1] } });

  return callGemini("gemini-flash-latest", [{ parts }]);
};

export const projectShape = async (image: string, type: 'fat-loss' | 'muscle-gain') => {
  const prompt = type === 'fat-loss' 
    ? "Edite esta imagem para simular como o corpo ficaria com -5% de gordura corporal, mantendo a massa muscular e aumentando a definição abdominal e vascularização."
    : "Edite esta imagem para simular como o corpo ficaria com +5kg de massa muscular magra, aumentando o volume dos ombros, peito e braços, mantendo a definição.";

  const response = await aiClient.models.generateContent({
    model: 'gemini-flash-latest',
    contents: [{
      parts: [
        { inlineData: { data: image.split(",")[1], mimeType: getMimeType(image) } },
        { text: prompt },
      ],
    }],
  });

  const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (part?.inlineData) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};

export const generatePersonalizedTraining = async (analysis: any, profile: any, quizAnswers: any) => {
  const contents = `Você é um treinador de elite. Com base na análise do físico: ${JSON.stringify(analysis)} 
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
    
    USE PORTUGUÊS DO BRASIL.`;

  return callGemini("gemini-flash-latest", [{ parts: [{ text: contents }] }]);
};

export const analyzeFoodPhoto = async (image: string) => {
  const contents = [
    { inlineData: { data: image.split(",")[1], mimeType: getMimeType(image) } },
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
  ];

  return callGemini("gemini-flash-latest", [{ parts: contents }]);
};

export const analyzeExerciseVideo = async (videoData: string) => {
  const contents = [
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
  ];

  return callGemini("gemini-flash-latest", [{ parts: contents }]);
};

export const generateMealPlan = async (analysis: any, profile: any, dietAnswers: any) => {
  const contents = `Você é um nutricionista esportivo de elite. Com base na análise do físico: ${JSON.stringify(analysis)} 
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
    
    USE PORTUGUÊS DO BRASIL.`;

  return callGemini("gemini-flash-latest", [{ parts: [{ text: contents }] }]);
};

export const getExerciseDetails = async (exerciseName: string) => {
  const contents = `Explique a execução perfeita do exercício "${exerciseName}".
    Inclua:
    1. Posição Inicial
    2. Movimento (Fase Concêntrica e Excêntrica)
    3. Dica de Ouro (Biomecânica)
    4. Erros Comuns
    Retorne em Markdown estruturado. USE PORTUGUÊS DO BRASIL.`;

  return callGemini("gemini-flash-latest", [{ parts: [{ text: contents }] }], false);
};

export const generateShoppingList = async (mealPlan: any) => {
  const contents = `Com base no plano de refeições: ${JSON.stringify(mealPlan)}, gere uma lista de compras inteligente organizada por categorias (Proteínas, Carboidratos, Gorduras, Vegetais/Frutas, Outros).
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
    USE PORTUGUÊS DO BRASIL.`;

  return callGemini("gemini-flash-latest", [{ parts: [{ text: contents }] }]);
};

export const generateRouteDayPlan = async (profile: any, dietAnswers: any) => {
  const contents = `O usuário vai passar o dia fora de casa (Dia de Rota). Com base no perfil: ${JSON.stringify(profile)} e objetivo: ${dietAnswers.objective}, forneça sugestões de refeições práticas que podem ser encontradas em restaurantes, self-services ou lojas de conveniência, mantendo a meta calórica e de macros.
    
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
    USE PORTUGUÊS DO BRASIL.`;

  return callGemini("gemini-flash-latest", [{ parts: [{ text: contents }] }]);
};

export const chatWithCoach = async (message: string, context?: any) => {
  const contents = `Você é o "Treinador IA Elite", um especialista em fisiculturismo, nutrição e biomecânica.
    Sua missão é ajudar o usuário a alcançar o shape dos sonhos com ciência e motivação.
    
    Contexto do Usuário (se disponível): ${JSON.stringify(context)}
    Mensagem do Usuário: "${message}"
    
    Responda de forma direta, técnica mas motivadora. Use emojis de academia.
    Retorne a resposta em Markdown. USE PORTUGUÊS DO BRASIL.`;

  return callGemini("gemini-flash-latest", [{ parts: [{ text: contents }] }], false);
};
