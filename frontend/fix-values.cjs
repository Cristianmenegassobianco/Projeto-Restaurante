const fs = require('fs');
const path = require('path');

const filesToFix = [
  'c:/Users/Cristian/Documents/Projeto Restaurante/frontend/src/pages/Reports.jsx',
  'c:/Users/Cristian/Documents/Projeto Restaurante/frontend/src/pages/Payment.jsx'
];

filesToFix.forEach(p => {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Na página de Payment, substituir var(--primary) em spans/divs de valores
    if (p.includes('Payment.jsx')) {
      content = content.replace(/color:\s*['"]var\(--primary\)['"]([^>]*?>\s*R\$)/g, "color: 'white'$1");
      content = content.replace(/color:\s*['"]var\(--primary\)['"]([^>]*?>.*?toFixed)/g, "color: 'white'$1");
      content = content.replace(/color:\s*['"]var\(--success\)['"]([^>]*?>\s*R\$)/g, "color: 'white'$1");
      content = content.replace(/color:\s*['"]var\(--danger\)['"]([^>]*?>\s*R\$)/g, "color: 'white'$1");
    }

    if (p.includes('Reports.jsx')) {
      content = content.replace(/color:\s*['"]#2196f3['"]/g, "color: 'white'");
      content = content.replace(/color:\s*['"]#9c27b0['"]/g, "color: 'white'");
      content = content.replace(/color:\s*['"]#ff9800['"]/g, "color: 'white'");
      // sales.total
      content = content.replace(/color:\s*['"]var\(--success\)['"]([^>]*?>[^<]*?data\.sales\.total)/g, "color: 'white'$1");
      // totalIn
      content = content.replace(/color:\s*['"]var\(--success\)['"]([^>]*?>[^<]*?totalIn)/g, "color: 'white'$1");
      // totalOut
      content = content.replace(/color:\s*['"]var\(--danger\)['"]([^>]*?>[^<]*?totalOut)/g, "color: 'white'$1");
    }

    fs.writeFileSync(p, content);
    console.log('Updated ' + path.basename(p));
  }
});
