// =============================================================================
// PetalList 🎀 - Daily Surprise Quotes, Jokes & Girly Motivation
// 70+ hand-crafted, relatable, cute, and funny reminders for lovely days ♡
// =============================================================================

const PETAL_QUOTES = [
  // 🎓 STUDENT LIFE & ACADEMIC CHAOS
  {
    id: 1,
    category: "STUDENT LIFE IS A JOKE 🎓",
    text: "You are the main character. Unfortunately, your assignments are also recurring characters."
  },
  {
    id: 2,
    category: "STUDENT LIFE IS A JOKE 🎓",
    text: "Roses are red, deadlines are near, I opened my laptop and immediately disappeared."
  },
  {
    id: 3,
    category: "STUDENT LIFE IS A JOKE 🎓",
    text: "Me: 'I'll study early this semester.' Narrator: 'She did not, in fact, study early. She was currently making an aesthetic Spotify playlist.'"
  },
  {
    id: 4,
    category: "STUDENT LIFE IS A JOKE 🎓",
    text: "Due tomorrow means do tomorrow. But maybe do just five minutes today so future you doesn't cry into her matcha."
  },
  {
    id: 5,
    category: "STUDENT LIFE IS A JOKE 🎓",
    text: "Currently holding my degree together with pink ribbon, iced lattes, and sheer audacity."
  },
  {
    id: 6,
    category: "STUDENT LIFE IS A JOKE 🎓",
    text: "Reading the syllabus like it's a dramatic novel full of betrayal and unexpected plot twists."
  },
  {
    id: 7,
    category: "STUDENT LIFE IS A JOKE 🎓",
    text: "My study routine consists of 10% actual revision and 90% color-coding highlighters."
  },
  {
    id: 8,
    category: "STUDENT LIFE IS A JOKE 🎓",
    text: "Exams are temporary, but the psychological bond you formed with that one study coffee shop is forever."
  },
  {
    id: 9,
    category: "STUDENT LIFE IS A JOKE 🎓",
    text: "Brain during exams: 404 knowledge not found. Brain at 3 AM: Here is the entire lyric history of Taylor Swift."
  },

  // 💻 CODING, TECH & BUG CHAOS
  {
    id: 10,
    category: "TECH & CHAOS 💻",
    text: "Your code doesn't hate you. It's just communicating in a language of passive aggression."
  },
  {
    id: 11,
    category: "TECH & CHAOS 💻",
    text: "Progress is progress, even if today's achievement was finally naming your variables properly instead of 'tempFinalFinal2'."
  },
  {
    id: 12,
    category: "TECH & CHAOS 💻",
    text: "Behind every successful web app is a girl who questioned her entire existence over a missing curly bracket."
  },
  {
    id: 13,
    category: "TECH & CHAOS 💻",
    text: "It worked on localhost. Therefore, any bugs in production are merely spontaneous aesthetic features."
  },
  {
    id: 14,
    category: "TECH & CHAOS 💻",
    text: "CSS rule of life: If you can't center it in a div, at least center your peace of mind."
  },
  {
    id: 15,
    category: "TECH & CHAOS 💻",
    text: "There is nothing a little console.log('PLEASE WORK BESTIE') cannot solve."
  },
  {
    id: 16,
    category: "TECH & CHAOS 💻",
    text: "Debugging: Being the detective in a crime movie where you are also the murderer."
  },

  // 😂 YOUR DAILY DOSE OF CHAOS
  {
    id: 17,
    category: "YOUR DAILY DOSE OF CHAOS 😂",
    text: "Me: I'll start in five minutes. Also me, three hours later: researching whether penguins have knees."
  },
  {
    id: 18,
    category: "YOUR DAILY DOSE OF CHAOS 😂",
    text: "Romanticize your life, even if your current aesthetic is 37 open browser tabs and an existential sigh."
  },
  {
    id: 19,
    category: "YOUR DAILY DOSE OF CHAOS 😂",
    text: "My to-do list: 1. Wake up (achieved). 2. Be fabulous (in progress). 3. Everything else (pending divine intervention)."
  },
  {
    id: 20,
    category: "YOUR DAILY DOSE OF CHAOS 😂",
    text: "I have a degree in putting things off until adrenaline replaces my blood stream."
  },
  {
    id: 21,
    category: "YOUR DAILY DOSE OF CHAOS 😂",
    text: "Running on 3 hours of sleep, 2 iced coffees, and 1 fragile dream of being a rich aunt."
  },
  {
    id: 22,
    category: "YOUR DAILY DOSE OF CHAOS 😂",
    text: "Cleaned my whole room, baked strawberry muffins, and reorganized my closet just to avoid doing one 5-minute task."
  },
  {
    id: 23,
    category: "YOUR DAILY DOSE OF CHAOS 😂",
    text: "I am not procrastinating. I am giving my brilliant ideas time to marinate in the salon of my mind."
  },
  {
    id: 24,
    category: "YOUR DAILY DOSE OF CHAOS 😂",
    text: "Life update: Currently oscillating between 'I am capable of anything' and 'I need my mom to make an appointment for me'."
  },
  {
    id: 25,
    category: "YOUR DAILY DOSE OF CHAOS 😂",
    text: "They say money can't buy happiness, but it can buy cute stationery and iced matcha, which is basically the same thing."
  },

  // 💗 GIRL, YOU GOT THIS
  {
    id: 26,
    category: "GIRL, YOU GOT THIS 💗",
    text: "You can do hard things. You can also do easy things after a little sweet snack."
  },
  {
    id: 27,
    category: "GIRL, YOU GOT THIS 💗",
    text: "Look how far you've come already! Remember when you were stressed about things you don't even think about anymore?"
  },
  {
    id: 28,
    category: "GIRL, YOU GOT THIS 💗",
    text: "Big goals are just a bunch of cute little daily habits bundled up in a pretty ribbon."
  },
  {
    id: 29,
    category: "GIRL, YOU GOT THIS 💗",
    text: "The secret to getting ahead is simply starting. Cross off just one tiny item and watch your momentum blossom 🌸"
  },
  {
    id: 30,
    category: "GIRL, YOU GOT THIS 💗",
    text: "You don't need a clean slate or a perfect Monday. You just need this present moment and a pretty mindset."
  },
  {
    id: 31,
    category: "GIRL, YOU GOT THIS 💗",
    text: "Believe in the girl you are becoming. She is smart, resilient, well-hydrated, and completely unstoppable."
  },
  {
    id: 32,
    category: "GIRL, YOU GOT THIS 💗",
    text: "Don't diminish your light just because someone else forgot to wear their sunglasses."
  },
  {
    id: 33,
    category: "GIRL, YOU GOT THIS 💗",
    text: "Even the slowest petal eventually reaches the ground. Consistent tiny steps beat chaotic sprints every time."
  },
  {
    id: 34,
    category: "GIRL, YOU GOT THIS 💗",
    text: "You survived 100% of your worst days, toughest exams, and most dramatic hair disasters. You've got today easily."
  },

  // 🎀 COQUETTE WISDOM & GLAMOUR
  {
    id: 35,
    category: "COQUETTE WISDOM 🎀",
    text: "Put a bow on your problems, darling. They may not disappear, but at least they'll look decorative."
  },
  {
    id: 36,
    category: "COQUETTE WISDOM 🎀",
    text: "Always romanticize the mundane: make your workspace smell like vanilla and play French bistro jazz while you type."
  },
  {
    id: 37,
    category: "COQUETTE WISDOM 🎀",
    text: "A girl with a to-do list and lip gloss is more dangerous than a corporate CEO."
  },
  {
    id: 38,
    category: "COQUETTE WISDOM 🎀",
    text: "Life is too short to write your goals down in a boring pen. Always choose pastel pink gel pens."
  },
  {
    id: 39,
    category: "COQUETTE WISDOM 🎀",
    text: "Elegance is refusing to let a bad morning turn into an uncharming afternoon."
  },
  {
    id: 40,
    category: "COQUETTE WISDOM 🎀",
    text: "Channel your inner heroine: drink tea from porcelain, write in cursive, and check off tasks with soft flair."
  },
  {
    id: 41,
    category: "COQUETTE WISDOM 🎀",
    text: "Wear your confidence like vintage perfume: subtle, enchanting, and impossible to forget."
  },

  // 💅 SASSY & CLASSY
  {
    id: 42,
    category: "SASSY & CLASSY 💅",
    text: "Your dreams are expensive. Fortunately, this quote is free. Now go finish that task!"
  },
  {
    id: 43,
    category: "SASSY & CLASSY 💅",
    text: "Girl, you don't need to have your whole life figured out. Just figure out what you're eating first."
  },
  {
    id: 44,
    category: "SASSY & CLASSY 💅",
    text: "I'm not high maintenance; I just refuse to settle for un-aesthetic vibes and mediocre effort."
  },
  {
    id: 45,
    category: "SASSY & CLASSY 💅",
    text: "Never let anyone dull your sparkle. If they try, sprinkle a little glitter in their keyboard."
  },
  {
    id: 46,
    category: "SASSY & CLASSY 💅",
    text: "Of course it's hard. If it were easy, everyone would look this gorgeous while getting their degree."
  },
  {
    id: 47,
    category: "SASSY & CLASSY 💅",
    text: "I do not chase; I attract. Except for deadlines. Those chase me down the street with a megaphone."
  },
  {
    id: 48,
    category: "SASSY & CLASSY 💅",
    text: "Sorry I can't attend bad vibes today, my planner is completely booked with being iconic."
  },
  {
    id: 49,
    category: "SASSY & CLASSY 💅",
    text: "A gentle reminder that crying over your workload is totally fine, provided you do not ruin your winged eyeliner."
  },

  // ✨ GENTLE REMINDER & SELF CARE
  {
    id: 50,
    category: "GENTLE REMINDER ✨",
    text: "Reminder: your worth is not measured by your productivity. Now drink some water, pretty girl."
  },
  {
    id: 51,
    category: "GENTLE REMINDER ✨",
    text: "You deserve the same kindness you give to everyone else. Yes, that includes yourself, miss girl."
  },
  {
    id: 52,
    category: "GENTLE REMINDER ✨",
    text: "Unclench your jaw. Drop your shoulders away from your ears. Take a deep, sweet breath ♡"
  },
  {
    id: 53,
    category: "GENTLE REMINDER ✨",
    text: "Resting is part of the work, sweetie. You cannot pour lovely thoughts from an empty tea cup."
  },
  {
    id: 54,
    category: "GENTLE REMINDER ✨",
    text: "Celebrate the small wins: making your bed, drinking water, or simply crossing one little item off today."
  },
  {
    id: 55,
    category: "GENTLE REMINDER ✨",
    text: "Give yourself permission to slow down. The flowers do not rush to bloom, and they are stunning."
  },
  {
    id: 56,
    category: "GENTLE REMINDER ✨",
    text: "It is okay if all you did today was breathe and hold yourself together. Tomorrow has fresh grace."
  },
  {
    id: 57,
    category: "GENTLE REMINDER ✨",
    text: "Be gentle with your soft heart. You are learning, evolving, and doing the absolute best you can."
  },

  // 💌 A LITTLE LOVE NOTE
  {
    id: 58,
    category: "A LITTLE LOVE NOTE 💌",
    text: "A little progress, a little chaos, and a suspicious amount of coffee."
  },
  {
    id: 59,
    category: "A LITTLE LOVE NOTE 💌",
    text: "May your day be filled with warm sunlight, cozy hoodies, and sudden bursts of sudden productivity."
  },
  {
    id: 60,
    category: "A LITTLE LOVE NOTE 💌",
    text: "You make the world softer and lovelier just by existing in it. Never forget that ♡"
  },
  {
    id: 61,
    category: "A LITTLE LOVE NOTE 💌",
    text: "Sending you a bouquet of imaginary peonies and a boost of cosmic focus for whatever you're tackling today 🌸"
  },
  {
    id: 62,
    category: "A LITTLE LOVE NOTE 💌",
    text: "I hope something surprisingly wonderful happens to you today, like finding $10 in your coat pocket."
  },
  {
    id: 63,
    category: "A LITTLE LOVE NOTE 💌",
    text: "You are doing so much better than you give yourself credit for. I'm proud of you, angel."
  },
  {
    id: 64,
    category: "A LITTLE LOVE NOTE 💌",
    text: "Everything will work out in the end. And if it hasn't worked out yet, then it isn't the end ♡"
  },
  {
    id: 65,
    category: "A LITTLE LOVE NOTE 💌",
    text: "May your code compile on the first try, your Wi-Fi stay strong, and your snacks never run out."
  },
  {
    id: 66,
    category: "A LITTLE LOVE NOTE 💌",
    text: "You are stronger than the toughest Monday morning and cuter than a basket of bakery croissants."
  },
  {
    id: 67,
    category: "A LITTLE LOVE NOTE 💌",
    text: "Remember: You didn't come this far just to come this far. Your fairytale happy chapter is currently being written."
  },
  {
    id: 68,
    category: "A LITTLE LOVE NOTE 💌",
    text: "Take a 5-minute break, stretch your pretty arms, and smile. You've earned it!"
  }
];

// Export for browser usage or Node tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PETAL_QUOTES;
}
