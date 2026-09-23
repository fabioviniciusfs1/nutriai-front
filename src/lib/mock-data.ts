import type { FoodFeedback } from "@/lib/food-feedback";
import type { WeightEntry } from "@/lib/auth";

export const macroBreakdown = [
  { name: "Proteínas", value: 25, atual: 145, meta: 150, color: "#f4623a" },
  { name: "Gorduras", value: 45, atual: 65, meta: 70, color: "#f9c9b8" },
  { name: "Carboidratos", value: 30, atual: 220, meta: 250, color: "#7fc1e8" },
];

export type Nutrient = {
  name: string;
  atual: number;
  meta: number;
  unit: string;
  /** `meta` é um limite máximo (ficar abaixo é o bom), não um alvo a atingir. */
  limit?: boolean;
};

export const otherMacros: Nutrient[] = [
  { name: "Fibras", atual: 22, meta: 30, unit: "g" },
  { name: "Açúcares", atual: 38, meta: 50, unit: "g", limit: true },
  { name: "Gordura saturada", atual: 16, meta: 20, unit: "g", limit: true },
  { name: "Colesterol", atual: 210, meta: 300, unit: "mg", limit: true },
];

export const vitamins: Nutrient[] = [
  { name: "Vitamina A", atual: 620, meta: 900, unit: "µg" },
  { name: "Vitamina B12", atual: 2.1, meta: 2.4, unit: "µg" },
  { name: "Vitamina C", atual: 95, meta: 90, unit: "mg" },
  { name: "Vitamina D", atual: 8, meta: 15, unit: "µg" },
  { name: "Vitamina E", atual: 11, meta: 15, unit: "mg" },
  { name: "Vitamina K", atual: 110, meta: 120, unit: "µg" },
  { name: "Ácido fólico (B9)", atual: 310, meta: 400, unit: "µg" },
];

export const minerals: Nutrient[] = [
  { name: "Cálcio", atual: 780, meta: 1000, unit: "mg" },
  { name: "Ferro", atual: 12, meta: 8, unit: "mg" },
  { name: "Magnésio", atual: 290, meta: 420, unit: "mg" },
  { name: "Potássio", atual: 2900, meta: 3400, unit: "mg" },
  { name: "Sódio", atual: 1800, meta: 2000, unit: "mg", limit: true },
  { name: "Zinco", atual: 9, meta: 11, unit: "mg" },
  { name: "Selênio", atual: 48, meta: 55, unit: "µg" },
];


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
    time: "07:30",
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
    time: "12:30",
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
    time: "20:00",
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

// Mesmos nutrientes da página Nutrientes, agrupados para o seletor do histórico.
export const nutrientGroups: { name: string; nutrients: Nutrient[] }[] = [
  {
    name: "Macronutrientes",
    nutrients: [
      ...macroBreakdown.map(({ name, atual, meta }) => ({ name, atual, meta, unit: "g" })),
      ...otherMacros,
    ],
  },
  { name: "Vitaminas", nutrients: vitamins },
  { name: "Minerais", nutrients: minerals },
];

// Consumo diário de cada nutriente nas mesmas datas de activityHistory. O último dia é
// o consumo de "hoje" mostrado na página Nutrientes; os anteriores variam ±25% em torno dele.
export const nutrientHistory = activityHistory.map(({ date }, i) => {
  const values: Record<string, number> = {};
  nutrientGroups
    .flatMap((group) => group.nutrients)
    .forEach(({ name, atual, meta }, k) => {
      if (i === activityHistory.length - 1) {
        values[name] = atual;
        return;
      }
      const value = atual * (0.75 + seeded(i * 13 + k * 101 + 700) * 0.5);
      values[name] = meta < 10 ? Math.round(value * 10) / 10 : Math.round(value);
    });
  return { date, values };
});

// Pesagens simuladas nos 90 dias ANTES do primeiro peso real do usuário, perdendo de 0,5 a
// 1 kg por semana até chegar nele. Só aparecem no gráfico; nada disso é salvo no localStorage.
export function mockWeightHistory(firstRealEntry: WeightEntry): WeightEntry[] {
  const entries: WeightEntry[] = [];
  const at = new Date(firstRealEntry.at);
  let kg = firstRealEntry.kg;
  let daysBack = 0;

  for (let i = 0; daysBack < 90; i++) {
    // Pesagens a cada 3 ou 4 dias (cerca de duas por semana), de manhã.
    const step = i % 2 === 0 ? 3 : 4;
    daysBack += step;
    const weeklyLoss = 0.5 + seeded(i + 900) * 0.5;
    kg += (weeklyLoss * step) / 7;

    const date = new Date(at);
    date.setDate(date.getDate() - daysBack);
    date.setHours(6 + Math.floor(seeded(i + 950) * 3), Math.floor(seeded(i + 980) * 60), 0, 0);
    entries.unshift({ id: `mock-${i}`, at: date.toISOString(), kg: Math.round(kg * 10) / 10 });
  }
  return entries;
}

export const activitySources = [
  { name: "Google Fit", platform: "Android", connected: true, lastSync: "21/09/2026 às 22:14" },
  { name: "Apple Saúde", platform: "iOS", connected: false, lastSync: null },
];

export const planHistory: {
  date: string;
  meals: { time: string; title: string; kcal: number; followed: boolean }[];
  flaggedFoods: { name: string; feedback: FoodFeedback }[];
}[] = [
  {
    date: "2026-09-21",
    meals: [
      { time: "07:30", title: "Torrada de Abacate com Ovo Poché", kcal: 350, followed: true },
      { time: "12:30", title: "Tacos de Camarão Grelhado com Salsa de Manga", kcal: 375, followed: true },
      { time: "16:00", title: "Iogurte Grego com Frutas Vermelhas", kcal: 180, followed: false },
      { time: "20:00", title: "Bowl de Salmão com Quinoa e Legumes", kcal: 435, followed: true },
    ],
    flaggedFoods: [{ name: "Guacamole", feedback: "nao-quero" }],
  },
  {
    date: "2026-09-20",
    meals: [
      { time: "07:30", title: "Panqueca de Aveia com Banana", kcal: 380, followed: true },
      { time: "12:30", title: "Frango Grelhado com Arroz Integral", kcal: 520, followed: true },
      { time: "16:00", title: "Mix de Castanhas", kcal: 190, followed: true },
      { time: "20:00", title: "Omelete de Espinafre com Salada", kcal: 340, followed: true },
    ],
    flaggedFoods: [],
  },
  {
    date: "2026-09-19",
    meals: [
      { time: "07:30", title: "Vitamina de Morango com Whey", kcal: 310, followed: true },
      { time: "12:30", title: "Peixe Assado com Batata-Doce", kcal: 480, followed: false },
      { time: "16:00", title: "Maçã com Pasta de Amendoim", kcal: 210, followed: true },
      { time: "20:00", title: "Sopa de Legumes com Frango", kcal: 360, followed: false },
    ],
    flaggedFoods: [
      { name: "Batata-doce", feedback: "nao-tenho" },
      { name: "Chuchu", feedback: "nao-gosto" },
    ],
  },
  {
    date: "2026-09-18",
    meals: [
      { time: "07:30", title: "Tapioca com Queijo Branco", kcal: 330, followed: true },
      { time: "12:30", title: "Carne Moída com Abobrinha e Arroz", kcal: 540, followed: true },
      { time: "16:00", title: "Iogurte Natural com Granola", kcal: 220, followed: true },
      { time: "20:00", title: "Wrap de Atum com Folhas", kcal: 390, followed: false },
    ],
    flaggedFoods: [{ name: "Atum em lata", feedback: "nao-gosto" }],
  },
  {
    date: "2026-09-17",
    meals: [
      { time: "07:30", title: "Ovos Mexidos com Pão Integral", kcal: 360, followed: true },
      { time: "12:30", title: "Strogonoff de Frango Light", kcal: 510, followed: true },
      { time: "16:00", title: "Banana com Aveia", kcal: 170, followed: true },
      { time: "20:00", title: "Salada de Grão-de-Bico", kcal: 380, followed: true },
    ],
    flaggedFoods: [],
  },
];
