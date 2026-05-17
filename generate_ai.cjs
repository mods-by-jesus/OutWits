const fs = require('fs');
const https = require('https');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, 'server', 'questions');
const AI_FILE = path.join(QUESTIONS_DIR, 'ai_logic.json');

// Read API key from .env
let apiKey = '';
try {
  const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  const match = env.match(/^GEMINI_API_KEY=(.*)$/m);
  if (match) apiKey = match[1].trim();
} catch (e) {
  console.error('Не удалось прочитать .env файл');
}

if (!apiKey) {
  console.error('GEMINI_API_KEY не найден в .env');
  process.exit(1);
}

const TOPICS = [
  "Ретро видеоигры 90-х", "Скандинавская мифология", "Странные законы стран мира",
  "История изобретений", "Популярные интернет-мемы", "Забавные факты о животных",
  "Кулинарные курьезы", "Тайны космоса", "Кинематограф (пасхалки и факты)",
  "Музыкальные рекорды", "Литература (необычные сюжеты)", "Географические курьезы",
  "История древнего мира", "Современные технологии (ИИ и гаджеты)", "Спорт (курьезные случаи)",
  "Научные заблуждения", "Архитектурные причуды", "Языки и идиомы народов мира",
  "Медицинские курьезы прошлого", "Знаменитые мистификации", "Мифология Древней Греции",
  "Компьютерные вирусы 2000-х", "Загадки океана", "Странные профессии", 
  "Мода прошлых веков", "Криптозоология (снежный человек, лох-несс)", "Психологические эксперименты",
  "Загадочные исчезновения", "Фобии и страхи", "Курьезы на телевидении",
  "Театральные суеверия", "Изобретения, опередившие время", "Пираты и их обычаи",
  "Самураи и ниндзя", "Необычные виды спорта", "Самые нелепые судебные иски",
  "Теории заговора (шуточные)", "Инопланетяне в поп-культуре", "Ошибки перевода",
  "История игрушек", "Городские легенды", "Рекорды Гиннесса (безумные)",
  "Магия и иллюзионисты", "Необычное оружие древности", "Загадки сновидений",
  "Алхимия", "Тайные общества", "Странные налоги", "Вымершие гиганты",
  "Суеверия разных народов", "История анимации", "Крупнейшие ограбления",
  "Нелепые ограбления банков", "Секретные базы и Зона 51", "Эпичные провалы маркетологов",
  "Безумные райдеры (требования звезд)", "Мифы о Средневековье (что было ложью)",
  "Безумные японские телешоу", "Редкие и смешные болезни", "Запрещенные в разных странах продукты",
  "Секреты создания известных фильмов", "Безумные пари и споры в истории", "Самые странные завещания",
  "Мифы о выживании (медведи, зыбучие пески)", "Первоапрельские розыгрыши в СМИ",
  "Эволюционные 'ошибки' животных", "Вымышленные языки (клингонский, эльфийский)",
  "Знаменитые подделки и фальшивки искусства", "Смешные совпадения в истории",
  "Невероятные случаи выживания", "Странные хобби известных исторических личностей",
  "Ошибки в известных видеоиграх (баги-фичи)", "Кулинарные предпочтения диктаторов",
  "Забытые и нелепые олимпийские виды спорта", "Истории о самых неудачливых шпионах",
  "Абсурдные научные исследования (Шнобелевская премия)", "Нелепые травмы профессиональных спортсменов",
  "Судебные иски против мистических существ", "Особенности этикета, ломающие мозг",
  "Смешные и саркастичные эпитафии на надгробиях", "Курьезы на МКС (быт космонавтов)",
  "Странные транспортные средства из прошлого", "Загадки египетских пирамид (абсурдные теории)",
  "Фестивали, в которые сложно поверить", "Животные, служившие в армии", "Ошибки искусственного интеллекта"
];

function shuffle(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
            resolve(json.candidates[0].content.parts[0].text);
          } else {
            reject(new Error('Неверный формат ответа от Gemini: ' + responseData));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

function loadExistingQuestions() {
  if (fs.existsSync(AI_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(AI_FILE, 'utf-8'));
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveQuestions(questions) {
  if (!fs.existsSync(QUESTIONS_DIR)) {
    fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
  }
  
  // Re-assign IDs properly
  questions.forEach((q, idx) => q.id = idx + 1);
  fs.writeFileSync(AI_FILE, JSON.stringify(questions, null, 2), 'utf-8');
}

async function main() {
  console.log('--- Начинаем генерацию вопросов через Google Gemini ---');
  let allQuestions = loadExistingQuestions();
  let addedInSession = 0;
  
  const iterations = 60;
  
  for (let i = 0; i < iterations; i++) {
    console.log(`[ ] Итерация ${i + 1}/${iterations}...`);
    
    // Pick 5 random topics
    const selectedTopics = shuffle(TOPICS).slice(0, 5);
    
    const prompt = `
Ты - профессиональный автор вопросов для интеллектуальных викторин (квизов). 
Сгенерируй ровно 5 уникальных, интересных и смешных вопросов на русском языке.
Для каждого вопроса используй одну из следующих тем (не повторяй темы в одном ответе):
${selectedTopics.map(t => `- ${t}`).join('\n')}

Требования к вопросам:
1. Вопрос должен быть интересным, с юмором или легким подвохом, а не просто сухим фактом.
2. Для каждого вопроса должно быть ровно 4 варианта ответа.
3. Варианты ответов должны быть логичными и похожими на правду, чтобы игрокам было трудно выбрать. Избегай очевидно глупых вариантов.
4. Укажи индекс правильного ответа (от 0 до 3).

Ответ должен быть СТРОГО в формате JSON массива объектов следующей структуры (без лишнего текста, только валидный JSON):
[
  {
    "text": "Текст вопроса...",
    "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    "correct_answer": 0,
    "category": "Логика и смекалка"
  }
]
`;

    try {
      const responseText = await callGemini(prompt);
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      let newQuestions = JSON.parse(cleanJson);
      
      // Override category to ensure they group together in the game
      newQuestions = newQuestions.map(q => ({
        ...q,
        category: 'Нейросеть (Все темы)'
      }));
      
      allQuestions = allQuestions.concat(newQuestions);
      addedInSession += newQuestions.length;
      
      // Save immediately after each successful iteration
      saveQuestions(allQuestions);
      console.log(`[+] Успешно получено и сохранено ${newQuestions.length} вопросов. Всего в базе: ${allQuestions.length}`);
      
      // Sleep a bit to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.error('Ошибка при генерации или парсинге:', e.message);
    }
  }

  console.log(`\nВсего добавлено вопросов в этой сессии: ${addedInSession}`);
  console.log(`[+] Успешно сохранено! Теперь в базе ${allQuestions.length} вопросов в файле ${AI_FILE}`);
}

main();
