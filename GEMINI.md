# Projeto Restaurante - GEMINI Context

Este documento serve como a documentação principal de contexto do projeto (GEMINI.md) para instruir e auxiliar Agentes de IA e desenvolvedores a entenderem a arquitetura, as tecnologias e os padrões adotados na aplicação do Restaurante.

## 🎯 Visão Geral
O sistema é uma plataforma completa de gestão para restaurantes, englobando:
- **Cardápio Digital / Autoatendimento:** Interface para o cliente visualizar categorias, detalhes de produtos e fazer pedidos via QR Code.
- **Painel do Garçom:** Ferramenta mobile-first para o garçom abrir mesas, lançar produtos e enviar comandos para a cozinha.
- **KDS (Cozinha):** Tela interativa para a cozinha receber, visualizar e despachar pedidos em tempo real.
- **Caixa (PDV):** Gerenciamento de abertura, sangria, reforço e fechamento de caixa, além de pagamento de comandas.
- **Admin / Gestão:** Painel de controle para gerenciar cardápio (Categorias, Produtos, Banners, Harmonizações) e extrair relatórios (faturamento e vendas).

## 🛠 Tech Stack

### Frontend (`/frontend`)
- **Core:** React.js (rodando sobre Vite).
- **Roteamento:** React Router DOM.
- **Estado Global:** Zustand.
- **Comunicação Real-Time:** Socket.IO Client.
- **Estilização:** CSS Puro (Vanilla CSS). **Não** utiliza TailwindCSS. Todo o Design System e classes utilitárias responsivas estão no arquivo `index.css`.
- **Ícones e Alertas:** Lucide React e React Hot Toast.

### Backend (`/backend`)
- **Core:** Node.js com Express.
- **Banco de Dados:** SQLite (arquivo local).
- **ORM:** Prisma (`@prisma/client`).
- **Comunicação Real-Time:** Socket.IO (embutido junto com o Express).
- **Uploads:** Multer.

---

## 📂 Estrutura de Diretórios e Padrões de Arquitetura

O repositório está logicamente dividido em um monorepo com as pastas `/frontend` e `/backend`.

### 1. Backend (`/backend`)
- **`server.js`:** Ponto de entrada. Configura o Express, middlewares de segurança (CORS), instâncias de Socket.IO e inicializa as rotas.
- **`prisma/schema.prisma`:** Única fonte da verdade do modelo de dados. Se precisar alterar tabelas ou colunas, modifique este arquivo e rode a migração (ou `npx prisma db push`).
- **`routes/`:** Modularização dos Controladores da API.
  - `api.js`: Tratamento de categorias, mesas (TableSession), pedidos e banners.
  - `products.js`: Lógica de CRUD dos produtos e suas imagens (Multer).
  - `cash.js`: Controle absoluto da rotina do Caixa (abertura, fechamentos, transações e sangrias).
  - `reports.js`: Algoritmos de filtro e totalização para o painel de Relatórios.

### 2. Frontend (`/frontend`)
- **`src/index.css`:** Fonte da identidade visual (Paleta sofisticada, tipografia Georgia/Outfit, variáveis de tema). Modificações visuais globais e media queries responsivas devem ser inseridas e consultadas aqui.
- **`src/pages/`:** Contém todas as Views e páginas da aplicação:
  - `Home.jsx`, `ClientPage1.jsx`, `ClientPage2.jsx`, `ClientPage3.jsx`, `Product.jsx`: Fluxo interativo do cliente.
  - `Admin.jsx`, `MenuManagement.jsx`, `Category.jsx`: Telas de backoffice.
  - `Kitchen.jsx`: Telas em Kanban para fluxo da cozinha.
  - `Waiter.jsx`: Terminal do garçom.
  - `Payment.jsx` e `Reports.jsx`: Setor financeiro.

---

## 🗄️ Esquema de Dados (Modelos Principais)
- **TableSession:** Representa a sessão atual da mesa. Possui um `qr_token` exclusivo e controle de horário (`opened_at`, `closed_at`) para controle das comandas abertas.
- **Category & Product:** Relação 1-para-N. O produto possui metadados customizados como `card_message`, e parâmetros fiscais padrão (NCM, CFOP).
  - *Relacionamento Próprio:* Produtos sugeridos (`suggestedProducts`), gerando o carrossel "Harmoniza Com".
- **Order & OrderItem:** Vinculados à `TableSession`. Os status do Order (ex: `pending`, `preparing`, `delivered`) orientam a renderização da `Kitchen.jsx` via WebSocket.
- **CashSession & CashMovement:** Caixa físico da loja. `CashSession` guarda a diferença de fechamento e declarações, enquanto `CashMovement` guarda os registros individuais das transações (suprimento, sangria, dinheiro vs cartão).

---

## 🚦 Padrões Essenciais de Desenvolvimento

1. **Responsividade:** Todas as interfaces devem ser fluidas, prevendo visualizações perfeitas no celular (garçom/cliente) e desktop/tablet (caixa/cozinha). Sempre utilize flexbox e `@media` queries no `index.css` antes de forçar o estilo inline.
2. **Estilização Semântica:** Mantenha as cores (`#3D312A` para o marrom escuro de fundo, `#F2EEDF` para fontes claras e `#511F26` para vinho) em voga ao criar novos componentes para manter a estética gastronômica sofisticada.
3. **WebSockets:** Qualquer mutação num "Pedido" (Novo Pedido, Mudança de Status, Fechamento de Comanda) deve enviar eventos pelo Socket (`socket.emit` / `io.emit`) para assegurar que todas as pontas (cozinha, caixa) atualizem a tela sem precisar dar F5.
4. **Tratamento de Dados de Pagamento:** Ao exibir valores (Preço), utilize a padronização e conversão para reais corretamente com `toFixed(2).replace('.', ',')`.
