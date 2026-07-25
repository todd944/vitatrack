// Curated cautions for two common conditions that change how the body
// handles certain vitamins/minerals/herbs. Intentionally small and
// conservative — like interactions.js, this needs a pharmacist/clinical
// review pass before real users see it (see README "Before you launch").

export const conditionCautions = [
  {
    id: 'magnesium-kidney',
    supplementId: 'magnesium',
    condition: 'kidneyDisease',
    text: 'The kidneys clear excess magnesium. Reduced kidney function can let it build up to unsafe levels — confirm any magnesium supplement with your nephrologist or doctor.',
  },
  {
    id: 'zinc-kidney',
    supplementId: 'zinc',
    condition: 'kidneyDisease',
    text: 'High-dose zinc can accumulate when kidney function is reduced. Confirm dosing with your doctor.',
  },
  {
    id: 'vitamind-kidney',
    supplementId: 'vitamin-d',
    condition: 'kidneyDisease',
    text: 'Vitamin D metabolism and calcium/phosphorus balance are more sensitive in kidney disease. Use only under medical supervision — your doctor may prescribe a specific active form.',
  },
  {
    id: 'calcium-kidney',
    supplementId: 'calcium',
    condition: 'kidneyDisease',
    text: 'Calcium and phosphorus balance is often managed closely in kidney disease. Confirm any calcium supplement with your doctor or renal dietitian.',
  },
  {
    id: 'iron-liver',
    supplementId: 'iron',
    condition: 'liverDisease',
    text: 'The liver stores iron, and impaired liver function can affect how excess iron is handled. Confirm any iron supplement with your doctor.',
  },
  {
    id: 'sjw-liver',
    supplementId: 'st-johns-wort',
    condition: 'liverDisease',
    text: "St. John's Wort is processed by the liver and can affect liver enzymes. Use with caution and medical guidance if you have liver disease.",
  },
  {
    id: 'turmeric-liver',
    supplementId: 'turmeric',
    condition: 'liverDisease',
    text: 'High-dose turmeric/curcumin supplements have been linked to rare cases of liver injury. Use with caution and medical guidance if you have liver disease.',
  },
  {
    id: 'sjw-pregnant',
    supplementId: 'st-johns-wort',
    condition: 'pregnant',
    text: "There isn't enough reliable evidence that St. John's Wort is safe during pregnancy. NCCIH advises caution — discuss with your doctor before using it.",
  },
  {
    id: 'sjw-lactating',
    supplementId: 'st-johns-wort',
    condition: 'lactating',
    text: "There isn't enough reliable evidence that St. John's Wort is safe while breastfeeding. NCCIH advises caution — discuss with your doctor before using it.",
  },
  {
    id: 'ginkgo-pregnant',
    supplementId: 'ginkgo',
    condition: 'pregnant',
    text: "Ginkgo's safety in pregnancy hasn't been well studied, and it increases bleeding risk, which is a particular concern around delivery. Discuss with your doctor before using it.",
  },
  {
    id: 'ginkgo-lactating',
    supplementId: 'ginkgo',
    condition: 'lactating',
    text: "Ginkgo's safety while breastfeeding hasn't been well studied. Discuss with your doctor before using it.",
  },
  {
    id: 'garlic-pregnant',
    supplementId: 'garlic',
    condition: 'pregnant',
    text: 'Garlic in food amounts is considered safe in pregnancy, but concentrated supplement doses haven\'t been well studied and carry a bleeding-risk caution. Discuss supplement use with your doctor.',
  },
  {
    id: 'turmeric-pregnant',
    supplementId: 'turmeric',
    condition: 'pregnant',
    text: 'Turmeric in food amounts is considered safe in pregnancy, but concentrated curcumin supplements haven\'t been well studied. Discuss supplement use with your doctor.',
  },
  {
    id: 'melatonin-pregnant',
    supplementId: 'melatonin',
    condition: 'pregnant',
    text: "Melatonin supplement safety hasn't been well studied in pregnancy. Discuss with your doctor before using it.",
  },
  {
    id: 'melatonin-lactating',
    supplementId: 'melatonin',
    condition: 'lactating',
    text: "Melatonin supplement safety hasn't been well studied while breastfeeding, and it can pass into breast milk. Discuss with your doctor before using it.",
  },
  {
    id: 'creatine-kidney',
    supplementId: 'creatine',
    condition: 'kidneyDisease',
    text: 'Creatine is processed and cleared by the kidneys. It hasn\'t been shown to harm healthy kidneys, but people with existing kidney disease should confirm use with their doctor first.',
  },

  // Sports-nutrition products (creatine, protein, BCAAs, beta-alanine,
  // glutamine) are studied almost entirely in adults. Safety data in
  // adolescents is much more limited, so these surface a caution instead of
  // silently applying adult-oriented dosing guidance.
  {
    id: 'creatine-teen',
    supplementId: 'creatine',
    condition: 'teen',
    text: 'Most creatine research is in adults — data in people under 18 is limited. Talk to a pediatrician or sports medicine doctor before using it.',
  },
  {
    id: 'whey-protein-teen',
    supplementId: 'whey-protein',
    condition: 'teen',
    text: 'Protein needs and safe upper amounts differ for growing teenagers. Talk to a pediatrician or dietitian before adding a protein supplement on top of food.',
  },
  {
    id: 'bcaa-teen',
    supplementId: 'bcaa',
    condition: 'teen',
    text: 'BCAA supplements are studied almost entirely in adults. Talk to a pediatrician or sports medicine doctor before using them.',
  },
  {
    id: 'beta-alanine-teen',
    supplementId: 'beta-alanine',
    condition: 'teen',
    text: 'Beta-alanine supplements are studied almost entirely in adults. Talk to a pediatrician or sports medicine doctor before using them.',
  },
  {
    id: 'l-glutamine-teen',
    supplementId: 'l-glutamine',
    condition: 'teen',
    text: 'Glutamine supplements are studied almost entirely in adults. Talk to a pediatrician or sports medicine doctor before using them.',
  },

  // New vitamin/mineral additions.
  {
    id: 'vitamina-pregnant',
    supplementId: 'vitamin-a',
    condition: 'pregnant',
    text: 'High doses of preformed vitamin A (retinol) in early pregnancy are linked to birth defects. Don\'t exceed your prenatal vitamin\'s amount without your doctor\'s guidance — beta-carotene sources don\'t carry this risk.',
  },
  {
    id: 'potassium-kidney',
    supplementId: 'potassium',
    condition: 'kidneyDisease',
    text: 'Reduced kidney function makes it harder to clear excess potassium, which can cause dangerous heart rhythm changes. Don\'t take a potassium supplement without your doctor\'s guidance.',
  },
  {
    id: 'phosphorus-kidney',
    supplementId: 'phosphorus',
    condition: 'kidneyDisease',
    text: 'Phosphorus buildup is a major concern in kidney disease and is often managed closely with diet and medication. Confirm any phosphorus supplement with your doctor or renal dietitian.',
  },
  {
    id: 'copper-liver',
    supplementId: 'copper',
    condition: 'liverDisease',
    text: 'Copper is processed by the liver and can build up with impaired liver function. Confirm any copper supplement with your doctor.',
  },
  {
    id: 'manganese-liver',
    supplementId: 'manganese',
    condition: 'liverDisease',
    text: 'Manganese is cleared through the liver via bile, and impaired liver function can let it build up to levels that affect the nervous system. Confirm any manganese supplement with your doctor.',
  },
  {
    id: 'bitter-melon-pregnant',
    supplementId: 'bitter-melon',
    condition: 'pregnant',
    text: 'Some components of bitter melon have been linked to uterine contractions in animal studies. NCCIH-adjacent sources advise avoiding it in pregnancy — discuss with your doctor.',
  },
]
