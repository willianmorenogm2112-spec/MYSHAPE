const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf-8');
text = text.replace(/\\`/g, '`');
text = text.replace(/\\\$/g, '$');
fs.writeFileSync('src/App.tsx', text);
console.log('App.tsx unescaped.');
