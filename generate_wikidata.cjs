const fs = require('fs');
const path = require('path');
const https = require('https');

const CATEGORIES = {
  GEOGRAPHY: 'geography.json',
  SCIENCE: 'science.json',
  CULTURE: 'culture.json',
  IT: 'it_games.json',
  HISTORY: 'history.json',
  SPORT: 'sport.json',
  FAMOUS: 'famous_people.json',
};

const QUESTIONS_DIR = path.join(__dirname, 'server', 'questions');

// Helpers
function shuffle(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function getRandomTemplate(templates, data) {
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template(data);
}

function fetchWikidata(sparqlQuery) {
  return new Promise((resolve, reject) => {
    const url = 'https://query.wikidata.org/sparql?query=' + encodeURIComponent(sparqlQuery);
    const options = {
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'OutWitsTriviaGame/1.0 (https://github.com/mods-by-jesus/OutWits)'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.results.bindings);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Generators definition
const generators = [
  // ---------------- GEOGRAPHY ----------------
  {
    categoryFile: CATEGORIES.GEOGRAPHY,
    categoryName: 'География',
    name: 'Столицы мира',
    query: `
      SELECT ?countryLabel ?capitalLabel WHERE {
        ?country wdt:P31 wd:Q6256.
        ?country wdt:P36 ?capital.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } LIMIT 300
    `,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[а-яА-Я]/.test(b.countryLabel?.value) && /[а-яА-Я]/.test(b.capitalLabel?.value));
      const allAnswers = [...new Set(filteredBindings.map(b => b.capitalLabel.value))];
      return filteredBindings.map(b => {
        const country = b.countryLabel.value;
        const capital = b.capitalLabel.value;
        
        const wrong = shuffle(allAnswers.filter(a => a !== capital)).slice(0, 3);
        const options = shuffle([capital, ...wrong]);
        
        const templates = [
          (c) => `Какой город является столицей государства ${c}?`,
          (c) => `Назовите столицу страны ${c}.`,
          (c) => `Главным городом и столицей государства ${c} является:`,
          (c) => `В каком городе находится правительство страны ${c}?`
        ];
        
        return {
          category: 'География',
          text: getRandomTemplate(templates, country),
          options,
          correct_answer: options.indexOf(capital)
        };
      });
    }
  },
  {
    categoryFile: CATEGORIES.GEOGRAPHY,
    categoryName: 'География',
    name: 'Континенты',
    query: `
      SELECT ?countryLabel ?continentLabel WHERE {
        ?country wdt:P31 wd:Q6256.
        ?country wdt:P30 ?continent.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } LIMIT 300
    `,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[а-яА-Я]/.test(b.countryLabel?.value) && /[а-яА-Я]/.test(b.continentLabel?.value));
      const allAnswers = [...new Set(filteredBindings.map(b => b.continentLabel.value))];
      return filteredBindings.map(b => {
        const country = b.countryLabel.value;
        const continent = b.continentLabel.value;
        
        const wrong = shuffle(allAnswers.filter(a => a !== continent)).slice(0, 3);
        while(wrong.length < 3) wrong.push(shuffle(['Евразия', 'Африка', 'Северная Америка', 'Южная Америка', 'Австралия', 'Антарктида'])[0]);
        
        const options = shuffle([...new Set([continent, ...wrong])]);
        while (options.length < 4) options.push(shuffle(['Евразия', 'Африка', 'Северная Америка', 'Южная Америка', 'Австралия', 'Антарктида']).find(x => !options.includes(x)));
        
        const templates = [
          (c) => `На каком материке (или части света) расположена страна ${c}?`,
          (c) => `Частью какого континента является ${c}?`,
          (c) => `Если вы отправитесь в государство ${c}, на какой континент вы попадете?`
        ];
        
        return {
          category: 'География',
          text: getRandomTemplate(templates, country),
          options,
          correct_answer: options.indexOf(continent)
        };
      });
    }
  },

  // ---------------- SCIENCE ----------------
  {
    categoryFile: CATEGORIES.SCIENCE,
    categoryName: 'Наука',
    name: 'Химические элементы (символы)',
    query: `
      SELECT ?elementLabel ?symbol WHERE {
        ?element wdt:P31 wd:Q11344.
        ?element wdt:P246 ?symbol.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } LIMIT 200
    `,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[а-яА-Я]/.test(b.elementLabel?.value));
      const allAnswers = [...new Set(filteredBindings.map(b => b.elementLabel.value))];
      return filteredBindings.map(b => {
        const element = b.elementLabel.value;
        const symbol = b.symbol.value;
        
        const wrong = shuffle(allAnswers.filter(a => a !== element)).slice(0, 3);
        const options = shuffle([element, ...wrong]);
        
        const templates = [
          (s) => `Какой химический элемент обозначается символом ${s}?`,
          (s) => `В таблице Менделеева под символом ${s} скрывается:`,
          (s) => `Назовите элемент, имеющий химический символ ${s}.`
        ];
        
        return {
          category: 'Наука',
          text: getRandomTemplate(templates, symbol),
          options,
          correct_answer: options.indexOf(element)
        };
      });
    }
  },
  {
    categoryFile: CATEGORIES.SCIENCE,
    categoryName: 'Наука',
    name: 'Химические элементы (обратный)',
    query: `
      SELECT ?elementLabel ?symbol WHERE {
        ?element wdt:P31 wd:Q11344.
        ?element wdt:P246 ?symbol.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } LIMIT 200
    `,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[а-яА-Я]/.test(b.elementLabel?.value));
      const allAnswers = [...new Set(filteredBindings.map(b => b.symbol.value))];
      return filteredBindings.map(b => {
        const element = b.elementLabel.value;
        const symbol = b.symbol.value;
        
        const wrong = shuffle(allAnswers.filter(a => a !== symbol)).slice(0, 3);
        const options = shuffle([symbol, ...wrong]);
        
        const templates = [
          (e) => `Какой символ у химического элемента ${e}?`,
          (e) => `Как в периодической таблице обозначается ${e}?`,
          (e) => `Химический знак для элемента ${e} — это:`
        ];
        
        return {
          category: 'Наука',
          text: getRandomTemplate(templates, element),
          options,
          correct_answer: options.indexOf(symbol)
        };
      });
    }
  },

  // ---------------- CULTURE ----------------
  {
    categoryFile: CATEGORIES.CULTURE,
    categoryName: 'Искусство и Культура',
    name: 'Режиссеры кассовых фильмов',
    query: `
      SELECT DISTINCT ?filmLabel ?directorLabel ?image WHERE {
        ?film wdt:P31 wd:Q11424.
        ?film wdt:P57 ?director.
        OPTIONAL { ?director wdt:P18 ?image. }
        ?film wdt:P2130 ?boxOffice.
        FILTER(?boxOffice > 200000000)
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } LIMIT 300
    `,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[а-яА-Я]/.test(b.filmLabel?.value) && /[а-яА-Я]/.test(b.directorLabel?.value));
      const allAnswers = [...new Set(filteredBindings.map(b => b.directorLabel.value))];
      return filteredBindings.map(b => {
        const film = b.filmLabel.value;
        const director = b.directorLabel.value;
        
        const wrong = shuffle(allAnswers.filter(a => a !== director)).slice(0, 3);
        const options = shuffle([director, ...wrong]);
        
        const templates = [
          (f) => `Кто является режиссером фильма «${f}»?`,
          (f) => `Кто снял знаменитую картину «${f}»?`,
          (f) => `Режиссерское кресло фильма «${f}» занимал:`
        ];
        
        return {
          category: 'Искусство и Культура',
          text: getRandomTemplate(templates, film),
          options,
          correct_answer: options.indexOf(director),
          image: b.image?.value ? b.image.value.replace('http://', 'https://') : undefined
        };
      });
    }
  },
  {
    categoryFile: CATEGORIES.CULTURE,
    categoryName: 'Искусство и Культура',
    name: 'Известные писатели',
    query: `
      SELECT DISTINCT ?bookLabel ?authorLabel ?image WHERE {
        ?book wdt:P31 wd:Q7725634.
        ?book wdt:P50 ?author.
        OPTIONAL { ?author wdt:P18 ?image. }
        ?sitelink schema:about ?book ; schema:isPartOf <https://ru.wikipedia.org/> .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } LIMIT 300
    `,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[а-яА-Я]/.test(b.bookLabel?.value) && /[а-яА-Я]/.test(b.authorLabel?.value));
      const allAnswers = [...new Set(filteredBindings.map(b => b.authorLabel.value))];
      return filteredBindings.map(b => {
        const book = b.bookLabel.value;
        const author = b.authorLabel.value;
        
        const wrong = shuffle(allAnswers.filter(a => a !== author)).slice(0, 3);
        const options = shuffle([author, ...wrong]);
        
        const templates = [
          (b) => `Кто написал произведение «${b}»?`,
          (b) => `Автором известной книги «${b}» является:`,
          (b) => `Перу какого писателя принадлежит «${b}»?`
        ];
        
        return {
          category: 'Искусство и Культура',
          text: getRandomTemplate(templates, book),
          options,
          correct_answer: options.indexOf(author),
          image: b.image?.value ? b.image.value.replace('http://', 'https://') : undefined
        };
      });
    }
  },

  // ---------------- IT & GAMES ----------------
  {
    categoryFile: CATEGORIES.IT,
    categoryName: 'Игры и Технологии',
    name: 'Разработчики игр',
    query: `
      SELECT DISTINCT ?gameLabel ?devLabel WHERE {
        ?game wdt:P31 wd:Q7889.
        ?game wdt:P178 ?dev.
        ?sitelink schema:about ?game ; schema:isPartOf <https://ru.wikipedia.org/> .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } LIMIT 300
    `,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[a-zA-Zа-яА-Я]/.test(b.gameLabel?.value) && /[a-zA-Zа-яА-Я]/.test(b.devLabel?.value) && !b.gameLabel.value.includes('Q'));
      const allAnswers = [...new Set(filteredBindings.map(b => b.devLabel.value))];
      return filteredBindings.map(b => {
        const game = b.gameLabel.value;
        const dev = b.devLabel.value;
        
        const wrong = shuffle(allAnswers.filter(a => a !== dev)).slice(0, 3);
        const options = shuffle([dev, ...wrong]);
        
        const templates = [
          (g) => `Какая компания или студия разработала игру «${g}»?`,
          (g) => `Кто является создателем видеоигры «${g}»?`,
          (g) => `Игра «${g}» была выпущена разработчиками из:`
        ];
        
        return {
          category: 'Игры и Технологии',
          text: getRandomTemplate(templates, game),
          options,
          correct_answer: options.indexOf(dev)
        };
      });
    }
  },

  // ---------------- HISTORY ----------------
  {
    categoryFile: CATEGORIES.HISTORY,
    categoryName: 'История',
    name: 'Исторические события',
    query: `
      SELECT DISTINCT ?eventLabel ?year WHERE {
        ?event wdt:P31 wd:Q1190554.
        ?event wdt:P585 ?date.
        BIND(YEAR(?date) AS ?year)
        ?sitelink schema:about ?event ; schema:isPartOf <https://ru.wikipedia.org/> .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } LIMIT 300
    `,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[а-яА-Я]/.test(b.eventLabel?.value));
      const allAnswers = [...new Set(filteredBindings.map(b => b.year.value))];
      return filteredBindings.map(b => {
        const event = b.eventLabel.value;
        const year = b.year.value;
        
        const wrong = shuffle(allAnswers.filter(a => a !== year && Math.abs(parseInt(a) - parseInt(year)) < 300)).slice(0, 3);
        while(wrong.length < 3) wrong.push((parseInt(year) + Math.floor(Math.random() * 100) - 50).toString());
        
        const options = shuffle([year, ...wrong]);
        
        const templates = [
          (e) => `В каком году произошло событие: ${e}?`,
          (e) => `Укажите год, когда случилось следующее: ${e}.`,
          (e) => `Событие «${e}» датируется каким годом?`
        ];
        
        return {
          category: 'История',
          text: getRandomTemplate(templates, event),
          options,
          correct_answer: options.indexOf(year)
        };
      });
    }
  },
  {
    categoryFile: CATEGORIES.HISTORY,
    categoryName: 'История',
    name: 'Изобретатели',
    query: `
      SELECT DISTINCT ?itemLabel ?discovererLabel WHERE {
        ?item wdt:P61 ?discoverer.
        ?sitelink schema:about ?item ; schema:isPartOf <https://ru.wikipedia.org/> .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } LIMIT 300
    `,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[а-яА-Я]/.test(b.itemLabel?.value) && /[а-яА-Я]/.test(b.discovererLabel?.value));
      const allAnswers = [...new Set(filteredBindings.map(b => b.discovererLabel.value))];
      return filteredBindings.map(b => {
        const item = b.itemLabel.value;
        const discoverer = b.discovererLabel.value;
        
        const wrong = shuffle(allAnswers.filter(a => a !== discoverer)).slice(0, 3);
        const options = shuffle([discoverer, ...wrong]);
        
        const templates = [
          (i) => `Кто считается изобретателем или открывателем следующего: ${i}?`,
          (i) => `Кому приписывают создание объекта «${i}»?`,
          (i) => `Открытие «${i}» принадлежит ученому/изобретателю по имени:`
        ];
        
        return {
          category: 'История',
          text: getRandomTemplate(templates, item),
          options,
          correct_answer: options.indexOf(discoverer)
        };
      });
    }
  },

  // ---------------- SPORT ----------------
  {
    categoryFile: CATEGORIES.SPORT,
    categoryName: 'Спорт',
    name: 'Футбольные клубы',
    query: `
      SELECT DISTINCT ?teamLabel ?countryLabel WHERE {
        ?team wdt:P31 wd:Q476028.
        ?team wdt:P17 ?country.
        ?sitelink schema:about ?team ; schema:isPartOf <https://ru.wikipedia.org/> .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } LIMIT 300
    `,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[a-zA-Zа-яА-Я]/.test(b.teamLabel?.value) && /[а-яА-Я]/.test(b.countryLabel?.value) && !b.countryLabel.value.includes('Q'));
      const allAnswers = [...new Set(filteredBindings.map(b => b.countryLabel.value))];
      return filteredBindings.map(b => {
        const team = b.teamLabel.value;
        const country = b.countryLabel.value;
        
        const wrong = shuffle(allAnswers.filter(a => a !== country)).slice(0, 3);
        const options = shuffle([country, ...wrong]);
        
        const templates = [
          (t) => `В какой стране базируется футбольный клуб «${t}»?`,
          (t) => `Клуб «${t}» представляет национальную лигу какого государства?`,
          (t) => `Откуда родом команда «${t}»?`
        ];
        
        return {
          category: 'Спорт',
          text: getRandomTemplate(templates, team),
          options,
          correct_answer: options.indexOf(country)
        };
      });
    }
  },

  // ---------------- FAMOUS PEOPLE ----------------
  {
    categoryFile: CATEGORIES.FAMOUS,
    categoryName: 'Известные личности',
    name: 'Гражданство известных людей',
    query: `
      SELECT DISTINCT ?personLabel ?countryLabel ?image WHERE {
        ?person wdt:P31 wd:Q5.
        ?person wdt:P27 ?country.
        OPTIONAL { ?person wdt:P18 ?image. }
        ?person wikibase:sitelinks ?sitelinks.
        FILTER(?sitelinks > 150)
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } LIMIT 400
    `,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[а-яА-Я]/.test(b.personLabel?.value) && /[а-яА-Я]/.test(b.countryLabel?.value));
      const allAnswers = [...new Set(filteredBindings.map(b => b.countryLabel.value))];
      return filteredBindings.map(b => {
        const person = b.personLabel.value;
        const country = b.countryLabel.value;
        
        const wrong = shuffle(allAnswers.filter(a => a !== country)).slice(0, 3);
        const options = shuffle([country, ...wrong]);
        
        const templates = [
          (p) => `Гражданином какой страны являлся (или является) ${p}?`,
          (p) => `В какой стране родился или жил известный человек по имени ${p}?`,
          (p) => `Укажите страну, к которой относится ${p}:`
        ];
        
        return {
          category: 'Известные личности',
          text: getRandomTemplate(templates, person),
          options,
          correct_answer: options.indexOf(country),
          image: b.image?.value ? b.image.value.replace('http://', 'https://') : undefined
        };
      });
    }
  }
];

async function main() {
  console.log('--- Начинаем программную генерацию базы вопросов ---');
  
  const resultsByFile = {};

  for (const gen of generators) {
    console.log(`[ ] Запуск генератора: ${gen.name}...`);
    try {
      const bindings = await fetchWikidata(gen.query);
      console.log(`    Получено сырых записей: ${bindings.length}`);
      
      const rawQuestions = gen.process(bindings);
      
      // Filter out duplicate text and weird data
      const filtered = [];
      const seen = new Set();
      for (const q of rawQuestions) {
        if (q.options.length !== 4) continue;
        const uniqueOptions = new Set(q.options);
        if (uniqueOptions.size !== 4) continue;
        if (q.text.includes('undefined') || q.options.some(o => typeof o !== 'string' || o.includes('undefined'))) continue;
        if (q.text.length < 10) continue;
        
        if (!seen.has(q.text)) {
          seen.add(q.text);
          filtered.push(q);
        }
      }
      
      console.log(`    Сгенерировано уникальных чистых вопросов: ${filtered.length}`);
      
      if (!resultsByFile[gen.categoryFile]) {
        resultsByFile[gen.categoryFile] = [];
      }
      resultsByFile[gen.categoryFile].push(...filtered);
      
    } catch (e) {
      console.error(`Ошибка при выполнении ${gen.name}:`, e.message);
    }
  }

  console.log('\\n--- Очистка старых файлов и запись новых ---');
  
  for (const [filename, questions] of Object.entries(resultsByFile)) {
    const filePath = path.join(QUESTIONS_DIR, filename);
    
    // Assign incremental IDs
    const finalQuestions = questions.map((q, idx) => {
      const qObj = {
        id: idx + 1,
        text: q.text,
        options: q.options,
        correct_answer: q.correct_answer,
        category: q.category
      };
      if (q.image) {
        qObj.image = q.image;
      }
      return qObj;
    });

    fs.writeFileSync(filePath, JSON.stringify(finalQuestions, null, 2), 'utf-8');
    console.log(`[+] Файл ${filename} успешно перезаписан: ${finalQuestions.length} вопросов`);
  }
  
  console.log('\\nГенерация завершена успешно!');
}

main();
