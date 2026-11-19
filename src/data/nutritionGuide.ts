export interface NutritionFoodItem {
  name: string;
  keyNutrient: string;
  benefit: string;
}

export interface AvoidItem {
  item: string;
  category: string;
  reason: string;
}

export interface WarningSignItem {
  symptom: string;
  detail: string;
}

export interface TrimesterCareGuide {
  trimester: 1 | 2 | 3;
  title: string;
  weekRange: string;
  headline: string;
  summary: string;
  calorieGuidance: string;
  hydrationTarget: string;
  priorityNutrients: string[];
  recommendedFoods: NutritionFoodItem[];
  foodsToAvoid: AvoidItem[];
  warningSigns: WarningSignItem[];
  dailyCareNote: string;
}

export const TRIMESTER_CARE_GUIDES: Record<1 | 2 | 3, TrimesterCareGuide> = {
  1: {
    trimester: 1,
    title: '1st Trimester',
    weekRange: 'Weeks 1–13',
    headline: 'Folate foundation, gentle meals, and early neural support',
    summary:
      'Focus on nutrient-dense, easy-to-digest small meals while baby’s brain, spinal cord, and major organs begin forming.',
    calorieGuidance: 'Same as pre-pregnancy (+0 kcal/day) — prioritize nutrient quality',
    hydrationTarget: '2.3–2.5 L daily (8–10 cups, sipped slowly if nauseous)',
    priorityNutrients: ['Folate (600 mcg)', 'Vitamin B6', 'Iron', 'Choline'],
    recommendedFoods: [
      {
        name: 'Spinach, dark leafy greens & lentils (dal)',
        keyNutrient: 'Folate & Iron',
        benefit:
          'Supports neural tube development and healthy early red blood cell production.',
      },
      {
        name: 'Citrus fruits, guava & amla',
        keyNutrient: 'Vitamin C',
        benefit:
          'Boosts iron absorption from plant foods and helps keep morning nausea calmer.',
      },
      {
        name: 'Bananas, oats & whole-grain toast',
        keyNutrient: 'Vitamin B6 & Gentle Carbs',
        benefit:
          'Easy on a sensitive stomach and clinically helpful for easing morning sickness.',
      },
      {
        name: 'Well-cooked eggs & plain yogurt (curd)',
        keyNutrient: 'Choline & Protein',
        benefit:
          'Provides building blocks for early brain tissue and gut-friendly probiotics.',
      },
      {
        name: 'Almonds, walnuts & roasted chickpeas',
        keyNutrient: 'Healthy Fats & Zinc',
        benefit:
          'Compact, protein-rich snacks when full meals feel overwhelming.',
      },
      {
        name: 'Ginger tea (mild) & lemon water',
        keyNutrient: 'Hydration & Relief',
        benefit:
          'Helps settle queasiness and maintain fluid balance throughout the day.',
      },
    ],
    foodsToAvoid: [
      {
        item: 'Raw or undercooked eggs, meat & seafood',
        category: 'Infection risk',
        reason:
          'Can carry Salmonella, Toxoplasma, or Listeria, which pose higher risks in early pregnancy.',
      },
      {
        item: 'Unpasteurized milk, raw cheese & unwashed produce',
        category: 'Food safety',
        reason:
          'Always choose pasteurized dairy and wash fruits, vegetables, and herbs thoroughly.',
      },
      {
        item: 'High-mercury fish (shark, swordfish, king mackerel)',
        category: 'Heavy metals',
        reason:
          'Excess mercury can interfere with baby’s developing nervous system.',
      },
      {
        item: 'Excess caffeine (over 200 mg/day) & energy drinks',
        category: 'Stimulant limit',
        reason:
          'Limit to roughly 1 small cup of coffee or 2 cups of mild tea daily; avoid energy drinks completely.',
      },
      {
        item: 'Alcohol, smoking & unprescribed herbal remedies',
        category: 'Strict avoidance',
        reason:
          'No amount of alcohol is safe during pregnancy; check every supplement or herb with your doctor.',
      },
    ],
    warningSigns: [
      {
        symptom: 'Vaginal bleeding or soaking through a pad',
        detail:
          'Especially if paired with period-like cramping or passing tissue.',
      },
      {
        symptom: 'Severe one-sided lower abdominal or shoulder pain',
        detail:
          'Needs urgent assessment to rule out ectopic pregnancy or other complications.',
      },
      {
        symptom: 'Unable to keep fluids down for 24 hours',
        detail:
          'Persistent vomiting with dark urine or dizziness can signal dehydration (hyperemesis).',
      },
      {
        symptom: 'High fever (38°C / 100.4°F or higher)',
        detail:
          'Contact your provider promptly rather than self-medicating.',
      },
      {
        symptom: 'Painful burning urination or foul-smelling discharge',
        detail:
          'Early urinary or vaginal infections should be treated promptly with pregnancy-safe care.',
      },
    ],
    dailyCareNote:
      'Take your prescribed prenatal vitamin with folic acid daily, eat smaller meals every 3 hours to steady blood sugar, and rest when fatigue hits.',
  },

  2: {
    trimester: 2,
    title: '2nd Trimester',
    weekRange: 'Weeks 14–27',
    headline: 'Bone building, iron reserves, and steady baby growth',
    summary:
      'Appetite and energy usually improve as baby’s skeleton hardens, blood volume expands, and brain connections accelerate.',
    calorieGuidance: 'About +340 extra kcal/day from balanced whole foods',
    hydrationTarget: '2.5–3.0 L daily (10–12 cups) to support expanding blood volume',
    priorityNutrients: ['Calcium (1,000 mg)', 'Iron (27 mg)', 'Vitamin D', 'Omega-3 DHA'],
    recommendedFoods: [
      {
        name: 'Pasteurized milk, yogurt, paneer & fortified soy milk',
        keyNutrient: 'Calcium & Vitamin D',
        benefit:
          'Builds baby’s growing bones and teeth while protecting your own bone density.',
      },
      {
        name: 'Lean poultry, cooked red meat, lentils & dates',
        keyNutrient: 'Iron & Protein',
        benefit:
          'Prevents pregnancy anemia as maternal blood volume increases by nearly 50%.',
      },
      {
        name: 'Low-mercury fish (salmon, sardines, rohu, hilsa in moderation) & chia/walnuts',
        keyNutrient: 'Omega-3 DHA',
        benefit:
          'Essential for baby’s rapid brain, retina, and nervous system development.',
      },
      {
        name: 'Whole grains, brown rice, pears & leafy vegetables',
        keyNutrient: 'Dietary Fiber',
        benefit:
          'Supports steady digestion and helps prevent common second-trimester constipation.',
      },
      {
        name: 'Sweet potatoes, carrots & bell peppers',
        keyNutrient: 'Beta-Carotene & Vitamin C',
        benefit:
          'Supports immune health, skin elasticity, and iron absorption.',
      },
      {
        name: 'Eggs, chickpeas & tofu',
        keyNutrient: 'Complete Protein',
        benefit:
          'Supplies daily amino acids needed for placenta and fetal muscle growth.',
      },
    ],
    foodsToAvoid: [
      {
        item: 'Sugary drinks, refined sweets & heavy deep-fried snacks',
        category: 'Blood sugar balance',
        reason:
          'Frequent sugar spikes raise the risk of gestational diabetes and energy crashes.',
      },
      {
        item: 'Tea or coffee right with iron-rich meals',
        category: 'Nutrient absorption',
        reason:
          'Tannins block iron absorption; space tea or coffee at least 1 hour away from iron pills or meals.',
      },
      {
        item: 'Deli meats (unless steaming hot) & raw sprouts',
        category: 'Listeria safety',
        reason:
          'Reheat cold cuts thoroughly and cook sprouts before eating to eliminate bacteria.',
      },
      {
        item: 'Excessively salty packaged foods & pickles',
        category: 'Fluid balance',
        reason:
          'High sodium worsens ankle swelling and can contribute to elevated blood pressure.',
      },
      {
        item: 'Raw fish/sushi, unpasteurized juices & alcohol',
        category: 'Food safety',
        reason:
          'Avoid raw seafood, unpasteurized street juices, and all alcoholic beverages.',
      },
    ],
    warningSigns: [
      {
        symptom: 'Gush or steady trickle of watery vaginal fluid',
        detail:
          'Could indicate early rupture of membranes — get evaluated right away.',
      },
      {
        symptom: 'Regular painful cramping or rhythmic contractions',
        detail:
          'More than 4–6 tightening contractions in an hour before 37 weeks needs prompt evaluation.',
      },
      {
        symptom: 'Severe persistent headache, blurred vision, or flashing spots',
        detail:
          'Possible warning signs of elevated pregnancy blood pressure (preeclampsia).',
      },
      {
        symptom: 'Sudden swelling of the face, eyes, or hands',
        detail:
          'Unlike mild evening ankle swelling, sudden facial or hand swelling requires blood pressure checks.',
      },
      {
        symptom: 'Vaginal bleeding or severe abdominal pain',
        detail:
          'Any bright red bleeding in the second trimester should be assessed immediately by your doctor.',
      },
    ],
    dailyCareNote:
      'Pair iron supplements with vitamin C (like orange or lemon) instead of milk, begin sleeping on your side as your bump grows, and stay active with gentle daily walks.',
  },

  3: {
    trimester: 3,
    title: '3rd Trimester',
    weekRange: 'Weeks 28–40',
    headline: 'Final brain growth, stamina for labor, and close monitoring',
    summary:
      'Baby puts on most of their birth weight now while stomach space shrinks — choose smaller, protein- and iron-packed meals.',
    calorieGuidance: 'About +450 extra kcal/day split across 5–6 smaller meals',
    hydrationTarget: '2.5–3.0 L daily — steady fluids help prevent false contractions',
    priorityNutrients: ['Iron & Protein', 'Omega-3 DHA', 'Calcium', 'Fiber & Magnesium'],
    recommendedFoods: [
      {
        name: 'Small frequent meals with eggs, fish, chicken & dal',
        keyNutrient: 'Protein & Iron',
        benefit:
          'Fuels rapid third-trimester baby weight gain and builds iron stores for delivery.',
      },
      {
        name: 'Oats, flaxseed, prunes, papaya (fully ripe) & apples',
        keyNutrient: 'Soluble Fiber',
        benefit:
          'Relieves late-pregnancy constipation and eases heartburn pressure.',
      },
      {
        name: 'Yogurt, milk, sesame seeds & ragi',
        keyNutrient: 'Calcium & Magnesium',
        benefit:
          'Supports baby’s final skeletal mineralization and helps reduce nighttime leg cramps.',
      },
      {
        name: 'Avocado, walnuts, pumpkin seeds & cooked salmon',
        keyNutrient: 'Healthy Fats & DHA',
        benefit:
          'Supports baby’s final surge in brain and lung maturation.',
      },
      {
        name: 'Coconut water, bananas & leafy greens',
        keyNutrient: 'Potassium & Electrolytes',
        benefit:
          'Helps balance fluids, ease mild foot swelling, and prevent muscle cramps.',
      },
      {
        name: 'Dates (in late weeks 36+, if no gestational diabetes)',
        keyNutrient: 'Natural Energy & Fiber',
        benefit:
          'Nutritious energy snack late in pregnancy; check with your doctor if monitoring blood sugar.',
      },
    ],
    foodsToAvoid: [
      {
        item: 'Large, spicy, greasy, or late-night heavy meals',
        category: 'Reflux & comfort',
        reason:
          'Worsens acid reflux and shortness of breath when lying down; finish dinner 2–3 hours before bed.',
      },
      {
        item: 'High-sodium processed foods & salty snacks',
        category: 'Swelling & BP',
        reason:
          'Can aggravate fluid retention and blood pressure spikes in the final trimester.',
      },
      {
        item: 'Unripe papaya, raw/undercooked meats & unpasteurized dairy',
        category: 'Late-stage safety',
        reason:
          'Unripe (green) papaya contains latex compounds best avoided; keep strict food hygiene.',
      },
      {
        item: 'High-mercury fish & caffeine above 200 mg/day',
        category: 'Sleep & fetal safety',
        reason:
          'Excess caffeine disrupts already fragile third-trimester sleep and crosses the placenta.',
      },
      {
        item: 'Lying flat on your back for long periods',
        category: 'Circulation care',
        reason:
          'Prefer left or right side sleeping with pillow support to keep healthy blood flow to baby.',
      },
    ],
    warningSigns: [
      {
        symptom: 'Noticeable decrease or change in baby’s movements',
        detail:
          'Do not wait until tomorrow — contact your doctor or labor ward immediately if kicks slow down.',
      },
      {
        symptom: 'Severe headache, vision changes, or upper-right belly pain',
        detail:
          'Key signs of preeclampsia; needs urgent blood pressure and urine evaluation.',
      },
      {
        symptom: 'Water breaking (gush or constant leaking of fluid)',
        detail:
          'Note the time and fluid color (especially if greenish/brown) and contact your hospital.',
      },
      {
        symptom: 'Vaginal bleeding (more than light mucus-tinged spotting)',
        detail:
          'Bright red bleeding in the third trimester requires immediate medical care.',
      },
      {
        symptom: 'Regular painful contractions getting closer and stronger',
        detail:
          'Before 37 weeks, treat as possible preterm labor; at term, follow your provider’s 5-1-1 hospital rule.',
      },
      {
        symptom: 'Intense itching on palms and soles (especially at night)',
        detail:
          'Can signal obstetric cholestasis — mention promptly so your doctor can run a simple blood test.',
      },
    ],
    dailyCareNote:
      'Keep track of baby’s daily movement patterns, stay hydrated, elevate your feet when resting, and keep your hospital bag and prenatal records ready from Week 36.',
  },
};

export function getTrimesterCareGuide(trimester: 1 | 2 | 3): TrimesterCareGuide {
  return TRIMESTER_CARE_GUIDES[trimester];
}
