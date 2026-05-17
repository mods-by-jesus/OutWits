const https = require('https');
https.get('https://raw.githubusercontent.com/BazaOtvetov/millionaire/master/questions.json', (res) => {
  console.log('Status: ' + res.statusCode);
});
