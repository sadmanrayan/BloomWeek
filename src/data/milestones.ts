export interface WeeklyMilestone {
  week: number;
  sizeComparison: string;
  approxLength: string;
  highlight: string;
  imageSrc: string;
  imageAlt: string;
}

export const DEFAULT_HERO_IMAGE_PATH =
  '/src/assets/images/maternal_botanical_keepsake_1795098935014.jpg';
export const DEFAULT_HERO_IMAGE_ALT =
  'Soft blush peonies, chamomile blossoms, and muted eucalyptus resting on sunlit linen';

const SIZE_IMAGES = {
  botanical: {
    imageSrc: DEFAULT_HERO_IMAGE_PATH,
    imageAlt: DEFAULT_HERO_IMAGE_ALT,
  },
  seeds: {
    imageSrc: '/src/assets/images/size_poppy_seeds_1795100558610.jpg',
    imageAlt: 'Tiny dark poppy seeds and sesame seeds in a handmade cream ceramic bowl on sunlit linen',
  },
  blueberry: {
    imageSrc: '/src/assets/images/size_blueberry_1795100559046.jpg',
    imageAlt: 'Fresh organic blueberries with a green leaf resting on warm sunlit linen',
  },
  raspberry: {
    imageSrc: '/src/assets/images/size_raspberry_1795100559226.jpg',
    imageAlt: 'Fresh ripe ruby red raspberries with delicate berry leaves on warm sunlit linen',
  },
  plum: {
    imageSrc: '/src/assets/images/size_plum_1795100560042.jpg',
    imageAlt: 'Ripe velvety deep-rose plums with an orchard leaf on warm sunlit linen',
  },
  peach: {
    imageSrc: '/src/assets/images/size_peach_1795100558197.jpg',
    imageAlt: 'Soft blush ripe peach with a fresh green leaf resting on warm sunlit linen',
  },
  apple: {
    imageSrc: '/src/assets/images/size_apple_1795100558264.jpg',
    imageAlt: 'Heirloom blush-red apple with its natural stem and green leaf on warm sunlit linen',
  },
  avocado: {
    imageSrc: '/src/assets/images/size_avocado_1795100559265.jpg',
    imageAlt: 'Fresh organic sage-green avocado resting on warm sunlit linen',
  },
  banana: {
    imageSrc: '/src/assets/images/size_banana_1795100559401.jpg',
    imageAlt: 'Ripe organic yellow banana resting naturally on warm sunlit linen',
  },
  mango: {
    imageSrc: '/src/assets/images/size_mango_1795100559406.jpg',
    imageAlt: 'Sun-ripened rosy-golden mango resting on warm sunlit linen',
  },
  coconut: {
    imageSrc: '/src/assets/images/size_coconut_1795100559302.jpg',
    imageAlt: 'Natural rustic whole brown coconut resting gently on warm sunlit linen',
  },
  pineapple: {
    imageSrc: '/src/assets/images/size_pineapple_1795100559765.jpg',
    imageAlt: 'Fresh golden organic pineapple with leafy green crown resting on warm sunlit linen',
  },
  pumpkin: {
    imageSrc: '/src/assets/images/size_pumpkin_1795100560639.jpg',
    imageAlt: 'Small heirloom blush-terracotta pumpkin resting on warm sunlit linen',
  },
} as const;

const WEEKLY_MILESTONES: Record<number, WeeklyMilestone> = {
  1: {
    week: 1,
    sizeComparison: 'Beginning of Cycle',
    approxLength: 'Prep phase',
    highlight: 'Your body prepares a nurturing lining as Week 1 begins the 40-week pregnancy calendar.',
    ...SIZE_IMAGES.botanical,
  },
  2: {
    week: 2,
    sizeComparison: 'Follicle Maturing',
    approxLength: 'Prep phase',
    highlight: 'Ovulation approaches near the end of this week, setting the stage for fertilization.',
    ...SIZE_IMAGES.botanical,
  },
  3: {
    week: 3,
    sizeComparison: 'Tiny Poppy Seed',
    approxLength: '< 0.1 cm',
    highlight: 'A tiny cluster of rapidly dividing cells travels gently toward the uterus.',
    ...SIZE_IMAGES.seeds,
  },
  4: {
    week: 4,
    sizeComparison: 'Poppy Seed',
    approxLength: '0.2 cm',
    highlight: 'Implantation takes place and early pregnancy hormones begin to rise steadily.',
    ...SIZE_IMAGES.seeds,
  },
  5: {
    week: 5,
    sizeComparison: 'Sesame Seed',
    approxLength: '0.3 cm',
    highlight: 'The neural tube and the earliest structures of baby’s tiny heart begin forming.',
    ...SIZE_IMAGES.seeds,
  },
  6: {
    week: 6,
    sizeComparison: 'Small Blueberry',
    approxLength: '0.6 cm',
    highlight: 'Tiny buds for arms and legs appear as a rhythmic heartbeat starts fluttering.',
    ...SIZE_IMAGES.blueberry,
  },
  7: {
    week: 7,
    sizeComparison: 'Blueberry',
    approxLength: '1.3 cm',
    highlight: 'Baby’s brain hemispheres grow rapidly and tiny facial features start taking shape.',
    ...SIZE_IMAGES.blueberry,
  },
  8: {
    week: 8,
    sizeComparison: 'Raspberry',
    approxLength: '1.6 cm',
    highlight: 'Webbed little fingers and toes begin forming while baby starts making gentle movements.',
    ...SIZE_IMAGES.raspberry,
  },
  9: {
    week: 9,
    sizeComparison: 'Ripe Raspberry',
    approxLength: '2.3 cm',
    highlight: 'Heart chambers divide clearly and essential internal organs continue developing.',
    ...SIZE_IMAGES.raspberry,
  },
  10: {
    week: 10,
    sizeComparison: 'Small Plum',
    approxLength: '3.1 cm',
    highlight: 'Vital organs are formed and functioning; tiny fingernails and peach-fuzz hair begin.',
    ...SIZE_IMAGES.plum,
  },
  11: {
    week: 11,
    sizeComparison: 'Orchard Plum',
    approxLength: '4.1 cm',
    highlight: 'Baby stretches and kicks gracefully inside, with hands opening and closing into fists.',
    ...SIZE_IMAGES.plum,
  },
  12: {
    week: 12,
    sizeComparison: 'Plum',
    approxLength: '5.4 cm',
    highlight: 'Reflexes awaken as baby’s fingers curl and vocal cords begin to form.',
    ...SIZE_IMAGES.plum,
  },
  13: {
    week: 13,
    sizeComparison: 'Peach',
    approxLength: '7.4 cm',
    highlight: 'Unique fingerprints emerge on tiny fingertips as the first trimester wraps up.',
    ...SIZE_IMAGES.peach,
  },
  14: {
    week: 14,
    sizeComparison: 'Ripe Peach',
    approxLength: '8.7 cm',
    highlight: 'Welcome to the second trimester — baby can now squint, frown, and practice facial expressions.',
    ...SIZE_IMAGES.peach,
  },
  15: {
    week: 15,
    sizeComparison: 'Apple',
    approxLength: '10.1 cm',
    highlight: 'Baby senses soft light through closed eyelids and tiny bones continue hardening.',
    ...SIZE_IMAGES.apple,
  },
  16: {
    week: 16,
    sizeComparison: 'Avocado',
    approxLength: '11.6 cm',
    highlight: 'Tiny ear bones are in place, letting baby begin hearing the comforting sound of your voice.',
    ...SIZE_IMAGES.avocado,
  },
  17: {
    week: 17,
    sizeComparison: 'Ripe Avocado',
    approxLength: '13.0 cm',
    highlight: 'Baby practices sucking and swallowing while protective adipose tissue starts developing.',
    ...SIZE_IMAGES.avocado,
  },
  18: {
    week: 18,
    sizeComparison: 'Large Avocado',
    approxLength: '14.2 cm',
    highlight: 'Nerves gain protective myelin and you may start noticing gentle butterfly-like flutters.',
    ...SIZE_IMAGES.avocado,
  },
  19: {
    week: 19,
    sizeComparison: 'Small Banana',
    approxLength: '15.3 cm',
    highlight: 'Sensory areas of the brain for smell, taste, hearing, vision, and touch flourish.',
    ...SIZE_IMAGES.banana,
  },
  20: {
    week: 20,
    sizeComparison: 'Banana',
    approxLength: '25.6 cm',
    highlight: 'Halfway milestone — baby sleeps and wakes in gentle rhythms and responds to sound.',
    ...SIZE_IMAGES.banana,
  },
  21: {
    week: 21,
    sizeComparison: 'Ripe Banana',
    approxLength: '26.7 cm',
    highlight: 'Tiny kicks become more coordinated as eyebrows and eyelids grow more distinct.',
    ...SIZE_IMAGES.banana,
  },
  22: {
    week: 22,
    sizeComparison: 'Large Banana',
    approxLength: '27.8 cm',
    highlight: 'Baby looks more like a miniature newborn every day with fine eyelashes and soft hair.',
    ...SIZE_IMAGES.banana,
  },
  23: {
    week: 23,
    sizeComparison: 'Mango',
    approxLength: '28.9 cm',
    highlight: 'Lungs practice gentle breathing motions and baby recognizes familiar melodies and voices.',
    ...SIZE_IMAGES.mango,
  },
  24: {
    week: 24,
    sizeComparison: 'Ripe Mango',
    approxLength: '30.0 cm',
    highlight: 'Inner ear balance develops, helping baby sense which way is up inside the womb.',
    ...SIZE_IMAGES.mango,
  },
  25: {
    week: 25,
    sizeComparison: 'Golden Mango',
    approxLength: '34.6 cm',
    highlight: 'Baby’s skin turns rosy and smooth as tiny capillaries fill and baby fills out.',
    ...SIZE_IMAGES.mango,
  },
  26: {
    week: 26,
    sizeComparison: 'Large Mango',
    approxLength: '35.6 cm',
    highlight: 'Eyes begin opening for the first time and baby responds to gentle touch on your belly.',
    ...SIZE_IMAGES.mango,
  },
  27: {
    week: 27,
    sizeComparison: 'Young Coconut',
    approxLength: '36.6 cm',
    highlight: 'Brain activity surges with dreaming sleep cycles as the second trimester concludes.',
    ...SIZE_IMAGES.coconut,
  },
  28: {
    week: 28,
    sizeComparison: 'Small Coconut',
    approxLength: '37.6 cm',
    highlight: 'Third trimester begins — baby blinks, hiccups, and builds cozy reserves for birth.',
    ...SIZE_IMAGES.coconut,
  },
  29: {
    week: 29,
    sizeComparison: 'Coconut',
    approxLength: '38.6 cm',
    highlight: 'Muscles and lungs keep strengthening while kicks feel noticeably stronger and rhythmic.',
    ...SIZE_IMAGES.coconut,
  },
  30: {
    week: 30,
    sizeComparison: 'Whole Coconut',
    approxLength: '39.9 cm',
    highlight: 'Baby’s brain develops intricate folds and grooves to support learning and memory.',
    ...SIZE_IMAGES.coconut,
  },
  31: {
    week: 31,
    sizeComparison: 'Large Coconut',
    approxLength: '41.1 cm',
    highlight: 'All five senses are actively processing the warm, rhythmic world inside.',
    ...SIZE_IMAGES.coconut,
  },
  32: {
    week: 32,
    sizeComparison: 'Baby Pineapple',
    approxLength: '42.4 cm',
    highlight: 'Baby practices steady breathing and swallowing while gaining healthy weight each week.',
    ...SIZE_IMAGES.pineapple,
  },
  33: {
    week: 33,
    sizeComparison: 'Pineapple',
    approxLength: '43.7 cm',
    highlight: 'Bones harden steadily while skull plates remain softly flexible for birth.',
    ...SIZE_IMAGES.pineapple,
  },
  34: {
    week: 34,
    sizeComparison: 'Golden Pineapple',
    approxLength: '45.0 cm',
    highlight: 'Central nervous system and lungs mature rapidly; baby settles into snug routines.',
    ...SIZE_IMAGES.pineapple,
  },
  35: {
    week: 35,
    sizeComparison: 'Ripe Pineapple',
    approxLength: '46.2 cm',
    highlight: 'Kidneys are fully developed and baby’s gentle stretches fill almost all cozy space.',
    ...SIZE_IMAGES.pineapple,
  },
  36: {
    week: 36,
    sizeComparison: 'Large Pineapple',
    approxLength: '47.4 cm',
    highlight: 'Baby often settles head-down in preparation for meeting you in the weeks ahead.',
    ...SIZE_IMAGES.pineapple,
  },
  37: {
    week: 37,
    sizeComparison: 'Mini Pumpkin',
    approxLength: '48.6 cm',
    highlight: 'Early full term — baby practices grasping, blinking, and steady breathing movements.',
    ...SIZE_IMAGES.pumpkin,
  },
  38: {
    week: 38,
    sizeComparison: 'Heirloom Pumpkin',
    approxLength: '49.8 cm',
    highlight: 'Organ systems are ready for life outside as baby adds soft newborn dimples.',
    ...SIZE_IMAGES.pumpkin,
  },
  39: {
    week: 39,
    sizeComparison: 'Sweet Pumpkin',
    approxLength: '50.7 cm',
    highlight: 'Full term — baby’s lungs produce ample surfactant and chest rounds out nicely.',
    ...SIZE_IMAGES.pumpkin,
  },
  40: {
    week: 40,
    sizeComparison: 'Small Pumpkin',
    approxLength: '51.2 cm',
    highlight: 'Due week has arrived — baby is fully developed and ready to greet the world.',
    ...SIZE_IMAGES.pumpkin,
  },
};

export function getWeeklyMilestone(week: number): WeeklyMilestone {
  if (week <= 1) return WEEKLY_MILESTONES[1];
  if (week >= 40) {
    return {
      ...WEEKLY_MILESTONES[40],
      week,
      highlight:
        week === 40
          ? WEEKLY_MILESTONES[40].highlight
          : 'Past 40 weeks — baby is cozy and fully mature; stay in close touch with your care provider.',
    };
  }
  return WEEKLY_MILESTONES[week] ?? WEEKLY_MILESTONES[40];
}

function getIndefiniteArticle(noun: string): 'a' | 'an' {
  return /^[aeiou]/i.test(noun.trim()) ? 'an' : 'a';
}

export function formatSizeHeadline(milestone: WeeklyMilestone): string {
  if (milestone.week <= 2) {
    return milestone.sizeComparison;
  }
  const lower = milestone.sizeComparison.toLowerCase();
  return `About the size of ${getIndefiniteArticle(lower)} ${lower}`;
}

export function formatSizeShort(milestone: WeeklyMilestone): string {
  if (milestone.week <= 2) {
    return milestone.sizeComparison;
  }
  const lower = milestone.sizeComparison.toLowerCase();
  return `Size of ${getIndefiniteArticle(lower)} ${lower}`;
}
