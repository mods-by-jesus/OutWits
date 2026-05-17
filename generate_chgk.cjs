const fs = require('fs');
const https = require('https');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, 'server', 'questions');
const CHGK_FILE = path.join(QUESTIONS_DIR, 'chgk.json');
const REQUESTS_COUNT = 15; // Number of times to request 100 questions (total 1500 raw questions)
const LIMIT_PER_REQUEST = 100;

function shuffle(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\n/g, ' ')
             .replace(/\s+/g, ' ')
             .replace(/&quot;/g, '"')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&amp;/g, '&')
             .trim();
}

function fetchXML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractTags(xml, tag) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g');
  const results = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(cleanText(match[1]));
  }
  return results;
}

async function main() {
  console.log('--- Начинаем парсинг базы ЧГК ---');
  let rawQuestions = [];
  let rawAnswers = [];

  for (let i = 0; i < REQUESTS_COUNT; i++) {
    console.log(`[ ] Запрос ${i + 1}/${REQUESTS_COUNT}...`);
    try {
      const xml = await fetchXML(`https://db.chgk.info/xml/random/types1/limit${LIMIT_PER_REQUEST}`);
      const qMatches = extractTags(xml, 'Question');
      const aMatches = extractTags(xml, 'Answer');
      
      for (let j = 0; j < qMatches.length; j++) {
        if (qMatches[j] && aMatches[j]) {
          rawQuestions.push(qMatches[j]);
          rawAnswers.push(aMatches[j]);
        }
      }
    } catch (e) {
      console.error('Ошибка при скачивании:', e);
    }
  }

  console.log(`Всего скачано сырых вопросов: ${rawQuestions.length}`);

  const cleanItems = [];
  const validAnswers = new Set();
  
  for (let i = 0; i < rawQuestions.length; i++) {
    let q = rawQuestions[i];
    let a = rawAnswers[i];

    // Remove text like "Внимание, вопрос:" or "Вопрос:"
    q = q.replace(/^(Внимание, в|В)опрос( 1| \d+)?:\s*/i, '');

    // Answer cleanup
    a = a.replace(/\.$/, '').trim(); // remove trailing dot
    
    // STRICT FILTERING
    // 1. Question shouldn't mention pictures or handouts
    if (q.toLowerCase().includes('раздаточный материал') || 
        q.toLowerCase().includes('раздатка') || 
        q.toLowerCase().includes('внимание, черный ящик') || 
        q.toLowerCase().includes('черный ящик') ||
        q.toLowerCase().includes('дуплет') ||
        q.toLowerCase().includes('блиц')) {
      continue;
    }
    
    // 2. Answer must be short (<= 25 chars) and simple
    if (a.length > 25 || a.length < 2) continue;
    
    // 3. Answer must not contain commas, quotes, parenthesis (too complex)
    if (/[()",]/.test(a)) continue;
    
    // Capitalize first letter of answer
    a = a.charAt(0).toUpperCase() + a.slice(1);

    cleanItems.push({ question: q, answer: a });
    validAnswers.add(a);
  }

  console.log(`После жесткой фильтрации осталось хороших вопросов: ${cleanItems.length}`);
  if (cleanItems.length === 0) return;

  const allAnswersArray = Array.from(validAnswers);
  const finalQuestions = [];

  for (let i = 0; i < cleanItems.length; i++) {
    const item = cleanItems[i];
    const correct = item.answer;
    
    const wrong = shuffle(allAnswersArray.filter(ans => ans.toLowerCase() !== correct.toLowerCase())).slice(0, 3);
    // If not enough unique answers (very rare), just pad with something
    while (wrong.length < 3) wrong.push(shuffle(['Пушкин', 'Колесо', 'Солнце'])[0]);

    const options = shuffle([correct, ...wrong]);
    
    finalQuestions.push({
      id: i + 1,
      text: item.question,
      options: options,
      correct_answer: options.indexOf(correct),
      category: 'Логика и смекалка'
    });
  }

  // Save to file
  fs.writeFileSync(CHGK_FILE, JSON.stringify(finalQuestions, null, 2), 'utf-8');
  console.log(`[+] Успешно сохранено ${finalQuestions.length} вопросов в ${CHGK_FILE}`);
}

main();
