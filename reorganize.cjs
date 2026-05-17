const fs = require('fs');
const path = require('path');

const qDir = path.join(__dirname, 'server', 'questions');
const files = fs.readdirSync(qDir).filter(f => f.endsWith('.json'));

let allQuestions = [];

files.forEach(f => {
  const p = path.join(qDir, f);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  allQuestions.push(...data);
});

// Keywords for famous people
const peopleKeywords = [
  'Кто ', 'Кого ', 'Кому ', 'Кем ', 
  'ученый', 'писатель', 'художник', 'композитор', 'режиссер', 'актер', 
  'царь', 'президент', 'император', 'полководец', 'изобретатель', 'первооткрыватель',
  'имя', 'фамилия', 'назван в честь', 'основатель'
];

let idCounter = Math.max(...allQuestions.map(q => q.id)) + 1;

const categoriesMap = {
  'Искусство и Культура': [],
  'География': [],
  'История': [],
  'Игры и Технологии': [],
  'Наука': [],
  'Спорт': [],
  'Великие люди': []
};

allQuestions.forEach(q => {
  // Normalize category
  if (q.category === 'Наука и Космос') q.category = 'Наука';
  
  const text = q.text.toLowerCase();
  
  // Decide if it should be moved to famous people
  // We only move it if it starts with "Кто" or strongly matches keywords
  // But let's be careful not to move "Кто является талисманом" etc.
  let isPerson = false;
  if (text.startsWith('кто ') && !text.includes('талисман') && !text.includes('животное') && !text.includes('бог') && !text.includes('персонаж')) {
    isPerson = true;
  }
  if (text.includes('какой ученый') || text.includes('какой писатель') || text.includes('какой художник') || text.includes('какой композитор') || text.includes('какой полководец') || text.includes('какой правитель')) {
    isPerson = true;
  }
  
  if (isPerson) {
    q.category = 'Великие люди';
  }
  
  if (categoriesMap[q.category]) {
    categoriesMap[q.category].push(q);
  } else {
    categoriesMap[q.category] = [q];
  }
});

// Add some new questions to "Великие люди"
const newPeopleQuestions = [
  { text: "Кто является автором теории относительности?", options: ["Никола Тесла", "Альберт Эйнштейн", "Исаак Ньютон", "Мария Кюри"], correct_answer: 1 },
  { text: "Кто написал роман 'Война и мир'?", options: ["Федор Достоевский", "Александр Пушкин", "Лев Толстой", "Антон Чехов"], correct_answer: 2 },
  { text: "Кто был первым человеком, ступившим на поверхность Луны?", options: ["Юрий Гагарин", "Нил Армстронг", "Базз Олдрин", "Джон Гленн"], correct_answer: 1 },
  { text: "Кто изобрел первый практически пригодный телефон?", options: ["Томас Эдисон", "Александр Белл", "Никола Тесла", "Гульельмо Маркони"], correct_answer: 1 },
  { text: "Кто основал компанию Microsoft?", options: ["Стив Джобс", "Билл Гейтс", "Марк Цукерберг", "Илон Маск"], correct_answer: 1 },
  { text: "Кто был первым президентом США?", options: ["Авраам Линкольн", "Джордж Вашингтон", "Томас Джефферсон", "Джон Адамс"], correct_answer: 1 },
  { text: "Какой ученый открыл закон всемирного тяготения?", options: ["Галилео Галилей", "Исаак Ньютон", "Иоганн Кеплер", "Николай Коперник"], correct_answer: 1 },
  { text: "Кто написал картину 'Мона Лиза'?", options: ["Винсент ван Гог", "Пабло Пикассо", "Леонардо да Винчи", "Микеланджело"], correct_answer: 2 },
  { text: "Кто создал периодическую таблицу химических элементов?", options: ["Антуан Лавуазье", "Мария Кюри", "Дмитрий Менделеев", "Майкл Фарадей"], correct_answer: 2 },
  { text: "Кто был полководцем Карфагена во Второй Пунической войне?", options: ["Юлий Цезарь", "Ганнибал", "Александр Македонский", "Спартак"], correct_answer: 1 },
  { text: "Кто написал балет 'Щелкунчик'?", options: ["Петр Чайковский", "Вольфганг Амадей Моцарт", "Иоганн Себастьян Бах", "Людвиг ван Бетховен"], correct_answer: 0 },
  { text: "Кто открыл Америку в 1492 году?", options: ["Васко да Гама", "Фернан Магеллан", "Христофор Колумб", "Джеймс Кук"], correct_answer: 2 },
  { text: "Кто был первой женщиной, получившей Нобелевскую премию?", options: ["Розалинд Франклин", "Ада Лавлейс", "Мария Кюри", "Флоренс Найтингейл"], correct_answer: 2 },
  { text: "Какой философ был учителем Александра Македонского?", options: ["Сократ", "Платон", "Аристотель", "Пифагор"], correct_answer: 2 },
  { text: "Кто основал монгольскую империю?", options: ["Тамерлан", "Чингисхан", "Аттила", "Сулейман Великолепный"], correct_answer: 1 },
  { text: "Кто изобрел лампу накаливания (коммерчески успешную версию)?", options: ["Томас Эдисон", "Никола Тесла", "Александр Белл", "Майкл Фарадей"], correct_answer: 0 },
  { text: "Какой композитор начал терять слух в 26 лет?", options: ["Вольфганг Амадей Моцарт", "Людвиг ван Бетховен", "Фредерик Шопен", "Рихард Вагнер"], correct_answer: 1 },
  { text: "Кто написал произведение 'Преступление и наказание'?", options: ["Лев Толстой", "Иван Тургенев", "Федор Достоевский", "Антон Чехов"], correct_answer: 2 },
  { text: "Кто считается основателем психоанализа?", options: ["Карл Юнг", "Иван Павлов", "Зигмунд Фрейд", "Альберт Эйнштейн"], correct_answer: 2 },
  { text: "Какой художник отрезал себе часть уха?", options: ["Клод Моне", "Сальвадор Дали", "Винсент ван Гог", "Пабло Пикассо"], correct_answer: 2 }
];

newPeopleQuestions.forEach(nq => {
  nq.id = idCounter++;
  nq.category = 'Великие люди';
  categoriesMap['Великие люди'].push(nq);
});

const fileNames = {
  'Искусство и Культура': 'culture.json',
  'География': 'geography.json',
  'История': 'history.json',
  'Игры и Технологии': 'it_games.json',
  'Наука': 'science.json',
  'Спорт': 'sport.json',
  'Великие люди': 'famous_people.json'
};

for (const [cat, qs] of Object.entries(categoriesMap)) {
  if (qs.length > 0) {
    const filename = fileNames[cat] || 'misc.json';
    fs.writeFileSync(path.join(qDir, filename), JSON.stringify(qs, null, 2));
    console.log(`Saved ${qs.length} questions to ${filename} (Category: ${cat})`);
  }
}
