/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Dictionary of common Algerian & French names to Arabic
const DICTIONARY: Record<string, string> = {
  // First Names (Prénoms)
  'jean': 'جان',
  'alice': 'أليس',
  'ahmed': 'أحمد',
  'clara': 'كلارا',
  'jeanne': 'جان',
  'marc': 'مارك',
  'sarah': 'سارة',
  'youssef': 'يوسف',
  'léa': 'ليا',
  'sofia': 'صوفيا',
  'karim': 'كريم',
  'slimane': 'سليمان',
  'mohamed': 'محمد',
  'mouhamed': 'محمد',
  'maria': 'ماريا',
  'thomas': 'توماس',
  'pierre': 'بيير',
  'paul': 'بول',
  'michel': 'ميشيل',
  'fatima': 'فاطمة',
  'ali': 'علي',
  'rachid': 'رشيد',
  'omar': 'عمر',
  'kamel': 'كمال',
  'mustapha': 'مصطفى',
  'mostefa': 'مصطفى',
  'amine': 'أمين',
  'bilal': 'بلال',
  'farid': 'فريد',
  'halim': 'حليم',
  'mourad': 'مراد',
  'samir': 'سمير',
  'sonia': 'سونيا',
  'linda': 'ليندا',
  'leila': 'ليلى',
  'ryma': 'ريما',
  'amina': 'أمينة',
  'meriem': 'مريم',
  'myriam': 'مريم',
  'yasmine': 'ياسمين',
  'kenza': 'كنزة',
  'sabrina': 'سابرينا',
  'célia': 'سيليا',
  'ines': 'إيناس',
  'selim': 'سليم',
  'sami': 'سامي',
  'walid': 'وليد',
  'nadia': 'نادية',
  'samia': 'سامية',
  'hanane': 'حنان',
  'nawel': 'نوال',
  'fatiha': 'فتيحة',
  'malika': 'مليكة',
  'zahra': 'زهرة',
  'kahina': 'كاهينة',
  'djamel': 'جمال',
  'sofiane': 'سفيان',
  'reda': 'رضا',
  'zinedine': 'زين الدين',
  'abderrahmane': 'عبد الرحمن',
  'abdelkader': 'عبد القادر',
  'rabah': 'رابح',

  // Last Names (Noms)
  'martin': 'مارتن',
  'dubois': 'دوبوا',
  'mansouri': 'منصوري',
  'bernard': 'برنار',
  'dupuis': 'دوبوي',
  'robert': 'روبير',
  'alami': 'علمي',
  'fassi': 'فاسي',
  'girard': 'جيرارد',
  'messaoudi': 'مسعودي',
  'amrani': 'عمراني',
  'zouaoui': 'زواوي',
  'benkari': 'بن كاري',
  'bouaziz': 'بوعزيز',
  'haddad': 'حداد',
  'saidi': 'سعيدي',
  'meziane': 'مزيان',
  'belkacem': 'بلقاسم',
  'ouali': 'والي',
  'zidane': 'زيدان',
  'madjer': 'ماجر',
  'bouteflika': 'بوتفليقة',
  'tebboune': 'تبون',
  'khalfoune': 'خلفون',
  'ghalem': 'غالم',
  'benali': 'بن علي',
  'cherif': 'شريف',
  'guendouz': 'قندوز',
  'dahmani': 'دهماني',
  'hamidi': 'حميدي',
  'merah': 'مراح',
  'kabyle': 'قبايل',
  'touati': 'تواتي',
  'sellal': 'سلال',
  'rahmani': 'رحماني',
  'abbassi': 'عباسي',
  'allali': 'علالي',
  'benyahia': 'بن يحيى',
  'bella': 'بيلا',
};

// Phonetical translation rules fallback
function transliterateWord(word: string): string {
  let text = word.toLowerCase().trim();
  if (DICTIONARY[text]) {
    return DICTIONARY[text];
  }

  // Multi-character phonetic groups mapping
  const doubleLetterRules: [string, string][] = [
    ['ch', 'ش'],
    ['kh', 'خ'],
    ['gh', 'غ'],
    ['ou', 'و'],
    ['dj', 'ج'],
    ['ph', 'ف'],
    ['th', 'ث'],
    ['sh', 'ش'],
  ];

  // Specific ending replacements to make it natural
  if (text.endsWith('ine')) {
    text = text.substring(0, text.length - 3) + 'in';
  } else if (text.endsWith('ie')) {
    text = text.substring(0, text.length - 2) + 'i';
  } else if (text.endsWith('es') && text.length > 3) {
    text = text.substring(0, text.length - 2) + 'e';
  }

  // Iterate character groups and letters
  let result = '';
  let i = 0;
  while (i < text.length) {
    let matched = false;
    // Check double letter rules first
    for (const [key, value] of doubleLetterRules) {
      if (text.substring(i, i + key.length) === key) {
        result += value;
        i += key.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      const char = text[i];
      // Handled single letters mapping
      switch (char) {
        case 'a':
        case 'â':
          // Avoid double Alif
          if (result.endsWith('ا')) break;
          // Only add Alif if it isn't empty, otherwise Alif at start
          result += 'ا';
          break;
        case 'e':
        case 'é':
        case 'è':
        case 'ê':
          // Sometimes silent at the end, but in the middle can be ignored or short sound
          if (i === text.length - 1) {
            // silent or feminine T / Ha
            // e.g. "Amina" -> option
          } else if (i === 0) {
            result += 'إ';
          }
          break;
        case 'i':
        case 'î':
        case 'y':
          if (result.endsWith('ي')) break;
          result += 'ي';
          break;
        case 'o':
        case 'ô':
        case 'u':
          if (result.endsWith('و')) break;
          result += 'و';
          break;
        case 'b':
          result += 'ب';
          break;
        case 'c':
          const next = text[i + 1];
          if (next === 'e' || next === 'i' || next === 'y') {
            result += 'س';
          } else {
            result += 'ك';
          }
          break;
        case 'd':
          result += 'د';
          break;
        case 'f':
          result += 'ف';
          break;
        case 'g':
          const nextG = text[i + 1];
          if (nextG === 'e' || nextG === 'i' || nextG === 'y') {
            result += 'ج';
          } else {
            result += 'غ';
          }
          break;
        case 'h':
          result += 'ه';
          break;
        case 'j':
          result += 'ج';
          break;
        case 'k':
          result += 'ك';
          break;
        case 'l':
          result += 'ل';
          break;
        case 'm':
          result += 'م';
          break;
        case 'n':
          result += 'ن';
          break;
        case 'p':
          result += 'ب';
          break;
        case 'q':
          result += 'ق';
          break;
        case 'r':
          result += 'ر';
          break;
        case 's':
          // Avoid double S rendering double Arabic letter
          if (text[i + 1] === 's') {
            i++; // skip next s
          }
          result += 'س';
          break;
        case 't':
          result += 'ت';
          break;
        case 'v':
          result += 'ف';
          break;
        case 'w':
          result += 'و';
          break;
        case 'x':
          result += 'كس';
          break;
        case 'z':
          result += 'ز';
          break;
        default:
          break;
      }
      i++;
    }
  }

  // Clean trailing a / Alif double patterns or redundant vowel additions
  if (result.endsWith('اا')) {
    result = result.slice(0, -1);
  }

  return capitalizeFirstLetter(result);
}

function capitalizeFirstLetter(string: string) {
  return string;
}

/**
 * Automatical translation of a French name to Arabic.
 * Splits full name into individual words, translates each, and matches them.
 * @param fullName French name (e.g. "Jean Martin" or "Mansouri Ahmed")
 * @returns { Nom_Pat_Arb: string, Pren_Pat_Arb: string }
 */
export function translateNameToArabic(fullName: string): { Nom_Pat_Arb: string; Pren_Pat_Arb: string } {
  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 0 || !fullName.trim()) {
    return { Nom_Pat_Arb: '', Pren_Pat_Arb: '' };
  }

  // Handle single word
  if (parts.length === 1) {
    const translation = transliterateWord(parts[0]);
    return { Nom_Pat_Arb: translation, Pren_Pat_Arb: '' };
  }

  // Assume French style "Firstname Lastname" or standard Algerian "Lastname Firstname"
  // For safety, let's assume word index 0 is Prenom (e.g. Jean) and 1 is Nom (e.g. Martin)
  // or vice versa. If we have multiple names:
  // Let's take the first part as Prenom and the rest as Nom or vice versa.
  // We'll translate all parts, and assign First as Pren_Pat_Arb and Last as Nom_Pat_Arb.
  // Wait, the user specifically wants:
  // - Nom_Pat_Arb: standard last name in Arabic
  // - Pren_Pat_Arb: standard first name in Arabic
  
  // Let's do:
  // First item in parts is likely the First Name (Prénom) in French style,
  // or if we have 2 words: [Prenom, Nom]. Let's say part 1 is Prénom, part 2 is Nom.
  // But wait, in Algeria, "Messaoudi Slimane" -> "Messaoudi" is Nom, "Slimane" is Prénom.
  // Let's check dictionary:
  // If the first word corresponds to a known Last Name, or if we just split by first & last parts.
  // Let's split simply:
  // Let's say we have first part and second part. We translate them individually.
  // First word is Prenom, other words are Nom, OR first word is Nom, second is Prenom.
  // Let's assume standard layout of splitting into two halves or detecting by dictionary keys!
  // Let's run a simple check:
  // If we split by parts, let's say:
  // If part 0 is a known Last name and part 1 is a known First name, we map them correctly!
  const translatedParts = parts.map(transliterateWord);
  
  let prenomIdx = 0;
  let nomIdx = 1;

  // Simple heuristic: if parts[1] is a known first name, then parts[1] is Prenom and parts[0] is Nom
  const p1Lower = parts[1] ? parts[1].toLowerCase() : '';
  const p0Lower = parts[0] ? parts[0].toLowerCase() : '';
  
  // Look up known collections
  const firstNamesList = ['jean', 'alice', 'ahmed', 'clara', 'jeanne', 'marc', 'sarah', 'youssef', 'léa', 'sofia', 'karim', 'slimane', 'mohamed', 'mouhamed', 'maria', 'thomas', 'pierre', 'paul', 'michel', 'fatima', 'ali', 'rachid', 'omar', 'kamel', 'mustapha', 'mostefa', 'amine', 'bilal', 'farid', 'halim', 'mourad', 'samir', 'sonia', 'linda', 'leila', 'ryma', 'amina', 'meriem', 'myriam', 'yasmine', 'kenza', 'sabrina', 'célia', 'ines', 'selim', 'sami', 'walid', 'nadia', 'samia', 'hanane', 'nawel', 'fatiha', 'malika', 'zahra', 'kahina', 'djamel', 'sofiane', 'reda', 'zinedine', 'abderrahmane', 'abdelkader', 'rabah'];
  
  if (parts.length >= 2) {
    if (firstNamesList.includes(p1Lower) && !firstNamesList.includes(p0Lower)) {
      // "Nom Prenom" pattern
      nomIdx = 0;
      prenomIdx = 1;
    } else {
      // Default to "Prenom Nom" pattern
      prenomIdx = 0;
      nomIdx = 1;
    }
  }

  const Pren_Pat_Arb = translatedParts[prenomIdx] || '';
  // Combine rest of parts as Nom_Pat_Arb
  const remainingNomParts = translatedParts.filter((_, idx) => idx !== prenomIdx);
  const Nom_Pat_Arb = remainingNomParts.join(' ') || translatedParts[nomIdx] || '';

  return { Nom_Pat_Arb, Pren_Pat_Arb };
}
