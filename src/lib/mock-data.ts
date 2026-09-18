export const dailyCalorieGoal = "2.000 kcal";

export const calorieIntake = [
  { month: "Jan", calorias: 66, meta: 85 },
  { month: "Fev", calorias: 74, meta: 85 },
  { month: "Mar", calorias: 78, meta: 70 },
  { month: "Abr", calorias: 68, meta: 75 },
  { month: "Mai", calorias: 86, meta: 94 },
  { month: "Jun", calorias: 72, meta: 66 },
  { month: "Jul", calorias: 82, meta: 76 },
];

export const macroBreakdown = [
  { name: "Proteínas", value: 25, atual: 145, meta: 150, color: "#f4623a" },
  { name: "Gorduras", value: 45, atual: 65, meta: 70, color: "#f9c9b8" },
  { name: "Carboidratos", value: 30, atual: 220, meta: 250, color: "#7fc1e8" },
];

export const mealCategories = ["Todos", "Café da Manhã", "Almoço", "Lanche", "Jantar"] as const;

export const initialChatMessages = [
  {
    id: 1,
    role: "assistant" as const,
    text: "Olá, Masud! Sou seu assistente nutricional. Como posso te ajudar hoje?",
  },
  {
    id: 2,
    role: "user" as const,
    text: "Quantas calorias eu já consumi hoje?",
  },
  {
    id: 3,
    role: "assistant" as const,
    text: "Até agora você consumiu 1.985 kcal, bem próximo da sua meta diária de 2.000 kcal. Continue assim!",
  },
];

export const chatSuggestions = [
  "Quantas calorias devo consumir hoje?",
  "Sugira uma refeição rica em proteína",
  "Como está minha meta de carboidratos?",
  "Dicas para o jantar de hoje",
];

export const chatFallbackReplies = [
  "Baseado no seu plano alimentar, recomendo manter o equilíbrio entre proteínas e carboidratos nas próximas refeições.",
  "Você está indo bem em relação à sua meta diária! Que tal incluir mais vegetais no jantar?",
  "Posso sugerir opções do seu plano alimentar com bom valor nutricional, quer ver as recomendações?",
];

export const mealPlan = [
  {
    id: 1,
    title: "Torrada de Abacate com Ovo Poché",
    category: "Café da Manhã",
    image:
      "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=200&h=200&q=70",
    foods: [
      { name: "Pão integral", quantity: "2 fatias", carbs: 24, protein: 6, fat: 2, kcal: 140 },
      { name: "Abacate", quantity: "50 g", carbs: 4, protein: 1, fat: 10, kcal: 100 },
      { name: "Ovo poché", quantity: "1 unidade", carbs: 1, protein: 6, fat: 5, kcal: 70 },
      { name: "Azeite de oliva", quantity: "1 colher de chá", carbs: 0, protein: 0, fat: 5, kcal: 40 },
    ],
  },
  {
    id: 2,
    title: "Tacos de Camarão Grelhado com Salsa de Manga",
    category: "Almoço",
    image:
      "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=200&h=200&q=70",
    foods: [
      { name: "Tortilha integral", quantity: "2 unidades", carbs: 22, protein: 5, fat: 3, kcal: 130 },
      { name: "Camarão grelhado", quantity: "120 g", carbs: 0, protein: 20, fat: 2, kcal: 110 },
      { name: "Salsa de manga", quantity: "80 g", carbs: 15, protein: 1, fat: 0, kcal: 65 },
      { name: "Guacamole", quantity: "30 g", carbs: 1, protein: 0, fat: 7, kcal: 65 },
      { name: "Limão", quantity: "1 unidade", carbs: 0, protein: 0, fat: 0, kcal: 5 },
    ],
  },
  {
    id: 3,
    title: "Bowl de Salmão com Quinoa e Legumes",
    category: "Jantar",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=200&h=200&q=70",
    foods: [
      { name: "Salmão grelhado", quantity: "130 g", carbs: 0, protein: 26, fat: 12, kcal: 220 },
      { name: "Quinoa cozida", quantity: "100 g", carbs: 21, protein: 4, fat: 2, kcal: 120 },
      { name: "Brócolis no vapor", quantity: "80 g", carbs: 6, protein: 3, fat: 0, kcal: 35 },
      { name: "Cenoura", quantity: "50 g", carbs: 5, protein: 1, fat: 0, kcal: 20 },
      { name: "Azeite de oliva", quantity: "1 colher de chá", carbs: 0, protein: 0, fat: 5, kcal: 40 },
    ],
  },
];
