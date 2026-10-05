# 📚 MangaReader — Plataforma Completa de Publicação e Leitura de Mangás

Plataforma moderna, rápida e responsiva para publicação e leitura de mangás e webtoons, desenvolvida em **Node.js**, **Express**, **Sharp**, com suporte unificado a **SQLite** e **MySQL**, armazenamento no sistema de arquivos e interface web com design refinado.

---

## 🚀 Funcionalidades

### 📖 Leitor Imersivo
- **Modo Página por Página**: Visualização individual de páginas com zonas de clique/toque laterais, setas, atalhos de teclado (`←`/`→`, `A`/`D`, `Espaço`, `F` para fullscreen) e slider inferior para saltar páginas rapidamente.
- **Modo Cascata Vertical (Webtoon)**: Leitura contínua com carregamento sob demanda (*lazy loading*) via `IntersectionObserver` para máxima economia de memória.
- **Pré-carregamento Inteligente**: Páginas adjacentes são carregadas em background para transições instantâneas.
- **Histórico & Retomada**: Progresso salvo no `localStorage` por obra e capítulo, com lembrete e botão para continuar de onde parou.
- **Controle HUD Dinâmico**: Barras superior e inferior que se recolhem suavemente durante a leitura e reaparecem ao mover o mouse ou tocar na tela.

### 📚 Catálogo & Descoberta
- **Página Inicial**: Destaques em banner hero, lançamentos recentes, mangás atualizados recentemente e carrossel "Continuar Lendo".
- **Filtros Avançados**: Filtragem combinada por gênero/tag, autor, status (*Em lançamento*, *Finalizado*, *Em hiato*), ano e ordenação.
- **Busca Unificada**: Autocomplete no cabeçalho e página dedicada de busca categorizada por mangás, autores e tags.
- **Páginas de Autor e Gênero**: Perfil com biografia e catálogo específico de obras.

### 🛡️ Painel Administrativo
- **Autenticação Segura**: Login protegido com cookies `HttpOnly` e verificação de sessão.
- **Dashboard com Métricas**: Total de mangás, capítulos, páginas convertidas e espaço em disco utilizado.
- **Editor de Mangá**: Cadastro completo com gerador automático de slugs, preview de capa e multi-seleção de autores e tags.
- **Editor de Capítulos & Upload**:
  - Upload de múltiplos arquivos de imagem.
  - **Grid Interativo de Reordenação por Arrastar e Soltar (Drag & Drop)**: Permite reordenar as páginas visualmente antes do upload e após o salvamento.
  - Conversão automática para formato **WebP** e extração de largura/altura com `Sharp`.
- **Gerenciador de Autores e Tags**: Criação, edição e exclusão de taxonomias via modais interativos.

### 🗄️ Arquitetura de Banco Abstraída
- Abstração completa através da classe `Database` e adaptadores específicos para **SQLite** (`better-sqlite3`) e **MySQL** (`mysql2`).
- Sem código condicional espalhado nos repositories ou controllers.

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js, Express, Multer, Sharp, better-sqlite3, mysql2, dotenv, cookie-parser, cors.
- **Frontend**: HTML5 Semântico, CSS3 Moderno (Variáveis, Dark Mode, Glassmorphism), JavaScript Vanilla (ES6+).
- **Armazenamento**: Metadados no Banco de Dados (SQLite/MySQL) e imagens otimizadas em WebP no Filesystem (`storage/covers` e `storage/chapters`).

---

## 📁 Estrutura de Pastas

```text
MangarReader/
├── .env
├── .env.example
├── package.json
├── README.md
│
├── data/
│   └── database.sqlite             # Banco SQLite local
│
├── storage/
│   ├── covers/                     # Capas dos mangás em WebP
│   └── chapters/                   # Páginas dos capítulos organizadas por id
│
├── src/
│   ├── app.js                      # Bootstrap do Express e rotas públicas
│   ├── config/
│   │   ├── config.js               # Configurações do ambiente
│   │   └── database.js             # Fábrica da instância de banco de dados
│   ├── database/
│   │   ├── Database.js             # Interface abstrata do banco
│   │   ├── SQLiteDatabase.js       # Implementação SQLite (better-sqlite3)
│   │   ├── MySQLDatabase.js        # Implementação MySQL (mysql2 pool)
│   │   ├── migrations.js           # Migrações e criação de tabelas/índices
│   │   └── seed.js                 # Gerador de dados de demonstração com imagens
│   ├── repositories/
│   │   ├── MangaRepository.js
│   │   ├── ChapterRepository.js
│   │   ├── PageRepository.js
│   │   ├── AuthorRepository.js
│   │   └── TagRepository.js
│   ├── services/
│   │   ├── MangaService.js
│   │   ├── ChapterService.js
│   │   ├── ImageService.js         # Processamento WebP e armazenamento
│   │   ├── SearchService.js
│   │   ├── ReaderService.js
│   │   └── AuthService.js
│   ├── controllers/
│   │   ├── MangaController.js
│   │   ├── ChapterController.js
│   │   ├── AuthorController.js
│   │   ├── TagController.js
│   │   ├── ReaderController.js
│   │   ├── SearchController.js
│   │   └── AdminController.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── manga.js
│   │   ├── chapters.js
│   │   ├── reader.js
│   │   ├── search.js
│   │   ├── authors.js
│   │   ├── tags.js
│   │   ├── admin.js
│   │   └── storage.js              # Servidor seguro de imagens com Cache-Control
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── error.js
│   └── utils/
│       ├── slug.js
│       ├── pagination.js
│       ├── validation.js
│       └── placeholder.js
│
└── public/
    ├── index.html                  # Página inicial
    ├── mangas.html                 # Catálogo com filtros
    ├── manga.html                  # Detalhes e capítulos da obra
    ├── reader.html                 # Leitor fluido (Página a Página & Cascata)
    ├── search.html                 # Busca completa
    ├── author.html                 # Perfil do autor
    ├── tag.html                    # Mangás por gênero/tag
    ├── 404.html                    # Página 404
    ├── admin/
    │   ├── index.html              # Dashboard administrativo
    │   ├── login.html              # Login de administrador
    │   ├── manga-editor.html       # Formulário de mangá
    │   ├── chapter-editor.html     # Editor de capítulos com Drag & Drop de páginas
    │   └── taxonomies.html         # Gestão de autores e tags
    ├── css/
    │   ├── style.css               # Design System global
    │   ├── reader.css              # Estilos do leitor imersivo
    │   └── admin.css               # Estilos do painel de controle
    └── js/
        ├── api.js
        ├── history.js
        ├── home.js
        ├── mangas.js
        ├── manga-detail.js
        ├── reader.js
        ├── search.js
        ├── author-tag.js
        ├── admin-auth.js
        ├── admin-dashboard.js
        ├── admin-manga.js
        ├── admin-chapter.js
        └── admin-taxonomies.js
```

---

## ⚙️ Configuração e Instalação

### 1. Clonar ou Acessar o Diretório
```bash
cd MangarReader
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente (`.env`)
Copie o arquivo `.env.example` para `.env` se necessário:
```env
PORT=3000
NODE_ENV=development

# Banco de dados ('sqlite' ou 'mysql')
DATABASE_DRIVER=sqlite
SQLITE_PATH=./data/database.sqlite

# Configurações do MySQL (caso DATABASE_DRIVER=mysql)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=manga_reader
MYSQL_USER=root
MYSQL_PASSWORD=root

# Armazenamento e Admin
STORAGE_PATH=./storage
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=mangar_reader_super_secret_session_key_2026
```

---

## 🚀 Executando o Projeto

### Popular o Banco com Mangás e Capítulos de Exemplo
```bash
npm run seed
```

### Iniciar o Servidor
```bash
npm start
```
Ou em modo de desenvolvimento com recarregamento automático:
```bash
npm run dev
```

Abra no navegador:
- **Site Público**: [http://localhost:3000](http://localhost:3000)
- **Painel Administrativo**: [http://localhost:3000/admin](http://localhost:3000/admin) *(Usuário: `admin` | Senha: `admin123`)*

---

## 📡 Endpoints da API REST

### Mangás
- `GET /api/mangas/home` — Seções da página inicial (Destaques, Recentes, Atualizados)
- `GET /api/mangas` — Lista de mangás com paginação e filtros (`?search=&tag=&author=&status=&year=&sort=&page=1&limit=24`)
- `GET /api/mangas/:slug` — Detalhes do mangá e lista de capítulos
- `POST /api/admin/mangas` — Criar novo mangá (Multipart/Form-Data)
- `PUT /api/admin/mangas/:id` — Atualizar mangá (Multipart/Form-Data)
- `DELETE /api/admin/mangas/:id` — Excluir mangá e todos os seus arquivos

### Capítulos & Leitor
- `GET /api/manga/:mangaSlug/chapters/:chapterSlug` — Payload completo para o leitor (metadados, páginas e navegação)
- `GET /api/chapters/:id` — Dados de um capítulo específico
- `POST /api/admin/mangas/:id/chapters` — Criar capítulo com upload em lote de páginas
- `PUT /api/admin/chapters/:id` — Atualizar metadados do capítulo
- `POST /api/admin/chapters/:id/pages` — Adicionar páginas a um capítulo existente
- `PUT /api/admin/chapters/:id/reorder-pages` — Reordenar sequência de páginas
- `DELETE /api/admin/pages/:id` — Excluir página individual
- `DELETE /api/admin/chapters/:id` — Excluir capítulo e arquivos

### Autores & Tags
- `GET /api/authors` & `GET /api/authors/:slug`
- `POST /api/admin/authors` | `PUT /api/admin/authors/:id` | `DELETE /api/admin/authors/:id`
- `GET /api/tags` & `GET /api/tags/:slug`
- `POST /api/admin/tags` | `PUT /api/admin/tags/:id` | `DELETE /api/admin/tags/:id`

### Busca & Administração
- `GET /api/search?q=:query` — Busca unificada
- `POST /api/admin/login` — Autenticação de administrador
- `POST /api/admin/logout` — Encerramento de sessão
- `GET /api/admin/stats` — Métricas do sistema e uso de disco
