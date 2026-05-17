const fs = require('fs');
const path = require('path');
const qDir = path.join(__dirname, 'server', 'questions');

function getHighestId() {
  const files = fs.readdirSync(qDir).filter(f => f.endsWith('.json'));
  let maxId = 0;
  files.forEach(f => {
    JSON.parse(fs.readFileSync(path.join(qDir, f), 'utf8')).forEach(q => { if (q.id > maxId) maxId = q.id; });
  });
  return maxId;
}
let id = getHighestId() + 1;

function addToFile(filename, questions) {
  const fp = path.join(qDir, filename);
  const existing = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const texts = new Set(existing.map(e => e.text.toLowerCase()));
  const toAdd = questions.filter(q => !texts.has(q.text.toLowerCase()));
  toAdd.forEach(q => { q.id = id++; });
  existing.push(...toAdd);
  fs.writeFileSync(fp, JSON.stringify(existing, null, 2));
  console.log(`${filename}: +${toAdd.length} (total: ${existing.length})`);
}

addToFile('science.json', [
  { category: "Наука", text: "Какой химический элемент обозначается символом Fe?", options: ["Фтор", "Железо", "Франций", "Фосфор"], correct_answer: 1 },
  { category: "Наука", text: "Сколько костей в теле взрослого человека?", options: ["106", "156", "206", "256"], correct_answer: 2 },
  { category: "Наука", text: "Какая единица измерения силы тока?", options: ["Вольт", "Ватт", "Ом", "Ампер"], correct_answer: 3 },
  { category: "Наука", text: "Что является центром Солнечной системы?", options: ["Земля", "Солнце", "Юпитер", "Луна"], correct_answer: 1 },
  { category: "Наука", text: "Какой орган вырабатывает инсулин?", options: ["Печень", "Почки", "Поджелудочная железа", "Селезёнка"], correct_answer: 2 },
  { category: "Наука", text: "Какая температура кипения воды в градусах Цельсия?", options: ["90", "95", "100", "110"], correct_answer: 2 },
  { category: "Наука", text: "Какой витамин вырабатывается под действием солнечного света?", options: ["A", "B", "C", "D"], correct_answer: 3 },
  { category: "Наука", text: "Сколько хромосом у человека?", options: ["23", "44", "46", "48"], correct_answer: 2 },
  { category: "Наука", text: "Какой элемент является самым лёгким?", options: ["Гелий", "Водород", "Литий", "Углерод"], correct_answer: 1 },
  { category: "Наука", text: "Какая часть клетки содержит ДНК?", options: ["Мембрана", "Цитоплазма", "Ядро", "Рибосома"], correct_answer: 2 },
  { category: "Наука", text: "Какой закон описывает F = ma?", options: ["Первый закон Ньютона", "Второй закон Ньютона", "Закон Гука", "Закон Архимеда"], correct_answer: 1 },
  { category: "Наука", text: "Из чего состоит молекула воды?", options: ["Два атома кислорода и один водорода", "Два атома водорода и один кислорода", "Три атома кислорода", "Один атом каждого"], correct_answer: 1 },
  { category: "Наука", text: "Какая кислота содержится в желудке человека?", options: ["Серная", "Соляная", "Уксусная", "Азотная"], correct_answer: 1 },
  { category: "Наука", text: "Какой металл является жидким при комнатной температуре?", options: ["Галлий", "Ртуть", "Цезий", "Бром"], correct_answer: 1 },
  { category: "Наука", text: "Какая планета ближе всего к Солнцу?", options: ["Венера", "Меркурий", "Марс", "Земля"], correct_answer: 1 },
  { category: "Наука", text: "Что такое фотосинтез?", options: ["Дыхание растений", "Преобразование света в энергию", "Размножение клеток", "Испарение воды"], correct_answer: 1 },
  { category: "Наука", text: "Какой газ выделяют растения при фотосинтезе?", options: ["Углекислый газ", "Азот", "Кислород", "Водород"], correct_answer: 2 },
  { category: "Наука", text: "Какая звезда ближайшая к Земле?", options: ["Сириус", "Проксима Центавра", "Солнце", "Альфа Центавра"], correct_answer: 2 },
  { category: "Наука", text: "Сколько планет в Солнечной системе?", options: ["7", "8", "9", "10"], correct_answer: 1 },
  { category: "Наука", text: "Какой орган является самым большим в теле человека?", options: ["Печень", "Кожа", "Лёгкие", "Кишечник"], correct_answer: 1 },
  { category: "Наука", text: "Какое явление вызывает приливы и отливы?", options: ["Ветер", "Вращение Земли", "Гравитация Луны", "Течения"], correct_answer: 2 },
  { category: "Наука", text: "Какой тип крови является универсальным донором?", options: ["I (O)", "II (A)", "III (B)", "IV (AB)"], correct_answer: 0 },
  { category: "Наука", text: "Что измеряет шкала Рихтера?", options: ["Скорость ветра", "Силу землетрясений", "Температуру", "Яркость звёзд"], correct_answer: 1 },
  { category: "Наука", text: "Какой учёный сформулировал три закона движения?", options: ["Эйнштейн", "Ньютон", "Галилей", "Кеплер"], correct_answer: 1 },
  { category: "Наука", text: "Как называется наука о погоде?", options: ["Геология", "Астрономия", "Метеорология", "Экология"], correct_answer: 2 },
]);

addToFile('sport.json', [
  { category: "Спорт", text: "Сколько игроков в хоккейной команде на льду?", options: ["5", "6", "7", "8"], correct_answer: 1 },
  { category: "Спорт", text: "Какой вид спорта называют 'королём спорта'?", options: ["Теннис", "Лёгкая атлетика", "Футбол", "Плавание"], correct_answer: 1 },
  { category: "Спорт", text: "Где пройдут Олимпийские игры 2028 года?", options: ["Париж", "Токио", "Лос-Анджелес", "Брисбен"], correct_answer: 2 },
  { category: "Спорт", text: "Какой термин в теннисе означает счёт 40:40?", options: ["Матч-пойнт", "Брейк", "Деус (ровно)", "Сет-пойнт"], correct_answer: 2 },
  { category: "Спорт", text: "Сколько периодов в хоккейном матче?", options: ["2", "3", "4", "5"], correct_answer: 1 },
  { category: "Спорт", text: "В каком виде спорта есть приём 'слэм-данк'?", options: ["Волейбол", "Баскетбол", "Гандбол", "Теннис"], correct_answer: 1 },
  { category: "Спорт", text: "Какая дистанция марафона?", options: ["21 км", "35 км", "42.195 км", "50 км"], correct_answer: 2 },
  { category: "Спорт", text: "В каком городе находится стадион 'Камп Ноу'?", options: ["Мадрид", "Барселона", "Лиссабон", "Милан"], correct_answer: 1 },
  { category: "Спорт", text: "Какой спортсмен имеет прозвище 'Молния'?", options: ["Майкл Фелпс", "Усэйн Болт", "Мохаммед Али", "Роналду"], correct_answer: 1 },
  { category: "Спорт", text: "Сколько сетов нужно выиграть для победы в мужском теннисе на Большом шлеме?", options: ["2", "3", "4", "5"], correct_answer: 1 },
  { category: "Спорт", text: "Какой вид спорта включает выполнение ката?", options: ["Дзюдо", "Тхэквондо", "Каратэ", "Айкидо"], correct_answer: 2 },
  { category: "Спорт", text: "В каком году Россия принимала чемпионат мира по футболу?", options: ["2014", "2018", "2022", "2010"], correct_answer: 1 },
  { category: "Спорт", text: "Какой вес боксёрской перчатки в профессиональном боксе (унции)?", options: ["6", "8", "10", "12"], correct_answer: 2 },
  { category: "Спорт", text: "Какой клуб выиграл больше всего Лиг чемпионов?", options: ["Барселона", "Милан", "Реал Мадрид", "Бавария"], correct_answer: 2 },
  { category: "Спорт", text: "Какой вид плавания самый быстрый?", options: ["Брасс", "Баттерфляй", "На спине", "Кроль (вольный стиль)"], correct_answer: 3 },
  { category: "Спорт", text: "Сколько очков стоит трёхочковый в баскетболе?", options: ["2", "3", "4", "5"], correct_answer: 1 },
  { category: "Спорт", text: "Какой спорт называют 'шахматами на льду'?", options: ["Хоккей", "Фигурное катание", "Кёрлинг", "Шорт-трек"], correct_answer: 2 },
  { category: "Спорт", text: "В каком виде спорта используется шайба?", options: ["Лакросс", "Хоккей", "Крикет", "Поло"], correct_answer: 1 },
  { category: "Спорт", text: "Какая страна является родиной крикета?", options: ["Индия", "Австралия", "Англия", "Пакистан"], correct_answer: 2 },
  { category: "Спорт", text: "Какой футболист забил больше всего голов в истории?", options: ["Пеле", "Криштиану Роналду", "Лионель Месси", "Герд Мюллер"], correct_answer: 1 },
  { category: "Спорт", text: "Сколько раундов в профессиональном боксёрском поединке (максимум)?", options: ["8", "10", "12", "15"], correct_answer: 2 },
  { category: "Спорт", text: "Какой вид спорта проводится на велодроме?", options: ["Мотоспорт", "Трековый велоспорт", "Скейтбординг", "Роллер-дерби"], correct_answer: 1 },
  { category: "Спорт", text: "В каком виде спорта соревнуются в UFC?", options: ["Бокс", "Рестлинг", "Смешанные единоборства (MMA)", "Кикбоксинг"], correct_answer: 2 },
  { category: "Спорт", text: "Какое минимальное количество бросков нужно для идеальной игры в боулинге?", options: ["10", "12", "15", "20"], correct_answer: 1 },
  { category: "Спорт", text: "Где прошли первые современные Олимпийские игры?", options: ["Париж", "Лондон", "Афины", "Рим"], correct_answer: 2 },
]);

addToFile('it_games.json', [
  { category: "Игры и Технологии", text: "Какая компания создала PlayStation?", options: ["Nintendo", "Microsoft", "Sony", "Sega"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "Что означает аббревиатура GPU?", options: ["General Processing Unit", "Graphics Processing Unit", "Global Power Unit", "Game Play Utility"], correct_answer: 1 },
  { category: "Игры и Технологии", text: "В какой игре персонаж собирает кольца?", options: ["Марио", "Соник", "Крэш Бандикут", "Мегамен"], correct_answer: 1 },
  { category: "Игры и Технологии", text: "Кто основал компанию Apple?", options: ["Билл Гейтс", "Стив Джобс", "Марк Цукерберг", "Джефф Безос"], correct_answer: 1 },
  { category: "Игры и Технологии", text: "Какая операционная система с открытым исходным кодом?", options: ["Windows", "macOS", "Linux", "iOS"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "Сколько бит в одном байте?", options: ["4", "6", "8", "16"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "Какая игра стала первой Battle Royale-хитом?", options: ["Fortnite", "PUBG", "Apex Legends", "H1Z1"], correct_answer: 1 },
  { category: "Игры и Технологии", text: "Что такое RAM?", options: ["Постоянная память", "Оперативная память", "Видеопамять", "Кэш-память"], correct_answer: 1 },
  { category: "Игры и Технологии", text: "В какой игре есть режим 'Королевская битва' с постройками?", options: ["PUBG", "Apex Legends", "Fortnite", "Warzone"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "Какой язык программирования назван в честь змеи?", options: ["Java", "Ruby", "Python", "Go"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "Что такое VPN?", options: ["Virtual Private Network", "Visual Programming Node", "Video Processing Network", "Virtual Public Node"], correct_answer: 0 },
  { category: "Игры и Технологии", text: "В каком году вышел первый iPhone?", options: ["2005", "2006", "2007", "2008"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "Какая социальная сеть принадлежит компании Meta?", options: ["Twitter", "TikTok", "Instagram", "Snapchat"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "Какой игровой движок используется в Fortnite?", options: ["Unity", "Unreal Engine", "CryEngine", "Source"], correct_answer: 1 },
  { category: "Игры и Технологии", text: "Что такое SSD?", options: ["Super Speed Drive", "Solid State Drive", "System Storage Device", "Smart Sync Disk"], correct_answer: 1 },
  { category: "Игры и Технологии", text: "Какой браузер разработан компанией Google?", options: ["Firefox", "Safari", "Chrome", "Edge"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "В какой серии игр главного героя зовут Линк?", options: ["Final Fantasy", "The Legend of Zelda", "Fire Emblem", "Metroid"], correct_answer: 1 },
  { category: "Игры и Технологии", text: "Что такое AI?", options: ["Advanced Internet", "Artificial Intelligence", "Automated Input", "Applied Integration"], correct_answer: 1 },
  { category: "Игры и Технологии", text: "Какая компания разработала игру GTA V?", options: ["EA", "Ubisoft", "Rockstar Games", "Activision"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "В какой игре есть криперы?", options: ["Roblox", "Terraria", "Minecraft", "Valheim"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "Какой формат файлов используется для веб-страниц?", options: [".doc", ".html", ".pdf", ".exe"], correct_answer: 1 },
  { category: "Игры и Технологии", text: "Какая компания владеет Steam?", options: ["EA", "Epic Games", "Valve", "Activision"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "Какой протокол используется для безопасных соединений?", options: ["HTTP", "FTP", "HTTPS", "SMTP"], correct_answer: 2 },
  { category: "Игры и Технологии", text: "В какой серии игр есть покемоны?", options: ["Digimon", "Pokémon", "Monster Hunter", "Yo-kai Watch"], correct_answer: 1 },
  { category: "Игры и Технологии", text: "Что такое облачные вычисления?", options: ["Вычисления на удалённых серверах", "Вычисления в атмосфере", "Квантовые вычисления", "Аналоговые вычисления"], correct_answer: 0 },
]);

addToFile('famous_people.json', [
  { category: "Великие люди", text: "Кто написал 'Ромео и Джульетту'?", options: ["Байрон", "Шекспир", "Данте", "Мольер"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто изобрёл радио (по русской версии)?", options: ["Маркони", "Попов", "Тесла", "Герц"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто написал 'Божественную комедию'?", options: ["Петрарка", "Боккаччо", "Данте", "Вергилий"], correct_answer: 2 },
  { category: "Великие люди", text: "Кто открыл пенициллин?", options: ["Луи Пастер", "Александр Флеминг", "Роберт Кох", "Эдвард Дженнер"], correct_answer: 1 },
  { category: "Великие люди", text: "Какой учёный предложил гелиоцентрическую модель мира?", options: ["Галилей", "Коперник", "Кеплер", "Птолемей"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто был первым канцлером объединённой Германии?", options: ["Гитлер", "Бисмарк", "Вильгельм I", "Аденауэр"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто нарисовал 'Постоянство памяти' (тающие часы)?", options: ["Пикассо", "Дали", "Магритт", "Миро"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто создал социальную сеть Facebook?", options: ["Джек Дорси", "Марк Цукерберг", "Илон Маск", "Ларри Пейдж"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто сказал 'Я мыслю — значит, я существую'?", options: ["Сократ", "Кант", "Декарт", "Аристотель"], correct_answer: 2 },
  { category: "Великие люди", text: "Кто возглавил движение за гражданские права в США?", options: ["Малком Икс", "Мартин Лютер Кинг", "Нельсон Мандела", "Махатма Ганди"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто стал первой женщиной в космосе?", options: ["Салли Райд", "Валентина Терешкова", "Светлана Савицкая", "Крисса Маколифф"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто написал 'Евгения Онегина'?", options: ["Лермонтов", "Пушкин", "Гоголь", "Тургенев"], correct_answer: 1 },
  { category: "Великие люди", text: "Какой полководец потерпел поражение при Ватерлоо?", options: ["Веллингтон", "Наполеон", "Нельсон", "Кутузов"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто основал компанию Tesla Motors?", options: ["Никола Тесла", "Илон Маск", "Джефф Безос", "Тим Кук"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто написал оперу 'Кармен'?", options: ["Верди", "Пуччини", "Бизе", "Россини"], correct_answer: 2 },
  { category: "Великие люди", text: "Кто открыл электромагнитную индукцию?", options: ["Ньютон", "Ампер", "Фарадей", "Максвелл"], correct_answer: 2 },
  { category: "Великие люди", text: "Кто стал 44-м президентом США?", options: ["Джордж Буш", "Барак Обама", "Дональд Трамп", "Билл Клинтон"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто написал 'Капитал'?", options: ["Энгельс", "Ленин", "Маркс", "Смит"], correct_answer: 2 },
  { category: "Великие люди", text: "Кто является создателем теории эволюции?", options: ["Ламарк", "Мендель", "Дарвин", "Линней"], correct_answer: 2 },
  { category: "Великие люди", text: "Кто построил первый самолёт?", options: ["Братья Райт", "Сантос-Дюмон", "Можайский", "Сикорский"], correct_answer: 0 },
  { category: "Великие люди", text: "Кто написал симфонию 'Из Нового Света'?", options: ["Чайковский", "Дворжак", "Бетховен", "Брамс"], correct_answer: 1 },
  { category: "Великие люди", text: "Какой правитель построил Тадж-Махал?", options: ["Акбар", "Шах-Джахан", "Бабур", "Аурангзеб"], correct_answer: 1 },
  { category: "Великие люди", text: "Кто изобрёл динамит?", options: ["Нобель", "Эдисон", "Тесла", "Фарадей"], correct_answer: 0 },
  { category: "Великие люди", text: "Кто был лидером кубинской революции?", options: ["Пиночет", "Че Гевара", "Фидель Кастро", "Мадуро"], correct_answer: 2 },
  { category: "Великие люди", text: "Кто считается отцом медицины?", options: ["Авиценна", "Гиппократ", "Гален", "Парацельс"], correct_answer: 1 },
]);

console.log('\nBatch 4b complete!');
