// Fortune messages - fun predictions for your outing
export const FORTUNES = [
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
];

export const getRandomFortune = (): string => {
  return FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
};
