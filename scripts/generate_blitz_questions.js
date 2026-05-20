import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// База структурированных фактов для генерации вопросов
const FACTS = {
  // 1. Страны и столицы (География) - 120 уникальных стран
  capitals: [
    { country: 'Франция', capital: 'Париж' },
    { country: 'Италия', capital: 'Рим' },
    { country: 'Испания', capital: 'Мадрид' },
    { country: 'Германия', capital: 'Берлин' },
    { country: 'Великобритания', capital: 'Лондон' },
    { country: 'Япония', capital: 'Токио' },
    { country: 'Китай', capital: 'Пекин' },
    { country: 'Индия', capital: 'Нью-Дели' },
    { country: 'Египет', capital: 'Каир' },
    { country: 'Бразилия', capital: 'Бразилиа' },
    { country: 'Канада', capital: 'Оттава' },
    { country: 'Австралия', capital: 'Канберра' },
    { country: 'Греция', capital: 'Афины' },
    { country: 'Турция', capital: 'Анкара' },
    { country: 'Таиланд', capital: 'Бангкок' },
    { country: 'Мексика', capital: 'Мехико' },
    { country: 'Аргентина', capital: 'Буэнос-Айрес' },
    { country: 'Южная Корея', capital: 'Сеул' },
    { country: 'ЮАР', capital: 'Претория' },
    { country: 'Португалия', capital: 'Лиссабон' },
    { country: 'Швеция', capital: 'Стокгольм' },
    { country: 'Норвегия', capital: 'Осло' },
    { country: 'Финляндия', capital: 'Хельсинки' },
    { country: 'Швейцария', capital: 'Берн' },
    { country: 'Австрия', capital: 'Вена' },
    { country: 'Польша', capital: 'Варшава' },
    { country: 'Нидерланды', capital: 'Амстердам' },
    { country: 'Чехия', capital: 'Прага' },
    { country: 'Венгрия', capital: 'Будапешт' },
    { country: 'Куба', capital: 'Гавана' },
    { country: 'Индонезия', capital: 'Джакарта' },
    { country: 'Вьетнам', capital: 'Ханой' },
    { country: 'Марокко', capital: 'Рабат' },
    { country: 'Исландия', capital: 'Рейкьявик' },
    { country: 'Ирландия', capital: 'Дублин' },
    { country: 'Перу', capital: 'Лима' },
    { country: 'Чили', capital: 'Сантьяго' },
    { country: 'Колумбия', capital: 'Богота' },
    { country: 'Новая Зеландия', capital: 'Веллингтон' },
    { country: 'Саудовская Аравия', capital: 'Эр-Рияд' },
    { country: 'Филиппины', capital: 'Манила' },
    { country: 'Кения', capital: 'Найроби' },
    { country: 'Кувейт', capital: 'Эль-Кувейт' },
    { country: 'Ирак', capital: 'Багдад' },
    { country: 'Дания', capital: 'Копенгаген' },
    { country: 'Бельгия', capital: 'Брюссель' },
    { country: 'Сингапур', capital: 'Сингапур' },
    { country: 'Уругвай', capital: 'Монтевидео' },
    { country: 'Монако', capital: 'Монако' },
    { country: 'Монголия', capital: 'Улан-Батор' },
    { country: 'Болгария', capital: 'София' },
    { country: 'Румыния', capital: 'Бухарест' },
    { country: 'Алжир', capital: 'Алжир' },
    { country: 'Иран', capital: 'Тегеран' },
    { country: 'Пакистан', capital: 'Исламабад' },
    { country: 'Бангладеш: ', capital: 'Дакка' },
    { country: 'Венесуэла', capital: 'Каракас' },
    { country: 'Катар', capital: 'Доха' },
    { country: 'Оман', capital: 'Маскат' },
    { country: 'Сирия', capital: 'Дамаск' },
    { country: 'Ливан', capital: 'Бейрут' },
    { country: 'Ливия', capital: 'Триполи' },
    { country: 'Тунис', capital: 'Тунис' },
    { country: 'Эфиопия', capital: 'Аддис-Абеба' },
    { country: 'Гана', capital: 'Аккра' },
    { country: 'Нигерия', capital: 'Абуджа' },
    { country: 'Судан', capital: 'Хартум' },
    { country: 'Хорватия', capital: 'Загреб' },
    { country: 'Сербия', capital: 'Белград' },
    { country: 'Словакия', capital: 'Братислава' },
    { country: 'Словения', capital: 'Любляна' },
    { country: 'Люксембург', capital: 'Люксембург' },
    { country: 'Кипр', capital: 'Никосия' },
    { country: 'Мальта', capital: 'Валлетта' },
    { country: 'Панама', capital: 'Панама' },
    { country: 'Коста-Рика', capital: 'Сан-Хосе' },
    { country: 'Эквадор', capital: 'Кито' },
    { country: 'Боливия', capital: 'Сукре' },
    { country: 'Парагвай', capital: 'Асунсьон' },
    { country: 'Грузия', capital: 'Тбилиси' },
    { country: 'Армения', capital: 'Ереван' },
    { country: 'Азербайджан', capital: 'Баку' },
    { country: 'Узбекистан', capital: 'Ташкент' },
    { country: 'Казахстан', capital: 'Астана' },
    { country: 'Белоруссия', capital: 'Минск' },
    { country: 'Латвия', capital: 'Рига' },
    { country: 'Литва', capital: 'Вильнюс' },
    { country: 'Эстония', capital: 'Таллин' },
    { country: 'Молдавия', capital: 'Кишинёв' },
    { country: 'Мадагаскар', capital: 'Антананариву' },
    { country: 'Шри-Ланка', capital: 'Шри-Джаяварденепура-Котте' },
    { country: 'Непал', capital: 'Катманду' },
    { country: 'Малайзия', capital: 'Куала-Лумпур' },
    { country: 'Афганистан', capital: 'Кабул' },
    { country: 'Иордания', capital: 'Амман' },
    { country: 'Йемен', capital: 'Сана' },
    { country: 'Кипр', capital: 'Никосия' },
    { country: 'Албания', capital: 'Тирана' },
    { country: 'Андорра', capital: 'Андорра-ла-Велья' },
    { country: 'Ирландия', capital: 'Дублин' },
    { country: 'Мали', capital: 'Бамако' },
    { country: 'Сенегал', capital: 'Дакар' },
    { country: 'Уганда', capital: 'Кампала' },
    { country: 'Ангола', capital: 'Луанда' },
    { country: 'Замбия', capital: 'Лусака' },
    { country: 'Зимбабве', capital: 'Хараре' },
    { country: 'Камерун', capital: 'Яунде' },
    { country: 'Кот-д’Ивуар', capital: 'Ямусукро' },
    { country: 'Танзания', capital: 'Додома' },
    { country: 'Гватемала', capital: 'Гватемала' },
    { country: 'Гондурас', capital: 'Тегусигальпа' },
    { country: 'Никарагуа', capital: 'Манагуа' },
    { country: 'Ямайка', capital: 'Кингстон' },
    { country: 'Багамские Острова', capital: 'Нассау' },
    { country: 'Доминиканская Республика', capital: 'Санто-Доминго' },
    { country: 'Суринам', capital: 'Парамарибо' },
    { country: 'Гайана', capital: 'Джорджтаун' },
    { country: 'Фиджи', capital: 'Сува' },
    { country: 'Албания', capital: 'Тирана' },
    { country: 'Люксембург', capital: 'Люксембург' },
    { country: 'Лихтенштейн', capital: 'Вадуц' }
  ],

  // 2. Страны и их национальные валюты - 40 уникальных стран
  currencies: [
    { country: 'США', currency: 'Доллар' },
    { country: 'Великобритания', currency: 'Фунт стерлингов' },
    { country: 'Япония', currency: 'Иена' },
    { country: 'Китай', currency: 'Юань' },
    { country: 'Россия', currency: 'Рубль' },
    { country: 'Индия', currency: 'Рупия' },
    { country: 'Швейцария', currency: 'Франк' },
    { country: 'Бразилия', currency: 'Реал' },
    { country: 'Турция', currency: 'Лира' },
    { country: 'Южная Корея', currency: 'Вона' },
    { country: 'ЮАР', currency: 'Рэнд' },
    { country: 'Мексика', currency: 'Песо' },
    { country: 'Саудовская Аравия', currency: 'Риал' },
    { country: 'Таиланд', currency: 'Бат' },
    { country: 'Вьетнам', currency: 'Донг' },
    { country: 'Польша', currency: 'Злотый' },
    { country: 'ОАЭ', currency: 'Дирхам' },
    { country: 'Швеция', currency: 'Крона' },
    { country: 'Норвегия', currency: 'Крона' },
    { country: 'Украина', currency: 'Гривна' },
    { country: 'Казахстан', currency: 'Тенге' },
    { country: 'Израиль', currency: 'Шекель' },
    { country: 'Сингапур', currency: 'Доллар' },
    { country: 'Австралия', currency: 'Доллар' },
    { country: 'Канада', currency: 'Доллар' },
    { country: 'Новая Зеландия', currency: 'Доллар' },
    { country: 'Малайзия', currency: 'Ринггит' },
    { country: 'Египет', currency: 'Фунт' },
    { country: 'Иран', currency: 'Риал' },
    { country: 'Кения', currency: 'Шиллинг' },
    { country: 'Нигерия', currency: 'Найра' },
    { country: 'Индонезия', currency: 'Рупия' },
    { country: 'Филиппины', currency: 'Песо' },
    { country: 'Аргентина', currency: 'Песо' },
    { country: 'Чили', currency: 'Песо' },
    { country: 'Колумбия', currency: 'Песо' },
    { country: 'Пакистан', currency: 'Рупия' },
    { country: 'Грузия', currency: 'Лари' },
    { country: 'Азербайджан', currency: 'Манат' },
    { country: 'Чехия', currency: 'Крона' }
  ],

  // 3. Химические элементы и их символы - 60 уникальных элементов
  elements: [
    { name: 'Водород', symbol: 'H' },
    { name: 'Гелий', symbol: 'He' },
    { name: 'Литий', symbol: 'Li' },
    { name: 'Бериллий', symbol: 'Be' },
    { name: 'Бор', symbol: 'B' },
    { name: 'Углерод', symbol: 'C' },
    { name: 'Азот', symbol: 'N' },
    { name: 'Кислород', symbol: 'O' },
    { name: 'Фтор', symbol: 'F' },
    { name: 'Неон', symbol: 'Ne' },
    { name: 'Натрий', symbol: 'Na' },
    { name: 'Магний', symbol: 'Mg' },
    { name: 'Алюминий', symbol: 'Al' },
    { name: 'Кремний', symbol: 'Si' },
    { name: 'Фосфор', symbol: 'P' },
    { name: 'Сера', symbol: 'S' },
    { name: 'Хлор', symbol: 'Cl' },
    { name: 'Аргон', symbol: 'Ar' },
    { name: 'Калий', symbol: 'K' },
    { name: 'Кальций', symbol: 'Ca' },
    { name: 'Титан', symbol: 'Ti' },
    { name: 'Хром', symbol: 'Cr' },
    { name: 'Марганец', symbol: 'Mn' },
    { name: 'Железо', symbol: 'Fe' },
    { name: 'Кобальт', symbol: 'Co' },
    { name: 'Никель', symbol: 'Ni' },
    { name: 'Медь', symbol: 'Cu' },
    { name: 'Цинк', symbol: 'Zn' },
    { name: 'Мышьяк', symbol: 'As' },
    { name: 'Серебро', symbol: 'Ag' },
    { name: 'Олово', symbol: 'Sn' },
    { name: 'Йод', symbol: 'I' },
    { name: 'Ксенон', symbol: 'Xe' },
    { name: 'Платина', symbol: 'Pt' },
    { name: 'Золото', symbol: 'Au' },
    { name: 'Ртуть', symbol: 'Hg' },
    { name: 'Свинец', symbol: 'Pb' },
    { name: 'Радон', symbol: 'Rn' },
    { name: 'Уран', symbol: 'U' },
    { name: 'Плутоний', symbol: 'Pu' },
    { name: 'Вольфрам', symbol: 'W' },
    { name: 'Висмут', symbol: 'Bi' },
    { name: 'Барий', symbol: 'Ba' },
    { name: 'Радий', symbol: 'Ra' },
    { name: 'Нептуний', symbol: 'Np' },
    { name: 'Сурьма', symbol: 'Sb' },
    { name: 'Селен', symbol: 'Se' },
    { name: 'Бром', symbol: 'Br' },
    { name: 'Криптон', symbol: 'Kr' },
    { name: 'Рубидий', symbol: 'Rb' },
    { name: 'Стронций', symbol: 'Sr' },
    { name: 'Цирконий', symbol: 'Zr' },
    { name: 'Молибден', symbol: 'Mo' },
    { name: 'Технеций', symbol: 'Tc' },
    { name: 'Родий', symbol: 'Rh' },
    { name: 'Палладий', symbol: 'Pd' },
    { name: 'Кадмий', symbol: 'Cd' },
    { name: 'Теллур', symbol: 'Te' },
    { name: 'Цезий', symbol: 'Cs' },
    { name: 'Астат', symbol: 'At' }
  ],

  // 4. Литература: Книги и авторы - 50 произведений
  literature: [
    { author: 'Лев Толстой', book: 'Война и мир' },
    { author: 'Федор Достоевский', book: 'Преступление и наказание' },
    { author: 'Александр Пушкин', book: 'Евгений Онегин' },
    { author: 'Михаил Булгаков', book: 'Мастер и Маргарита' },
    { author: 'Николай Гоголь', book: 'Мертвые души' },
    { author: 'Антон Чехов', book: 'Вишневый сад' },
    { author: 'Михаил Лермонтов', book: 'Герой нашего времени' },
    { author: 'Иван Тургенев', book: 'Отцы и дети' },
    { author: 'Джордж Оруэлл', book: '1984' },
    { author: 'Уильям Шекспир', book: 'Гамлет' },
    { author: 'Мигель де Сервантес', book: 'Дон Кихот' },
    { author: 'Данте Алигьери', book: 'Божественная комедия' },
    { author: 'Александр Дюма', book: 'Три мушкетера' },
    { author: 'Виктор Гюго', book: 'Отверженные' },
    { author: 'Иоганн Вольфганг Гёте', book: 'Фауст' },
    { author: 'Жюль Верн', book: 'Вокруг света за 80 дней' },
    { author: 'Марк Твен', book: 'Приключения Тома Сойера' },
    { author: 'Артур Конан Дойл', book: 'Приключения Шерлока Холмса' },
    { author: 'Эрнест Хемингуэй', book: 'Старик и море' },
    { author: 'Франц Кафка', book: 'Процесс' },
    { author: 'Рэй Брэдбери', book: '451 градус по Фаренгейту' },
    { author: 'Джон Толкин', book: 'Хоббит' },
    { author: 'Габриэль Гарсиа Маркес', book: 'Сто лет одиночества' },
    { author: 'Оскар Уайльд', book: 'Портрет Дориана Грея' },
    { author: 'Мэри Шелли', book: 'Франкенштейн' },
    { author: 'Брэм Стокер', book: 'Дракула' },
    { author: 'Антуан де Сент-Экзюпери', book: 'Маленький принц' },
    { author: 'Шарлотта Бронте', book: 'Джейн Эйр' },
    { author: 'Чарльз Диккенс', book: 'Оливер Твист' },
    { author: 'Льюис Кэрролл', book: 'Алиса в Стране чудес' },
    { author: 'Гомер', book: 'Одиссея' },
    { author: 'Герман Мелвилл', book: 'Моби Дик' },
    { author: 'Джером Сэлинджер', book: 'Над пропастью во ржи' },
    { author: 'Джейн Остин', book: 'Гордость и предубеждение' },
    { author: 'Клайв Льюис', book: 'Хроники Нарнии' },
    { author: 'Джон Стейнбек', book: 'Гроздья гнева' },
    { author: 'Дэниел Дефо', book: 'Робинзон Крузо' },
    { author: 'Джонатан Свифт', book: 'Путешествия Гулливера' },
    { author: 'Вальтер Скотт', book: 'Айвенго' },
    { author: 'Роберт Стивенсон', book: 'Остров сокровищ' },
    { author: 'Кен Кизи', book: 'Над гнездом кукушки' },
    { author: 'Олдос Хаксли', book: 'О дивный новый мир' },
    { author: 'Джордж Оруэлл', book: 'Скотный двор' },
    { author: 'Виктор Пелевин', book: 'Чапаев и Пустота' },
    { author: 'Борис Пастернак', book: 'Доктор Живаго' },
    { author: 'Алексей Толстой', book: 'Петр Первый' },
    { author: 'Владимир Набоков', book: 'Лолита' },
    { author: 'Иван Бунин', book: 'Темные аллеи' },
    { author: 'Александр Солженицын', book: 'Один день Ивана Денисовича' },
    { author: 'Михаил Шолохов', book: 'Тихий Дон' }
  ],

  // 5. История: События и годы - 50 событий
  history: [
    { event: 'Крещение Руси', year: 988 },
    { event: 'Основание Москвы', year: 1147 },
    { event: 'Куликовская битва', year: 1380 },
    { event: 'Открытие Америки Колумбом', year: 1492 },
    { event: 'Основание Санкт-Петербурга', year: 1703 },
    { event: 'Бородинское сражение', year: 1812 },
    { event: 'Отмена крепостного права в России', year: 1861 },
    { event: 'Начало Первой мировой войны', year: 1914 },
    { event: 'Начало Второй мировой войны', year: 1939 },
    { event: 'Полет Юрия Гагарина в космос', year: 1961 },
    { event: 'Авария на Чернобыльской АЭС', year: 1986 },
    { event: 'Распад СССР', year: 1991 },
    { event: 'Французская революция', year: 1789 },
    { event: 'Падение Берлинской стены', year: 1989 },
    { event: 'Подписание Декларации независимости США', year: 1776 },
    { event: 'Ледовое побоище', year: 1242 },
    { event: 'Начало правления Петра I', year: 1682 },
    { event: 'Падение Римской империи', year: 476 },
    { event: 'Полтавская битва', year: 1709 },
    { event: 'Первый полет братьев Райт', year: 1903 },
    { event: 'Первый запуск искусственного спутника Земли', year: 1957 },
    { event: 'Высадка человека на Луну', year: 1969 },
    { event: 'Бостонское чаепитие', year: 1773 },
    { event: 'Открытие Антарктиды', year: 1820 },
    { event: 'Окончание Столетней войны', year: 1453 },
    { event: 'Грюнвальдская битва', year: 1410 },
    { event: 'Основание Рима', year: -753 },
    { event: 'Гибель Помпеи при извержении Везувия', year: 79 },
    { event: 'Варфоломеевская ночь', year: 1572 },
    { event: 'Славная революция в Англии', year: 1688 },
    { event: 'Восстание декабристов', year: 1825 },
    { event: 'Крымская война', year: 1853 },
    { event: 'Открытие Периодической таблицы Менделеевым', year: 1869 },
    { event: 'Гибель Титаника', year: 1912 },
    { event: 'Карибский кризис', year: 1962 },
    { event: 'Объединение Германии', year: 1990 },
    { event: 'Великая хартию вольностей в Англии', year: 1215 },
    { event: 'Невская битва', year: 1240 },
    { event: 'Осада Константинополя османами', year: 1453 },
    { event: 'Падение Бастилии', year: 1789 },
    { event: 'Манифест о трехдневной барщине', year: 1797 },
    { event: 'Октябрьская революция в России', year: 1917 },
    { event: 'Начало Великой Отечественной войны', year: 1941 },
    { event: 'Смерть Сталина', year: 1953 },
    { event: 'Карибский кризис', year: 1962 },
    { event: 'Принятие Конституции РФ', year: 1993 },
    { event: 'Основание Московского университета', year: 1755 },
    { event: 'Северная война со Швецией', year: 1700 },
    { event: 'Прутский поход Петра I', year: 1711 },
    { event: 'Гангутское сражение', year: 1714 }
  ],

  // 6. Наука: Изобретения и открытия - 40 открытий
  science: [
    { scientist: 'Исаак Ньютон', discovery: 'Закон всемирного тяготения' },
    { scientist: 'Дмитрий Менделеев', discovery: 'Периодическая таблица элементов' },
    { scientist: 'Альберт Эйнштейн', discovery: 'Теория относительности' },
    { scientist: 'Александр Флеминг', discovery: 'Пенициллин' },
    { scientist: 'Чарльз Дарвин', discovery: 'Теория эволюции' },
    { scientist: 'Вильгельм Рентген', discovery: 'Рентгеновское излучение' },
    { scientist: 'Никола Тесла', discovery: 'Переменный ток' },
    { scientist: 'Томас Эдисон', discovery: 'Лампа накаливания' },
    { scientist: 'Александр Белл', discovery: 'Телефон' },
    { scientist: 'Иоганн Гутенберг', discovery: 'Книгопечатный станок' },
    { scientist: 'Луи Пастер', discovery: 'Пастеризация' },
    { scientist: 'Мария Кюри', discovery: 'Открытие радия' },
    { scientist: 'Джеймс Уатт', discovery: 'Паровой двигатель' },
    { scientist: 'Роберт Кох', discovery: 'Открытие бактерии туберкулеза' },
    { scientist: 'Галилео Галилей', discovery: 'Открытие спутников Юпитера' },
    { scientist: 'Иван Павлов', discovery: 'Теория условных рефлексов' },
    { scientist: 'Архимед', discovery: 'Закон выталкивающей силы' },
    { scientist: 'Николай Коперник', discovery: 'Гелиоцентрическая система мира' },
    { scientist: 'Альфред Нобель', discovery: 'Изобретение динамита' },
    { scientist: 'Рудольф Дизель', discovery: 'Дизельный двигатель' },
    { scientist: 'Ханс Липперсгей', discovery: 'Изобретение телескопа' },
    { scientist: 'Чарльз Goodyear', discovery: 'Вулканизация резины' },
    { scientist: 'Майкл Фарадей', discovery: 'Электромагнитная индукция' },
    { scientist: 'Грегор Мендель', discovery: 'Законы наследственности' },
    { scientist: 'Роберт Гук', discovery: 'Открытие растительной клетки' },
    { scientist: 'Эрнест Резерфорд', discovery: 'Планетарная модель атома' },
    { scientist: 'Джон Дальтон', discovery: 'Атомная теория строения вещества' },
    { scientist: 'Евангелиста Торричелли', discovery: 'Изобретение ртутного барометра' },
    { scientist: 'Алессандро Вольта', discovery: 'Изобретение батарейки' },
    { scientist: 'Жозеф Ньепс', discovery: 'Создание первой фотографии' },
    { scientist: 'Константин Циолковский', discovery: 'Теория космических полетов' },
    { scientist: 'Сергей Королев', discovery: 'Разработка первой космической ракеты' },
    { scientist: 'Александер Паркс', discovery: 'Изобретение пластмассы' },
    { scientist: 'Бенджамин Франклин', discovery: 'Изобретение громоотвода' },
    { scientist: 'Рене Декарт', discovery: 'Аналитическая геометрия' },
    { scientist: 'Блез Паскаль', discovery: 'Шприц и гидравлический пресс' },
    { scientist: 'Эванджелиста Торричелли', discovery: 'Открытие атмосферного давления' },
    { scientist: 'Андре-Мари Ампер', discovery: 'Закон электродинамики' },
    { scientist: 'Георг Ом', discovery: 'Закон электрического сопротивления' },
    { scientist: 'Генрих Герц', discovery: 'Доказательство существования электромагнитных волн' }
  ],

  // 7. Искусство: Картины - 30 шедевров
  art: [
    { painter: 'Леонардо да Винчи', painting: 'Мона Лиза' },
    { painter: 'Леонардо да Винчи', painting: 'Тайная вечеря' },
    { painter: 'Винсент ван Гог', painting: 'Звездная ночь' },
    { painter: 'Винсент ван Гог', painting: 'Подсолнухи' },
    { painter: 'Эдвард Мунк', painting: 'Крик' },
    { painter: 'Микеланджело', painting: 'Сикстинская капелла' },
    { painter: 'Сандро Боттичелли', painting: 'Рождение Венеры' },
    { painter: 'Клод Моне', painting: 'Водяные лилии' },
    { painter: 'Пабло Пикассо', painting: 'Герника' },
    { painter: 'Сальвадор Дали', painting: 'Постоянство памяти' },
    { painter: 'Рембрандт', painting: 'Ночной дозор' },
    { painter: 'Казимир Малевич', painting: 'Черный квадрат' },
    { painter: 'Иван Шишкин', painting: 'Утро в сосновом лесу' },
    { painter: 'Иван Айвазовский', painting: 'Девятый вал' },
    { painter: 'Илья Репин', painting: 'Бурлаки на Волге' },
    { painter: 'Виктор Васнецов', painting: 'Богатыри' },
    { painter: 'Пьер Огюст Ренуар', painting: 'Бал в Мулен де ла Галетт' },
    { painter: 'Ян Вермеер', painting: 'Девушка с жемчужной сережкой' },
    { painter: 'Иероним Босх', painting: 'Сад земных наслаждений' },
    { painter: 'Густав Климт', painting: 'Поцелуй' },
    { painter: 'Караваджо', painting: 'Призвание апостола Матфея' },
    { painter: 'Рафаэль Санти', painting: 'Сикстинская Мадонна' },
    { painter: 'Тициан Вечеллио', painting: 'Земная любовь и Любовь небесная' },
    { painter: 'Анри Матисс', painting: 'Танец' },
    { painter: 'Марк Шагал', painting: 'Над городом' },
    { painter: 'Михаил Врубель', painting: 'Демон сидящий' },
    { painter: 'Валентин Серов', painting: 'Девочка с персиками' },
    { painter: 'Карл Брюллов', painting: 'Последний день Помпеи' },
    { painter: 'Василий Суриков', painting: 'Боярыня Морозова' },
    { painter: 'Алексей Саврасов', painting: 'Грачи прилетели' }
  ],

  // 8. Астрономия и Космос - 30 уникальных фактов
  astronomy: [
    { body: 'Венера', feature: 'Самая горячая планета Солнечной системы' },
    { body: 'Юпитер', feature: 'Самая большая планета Солнечной системы' },
    { body: 'Сатурн', feature: 'Планета с самыми большими и яркими кольцами' },
    { body: 'Меркурий', feature: 'Самая близкая планета к Солнцу' },
    { body: 'Нептун', feature: 'Самая далекая планета от Солнца' },
    { body: 'Марс', feature: 'Планета, которую называют Красной из-за оксида железа' },
    { body: 'Проксима Центавра', feature: 'Ближайшая к нашему Солнцу звезда' },
    { body: 'Ганимед', feature: 'Самый крупный спутник в нашей Солнечной системе' },
    { body: 'Ио', feature: 'Самое геологически активное тело Солнечной системы с вулканами' },
    { body: 'Титан', feature: 'Спутник в Солнечной системе с плотной атмосферой и метановыми озерами' },
    { body: 'Сириус', feature: 'Самая яркая звезда на всем ночном небе Земли' },
    { body: 'Млечный Путь', feature: 'Спиральная галактика, в которой находится наша Солнечная система' },
    { body: 'Уран', feature: 'Планета Солнечной системы, вращающаяся «на боку»' },
    { body: 'Харон', feature: 'Крупнейший спутник карликовой планеты Плутон' },
    { body: 'Андромеда', feature: 'Ближайшая к Млечному Пути крупная спиральная галактика' },
    { body: 'Луна', feature: 'Единственный естественный спутник Земли' },
    { body: 'Деймос', feature: 'Один из двух крошечных спутников Марса' },
    { body: 'Церера', feature: 'Ближайшая к Солнцу карликовая планета' },
    { body: 'Солнце', feature: 'Единственная звезда в нашей Солнечной системе' },
    { body: 'Олимп', feature: 'Высочайший потухший вулкан на Марсе' },
    { body: 'Альдебаран', feature: 'Ярчайшая звезда в созвездии Тельца' },
    { body: 'Полярная звезда', feature: 'Звезда, указывающая направление строго на север' },
    { body: 'Европа', feature: 'Спутник Юпитера с гигантским океаном под слоем льда' },
    { body: 'Фобос', feature: 'Крупнейший и ближайший спутник планеты Марс' },
    { body: 'Энцелад', feature: 'Ледяной спутник Сатурна с активными криогейзерами' },
    { body: 'Бетельгейзе', feature: 'Гигантский красный сверхгигант в созвездии Ориона' },
    { body: 'Вега', feature: 'Ярчайшая звезда в созвездии Лиры' },
    { body: 'Хаумеа', feature: 'Быстровращающаяся карликовая планета яйцевидной формы' },
    { body: 'Макемаке', feature: 'Крупный транснептуновый объект и карликовая планета' },
    { body: 'Эрида', feature: 'Вторая по размеру карликовая планета Солнечной системы после Плутона' }
  ],

  // 9. Рекорды природы и биология - 40 уникальных фактов
  biology: [
    { body: 'Гепард', feature: 'Самое быстрое наземное млекопитающее на Земле' },
    { body: 'Сапсан', feature: 'Самая быстрая птица в мире, развивающая скорость более 320 км/ч' },
    { body: 'Синий кит', feature: 'Самое крупное животное, когда-либо жившее на нашей планете' },
    { body: 'Колибри', feature: 'Самая маленькая птица на Земле' },
    { body: 'Бамбук', feature: 'Самое быстрорастущее древесное растение в мире' },
    { body: 'Секвойя', feature: 'Самое высокое дерево на планете Земля' },
    { body: 'Африканский слон', feature: 'Самое крупное наземное млекопитающее на Земле' },
    { body: 'Анаконда', feature: 'Самая тяжелая змея в мире' },
    { body: 'Жираф', feature: 'Самое высокое животное на планете' },
    { body: 'Черная мамба', feature: 'Самая быстрая змея на суше' },
    { body: 'Утка-мандаринка', feature: 'Птица, известная своим необычайно ярким разноцветным оперением' },
    { body: 'Утконос', feature: 'Водоплавающее млекопитающее Австралии, откладывающее яйца' },
    { body: 'Ехидна', feature: 'Млекопитающее, которое наряду с утконосом откладывает яйца' },
    { body: 'Императорский пингвин', feature: 'Самый крупный и тяжелый из всех современных видов пингвинов' },
    { body: 'Белая акула', feature: 'Самая большая современная хищная рыба на Земле' },
    { body: 'Страус', feature: 'Самая большая птица на планете Земля, не умеющая летать' },
    { body: 'Комодский варан', feature: 'Самая крупная из ныне живущих ящериц в мире' },
    { body: 'Медоед', feature: 'Животное, известное своей бесстрашностью перед любыми хищниками' },
    { body: 'Шимпанзе', feature: 'Ближайший к человеку с генетической точки зрения вид приматов' },
    { body: 'Хамелеон', feature: 'Пресмыкающееся, известное способностью менять окраску тела' },
    { body: 'Летучая мышь', feature: 'Единственное млекопитающее на Земле, способное к машущему полету' },
    { body: 'Раффлезия', feature: 'Растение с самым большим в мире одиночным цветком, пахнущим мясом' },
    { body: 'Виктория амазонская', feature: 'Кувшинка с самыми большими листьями, выдерживающими вес ребенка' },
    { body: 'Баобаб', feature: 'Дерево с невероятно толстым стволом, служащим резервуаром для воды' },
    { body: 'Тихоходка', feature: 'Микроскопическое беспозвоночное, известное выживаемостью в космосе' },
    { body: 'Коала', feature: 'Сумчатое животное Австралии, питающееся исключительно эвкалиптом' },
    { body: 'Кенгуру', feature: 'Крупнейшее сумчатое животное, передвигающееся прыжками' },
    { body: 'Ленивец', feature: 'Животное, известное своей крайне низкой скоростью передвижения' },
    { body: 'Лев', feature: 'Хищник из рода пантер, известный как царь зверей' },
    { body: 'Белый медведь', feature: 'Самый крупный сухопутный хищник на планете Земля' },
    { body: 'Кедр', feature: 'Священное дерево Ливана, символ долговечности и силы' },
    { body: 'Росянка', feature: 'Растение-хищник, ловящее насекомых липкими листьями' },
    { body: 'Шершень', feature: 'Самая крупная оса, укус которой опасен для жизни' },
    { body: 'Рыба-капля', feature: 'Глубоководная рыба, признанная самым уродливым существом океана' },
    { body: 'Крокодил', feature: 'Крупная водная рептилия, дышащая легкими и неизменившаяся с юрского периода' },
    { body: 'Голубой ара', feature: 'Редчайший вид попугаев с ярким кобальтово-синим оперением' },
    { body: 'Муравей-пуля', feature: 'Насекомое с самым болезненным и токсичным укусом в мире' },
    { body: 'Исполинская саламандра', feature: 'Крупнейшее земноводное на планете Земля' },
    { body: 'Двупалый ленивец', feature: 'Млекопитающее с самой медленной скоростью пищеварения в мире' },
    { body: 'Черный гриф', feature: 'Птица с самым большим размахом крыльев среди всех птиц' }
  ],

  // 10. Географические рекорды Земли - 40 уникальных фактов
  geography_records: [
    { body: 'Эверест', feature: 'Самая высокая горная вершина над уровнем моря на Земле' },
    { body: 'Байкал', feature: 'Самое глубокое озеро на планете Земля' },
    { body: 'Нил', feature: 'Самая длинная река в мире' },
    { body: 'Амазонка', feature: 'Самая полноводная река в мире' },
    { body: 'Сахара', feature: 'Самая большая жаркая пустыня на планете Земля' },
    { body: 'Марианская впадина', feature: 'Самый глубокий океанический желоб на Земле' },
    { body: 'Каспийское море', feature: 'Самый большой замкнутый водоем на Земле' },
    { body: 'Гренландия', feature: 'Самый большой остров на планете Земля' },
    { body: 'Ватикан', feature: 'Самое маленькое по площади независимое государство в мире' },
    { body: 'Мертвое море', feature: 'Самый соленый водоем на Земле' },
    { body: 'Антарктида', feature: 'Самый холодный и самый ледяной континент на Земле' },
    { body: 'Евразия', feature: 'Самый большой материк на планете Земля' },
    { body: 'Тихий океан', feature: 'Самый большой и глубокий океан на планете Земля' },
    { body: 'Аравийский полуостров', feature: 'Самый большой полуостров в мире' },
    { body: 'Анды', feature: 'Самая длинная горная цепь на суше Земли' },
    { body: 'Волга', feature: 'Самая длинная и полноводная река в Европе' },
    { body: 'Ладожское озеро', feature: 'Самое большое пресноводное озеро в Европе' },
    { body: 'Сарезское озеро', feature: 'Глубокое озеро на Памире, возникшее из-за оползня' },
    { body: 'Везувий', feature: 'Единственный действующий вулкан в континентальной Европе' },
    { body: 'Фудзияма', feature: 'Высочайшая вершина и священный вулкан Японии' },
    { body: 'Килиманджаро', feature: 'Высочайшая точка Африки, расположенная в Танзании' },
    { body: 'Эльбрус', feature: 'Высочайшая горная вершина России и Европы' },
    { body: 'Виктория', feature: 'Одно из крупнейших озер Африки с водопадом на реке Замбези' },
    { body: 'Анхель', feature: 'Самый высокий водопад в мире, расположенный в Венесуэле' },
    { body: 'Игуасу', feature: 'Комплекс из 275 водопадов на границе Бразилии и Аргентины' },
    { body: 'Исландия', feature: 'Островное государство, известное обилием гейзеров и ледников' },
    { body: 'Мадагаскар', feature: 'Остров у побережья Африки с огромным количеством эндемиков' },
    { body: 'Мальдивы', feature: 'Самое низкое и плоское государство в мире' },
    { body: 'Тибет', feature: 'Самое высокое и обширное нагорье в мире («крыша мира»)' },
    { body: 'Аравийская пустыня', feature: 'Обширная пустыня на Ближнем Востоке' },
    { body: 'Озеро Верхнее', feature: 'Самое крупное по площади пресноводное озеро в мире' },
    { body: 'Средиземное море', feature: 'Крупнейшее межматериковое море на планете' },
    { body: 'Гибралтарский пролив', feature: 'Пролив, соединяющий Атлантический океан и Средиземное море' },
    { body: 'Берингов пролив', feature: 'Пролив между самой восточной точкой Азии и самой западной точкой Америки' },
    { body: 'Урал', feature: 'Горная система, традиционно разделяющая Европу и Азию' },
    { body: 'Кордильеры', feature: 'Величайшая по протяженности горная система на западе обеих Америк' },
    { body: 'Суэцкий канал', feature: 'Искусственный канал, соединяющий Средиземное и Красное моря' },
    { body: 'Панамский канал', feature: 'Искусственный канал, соединяющий Атлантический и Тихий океаны' },
    { body: 'Янцзы', feature: 'Самая длинная и многоводная река Евразии' },
    { body: 'Драконовы горы', feature: 'Высочайшая горная система на юге Африканского континента' }
  ]
};

// Функция для случайного перемешивания вариантов по алгоритму Фишера-Йетса
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Функция подбора дистракторов из общего пула одного типа
function getDistractors(pool, correctValue, count = 3) {
  const filtered = pool.filter(item => item !== correctValue);
  const shuffled = shuffle(filtered);
  return shuffled.slice(0, count);
}

// Генерация случайных лет-дистракторов вокруг правильного года
function getYearDistractors(correctYear, count = 3) {
  const distractors = new Set();
  while (distractors.size < count) {
    const offset = Math.floor(Math.random() * 81) - 40;
    if (offset !== 0) {
      const year = correctYear + offset;
      distractors.add(year.toString());
    }
  }
  return Array.from(distractors);
}

async function main() {
  console.log('=== Запуск генератора 500+ уникальных блиц-вопросов ===');
  
  const targetDir = path.join(__dirname, '../server/questions');
  const targetFile = path.join(targetDir, 'short_questions.json');
  
  // Убеждаемся, что директория существует
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Загружаем исходные 25 высококачественных вопросов с картинками
  let baseQuestions = [];
  if (fs.existsSync(targetFile)) {
    try {
      const content = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
      // Оставляем только вопросы с ID от 1 до 25 (наши проверенные ручные вопросы)
      baseQuestions = content.filter(q => q.id >= 1 && q.id <= 25);
      console.log(`Загружено базовых вопросов с картинками: ${baseQuestions.length}`);
    } catch (e) {
      console.log('Не удалось прочитать базовый файл. Начинаем с нуля.');
    }
  }

  const generatedQuestions = [];

  // Вспомогательные списки для подбора дистракторов
  const allCountries = FACTS.capitals.map(c => c.country).filter(Boolean);
  const allCapitals = FACTS.capitals.map(c => c.capital).filter(Boolean);
  const allCurrencies = [...new Set(FACTS.currencies.map(c => c.currency))].filter(Boolean);
  const allElementNames = FACTS.elements.map(e => e.name).filter(Boolean);
  const allElementSymbols = FACTS.elements.map(e => e.symbol).filter(Boolean);
  const allAuthors = FACTS.literature.map(l => l.author).filter(Boolean);
  const allBooks = FACTS.literature.map(l => l.book).filter(Boolean);
  const allScientists = FACTS.science.map(s => s.scientist).filter(Boolean);
  const allDiscoveries = FACTS.science.map(s => s.discovery).filter(Boolean);
  const allPainters = FACTS.art.map(a => a.painter).filter(Boolean);
  const allPaintings = FACTS.art.map(a => a.painting).filter(Boolean);
  const allBodies = FACTS.astronomy.map(a => a.body).filter(Boolean);
  const allFeatures = FACTS.astronomy.map(a => a.feature).filter(Boolean);
  const allHistoricalEvents = FACTS.history.map(h => h.event).filter(Boolean);
  const allBiologyBodies = FACTS.biology.map(b => b.body).filter(Boolean);
  const allBiologyFeatures = FACTS.biology.map(b => b.feature).filter(Boolean);
  const allGeographyBodies = FACTS.geography_records.map(g => g.body).filter(Boolean);
  const allGeographyFeatures = FACTS.geography_records.map(g => g.feature).filter(Boolean);

  // --- ГЕНЕРАЦИЯ ВОПРОСОВ (КАЖДЫЙ ФАКТ СТРОГО ОДИН РАЗ!) ---

  // 1. География: Столицы (120 уникальных стран)
  FACTS.capitals.forEach((item, index) => {
    // Чтобы избежать дублирования сути, генерируем либо прямой, либо обратный вопрос в зависимости от индекса
    if (index % 2 === 0) {
      // Прямой вопрос
      const capDistractors = getDistractors(allCapitals, item.capital, 3);
      const capOptions = shuffle([item.capital, ...capDistractors]);
      generatedQuestions.push({
        text: `Какой город является столицей государства ${item.country}?`,
        options: capOptions,
        correct_answer: capOptions.indexOf(item.capital),
        category: 'Блиц-вопросы'
      });
    } else {
      // Обратный вопрос
      const ctryDistractors = getDistractors(allCountries, item.country, 3);
      const ctryOptions = shuffle([item.country, ...ctryDistractors]);
      generatedQuestions.push({
        text: `Столицей какого государства является город ${item.capital}?`,
        options: ctryOptions,
        correct_answer: ctryOptions.indexOf(item.country),
        category: 'Блиц-вопросы'
      });
    }
  });

  // 2. География: Валюты (40 уникальных стран)
  FACTS.currencies.forEach((item, index) => {
    if (index % 2 === 0) {
      // Прямой вопрос
      const curDistractors = getDistractors(allCurrencies, item.currency, 3);
      const curOptions = shuffle([item.currency, ...curDistractors]);
      generatedQuestions.push({
        text: `Какая национальная валюта используется в государстве ${item.country}?`,
        options: curOptions,
        correct_answer: curOptions.indexOf(item.currency),
        category: 'Блиц-вопросы'
      });
    } else {
      // Обратный вопрос
      const ctryDistractors = getDistractors(allCountries, item.country, 3);
      const ctryOptions = shuffle([item.country, ...ctryDistractors]);
      generatedQuestions.push({
        text: `В какой из этих стран официальной валютой является ${item.currency}?`,
        options: ctryOptions,
        correct_answer: ctryOptions.indexOf(item.country),
        category: 'Блиц-вопросы'
      });
    }
  });

  // 3. Химия: Элементы и символы (60 уникальных элементов)
  FACTS.elements.forEach((item, index) => {
    if (index % 2 === 0) {
      // Прямой
      const symDistractors = getDistractors(allElementSymbols, item.symbol, 3);
      const symOptions = shuffle([item.symbol, ...symDistractors]);
      generatedQuestions.push({
        text: `Каким химическим символом обозначается элемент ${item.name}?`,
        options: symOptions,
        correct_answer: symOptions.indexOf(item.symbol),
        category: 'Блиц-вопросы'
      });
    } else {
      // Обратный
      const nameDistractors = getDistractors(allElementNames, item.name, 3);
      const nameOptions = shuffle([item.name, ...nameDistractors]);
      generatedQuestions.push({
        text: `Какой химический элемент обозначается символом ${item.symbol}?`,
        options: nameOptions,
        correct_answer: nameOptions.indexOf(item.name),
        category: 'Блиц-вопросы'
      });
    }
  });

  // 4. Литература: Авторы и произведения (50 уникальных книг)
  FACTS.literature.forEach((item, index) => {
    if (index % 2 === 0) {
      // Прямой
      const authDistractors = getDistractors(allAuthors, item.author, 3);
      const authOptions = shuffle([item.author, ...authDistractors]);
      generatedQuestions.push({
        text: `Кто является автором знаменитого произведения «${item.book}»?`,
        options: authOptions,
        correct_answer: authOptions.indexOf(item.author),
        category: 'Блиц-вопросы'
      });
    } else {
      // Обратный
      const bookDistractors = getDistractors(allBooks, item.book, 3);
      const bookOptions = shuffle([item.book, ...bookDistractors]);
      generatedQuestions.push({
        text: `Какую известную книгу написал писатель ${item.author}?`,
        options: bookOptions,
        correct_answer: bookOptions.indexOf(item.book),
        category: 'Блиц-вопросы'
      });
    }
  });

  // 5. История: События и Годы (50 уникальных событий)
  FACTS.history.forEach((item, index) => {
    if (index % 2 === 0) {
      // Прямой
      const yrDistractors = getYearDistractors(item.year, 3);
      const displayYear = (y) => parseInt(y) < 0 ? `${Math.abs(parseInt(y))} г. до н.э.` : `${y} год`;
      const correctStr = displayYear(item.year);
      const formattedOptions = shuffle([item.year, ...yrDistractors]).map(y => displayYear(y));
      
      generatedQuestions.push({
        text: `В каком году произошло историческое событие: ${item.event}?`,
        options: formattedOptions,
        correct_answer: formattedOptions.indexOf(correctStr),
        category: 'Блиц-вопросы'
      });
    } else {
      // Обратный
      const evDistractors = getDistractors(allHistoricalEvents, item.event, 3);
      const evOptions = shuffle([item.event, ...evDistractors]);
      const yrStr = item.year < 0 ? `${Math.abs(item.year)} году до нашей эры` : `${item.year} году`;
      generatedQuestions.push({
        text: `Какое известное историческое событие произошло в ${yrStr}?`,
        options: evOptions,
        correct_answer: evOptions.indexOf(item.event),
        category: 'Блиц-вопросы'
      });
    }
  });

  // 6. Наука: Ученые и их открытия (40 уникальных открытий)
  FACTS.science.forEach((item, index) => {
    if (index % 2 === 0) {
      // Прямой
      const sciDistractors = getDistractors(allScientists, item.scientist, 3);
      const sciOptions = shuffle([item.scientist, ...sciDistractors]);
      generatedQuestions.push({
        text: `Какой ученый вошел в историю благодаря открытию или разработке: ${item.discovery}?`,
        options: sciOptions,
        correct_answer: sciOptions.indexOf(item.scientist),
        category: 'Блиц-вопросы'
      });
    } else {
      // Обратный
      const discDistractors = getDistractors(allDiscoveries, item.discovery, 3);
      const discOptions = shuffle([item.discovery, ...discDistractors]);
      generatedQuestions.push({
        text: `Какое выдающееся научное достижение или открытие принадлежит ученому по имени ${item.scientist}?`,
        options: discOptions,
        correct_answer: discOptions.indexOf(item.discovery),
        category: 'Блиц-вопросы'
      });
    }
  });

  // 7. Искусство: Живописцы и шедевры (30 уникальных картин)
  FACTS.art.forEach((item, index) => {
    if (index % 2 === 0) {
      // Прямой
      const paintDistractors = getDistractors(allPainters, item.painter, 3);
      const paintOptions = shuffle([item.painter, ...paintDistractors]);
      generatedQuestions.push({
        text: `Кто является автором всемирно известной картины «${item.painting}»?`,
        options: paintOptions,
        correct_answer: paintOptions.indexOf(item.painter),
        category: 'Блиц-вопросы'
      });
    } else {
      // Обратный
      const ptgDistractors = getDistractors(allPaintings, item.painting, 3);
      const ptgOptions = shuffle([item.painting, ...ptgDistractors]);
      generatedQuestions.push({
        text: `Какое из этих знаменитых произведений искусства написал художник ${item.painter}?`,
        options: ptgOptions,
        correct_answer: ptgOptions.indexOf(item.painting),
        category: 'Блиц-вопросы'
      });
    }
  });

  // 8. Астрономия: Космос и планеты (30 уникальных фактов)
  FACTS.astronomy.forEach((item, index) => {
    if (index % 2 === 0) {
      // Прямой
      const bodyDistractors = getDistractors(allBodies, item.body, 3);
      const bodyOptions = shuffle([item.body, ...bodyDistractors]);
      generatedQuestions.push({
        text: `Какое космическое тело характеризуется следующим образом: «${item.feature}»?`,
        options: bodyOptions,
        correct_answer: bodyOptions.indexOf(item.body),
        category: 'Блиц-вопросы'
      });
    } else {
      // Обратный
      const featDistractors = getDistractors(allFeatures, item.feature, 3);
      const featOptions = shuffle([item.feature, ...featDistractors]);
      generatedQuestions.push({
        text: `Какая ключевая характеристика или статус в Солнечной системе принадлежит объекту ${item.body}?`,
        options: featOptions,
        correct_answer: featOptions.indexOf(item.feature),
        category: 'Блиц-вопросы'
      });
    }
  });

  // 9. Рекорды природы и биология (40 уникальных фактов)
  FACTS.biology.forEach((item, index) => {
    if (index % 2 === 0) {
      // Вопрос о теле по его рекорду
      const bodyDistractors = getDistractors(allBiologyBodies, item.body, 3);
      const bodyOptions = shuffle([item.body, ...bodyDistractors]);
      generatedQuestions.push({
        text: `Какое животное или растение ставит следующий рекорд природы: «${item.feature}»?`,
        options: bodyOptions,
        correct_answer: bodyOptions.indexOf(item.body),
        category: 'Блиц-вопросы'
      });
    } else {
      // Вопрос о рекорде конкретного тела
      const featDistractors = getDistractors(allBiologyFeatures, item.feature, 3);
      const featOptions = shuffle([item.feature, ...featDistractors]);
      generatedQuestions.push({
        text: `Каким уникальным достижением или рекордом природы славится ${item.body}?`,
        options: featOptions,
        correct_answer: featOptions.indexOf(item.feature),
        category: 'Блиц-вопросы'
      });
    }
  });

  // 10. Географические рекорды Земли (40 уникальных фактов)
  FACTS.geography_records.forEach((item, index) => {
    if (index % 2 === 0) {
      // Вопрос об объекте
      const bodyDistractors = getDistractors(allGeographyBodies, item.body, 3);
      const bodyOptions = shuffle([item.body, ...bodyDistractors]);
      generatedQuestions.push({
        text: `Какой географический объект на нашей планете описывается как «${item.feature}»?`,
        options: bodyOptions,
        correct_answer: bodyOptions.indexOf(item.body),
        category: 'Блиц-вопросы'
      });
    } else {
      // Вопрос о рекорде
      const featDistractors = getDistractors(allGeographyFeatures, item.feature, 3);
      const featOptions = shuffle([item.feature, ...featDistractors]);
      generatedQuestions.push({
        text: `Каким выдающимся статусом или рекордом на Земле обладает ${item.body}?`,
        options: featOptions,
        correct_answer: featOptions.indexOf(item.feature),
        category: 'Блиц-вопросы'
      });
    }
  });

  // Перемешиваем сгенерированные шаблонные вопросы, чтобы темы шли вразнобой
  const shuffledGenerated = shuffle(generatedQuestions);

  // Назначаем новые сквозные ID с учетом 25 базовых вопросов
  const finalQuestions = [...baseQuestions];
  let nextId = finalQuestions.length + 1;

  shuffledGenerated.forEach(q => {
    finalQuestions.push({
      id: nextId++,
      ...q
    });
  });

  // Записываем финальный результат
  fs.writeFileSync(targetFile, JSON.stringify(finalQuestions, null, 2), 'utf8');
  
  console.log(`\n=== Генерация успешно завершена! ===`);
  console.log(`Итого вопросов в базе «Блиц-вопросы»: ${finalQuestions.length} шт.`);
  console.log(`(Из них базовых вопросов с картинками: ${baseQuestions.length}, уникальных сгенерированных: ${shuffledGenerated.length})`);
}

main().catch(err => {
  console.error('Ошибка в процессе генерации:', err);
});
