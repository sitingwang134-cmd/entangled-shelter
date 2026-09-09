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
    id: "food", label: "美食", english: "THE APPETITE", question: "今晚，吃什么？",
    intro: "把想吃的都放上桌。最后留下一份，就足够了。",
    groups: ["热气腾腾", "轻盈一点", "好好约会", "深夜快乐"],
    options: [
      { id: "food-hotpot", name: "沸腾火锅", detail: "一锅红汤 · 藕片与毛肚", group: "热气腾腾" },
      { id: "food-noodles", name: "热汤拉面", detail: "豚骨浓汤 · 溏心蛋", group: "热气腾腾" },
      { id: "food-salad", name: "地中海沙拉", detail: "牛油果 · 谷物 · 橄榄油", group: "轻盈一点" },
      { id: "food-sushi", name: "一盘寿司", detail: "三文鱼握寿司 · 味噌汤", group: "轻盈一点" },
      { id: "food-pasta", name: "意式烛光", detail: "番茄海鲜意面 · 气泡水", group: "好好约会" },
      { id: "food-bistro", name: "街角小馆", detail: "煎牛排 · 奶油土豆泥", group: "好好约会" },
      { id: "food-burger", name: "罪恶汉堡", detail: "双层芝士 · 热薯条", group: "深夜快乐" },
      { id: "food-bbq", name: "烟火烧烤", detail: "炭烤肉串 · 冰镇汽水", group: "深夜快乐" },
      { id: "food-dumplings", name: "一笼小笼包", detail: "薄皮汤汁 · 姜丝香醋 · 热豆浆", group: "热气腾腾" },
      { id: "food-claypot", name: "广式煲仔饭", detail: "腊味双拼 · 锅巴 · 一碟青菜", group: "热气腾腾" },
      { id: "food-curry", name: "日式咖喱饭", detail: "土豆胡萝卜 · 温泉蛋 · 浓香咖喱", group: "热气腾腾" },
      { id: "food-poke", name: "夏日波奇碗", detail: "金枪鱼 · 毛豆 · 柑橘酱汁", group: "轻盈一点" },
      { id: "food-wrap", name: "鸡肉全麦卷", detail: "烤鸡胸 · 生菜 · 酸奶酱", group: "轻盈一点" },
      { id: "food-soba", name: "荞麦冷面", detail: "海苔碎 · 山葵 · 清爽蘸汁", group: "轻盈一点" },
      { id: "food-pizza", name: "窑烤披萨", detail: "水牛芝士 · 罗勒 · 焦香薄底", group: "好好约会" },
      { id: "food-thai", name: "泰式小约会", detail: "冬阴功 · 青咖喱 · 芒果糯米饭", group: "好好约会" },
      { id: "food-tapas", name: "西班牙小食", detail: "蒜香虾 · 土豆蛋饼 · 分享一桌", group: "好好约会" },
      { id: "food-chicken", name: "韩式炸鸡", detail: "甜辣酱 · 蜂蜜芥末 · 萝卜块", group: "深夜快乐" },
      { id: "food-wonton", name: "巷口小馄饨", detail: "紫菜虾皮 · 鲜肉馄饨 · 一口热汤", group: "深夜快乐" },
      { id: "food-dessert", name: "甜品收尾", detail: "巴斯克蛋糕 · 香草冰淇淋 · 热可可", group: "深夜快乐" },
    ],
  },
  style: {
    id: "style", label: "穿搭", english: "THE PERSONA", question: "今天，穿什么？",
    intro: "风格不是考试。选一套，让今天的自己先出门。",
    groups: ["松弛通勤", "复古角色", "出门约会", "城市漫游"],
    options: [
      { id: "style-minimal", name: "黑白极简", detail: "白衬衫 + 黑西裤 + 乐福鞋", group: "松弛通勤" },
      { id: "style-soft", name: "柔软中性色", detail: "燕麦针织 + 米色阔腿裤", group: "松弛通勤" },
      { id: "style-denim", name: "美式复古", detail: "做旧牛仔 + 白 T + 皮带", group: "复古角色" },
      { id: "style-film", name: "旧电影主角", detail: "棕色夹克 + 格纹 + 短靴", group: "复古角色" },
      { id: "style-romantic", name: "法式浪漫", detail: "奶油长裙 + 细带鞋 + 金饰", group: "出门约会" },
      { id: "style-night", name: "午夜丝绒", detail: "黑色套装 + 亮色耳饰", group: "出门约会" },
      { id: "style-outdoor", name: "户外机能", detail: "防风外套 + 工装裤 + 越野鞋", group: "城市漫游" },
      { id: "style-sport", name: "周末运动", detail: "宽松卫衣 + 短裤 + 棒球帽", group: "城市漫游" },
      { id: "style-linen", name: "亚麻微风", detail: "亚麻衬衫 + 直筒裤 + 帆布包", group: "松弛通勤" },
      { id: "style-navy", name: "海军蓝日常", detail: "藏蓝针织 + 白裤 + 德训鞋", group: "松弛通勤" },
      { id: "style-suit", name: "轻量西装", detail: "宽肩西装 + 素 T + 九分裤", group: "松弛通勤" },
      { id: "style-college", name: "常春藤校园", detail: "菱格背心 + 牛津衬衫 + 乐福鞋", group: "复古角色" },
      { id: "style-workwear", name: "工装旧时光", detail: "军绿外套 + 原色牛仔 + 皮靴", group: "复古角色" },
      { id: "style-stripes", name: "条纹水手", detail: "蓝白条纹 + 高腰裤 + 红色方巾", group: "复古角色" },
      { id: "style-floral", name: "花园来信", detail: "碎花裙 + 短开衫 + 芭蕾鞋", group: "出门约会" },
      { id: "style-satin", name: "香槟光泽", detail: "缎面衬衫 + 深色长裤 + 银饰", group: "出门约会" },
      { id: "style-date", name: "落日约会", detail: "酒红上衣 + 奶油半裙 + 小皮包", group: "出门约会" },
      { id: "style-monochrome", name: "一身大地色", detail: "卡其外套 + 棕色长裤 + 麂皮鞋", group: "城市漫游" },
      { id: "style-rain", name: "雨天漫步", detail: "轻薄风衣 + 防水短靴 + 长柄伞", group: "城市漫游" },
      { id: "style-color", name: "一点亮色", detail: "白色打底 + 钴蓝外套 + 运动鞋", group: "城市漫游" },
    ],
  },
  travel: {
    id: "travel", label: "旅行", english: "THE ELSEWHERE", question: "下一站，去哪里？",
    intro: "不必找到最完美的目的地。先给出发一个理由。",
    groups: ["自然充电", "慢慢生活", "城市灵感", "一点冒险"],
    options: [
      { id: "travel-mountain", name: "山野徒步", detail: "晨间出发 · 山顶野餐 · 日落回程", group: "自然充电" },
      { id: "travel-sea", name: "海边发呆", detail: "沿海散步 · 看潮汐 · 喝椰子水", group: "自然充电" },
      { id: "travel-village", name: "古镇慢行", detail: "石板小巷 · 茶馆 · 住一晚老屋", group: "慢慢生活" },
      { id: "travel-country", name: "乡间小住", detail: "田野骑行 · 当季食材 · 睡到自然醒", group: "慢慢生活" },
      { id: "travel-city", name: "城市漫游", detail: "街角咖啡 · 独立书店 · 随意走走", group: "城市灵感" },
      { id: "travel-art", name: "美术馆一日", detail: "看一个展 · 买张明信片 · 写给自己", group: "城市灵感" },
      { id: "travel-camp", name: "星空露营", detail: "搭帐篷 · 煮一壶茶 · 数星星", group: "一点冒险" },
      { id: "travel-train", name: "短途火车", detail: "选一座邻城 · 靠窗坐 · 当日往返", group: "一点冒险" },
      { id: "travel-forest", name: "森林吸氧", detail: "走林间小径 · 听鸟鸣 · 拍一束光", group: "自然充电" },
      { id: "travel-lake", name: "湖畔骑行", detail: "租一辆车 · 环湖慢骑 · 草地休息", group: "自然充电" },
      { id: "travel-waterfall", name: "寻一处瀑布", detail: "沿溪而上 · 听水声 · 带走清凉", group: "自然充电" },
      { id: "travel-tea", name: "茶山半日", detail: "看茶垄 · 喝新茶 · 坐到云散", group: "慢慢生活" },
      { id: "travel-hotspring", name: "温泉小假期", detail: "泡一池暖汤 · 吃一顿晚餐 · 早睡", group: "慢慢生活" },
      { id: "travel-island", name: "小岛来信", detail: "坐渡轮 · 逛渔村 · 给朋友寄明信片", group: "慢慢生活" },
      { id: "travel-market", name: "周末市集", detail: "淘一件旧物 · 尝小吃 · 听街头音乐", group: "城市灵感" },
      { id: "travel-architecture", name: "建筑散步", detail: "找三栋老楼 · 看窗与门 · 拍下细节", group: "城市灵感" },
      { id: "travel-night", name: "城市夜游", detail: "看一场演出 · 沿江散步 · 吃夜宵", group: "城市灵感" },
      { id: "travel-kayak", name: "水上划行", detail: "预约教练 · 穿好救生衣 · 体验皮划艇", group: "一点冒险" },
      { id: "travel-road", name: "沿海自驾", detail: "挑一段海岸线 · 停两个观景台 · 看日落", group: "一点冒险" },
      { id: "travel-sunrise", name: "追一次日出", detail: "提前看天气 · 备好头灯 · 等天亮", group: "一点冒险" },
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
  if (!Number.isInteger(length) || length < 2 || !Number.isInteger(winnerIndex) || winnerIndex < 0 || winnerIndex >= length) throw new Error("抽签结果不在候选池中。");
  const steps = Math.max(18, length + 5);
  return Array.from({ length: steps }, (_, step) => ((winnerIndex - steps + 1 + step) % length + length) % length);
}

/** A full cycle covers every candidate once; changing a batch never mutates selections. */
export function getChoiceBatch(options: readonly ChoiceOption[], filter: string, batch: number): ChoiceOption[] {
  const pool = options.filter((option) => filter === "全部" || option.group === filter);
  const pages = Math.max(1, Math.ceil(pool.length / choiceBatchSize));
  const page = ((Math.trunc(batch) % pages) + pages) % pages;
  return pool.slice(page * choiceBatchSize, (page + 1) * choiceBatchSize);
}

export const gameModes: { id: GameMode; name: string; english: string; symbol: string; rule: string }[] = [
  { id: "poker", name: "命运扑克", english: "A LITTLE GAMBLE", symbol: "♠", rule: "先押一个候选，再猜红或黑。猜中牌色，就选你押的那个。" },
  { id: "rps", name: "剪刀石头布", english: "A FAIR FIGHT", symbol: "✌", rule: "先押一个候选，再选你的手势。赢过牌桌，这个答案才生效。" },
  { id: "guess", name: "先猜后抽", english: "TRUST YOUR HUNCH", symbol: "?", rule: "先猜一个候选，再从整池随机抽取。抽中你猜的那个，就选它。" },
];

export const gestures: { id: Gesture; name: string; symbol: string }[] = [
  { id: "rock", name: "石头", symbol: "✊" },
  { id: "scissors", name: "剪刀", symbol: "✌" },
  { id: "paper", name: "布", symbol: "✋" },
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
  if (!Number.isSafeInteger(length) || length < 1) throw new Error("候选池不能为空。");
  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error("随机数必须在 [0, 1) 内。");
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
    throw new Error("请放入至少两个不同的候选。");
  }
  const bet = options.find((option) => option.id === betId);
  if (!bet) throw new Error("先选一个你想押的答案。");
  if (mode === "poker") {
    if (color !== "red" && color !== "black") throw new Error("先猜红牌还是黑牌。");
    const card = randomIndex(52, random);
    const suitIndex = Math.floor(card / 13);
    const drawnColor: CardColor = suitIndex < 2 ? "red" : "black";
    return { mode, bet, drawn: bet, outcome: drawnColor === color ? "win" : "lose", color: drawnColor,
      suit: ["♥", "♦", "♠", "♣"][suitIndex], rank: ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][card % 13] };
  }
  if (mode === "rps") {
    if (!gestures.some((item) => item.id === gesture)) throw new Error("先选你的手势。");
    const player = gesture as Gesture;
    const opponent = gestures[randomIndex(gestures.length, random)].id;
    return { mode, bet, drawn: bet, outcome: compareGestures(player, opponent), player, opponent };
  }
  if (mode !== "guess") throw new Error("请选择一个有效的玩法。");
  const drawn = options[randomIndex(options.length, random)];
  return { mode, bet, drawn, outcome: drawn.id === bet.id ? "win" : "lose" };
}

export const decisionHistoryKey = "entangled-shelter:decisions:v1";
export type Decision = { id: string; categoryId: CategoryId; mode: GameMode; option: ChoiceOption; decidedAt: string };

export function createDecision(categoryId: CategoryId, round: RoundResult, now = new Date()): Decision {
  if (round.outcome !== "win") throw new Error("只有猜对或赢得本局，才能接受结果。");
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
