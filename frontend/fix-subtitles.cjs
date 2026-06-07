const fs = require('fs');
const path = require('path');

const filesToFix = [
  'Admin.jsx',
  'Payment.jsx',
  'Reports.jsx',
  'MenuManagement.jsx',
  'Kitchen.jsx'
];

filesToFix.forEach(f => {
  let p = path.join('c:/Users/Cristian/Documents/Projeto Restaurante/frontend/src/pages', f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Replace var(--text-muted) and var(--text-secondary) with white inside the admin pages
    content = content.replace(/color:\s*['"]var\(--text-muted\)['"]/g, "color: 'white'");
    content = content.replace(/color:\s*['"]var\(--text-secondary\)['"]/g, "color: 'white'");
    
    // Also change any var(--primary) that might have been left on subtitles
    content = content.replace(/color:\s*['"]var\(--primary\)['"]/g, "color: 'white'");
    
    fs.writeFileSync(p, content);
    console.log('Updated ' + f);
  }
});
