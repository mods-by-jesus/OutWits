const fs = require('fs');
let code = fs.readFileSync('generate_wikidata.cjs', 'utf8');

const moviesObj = `  {
    categoryFile: CATEGORIES.CULTURE,
    categoryName: 'Искусство и Культура',
    name: 'Кадры из фильмов',
    query: \`
      SELECT DISTINCT ?movieLabel ?image WHERE {
        ?movie wdt:P31 wd:Q11424.
        ?movie wdt:P18 ?image.
        ?movie wikibase:sitelinks ?sitelinks.
        FILTER(?sitelinks > 50)
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } ORDER BY DESC(?sitelinks) LIMIT 300
    \`,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[а-яА-Я]/.test(b.movieLabel?.value) && b.image?.value && !/^Q\\d+$/.test(b.movieLabel.value));
      const allAnswers = [...new Set(filteredBindings.map(b => b.movieLabel.value))];
      return filteredBindings.map(b => {
        const movie = b.movieLabel.value;
        const image = b.image.value.replace('http://', 'https://');
        
        const wrong = shuffle(allAnswers.filter(a => a !== movie)).slice(0, 3);
        const options = shuffle([movie, ...wrong]);
        
        return {
          category: 'Искусство и Культура',
          text: 'Кадр из какого фильма представлен на изображении / постере?',
          options,
          correct_answer: options.indexOf(movie),
          image
        };
      });
    }
  },
`;

const paintingsObj = `  {
    categoryFile: CATEGORIES.CULTURE,
    categoryName: 'Искусство и Культура',
    name: 'Картины',
    query: \`
      SELECT DISTINCT ?paintingLabel ?authorLabel ?image WHERE {
        VALUES ?museum { wd:Q19675 wd:Q132783 wd:Q160236 wd:Q213332 wd:Q200325 wd:Q171400 wd:Q145906 wd:Q190804 }
        ?painting wdt:P195 ?museum.
        ?painting wdt:P31 wd:Q3305213.
        ?painting wdt:P18 ?image.
        ?painting wdt:P50 ?author.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } LIMIT 400
    \`,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[а-яА-Я]/.test(b.authorLabel?.value) && b.image?.value && !/^Q\\d+$/.test(b.authorLabel.value));
      const allAnswers = [...new Set(filteredBindings.map(b => b.authorLabel.value))];
      return filteredBindings.map(b => {
        const author = b.authorLabel.value;
        const image = b.image.value.replace('http://', 'https://');
        
        const wrong = shuffle(allAnswers.filter(a => a !== author)).slice(0, 3);
        const options = shuffle([author, ...wrong]);
        
        return {
          category: 'Искусство и Культура',
          text: 'Кто является автором (художником) данной картины?',
          options,
          correct_answer: options.indexOf(author),
          image
        };
      });
    }
  },
`;

const charsObj = `  {
    categoryFile: CATEGORIES.IT,
    categoryName: 'Игры и Технологии',
    name: 'Персонажи игр',
    query: \`
      SELECT DISTINCT ?charLabel ?gameLabel ?image WHERE {
        ?char wdt:P31/wdt:P279* wd:Q95074.
        ?char wdt:P18 ?image.
        ?char wdt:P1441 ?game.
        ?game wdt:P31 wd:Q7889.
        ?char wikibase:sitelinks ?sitelinks.
        FILTER(?sitelinks > 2)
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
      } ORDER BY DESC(?sitelinks) LIMIT 300
    \`,
    process: (bindings) => {
      const filteredBindings = bindings.filter(b => /[a-zA-Zа-яА-Я]/.test(b.charLabel?.value) && b.image?.value && !/^Q\\d+$/.test(b.charLabel.value));
      const allAnswers = [...new Set(filteredBindings.map(b => b.charLabel.value))];
      return filteredBindings.map(b => {
        const char = b.charLabel.value;
        const game = b.gameLabel?.value || '';
        const image = b.image.value.replace('http://', 'https://');
        
        const wrong = shuffle(allAnswers.filter(a => a !== char)).slice(0, 3);
        const options = shuffle([char, ...wrong]);
        
        const qText = game && /[a-zA-Zа-яА-Я]/.test(game) && !/^Q\\d+$/.test(game)
          ? \`Как зовут этого персонажа из игры «\${game}»?\`
          : 'Как зовут этого персонажа из видеоигры?';
          
        return {
          category: 'Игры и Технологии',
          text: qText,
          options,
          correct_answer: options.indexOf(char),
          image
        };
      });
    }
  },
`;

code = code.replace(/name: 'Известные писатели',\s*query:/, paintingsObj + moviesObj + `  {
    categoryFile: CATEGORIES.CULTURE,
    categoryName: 'Искусство и Культура',
    name: 'Известные писатели',
    query:`);

code = code.replace(/name: 'Разработчики игр',\s*query:/, charsObj + `  {
    categoryFile: CATEGORIES.IT,
    categoryName: 'Игры и Технологии',
    name: 'Разработчики игр',
    query:`);

fs.writeFileSync('generate_wikidata.cjs', code);
console.log('Done');
