import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { Check, ChefHat, PlusCircle, Trash2, Image, Star, Edit, X } from 'lucide-react';

const ProductForm = ({ initialData, categories, allProducts = [], onSubmit, onCancel, loading, submitLabel = 'Salvar Produto' }) => {
  const [formData, setFormData] = useState(() => {
    let addImgs = [];
    if (initialData && initialData.additional_images) {
      addImgs = typeof initialData.additional_images === 'string' ? JSON.parse(initialData.additional_images) : initialData.additional_images;
    }
    return initialData ? { ...initialData, additional_images: addImgs } : {
      name: '', category_id: '', price: '', description: '', image_url: '', additional_images: [], card_message: 'Toque para ver detalhes', suggested_products_ids: []
    };
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        additional_images: initialData.additional_images && typeof initialData.additional_images === 'string' ? JSON.parse(initialData.additional_images) : [],
        suggested_products_ids: initialData.suggestedProducts ? initialData.suggestedProducts.map(p => p.id) : []
      });
    } else if (!formData.category_id && categories && categories.length > 0) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }));
    }
  }, [initialData, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formDataObj = new FormData();
    formDataObj.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, image_url: data.imageUrl }));
        toast.success('Imagem enviada com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao enviar imagem.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão ao enviar imagem.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdditionalImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formDataObj = new FormData();
    formDataObj.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, additional_images: [...(prev.additional_images || []), data.imageUrl] }));
        toast.success('Imagem adicional enviada com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao enviar imagem.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão ao enviar imagem.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Nome do Produto *</label>
        <input type="text" name="name" placeholder="Ex: Hambúrguer Duplo" value={formData.name || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Categoria *</label>
          <select name="category_id" value={formData.category_id || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none', height: '42px' }} required>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Preço (R$) *</label>
          <input type="number" name="price" step="0.01" placeholder="Ex: 29.90" value={formData.price || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }} required />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Enviar Arquivo de Imagem</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }} />
          {uploadingImage && <span style={{ fontSize: '0.8rem', color: 'white', marginTop: '4px', display: 'block' }}>Enviando...</span>}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Ou cole a URL da Imagem</label>
          <input type="text" name="image_url" placeholder="https://images.unsplash.com/... (ou deixe em branco)" value={formData.image_url || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }} />
        </div>
      </div>
      
      {/* Imagens Adicionais */}
      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Imagens Adicionais (Galeria)</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          {(Array.isArray(formData.additional_images) ? formData.additional_images : []).filter(img => img && img.trim() !== '').map((img, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <img src={img} alt={`Adicional ${idx}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, additional_images: prev.additional_images.filter((_, i) => i !== idx) }))} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>X</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Enviar Arquivo</label>
            <input type="file" accept="image/*" onChange={handleAdditionalImageUpload} disabled={uploadingImage} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Ou cole a URL</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" id="add_img_url_input" placeholder="https://..." onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.target.value.trim() !== '') {
                    setFormData(prev => ({ ...prev, additional_images: [...(Array.isArray(prev.additional_images) ? prev.additional_images : []), e.target.value.trim()] }));
                    e.target.value = '';
                  }
                }
              }} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }} />
              <button type="button" onClick={() => {
                const input = document.getElementById('add_img_url_input');
                if (input && input.value.trim() !== '') {
                  setFormData(prev => ({ ...prev, additional_images: [...(Array.isArray(prev.additional_images) ? prev.additional_images : []), input.value.trim()] }));
                  input.value = '';
                }
              }} style={{ padding: '0 15px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>Adicionar</button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Mensagem no Card (Página Inicial)</label>
        <input type="text" name="card_message" placeholder="Ex: Toque para ver detalhes" value={formData.card_message || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }} />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Descrição</label>
        <textarea name="description" placeholder="Descreva o produto, ingredientes, etc." value={formData.description || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none', minHeight: '80px' }} />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Sugestões de Acompanhamento (Opcional)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', background: 'var(--bg-dark)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          {allProducts.filter(p => p.id !== formData.id).map(p => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={formData.suggested_products_ids?.includes(p.id)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    suggested_products_ids: checked 
                      ? [...(prev.suggested_products_ids || []), p.id]
                      : (prev.suggested_products_ids || []).filter(id => id !== p.id)
                  }));
                }}
              />
              {p.name} (R$ {p.price.toFixed(2).replace('.', ',')})
            </label>
          ))}
          {allProducts.length === 0 && <span style={{ color: 'white' }}>Nenhum outro produto cadastrado.</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel} style={{ flex: 1, borderColor: 'var(--border)', color: 'var(--text-main)' }}>Cancelar</button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>{loading ? 'Salvando...' : submitLabel}</button>
      </div>
    </form>
  );
};

export default function MenuManagement() {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'add' | 'banners' | 'featured'

  // Banner state
  const [banners, setBanners] = useState([]);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerImageUrl, setNewBannerImageUrl] = useState('');
  const [newBannerBadge, setNewBannerBadge] = useState('');
  const [bannerLoading, setBannerLoading] = useState(false);
  const [confirmDeleteBannerId, setConfirmDeleteBannerId] = useState(null);
  const [bannerUploadingImage, setBannerUploadingImage] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Form Resets
  const [resetKey, setResetKey] = useState(0);
  const [formLoading, setFormLoading] = useState(false);

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductLoading, setEditProductLoading] = useState(false);

  // Add Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);

  const allProducts = menu.flatMap(c => c.products);



  // Carregar dados com base na aba ativa
  useEffect(() => {
    if (activeTab === 'products' || activeTab === 'add' || activeTab === 'featured') {
      fetchMenuAndCategories();
    }
    if (activeTab === 'banners') {
      fetchBanners();
    }
  }, [activeTab]);

  const fetchMenuAndCategories = async () => {
    try {
      const menuRes = await fetch('/api/admin/menu');
      const menuData = await menuRes.json();
      if (Array.isArray(menuData)) {
        setMenu(menuData);
      } else {
        setMenu([]);
      }

      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      if (Array.isArray(catData)) {
        setCategories(catData);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };



  const toggleAvailability = async (productId) => {
    try {
      const res = await fetch(`/api/products/${productId}/toggle`, {
        method: 'PUT'
      });
      if (res.ok) {
        fetchMenuAndCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchMenuAndCategories();
      } else {
        toast.error('Erro ao excluir produto.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão ao excluir produto.');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!confirm('Deseja realmente excluir esta categoria? Isso também excluirá todos os produtos dentro dela.')) return;
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchMenuAndCategories();
      } else {
        toast.error('Erro ao excluir categoria.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão ao excluir categoria.');
    }
  };

  const handleAddProduct = async (formData) => {
    if (!formData.name || !formData.category_id || !formData.price) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    setFormLoading(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category_id: formData.category_id,
          price: parseFloat(formData.price),
          description: formData.description || '',
          image_url: formData.image_url || '',
          additional_images: formData.additional_images || [],
          card_message: formData.card_message || 'Toque para ver detalhes',
          suggested_products_ids: formData.suggested_products_ids || []
        })
      });

      if (res.ok) {
        toast.success('Produto adicionado com sucesso!');
        setResetKey(prev => prev + 1);
        fetchMenuAndCategories();
        setActiveTab('products'); // Volta para a aba de produtos
      } else {
        toast.error('Erro ao adicionar produto.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão ao adicionar produto.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProduct = async (formData) => {
    if (!editingProduct) return;
    
    setEditProductLoading(true);
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category_id: formData.category_id,
          price: parseFloat(formData.price),
          description: formData.description || '',
          image_url: formData.image_url || '',
          additional_images: formData.additional_images || [],
          card_message: formData.card_message || 'Toque para ver detalhes',
          suggested_products_ids: formData.suggested_products_ids || []
        })
      });

      if (res.ok) {
        toast.success('Produto atualizado com sucesso!');
        setEditingProduct(null);
        fetchMenuAndCategories();
      } else {
        toast.error('Erro ao atualizar produto.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão ao atualizar produto.');
    } finally {
      setEditProductLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    setCategoryLoading(true);
    
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });

      if (res.ok) {
        toast.success('Categoria adicionada com sucesso!');
        setNewCategoryName('');
        fetchMenuAndCategories(); // Atualiza a lista
      } else {
        toast.error('Erro ao adicionar categoria.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão ao adicionar categoria.');
    } finally {
      setCategoryLoading(false);
    }
  };

  
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

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBanners(data);
      } else {
        setBanners([]);
      }
    } catch (err) {
      console.error('Erro ao carregar banners:', err);
    }
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBannerUploadingImage(true);
    const formDataObj = new FormData();
    formDataObj.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj
      });
      const data = await res.json();
      if (res.ok) {
        setNewBannerImageUrl(data.imageUrl);
        toast.success('Imagem enviada com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao enviar imagem.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão ao enviar imagem.');
    } finally {
      setBannerUploadingImage(false);
    }
  };

  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerImageUrl) {
      toast.error('Título e URL da imagem são obrigatórios.');
      return;
    }
    setBannerLoading(true);
    
    if (editingBanner) {
      try {
        const res = await fetch(`/api/banners/${editingBanner.id}`, {
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
  };

  const handleDeleteBanner = async (id) => {
    try {
      await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      setConfirmDeleteBannerId(null);
      fetchBanners();
      toast.success('Banner removido!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover banner.');
    }
  };

  const toggleFeatured = async (productId, currentValue) => {
    try {
      await fetch(`/api/products/${productId}/featured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !currentValue })
      });
      fetchMenuAndCategories();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#212322', backgroundImage: 'none' }}>
      <Toaster position="top-right" />
      {/* HEADER */}
      <header className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ChefHat color="var(--primary)" />
          Gestão de Cardápio e Site
        </h1>
      </header>

      {/* ABAS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {[
          { id: 'products', label: 'Cardápio do Cliente' },
          { id: 'add', label: 'Adicionar Produto', icon: PlusCircle },
          { id: 'banners', label: 'Banners', icon: Image },
          { id: 'featured', label: 'Destaques', icon: Star },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn"
            style={{
              width: 'auto', flex: 1, minWidth: '150px',
              padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.95rem',
              background: activeTab === tab.id ? 'var(--primary)' : 'var(--bg-card)',
              color: 'white', fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
          </button>
        ))}
      </div>



      {/* CONTEÚDO 2: CARDÁPIO DO CLIENTE (LISTA DE PRODUTOS) */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {menu.map(category => (
            <div key={category.id} className="card" style={{ padding: '20px' }}>
              <h2 style={{ color: 'var(--text-main)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{category.name}</span>
                <button
                  onClick={() => deleteCategory(category.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Excluir Categoria"
                >
                  <Trash2 size={16} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Excluir Categoria</span>
                </button>
              </h2>
              
              {category.products.length === 0 ? (
                <p style={{ color: 'white', fontStyle: 'italic' }}>Nenhum produto nesta categoria.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {category.products.map(product => (
                    <div 
                      key={product.id} 
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px',
                        borderLeft: product.is_available ? '3px solid var(--success)' : '3px solid var(--danger)',
                        flexWrap: 'wrap', gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} 
                          />
                        )}
                        <div>
                          <div className="font-bold">{product.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'white' }}>
                            R$ {product.price.toFixed(2).replace('.', ',')}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => toggleAvailability(product.id)}
                          style={{
                            padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                            background: product.is_available ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                            color: 'white',
                            border: `1px solid ${product.is_available ? 'var(--success)' : 'var(--danger)'}`
                          }}
                        >
                          {product.is_available ? 'Disponível' : 'Indisponível'}
                        </button>
                        <button
                          onClick={() => setEditingProduct({...product, price: product.price.toString()})}
                          style={{
                            padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                            background: 'rgba(255, 255, 255, 0.1)', color: 'white',
                            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Editar Produto"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          style={{
                            padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                            background: 'rgba(244, 67, 54, 0.1)', color: 'var(--danger)',
                            border: '1px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Excluir Produto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CONTEÚDO 3: ADICIONAR PRODUTO E CATEGORIA */}
      {activeTab === 'add' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          
          {/* Formulário de Categoria */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 className="mb-4" style={{ color: 'var(--text-main)' }}>Criar Nova Categoria</h2>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Nome da Categoria *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Sobremesas"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: 'white', outline: 'none', fontSize: '1.1rem'
                  }}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={categoryLoading}
                style={{ width: 'auto', padding: '0 32px', height: '54px', fontSize: '1.05rem' }}
              >
                {categoryLoading ? 'Criando...' : 'Adicionar'}
              </button>
            </form>
          </div>

          {/* Formulário de Produto */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 className="mb-4" style={{ color: 'var(--text-main)' }}>Adicionar Novo Produto</h2>
            <ProductForm 
              key={resetKey}
              categories={categories} 
              allProducts={allProducts}
              onSubmit={handleAddProduct} 
              loading={formLoading} 
            />
          </div>
        </div>
      )}

      {/* CONTEÚDO 4: BANNERS DO CARROSSEL */}
      {activeTab === 'banners' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          {/* Formulário de novo banner */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image size={20} /> {editingBanner ? 'Editar Banner' : 'Adicionar Banner'}
            </h2>
            <form onSubmit={handleAddBanner} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'white' }}>Título *</label>
                  <input
                    type="text" placeholder="Ex: Combo do Dia"
                    value={newBannerTitle} onChange={e => setNewBannerTitle(e.target.value)}
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'white' }}>Badge (ex: 🔥 Destaque)</label>
                  <input
                    type="text" placeholder="Ex: O Mais Pedido 🔥"
                    value={newBannerBadge} onChange={e => setNewBannerBadge(e.target.value)}
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'white' }}>Subtítulo</label>
                <input
                  type="text" placeholder="Ex: Hambúrguer + Fritas por R$ 45,90"
                  value={newBannerSubtitle} onChange={e => setNewBannerSubtitle(e.target.value)}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'white' }}>Enviar Arquivo de Imagem *</label>
                  <input
                    type="file" accept="image/*" onChange={handleBannerImageUpload} disabled={bannerUploadingImage}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                  />
                  {bannerUploadingImage && <span style={{ fontSize: '0.8rem', color: 'white', marginTop: '4px', display: 'block' }}>Enviando...</span>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'white' }}>Ou cole a URL da Imagem *</label>
                  <input
                    type="text" placeholder="https://images.unsplash.com/..."
                    value={newBannerImageUrl} onChange={e => setNewBannerImageUrl(e.target.value)}
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                    required
                  />
                </div>
              </div>
              {newBannerImageUrl && (
                <img src={newBannerImageUrl} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} onError={e => e.target.style.display = 'none'} />
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" disabled={bannerLoading} style={{ flex: 1 }}>
                  {bannerLoading ? 'Salvando...' : (editingBanner ? 'Atualizar Banner' : 'Adicionar Banner')}
                </button>
                {editingBanner && (
                  <button type="button" className="btn btn-outline" onClick={handleCancelEditBanner} style={{ flex: 1, borderColor: 'var(--border)', color: 'white' }}>
                    Cancelar Edição
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lista de banners existentes */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', color: 'white' }}>Banners Ativos ({banners.length})</h3>
            {banners.length === 0 ? (
              <p style={{ color: 'white', fontStyle: 'italic' }}>Nenhum banner cadastrado ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {banners.map(banner => (
                  <div key={banner.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: 'var(--bg-dark)', borderRadius: '8px', flexWrap: 'wrap' }}>
                    <img src={banner.image_url} alt={banner.title} style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: 'hidden', minWidth: '120px' }}>
                      <div style={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem' }}>{banner.title}</div>
                      {banner.badge && <div style={{ fontSize: '0.75rem', color: 'white' }}>{banner.badge}</div>}
                      {banner.subtitle && <div style={{ fontSize: '0.85rem', color: 'white', marginTop: '4px', lineHeight: '1.4' }}>{banner.subtitle}</div>}
                    </div>

                    {/* Inline confirmation */}
                    {confirmDeleteBannerId === banner.id ? (
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          style={{ padding: '6px 12px', background: 'var(--danger)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteBannerId(null)}
                          style={{ padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.82rem' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
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
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO 5: PRODUTOS EM DESTAQUE */}
      {activeTab === 'featured' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p style={{ color: 'white', fontSize: '0.9rem' }}>
            Ative ou desative os produtos que aparecem na seção <strong style={{ color: 'white' }}>Destaques da Semana</strong> na página inicial do cliente.
          </p>
          {menu.map(category => (
            <div key={category.id} className="card" style={{ padding: '20px' }}>
              <h2 style={{ color: 'var(--text-main)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                {category.name}
              </h2>
              {category.products.length === 0 ? (
                <p style={{ color: 'white', fontStyle: 'italic' }}>Nenhum produto nesta categoria.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {category.products.map(product => (
                    <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-dark)', borderRadius: '8px', borderLeft: product.is_featured ? '3px solid var(--primary)' : '3px solid transparent' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {product.image_url && (
                          <img src={product.image_url} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'white' }}>{product.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'white' }}>R$ {product.price.toFixed(2).replace('.', ',')}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeatured(product.id, product.is_featured)}
                        style={{
                          padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
                          background: product.is_featured ? 'rgba(242, 133, 0, 0.15)' : 'var(--bg-card)',
                          color: product.is_featured ? 'var(--primary)' : 'var(--text-muted)',
                          border: `1px solid ${product.is_featured ? 'var(--primary)' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                        }}
                      >
                        <Star size={14} fill={product.is_featured ? 'var(--primary)' : 'none'} />
                        {product.is_featured ? 'Destaque Ativo' : 'Ativar Destaque'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE PRODUTO */}
      {editingProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 12, 0.95)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px', position: 'relative', background: 'var(--bg-card)', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setEditingProduct(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 className="mb-4" style={{ color: 'var(--text-main)' }}>Editar Produto</h2>
            
            <ProductForm 
              initialData={editingProduct} 
              categories={categories} 
              allProducts={allProducts}
              onSubmit={handleUpdateProduct} 
              onCancel={() => setEditingProduct(null)}
              loading={editProductLoading} 
              submitLabel="Salvar Alterações"
            />
          </div>
        </div>
      )}

    </div>
  );
}
