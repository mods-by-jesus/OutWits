const fs = require('fs');
const https = require('https');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, 'server', 'questions');
const MILLIONAIRE_FILE = path.join(QUESTIONS_DIR, 'millionaire.json');

// Fetch 750 questions (150 requests of 5 each)
const REQUESTS_COUNT = 150; 
const LIMIT_PER_REQUEST = 5;

function shuffle(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function fetchQuestions() {
  return new Promise((resolve, reject) => {
    const url = `https://engine.lifeis.porn/api/millionaire.php?qType=1&count=${LIMIT_PER_REQUEST}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.ok && json.data) {
            resolve(json.data);
          } else {
            resolve([]);
          }
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('--- Начинаем парсинг базы "Кто хочет стать миллионером" ---');
  let rawQuestions = [];
  
  for (let i = 0; i < REQUESTS_COUNT; i++) {
    if (i % 10 === 0) console.log(`[ ] Запрос ${i + 1}/${REQUESTS_COUNT}...`);
    try {
      const batch = await fetchQuestions();
      rawQuestions = rawQuestions.concat(batch);
      await sleep(100);
    } catch (e) {
      console.error('Ошибка при скачивании:', e);
    }
  }

  console.log(`Всего скачано сырых вопросов: ${rawQuestions.length}`);

  const finalQuestions = [];
  const seen = new Set();

  for (let i = 0; i < rawQuestions.length; i++) {
    const item = rawQuestions[i];
    
    // Some questions might have weird characters or be empty
    if (!item.question || item.answers.length !== 4) continue;
    
    // Deduplicate
    const qText = item.question.trim();
    if (seen.has(qText)) continue;
    seen.add(qText);

    // The API always returns the correct answer as the first element (index 0)
    const correctAnswerText = item.answers[0];
    
    // Shuffle the 4 options
    const options = shuffle([...item.answers]);
    
    // Find the new index of the correct answer
    const correctIndex = options.indexOf(correctAnswerText);

    finalQuestions.push({
      id: finalQuestions.length + 1,
      text: qText,
      options: options,
      correct_answer: correctIndex,
      category: 'Миллионер'
    });
  }

  console.log(`После фильтрации дубликатов осталось уникальных вопросов: ${finalQuestions.length}`);

  // Save to file
  if (!fs.existsSync(QUESTIONS_DIR)) {
    fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
  }
  
  fs.writeFileSync(MILLIONAIRE_FILE, JSON.stringify(finalQuestions, null, 2), 'utf-8');
  console.log(`[+] Успешно сохранено ${finalQuestions.length} вопросов в ${MILLIONAIRE_FILE}`);
}

main();
