// Opening categories
export type OpeningCategory =
  | "classical"
  | "gambit"
  | "countergambit"
  | "hypermodern"
  | "system"
  | "flank"
  | "trap";

export type DifficultyLevel =
  | "basic"
  | "system-based"
  | "tactical"
  | "theoretical"
  | "conceptual";

export type RatingRange =
  | "0-700"
  | "700-1000"
  | "1000-1300"
  | "1300-1600"
  | "1600-2000"
  | "2000+";

export interface ChessOpening {
  id: string;
  name: string;
  nameRu: string;
  eco: string; // ECO code (e.g. B01, C50)
  category: OpeningCategory;
  difficulty: DifficultyLevel;
  ratingRange: RatingRange;
  moves: string; // e.g. "1.e4 e5 2.Nf3 Nc6 3.Bc4"
  description: string;
  descriptionRu: string;
  theoryDepth: number; // 1-10 how deep theory goes
  popularity: number; // 1-100
  isFavorite?: boolean;
}

export const categoryLabels: Record<OpeningCategory, string> = {
  classical: "Классические",
  gambit: "Гамбиты",
  countergambit: "Контргамбиты",
  hypermodern: "Гипермодерн",
  system: "Системные",
  flank: "Фланговые",
  trap: "Ловушки",
};

export const categoryDescriptions: Record<OpeningCategory, string> = {
  classical:
    "Минимальный риск, борьба за центр, медленное развитие, позиционная игра.",
  gambit:
    "Ранняя жертва материала за компенсацию. Быстрая и острая игра.",
  countergambit:
    "Ответ на гамбит или активный ответ на тихий дебют.",
  hypermodern:
    "Непрямая оккупация центра, акцент на контригру.",
  system:
    "Почти одинаковая расстановка независимо от ходов соперника.",
  flank:
    "Нетипичные позиции, расчет на незнакомство соперника.",
  trap:
    "Попытка поймать соперника на конкретную ошибку.",
};

export const difficultyLabels: Record<DifficultyLevel, string> = {
  basic: "Базовый",
  "system-based": "Системный",
  tactical: "Тактический",
  theoretical: "Теоретический",
  conceptual: "Концептуальный",
};

export const difficultyColors: Record<DifficultyLevel, string> = {
  basic: "text-emerald",
  "system-based": "text-sky",
  tactical: "text-amber",
  theoretical: "text-destructive",
  conceptual: "text-muted-foreground",
};

export const ratingLabels: Record<RatingRange, string> = {
  "0-700": "Новичок",
  "700-1000": "Начинающий",
  "1000-1300": "Средний",
  "1300-1600": "Продвинутый",
  "1600-2000": "Сильный",
  "2000+": "Мастер",
};

// Mock opening data
export const openings: ChessOpening[] = [
  {
    id: "italian-game",
    name: "Italian Game",
    nameRu: "Итальянская партия",
    eco: "C50",
    category: "classical",
    difficulty: "basic",
    ratingRange: "700-1000",
    moves: "1.e4 e5 2.Nf3 Nc6 3.Bc4",
    description:
      "One of the oldest and most classical openings. White develops the bishop to an active square targeting f7.",
    descriptionRu:
      "Один из старейших и самых классических дебютов. Белые развивают слона на активное поле, целясь на f7.",
    theoryDepth: 7,
    popularity: 92,
    isFavorite: true,
  },
  {
    id: "sicilian-defense",
    name: "Sicilian Defense",
    nameRu: "Сицилианская защита",
    eco: "B20",
    category: "classical",
    difficulty: "theoretical",
    ratingRange: "1300-1600",
    moves: "1.e4 c5",
    description:
      "The most popular response to 1.e4. Creates asymmetry and sharp play.",
    descriptionRu:
      "Самый популярный ответ на 1.e4. Создает асимметрию и острую игру.",
    theoryDepth: 10,
    popularity: 98,
    isFavorite: true,
  },
  {
    id: "kings-gambit",
    name: "King's Gambit",
    nameRu: "Королевский гамбит",
    eco: "C30",
    category: "gambit",
    difficulty: "tactical",
    ratingRange: "1000-1300",
    moves: "1.e4 e5 2.f4",
    description:
      "An aggressive opening where White sacrifices a pawn for rapid development and central control.",
    descriptionRu:
      "Агрессивный дебют, где белые жертвуют пешку ради быстрого развития и контроля центра.",
    theoryDepth: 8,
    popularity: 65,
  },
  {
    id: "queens-gambit",
    name: "Queen's Gambit",
    nameRu: "Ферзевый гамбит",
    eco: "D06",
    category: "gambit",
    difficulty: "system-based",
    ratingRange: "1300-1600",
    moves: "1.d4 d5 2.c4",
    description:
      "White offers a pawn to gain central control. Not a true gambit as the pawn can usually be recovered.",
    descriptionRu:
      "Белые предлагают пешку для захвата центра. Не настоящий гамбит — пешку обычно можно отыграть.",
    theoryDepth: 9,
    popularity: 88,
    isFavorite: true,
  },
  {
    id: "budapest-gambit",
    name: "Budapest Gambit",
    nameRu: "Будапештский гамбит",
    eco: "A51",
    category: "countergambit",
    difficulty: "tactical",
    ratingRange: "1000-1300",
    moves: "1.d4 Nf6 2.c4 e5",
    description:
      "A sharp countergambit against 1.d4. Black sacrifices a pawn for active piece play.",
    descriptionRu:
      "Острый контргамбит против 1.d4. Черные жертвуют пешку за активную фигурную игру.",
    theoryDepth: 5,
    popularity: 35,
  },
  {
    id: "nimzo-indian",
    name: "Nimzo-Indian Defense",
    nameRu: "Защита Нимцовича",
    eco: "E20",
    category: "hypermodern",
    difficulty: "conceptual",
    ratingRange: "1600-2000",
    moves: "1.d4 Nf6 2.c4 e6 3.Nc3 Bb4",
    description:
      "A hypermodern defense where Black pins the knight and controls the center indirectly.",
    descriptionRu:
      "Гипермодернная защита, где черные связывают коня и непрямо контролируют центр.",
    theoryDepth: 9,
    popularity: 78,
  },
  {
    id: "london-system",
    name: "London System",
    nameRu: "Лондонская система",
    eco: "D00",
    category: "system",
    difficulty: "basic",
    ratingRange: "700-1000",
    moves: "1.d4 d5 2.Bf4",
    description:
      "A solid system opening. White develops the dark-squared bishop early and builds a strong pawn structure.",
    descriptionRu:
      "Надежный системный дебют. Белые рано развивают чернопольного слона и строят крепкую пешечную структуру.",
    theoryDepth: 4,
    popularity: 75,
  },
  {
    id: "reti-opening",
    name: "Reti Opening",
    nameRu: "Дебют Рети",
    eco: "A04",
    category: "flank",
    difficulty: "conceptual",
    ratingRange: "1600-2000",
    moves: "1.Nf3 d5 2.c4",
    description:
      "A flexible flank opening that can transpose into many other openings.",
    descriptionRu:
      "Гибкий фланговый дебют, который может перейти во многие другие дебюты.",
    theoryDepth: 7,
    popularity: 55,
  },
  {
    id: "englund-gambit",
    name: "Englund Gambit",
    nameRu: "Гамбит Энглунда",
    eco: "A40",
    category: "trap",
    difficulty: "basic",
    ratingRange: "0-700",
    moves: "1.d4 e5",
    description:
      "A dubious gambit that relies on traps. Mostly effective at lower ratings.",
    descriptionRu:
      "Сомнительный гамбит, рассчитанный на ловушки. Эффективен в основном на низких рейтингах.",
    theoryDepth: 3,
    popularity: 25,
  },
  {
    id: "french-defense",
    name: "French Defense",
    nameRu: "Французская защита",
    eco: "C00",
    category: "classical",
    difficulty: "system-based",
    ratingRange: "1000-1300",
    moves: "1.e4 e6",
    description:
      "A solid defense that leads to closed positions. Black builds a strong pawn chain.",
    descriptionRu:
      "Надежная защита, ведущая к закрытым позициям. Черные строят сильную пешечную цепь.",
    theoryDepth: 8,
    popularity: 72,
  },
  {
    id: "caro-kann",
    name: "Caro-Kann Defense",
    nameRu: "Защита Каро-Канн",
    eco: "B10",
    category: "classical",
    difficulty: "system-based",
    ratingRange: "1000-1300",
    moves: "1.e4 c6",
    description:
      "A solid and positional defense. Black prepares to challenge e4 with d5.",
    descriptionRu:
      "Надежная и позиционная защита. Черные готовятся оспорить e4 ходом d5.",
    theoryDepth: 8,
    popularity: 70,
    isFavorite: true,
  },
  {
    id: "grunfeld-defense",
    name: "Grunfeld Defense",
    nameRu: "Защита Грюнфельда",
    eco: "D80",
    category: "hypermodern",
    difficulty: "theoretical",
    ratingRange: "2000+",
    moves: "1.d4 Nf6 2.c4 g6 3.Nc3 d5",
    description:
      "A highly theoretical hypermodern defense. Black allows White to build a center, then attacks it.",
    descriptionRu:
      "Высокотеоретическая гипермодернная защита. Черные позволяют белым построить центр, а затем атакуют его.",
    theoryDepth: 10,
    popularity: 60,
  },
];
