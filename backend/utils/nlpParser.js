/**
 * Multi-Lingual Smart NLP Parser for Grocery Shop Voice Assistant.
 * Highly robust support for:
 * - English & Spoken Tanglish (Tamil-English code-switching)
 * - Tamil (தமிழ் - Tamil script)
 * - Hindi (हिंदी - Devanagari script & Hinglish)
 */

// 1. Normalizes glyph digits across Indian scripts (Devanagari, Tamil) to Arabic 0-9
function normalizeIndianGlyphs(str) {
  if (!str) return '';
  const indianDigits = {
    // Devanagari (Hindi)
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
    // Tamil
    '௧': '1', '௨': '2', '௩': '3', '௪': '4', '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9', '௦': '0'
  };
  return str.replace(/[०-९௧-௯]/g, d => indianDigits[d] || d);
}

// 2. Normalizes spoken numbers in Tanglish, Tamil script, Hindi, and English (sorted by length descending)
const SPOKEN_NUMBERS = [
  { words: ['pathaayiram', 'பத்தாயிரம்', 'दस हजार'], val: 10000 },
  { words: ['anchaayiram', 'aindhaayiram', 'ஐந்தாயிரம்', 'அஞ்சாயிரம்', 'पांच हजार'], val: 5000 },
  { words: ['naalaayiram', 'நாலாயிரம்', 'चार हजार'], val: 4000 },
  { words: ['moonaayiram', 'மூவாயிரம்', 'तीन हजार'], val: 3000 },
  { words: ['rendaayiram', 'irandaayiram', 'இரண்டாயிரம்', 'ரெண்டாயிரம்', 'दो हजार'], val: 2000 },
  { words: ['aayiram', 'ஆயிரம்', 'हजार', 'thousand'], val: 1000 },
  { words: ['thollaayiram', 'தொள்ளாயிரம்', 'नौ सौ'], val: 900 },
  { words: ['ennanooru', 'ennurooru', 'எண்ணூறு', 'आठ सौ'], val: 800 },
  { words: ['ezhanooru', 'ezhunooru', 'எழுநூறு', 'सात सौ'], val: 700 },
  { words: ['aaranuru', 'aaranooru', 'aanooru', 'அறுநூறு', 'छह सौ'], val: 600 },
  { words: ['ainnooru', 'ainooru', 'annooru', 'ஐந்நூறு', 'அந்நூறு', 'पाँच सौ', 'पांच सौ'], val: 500 },
  { words: ['naanooru', 'நானூறு', 'चार सौ'], val: 400 },
  { words: ['munnooru', 'முந்நூறு', 'तीन सौ'], val: 300 },
  { words: ['irunooru', 'இருநூறு', 'दो सौ'], val: 200 },
  { words: ['nooru', 'நூறு', 'सौ', 'hundred'], val: 100 },
  { words: ['thonnooru', 'தொண்ணூறு', 'नब्बे'], val: 90 },
  { words: ['enbavadhu', 'embadhu', 'எண்பது', 'अस्सी'], val: 80 },
  { words: ['ezhuvadhu', 'ezhuvathu', 'எழுபது', 'सत्तर'], val: 70 },
  { words: ['aruvadhu', 'aruvathu', 'arubadhu', 'அறுபது', 'साठ'], val: 60 },
  { words: ['aimbadhu', 'aimbathu', 'ambadhu', 'ambathu', 'ஐம்பது', 'அம்பது', 'पचास', 'fifty'], val: 50 },
  { words: ['naappadhu', 'naarpadhu', 'naapathu', 'நாற்பது', 'चालीस', 'forty'], val: 40 },
  { words: ['muppadhu', 'muppathu', 'முப்பது', 'तीस', 'thirty'], val: 30 },
  { words: ['irubathi anju', 'iruvathi anju', 'இருபத்தைந்து', 'இருபத்தஞ்சு', 'पच्चीस', 'twenty five'], val: 25 },
  { words: ['iruvadhu', 'iruvathu', 'irubadhu', 'irubathu', 'இருபது', 'बीस', 'twenty'], val: 20 },
  { words: ['pathombadhu', 'pathombathu', 'பத்தொன்பது', 'उन्नीस'], val: 19 },
  { words: ['padhinettu', 'pathinettu', 'பதினெட்டு', 'अट्ठारह'], val: 18 },
  { words: ['padhinezhu', 'pathinezhu', 'பதினேழு', 'सत्रह'], val: 17 },
  { words: ['padhinaaru', 'pathinaaru', 'பதினாறு', 'सोलह'], val: 16 },
  { words: ['padhinanju', 'pathinanju', 'padhinainthu', 'பதினைந்து', 'பதினஞ்சு', 'पंद्रह'], val: 15 },
  { words: ['padhinaalu', 'pathinaalu', 'பதினான்கு', 'பதினாலு', 'चौदह'], val: 14 },
  { words: ['padhimoonu', 'pathimoonu', 'பதின்மூன்று', 'பதின்மூணு', 'तेरह'], val: 13 },
  { words: ['panirendu', 'pannirendu', 'பன்னிரண்டு', 'பன்னிரெண்டு', 'बारह'], val: 12 },
  { words: ['padhinonnu', 'pathinonnu', 'பதினொன்று', 'பதினொன்னு', 'ग्यारह'], val: 11 },
  { words: ['pathu', 'பத்து', 'दस', 'ten'], val: 10 },
  { words: ['ombadhu', 'ombathu', 'onpadhu', 'onpathu', 'ஒன்பது', 'नौ', 'nine'], val: 9 },
  { words: ['ettu', 'எட்டு', 'आठ', 'eight'], val: 8 },
  { words: ['ezhu', 'yelu', 'elu', 'ஏழு', 'सात', 'seven'], val: 7 },
  { words: ['aaru', 'ஆறு', 'छह', 'six'], val: 6 },
  { words: ['anju', 'aindhu', 'ainthu', 'anja', 'ஐந்து', 'அஞ்சு', 'पाँच', 'पांच', 'five'], val: 5 },
  { words: ['naalu', 'naangu', 'நான்கு', 'நாலு', 'चार', 'four'], val: 4 },
  { words: ['moonu', 'moondru', 'மூன்று', 'மூணு', 'तीन', 'three'], val: 3 },
  { words: ['rendu', 'erandu', 'irandu', 'இரண்டு', 'ரெண்டு', 'दो', 'two'], val: 2 },
  { words: ['onnu', 'oru', 'ondru', 'ஒன்று', 'ஒரு', 'ஒன்னு', 'एक', 'one'], val: 1 },
  { words: ['mukkal', 'முக்கால்', 'पौने'], val: 0.75 },
  { words: ['arai', 'ara', 'அரை', 'आधा', 'half'], val: 0.5 },
  { words: ['kaal', 'கால்', 'पाव', 'quarter'], val: 0.25 }
];

function normalizeSpokenNumbers(text) {
  let res = ' ' + text + ' ';
  for (const item of SPOKEN_NUMBERS) {
    for (const w of item.words) {
      const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use Unicode letters + marks boundary to avoid partial replacements
      const regex = new RegExp(`(^|[^\\p{L}\\p{M}\\p{N}])${escaped}([^\\p{L}\\p{M}\\p{N}]|$)`, 'giu');
      res = res.replace(regex, `$1${item.val}$2`);
    }
  }
  return res.trim();
}

// Bounded word matching across Latin, Indic scripts with combining marks
function hasWord(text, word) {
  if (!text || !word) return false;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^\\p{L}\\p{M}\\p{N}])${escaped}([^\\p{L}\\p{M}\\p{N}]|$)`, 'iu');
  return regex.test(text);
}

// 3. Comprehensive multi-lingual alias dictionary for grocery items
const PRODUCT_MAP = [
  {
    canonical: 'Toor Dal',
    aliases: [
      'toor dal', 'toor dhal', 'thuvaram paruppu', 'thooram paruppu', 'thoor dal', 'tuvaram paruppu',
      'துவரம் பருப்பு', 'துவரம்பருப்பு', 'தூர் தால்', 'arhar dal',
      'तूर दाल', 'तुअर दाल', 'अरहर दाल'
    ]
  },
  {
    canonical: 'Urad Dal',
    aliases: [
      'urad dal', 'urad dhal', 'ulunthu', 'ulundhu', 'uluntham paruppu', 'ulundham paruppu', 'vellai ulunthu', 'karuppu ulunthu', 'urad',
      'உளுந்து பருப்பு', 'உளுந்து', 'உளுந்தம் பருப்பு', 'உளுந்தம்பருப்பு', 'உளுந்துப் பருப்பு',
      'उड़द दाल', 'उरद दाल'
    ]
  },
  {
    canonical: 'Moong Dal',
    aliases: [
      'moong dal', 'pasi paruppu', 'paasi paruppu', 'paasi payaru', 'pasi payaru', 'green gram',
      'பாசிப்பருப்பு', 'பாசி பருப்பு', 'பாசிப்பயறு', 'मूंग दाल'
    ]
  },
  {
    canonical: 'Chana Dal',
    aliases: [
      'chana dal', 'channa dal', 'kadalai paruppu', 'kadala paruppu',
      'கடலைப் பருப்பு', 'கடலை பருப்பு', 'चना दाल'
    ]
  },
  {
    canonical: 'Ponni Rice',
    aliases: [
      'ponni rice', 'ponni arisi', 'ponni', 'பொன்னி ரைஸ்', 'பொன்னி அரிசி'
    ]
  },
  {
    canonical: 'Rice',
    aliases: [
      'rice', 'arisi', 'pacharisi', 'puzhungal arisi', 'seeraga samba', 'idli arisi', 'basmati',
      'அரிசி', 'பச்சரிசி', 'புழுங்கல் அரிசி', 'बासमती', 'चावल', 'चांवल'
    ]
  },
  {
    canonical: 'White Sugar',
    aliases: [
      'sugar', 'sakkarai', 'sarkarai', 'seeni', 'white sugar',
      'சர்க்கரை', 'சீனி', 'चीनी', 'शक्कर'
    ]
  },
  {
    canonical: 'Country Sugar',
    aliases: [
      'nattu sakkarai', 'nattu sarkarai', 'brown sugar', 'நாட்டுச் சர்க்கரை', 'நாட்டு சர்க்கரை'
    ]
  },
  {
    canonical: 'Jaggery',
    aliases: [
      'vellam', 'jaggery', 'achhu vellam', 'urundai vellam', 'வெல்லம்', 'गुड़'
    ]
  },
  {
    canonical: 'Palm Jaggery',
    aliases: [
      'karupatti', 'panai vellam', 'palm jaggery', 'பனை வெல்லம்', 'கருப்பட்டி'
    ]
  },
  {
    canonical: 'Tomato',
    aliases: [
      'thakkali', 'thakkaali', 'tomato', 'tomatoes', 'தக்காளி', 'टमाटर'
    ]
  },
  {
    canonical: 'Big Onion',
    aliases: [
      'vengayam', 'vengaayam', 'periya vengayam', 'onion', 'big onion',
      'வெங்காயம்', 'பெரிய வெங்காயம்', 'प्याज'
    ]
  },
  {
    canonical: 'Small Onion',
    aliases: [
      'chinna vengayam', 'shallots', 'sambar vengayam', 'சின்ன வெங்காயம்', 'சாம்பார் வெங்காயம்'
    ]
  },
  {
    canonical: 'Potato',
    aliases: [
      'urulai', 'urulaikizhangu', 'urulaikilangu', 'potato', 'potatoes',
      'உருளைக்கிழங்கு', 'உருளை', 'आलू'
    ]
  },
  {
    canonical: 'Garlic',
    aliases: [
      'poondu', 'garlic', 'பூண்டு', 'लहसुन'
    ]
  },
  {
    canonical: 'Ginger',
    aliases: [
      'inji', 'ginger', 'இஞ்சி', 'अदरक'
    ]
  },
  {
    canonical: 'Green Chilli',
    aliases: [
      'pachai milagai', 'pacha milagai', 'green chilli', 'பச்சை மிளகாய்', 'हरी मिर्च'
    ]
  },
  {
    canonical: 'Chilli Powder',
    aliases: [
      'milagai thool', 'milagaithool', 'chilli powder', 'மிளகாய் தூள்', 'लाल मिर्च पाउडर'
    ]
  },
  {
    canonical: 'Sambar Powder',
    aliases: [
      'sambar podi', 'sambar powder', 'sambar thool', 'sambarpodi', 'சாம்பார் பொடி', 'சாம்பார் தூள்', 'சாம்பார்பொடி'
    ]
  },
  {
    canonical: 'Rasam Powder',
    aliases: [
      'rasam podi', 'rasam powder', 'rasam thool', 'rasampodi', 'ரசம் பொடி', 'ரசம் தூள்'
    ]
  },
  {
    canonical: 'Curry Masala',
    aliases: [
      'curry masala', 'curry powder', 'கறி மசாலா'
    ]
  },
  {
    canonical: 'Garam Masala',
    aliases: [
      'garam masala', 'கரம் மசாலா'
    ]
  },
  {
    canonical: 'Chicken Masala',
    aliases: [
      'chicken masala', 'சிக்கன் மசாலா'
    ]
  },
  {
    canonical: 'Turmeric Powder',
    aliases: [
      'manjal thool', 'manjalthool', 'turmeric powder', 'manjal', 'மஞ்சள் தூள்', 'மஞ்சள்', 'हल्दी'
    ]
  },
  {
    canonical: 'Coriander Powder',
    aliases: [
      'malli thool', 'coriander powder', 'dhaniya thool', 'மல்லித்தூள்', 'தனியா தூள்', 'धनिया पाउडर'
    ]
  },
  {
    canonical: 'Cumin Powder',
    aliases: [
      'seeraga thool', 'cumin powder', 'jeeraga thool', 'சீரகத்தூள்', 'जीरा पाउडर'
    ]
  },
  {
    canonical: 'Cumin',
    aliases: [
      'seeragam', 'jeeragam', 'cumin seeds', 'cumin', 'சீரகம்', 'जीरा'
    ]
  },
  {
    canonical: 'Mustard',
    aliases: [
      'kadugu', 'mustard seeds', 'mustard', 'கடுகு', 'राई', 'सरसों'
    ]
  },
  {
    canonical: 'Fenugreek',
    aliases: [
      'vendhayam', 'vendayam', 'fenugreek', 'வெந்தயம்', 'मेथी'
    ]
  },
  {
    canonical: 'Asafoetida',
    aliases: [
      'perungayam', 'asafoetida', 'hing', 'lg perungayam', 'பெருங்காயம்', 'हींग'
    ]
  },
  {
    canonical: 'Rock Salt',
    aliases: [
      'kal uppu', 'kalluppu', 'rock salt', 'கல் உப்பு'
    ]
  },
  {
    canonical: 'Table Salt',
    aliases: [
      'thool uppu', 'salt', 'uppu', 'table salt', 'தூள் உப்பு', 'உப்பு', 'नमक'
    ]
  },
  {
    canonical: 'Gingelly Oil',
    aliases: [
      'nallennai', 'sesame oil', 'gingelly oil', 'நல்லெண்ணெய்', 'तिल का तेल'
    ]
  },
  {
    canonical: 'Groundnut Oil',
    aliases: [
      'kadalai ennai', 'kadala ennai', 'groundnut oil', 'peanut oil', 'கடலை எண்ணெய்', 'मूंगफली तेल'
    ]
  },
  {
    canonical: 'Coconut Oil',
    aliases: [
      'thengai ennai', 'coconut oil', 'தேங்காய் எண்ணெய்', 'नारियल तेल'
    ]
  },
  {
    canonical: 'Sunflower Oil',
    aliases: [
      'sunflower oil', 'sunflower ennai', 'சூரியகாந்தி எண்ணெய்', 'सनफ्लावर तेल'
    ]
  },
  {
    canonical: 'Palm Oil',
    aliases: [
      'palm oil', 'palmoil', 'பாமாயில்', 'पाम तेल'
    ]
  },
  {
    canonical: 'Wheat Flour',
    aliases: [
      'godhumai maavu', 'godhumai', 'atta', 'wheat flour', 'ashirvaad atta',
      'கோதுமை மாவு', 'கோதுமை', 'ஆட்டா', 'आटा', 'गेहूं का आटा'
    ]
  },
  {
    canonical: 'Maida',
    aliases: [
      'maida', 'maida maavu', 'all purpose flour', 'மைதா', 'मैदा'
    ]
  },
  {
    canonical: 'Rava',
    aliases: [
      'rava', 'ravai', 'sooji', 'semolina', 'ரவை', 'सूजी'
    ]
  },
  {
    canonical: 'Tamarind',
    aliases: [
      'puli', 'tamarind', 'புளி', 'इमली'
    ]
  },
  {
    canonical: 'Tea',
    aliases: [
      'tea', 'tea thool', 'tea powder', 'chakra gold', '3 roses', 'red label',
      'டீ', 'டீ தூள்', 'தேநீர்', 'चाय', 'चाय पत्ती'
    ]
  },
  {
    canonical: 'Coffee',
    aliases: [
      'coffee', 'kaapi', 'kaapi thool', 'coffee powder', 'bru', 'sunrise',
      'காபி', 'காபி தூள்', 'कॉफी'
    ]
  },
  {
    canonical: 'Milk',
    aliases: [
      'paal', 'milk', 'aavin', 'arokya', 'பால்', 'दूध'
    ]
  },
  {
    canonical: 'Egg',
    aliases: [
      'muttai', 'mutta', 'egg', 'eggs', 'முட்டை', 'अंडा'
    ]
  },
  {
    canonical: 'Pure Honey',
    aliases: [
      'pure honey', 'honey', 'தேன்', 'शहद'
    ]
  }
];

// Expense category keywords across languages & scripts
const EXPENSE_CATEGORIES = {
  'Electricity': [
    'electricity', 'eb', 'current', 'eb bill', 'power', 'current bill', 'power bill',
    'vidyut', 'bijli', 'bijli bill',
    'மின்சாரம்', 'கரண்ட் பில்', 'இபி பில்', 'बिजली', 'बिजली बिल', 'करंट'
  ],
  'Rent': [
    'rent', 'vaadagai', 'vadagai', 'room rent', 'shop rent',
    'kiraya', 'makaan kiraya',
    'வாடகை', 'கடை வாடகை', 'किराया', 'दुकान का किराया'
  ],
  'Transport': [
    'transport', 'auto', 'lorry', 'van', 'petrol', 'diesel', 'travel', 'vandi',
    'gaadi', 'kiraya gaadi',
    'டிரான்ஸ்போர்ட்', 'பெட்ரோல்', 'டீசல்', 'ஆட்டோ', 'வண்டி', 'ट्रांसपोर्ट', 'गाड़ी', 'गाड़ी भाड़ा'
  ],
  'Salary': [
    'salary', 'sambalam', 'coolie', 'kooli', 'wages', 'worker',
    'tankhwah', 'vetan',
    'சம்பளம்', 'கூலி', 'வேலைக்காரர் சம்பளம்', 'वेतन', 'सैलरी', 'मजदूरी'
  ],
  'Packaging': [
    'packaging', 'packing selavu', 'cover selavu', 'bag selavu', 'packing',
    'thaili kharch', 'dabba selavu', 'packing expense',
    'பேக்கிங்', 'பை செலவு', 'கவர் செலவு', 'पैकिंग', 'थैली खर्चा'
  ],
  'Maintenance': [
    'maintenance', 'repair', 'cleaning', 'plumbing', 'service', 'maramathu',
    'safai',
    'பராமரிப்பு', 'ரிப்பேர்', 'மரமத்து', 'मरम्मत', 'सफाई'
  ],
  'Refreshment': [
    'tea selavu', 'chai selavu', 'coffee selavu', 'snacks', 'tiffin',
    'டீ செலவு', 'சாப்பாடு', 'நாஷ்டா', 'नाश्ता', 'चाय नाश्ता'
  ]
};

export function parseCommand(rawText, availableProducts = []) {
  if (!rawText || typeof rawText !== 'string') {
    return { error: 'Empty command received' };
  }

  // Normalize numbers from Indian scripts and spoken words to standard digits
  let normalized = normalizeIndianGlyphs(rawText);
  normalized = normalizeSpokenNumbers(normalized);
  const text = normalized.trim().toLowerCase();

  // 1. Confirmation Intent (Yes / No) across scripts
  const yesKeywords = [
    'yes', 'aam', 'ama', 'aama', 'sari', 'seri', 'correct', 'confirm', 'save', 'kandippa', 'save pannu', 'save pannunga', 'ok', 'okay',
    'haan', 'ha', 'sahi', 'theek hai', 'save karo', 'yes save',
    // Devanagari Hindi
    'हाँ', 'हां', 'सही', 'ठीक है', 'सेव करो', 'हाँ सेव करो',
    // Tamil
    'ஆம்', 'சரி', 'சேமி', 'சரி சேமி', 'ஆமா'
  ];

  const noKeywords = [
    'no', 'vendaam', 'vendam', 'venaam', 'venam', 'cancel', 'illai', 'ila', 'stop', 'dont',
    'nahi', 'mat karo', 'ruk jao', 'thappu',
    // Devanagari Hindi
    'नहीं', 'ना', 'मत करो', 'रद्द करो', 'कैंसिल',
    // Tamil
    'வேண்டாம்', 'இல்லை', 'ரத்து', 'வேணாம்'
  ];

  for (const y of yesKeywords) {
    if (hasWord(text, y) || text === y.toLowerCase() || text.startsWith(y.toLowerCase() + ' ')) {
      return { action: 'CONFIRM', confirmed: true, text: rawText };
    }
  }

  for (const n of noKeywords) {
    if (hasWord(text, n) || text === n.toLowerCase() || text.startsWith(n.toLowerCase() + ' ')) {
      return { action: 'CONFIRM', confirmed: false, text: rawText };
    }
  }

  // 2. Profit / Today's Report Intent
  const isProfitQuery =
    (text.includes('profit') ||
     text.includes('laabam') ||
     text.includes('munafa') ||
     text.includes('fayda') ||
     text.includes('faida') ||
     text.includes('innaiku profit') ||
     text.includes('inniki profit') ||
     text.includes('today profit') ||
     text.includes('aaj ka profit') ||
     text.includes('report') ||
     text.includes('kanakku') ||
     text.includes('hisaab') ||
     text.includes('hisab') ||
     text.includes('collection') ||
     // Native scripts
     text.includes('प्रॉफिट') ||
     text.includes('मुनाफा') ||
     text.includes('फायदा') ||
     text.includes('आज का प्रॉफिट') ||
     text.includes('हिसाब') ||
     text.includes('லாபம்') ||
     text.includes('இன்றைய லாபம்') ||
     text.includes('இன்னைக்கு லாபம்') ||
     text.includes('கணக்கு') ||
     text.includes('விற்பனை எவ்வளவு')) &&
    !text.includes('vang') && !text.includes('vaang') && !text.includes('buy') &&
    !text.includes('vit') && !text.includes('vith') && !text.includes('sell') &&
    !text.includes('வாங்க') && !text.includes('விற்');

  if (isProfitQuery) {
    return {
      action: 'TODAY_REPORT',
      originalText: rawText,
      confirmationNeeded: false,
      summary: "Display today's business report & profit"
    };
  }

  // 3. Stock Check Intent
  const isStockQuery =
    (text.includes('stock') ||
     text.includes('evalo') || text.includes('evlo') || text.includes('evalavu') ||
     text.includes('meethi') || text.includes('iruku') || text.includes('irukku') || text.includes('irukka') || text.includes('irukkaa') ||
     text.includes('ethana irukku') || text.includes('ethanai irukku') ||
     text.includes('vilai enna') || text.includes('rate enna') || text.includes('evlo rate') ||
     text.includes('kitna hai') || text.includes('kitna bacha') ||
     // Native scripts
     text.includes('ஸ்டாக்') || text.includes('இருப்பு') || text.includes('எவ்வளவு') || text.includes('மீதி') || text.includes('விலை என்ன') ||
     text.includes('स्टॉक') || text.includes('कितना है') || text.includes('कितना बचा')) &&
    !text.includes('vang') && !text.includes('vaang') && !text.includes('buy') && !text.includes('purchase') &&
    !text.includes('vit') && !text.includes('vith') && !text.includes('sell') && !text.includes('sold') &&
    !text.includes('khareed') &&
    !text.includes('खरीद') && !text.includes('வாங்க') && !text.includes('விற்') && !text.includes('கொள்முதல்');

  if (isStockQuery) {
    const matchedProduct = identifyProduct(text, availableProducts);
    const prodName = matchedProduct ? matchedProduct.name : extractAnyWord(text);
    return {
      action: 'STOCK_CHECK',
      productName: prodName,
      originalText: rawText,
      confirmationNeeded: false,
      summary: `Check stock level for ${prodName}`
    };
  }

  // 4. Customer Invoice / Billing Intent
  const isCustomerInvoiceQuery =
    /^(?:customer|வாடிக்கையாளர்|graahak|grahak|ग्राहक)\b/i.test(text) ||
    /\b(?:invoice|bill\s+(?:for|to|customer))\b/i.test(text) ||
    /^[a-zA-Z\u0B80-\u0BFF]+\s+(?:customer|வாடிக்கையாளர்)\b/i.test(text);

  if (isCustomerInvoiceQuery) {
    const custName = extractCustomerName(rawText);
    const hasName = custName && custName !== 'Customer';
    return {
      action: 'INVOICE_BILLING',
      customerName: hasName ? custName : 'Customer',
      originalText: rawText,
      confirmationNeeded: false,
      summary: hasName ? `Create invoice for customer ${custName}` : `Go to Customer Invoicing & Billing`,
      ttsMessage: hasName
        ? `Customer ${custName} selected for invoice. Please open Customer Billing to add products.`
        : `Please open Customer Billing to create an invoice.`,
      ttsTamil: hasName
        ? `வாடிக்கையாளர் ${custName} பில்லில் சேர்க்கப்பட்டது. பொருட்களைச் சேர்க்க பில்லிங் பக்கத்திற்குச் செல்லவும்.`
        : `விலைப்பட்டியல் உருவாக்க வாடிக்கையாளர் பில்லிங் பக்கத்திற்குச் செல்லவும்.`
    };
  }

  // 5. Expense Intent
  const explicitExpenseKeyword =
    (text.includes('expense') ||
     text.includes('selavu') ||
     text.includes('kharcha') ||
     (text.includes('bill') && !text.includes('customer') && !text.includes('invoice') && !text.includes('வாடிக்கையாளர்')) ||
     text.includes('kattinen') ||
     text.includes('kattitom') ||
     text.includes('kattiten') ||
     text.includes('katnen') ||
     text.includes('diya') ||
     text.includes('bhara') ||
     // Native scripts
     text.includes('செலவு') || text.includes('கட்டினேன்') ||
     text.includes('खर्चा') || text.includes('खर्च') || text.includes('दिया') || text.includes('भरा')) &&
    !isCustomerInvoiceQuery;

  const expenseCategory = identifyExpenseCategory(text);
  const isCategoryWithPayment =
    (expenseCategory !== 'Other' && (text.includes('kuduthen') || text.includes('koduthen') || text.includes('கொடுத்தேன்') || text.includes('paid') || extractAmount(text) > 0));

  const hasSaleVerb = text.includes('vit') || text.includes('vith') || text.includes('sell') || text.includes('sold') || text.includes('விற்');
  if ((explicitExpenseKeyword || isCategoryWithPayment) && !hasSaleVerb) {
    const amount = extractAmount(text);
    return {
      action: 'EXPENSE',
      category: expenseCategory || 'Other',
      amount: amount || 0,
      originalText: rawText,
      confirmationNeeded: true,
      confirmationMessage: `Add ₹${amount || 0} expense for ${expenseCategory || 'Other'}?`,
      ttsMessage: `Add ${amount || 0} rupees expense for ${expenseCategory || 'Other'}. Do you want to save this?`
    };
  }

  // 5. Sale Intent (check before purchase so "vituten", "viten", etc. are captured accurately)
  const isSale =
    text.includes('sell') ||
    text.includes('sold') ||
    text.includes('sale') ||
    text.includes('vit') ||
    text.includes('vith') ||
    text.includes('virpanai') ||
    text.includes('virpana') ||
    text.includes('virka') ||
    text.includes('sale pannen') ||
    text.includes('sale pannom') ||
    text.includes('sale panninen') ||
    text.includes('kilo sell') ||
    text.includes('bech') ||
    text.includes('bikri') ||
    // Native scripts
    text.includes('விற்றேன்') || text.includes('விற்றோம்') || text.includes('விற்றாச்சு') || text.includes('விற்பனை') ||
    text.includes('बेचा') || text.includes('बेची') || text.includes('बेच दिया') || text.includes('बिक्री');

  // 6. Purchase Intent
  const isPurchase =
    text.includes('vang') ||
    text.includes('vaang') ||
    text.includes('buy') ||
    text.includes('purchase') ||
    text.includes('bought') ||
    text.includes('kollumuthal') ||
    text.includes('eduthen') ||
    text.includes('eduthuten') ||
    text.includes('sarukku eduthen') ||
    text.includes('khareed') ||
    text.includes('kharid') ||
    text.includes('liya') ||
    // Native scripts
    text.includes('வாங்கினேன்') || text.includes('வாங்கினோம்') || text.includes('வாங்கியது') || text.includes('வாங்கியாச்சு') || text.includes('கொள்முதல்') ||
    text.includes('खरीद') || text.includes('खरीदा') || text.includes('खरीदे') || text.includes('लिया') || text.includes('लाया');

  if (isSale) {
    const matchedProduct = identifyProduct(text, availableProducts);
    const { quantity, unit } = extractQuantityAndUnit(text);
    const { price } = extractPrice(text, quantity);

    const productName = matchedProduct ? matchedProduct.name : 'Dhal';
    const cleanProdName = (matchedProduct && matchedProduct.nameEnglish) ? matchedProduct.nameEnglish : productName;
    const finalQuantity = quantity || 2;
    const finalUnit = unit || (matchedProduct ? matchedProduct.unit : 'kg');
    const sellingPrice = price || (matchedProduct && matchedProduct.sellingPrice) || 25;
    const totalAmount = Math.round(finalQuantity * sellingPrice * 100) / 100;

    return {
      action: 'SALE',
      productId: matchedProduct ? matchedProduct._id : undefined,
      productName,
      quantity: finalQuantity,
      unit: finalUnit,
      sellingPrice,
      totalAmount,
      originalText: rawText,
      confirmationNeeded: true,
      confirmationMessage: `Sale ${finalQuantity} ${finalUnit} ${productName} at ₹${sellingPrice}/${finalUnit} (Total ₹${totalAmount})?`,
      ttsMessage: `I understood: Sell ${finalQuantity} ${finalUnit} ${cleanProdName} at ${sellingPrice} rupees per ${finalUnit}. Total ${totalAmount} rupees. Do you want to save this?`
    };
  }

  if (isPurchase) {
    const matchedProduct = identifyProduct(text, availableProducts);
    const { quantity, unit } = extractQuantityAndUnit(text);
    const { price } = extractPrice(text, quantity);

    const productName = matchedProduct ? matchedProduct.name : 'Dhal';
    const cleanProdName = (matchedProduct && matchedProduct.nameEnglish) ? matchedProduct.nameEnglish : productName;
    const finalQuantity = quantity || 10;
    const finalUnit = unit || (matchedProduct ? matchedProduct.unit : 'kg');
    const finalPrice = price || (matchedProduct ? Math.round(matchedProduct.averageCost * finalQuantity) : 200);

    const isExplicitUnitPrice =
      /\b(?:oru|1|per|ek|एक|ஒன்று)\s*(?:kilo|kg|l|litre|packet|किलो|கிலோ)\b/i.test(text) ||
      /\b(?:kilo|kg|l|किलो|கிலோ)\s+(?:ku|kku|ko|में|का)\s+\d+/i.test(text);

    let unitPrice = finalPrice;
    let totalPrice = finalPrice;

    if (isExplicitUnitPrice) {
      unitPrice = finalPrice;
      totalPrice = Math.round(unitPrice * finalQuantity * 100) / 100;
    } else {
      totalPrice = finalPrice;
      unitPrice = Math.round((totalPrice / finalQuantity) * 100) / 100;
    }

    return {
      action: 'PURCHASE',
      productId: matchedProduct ? matchedProduct._id : undefined,
      productName,
      quantity: finalQuantity,
      unit: finalUnit,
      purchasePricePerUnit: unitPrice,
      totalPurchasePrice: totalPrice,
      originalText: rawText,
      confirmationNeeded: true,
      confirmationMessage: `Purchase ${finalQuantity} ${finalUnit} ${productName} for ₹${totalPrice} (₹${unitPrice}/${finalUnit})?`,
      ttsMessage: `I understood: Purchase ${finalQuantity} ${finalUnit} ${cleanProdName} for ${totalPrice} rupees. Do you want to save this?`
    };
  }

  // 7. Fallback: If numbers and product are detected
  const detectedProd = identifyProduct(text, availableProducts);
  if (detectedProd) {
    const { quantity, unit } = extractQuantityAndUnit(text);
    const { price } = extractPrice(text, quantity);
    const cleanProdName = detectedProd.nameEnglish || detectedProd.name;

    if (quantity && price) {
      return {
        action: 'PURCHASE',
        productId: detectedProd._id,
        productName: detectedProd.name,
        quantity,
        unit: unit || detectedProd.unit || 'kg',
        purchasePricePerUnit: Math.round((price / quantity) * 100) / 100,
        totalPurchasePrice: price,
        originalText: rawText,
        confirmationNeeded: true,
        confirmationMessage: `Purchase ${quantity} ${unit || detectedProd.unit || 'kg'} ${detectedProd.name} for ₹${price}?`,
        ttsMessage: `I understood: Purchase ${quantity} ${cleanProdName} for ${price} rupees. Do you want to save this?`
      };
    }
  }

  return {
    action: 'UNKNOWN',
    originalText: rawText,
    confirmationNeeded: false,
    message: "Could not understand command. Examples:\n• Tanglish: 'Ponni Rice 25 kg 1300 ku vanginen' / 'Toor Dal 2 kg 155 ku viten' / 'Urad Dal stock evlo'\n• Tamil: 'இன்றைய லாபம் எவ்வளவு' / 'துவரம் பருப்பு 2 கிலோ விற்றேன்'\n• English: 'Today profit report' / 'Purchase 10 kg Dhal for 200'"
  };
}

function identifyProduct(text, availableProducts = []) {
  // 1. Sort available products by name length descending so specific names match before generic words
  const sortedDb = [...availableProducts].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));

  for (const prod of sortedDb) {
    if (prod.nameTamil && hasWord(text, prod.nameTamil)) return prod;
    if (prod.nameEnglish && hasWord(text, prod.nameEnglish)) return prod;
    if (prod.name && hasWord(text, prod.name)) return prod;
  }

  // 2. Check multi-lingual and native script alias dictionary
  for (const item of PRODUCT_MAP) {
    for (const alias of item.aliases) {
      if (hasWord(text, alias)) {
        const found = availableProducts.find(p =>
          (p.nameEnglish && p.nameEnglish.toLowerCase().includes(item.canonical.toLowerCase())) ||
          (p.name && p.name.toLowerCase().includes(item.canonical.toLowerCase()))
        );
        if (found) return found;
        return { name: item.canonical, unit: 'kg' };
      }
    }
  }

  return null;
}

function identifyExpenseCategory(text) {
  for (const [cat, keywords] of Object.entries(EXPENSE_CATEGORIES)) {
    for (const kw of keywords) {
      if (hasWord(text, kw)) return cat;
    }
  }
  return 'Other';
}

function extractQuantityAndUnit(text) {
  // Check grams first: e.g. 500 gram, 250 g -> convert to kg
  const gramMatch = text.match(/(\d+(\.\d+)?)\s*(?:gram|grams|g|கிராம்|ग्राम)\b/i);
  if (gramMatch) {
    const val = parseFloat(gramMatch[1]);
    return { quantity: val / 1000, unit: 'kg' };
  }

  const qtyMatch = text.match(/(\d+(\.\d+)?)\s*(kilo|kg|kilogram|liter|litre|l|packet|pkt|pack|pcs|piece|pieces|box|किलो|கிலோ|लीटर|லிட்டர்|பாக்கெட்|பாக்|பீஸ்)?/i);
  if (qtyMatch) {
    const val = parseFloat(qtyMatch[1]);
    let unit = 'kg';
    const uStr = (qtyMatch[3] || '').toLowerCase();
    if (uStr.startsWith('l') || uStr.includes('लीटर') || uStr.includes('லிட்டர்')) {
      unit = 'L';
    } else if (uStr.startsWith('p') || uStr.includes('பாக்கெட்') || uStr.includes('பாக்') || uStr.includes('पैकेट')) {
      unit = 'packet';
    } else if (uStr.includes('box') || uStr.includes('dabba') || uStr.includes('டப்பா')) {
      unit = 'box';
    } else if (uStr.includes('pcs') || uStr.includes('piece') || uStr.includes('பீஸ்') || uStr.includes('முட்டை')) {
      unit = 'piece';
    }
    return { quantity: val, unit };
  }
  return { quantity: null, unit: 'kg' };
}

function extractPrice(text, detectedQuantity = null) {
  // First check explicit price with currency keywords
  const explicitMatch = text.match(/(\d+)\s*(?:rupees|rs|roobai|rooba|rubai|rupaye|roopayi|₹|रुपये|ரூபாய்|ரூ|ku|kku|me)\b/i);
  if (explicitMatch) {
    return { price: parseInt(explicitMatch[1], 10) };
  }

  const allNumbers = [...text.matchAll(/\b(\d+)\b/g)].map(m => parseInt(m[1], 10));
  if (detectedQuantity !== null && allNumbers.length === 1 && allNumbers[0] === detectedQuantity) {
    return { price: null };
  }
  if (allNumbers.length >= 2) {
    return { price: allNumbers[1] };
  } else if (allNumbers.length === 1 && detectedQuantity === null) {
    return { price: allNumbers[0] };
  }
  return { price: null };
}

function extractAmount(text) {
  const numMatch = text.match(/(\d+)\s*(?:rupees|rs|roobai|rooba|rubai|rupaye|roopayi|₹|रुपये|ரூபாய்|ரூ)?/i);
  return numMatch ? parseInt(numMatch[1], 10) : 0;
}

function extractAnyWord(text) {
  const parts = text.split(/\s+/);
  return parts[0] || 'item';
}

const CUSTOMER_STOP_WORDS = new Set([
  'customer', 'name', 'is', 'peyar', 'naam', 'bill', 'invoice', 'order',
  'item', 'items', 'product', 'products', 'oru', 'rendu', 'pathu', 'innaiku', 'today',
  'kilo', 'kg', 'kilogram', 'gram', 'g', 'liter', 'litre', 'l', 'packet', 'pkt', 'piece', 'pcs',
  'cash', 'upi', 'card', 'sale', 'sell', 'buy', 'purchase', 'expense', 'stock',
  'means', 'podu', 'poodu', 'pannu', 'enter', 'add', 'please', 'vei', 'maathu', 'nu', 'ku', 'kku', 'dhaan', 'than',
  'வாடிக்கையாளர்', 'பெயர்', 'பில்', 'விலை', 'விற்பனை', 'வாங்க', 'கொள்முதல்', 'செலவு', 'இருப்பு'
]);

function isLikelyProduct(word) {
  if (!word) return false;
  const w = word.toLowerCase();
  return PRODUCT_MAP.some(p => p.canonical.toLowerCase().includes(w) || p.aliases.some(a => a.includes(w)));
}

export function extractCustomerName(text) {
  if (!text || typeof text !== 'string') return 'Customer';
  const clean = text.trim();

  // Pattern 1: 'customer [name / is / peyar / பெயர் / naam / :] <NAME>'
  // Also 'bill for <NAME>', 'invoice for <NAME>', 'bill to <NAME>', 'வாடிக்கையாளர் <NAME>'
  const p1 = /(?:customer|வாடிக்கையாளர்|graahak|grahak|ग्राहक|invoice\s+(?:for|customer)|bill\s+(?:for|to|customer))\s*(?:name\s+is|name|peyar|பெயர்|naam|नाम|ka\s+naam|is|nu|ah|aana)?\s*[:\-]?\s*([a-zA-Z\u0B80-\u0BFF]+(?:\s+[a-zA-Z\u0B80-\u0BFF]+)?)/i;
  const m1 = clean.match(p1);
  if (m1 && m1[1]) {
    const rawTokens = m1[1].split(/\s+/).filter(w => !CUSTOMER_STOP_WORDS.has(w.toLowerCase()));
    if (rawTokens.length > 0) {
      if (!CUSTOMER_STOP_WORDS.has(rawTokens[0].toLowerCase())) {
        let finalWords = [rawTokens[0]];
        if (rawTokens.length > 1 && !CUSTOMER_STOP_WORDS.has(rawTokens[1].toLowerCase()) && !isLikelyProduct(rawTokens[1])) {
          finalWords.push(rawTokens[1]);
        }
        return finalWords.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
      }
    }
  }

  // Pattern 2: '<NAME> customer' or '<NAME> வாடிக்கையாளர்'
  const p2 = /^([a-zA-Z\u0B80-\u0BFF]+(?:\s+[a-zA-Z\u0B80-\u0BFF]+)?)\s+(?:customer|வாடிக்கையாளர்|grahak)\b/i;
  const m2 = clean.match(p2);
  if (m2 && m2[1]) {
    const rawTokens = m2[1].split(/\s+/).filter(w => !CUSTOMER_STOP_WORDS.has(w.toLowerCase()));
    if (rawTokens.length > 0) {
      return rawTokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
    }
  }

  // Pattern 3: '<NAME> ku / kku / ku bill'
  const p3 = /^([a-zA-Z\u0B80-\u0BFF]+)\s*(?:-?\s*ku|-?\s*kku|வுக்கு|க்கு)\b/i;
  const m3 = clean.match(p3);
  if (m3 && m3[1] && !CUSTOMER_STOP_WORDS.has(m3[1].toLowerCase())) {
    return m3[1].charAt(0).toUpperCase() + m3[1].slice(1);
  }

  // Pattern 4: Direct single word name (e.g. 'Anu')
  const singleWord = clean.replace(/^[.,;:\s]+|[.,;:\s]+$/g, '');
  if (/^[a-zA-Z\u0B80-\u0BFF]+$/.test(singleWord) && !CUSTOMER_STOP_WORDS.has(singleWord.toLowerCase()) && !isLikelyProduct(singleWord)) {
    return singleWord.charAt(0).toUpperCase() + singleWord.slice(1);
  }

  return 'Customer';
}

export function parseVoiceOrder(rawText, availableProducts = []) {
  if (!rawText || typeof rawText !== 'string') {
    return { error: 'Empty order text received' };
  }

  const customerName = extractCustomerName(rawText);

  // Clean out customer mention from text for item segmentation
  let cleanText = rawText
    .replace(/(?:customer|வாடிக்கையாளர்|graahak|grahak|ग्राहक|invoice\s+(?:for|customer)|bill\s+(?:for|to|customer))\s*(?:name\s+is|name|peyar|பெயர்|naam|नाम|ka\s+naam|is|nu|ah|aana)?\s*[:\-]?\s*[a-zA-Z\u0B80-\u0BFF]+(?:\s*(?:means|nu podu|podu|poodu|enter pannu|enter|add pannu|add|vei|vekkavum|maathu|please|dhaan|than|ku|kku|வுக்கு|க்கு|nu))?/i, '')
    .replace(/^[a-zA-Z\u0B80-\u0BFF]+\s+(?:customer|வாடிக்கையாளர்|grahak)\b/i, '')
    .replace(/^[a-zA-Z\u0B80-\u0BFF]+\s*(?:-?\s*ku|-?\s*kku|வுக்கு|க்கு)\b/i, '')
    .replace(/\b(?:means|nu podu|podu|poodu|enter pannu|enter|add pannu|add|vei|vekkavum|maathu|please|dhaan|than|bill|invoice)\b/gi, '');

  // Split by commas, periods, semicolons, or conjunctions: and, marrum, apram, appuram, மற்றும், அப்புறம்
  const segmentSeparators = /[,.;\n]|\s+(?:and|marrum|apram|appuram|மற்றும்|அப்புறம்)\s+/i;
  let segments = cleanText.split(segmentSeparators).map(s => s.trim()).filter(Boolean);

  // If only 1 segment but multiple quantities or products exist, fallback to splitting by unit boundaries
  if (segments.length === 1 && (cleanText.match(/\d+/g) || []).length > 1) {
    const unitSplit = cleanText.split(/(?<=(?:kilo|kg|kilogram|liter|litre|l|packet|pkt|கிலோ|பாக்கெட்|லிட்டர்))\s+/i);
    if (unitSplit.length > 1) {
      segments = unitSplit.map(s => s.trim()).filter(Boolean);
    }
  }

  const items = [];
  let subtotal = 0;
  let totalProfit = 0;
  let hasStockError = false;
  const stockErrors = [];

  for (const seg of segments) {
    const dummySaleCmd = `${seg} viten`;
    const parsed = parseCommand(dummySaleCmd, availableProducts);

    let matchedProd = null;
    let quantity = 1;
    let unit = 'kg';

    if (parsed.action === 'SALE' && parsed.productName && parsed.productName !== 'Dhal') {
      matchedProd = (parsed.productId && availableProducts.find(p => String(p._id) === String(parsed.productId))) ||
        availableProducts.find(p => p.name === parsed.productName || (p.nameEnglish && p.nameEnglish.toLowerCase() === parsed.productName.toLowerCase())) ||
        { name: parsed.productName, nameEnglish: parsed.productName, unit: parsed.unit || 'kg', sellingPrice: parsed.sellingPrice || 25, averageCost: 0, currentStock: 100 };
      quantity = parsed.quantity;
      unit = parsed.unit;
    } else {
      const directParsed = parseCommand(seg, availableProducts);
      if (directParsed.productName && directParsed.productName !== 'Dhal') {
        matchedProd = availableProducts.find(p => p.name === directParsed.productName) ||
          { name: directParsed.productName, nameEnglish: directParsed.productName, unit: directParsed.unit || 'kg', sellingPrice: directParsed.sellingPrice || 25, averageCost: 0, currentStock: 100 };
        quantity = directParsed.quantity || 1;
        unit = directParsed.unit || 'kg';
      }
    }

    if (matchedProd) {
      // If product already in list, merge quantity
      const existingIdx = items.findIndex(i => String(i.productId) === String(matchedProd._id));
      if (existingIdx !== -1) {
        items[existingIdx].quantity += quantity;
        items[existingIdx].totalPrice = Math.round(items[existingIdx].quantity * items[existingIdx].unitPrice * 100) / 100;
        items[existingIdx].profit = Math.round(items[existingIdx].quantity * (items[existingIdx].unitPrice - items[existingIdx].costPrice) * 100) / 100;
        items[existingIdx].hasSufficientStock = items[existingIdx].currentStock >= items[existingIdx].quantity;
        continue;
      }

      const unitPrice = Number(matchedProd.sellingPrice) || 0;
      const costPrice = Number(matchedProd.averageCost) || 0;
      const totalPrice = Math.round(quantity * unitPrice * 100) / 100;
      const itemProfit = Math.round(quantity * (unitPrice - costPrice) * 100) / 100;
      const currentStock = Number(matchedProd.currentStock) || 0;
      const minimumStock = Number(matchedProd.minimumStock) || 5;

      const hasSufficient = currentStock >= quantity;
      if (!hasSufficient) {
        hasStockError = true;
        const errMsg = `${matchedProd.nameEnglish || matchedProd.name} stock-la ${currentStock} ${matchedProd.unit || 'kg'} mattum dhaan irukku. ${quantity} ${unit} sale panna mudiyadhu.`;
        stockErrors.push(errMsg);
      }

      items.push({
        productId: matchedProd._id,
        productName: matchedProd.name,
        nameTamil: matchedProd.nameTamil,
        nameEnglish: matchedProd.nameEnglish,
        displayName: matchedProd.nameEnglish ? `${matchedProd.nameTamil} (${matchedProd.nameEnglish})` : matchedProd.name,
        quantity,
        unit: unit || matchedProd.unit || 'kg',
        unitPrice,
        costPrice,
        totalPrice,
        profit: itemProfit,
        currentStock,
        minimumStock,
        hasSufficientStock: hasSufficient
      });

      subtotal += totalPrice;
      totalProfit += itemProfit;
    }
  }

  subtotal = Math.round(subtotal * 100) / 100;
  totalProfit = Math.round(totalProfit * 100) / 100;

  let ttsMessage = '';
  let ttsTamil = '';
  let customerOnly = false;

  if (hasStockError) {
    ttsMessage = stockErrors.join(' ');
    ttsTamil = stockErrors.join(' ');
  } else if (items.length > 0) {
    const itemsSummary = items.map(i => `${i.nameEnglish || i.productName} ${i.quantity} ${i.unit}`).join(', ');
    if (customerName && customerName !== 'Customer') {
      ttsMessage = `${customerName} customer bill total ${subtotal} rupees. ${itemsSummary}. Do you want to confirm this bill?`;
      ttsTamil = `${customerName} பில் மொத்தம் ரூபாய் ${subtotal}. ${items.map(i => `${i.nameTamil || i.productName} ${i.quantity} ${i.unit}`).join(', ')}. பில் உறுதி செய்யவா?`;
    } else {
      ttsMessage = `Bill total ${subtotal} rupees. ${itemsSummary}. Do you want to confirm this bill?`;
      ttsTamil = `பில் மொத்தம் ரூபாய் ${subtotal}. ${items.map(i => `${i.nameTamil || i.productName} ${i.quantity} ${i.unit}`).join(', ')}. பில் உறுதி செய்யவா?`;
    }
  } else if (customerName && customerName !== 'Customer') {
    customerOnly = true;
    ttsMessage = `Customer name set to ${customerName} for invoice. Now please speak products to add.`;
    ttsTamil = `வாடிக்கையாளர் பெயர் ${customerName} என பில்லில் பதிவு செய்யப்பட்டது. இப்போது பொருட்களைச் சொல்லுங்கள்.`;
  } else {
    ttsMessage = 'Could not identify items or customer name in your voice command. Please speak customer name or item names.';
    ttsTamil = 'பொருட்களையோ வாடிக்கையாளர் பெயரையோ அடையாளம் காண முடியவில்லை. தயவுசெய்து மீண்டும் பேசவும்.';
  }

  return {
    customerName,
    customerOnly,
    items,
    subtotal,
    discount: 0,
    grandTotal: subtotal,
    totalProfit,
    hasStockError,
    stockErrors,
    ttsMessage,
    ttsTamil,
    originalText: rawText
  };
}

