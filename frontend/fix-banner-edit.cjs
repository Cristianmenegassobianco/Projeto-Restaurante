const fs = require('fs');
const path = require('path');

const filePath = path.join('c:/Users/Cristian/Documents/Projeto Restaurante/frontend/src/pages', 'MenuManagement.jsx');

let content = fs.readFileSync(filePath, 'utf8');

// 1. Add editingBanner state
if (!content.includes('editingBanner, setEditingBanner')) {
  content = content.replace(
    /const \[bannerUploadingImage, setBannerUploadingImage\] = useState\(false\);/,
    "const [bannerUploadingImage, setBannerUploadingImage] = useState(false);\n  const [editingBanner, setEditingBanner] = useState(null);"
  );
}

// 2. Add handleEditBannerClick and handleCancelEditBanner
if (!content.includes('handleEditBannerClick')) {
  const funcToAdd = `
  const handleEditBannerClick = (banner) => {
    setEditingBanner(banner);
    setNewBannerTitle(banner.title);
    setNewBannerSubtitle(banner.subtitle || '');
    setNewBannerImageUrl(banner.image_url);
    setNewBannerBadge(banner.badge || '');
  };

  const handleCancelEditBanner = () => {
    setEditingBanner(null);
    setNewBannerTitle('');
    setNewBannerSubtitle('');
    setNewBannerImageUrl('');
    setNewBannerBadge('');
  };
`;
  content = content.replace(/const fetchBanners = async \(\) => \{/, funcToAdd + '\n  const fetchBanners = async () => {');
}

// 3. Replace handleAddBanner completely
const handleAddBannerRegex = /const handleAddBanner = async \(e\) => \{[\s\S]*?setBannerLoading\(false\);\n  \};/;
const newHandleAddBanner = `const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerImageUrl) {
      toast.error('Título e URL da imagem são obrigatórios.');
      return;
    }
    setBannerLoading(true);
    
    if (editingBanner) {
      try {
        const res = await fetch(\`/api/banners/\${editingBanner.id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newBannerTitle,
            subtitle: newBannerSubtitle,
            image_url: newBannerImageUrl,
            badge: newBannerBadge
          })
        });
        if (res.ok) {
          toast.success('Banner atualizado com sucesso!');
          handleCancelEditBanner();
          fetchBanners();
        } else {
          toast.error('Erro ao atualizar banner.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro de conexão.');
      }
    } else {
      try {
        const res = await fetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newBannerTitle,
            subtitle: newBannerSubtitle,
            image_url: newBannerImageUrl,
            badge: newBannerBadge
          })
        });
        if (res.ok) {
          toast.success('Banner adicionado com sucesso!');
          setNewBannerTitle('');
          setNewBannerSubtitle('');
          setNewBannerImageUrl('');
          setNewBannerBadge('');
          fetchBanners();
        } else {
          toast.error('Erro ao adicionar banner.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro de conexão.');
      }
    }
    setBannerLoading(false);
  };`;
content = content.replace(handleAddBannerRegex, newHandleAddBanner);

// 4. Update the Form Title
content = content.replace(
  /<h2 style=\{\{ color: 'var\(--text-main\)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' \}\}>\s*<Image size=\{20\} \/> Adicionar Banner\s*<\/h2>/,
  `<h2 style={{ color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image size={20} /> {editingBanner ? 'Editar Banner' : 'Adicionar Banner'}
            </h2>`
);

// 5. Update the submit button
const submitBtnRegex = /<button type="submit" className="btn btn-primary" disabled=\{bannerLoading\}>\s*\{bannerLoading \? 'Salvando...' : 'Adicionar Banner'\}\s*<\/button>/;
const newSubmitBtn = `<div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" disabled={bannerLoading} style={{ flex: 1 }}>
                  {bannerLoading ? 'Salvando...' : (editingBanner ? 'Atualizar Banner' : 'Adicionar Banner')}
                </button>
                {editingBanner && (
                  <button type="button" className="btn btn-outline" onClick={handleCancelEditBanner} style={{ flex: 1, borderColor: 'var(--border)', color: 'white' }}>
                    Cancelar Edição
                  </button>
                )}
              </div>`;
content = content.replace(submitBtnRegex, newSubmitBtn);

// 6. Add Edit button to the list
const deleteBtnRegex = /<button\s*onClick=\{\(\) => setConfirmDeleteBannerId\(banner\.id\)\}\s*style=\{\{ padding: '8px', background: 'rgba\(244,67,54,0\.1\)', border: '1px solid var\(--danger\)', borderRadius: '6px', color: 'var\(--danger\)', cursor: 'pointer', flexShrink: 0 \}\}\s*title="Remover banner"\s*>\s*<Trash2 size=\{16\} \/>\s*<\/button>/;

const newDeleteBtn = `<button
                        onClick={() => handleEditBannerClick(banner)}
                        style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', cursor: 'pointer', flexShrink: 0, marginRight: '8px' }}
                        title="Editar banner"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteBannerId(banner.id)}
                        style={{ padding: '8px', background: 'rgba(244,67,54,0.1)', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer', flexShrink: 0 }}
                        title="Remover banner"
                      >
                        <Trash2 size={16} />
                      </button>`;
content = content.replace(deleteBtnRegex, newDeleteBtn);

fs.writeFileSync(filePath, content);
console.log('Banner edit implemented successfully');
