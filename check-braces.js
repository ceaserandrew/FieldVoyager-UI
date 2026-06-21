const fs = require('fs');
const content = fs.readFileSync('src/components/MapCanvas.tsx', 'utf8');

let braces = 0;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  for (let char of line) {
    if (char === '{') braces++;
    if (char === '}') braces--;
  }
}
console.log("Overall Balance:", braces);

// Detailed function tracer
let stack = [];
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  for (let char of line) {
    if (char === '{') {
      stack.push(i + 1);
    } else if (char === '}') {
      if (stack.length === 0) {
        console.log(`Extra closing brace at line ${i + 1}`);
      } else {
        stack.pop();
      }
    }
  }
}
console.log("Unclosed opening braces at lines:", stack);
