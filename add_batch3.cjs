const fs = require('fs');
const path = require('path');

const qDir = path.join(__dirname, 'server', 'questions');

// Helpers
function getHighestId() {
  const files = fs.readdirSync(qDir).filter(f => f.endsWith('.json'));
  let maxId = 0;
  files.forEach(f => {
    const data = JSON.parse(fs.readFileSync(path.join(qDir, f), 'utf8'));
    data.forEach(q => { if (q.id > maxId) maxId = q.id; });
  });
  return maxId;
}

let currentId = getHighestId() + 1;

const newQuestions = [
  // Искусство и Культура
  { category: "Искусство и Культура", text: "Как называется японское искусство складывания фигурок из бумаги?", options: ["Бонсай", "Икебана", "Оригами", "Судоку"], correct_answer: 2 },
  { category: "Искусство и Культура", text: "В каком городе находится музей Лувр?", options: ["Лондон", "Париж", "Рим", "Берлин"], correct_answer: 1 },
  { category: "Искусство и Культура", text: "Что из этого является музыкальным инструментом?", options: ["Мольберт", "Палитра", "Валторна", "Стамеска"], correct_answer: 2 },
  { category: "Искусство и Культура", text: "Какая эпоха последовала за Средневековьем?", options: ["Античность", "Возрождение", "Просвещение", "Романтизм"], correct_answer: 1 },
  { category: "Искусство и Культура", text: "Какой танец зародился в Аргентине?", options: ["Вальс", "Сальса", "Танго", "Фламенко"], correct_answer: 2 },

  // География
  { category: "География", text: "Какой континент самый сухой на Земле?", options: ["Африка", "Австралия", "Антарктида", "Евразия"], correct_answer: 2 },
  { category: "География", text: "В какой стране находится самое высокое здание в мире (Бурдж-Халифа)?", options: ["Саудовская Аравия", "Катар", "ОАЭ", "США"], correct_answer: 2 },
  { category: "География", text: "Какое озеро является самым глубоким в мире?", options: ["Танганьика", "Виктория", "Мичиган", "Байкал"], correct_answer: 3 },
  { category: "География", text: "Столицей какого государства является город Богота?", options: ["Боливия", "Колумбия", "Венесуэла", "Эквадор"], correct_answer: 1 },
  { category: "География", text: "Через какой город протекает река Темза?", options: ["Париж", "Лондон", "Дублин", "Эдинбург"], correct_answer: 1 },

  // История
  { category: "История", text: "В каком году произошла Великая французская революция?", options: ["1776", "1789", "1812", "1848"], correct_answer: 1 },
  { category: "История", text: "Как назывался древний торговый путь из Китая в Европу?", options: ["Янтарный путь", "Шелковый путь", "Путь из варяг в греки", "Пряный путь"], correct_answer: 1 },
  { category: "История", text: "Какая страна подарила США Статую Свободы?", options: ["Великобритания", "Франция", "Испания", "Германия"], correct_answer: 1 },
  { category: "История", text: "Какой город был разрушен извержением Везувия в 79 году н.э.?", options: ["Рим", "Неаполь", "Помпеи", "Флоренция"], correct_answer: 2 },
  { category: "История", text: "Как звали первого императора Рима?", options: ["Юлий Цезарь", "Октавиан Август", "Нерон", "Калигула"], correct_answer: 1 },

  // Игры и Технологии
  { category: "Игры и Технологии", text: "Какая компания создала консоль Switch?", options: ["Sony", "Microsoft", "Nintendo", "Sega"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "Как называется язык программирования, логотипом которого является чашка кофе?", options: ["Python", "C++", "Java", "Ruby"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "В какой игре нужно строить блоки и выживать от мобов?", options: ["Roblox", "Terraria", "Minecraft", "Fortnite"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "Какой элемент компьютера считается его 'мозгом'?", options: ["Жесткий диск", "Оперативная память", "Процессор", "Видеокарта"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "Что означает аббревиатура HTML?", options: ["HyperText Markup Language", "High Tech Modern Language", "Hyperlink Text Manipulation Language", "Home Tool Markup Language"], correct_answer: 0 },

  // Наука
  { category: "Наука", text: "Что изучает микология?", options: ["Бактерии", "Грибы", "Вирусы", "Мхи"], correct_answer: 1 },
  { category: "Наука", text: "Какой газ преобладает в атмосфере Земли?", options: ["Кислород", "Углекислый газ", "Азот", "Водород"], correct_answer: 2 },
  { category: "Наука", text: "Какая планета Солнечной системы самая большая?", options: ["Земля", "Сатурн", "Уран", "Юпитер"], correct_answer: 3 },
  { category: "Наука", text: "Что такое H2O?", options: ["Перекись водорода", "Вода", "Озон", "Углекислота"], correct_answer: 1 },
  { category: "Наука", text: "Какая кровь у млекопитающих?", options: ["Холодная", "Горячая", "Теплокровная", "Прозрачная"], correct_answer: 2 },

  // Спорт
  { category: "Спорт", text: "В каком виде спорта используется термин 'нокдаун'?", options: ["Теннис", "Бокс", "Шахматы", "Гольф"], correct_answer: 1 },
  { category: "Спорт", text: "Сколько игроков в баскетбольной команде одновременно находятся на площадке?", options: ["4", "5", "6", "7"], correct_answer: 1 },
  { category: "Спорт", text: "Какая страна чаще всего выигрывала чемпионат мира по футболу?", options: ["Германия", "Италия", "Аргентина", "Бразилия"], correct_answer: 3 },
  { category: "Спорт", text: "Как называется площадка для игры в теннис?", options: ["Ринг", "Корт", "Поле", "Трек"], correct_answer: 1 },
  { category: "Спорт", text: "В каком виде спорта прославился Майкл Джордан?", options: ["Бейсбол", "Баскетбол", "Американский футбол", "Хоккей"], correct_answer: 1 },

  // Великие люди
  { category: "Великие люди", text: "Кто был первым человеком в космосе?", options: ["Нил Армстронг", "Юрий Гагарин", "Джон Гленн", "Алексей Леонов"], correct_answer: 1 },
  { category: "Великие люди", text: "Какой художник нарисовал 'Звездную ночь'?", options: ["Пабло Пикассо", "Винсент ван Гог", "Сальвадор Дали", "Клод Моне"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто написал 'Гамлета'?", options: ["Чарльз Диккенс", "Марк Твен", "Уильям Шекспир", "Эрнест Хемингуэй"], correct_answer: 2 },
  { category: "Великие люди", text: "Какой изобретатель создал переменный ток?", options: ["Томас Эдисон", "Бенджамин Франклин", "Никола Тесла", "Джеймс Ватт"], correct_answer: 2 },
  { category: "Великие люди", text: "Кто был первой женщиной-премьер-министром Великобритании?", options: ["Тереза Мэй", "Маргарет Тэтчер", "Елизавета II", "Ангела Меркель"], correct_answer: 1 },
];

const fileMap = {
  'Искусство и Культура': 'culture.json',
  'География': 'geography.json',
  'История': 'history.json',
  'Игры и Технологии': 'it_games.json',
  'Наука': 'science.json',
  'Спорт': 'sport.json',
  'Великие люди': 'famous_people.json'
};

const categorized = {};
newQuestions.forEach(q => {
  if (!categorized[q.category]) categorized[q.category] = [];
  q.id = currentId++;
  categorized[q.category].push(q);
});

for (const [cat, questions] of Object.entries(categorized)) {
  const filename = fileMap[cat];
  const filepath = path.join(qDir, filename);
  let existing = [];
  if (fs.existsSync(filepath)) {
    existing = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }
  
  // check for duplicates by text
  const existingTexts = new Set(existing.map(e => e.text.toLowerCase()));
  const toAdd = questions.filter(q => !existingTexts.has(q.text.toLowerCase()));
  
  existing.push(...toAdd);
  fs.writeFileSync(filepath, JSON.stringify(existing, null, 2));
  console.log(`Added ${toAdd.length} questions to ${filename}`);
}
