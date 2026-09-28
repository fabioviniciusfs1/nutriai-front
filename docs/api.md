# API do NutriAI

Endpoints que o front chama. Os tipos TypeScript de cada corpo e resposta estão em
[`src/lib/api/types.ts`](../src/lib/api/types.ts) — se algo aqui divergir, os tipos valem.

Os dados simulados que o front usava antes estão no histórico do git (`git show 158453f:src/lib/mock-data.ts`)
e servem de semente para o banco.

## Convenções

- **URL base:** `NEXT_PUBLIC_API_URL` (ver `.env.example`). Todas as rotas abaixo são relativas a ela.
- **Formato:** JSON (`Content-Type: application/json`), nomes de campo em camelCase.
- **Autenticação:** as rotas marcadas com 🔒 exigem `Authorization: Bearer <token>`. Token inválido ou
  expirado → `401`; o front descarta o token e volta para `/login`.
- **Erros:** status 4xx/5xx com corpo `{ "error": "mensagem em pt-BR" }`. A mensagem é mostrada ao
  usuário como está (ex.: `"Usuário ou senha incorretos."`).
- **Datas:** dia do calendário como `"AAAA-MM-DD"`; data e hora em ISO 8601 (`"2026-09-28T07:15:00.000Z"`).
  Horário de refeição como `"HH:MM"`.
- **Quantidades de alimentos sempre em gramas** (`grams`), nunca medidas caseiras.
- **CORS:** o front roda em outra origem (Cloudflare Workers / Docker na porta 3000). Libere a origem
  dele, os métodos `GET, POST, PUT, DELETE` e os cabeçalhos `Authorization, Content-Type`.

## Divisão de responsabilidades

O back **fornece e guarda** os dados; os cálculos do plano do dia continuam no front:

- O front monta o plano de hoje a partir do plano base (`GET /meal-plan`) + as mudanças do usuário
  (`planChanges`, `dayPlan`, trocas de alimentos), calcula porções, totais e a redistribuição de calorias.
- O back guarda essas mudanças como o front as envia (rotas `/me/...`) e devolve o estado completo.
- Meta calórica e de água também são calculadas no front a partir do perfil (`src/lib/calorie-target.ts`).

## Autenticação

### `POST /auth/signup`

```json
{ "name": "Ana Souza", "username": "ana.souza", "password": "segredo123" }
```

- `username`: já chega normalizado (minúsculas, sem espaços), 3–20 caracteres `[a-z0-9._]`.
- `password`: mínimo 6 caracteres.
- Usuário já existe → `409` `{ "error": "Esse usuário já está em uso." }`.

Resposta `201`: `{ "token": "..." }`. O usuário nasce com `profile: null` (o front leva para `/perfil`).

### `POST /auth/login`

```json
{ "username": "ana.souza", "password": "segredo123" }
```

Resposta `200`: `{ "token": "..." }`. Credenciais erradas → `401` `{ "error": "Usuário ou senha incorretos." }`.

Logout é só no front (descarta o token); não há rota.

## Estado do usuário 🔒

### `GET /me` → `UserState`

Chamado ao abrir o app. **Todas as rotas que alteram `/me` respondem `200` com este mesmo objeto
completo e atualizado**, que o front usa para substituir o que tinha.

```json
{
  "user": { "name": "Ana Souza", "username": "ana.souza" },
  "profile": {
    "sex": "feminino",
    "age": 32,
    "weightKg": 68.5,
    "heightCm": 165,
    "activityLevel": "moderado",
    "goal": "perder",
    "mealsPerDay": 4,
    "weighInDay": 1
  },
  "mealTimes": { "1": "08:00" },
  "weights": [{ "id": "w-1", "at": "2026-09-28T07:15:00.000Z", "kg": 68.2 }],
  "planChanges": { "removed": [], "added": [], "extraFoods": {}, "scales": {} },
  "dayPlan": null,
  "foodFeedback": { "Guacamole": "nao-gosto" },
  "foodSubstitutes": { "Guacamole": "Abacate" },
  "mealFoodSwaps": { "2": { "Limão": "" } }
}
```

| Campo | Descrição |
| --- | --- |
| `profile` | `null` até o primeiro `PUT /me/profile`. `sex`: `feminino \| masculino`. `activityLevel`: `sedentario \| leve \| moderado \| intenso \| extremo`. `goal`: `perder \| manter \| ganhar`. `mealsPerDay`: 3–6. `weighInDay`: dia da semana do lembrete de pesagem, 0 = domingo … 6 = sábado. |
| `mealTimes` | Horário escolhido pelo usuário para refeições do plano base (id → `"HH:MM"`). |
| `weights` | Pesagens (qualquer ordem; o front ordena). Não alteram `profile.weightKg`. |
| `planChanges` | Mudanças permanentes do plano (ver `PlanChanges` em `types.ts`): refeições removidas, criadas (`added`, ids ≥ 1001), alimentos acrescentados (`extraFoods`) e fatores de porção (`scales`). Chaves numéricas de objetos viram string no JSON. |
| `dayPlan` | Mudanças que valem só num dia: `{ "date": "2026-09-28", "changes": { "removed": [], "replacements": {}, "scales": {} } }`. O front ignora se `date` não for hoje; o back pode descartar as antigas. |
| `foodFeedback` | Alimentos restritos: nome → `nao-gosto \| nao-quero \| nao-tenho`. |
| `foodSubstitutes` | Trocas em todas as refeições: nome → substituto (`""` = removido sem substituto). |
| `mealFoodSwaps` | Trocas numa refeição só: id da refeição → nome → substituto (`""` = removido). |

### `PUT /me/profile` → `UserState`

Corpo: o objeto `profile` inteiro (todos os campos obrigatórios).

### `PUT /me/meal-times/{mealId}` → `UserState`

Corpo: `{ "time": "08:00" }`. Grava `mealTimes[mealId]`.

### `POST /me/weights` → `UserState`

Corpo: `{ "kg": 68.2, "at": "2026-09-28T07:15:00.000Z" }`. O back gera o `id`. `at` pode ser até 89 dias no passado.

### `PUT /me/plan-changes` → `UserState`

Corpo: o `PlanChanges` inteiro, que substitui o anterior.

### `PUT /me/day-plan` → `UserState`

Corpo: `{ "date": "2026-09-28", "changes": { ... } }` (data local do usuário). Substitui o `dayPlan`.

### `POST /me/food-swaps` → `UserState`

Troca um alimento ("Substituir alimento" no plano).

```json
{ "foodName": "Guacamole", "reason": "nao-gosto", "substitute": "Abacate", "mealId": null }
```

- `substitute`: nome do substituto, ou `null` para remover sem substituto (grave como `""`).
- `reason` = `nao-gosto` ou `nao-tenho` (`mealId` = `null`): `foodSubstitutes[foodName] = substitute ?? ""` e
  `foodFeedback[foodName] = reason`.
- `reason` = `nao-quero` (`mealId` = id da refeição): `mealFoodSwaps[mealId][foodName] = substitute ?? ""` e,
  **só se ainda não houver marcação**, `foodFeedback[foodName] = "nao-quero"`.

### `DELETE /me/food-feedback/{foodName}` → `UserState`

"Liberar" na página Alimentos: remove `foodFeedback[foodName]`. **Não** mexe em `foodSubstitutes` nem
`mealFoodSwaps` (as trocas feitas continuam). `foodName` vem com `encodeURIComponent`.

## Plano alimentar 🔒

### `GET /meal-plan` → `Meal[]`

Plano base do usuário (antes das mudanças dele).

```json
[
  {
    "id": 1,
    "title": "Torrada de Abacate com Ovo Poché",
    "time": "07:30",
    "foods": [
      { "name": "Pão integral", "grams": 50, "carbs": 24, "protein": 6, "fat": 2, "kcal": 140 }
    ]
  }
]
```

Ids do plano base devem ficar abaixo de 1001 (acima disso são refeições criadas pelo usuário).

### `GET /meal-alternatives` → `MealAlternative[]`

Refeições que o assistente pode sugerir ao remover uma refeição ("sugerir uma nova") e ao criar uma.

```json
[
  {
    "title": "Iogurte Grego com Granola e Morangos",
    "periods": ["manha", "tarde"],
    "foods": [{ "name": "Iogurte grego natural", "grams": 170, "carbs": 7, "protein": 15, "fat": 7, "kcal": 150 }]
  }
]
```

`periods`: `manha` (antes das 11:00), `tarde` (até 16:59), `noite`.

### `GET /foods` → `CatalogFood[]`

Catálogo com nutrientes por 100 g. **Todo alimento que aparece em `/meal-plan` ou `/meal-alternatives`
precisa estar aqui**, senão não pode ser trocado. Os substitutos oferecidos são do mesmo `group`.

```json
[{ "name": "Pão integral", "group": "carboidratos", "per100g": { "carbs": 48, "protein": 12, "fat": 4, "kcal": 280 } }]
```

`group`: `carboidratos | proteinas | laticinios | gorduras | frutas | vegetais | adocantes | acidos`.

## Nutrientes 🔒

### `GET /nutrition/today` → `NutritionToday`

Consumo de hoje e metas. Cada nutriente: `{ id, name, atual, meta, unit, limit? }`. `limit: true` quando
`meta` é um máximo (açúcares, gordura saturada, colesterol, sódio). O `id` é a chave usada em
`/history/nutrients`.

```json
{
  "macros": [
    { "id": "proteinas", "name": "Proteínas", "atual": 145, "meta": 150, "unit": "g" },
    { "id": "gorduras", "name": "Gorduras", "atual": 65, "meta": 70, "unit": "g" },
    { "id": "carboidratos", "name": "Carboidratos", "atual": 220, "meta": 250, "unit": "g" }
  ],
  "fibers": [{ "id": "fibras", "name": "Fibras", "atual": 22, "meta": 30, "unit": "g" }],
  "otherMacros": [{ "id": "acucares", "name": "Açúcares", "atual": 38, "meta": 50, "unit": "g", "limit": true }],
  "vitamins": [{ "id": "vitamina-c", "name": "Vitamina C", "atual": 95, "meta": 90, "unit": "mg" }],
  "minerals": [{ "id": "sodio", "name": "Sódio", "atual": 1800, "meta": 2000, "unit": "mg", "limit": true }]
}
```

`macros` precisa ter exatamente os ids `proteinas`, `gorduras` e `carboidratos`, em gramas: o front calcula
as calorias consumidas com eles (4/9/4 kcal por grama).

## Histórico 🔒

### `GET /history/activity?days=N` → `ActivityDay[]`

Os últimos `N` dias (o front pede 1 e 90), do mais antigo para o mais recente. O último item é hoje (o card
"Meta diária" mostra o `burned` dele).

```json
[
  {
    "date": "2026-09-28",
    "consumed": 1985,
    "burned": 2210,
    "activeCalories": 560,
    "steps": 9800,
    "activeMinutes": 72,
    "distanceKm": 7.4,
    "source": "Google Fit"
  }
]
```

### `GET /history/nutrients?days=N` → `NutrientHistoryDay[]`

Consumo diário por nutriente, mesmas datas e ordem de `/history/activity`. Chaves de `values` = `id` dos
nutrientes de `/nutrition/today` (nutriente ausente num dia conta como 0).

```json
[{ "date": "2026-09-28", "values": { "proteinas": 145, "fibras": 22, "vitamina-c": 95 } }]
```

### `GET /history/plans` → `PlanHistoryDay[]`

Planos dos dias anteriores, do mais recente para o mais antigo.

```json
[
  {
    "date": "2026-09-27",
    "meals": [{ "time": "07:30", "title": "Panqueca de Aveia com Banana", "kcal": 380, "followed": true }],
    "flaggedFoods": [{ "name": "Guacamole", "feedback": "nao-quero" }]
  }
]
```

### `GET /activity-sources` → `ActivitySource[]`

```json
[
  { "name": "Google Fit", "platform": "Android", "connected": true, "lastSync": "2026-09-28T01:14:00.000Z" },
  { "name": "Apple Saúde", "platform": "iOS", "connected": false, "lastSync": null }
]
```

## Chat 🔒

### `GET /chat/messages` → `ChatMessage[]`

Conversa do usuário, da mais antiga para a mais recente: `{ "id": "m-1", "role": "assistant" | "user", "text": "..." }`.

### `POST /chat/messages` → `ChatMessage`

Corpo: `{ "text": "Quantas calorias eu já consumi hoje?" }`. Guarda a mensagem do usuário e responde
com a **resposta do assistente** (`role: "assistant"`).

### `GET /chat/suggestions` → `string[]`

Perguntas sugeridas no painel lateral do chat.
