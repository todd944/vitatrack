// STARTER interaction table — intentionally small and conservative.
// Every entry below is a well-established, widely-documented interaction
// referenced in NIH ODS / NCCIH fact sheets. This is NOT a substitute for a
// pharmacist/clinical review pass before this data reaches real users —
// see README.md "Before you launch" section.
//
// severity: 'caution' | 'danger' — how concerning, for coloring/pill text.
// action: 'avoid_combination' | 'adjust_timing' | 'monitor' — what the user
//   should actually do about it, since "talk to your doctor" alone doesn't
//   communicate urgency or the type of response needed.
// mechanism: optional; 'depletion' marks drug-induced nutrient depletion
//   (long-term medication use lowering a nutrient) rather than an acute
//   risk from combining — displayed with different framing in the UI.
// interactsWith.aliases (medication type only): generic + common brand
//   names to match against free-text medication entries. Without this a
//   user typing "Coumadin" instead of "warfarin" gets a false negative.
// This table only flags; it never tells the user to stop or start anything.

const ANTICOAGULANT_ALIASES = [
  'warfarin', 'coumadin', 'jantoven', 'aspirin', 'clopidogrel', 'plavix',
  'apixaban', 'eliquis', 'rivaroxaban', 'xarelto', 'dabigatran', 'pradaxa',
  'antiplatelet', 'blood thinner',
]

const CHELATING_ANTIBIOTIC_ALIASES = [
  'tetracycline', 'doxycycline', 'vibramycin', 'minocycline', 'minocin',
  'ciprofloxacin', 'cipro', 'levofloxacin', 'levaquin', 'moxifloxacin',
  'avelox', 'fluoroquinolone',
]

const GENERAL_ANTIBIOTIC_ALIASES = [
  ...CHELATING_ANTIBIOTIC_ALIASES,
  'antibiotic', 'amoxicillin', 'azithromycin', 'zithromax', 'cephalexin',
  'penicillin', 'clindamycin', 'metronidazole', 'flagyl',
]

const PPI_ALIASES = [
  'ppi', 'proton pump inhibitor', 'acid reducer', 'omeprazole', 'prilosec',
  'esomeprazole', 'nexium', 'lansoprazole', 'prevacid', 'pantoprazole',
  'protonix', 'rabeprazole', 'aciphex',
]

const DIURETIC_ALIASES = [
  'diuretic', 'water pill', 'furosemide', 'lasix', 'hydrochlorothiazide',
  'hctz', 'spironolactone', 'chlorthalidone',
]

const CORTICOSTEROID_ALIASES = [
  'corticosteroid', 'steroid', 'prednisone', 'prednisolone',
  'methylprednisolone', 'medrol', 'dexamethasone', 'cortisone', 'hydrocortisone',
]

const STATIN_ALIASES = [
  'statin', 'atorvastatin', 'lipitor', 'simvastatin', 'zocor', 'rosuvastatin',
  'crestor', 'pravastatin', 'pravachol', 'lovastatin', 'fluvastatin', 'pitavastatin',
]

const BIRTH_CONTROL_ALIASES = [
  'birth control', 'oral contraceptive', 'contraceptive', 'estrogen',
  'ethinyl estradiol', 'yaz', 'yasmin', 'nuvaring', 'xulane', 'the pill',
]

const DIABETES_MED_ALIASES = [
  'insulin', 'metformin', 'glucophage', 'glipizide', 'glyburide',
  'diabetes medication', 'sulfonylurea',
]

const SSRI_ALIASES = [
  'sertraline', 'zoloft', 'fluoxetine', 'prozac', 'escitalopram', 'lexapro',
  'paroxetine', 'paxil', 'citalopram', 'celexa', 'ssri', 'antidepressant',
]

const SEDATIVE_ALIASES = [
  'benzodiazepine', 'diazepam', 'valium', 'alprazolam', 'xanax', 'lorazepam',
  'ativan', 'zolpidem', 'ambien', 'clonazepam', 'klonopin', 'temazepam',
  'restoril', 'sleep aid', 'sedative',
]

const PRESCRIPTION_LITHIUM_ALIASES = [
  'lithium', 'lithium carbonate', 'lithobid', 'eskalith', 'lithium citrate', 'mood stabilizer',
]

const BLOOD_PRESSURE_MED_ALIASES = [
  'blood pressure medication', 'antihypertensive', 'lisinopril', 'enalapril', 'ramipril',
  'losartan', 'valsartan', 'ace inhibitor', 'arb', 'angiotensin receptor blocker',
  'amlodipine', 'metoprolol', 'atenolol', 'beta blocker', 'calcium channel blocker',
]

const ACE_ARB_ALIASES = [
  'lisinopril', 'enalapril', 'ramipril', 'ace inhibitor', 'losartan', 'valsartan',
  'arb', 'angiotensin receptor blocker',
]

const PDE5_INHIBITOR_ALIASES = [
  'sildenafil', 'viagra', 'tadalafil', 'cialis', 'vardenafil', 'levitra', 'pde5 inhibitor',
]

const NITRATE_ALIASES = [
  'nitroglycerin', 'nitrostat', 'isosorbide', 'imdur', 'isordil', 'nitrate',
]

export const interactions = [
  {
    id: 'vitk-warfarin',
    supplementId: 'vitamin-k',
    interactsWith: { type: 'medication', name: 'Warfarin (blood thinner)', aliases: ['warfarin', 'coumadin', 'jantoven'] },
    severity: 'danger',
    action: 'monitor',
    description:
      'Vitamin K can reduce the effectiveness of warfarin because the two work through opposing pathways in blood clotting.',
    recommendation:
      'Keep vitamin K intake consistent day to day and discuss any supplement changes with the prescribing doctor.',
    sourceCitation: 'NIH ODS Vitamin K Fact Sheet — Health Professional',
  },
  {
    id: 'calcium-abx',
    supplementId: 'calcium',
    interactsWith: { type: 'medication', name: 'Certain antibiotics (tetracyclines, fluoroquinolones)', aliases: CHELATING_ANTIBIOTIC_ALIASES },
    severity: 'caution',
    action: 'adjust_timing',
    description:
      'Calcium can bind to these antibiotics in the gut and reduce how much the body absorbs.',
    recommendation:
      'Spacing doses several hours apart is a common approach — confirm timing with a pharmacist.',
    sourceCitation: 'NIH ODS Calcium Fact Sheet — Health Professional',
  },
  {
    id: 'iron-levothyroxine',
    supplementId: 'iron',
    interactsWith: { type: 'medication', name: 'Levothyroxine (thyroid medication)', aliases: ['levothyroxine', 'synthroid', 'levoxyl', 'tirosint', 'unithroid', 'thyroid'] },
    severity: 'caution',
    action: 'adjust_timing',
    description:
      'Iron supplements can reduce absorption of levothyroxine if taken too close together.',
    recommendation:
      'Many clinicians suggest separating doses by at least 4 hours — confirm with the prescribing doctor.',
    sourceCitation: 'NIH ODS Iron Fact Sheet — Health Professional',
  },
  {
    id: 'iron-abx',
    supplementId: 'iron',
    interactsWith: { type: 'medication', name: 'Certain antibiotics (tetracyclines, fluoroquinolones)', aliases: CHELATING_ANTIBIOTIC_ALIASES },
    severity: 'caution',
    action: 'adjust_timing',
    description:
      'Iron can bind to these antibiotics in the gut and reduce how much the body absorbs of both — one of the more clinically significant chelation interactions in this cluster.',
    recommendation:
      'Spacing doses several hours apart is commonly recommended — confirm timing with a pharmacist.',
    sourceCitation: 'NIH ODS Iron Fact Sheet — Health Professional',
  },
  {
    id: 'magnesium-abx',
    supplementId: 'magnesium',
    interactsWith: { type: 'medication', name: 'Certain antibiotics (tetracyclines, fluoroquinolones)', aliases: CHELATING_ANTIBIOTIC_ALIASES },
    severity: 'caution',
    action: 'adjust_timing',
    description:
      'Magnesium can bind to these antibiotics in the gut, similar to calcium, reducing absorption of both.',
    recommendation: 'Spacing doses apart is commonly recommended — confirm timing with a pharmacist.',
    sourceCitation: 'NIH ODS Magnesium Fact Sheet — Health Professional',
  },
  {
    id: 'zinc-abx',
    supplementId: 'zinc',
    interactsWith: { type: 'medication', name: 'Certain antibiotics (tetracyclines, fluoroquinolones)', aliases: CHELATING_ANTIBIOTIC_ALIASES },
    severity: 'caution',
    action: 'adjust_timing',
    description:
      'Zinc can bind to these antibiotics in the gut, similar to calcium and magnesium, reducing absorption of both.',
    recommendation: 'Spacing doses several hours apart is commonly recommended — confirm timing with a pharmacist.',
    sourceCitation: 'NIH ODS Zinc Fact Sheet — Health Professional',
  },
  {
    id: 'omega3-blood-thinners',
    supplementId: 'omega-3',
    interactsWith: { type: 'medication', name: 'Blood thinners / antiplatelet drugs (warfarin, aspirin, clopidogrel)', aliases: ANTICOAGULANT_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description:
      'High-dose omega-3 supplements may add to the blood-thinning effect of these medications, raising bleeding risk.',
    recommendation: 'This combination is worth flagging to the prescribing doctor, especially before surgery.',
    sourceCitation: 'NIH ODS Omega-3 Fatty Acids Fact Sheet — Health Professional',
  },
  {
    id: 'calcium-iron',
    supplementId: 'calcium',
    interactsWith: { type: 'supplement', name: 'Iron', id: 'iron' },
    severity: 'caution',
    action: 'adjust_timing',
    description: 'Calcium and iron compete for absorption when taken at the same time.',
    recommendation: 'Taking them at different times of day is a common approach to maximize absorption of both.',
    sourceCitation: 'NIH ODS Iron Fact Sheet — Health Professional',
  },
  {
    id: 'sjw-ssri',
    supplementId: 'st-johns-wort',
    interactsWith: { type: 'medication', name: 'SSRIs / antidepressants (e.g., sertraline, fluoxetine, escitalopram)', aliases: SSRI_ALIASES },
    severity: 'danger',
    action: 'avoid_combination',
    description:
      "St. John's Wort can affect serotonin levels; combined with SSRIs it may raise the risk of serotonin syndrome.",
    recommendation: 'This combination is generally discouraged — talk to the prescribing doctor before combining them.',
    sourceCitation: "NIH NCCIH St. John's Wort Fact Sheet",
  },
  {
    id: 'sjw-birth-control',
    supplementId: 'st-johns-wort',
    interactsWith: { type: 'medication', name: 'Hormonal birth control (pills, patch, ring)', aliases: BIRTH_CONTROL_ALIASES },
    severity: 'danger',
    action: 'avoid_combination',
    description:
      "St. John's Wort can speed up the breakdown of estrogen-based birth control, reducing its effectiveness and increasing breakthrough-bleeding risk.",
    recommendation: 'Discuss backup contraception with a doctor or pharmacist before combining these.',
    sourceCitation: "NIH NCCIH St. John's Wort Fact Sheet",
  },
  {
    id: 'sjw-many-meds',
    supplementId: 'st-johns-wort',
    interactsWith: { type: 'medication', name: 'Many prescription medicines (including warfarin and immunosuppressants)', aliases: ['warfarin', 'coumadin', 'cyclosporine', 'tacrolimus', 'prograf', 'immunosuppressant'] },
    severity: 'danger',
    action: 'avoid_combination',
    description:
      "St. John's Wort induces liver enzymes that break down many prescription medicines faster, which can make them less effective.",
    recommendation: 'Because this herb interacts with a very wide range of medications, review your full medication list with a pharmacist before starting it.',
    sourceCitation: "NIH NCCIH St. John's Wort Fact Sheet",
  },
  {
    id: 'ginkgo-blood-thinners',
    supplementId: 'ginkgo',
    interactsWith: { type: 'medication', name: 'Blood thinners / antiplatelet drugs (warfarin, aspirin, clopidogrel)', aliases: ANTICOAGULANT_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Ginkgo may add to the blood-thinning effect of these medications, raising bleeding risk.',
    recommendation: 'Flag this combination to the prescribing doctor, especially before any surgery or dental procedure.',
    sourceCitation: 'NIH NCCIH Ginkgo Fact Sheet',
  },
  {
    id: 'garlic-blood-thinners',
    supplementId: 'garlic',
    interactsWith: { type: 'medication', name: 'Blood thinners / antiplatelet drugs (warfarin, aspirin, clopidogrel)', aliases: ANTICOAGULANT_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Garlic supplements may add to the blood-thinning effect of these medications, raising bleeding risk.',
    recommendation: 'Flag this combination to the prescribing doctor, especially before any surgery or dental procedure.',
    sourceCitation: 'NIH NCCIH Garlic Fact Sheet',
  },
  {
    id: 'turmeric-blood-thinners',
    supplementId: 'turmeric',
    interactsWith: { type: 'medication', name: 'Blood thinners / antiplatelet drugs (warfarin, aspirin, clopidogrel)', aliases: ANTICOAGULANT_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'High-dose turmeric/curcumin may add to the blood-thinning effect of these medications, raising bleeding risk.',
    recommendation: 'Flag this combination to the prescribing doctor, especially before any surgery or dental procedure.',
    sourceCitation: 'NIH NCCIH Turmeric Fact Sheet',
  },
  {
    id: 'melatonin-sedatives',
    supplementId: 'melatonin',
    interactsWith: { type: 'medication', name: 'Sedatives / CNS depressants (benzodiazepines, sleep aids)', aliases: SEDATIVE_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Combining melatonin with sedating medications may increase drowsiness and impair alertness.',
    recommendation: 'Use caution with driving or operating machinery, and mention the combination to your prescriber.',
    sourceCitation: 'NIH NCCIH Melatonin Fact Sheet',
  },
  {
    id: 'ginkgo-garlic',
    supplementId: 'ginkgo',
    interactsWith: { type: 'supplement', name: 'Garlic', id: 'garlic' },
    severity: 'caution',
    action: 'monitor',
    description: 'Both ginkgo and garlic can increase bleeding risk on their own; combining them may add to that effect.',
    recommendation: 'Mention both to your doctor, especially if you also take a blood thinner or have surgery coming up.',
    sourceCitation: 'NIH NCCIH Ginkgo Fact Sheet',
  },
  {
    id: 'omega3-ginkgo',
    supplementId: 'omega-3',
    interactsWith: { type: 'supplement', name: 'Ginkgo', id: 'ginkgo' },
    severity: 'caution',
    action: 'monitor',
    description: 'Omega-3 and ginkgo can both increase bleeding risk; combining them may add to that effect.',
    recommendation: 'Worth flagging to a doctor before surgery or if you bruise or bleed easily.',
    sourceCitation: 'NIH ODS Omega-3 Fatty Acids Fact Sheet',
  },
  {
    id: 'omega3-garlic',
    supplementId: 'omega-3',
    interactsWith: { type: 'supplement', name: 'Garlic', id: 'garlic' },
    severity: 'caution',
    action: 'monitor',
    description: 'Omega-3 and garlic can both increase bleeding risk; combining them may add to that effect.',
    recommendation: 'Worth flagging to a doctor before surgery or if you bruise or bleed easily.',
    sourceCitation: 'NIH ODS Omega-3 Fatty Acids Fact Sheet',
  },

  // Drug-induced nutrient depletion (DIND): long-term medication use lowering
  // a nutrient over time, distinct from the acute absorption/combination
  // risks above. mechanism: 'depletion' changes how these render in the UI.
  {
    id: 'statin-coq10-depletion',
    supplementId: 'coq10',
    interactsWith: { type: 'medication', name: 'Statins (cholesterol medications)', aliases: STATIN_ALIASES },
    severity: 'caution',
    action: 'monitor',
    mechanism: 'depletion',
    description: 'Statins can lower CoQ10 levels in the body. Evidence on whether supplementing prevents statin-related muscle aches is mixed, but it\'s a common clinical question.',
    recommendation: 'If you\'re on a statin and experience muscle aches, ask your doctor whether checking CoQ10 status or trying supplementation makes sense for you.',
    sourceCitation: 'NIH ODS Coenzyme Q10 Fact Sheet — Health Professional',
  },
  {
    id: 'ppi-b12-depletion',
    supplementId: 'vitamin-b12',
    interactsWith: { type: 'medication', name: 'PPIs / acid reducers (omeprazole, esomeprazole, and similar)', aliases: PPI_ALIASES },
    severity: 'caution',
    action: 'monitor',
    mechanism: 'depletion',
    description: 'Long-term use of proton pump inhibitors reduces stomach acid, which can lower B12 absorption over time.',
    recommendation: 'If you\'ve been on a PPI long-term, ask your doctor about checking your B12 levels periodically.',
    sourceCitation: 'NIH ODS Vitamin B12 Fact Sheet — Health Professional',
  },
  {
    id: 'ppi-magnesium-depletion',
    supplementId: 'magnesium',
    interactsWith: { type: 'medication', name: 'PPIs / acid reducers (omeprazole, esomeprazole, and similar)', aliases: PPI_ALIASES },
    severity: 'caution',
    action: 'monitor',
    mechanism: 'depletion',
    description: 'The FDA has noted that long-term PPI use (typically a year or more) can lower magnesium levels in some people.',
    recommendation: 'If you\'ve been on a PPI long-term, ask your doctor about checking your magnesium levels periodically.',
    sourceCitation: 'FDA Drug Safety Communication — Low Magnesium with PPI Use',
  },
  {
    id: 'metformin-b12-depletion',
    supplementId: 'vitamin-b12',
    interactsWith: { type: 'medication', name: 'Metformin', aliases: ['metformin', 'glucophage'] },
    severity: 'caution',
    action: 'monitor',
    mechanism: 'depletion',
    description: 'Long-term metformin use is a well-documented cause of reduced B12 absorption.',
    recommendation: 'Many clinicians recommend periodic B12 level checks for people on metformin long-term.',
    sourceCitation: 'NIH ODS Vitamin B12 Fact Sheet — Health Professional',
  },
  {
    id: 'diuretic-magnesium-depletion',
    supplementId: 'magnesium',
    interactsWith: { type: 'medication', name: 'Diuretics ("water pills")', aliases: DIURETIC_ALIASES },
    severity: 'caution',
    action: 'monitor',
    mechanism: 'depletion',
    description: 'Certain diuretics increase how much magnesium and other minerals are lost in urine.',
    recommendation: 'Ask your doctor whether your diuretic type warrants periodic mineral level checks.',
    sourceCitation: 'NIH ODS Magnesium Fact Sheet — Health Professional',
  },
  {
    id: 'corticosteroid-calcium-depletion',
    supplementId: 'calcium',
    interactsWith: { type: 'medication', name: 'Corticosteroids (prednisone and similar)', aliases: CORTICOSTEROID_ALIASES },
    severity: 'caution',
    action: 'monitor',
    mechanism: 'depletion',
    description: 'Long-term corticosteroid use can reduce calcium absorption and increase bone loss over time.',
    recommendation: 'Long-term steroid use often comes with a bone-health monitoring plan — ask your doctor if calcium and vitamin D status should be checked.',
    sourceCitation: 'NIH ODS Calcium Fact Sheet — Health Professional',
  },
  {
    id: 'birth-control-folate-depletion',
    supplementId: 'folate',
    interactsWith: { type: 'medication', name: 'Hormonal birth control (pills, patch, ring)', aliases: BIRTH_CONTROL_ALIASES },
    severity: 'caution',
    action: 'monitor',
    mechanism: 'depletion',
    description: 'Hormonal birth control can lower folate levels over time.',
    recommendation: 'This is worth knowing especially if you\'re planning to stop birth control to try to conceive — ask your doctor about folate status.',
    sourceCitation: 'NIH ODS Folate Fact Sheet — Health Professional',
  },

  // Ashwagandha
  {
    id: 'ashwagandha-thyroid',
    supplementId: 'ashwagandha',
    interactsWith: { type: 'medication', name: 'Thyroid medications (levothyroxine and similar)', aliases: ['levothyroxine', 'synthroid', 'levoxyl', 'tirosint', 'unithroid', 'thyroid'] },
    severity: 'caution',
    action: 'monitor',
    description: 'Ashwagandha may raise thyroid hormone levels, which could add to or interact with thyroid medication effects.',
    recommendation: 'If you have a thyroid condition, discuss ashwagandha use with the prescribing doctor and consider periodic thyroid level checks.',
    sourceCitation: 'NIH NCCIH Ashwagandha reference',
  },
  {
    id: 'ashwagandha-sedatives',
    supplementId: 'ashwagandha',
    interactsWith: { type: 'medication', name: 'Sedatives / CNS depressants (benzodiazepines, sleep aids)', aliases: SEDATIVE_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Ashwagandha may add to the drowsiness caused by sedating medications.',
    recommendation: 'Use caution combining these, especially with driving or operating machinery.',
    sourceCitation: 'NIH NCCIH Ashwagandha reference',
  },
  {
    id: 'ashwagandha-immunosuppressants',
    supplementId: 'ashwagandha',
    interactsWith: { type: 'medication', name: 'Immunosuppressants', aliases: ['immunosuppressant', 'cyclosporine', 'tacrolimus', 'prograf', 'methotrexate'] },
    severity: 'danger',
    action: 'avoid_combination',
    description: 'Ashwagandha may stimulate immune activity, which could work against the intended effect of immunosuppressant medications.',
    recommendation: 'If you take an immunosuppressant (for an autoimmune condition or organ transplant), talk to the prescribing doctor before using ashwagandha.',
    sourceCitation: 'NIH NCCIH Ashwagandha reference',
  },
  {
    id: 'ashwagandha-diabetes-meds',
    supplementId: 'ashwagandha',
    interactsWith: { type: 'medication', name: 'Diabetes medications (insulin, metformin, and similar)', aliases: DIABETES_MED_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Ashwagandha may lower blood sugar, which could add to the effect of diabetes medications and raise the risk of low blood sugar.',
    recommendation: 'Monitor blood sugar closely if combining, and discuss with the prescribing doctor.',
    sourceCitation: 'NIH NCCIH Ashwagandha reference',
  },

  // Berberine
  {
    id: 'berberine-diabetes-meds',
    supplementId: 'berberine',
    interactsWith: { type: 'medication', name: 'Diabetes medications (insulin, metformin, and similar)', aliases: DIABETES_MED_ALIASES },
    severity: 'danger',
    action: 'monitor',
    description: 'Berberine lowers blood sugar and may add to the effect of diabetes medications, raising the risk of hypoglycemia.',
    recommendation: 'Monitor blood sugar closely if combining, and talk to the prescribing doctor before starting.',
    sourceCitation: 'NIH NCCIH Berberine reference',
  },
  {
    id: 'berberine-cyp450',
    supplementId: 'berberine',
    interactsWith: { type: 'medication', name: 'Many prescription medicines metabolized by the liver (CYP450 pathway)', aliases: [...STATIN_ALIASES, 'cyclosporine', ...ANTICOAGULANT_ALIASES] },
    severity: 'caution',
    action: 'monitor',
    description: 'Berberine affects liver enzymes that metabolize many prescription drugs, which can change how much of those drugs stays active in the body.',
    recommendation: 'Because this affects a broad range of medications, review your full medication list with a pharmacist before starting berberine.',
    sourceCitation: 'NIH NCCIH Berberine reference',
  },

  // 5-HTP
  {
    id: '5htp-ssri',
    supplementId: '5-htp',
    interactsWith: { type: 'medication', name: 'SSRIs / antidepressants (e.g., sertraline, fluoxetine, escitalopram)', aliases: SSRI_ALIASES },
    severity: 'danger',
    action: 'avoid_combination',
    description: '5-HTP is a direct serotonin precursor. Combined with SSRIs or other serotonergic medications, it raises the risk of serotonin syndrome, a potentially serious condition.',
    recommendation: 'This combination is generally discouraged without direct medical supervision — talk to the prescribing doctor before combining them.',
    sourceCitation: 'NIH NCCIH 5-HTP reference',
  },
  {
    id: '5htp-maoi',
    supplementId: '5-htp',
    interactsWith: { type: 'medication', name: 'MAOIs (monoamine oxidase inhibitor antidepressants)', aliases: ['maoi', 'phenelzine', 'nardil', 'tranylcypromine', 'parnate', 'selegiline', 'emsam', 'isocarboxazid', 'marplan'] },
    severity: 'danger',
    action: 'avoid_combination',
    description: 'Combining 5-HTP with MAOIs carries a serious risk of serotonin syndrome.',
    recommendation: 'This combination should be avoided — talk to the prescribing doctor.',
    sourceCitation: 'NIH NCCIH 5-HTP reference',
  },
  {
    id: '5htp-sjw',
    supplementId: '5-htp',
    interactsWith: { type: 'supplement', name: "St. John's Wort", id: 'st-johns-wort' },
    severity: 'danger',
    action: 'avoid_combination',
    description: "Both 5-HTP and St. John's Wort affect serotonin activity; combining them raises the risk of serotonin syndrome.",
    recommendation: 'Avoid combining these without direct medical supervision.',
    sourceCitation: 'NIH NCCIH 5-HTP reference',
  },

  // BCAAs
  {
    id: 'bcaa-diabetes-meds',
    supplementId: 'bcaa',
    interactsWith: { type: 'medication', name: 'Diabetes medications (insulin, metformin, and similar)', aliases: DIABETES_MED_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Some research links BCAA intake to changes in insulin sensitivity and blood sugar. The evidence is mixed, but it\'s worth monitoring if you take diabetes medication.',
    recommendation: 'Monitor blood sugar if combining, and mention BCAA use to the prescribing doctor.',
    sourceCitation: 'NIH ODS Protein and Amino Acids reference',
  },

  // Vitamin E
  {
    id: 'vitamine-blood-thinners',
    supplementId: 'vitamin-e',
    interactsWith: { type: 'medication', name: 'Blood thinners / antiplatelet drugs (warfarin, aspirin, clopidogrel)', aliases: ANTICOAGULANT_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'High-dose vitamin E may add to the blood-thinning effect of these medications, raising bleeding risk.',
    recommendation: 'Flag this combination to the prescribing doctor, especially before any surgery or dental procedure.',
    sourceCitation: 'NIH ODS Vitamin E Fact Sheet — Health Professional',
  },

  // Chromium
  {
    id: 'chromium-diabetes-meds',
    supplementId: 'chromium',
    interactsWith: { type: 'medication', name: 'Diabetes medications (insulin, metformin, and similar)', aliases: DIABETES_MED_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Chromium may lower blood sugar and could add to the effect of diabetes medications, raising the risk of hypoglycemia.',
    recommendation: 'Monitor blood sugar closely if combining, and mention chromium use to the prescribing doctor.',
    sourceCitation: 'NIH ODS Chromium Fact Sheet — Health Professional',
  },

  // Probiotics
  {
    id: 'probiotics-antibiotics',
    supplementId: 'probiotics',
    interactsWith: { type: 'medication', name: 'Antibiotics (any class)', aliases: GENERAL_ANTIBIOTIC_ALIASES },
    severity: 'caution',
    action: 'adjust_timing',
    description: 'Antibiotics can kill probiotic organisms along with harmful bacteria, reducing the probiotic\'s effectiveness if taken at the same time.',
    recommendation: 'Taking probiotics a couple of hours apart from antibiotic doses is a common approach to preserve effectiveness.',
    sourceCitation: 'NIH NCCIH Probiotics Fact Sheet',
  },

  // Nutricost-catalog additions
  {
    id: 'fenugreek-diabetes-meds',
    supplementId: 'fenugreek',
    interactsWith: { type: 'medication', name: 'Diabetes medications (insulin, metformin, and similar)', aliases: DIABETES_MED_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Fenugreek may lower blood sugar and could add to the effect of diabetes medications, raising the risk of hypoglycemia.',
    recommendation: 'Monitor blood sugar closely if combining, and mention fenugreek use to the prescribing doctor.',
    sourceCitation: 'NIH MedlinePlus Fenugreek reference',
  },
  {
    id: 'bitter-melon-diabetes-meds',
    supplementId: 'bitter-melon',
    interactsWith: { type: 'medication', name: 'Diabetes medications (insulin, metformin, and similar)', aliases: DIABETES_MED_ALIASES },
    severity: 'danger',
    action: 'monitor',
    description: 'Bitter melon lowers blood sugar and may add to the effect of diabetes medications, raising the risk of hypoglycemia.',
    recommendation: 'Monitor blood sugar closely if combining, and talk to the prescribing doctor before starting.',
    sourceCitation: 'NIH MedlinePlus Bitter Melon reference',
  },
  {
    id: 'vanadium-diabetes-meds',
    supplementId: 'vanadium',
    interactsWith: { type: 'medication', name: 'Diabetes medications (insulin, metformin, and similar)', aliases: DIABETES_MED_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Vanadium may lower blood sugar and could add to the effect of diabetes medications, raising the risk of hypoglycemia.',
    recommendation: 'Monitor blood sugar closely if combining, and mention vanadium use to the prescribing doctor.',
    sourceCitation: 'National Academies Dietary Reference Intakes (DRI) tables',
  },
  {
    id: 'goldenseal-diabetes-meds',
    supplementId: 'goldenseal',
    interactsWith: { type: 'medication', name: 'Diabetes medications (insulin, metformin, and similar)', aliases: DIABETES_MED_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Goldenseal contains berberine, which lowers blood sugar and may add to the effect of diabetes medications.',
    recommendation: 'Monitor blood sugar closely if combining, and mention goldenseal use to the prescribing doctor.',
    sourceCitation: 'NIH NCCIH Goldenseal reference',
  },
  {
    id: 'goldenseal-berberine',
    supplementId: 'goldenseal',
    interactsWith: { type: 'supplement', name: 'Berberine', id: 'berberine' },
    severity: 'caution',
    action: 'monitor',
    description: 'Goldenseal\'s main active compound is berberine, the same compound in the standalone Berberine supplement — combining them effectively double-doses on the same active ingredient.',
    recommendation: 'Avoid taking both at once unless directed by a doctor or pharmacist.',
    sourceCitation: 'NIH NCCIH Goldenseal reference',
  },
  {
    id: 'l-tyrosine-maoi',
    supplementId: 'l-tyrosine',
    interactsWith: { type: 'medication', name: 'MAOIs (monoamine oxidase inhibitor antidepressants)', aliases: ['maoi', 'phenelzine', 'nardil', 'tranylcypromine', 'parnate', 'selegiline', 'emsam', 'isocarboxazid', 'marplan'] },
    severity: 'danger',
    action: 'avoid_combination',
    description: 'L-Tyrosine is a precursor to norepinephrine; combined with MAOIs, it may raise the risk of a dangerous blood pressure spike (hypertensive crisis).',
    recommendation: 'This combination should be avoided — talk to the prescribing doctor.',
    sourceCitation: 'NIH MedlinePlus L-Tyrosine reference',
  },
  {
    id: 'acetyl-l-carnitine-blood-thinners',
    supplementId: 'acetyl-l-carnitine',
    interactsWith: { type: 'medication', name: 'Warfarin (blood thinner)', aliases: ['warfarin', 'coumadin', 'jantoven'] },
    severity: 'caution',
    action: 'monitor',
    description: 'Carnitine may increase the blood-thinning effect of warfarin.',
    recommendation: 'Flag this combination to the prescribing doctor, who may want to monitor INR more closely.',
    sourceCitation: 'NIH MedlinePlus Acetyl-L-Carnitine reference',
  },
  {
    id: 'milk-thistle-cyp450',
    supplementId: 'milk-thistle',
    interactsWith: { type: 'medication', name: 'Many prescription medicines metabolized by the liver (CYP450 pathway)', aliases: [...STATIN_ALIASES, 'cyclosporine', ...ANTICOAGULANT_ALIASES] },
    severity: 'caution',
    action: 'monitor',
    description: 'Milk thistle may affect liver enzymes that metabolize many prescription drugs, which can change how much of those drugs stays active in the body.',
    recommendation: 'Because this affects a broad range of medications, review your full medication list with a pharmacist before starting milk thistle.',
    sourceCitation: 'NIH NCCIH Milk Thistle Fact Sheet',
  },
  {
    id: 'elderberry-immunosuppressants',
    supplementId: 'elderberry',
    interactsWith: { type: 'medication', name: 'Immunosuppressants', aliases: ['immunosuppressant', 'cyclosporine', 'tacrolimus', 'prograf', 'methotrexate'] },
    severity: 'caution',
    action: 'monitor',
    description: 'Elderberry may stimulate immune activity, which could work against the intended effect of immunosuppressant medications.',
    recommendation: 'If you take an immunosuppressant (for an autoimmune condition or organ transplant), talk to the prescribing doctor before using elderberry.',
    sourceCitation: 'NIH MedlinePlus Elderberry reference',
  },
  {
    id: 'echinacea-immunosuppressants',
    supplementId: 'echinacea',
    interactsWith: { type: 'medication', name: 'Immunosuppressants', aliases: ['immunosuppressant', 'cyclosporine', 'tacrolimus', 'prograf', 'methotrexate'] },
    severity: 'caution',
    action: 'monitor',
    description: 'Echinacea may stimulate immune activity, which could work against the intended effect of immunosuppressant medications.',
    recommendation: 'If you take an immunosuppressant (for an autoimmune condition or organ transplant), talk to the prescribing doctor before using echinacea.',
    sourceCitation: 'NIH NCCIH Echinacea Fact Sheet',
  },

  // iHerb-catalog additions
  {
    id: 'ala-diabetes-meds',
    supplementId: 'alpha-lipoic-acid',
    interactsWith: { type: 'medication', name: 'Diabetes medications (insulin, metformin, and similar)', aliases: DIABETES_MED_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Alpha lipoic acid may lower blood sugar and could add to the effect of diabetes medications, raising the risk of hypoglycemia.',
    recommendation: 'Monitor blood sugar closely if combining, and mention alpha lipoic acid use to the prescribing doctor.',
    sourceCitation: 'NIH MedlinePlus Alpha Lipoic Acid reference',
  },
  {
    id: 'resveratrol-blood-thinners',
    supplementId: 'resveratrol',
    interactsWith: { type: 'medication', name: 'Blood thinners / antiplatelet drugs (warfarin, aspirin, clopidogrel)', aliases: ANTICOAGULANT_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'High-dose resveratrol may add to the blood-thinning effect of these medications, raising bleeding risk.',
    recommendation: 'Flag this combination to the prescribing doctor, especially before any surgery or dental procedure.',
    sourceCitation: 'NIH MedlinePlus Resveratrol reference',
  },
  {
    id: 'glucosamine-blood-thinners',
    supplementId: 'glucosamine',
    interactsWith: { type: 'medication', name: 'Blood thinners / antiplatelet drugs (warfarin, aspirin, clopidogrel)', aliases: ANTICOAGULANT_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Glucosamine may add to the blood-thinning effect of these medications, raising bleeding risk.',
    recommendation: 'Flag this combination to the prescribing doctor, who may want to monitor more closely.',
    sourceCitation: 'NIH NCCIH Glucosamine and Chondroitin for Osteoarthritis reference',
  },
  {
    id: 'reishi-blood-thinners',
    supplementId: 'reishi',
    interactsWith: { type: 'medication', name: 'Blood thinners / antiplatelet drugs (warfarin, aspirin, clopidogrel)', aliases: ANTICOAGULANT_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Reishi may add to the blood-thinning effect of these medications, raising bleeding risk.',
    recommendation: 'Flag this combination to the prescribing doctor, especially before any surgery or dental procedure.',
    sourceCitation: 'NIH MedlinePlus Reishi Mushroom reference',
  },
  {
    id: 'lithium-orotate-prescription-lithium',
    supplementId: 'lithium-orotate',
    interactsWith: { type: 'medication', name: 'Prescription lithium (mood stabilizer)', aliases: PRESCRIPTION_LITHIUM_ALIASES },
    severity: 'danger',
    action: 'avoid_combination',
    description: 'Taking an over-the-counter lithium supplement alongside prescription lithium can push blood lithium levels into a dangerous range — prescription lithium already requires careful blood-level monitoring.',
    recommendation: 'Do not combine without your prescribing doctor\'s explicit guidance.',
    sourceCitation: 'NIH MedlinePlus Lithium reference',
  },
  {
    id: 'lithium-orotate-diuretics',
    supplementId: 'lithium-orotate',
    interactsWith: { type: 'medication', name: 'Diuretics ("water pills")', aliases: DIURETIC_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Diuretics can reduce how quickly the kidneys clear lithium, which may let it build up to higher levels than intended — this applies to lithium from any source, including low-dose supplements.',
    recommendation: 'Mention any lithium supplement use to the prescribing doctor if you\'re on a diuretic.',
    sourceCitation: 'NIH MedlinePlus Lithium reference',
  },

  // Audit pass: these supplements' own descriptions already promised a
  // medication check (blood pressure meds, nitrates, thyroid meds) that had
  // no matching formal entry — the check silently never fired. Closing that
  // gap here, plus two additional well-documented interactions found during
  // the audit that weren't flagged anywhere on the affected supplements.
  {
    id: 'potassium-ace-arb',
    supplementId: 'potassium',
    interactsWith: { type: 'medication', name: 'ACE inhibitors, ARBs, or potassium-sparing diuretics', aliases: [...ACE_ARB_ALIASES, 'spironolactone', 'potassium-sparing diuretic'] },
    severity: 'danger',
    action: 'monitor',
    description: 'These medications already raise blood potassium by reducing how much the kidneys excrete — adding a potassium supplement on top can push levels into a dangerous range (hyperkalemia).',
    recommendation: 'Do not take a potassium supplement on these medications without your doctor\'s explicit guidance and blood monitoring.',
    sourceCitation: 'NIH ODS Potassium Fact Sheet — Health Professional',
  },
  {
    id: 'beet-root-blood-pressure-meds',
    supplementId: 'beet-root',
    interactsWith: { type: 'medication', name: 'Blood pressure medications', aliases: BLOOD_PRESSURE_MED_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Beet root\'s nitrate content can add to the blood-pressure-lowering effect of these medications.',
    recommendation: 'Monitor for lightheadedness, and mention beet root use to the prescribing doctor.',
    sourceCitation: 'NIH MedlinePlus Beetroot reference',
  },
  {
    id: 'l-citrulline-blood-pressure-meds',
    supplementId: 'l-citrulline',
    interactsWith: { type: 'medication', name: 'Blood pressure medications', aliases: BLOOD_PRESSURE_MED_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Citrulline converts to nitric oxide in the body and can add to the blood-pressure-lowering effect of these medications.',
    recommendation: 'Monitor for lightheadedness, and mention citrulline use to the prescribing doctor.',
    sourceCitation: 'NIH MedlinePlus Citrulline reference',
  },
  {
    id: 'l-citrulline-pde5',
    supplementId: 'l-citrulline',
    interactsWith: { type: 'medication', name: 'PDE5 inhibitors (sildenafil, tadalafil)', aliases: PDE5_INHIBITOR_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Both citrulline and PDE5 inhibitors work through nitric oxide pathways — combining them can add to blood-pressure-lowering effects.',
    recommendation: 'Monitor for lightheadedness, and mention citrulline use to the prescribing doctor.',
    sourceCitation: 'NIH MedlinePlus Citrulline reference',
  },
  {
    id: 'l-arginine-blood-pressure-meds',
    supplementId: 'l-arginine',
    interactsWith: { type: 'medication', name: 'Blood pressure medications', aliases: BLOOD_PRESSURE_MED_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Arginine converts to nitric oxide in the body and can add to the blood-pressure-lowering effect of these medications.',
    recommendation: 'Monitor for lightheadedness, and mention arginine use to the prescribing doctor.',
    sourceCitation: 'NIH MedlinePlus L-Arginine reference',
  },
  {
    id: 'l-arginine-pde5',
    supplementId: 'l-arginine',
    interactsWith: { type: 'medication', name: 'PDE5 inhibitors (sildenafil, tadalafil)', aliases: PDE5_INHIBITOR_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Both arginine and PDE5 inhibitors work through nitric oxide pathways — combining them can add to blood-pressure-lowering effects.',
    recommendation: 'Monitor for lightheadedness, and mention arginine use to the prescribing doctor.',
    sourceCitation: 'NIH MedlinePlus L-Arginine reference',
  },
  {
    id: 'l-theanine-blood-pressure-meds',
    supplementId: 'l-theanine',
    interactsWith: { type: 'medication', name: 'Blood pressure medications', aliases: BLOOD_PRESSURE_MED_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'L-Theanine may add to the blood-pressure-lowering effect of these medications.',
    recommendation: 'Monitor for lightheadedness, and mention L-theanine use to the prescribing doctor.',
    sourceCitation: 'NIH MedlinePlus L-Theanine reference',
  },
  {
    id: 'nac-nitrates',
    supplementId: 'nac',
    interactsWith: { type: 'medication', name: 'Nitrate medications (nitroglycerin and similar)', aliases: NITRATE_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'NAC may add to the blood-vessel-dilating effect of nitrate medications, which can cause a drop in blood pressure and headache.',
    recommendation: 'Mention NAC use to the prescribing doctor if you take a nitrate medication.',
    sourceCitation: 'NIH MedlinePlus N-Acetyl Cysteine reference',
  },
  {
    id: 'reishi-blood-pressure-meds',
    supplementId: 'reishi',
    interactsWith: { type: 'medication', name: 'Blood pressure medications', aliases: BLOOD_PRESSURE_MED_ALIASES },
    severity: 'caution',
    action: 'monitor',
    description: 'Reishi may add to the blood-pressure-lowering effect of these medications.',
    recommendation: 'Monitor for lightheadedness, and mention reishi use to the prescribing doctor.',
    sourceCitation: 'NIH MedlinePlus Reishi Mushroom reference',
  },
  {
    id: 'l-tyrosine-thyroid-meds',
    supplementId: 'l-tyrosine',
    interactsWith: { type: 'medication', name: 'Thyroid medications (levothyroxine and similar)', aliases: ['levothyroxine', 'synthroid', 'levoxyl', 'tirosint', 'unithroid', 'thyroid'] },
    severity: 'caution',
    action: 'monitor',
    description: 'Tyrosine is a building block for thyroid hormone and may affect thyroid medication levels.',
    recommendation: 'If you have a thyroid condition, discuss tyrosine use with the prescribing doctor.',
    sourceCitation: 'NIH MedlinePlus L-Tyrosine reference',
  },
  {
    id: 'niacin-statins',
    supplementId: 'niacin',
    interactsWith: { type: 'medication', name: 'Statins (cholesterol medications)', aliases: STATIN_ALIASES },
    severity: 'danger',
    action: 'monitor',
    description: 'High-dose niacin combined with a statin raises the risk of myopathy (muscle breakdown) — a well-documented interaction studied in major cholesterol trials.',
    recommendation: 'Don\'t combine high-dose niacin with a statin without your doctor\'s guidance and monitoring.',
    sourceCitation: 'NIH ODS Niacin Fact Sheet — Health Professional',
  },
  {
    id: 'iodine-thyroid-meds',
    supplementId: 'iodine',
    interactsWith: { type: 'medication', name: 'Thyroid medications (levothyroxine and similar)', aliases: ['levothyroxine', 'synthroid', 'levoxyl', 'tirosint', 'unithroid', 'thyroid'] },
    severity: 'caution',
    action: 'monitor',
    description: 'Extra iodine can shift thyroid hormone production, which may change how well thyroid medication is dosed.',
    recommendation: 'If you take thyroid medication, talk to your doctor before adding an iodine supplement, especially a high-dose or kelp-based one.',
    sourceCitation: 'NIH ODS Iodine Fact Sheet — Health Professional',
  },
]
