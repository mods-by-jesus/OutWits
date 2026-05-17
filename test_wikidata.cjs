const https = require('https');

const query = `
  SELECT ?countryLabel ?capitalLabel WHERE {
    ?country wdt:P31 wd:Q6256.
    ?country wdt:P36 ?capital.
    SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
  } LIMIT 10
`;

const url = 'https://query.wikidata.org/sparql?query=' + encodeURIComponent(query);
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
    console.log("Status:", res.statusCode);
    console.log("Data:", data.substring(0, 500));
  });
});
