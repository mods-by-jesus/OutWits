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
        
        // Pick 3 random wrong answers
        const pool = allAnswers.filter(a => a !== capital);
        const wrong = shuffle(pool).slice(0, 3);
        
        const options = shuffle([capital, ...wrong]);
        const correct_answer = options.indexOf(capital);
        
        return {
          category: 'География',
          text: `Какой город является столицей государства ${country}?`,
          options,
          correct_answer
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
        
        const pool = allAnswers.filter(a => a !== continent);
        const wrong = shuffle(pool).slice(0, 3);
        
        // Pad with fake continents if we don't have enough
        while(wrong.length < 3) wrong.push(shuffle(['Евразия', 'Африка', 'Северная Америка', 'Южная Америка', 'Австралия', 'Антарктида'])[0]);
        
        const options = shuffle([...new Set([continent, ...wrong])]);
        while (options.length < 4) {
          options.push(shuffle(['Евразия', 'Африка', 'Северная Америка', 'Южная Америка', 'Австралия', 'Антарктида']).find(x => !options.includes(x)));
        }
        const correct_answer = options.indexOf(continent);
        
        return {
          category: 'География',
          text: `На каком материке (или части света) расположена страна ${country}?`,
          options,
          correct_answer
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
        
        const pool = allAnswers.filter(a => a !== element);
        const wrong = shuffle(pool).slice(0, 3);
        
        const options = shuffle([element, ...wrong]);
        const correct_answer = options.indexOf(element);
        
        return {
          category: 'Наука',
          text: `Какой химический элемент обозначается символом ${symbol}?`,
          options,
          correct_answer
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
        
        const pool = allAnswers.filter(a => a !== symbol);
        const wrong = shuffle(pool).slice(0, 3);
        
        const options = shuffle([symbol, ...wrong]);
        const correct_answer = options.indexOf(symbol);
        
        return {
          category: 'Наука',
          text: `Какой символ у химического элемента ${element}?`,
          options,
          correct_answer
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
      SELECT DISTINCT ?filmLabel ?directorLabel WHERE {
        ?film wdt:P31 wd:Q11424.
        ?film wdt:P57 ?director.
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
        
        const pool = allAnswers.filter(a => a !== director);
        const wrong = shuffle(pool).slice(0, 3);
        
        const options = shuffle([director, ...wrong]);
        const correct_answer = options.indexOf(director);
        
        return {
          category: 'Искусство и Культура',
          text: `Кто является режиссером фильма «${film}»?`,
          options,
          correct_answer
        };
      });
    }
  },
  {
    categoryFile: CATEGORIES.CULTURE,
    categoryName: 'Искусство и Культура',
    name: 'Известные писатели',
    query: `
      SELECT DISTINCT ?bookLabel ?authorLabel WHERE {
        ?book wdt:P31 wd:Q7725634.
        ?book wdt:P50 ?author.
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
        
        const pool = allAnswers.filter(a => a !== author);
        const wrong = shuffle(pool).slice(0, 3);
        
        const options = shuffle([author, ...wrong]);
        const correct_answer = options.indexOf(author);
        
        return {
          category: 'Искусство и Культура',
          text: `Кто написал произведение «${book}»?`,
          options,
          correct_answer
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
        
        const pool = allAnswers.filter(a => a !== dev);
        const wrong = shuffle(pool).slice(0, 3);
        
        const options = shuffle([dev, ...wrong]);
        const correct_answer = options.indexOf(dev);
        
        return {
          category: 'Игры и Технологии',
          text: `Какая компания/студия разработала игру «${game}»?`,
          options,
          correct_answer
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
        // Basic sanity check: ensure we have 4 options and they are unique strings
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

  // Запись в файлы
  console.log('\n--- Очистка старых файлов и запись новых ---');
  
  for (const [filename, questions] of Object.entries(resultsByFile)) {
    const filePath = path.join(QUESTIONS_DIR, filename);
    
    // Assign incremental IDs
    const finalQuestions = questions.map((q, idx) => ({
      id: idx + 1,
      text: q.text,
      options: q.options,
      correct_answer: q.correct_answer,
      category: q.category
    }));

    fs.writeFileSync(filePath, JSON.stringify(finalQuestions, null, 2), 'utf-8');
    console.log(`[+] Файл ${filename} успешно очищен и перезаписан: ${finalQuestions.length} вопросов`);
  }
  
  // Очистка нетронутых файлов (History, Sport, Famous) чтобы не было путаницы
  // Мы их пока оставим пустыми или добавим базовые заглушки
  for (const file of Object.values(CATEGORIES)) {
    if (!resultsByFile[file]) {
      const filePath = path.join(QUESTIONS_DIR, file);
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
      console.log(`[!] Файл ${file} очищен (нет генераторов)`);
    }
  }

  console.log('\nГенерация завершена успешно!');
}

main();
