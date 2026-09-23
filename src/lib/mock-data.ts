import type { FoodFeedback } from "@/lib/food-feedback";

export const macroBreakdown = [
  { name: "Proteínas", value: 25, atual: 145, meta: 150, color: "#f4623a" },
  { name: "Gorduras", value: 45, atual: 65, meta: 70, color: "#f9c9b8" },
  { name: "Carboidratos", value: 30, atual: 220, meta: 250, color: "#7fc1e8" },
];

export const otherMacros = [
  { name: "Fibras", atual: 22, meta: 30, unit: "g" },
  { name: "Açúcares", atual: 38, meta: 50, unit: "g" },
  { name: "Gordura saturada", atual: 16, meta: 20, unit: "g" },
  { name: "Colesterol", atual: 210, meta: 300, unit: "mg" },
];

export const vitamins = [
  { name: "Vitamina A", atual: 620, meta: 900, unit: "µg" },
  { name: "Vitamina B12", atual: 2.1, meta: 2.4, unit: "µg" },
  { name: "Vitamina C", atual: 95, meta: 90, unit: "mg" },
  { name: "Vitamina D", atual: 8, meta: 15, unit: "µg" },
  { name: "Vitamina E", atual: 11, meta: 15, unit: "mg" },
  { name: "Vitamina K", atual: 110, meta: 120, unit: "µg" },
  { name: "Ácido fólico (B9)", atual: 310, meta: 400, unit: "µg" },
];

export const minerals = [
  { name: "Cálcio", atual: 780, meta: 1000, unit: "mg" },
  { name: "Ferro", atual: 12, meta: 8, unit: "mg" },
  { name: "Magnésio", atual: 290, meta: 420, unit: "mg" },
  { name: "Potássio", atual: 2900, meta: 3400, unit: "mg" },
  { name: "Sódio", atual: 1800, meta: 2000, unit: "mg" },
  { name: "Zinco", atual: 9, meta: 11, unit: "mg" },
  { name: "Selênio", atual: 48, meta: 55, unit: "µg" },
];

export const mealCategories = ["Todos", "Café da Manhã", "Almoço", "Lanche", "Jantar"] as const;

export const initialChatMessages = [
  {
    id: 1,
    role: "assistant" as const,
    text: "Olá, {nome}! Sou seu assistente nutricional. Como posso te ajudar hoje?",
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

// Histórico: 90 dias até HISTORY_END, no formato em que viriam do Google Fit / Apple Saúde
// (atividade) somado ao consumo registrado no plano alimentar. Datas fixas para manter
// o render estático determinístico.
export const HISTORY_END = "2026-09-21";

function seeded(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export const activityHistory = Array.from({ length: 90 }, (_, i) => {
  const date = new Date(`${HISTORY_END}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (89 - i));
  const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;

  const steps = Math.round(5500 + seeded(i) * 6500 - (weekend ? 1500 : 0));
  const activeCalories = Math.round(steps * 0.04 + seeded(i + 100) * 180);

  return {
    date: date.toISOString().slice(0, 10),
    consumed: Math.round(1800 + seeded(i + 300) * 450 + (weekend ? 150 : 0)),
    burned: 1650 + activeCalories,
    activeCalories,
    steps,
    activeMinutes: Math.round(steps / 150 + seeded(i + 200) * 20),
    distanceKm: Math.round(steps * 0.00075 * 10) / 10,
    source: "Google Fit" as const,
  };
});

export const activitySources = [
  { name: "Google Fit", platform: "Android", connected: true, lastSync: "21/09/2026 às 22:14" },
  { name: "Apple Saúde", platform: "iOS", connected: false, lastSync: null },
];

export const planHistory: {
  date: string;
  meals: { category: string; title: string; kcal: number; followed: boolean }[];
  flaggedFoods: { name: string; feedback: FoodFeedback }[];
}[] = [
  {
    date: "2026-09-21",
    meals: [
      { category: "Café da Manhã", title: "Torrada de Abacate com Ovo Poché", kcal: 350, followed: true },
      { category: "Almoço", title: "Tacos de Camarão Grelhado com Salsa de Manga", kcal: 375, followed: true },
      { category: "Lanche", title: "Iogurte Grego com Frutas Vermelhas", kcal: 180, followed: false },
      { category: "Jantar", title: "Bowl de Salmão com Quinoa e Legumes", kcal: 435, followed: true },
    ],
    flaggedFoods: [{ name: "Guacamole", feedback: "nao-quero" }],
  },
  {
    date: "2026-09-20",
    meals: [
      { category: "Café da Manhã", title: "Panqueca de Aveia com Banana", kcal: 380, followed: true },
      { category: "Almoço", title: "Frango Grelhado com Arroz Integral", kcal: 520, followed: true },
      { category: "Lanche", title: "Mix de Castanhas", kcal: 190, followed: true },
      { category: "Jantar", title: "Omelete de Espinafre com Salada", kcal: 340, followed: true },
    ],
    flaggedFoods: [],
  },
  {
    date: "2026-09-19",
    meals: [
      { category: "Café da Manhã", title: "Vitamina de Morango com Whey", kcal: 310, followed: true },
      { category: "Almoço", title: "Peixe Assado com Batata-Doce", kcal: 480, followed: false },
      { category: "Lanche", title: "Maçã com Pasta de Amendoim", kcal: 210, followed: true },
      { category: "Jantar", title: "Sopa de Legumes com Frango", kcal: 360, followed: false },
    ],
    flaggedFoods: [
      { name: "Batata-doce", feedback: "nao-tenho" },
      { name: "Chuchu", feedback: "nao-gosto" },
    ],
  },
  {
    date: "2026-09-18",
    meals: [
      { category: "Café da Manhã", title: "Tapioca com Queijo Branco", kcal: 330, followed: true },
      { category: "Almoço", title: "Carne Moída com Abobrinha e Arroz", kcal: 540, followed: true },
      { category: "Lanche", title: "Iogurte Natural com Granola", kcal: 220, followed: true },
      { category: "Jantar", title: "Wrap de Atum com Folhas", kcal: 390, followed: false },
    ],
    flaggedFoods: [{ name: "Atum em lata", feedback: "nao-gosto" }],
  },
  {
    date: "2026-09-17",
    meals: [
      { category: "Café da Manhã", title: "Ovos Mexidos com Pão Integral", kcal: 360, followed: true },
      { category: "Almoço", title: "Strogonoff de Frango Light", kcal: 510, followed: true },
      { category: "Lanche", title: "Banana com Aveia", kcal: 170, followed: true },
      { category: "Jantar", title: "Salada de Grão-de-Bico", kcal: 380, followed: true },
    ],
    flaggedFoods: [],
  },
];
