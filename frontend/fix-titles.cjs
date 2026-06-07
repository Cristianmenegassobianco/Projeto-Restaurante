const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Cristian/Documents/Projeto Restaurante/frontend/src/pages';
const files = fs.readdirSync(dir);

files.forEach(f => {
  if (f.endsWith('.jsx')) {
    let p = path.join(dir, f);
    let content = fs.readFileSync(p, 'utf8');
    
    // Substitui color: 'var(--primary)' por color: 'var(--text-main)' (Bege) dentro de tags h1, h2, h3, h4, h5, h6
    let newContent = content.replace(/(<h[1-6][^>]*?color:\s*)['"]var\(--primary\)['"]([^>]*?>)/g, "$1'var(--text-main)'$2");
    
    if (newContent !== content) {
      fs.writeFileSync(p, newContent);
      console.log('Updated ' + f);
    }
  }
});
