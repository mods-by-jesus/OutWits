const https = require('https');
https.get('https://raw.githubusercontent.com/KlonD90/millionaire/master/questions.json', (res) => {
  if(res.statusCode !== 200) { console.log('not found 1'); return; }
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Found 1! Length: ' + data.length));
});
