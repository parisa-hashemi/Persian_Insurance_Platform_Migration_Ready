/**
 * Utility to convert numbers to Persian words formatted in Toman (تومان)
 * 
 * Assumes the input value is in Rials (ریال), so it divides by 10 to get Tomans.
 * Example: 8,500,000 Rial -> 850,000 Toman -> "هشتصد و پنجاه هزار تومان"
 */

const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const scales = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

function chunkNumberToPersian(num: number): string {
  if (num === 0) return '';
  const parts: string[] = [];

  const h = Math.floor(num / 100);
  const remainder = num % 100;

  if (h > 0) {
    parts.push(hundreds[h]);
  }

  if (remainder >= 10 && remainder <= 19) {
    parts.push(teens[remainder - 10]);
  } else {
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;
    if (t > 0) parts.push(tens[t]);
    if (o > 0) parts.push(ones[o]);
  }

  return parts.join(' و ');
}

export function numberToPersianWords(num: number): string {
  if (num === 0) return 'صفر';
  if (num < 0) return 'منفی ' + numberToPersianWords(Math.abs(num));

  const chunks: number[] = [];
  let temp = Math.floor(num);

  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const words: string[] = [];

  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk > 0) {
      const chunkWord = chunkNumberToPersian(chunk);
      const scale = scales[i];
      if (scale) {
        words.push(`${chunkWord} ${scale}`);
      } else {
        words.push(chunkWord);
      }
    }
  }

  return words.join(' و ');
}

/**
 * Converts a Rial amount string or number to Persian words in Toman.
 * If rialVal is 0 or empty, returns "صفر تومان".
 */
export function rialToPersianToman(rialVal: number | string): string {
  if (rialVal === undefined || rialVal === null || rialVal === '') return 'صفر تومان';
  
  let numStr = String(rialVal).replace(/[^0-9-]/g, '');
  if (!numStr || numStr === '-') return 'صفر تومان';
  
  const rials = parseInt(numStr, 10);
  if (isNaN(rials) || rials === 0) return 'صفر تومان';

  const tomans = Math.floor(rials / 10);
  if (tomans === 0) {
    return `${numberToPersianWords(rials)} ریال (کمتر از ۱ تومان)`;
  }

  return `${numberToPersianWords(tomans)} تومان`;
}
