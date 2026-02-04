// Fortune Pack Types
export type FortunePack = 'classic' | 'love' | 'career' | 'unhinged' | 'main-character';

export interface FortunePackInfo {
  id: FortunePack;
  name: string;
  emoji: string;
  description: string;
  isPremium: boolean;
}

export const FORTUNE_PACKS: FortunePackInfo[] = [
  { id: 'classic', name: 'Classic', emoji: '🥠', description: 'Good vibes only', isPremium: false },
  { id: 'love', name: 'Love', emoji: '💕', description: 'Romance predictions', isPremium: true },
  { id: 'career', name: 'Career', emoji: '💼', description: 'Success awaits', isPremium: true },
  { id: 'unhinged', name: 'Unhinged', emoji: '🤪', description: 'Chaotic energy', isPremium: true },
  { id: 'main-character', name: 'Main Character', emoji: '👑', description: 'You\'re the star', isPremium: true },
];

// Fortune messages by pack
export const FORTUNES: Record<FortunePack, string[]> = {
  classic: [
    "Tonight's adventure will spark an unexpected friendship 🌟",
    "The next meal you eat will be unforgettable 🍜",
    "Your group will discover a new favorite spot 📍",
    "Someone at this place will make you laugh out loud 😂",
    "You're about to create a core memory ✨",
    "The universe says: order the special 🎯",
    "Good vibes are guaranteed at this spot 🌈",
    "Your taste buds are in for a treat 👅",
    "This outing will be talked about for weeks 🗣️",
    "Fortune favors the hungry — dig in! 🍴",
    "A surprise awaits you at your destination 🎁",
    "Trust the pick — it knows what you need 🔮",
    "Your next photo here will get all the likes 📸",
    "The best conversations happen over good food 💬",
    "Tonight's the night for trying something new 🌙",
    "Your group's energy is immaculate today ⚡",
    "The stars aligned for this perfect pick ⭐",
    "Laughter and good times are in your future 🎉",
    "This spot will exceed your expectations 🚀",
    "You're exactly where you're meant to be 🧭",
  ],
  love: [
    "Sparks will fly at this location 💫",
    "Your love story gets a new chapter tonight 📖",
    "That special someone is thinking about you right now 💭",
    "Romance is in the air at this spot 💕",
    "Tonight's chemistry will be off the charts 🧪",
    "A meaningful connection awaits you here 🔗",
    "Your heart knows the way — trust it 💖",
    "Love isn't found, it's built — start here 🏗️",
    "Someone here will see the real you ✨",
    "Butterflies incoming in 3... 2... 1... 🦋",
    "Your soulmate might be at the next table 👀",
    "Tonight's memories will make your heart flutter 💓",
    "The universe ships you two so hard right now 🚢",
    "A glance becomes a conversation becomes... 😏",
    "Your love language is about to be spoken fluently 🗣️",
  ],
  career: [
    "A networking opportunity awaits at this spot 🤝",
    "Your next big idea will strike here 💡",
    "Success leaves clues — pay attention tonight 👀",
    "Someone here could change your career trajectory 📈",
    "Your future self will thank you for tonight 🙏",
    "Confidence looks good on you — wear it here 👔",
    "The grind pays off — celebrate your wins 🏆",
    "A casual convo here leads to a major opportunity 💼",
    "Your ambition is your superpower — use it ⚡",
    "Trust your gut — it's gotten you this far 🎯",
    "Leaders eat here. Now you do too 🍽️",
    "Tonight's small talk becomes tomorrow's big deal 📝",
    "Your potential is about to be recognized 🌟",
    "The universe is promoting you — accept it 🎖️",
    "Main characters make moves. This is yours 🎬",
  ],
  unhinged: [
    "Regret nothing. Especially not tonight's choices 🫠",
    "This is either your best or worst idea. No in-between 🎰",
    "Someone here will match your chaotic energy 🌪️",
    "Your future excuse starts with 'well, the app told me to...' 📱",
    "Feral energy: activated 🐺",
    "Normal is overrated. Go full chaos goblin 👺",
    "The universe dares you to be unhinged tonight 🎲",
    "Bad decisions make the best stories 📚",
    "Your villain origin story could start here (affectionately) 💅",
    "Chaos isn't a pit — it's a ladder 🪜",
    "Touch grass? Nah, touch mayhem 🔥",
    "This is your Roman Empire moment 🏛️",
    "Unhinged behavior: scheduled ✅",
    "Reality is optional. Vibes are mandatory 🌀",
    "The void stares back. Stare harder 👁️",
  ],
  'main-character': [
    "Main character energy: maxed out 💯",
    "Everyone else is an NPC tonight. You're the protagonist 🎮",
    "Your entrance will turn heads 💁",
    "The spotlight follows you — own it 🔦",
    "Plot armor: activated. Nothing can stop you ⚔️",
    "Your aesthetic is immaculate today 🎨",
    "Background music is playing just for you 🎵",
    "This is your montage moment 🎬",
    "Iconic behavior only from here on out ✨",
    "The algorithm of life just boosted your post 📲",
    "You're giving... everything. Serve it 🍽️",
    "NPC behavior is simply not an option 🙅",
    "Your glow-up has been noticed by the universe 🌟",
    "Cinematic parallels are forming around you 🎥",
    "You understood the assignment. Extra credit earned 💫",
  ],
};

export const getRandomFortune = (pack: FortunePack = 'classic'): string => {
  const fortunes = FORTUNES[pack];
  return fortunes[Math.floor(Math.random() * fortunes.length)];
};

export const getPremiumPacks = (): FortunePackInfo[] => {
  return FORTUNE_PACKS.filter(pack => pack.isPremium);
};

export const getFreePacks = (): FortunePackInfo[] => {
  return FORTUNE_PACKS.filter(pack => !pack.isPremium);
};
