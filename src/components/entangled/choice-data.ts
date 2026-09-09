export type CategoryId = "food" | "style" | "travel";
export type GameMode = "poker" | "rps" | "guess";
export type Gesture = "rock" | "paper" | "scissors";
export type CardColor = "red" | "black";
export type RandomSource = () => number;

export type ChoiceOption = {
  id: string;
  name: string;
  detail: string;
  group: string;
  custom?: boolean;
  image?: string;
};

export type Category = {
  id: CategoryId;
  label: string;
  english: string;
  question: string;
  intro: string;
  groups: string[];
  options: ChoiceOption[];
};

export const choiceCategories: Record<CategoryId, Category> = {
  food: {
    id: "food", label: "Taste", english: "THE APPETITE", question: "What shall the evening taste like?",
    intro: "Bring every appetite to the table. One answer at the end is quite enough.",
    groups: ["Steaming Comfort", "Light & Bright", "A Proper Date", "After-Hours Joy"],
    options: [
      { id: "food-hotpot", name: "Crimson Hot Pot", detail: "Scarlet broth · lotus root · crisp tripe", group: "Steaming Comfort" },
      { id: "food-noodles", name: "Tonkotsu Ramen", detail: "Silken pork broth · jammy egg", group: "Steaming Comfort" },
      { id: "food-salad", name: "Mediterranean Garden", detail: "Avocado · ancient grains · olive oil", group: "Light & Bright" },
      { id: "food-sushi", name: "Sushi for One", detail: "Salmon nigiri · miso broth", group: "Light & Bright" },
      { id: "food-pasta", name: "Candlelit Pasta", detail: "Tomato seafood linguine · sparkling water", group: "A Proper Date" },
      { id: "food-bistro", name: "The Corner Bistro", detail: "Seared steak · pommes purée", group: "A Proper Date" },
      { id: "food-burger", name: "Midnight Double", detail: "Double cheese · sea-salted fries", group: "After-Hours Joy" },
      { id: "food-bbq", name: "Ember-Grilled Skewers", detail: "Charred skewers · ice-cold soda", group: "After-Hours Joy" },
      { id: "food-dumplings", name: "Bamboo-Basket Dumplings", detail: "Delicate wrappers · ginger vinegar · warm soy milk", group: "Steaming Comfort" },
      { id: "food-claypot", name: "Cantonese Claypot Rice", detail: "Cured meats · golden rice crust · market greens", group: "Steaming Comfort" },
      { id: "food-curry", name: "Japanese Curry", detail: "Root vegetables · onsen egg · fragrant curry", group: "Steaming Comfort" },
      { id: "food-poke", name: "Summer Poke Bowl", detail: "Tuna · edamame · citrus dressing", group: "Light & Bright" },
      { id: "food-wrap", name: "Wholegrain Chicken Wrap", detail: "Grilled chicken · crisp leaves · yoghurt dressing", group: "Light & Bright" },
      { id: "food-soba", name: "Chilled Soba", detail: "Nori · wasabi · clear dipping broth", group: "Light & Bright" },
      { id: "food-pizza", name: "Wood-Fired Pizza", detail: "Buffalo mozzarella · basil · blistered crust", group: "A Proper Date" },
      { id: "food-thai", name: "A Thai Supper", detail: "Tom yum · green curry · mango sticky rice", group: "A Proper Date" },
      { id: "food-tapas", name: "The Spanish Table", detail: "Garlic prawns · tortilla · everything shared", group: "A Proper Date" },
      { id: "food-chicken", name: "Korean Fried Chicken", detail: "Sweet chilli · honey mustard · pickled radish", group: "After-Hours Joy" },
      { id: "food-wonton", name: "Laneway Wontons", detail: "Seaweed · shrimp · pork wontons in clear broth", group: "After-Hours Joy" },
      { id: "food-dessert", name: "A Sweet Finale", detail: "Basque cheesecake · vanilla ice cream · hot cocoa", group: "After-Hours Joy" },
    ],
  },
  style: {
    id: "style", label: "Style", english: "THE PERSONA", question: "Who shall you be today?",
    intro: "Style is no examination. Choose a silhouette and let today step outside.",
    groups: ["Quiet Tailoring", "Vintage Character", "Dressed for Romance", "City Wander"],
    options: [
      { id: "style-minimal", name: "Black & White", detail: "White shirt + black trousers + loafers", group: "Quiet Tailoring" },
      { id: "style-soft", name: "Soft Neutrals", detail: "Oatmeal knit + ivory wide-leg trousers", group: "Quiet Tailoring" },
      { id: "style-denim", name: "American Vintage", detail: "Faded denim + white tee + leather belt", group: "Vintage Character" },
      { id: "style-film", name: "Old-Film Protagonist", detail: "Tobacco jacket + check wool + ankle boots", group: "Vintage Character" },
      { id: "style-romantic", name: "French Romance", detail: "Cream column dress + slender straps + gold", group: "Dressed for Romance" },
      { id: "style-night", name: "Midnight Velvet", detail: "Black tailoring + brilliant earrings", group: "Dressed for Romance" },
      { id: "style-outdoor", name: "Outdoor Utility", detail: "Shell jacket + cargo trousers + trail shoes", group: "City Wander" },
      { id: "style-sport", name: "Weekend Athletics", detail: "Generous sweatshirt + shorts + baseball cap", group: "City Wander" },
      { id: "style-linen", name: "A Linen Breeze", detail: "Linen shirt + straight trousers + canvas tote", group: "Quiet Tailoring" },
      { id: "style-navy", name: "Everyday Navy", detail: "Navy knit + white trousers + court shoes", group: "Quiet Tailoring" },
      { id: "style-suit", name: "Featherlight Suiting", detail: "Broad-shouldered blazer + plain tee + cropped trousers", group: "Quiet Tailoring" },
      { id: "style-college", name: "The Ivy Walk", detail: "Argyle vest + Oxford shirt + loafers", group: "Vintage Character" },
      { id: "style-workwear", name: "Workwear Memory", detail: "Olive chore jacket + raw denim + leather boots", group: "Vintage Character" },
      { id: "style-stripes", name: "The Striped Mariner", detail: "Breton stripe + high waist + scarlet scarf", group: "Vintage Character" },
      { id: "style-floral", name: "A Letter from the Garden", detail: "Floral dress + cropped cardigan + ballet flats", group: "Dressed for Romance" },
      { id: "style-satin", name: "Champagne Lustre", detail: "Satin shirt + dark trousers + silver jewellery", group: "Dressed for Romance" },
      { id: "style-date", name: "Sunset Rendezvous", detail: "Burgundy top + cream skirt + petite leather bag", group: "Dressed for Romance" },
      { id: "style-monochrome", name: "Earth in Monochrome", detail: "Khaki coat + brown trousers + suede shoes", group: "City Wander" },
      { id: "style-rain", name: "A Walk in Rain", detail: "Weightless trench + waterproof boots + long umbrella", group: "City Wander" },
      { id: "style-color", name: "One Brilliant Note", detail: "White base + cobalt coat + trainers", group: "City Wander" },
    ],
  },
  travel: {
    id: "travel", label: "Wander", english: "THE ELSEWHERE", question: "Where shall the next horizon be?",
    intro: "The destination need not be perfect. Begin by giving departure a reason.",
    groups: ["Nature Restored", "The Slow Life", "Urban Inspiration", "A Touch of Adventure"],
    options: [
      { id: "travel-mountain", name: "Highland Footpath", detail: "Morning departure · summit picnic · sunset return", group: "Nature Restored" },
      { id: "travel-sea", name: "A Day by the Sea", detail: "Coastal walk · changing tides · cold coconut water", group: "Nature Restored" },
      { id: "travel-village", name: "Old-Town Reverie", detail: "Stone lanes · a quiet tea room · one night in an old house", group: "The Slow Life" },
      { id: "travel-country", name: "A Country Interlude", detail: "Field bicycles · seasonal cooking · waking without an alarm", group: "The Slow Life" },
      { id: "travel-city", name: "City Drift", detail: "Corner coffee · independent books · no fixed direction", group: "Urban Inspiration" },
      { id: "travel-art", name: "A Day of Pictures", detail: "One exhibition · one postcard · a note to yourself", group: "Urban Inspiration" },
      { id: "travel-camp", name: "Beneath the Stars", detail: "Pitch a tent · brew tea · count constellations", group: "A Touch of Adventure" },
      { id: "travel-train", name: "The Short Railway", detail: "Choose a neighbouring city · take the window seat · return by dusk", group: "A Touch of Adventure" },
      { id: "travel-forest", name: "Forest Air", detail: "Woodland path · birdsong · one shaft of light", group: "Nature Restored" },
      { id: "travel-lake", name: "Along the Lake", detail: "Hire a bicycle · trace the shore · rest in the grass", group: "Nature Restored" },
      { id: "travel-waterfall", name: "In Search of Water", detail: "Follow the stream · hear the cascade · bring home the cool", group: "Nature Restored" },
      { id: "travel-tea", name: "An Afternoon in Tea Country", detail: "Rows of tea · the first infusion · clouds slowly parting", group: "The Slow Life" },
      { id: "travel-hotspring", name: "The Warm-Water Holiday", detail: "A mineral bath · an unhurried supper · an early night", group: "The Slow Life" },
      { id: "travel-island", name: "A Letter from an Island", detail: "The ferry crossing · a fishing village · a postcard sent", group: "The Slow Life" },
      { id: "travel-market", name: "The Weekend Market", detail: "One old treasure · street delicacies · music in the square", group: "Urban Inspiration" },
      { id: "travel-architecture", name: "An Architectural Walk", detail: "Three old façades · windows and doors · details worth keeping", group: "Urban Inspiration" },
      { id: "travel-night", name: "The City After Dark", detail: "A performance · a riverside walk · supper after midnight", group: "Urban Inspiration" },
      { id: "travel-kayak", name: "Across the Water", detail: "Meet an instructor · fasten the life vest · take the kayak out", group: "A Touch of Adventure" },
      { id: "travel-road", name: "The Coastal Road", detail: "One stretch of coast · two overlooks · sunset at the wheel", group: "A Touch of Adventure" },
      { id: "travel-sunrise", name: "In Pursuit of Dawn", detail: "Read the weather · pack a headlamp · wait for first light", group: "A Touch of Adventure" },
    ],
  },
};

// One generated illustration per exact candidate; no cyclic stock-photo assignment.
for (const category of Object.values(choiceCategories)) {
  category.options.forEach((option) => {
    option.image = `/entangled/choices-v4/${option.id}.webp`;
  });
}

export const choiceBatchSize = 10;

/** Decorative scan only: the unbiased game result is drawn before animation. */
export function createLotterySequence(length: number, winnerIndex: number): number[] {
  if (!Number.isInteger(length) || length < 2 || !Number.isInteger(winnerIndex) || winnerIndex < 0 || winnerIndex >= length) throw new Error("The draw fell outside the candidate pool.");
  const steps = Math.max(18, length + 5);
  return Array.from({ length: steps }, (_, step) => ((winnerIndex - steps + 1 + step) % length + length) % length);
}

/** A full cycle covers every candidate once; changing a batch never mutates selections. */
export function getChoiceBatch(options: readonly ChoiceOption[], filter: string, batch: number): ChoiceOption[] {
  const pool = options.filter((option) => filter === "All" || option.group === filter);
  const pages = Math.max(1, Math.ceil(pool.length / choiceBatchSize));
  const page = ((Math.trunc(batch) % pages) + pages) % pages;
  return pool.slice(page * choiceBatchSize, (page + 1) * choiceBatchSize);
}

export const gameModes: { id: GameMode; name: string; english: string; symbol: string; rule: string }[] = [
  { id: "poker", name: "Fortune Deck", english: "A LITTLE GAMBLE", symbol: "♠", rule: "Wager on a possibility, then call red or black. If the colour agrees, honour your choice." },
  { id: "rps", name: "A Fair Fight", english: "ONE HONEST DUEL", symbol: "✌", rule: "Choose your answer, then choose your hand. Defeat the table and let the answer stand." },
  { id: "guess", name: "Trust Your Hunch", english: "A LETTER FROM CHANCE", symbol: "?", rule: "Name your hunch, then draw from the full pool. If instinct and chance meet, choose it." },
];

export const gestures: { id: Gesture; name: string; symbol: string }[] = [
  { id: "rock", name: "Rock", symbol: "✊" },
  { id: "scissors", name: "Scissors", symbol: "✌" },
  { id: "paper", name: "Paper", symbol: "✋" },
];

/** Uses a browser/Node Web Crypto source. Tests may inject deterministic samples. */
export function cryptoRandom(): number {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000;
}

/** randomUUID requires HTTPS; getRandomValues also works on the NAS HTTP origin. */
export function createChoiceId(): string {
  if (typeof globalThis.crypto.randomUUID === "function") return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function randomIndex(length: number, random: RandomSource = cryptoRandom): number {
  if (!Number.isSafeInteger(length) || length < 1) throw new Error("The candidate pool cannot be empty.");
  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error("The random sample must fall within [0, 1).");
  return Math.floor(sample * length);
}

export function compareGestures(player: Gesture, opponent: Gesture): "win" | "draw" | "lose" {
  if (player === opponent) return "draw";
  return (player === "rock" && opponent === "scissors") ||
    (player === "scissors" && opponent === "paper") ||
    (player === "paper" && opponent === "rock") ? "win" : "lose";
}

export type RoundRequest = {
  mode: GameMode;
  options: readonly ChoiceOption[];
  betId: string;
  color?: CardColor;
  gesture?: Gesture;
};

export type RoundResult = {
  mode: GameMode;
  bet: ChoiceOption;
  drawn: ChoiceOption;
  outcome: "win" | "draw" | "lose";
  color?: CardColor;
  suit?: string;
  rank?: string;
  player?: Gesture;
  opponent?: Gesture;
};

/** A losing/tied round never creates an accepted decision. */
export function playRound(request: RoundRequest, random: RandomSource = cryptoRandom): RoundResult {
  const { mode, options, betId, color, gesture } = request;
  if (options.length < 2 || new Set(options.map((option) => option.id)).size !== options.length) {
    throw new Error("Place at least two distinct possibilities on the table.");
  }
  const bet = options.find((option) => option.id === betId);
  if (!bet) throw new Error("Choose the answer you wish to wager on first.");
  if (mode === "poker") {
    if (color !== "red" && color !== "black") throw new Error("Call red or black before the card is drawn.");
    const card = randomIndex(52, random);
    const suitIndex = Math.floor(card / 13);
    const drawnColor: CardColor = suitIndex < 2 ? "red" : "black";
    return { mode, bet, drawn: bet, outcome: drawnColor === color ? "win" : "lose", color: drawnColor,
      suit: ["♥", "♦", "♠", "♣"][suitIndex], rank: ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][card % 13] };
  }
  if (mode === "rps") {
    if (!gestures.some((item) => item.id === gesture)) throw new Error("Choose your hand before the duel begins.");
    const player = gesture as Gesture;
    const opponent = gestures[randomIndex(gestures.length, random)].id;
    return { mode, bet, drawn: bet, outcome: compareGestures(player, opponent), player, opponent };
  }
  if (mode !== "guess") throw new Error("Choose a valid game.");
  const drawn = options[randomIndex(options.length, random)];
  return { mode, bet, drawn, outcome: drawn.id === bet.id ? "win" : "lose" };
}

export const decisionHistoryKey = "entangled-shelter:decisions:v1";
export type Decision = { id: string; categoryId: CategoryId; mode: GameMode; option: ChoiceOption; decidedAt: string };

export function createDecision(categoryId: CategoryId, round: RoundResult, now = new Date()): Decision {
  if (round.outcome !== "win") throw new Error("Only a correct hunch or a won round may be accepted.");
  return { id: createChoiceId(), categoryId, mode: round.mode, option: round.bet, decidedAt: now.toISOString() };
}

export function parseDecisionHistory(raw: string | null): Decision[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Decision => {
      if (!item || typeof item !== "object") return false;
      const value = item as Partial<Decision>;
      return typeof value.id === "string" && ["food", "style", "travel"].includes(value.categoryId ?? "") &&
        ["poker", "rps", "guess"].includes(value.mode ?? "") && typeof value.decidedAt === "string" &&
        Number.isFinite(Date.parse(value.decidedAt)) && !!value.option && typeof value.option.id === "string" &&
        typeof value.option.name === "string" && typeof value.option.detail === "string" && typeof value.option.group === "string";
    }).slice(0, 24);
  } catch { return []; }
}
