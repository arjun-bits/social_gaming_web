export const CardTeam = {
    teamA: 'teamA',
    teamB: 'teamB',
    neutral: 'neutral',
    assassin: 'assassin',
} as const;
export type CardTeam = typeof CardTeam[keyof typeof CardTeam];

export const GamePhase = {
    lobby: 'lobby',
    teamSetup: 'teamSetup',
    playing: 'playing',
    gameOver: 'gameOver',
} as const;
export type GamePhase = typeof GamePhase[keyof typeof GamePhase];

export const TurnPhase = {
    givingClue: 'givingClue',
    guessing: 'guessing',
} as const;
export type TurnPhase = typeof TurnPhase[keyof typeof TurnPhase];

export class WordCard {
    word: string;
    team: CardTeam;
    isRevealed: boolean;

    constructor(word: string, team: CardTeam, isRevealed: boolean = false) {
        this.word = word;
        this.team = team;
        this.isRevealed = isRevealed;
    }

    toJson(isLeader: boolean): any {
        return {
            word: this.word,
            team: isLeader || this.isRevealed ? this.team : null,
            isRevealed: this.isRevealed,
        };
    }
}

export class Clue {
    word: string;
    count: number;
    givenBy: string;

    constructor(word: string, count: number, givenBy: string) {
        this.word = word;
        this.count = count;
        this.givenBy = givenBy;
    }
}

export class SecretSignalsState {
    grid: WordCard[];
    phase: GamePhase;
    currentTurn?: CardTeam;
    turnPhase?: TurnPhase;
    currentClue?: Clue;
    guessesRemaining: number;
    winner?: CardTeam;
    playerTeams: { [playerId: string]: CardTeam };
    playerIsLeader: { [playerId: string]: boolean };
    selectedCategory: string;
    teamARemaining: number;
    teamBRemaining: number;
    hoverCardIndex: number | null;
    hoverTeam: string | null;

    constructor(init: Partial<SecretSignalsState>) {
        this.grid = init.grid || [];
        this.phase = init.phase || GamePhase.lobby;
        this.currentTurn = init.currentTurn;
        this.turnPhase = init.turnPhase;
        this.currentClue = init.currentClue;
        this.guessesRemaining = init.guessesRemaining || 0;
        this.winner = init.winner;
        this.playerTeams = init.playerTeams || {};
        this.playerIsLeader = init.playerIsLeader || {};
        this.selectedCategory = init.selectedCategory || 'Standard';
        this.teamARemaining = init.teamARemaining || 0;
        this.teamBRemaining = init.teamBRemaining || 0;
        this.hoverCardIndex = init.hoverCardIndex ?? null;
        this.hoverTeam = init.hoverTeam ?? null;
    }

    toLeaderJson(): any {
        return {
            grid: this.grid.map(c => c.toJson(true)),
            phase: this.phase,
            currentTurn: this.currentTurn,
            turnPhase: this.turnPhase,
            currentClue: this.currentClue,
            guessesRemaining: this.guessesRemaining,
            winner: this.winner,
            playerTeams: this.playerTeams,
            playerIsLeader: this.playerIsLeader,
            selectedCategory: this.selectedCategory,
            teamARemaining: this.teamARemaining,
            teamBRemaining: this.teamBRemaining,
            hoverCardIndex: this.hoverCardIndex,
            hoverTeam: this.hoverTeam,
        };
    }

    toPublicJson(): any {
        return {
            grid: this.grid.map(c => c.toJson(false)),
            phase: this.phase,
            currentTurn: this.currentTurn,
            turnPhase: this.turnPhase,
            currentClue: this.currentClue,
            guessesRemaining: this.guessesRemaining,
            winner: this.winner,
            playerTeams: this.playerTeams,
            playerIsLeader: this.playerIsLeader,
            selectedCategory: this.selectedCategory,
            teamARemaining: this.teamARemaining,
            teamBRemaining: this.teamBRemaining,
        };
    }
}

/** Proper Fisher-Yates shuffle — unbiased uniform random permutation */
export function fisherYates<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Pick 25 unique words from a pool, tracking used words across sessions.
 * When the available pool drops below 25, the used-word history is cleared.
 */
export function pickBoardWords(category: string, usedWords: Set<string>): string[] {
    const pool = wordCategories[category] || wordCategories['Standard'];
    let available = pool.filter(w => !usedWords.has(w));

    // If pool is nearly exhausted, reset history and refill
    if (available.length < 25) {
        // Remove only words from this category from the used set
        pool.forEach(w => usedWords.delete(w));
        available = [...pool];
    }

    const shuffled = fisherYates(available);
    const selected = shuffled.slice(0, 25);

    // Validate: no duplicates, length 3-14 chars
    const validated = [...new Set(selected.filter(w => w.length >= 3 && w.length <= 14))];
    if (validated.length < 25) {
        // Fallback: pad with standard words not yet used
        const fallback = fisherYates(wordCategories['Standard'].filter(w => !validated.includes(w)));
        validated.push(...fallback.slice(0, 25 - validated.length));
    }

    const final = validated.slice(0, 25);
    final.forEach(w => usedWords.add(w));
    return final;
}

export const wordCategories: { [key: string]: string[] } = {

    // ─────────────────────────────────────────────────────────────
    // STANDARD — 300 words
    // ─────────────────────────────────────────────────────────────
    'Standard': [
        // Nature & Elements
        'FIRE', 'ICE', 'WIND', 'WATER', 'EARTH', 'MOON', 'SUN', 'STAR', 'STORM',
        'LIGHTNING', 'THUNDER', 'RAIN', 'SNOW', 'CLOUD', 'SKY', 'RIVER', 'OCEAN',
        'MOUNTAIN', 'VALLEY', 'DESERT', 'FOREST', 'JUNGLE', 'ISLAND', 'VOLCANO',
        'GLACIER', 'CAVE', 'CLIFF', 'SWAMP', 'MEADOW', 'DUNE',

        // Animals
        'LION', 'TIGER', 'BEAR', 'WOLF', 'FOX', 'EAGLE', 'SHARK', 'SNAKE',
        'HORSE', 'DEER', 'CROW', 'OWL', 'HAWK', 'FROG', 'WHALE', 'DOLPHIN',
        'PANTHER', 'GORILLA', 'CHEETAH', 'CROCODILE', 'SCORPION', 'SPIDER',
        'FALCON', 'RAVEN', 'BUFFALO', 'COBRA', 'JAGUAR', 'LYNX', 'VIPER', 'BISON',

        // Fantasy & Myth
        'DRAGON', 'WIZARD', 'WITCH', 'KNIGHT', 'GHOST', 'DEMON', 'ANGEL',
        'PHOENIX', 'VAMPIRE', 'WEREWOLF', 'GOBLIN', 'TROLL', 'ELF', 'DWARF',
        'MERMAID', 'UNICORN', 'CENTAUR', 'GRIFFIN', 'ORACLE', 'SPECTER',
        'SORCERER', 'PALADIN', 'SHAMAN', 'BANSHEE', 'GARGOYLE', 'CHIMERA',
        'HYDRA', 'SPHINX', 'DJINN', 'WRAITH',

        // Weapons & Combat
        'SWORD', 'SHIELD', 'BOW', 'ARROW', 'AXE', 'HAMMER', 'SPEAR', 'KNIFE',
        'CANNON', 'BOMB', 'RIFLE', 'PISTOL', 'DAGGER', 'LANCE', 'CROSSBOW',
        'CATAPULT', 'GRENADE', 'SABER', 'TRIDENT', 'WHIP',

        // Royalty & Power
        'KING', 'QUEEN', 'PRINCE', 'PRINCESS', 'EMPEROR', 'EMPRESS', 'DUKE',
        'BARON', 'GENERAL', 'ADMIRAL', 'CAPTAIN', 'SPY', 'AGENT', 'REBEL',
        'MERCENARY', 'ASSASSIN', 'ORACLE', 'CHAMPION', 'SENTINEL', 'WARLORD',

        // Places & Structures
        'CASTLE', 'TOWER', 'BRIDGE', 'TEMPLE', 'PRISON', 'DUNGEON', 'PALACE',
        'HARBOR', 'MARKET', 'ARENA', 'VAULT', 'BUNKER', 'FORTRESS', 'LIGHTHOUSE',
        'CATHEDRAL', 'LABYRINTH', 'SHRINE', 'MANOR', 'BAZAAR', 'CITADEL',

        // Objects & Artifacts
        'CROWN', 'RING', 'KEY', 'MAP', 'MIRROR', 'LANTERN', 'COMPASS', 'CHEST',
        'SCROLL', 'CRYSTAL', 'AMULET', 'POTION', 'STAFF', 'ORB', 'MASK',
        'ANCHOR', 'CANDLE', 'CLOCK', 'HOURGLASS', 'LOCKET',

        // Actions & Concepts
        'SHADOW', 'ECHO', 'SILENCE', 'RUSH', 'FALL', 'RISE', 'HUNT', 'CHASE',
        'SIGNAL', 'CODE', 'MISSION', 'ESCAPE', 'TRAP', 'AMBUSH', 'RAID',
        'SIEGE', 'DUEL', 'ALLIANCE', 'BETRAYAL', 'SACRIFICE',

        // Body & Human
        'BLOOD', 'BONE', 'HEART', 'MIND', 'SOUL', 'EYE', 'HAND', 'CROWN',
        'VOICE', 'MEMORY', 'DREAM', 'FEAR', 'HOPE', 'RAGE', 'FATE',

        // Transport & Journey
        'SHIP', 'TRAIN', 'ROCKET', 'HORSE', 'CART', 'VOYAGE', 'EXPEDITION',
        'TREK', 'PASSAGE', 'PORTAL', 'GATEWAY', 'ROUTE', 'PATH', 'TRAIL',
        'BORDER',
    ],

    // ─────────────────────────────────────────────────────────────
    // TECH & CYBER — 220 words
    // ─────────────────────────────────────────────────────────────
    'Tech': [
        // Hardware
        'COMPUTER', 'PHONE', 'TABLET', 'SCREEN', 'KEYBOARD', 'MOUSE', 'PRINTER',
        'CAMERA', 'SPEAKER', 'MICROPHONE', 'HEADPHONES', 'CHARGER', 'BATTERY',
        'CHIP', 'PROCESSOR', 'MEMORY', 'DRIVE', 'SERVER', 'ROUTER', 'CABLE',
        'SENSOR', 'DRONE', 'ROBOT', 'ANTENNA', 'CIRCUIT', 'DISPLAY', 'LENS',
        'SATELLITE', 'RADAR', 'LASER',

        // Software & Internet
        'CODE', 'PROGRAM', 'APP', 'WEBSITE', 'BROWSER', 'EMAIL', 'PASSWORD',
        'FIREWALL', 'DATABASE', 'CLOUD', 'STREAM', 'UPLOAD', 'DOWNLOAD',
        'NETWORK', 'PROTOCOL', 'ALGORITHM', 'SCRIPT', 'FUNCTION', 'VARIABLE',
        'LOOP', 'DEBUG', 'COMPILE', 'DEPLOY', 'COMMIT', 'MERGE', 'BRANCH',
        'TOKEN', 'COOKIE', 'CACHE', 'PROXY', 'ENCRYPTION',

        // Security & Hacking
        'HACKER', 'VIRUS', 'MALWARE', 'PHISHING', 'BREACH', 'EXPLOIT',
        'PAYLOAD', 'BACKDOOR', 'TROJAN', 'RANSOMWARE', 'BOTNET', 'DARKWEB',
        'ROOTKIT', 'KEYLOGGER', 'INJECTION', 'SANDBOX', 'HONEYPOT', 'ZERO-DAY',
        'PATCH', 'VULNERABILITY',

        // AI & Data
        'NEURAL', 'MODEL', 'TRAINING', 'DATASET', 'INFERENCE', 'TENSOR',
        'GRADIENT', 'CLUSTER', 'VECTOR', 'EMBEDDING', 'PROMPT', 'TOKEN',
        'LATENCY', 'PIPELINE', 'AGENT', 'AUTONOMY', 'SIMULATION', 'RENDERING',
        'QUANTUM', 'BINARY',

        // Devices & Gadgets
        'SMARTWATCH', 'EARBUDS', 'VR', 'AR', 'CONSOLE', 'JOYSTICK', 'GAMEPAD',
        'STYLUS', 'PROJECTOR', 'MODEM', 'HUB', 'SWITCH', 'ADAPTER', 'DONGLE',
        'WEBCAM', 'TRACKER', 'SCANNER', 'BEEPER', 'TERMINAL', 'WORKSTATION',

        // Companies & Culture
        'STARTUP', 'UNICORN', 'PIVOT', 'DISRUPTION', 'PLATFORM', 'ECOSYSTEM',
        'API', 'SDK', 'REPOSITORY', 'FRAMEWORK', 'LIBRARY', 'RUNTIME',
        'CONTAINER', 'KERNEL', 'THREAD', 'PROCESS', 'STACK', 'QUEUE',
        'SOCKET', 'HANDSHAKE',

        // Connectivity
        'BLUETOOTH', 'WIFI', 'HOTSPOT', 'BANDWIDTH', 'LATENCY', 'PING',
        'PACKET', 'SIGNAL', 'FREQUENCY', 'SPECTRUM', 'CHANNEL', 'BROADCAST',
        'FIBER', 'CELLULAR', '5G',
    ],

    // ─────────────────────────────────────────────────────────────
    // MOVIES & POP CULTURE — 200 words
    // ─────────────────────────────────────────────────────────────
    'Movies': [
        // Film Genres & Elements
        'HERO', 'VILLAIN', 'SEQUEL', 'PREQUEL', 'REBOOT', 'CAMEO', 'DIRECTOR',
        'ACTOR', 'SCRIPT', 'SCENE', 'PLOT', 'TWIST', 'CLIFFHANGER', 'FLASHBACK',
        'MONTAGE', 'SCORE', 'TRAILER', 'PREMIERE', 'BLOCKBUSTER', 'OSCAR',

        // Famous Characters (Generic)
        'DETECTIVE', 'ALIEN', 'ZOMBIE', 'ROBOT', 'PIRATE', 'NINJA', 'SAMURAI',
        'COWBOY', 'ASTRONAUT', 'SURGEON', 'PILOT', 'SOLDIER', 'REBEL',
        'ANDROID', 'CYBORG', 'CLONE', 'MUTANT', 'SUPERHERO', 'VIGILANTE', 'HITMAN',

        // Iconic Objects (Generic)
        'LIGHTSABER', 'GADGET', 'CAPE', 'MASK', 'SHIELD', 'SERUM', 'PORTAL',
        'WARP', 'HYPERSPACE', 'VAULT', 'BRIEFCASE', 'RELIC', 'ARTIFACT',
        'HOLOGRAM', 'MATRIX', 'SIMULATION', 'DREAMWORLD', 'GLITCH', 'VIRUS',
        'UPLOAD',

        // Movie Settings
        'SPACESHIP', 'DYSTOPIA', 'UTOPIA', 'WASTELAND', 'MEGACITY', 'COLONY',
        'STATION', 'BUNKER', 'LAB', 'FACTORY', 'ARENA', 'TOURNAMENT',
        'UNDERWORLD', 'DIMENSION', 'TIMELINE', 'MULTIVERSE', 'PARADISE',
        'SANCTUARY', 'EXILE', 'FRONTIER',

        // Music & Entertainment
        'CONCERT', 'TOUR', 'ALBUM', 'RECORD', 'MIXTAPE', 'HIT', 'ANTHEM',
        'REMIX', 'DROP', 'BASS', 'BEAT', 'FESTIVAL', 'STAGE', 'CROWD',
        'ENCORE', 'PLAYLIST', 'PODCAST', 'STREAM', 'VIRAL', 'TREND',

        // Iconic Concepts
        'FAME', 'CULT', 'LEGEND', 'ICON', 'TRIBUTE', 'PARODY', 'SATIRE',
        'DOCUMENTARY', 'ANIMATION', 'FRANCHISE', 'UNIVERSE', 'CROSSOVER',
        'SPINOFF', 'FANBASE', 'RATING', 'REVIEW', 'CRITIC', 'AWARD',
        'PREMIERE', 'RELEASE',

        // Social Media & Internet Culture
        'MEME', 'VIRAL', 'INFLUENCER', 'CONTENT', 'REACTION', 'UNBOXING',
        'CHALLENGE', 'HASHTAG', 'FILTER', 'STORY', 'REEL', 'COLLAB',
        'SUBSCRIBERS', 'FOLLOWERS', 'LIKE', 'SHARE', 'COMMENT', 'CANCEL',
        'CLOUT', 'HYPE',
    ],

    // ─────────────────────────────────────────────────────────────
    // FOOD & DRINKS — 200 words
    // ─────────────────────────────────────────────────────────────
    'Food': [
        // Cuisines & Dishes
        'PIZZA', 'SUSHI', 'BURGER', 'TACO', 'RAMEN', 'CURRY', 'PASTA',
        'DUMPLING', 'STEAK', 'SALAD', 'SANDWICH', 'WAFFLE', 'PANCAKE',
        'CROISSANT', 'NOODLE', 'SOUP', 'STEW', 'CHILI', 'PAELLA', 'RISOTTO',
        'BURRITO', 'KEBAB', 'BIRYANI', 'POUTINE', 'FONDUE',

        // Ingredients
        'GARLIC', 'ONION', 'PEPPER', 'SALT', 'SUGAR', 'LEMON', 'LIME',
        'GINGER', 'BASIL', 'MINT', 'THYME', 'ROSEMARY', 'CHILI', 'CUMIN',
        'TURMERIC', 'CINNAMON', 'VANILLA', 'SAFFRON', 'TRUFFLE', 'ANCHOVY',

        // Meats & Proteins
        'CHICKEN', 'BEEF', 'PORK', 'LAMB', 'SALMON', 'TUNA', 'SHRIMP',
        'LOBSTER', 'CRAB', 'TOFU', 'BACON', 'SAUSAGE', 'PROSCIUTTO',
        'ANCHOVY', 'SQUID', 'OCTOPUS', 'DUCK', 'VENISON', 'BISON', 'TURKEY',

        // Fruits & Vegetables
        'MANGO', 'AVOCADO', 'STRAWBERRY', 'BLUEBERRY', 'WATERMELON', 'PEACH',
        'PINEAPPLE', 'COCONUT', 'POMEGRANATE', 'KIWI', 'PAPAYA', 'DURIAN',
        'BROCCOLI', 'CAULIFLOWER', 'SPINACH', 'ASPARAGUS', 'TRUFFLE', 'MUSHROOM',
        'ARTICHOKE', 'ZUCCHINI',

        // Desserts & Sweets
        'CHOCOLATE', 'ICE CREAM', 'CAKE', 'BROWNIE', 'MACARON', 'TIRAMISU',
        'CHEESECAKE', 'CRÈME BRÛLÉE', 'BAKLAVA', 'CHURRO', 'DONUT',
        'MOCHI', 'GELATO', 'PUDDING', 'TART', 'ÉCLAIR', 'PROFITEROLE',
        'CANNOLI', 'HALVA', 'FUDGE',

        // Drinks
        'COFFEE', 'ESPRESSO', 'LATTE', 'MATCHA', 'KOMBUCHA', 'SMOOTHIE',
        'COCKTAIL', 'MOJITO', 'MARGARITA', 'SANGRIA', 'CHAMPAGNE', 'WHISKEY',
        'GIN', 'VODKA', 'RUM', 'SAKE', 'BEER', 'CIDER', 'BOBA', 'LASSI',

        // Cooking Terms
        'GRILL', 'ROAST', 'BAKE', 'STEAM', 'FRY', 'SAUTÉ', 'SIMMER',
        'MARINATE', 'FERMENT', 'CARAMELIZE', 'FLAMBÉ', 'BRAISE', 'CURE',
        'SMOKE', 'PICKLE', 'INFUSE', 'BLANCH', 'GLAZE', 'POACH', 'EMULSIFY',
    ],

    // ─────────────────────────────────────────────────────────────
    // SPORTS & ACTION — 200 words
    // ─────────────────────────────────────────────────────────────
    'Sports': [
        // Team Sports
        'SOCCER', 'FOOTBALL', 'BASKETBALL', 'BASEBALL', 'HOCKEY', 'RUGBY',
        'VOLLEYBALL', 'CRICKET', 'POLO', 'LACROSSE', 'HANDBALL', 'WATERPOLO',
        'CURLING', 'DODGEBALL', 'ULTIMATE', 'KABADDI', 'NETBALL', 'HURLING',
        'BANDY', 'SEPAK',

        // Individual Sports
        'TENNIS', 'GOLF', 'BOXING', 'WRESTLING', 'JUDO', 'KARATE',
        'GYMNASTICS', 'SWIMMING', 'DIVING', 'CYCLING', 'RUNNING', 'MARATHON',
        'TRIATHLON', 'ARCHERY', 'FENCING', 'SHOOTING', 'WEIGHTLIFTING',
        'ROWING', 'SKIING', 'SKATING',

        // Extreme & Action Sports
        'SURFING', 'SNOWBOARD', 'SKATEBOARD', 'PARKOUR', 'CLIMBING', 'SKYDIVE',
        'BUNGEE', 'MOTOCROSS', 'RALLYING', 'DRIFT', 'WINGSUIT', 'FREEDIVING',
        'RAFTING', 'KAYAKING', 'MOUNTAINBIKE', 'BMX', 'BASE JUMP', 'KITESURF',
        'WAKEBOARD', 'POWERBOAT',

        // Positions & Roles
        'STRIKER', 'GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'PITCHER',
        'QUARTERBACK', 'CATCHER', 'SETTER', 'BLOCKER', 'ANCHOR', 'SWEEPER',
        'LIBERO', 'FORWARD', 'GUARD', 'CENTER', 'WINGER', 'FULLBACK',
        'CAPTAIN', 'ROOKIE', 'VETERAN',

        // Competition
        'CHAMPION', 'TROPHY', 'MEDAL', 'PODIUM', 'BRACKET', 'PLAYOFF',
        'FINAL', 'OVERTIME', 'PENALTY', 'TIEBREAK', 'QUALIFIER', 'SEMIFINAL',
        'WILDCARD', 'DRAFT', 'TRANSFER', 'CONTRACT', 'SCOUT', 'RIVAL',
        'UPSET', 'STREAK',

        // Equipment
        'BALL', 'BAT', 'RACKET', 'GLOVE', 'HELMET', 'JERSEY', 'CLEATS',
        'PUCK', 'STICK', 'NET', 'GOAL', 'HOOP', 'LANE', 'TRACK', 'RING',
        'COURT', 'FIELD', 'PITCH', 'RINK', 'SLOPE',
    ],

    // ─────────────────────────────────────────────────────────────
    // SCIENCE & NATURE — 200 words
    // ─────────────────────────────────────────────────────────────
    'Science': [
        // Physics
        'ATOM', 'ELECTRON', 'PROTON', 'NEUTRON', 'QUARK', 'PHOTON', 'BOSON',
        'GRAVITY', 'MAGNETIC', 'ELECTRIC', 'NUCLEAR', 'FUSION', 'FISSION',
        'PLASMA', 'VACUUM', 'ENTROPY', 'INERTIA', 'MOMENTUM', 'VELOCITY',
        'SPECTRUM',

        // Space & Astronomy
        'GALAXY', 'NEBULA', 'PULSAR', 'QUASAR', 'BLACK HOLE', 'NEUTRON STAR',
        'COMET', 'ASTEROID', 'METEOR', 'ECLIPSE', 'SOLSTICE', 'ORBIT',
        'GRAVITY', 'COSMOS', 'SUPERNOVA', 'DARK MATTER', 'EXOPLANET',
        'TELESCOPE', 'PROBE', 'LANDER',

        // Biology
        'CELL', 'DNA', 'RNA', 'GENE', 'PROTEIN', 'ENZYME', 'HORMONE',
        'NEURON', 'SYNAPSE', 'MITOSIS', 'EVOLUTION', 'MUTATION', 'SPECIES',
        'ECOSYSTEM', 'PHOTOSYNTHESIS', 'METABOLISM', 'PARASITE', 'SYMBIOSIS',
        'MIGRATION', 'HIBERNATION',

        // Chemistry
        'ELEMENT', 'COMPOUND', 'MOLECULE', 'BOND', 'CATALYST', 'REACTION',
        'ACID', 'BASE', 'SOLVENT', 'CRYSTAL', 'ALLOY', 'POLYMER', 'ISOTOPE',
        'OXIDATION', 'REDUCTION', 'TITRATION', 'PRECIPITATE', 'DISTILLATION',
        'FERMENTATION', 'COMBUSTION',

        // Earth Science
        'TECTONIC', 'EROSION', 'SEDIMENT', 'FOSSIL', 'STRATUM', 'MANTLE',
        'CRUST', 'MAGMA', 'TREMOR', 'TSUNAMI', 'CYCLONE', 'DROUGHT',
        'PERMAFROST', 'BIOME', 'AQUIFER', 'WETLAND', 'CORAL', 'GLACIER',
        'LATITUDE', 'LONGITUDE',

        // Math & Logic
        'PRIME', 'VECTOR', 'MATRIX', 'FRACTAL', 'THEOREM', 'PROOF', 'AXIOM',
        'ALGORITHM', 'CIPHER', 'PARADOX', 'INFINITY', 'PROBABILITY', 'SEQUENCE',
        'TOPOLOGY', 'DERIVATIVE', 'INTEGRAL', 'BINARY', 'RECURSION',
        'LOGARITHM', 'POLYNOMIAL',
    ],
};
