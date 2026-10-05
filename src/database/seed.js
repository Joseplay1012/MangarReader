const { getDatabase } = require('../config/database');
const { runMigrations } = require('./migrations');
const MangaService = require('../services/MangaService');
const ChapterService = require('../services/ChapterService');
const AuthorRepository = require('../repositories/AuthorRepository');
const TagRepository = require('../repositories/TagRepository');
const sharp = require('sharp');

// Helper to generate a crisp SVG-rendered manga page or cover
async function generateDemoPageBuffer(title, subtitle, pageNum, totalPages, isCover = false) {
  const width = isCover ? 600 : 1000;
  const height = isCover ? 900 : 1500;
  const bgColor = isCover ? '#1A1D20' : '#FFFFFF';
  const textColor = isCover ? '#FFFFFF' : '#1A1D20';
  const subColor = isCover ? '#D6D6D6' : '#5E6773';
  const panelStroke = isCover ? '#D62C20' : '#1A1D20';

  const panels = isCover ? `
    <rect x="30" y="30" width="${width - 60}" height="${height - 60}" rx="4" fill="none" stroke="${panelStroke}" stroke-width="3"/>
    <circle cx="${width/2}" cy="${height/2 - 50}" r="120" fill="#24282D" stroke="#D62C20" stroke-width="2"/>
    <text x="${width/2}" y="${height/2 - 35}" font-family="sans-serif" font-size="52" font-weight="900" fill="#D62C20" text-anchor="middle">MANGA</text>
    <text x="${width/2}" y="${height/2 + 15}" font-family="sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF" text-anchor="middle">EDIÇÃO OFICIAL</text>
  ` : `
    <!-- Manga Comic Panels -->
    <rect x="40" y="40" width="${width - 80}" height="420" rx="4" fill="#FFFFFF" stroke="${panelStroke}" stroke-width="3"/>
    <text x="${width/2}" y="240" font-family="sans-serif" font-size="32" font-weight="bold" fill="${textColor}" text-anchor="middle">QUADRO 1</text>
    <text x="${width/2}" y="280" font-family="sans-serif" font-size="18" fill="${subColor}" text-anchor="middle">${title} — ${subtitle}</text>

    <rect x="40" y="480" width="${(width - 100)/2}" height="440" rx="4" fill="#FFFFFF" stroke="${panelStroke}" stroke-width="3"/>
    <text x="${40 + (width - 100)/4}" y="710" font-family="sans-serif" font-size="24" font-weight="bold" fill="${textColor}" text-anchor="middle">QUADRO 2</text>

    <rect x="${60 + (width - 100)/2}" y="480" width="${(width - 100)/2}" height="440" rx="4" fill="#FFFFFF" stroke="${panelStroke}" stroke-width="3"/>
    <text x="${60 + (width - 100)/2 + (width - 100)/4}" y="710" font-family="sans-serif" font-size="24" font-weight="bold" fill="${textColor}" text-anchor="middle">QUADRO 3</text>

    <rect x="40" y="940" width="${width - 80}" height="480" rx="4" fill="#FFFFFF" stroke="${panelStroke}" stroke-width="3"/>
    <text x="${width/2}" y="1180" font-family="sans-serif" font-size="38" font-weight="bold" fill="#D62C20" text-anchor="middle">AÇÃO & CLÍMAX</text>
    <text x="${width/2}" y="1230" font-family="sans-serif" font-size="20" fill="${subColor}" text-anchor="middle">Página ${pageNum} de ${totalPages}</text>
  `;

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      ${panels}
      <text x="${width/2}" y="${isCover ? height - 120 : 30}" font-family="sans-serif" font-size="${isCover ? 34 : 16}" font-weight="bold" fill="${textColor}" text-anchor="middle">${title}</text>
      <text x="${width/2}" y="${isCover ? height - 75 : height - 20}" font-family="sans-serif" font-size="${isCover ? 18 : 13}" fill="${subColor}" text-anchor="middle">${isCover ? subtitle : `Página ${pageNum} / ${totalPages}`}</text>
    </svg>
  `;

  return sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
}

async function seed() {
  console.log('🌱 Starting Manga Reader Database Seed...');
  await runMigrations();

  const db = getDatabase();
  const mangaService = new MangaService();
  const chapterService = new ChapterService();
  const authorRepo = new AuthorRepository(db);
  const tagRepo = new TagRepository(db);

  // Check if we already have mangas
  const existingMangas = await mangaService.listMangas({ limit: 1 });
  if (existingMangas.total > 0) {
    console.log('Database already has data. Seed skipped.');
    return;
  }

  console.log('Creating Tags and Genres...');
  const tagsData = [
    { name: 'Ação', slug: 'acao' },
    { name: 'Aventura', slug: 'aventura' },
    { name: 'Comédia', slug: 'comedia' },
    { name: 'Drama', slug: 'drama' },
    { name: 'Fantasia', slug: 'fantasia' },
    { name: 'Romance', slug: 'romance' },
    { name: 'Shounen', slug: 'shounen' },
    { name: 'Seinen', slug: 'seinen' },
    { name: 'Isekai', slug: 'isekai' },
    { name: 'Mistério', slug: 'misterio' },
    { name: 'Sobrenatural', slug: 'sobrenatural' },
    { name: 'Ficção Científica', slug: 'ficcao-cientifica' }
  ];

  const createdTags = {};
  for (const t of tagsData) {
    createdTags[t.slug] = await tagRepo.create(t);
  }

  console.log('Creating Authors...');
  const authorsData = [
    { name: 'Eiichiro Oda', slug: 'eiichiro-oda', biography: 'Criador do aclamado mangá One Piece, um dos maiores sucessos mundiais dos quadrinhos japoneses.' },
    { name: 'Koyoharu Gotouge', slug: 'koyoharu-gotouge', biography: 'Mangaká japonês conhecido pela obra Kimetsu no Yaiba (Demon Slayer).' },
    { name: 'Kohei Horikoshi', slug: 'kohei-horikoshi', biography: 'Autor e ilustrador de My Hero Academia (Boku no Hero Academia).' },
    { name: 'Gege Akutami', slug: 'gege-akutami', biography: 'Criador da popular série de mangá Jujutsu Kaisen.' },
    { name: 'Tite Kubo', slug: 'tite-kubo', biography: 'Mangaká renomado, criador de Bleach e Burn the Witch.' },
    { name: 'Kentaro Miura', slug: 'kentaro-miura', biography: 'Lendário autor de Berserk, obra-prima da fantasia sombria.' },
    { name: 'Hajime Isayama', slug: 'hajime-isayama', biography: 'Criador de Shingeki no Kyojin (Attack on Titan).' }
  ];

  const createdAuthors = {};
  for (const a of authorsData) {
    createdAuthors[a.slug] = await authorRepo.create(a);
  }

  console.log('Creating Sample Mangas and Chapters with WebP generated pages...');
  const mangasToCreate = [
    {
      title: 'One Piece',
      slug: 'one-piece',
      description: 'Gol D. Roger era conhecido como o Rei dos Piratas, o ser mais forte e mais influente que já navegou na Grand Line. A captura e morte de Roger pelo Governo Mundial mudou a história. Monkey D. Luffy, um jovem de 17 anos que desafia a definição padrão de pirata, embarca em sua jornada pelo tesouro supremo: o One Piece.',
      status: 'ongoing',
      release_year: 1997,
      authorSlugs: ['eiichiro-oda'],
      tagSlugs: ['acao', 'aventura', 'comedia', 'fantasia', 'shounen'],
      chapters: [
        { number: 1, title: 'Romance Dawn - O Amanhecer da Aventura', pagesCount: 8 },
        { number: 2, title: 'O Caçador de Piratas Zoro', pagesCount: 6 },
        { number: 3, title: 'Entra o Grande Pirata', pagesCount: 6 },
        { number: 1100, title: 'Obrigado, Bonney', pagesCount: 10 }
      ]
    },
    {
      title: 'Demon Slayer: Kimetsu no Yaiba',
      slug: 'demon-slayer',
      description: 'No Japão da era Taisho, Tanjiro Kamado é um garoto de bom coração que vende carvão para viver. Mas sua vida pacífica é destruída quando um demônio mata quase toda sua família. Sua irmã mais nova Nezuko, a única sobrevivente, foi transformada em demônio. Tanjiro parte em uma jornada perigosa para curar sua irmã e caçar o demônio que destruiu sua vida.',
      status: 'completed',
      release_year: 2016,
      authorSlugs: ['koyoharu-gotouge'],
      tagSlugs: ['acao', 'sobrenatural', 'drama', 'shounen', 'fantasia'],
      chapters: [
        { number: 1, title: 'Crueldade', pagesCount: 7 },
        { number: 2, title: 'O Estranho', pagesCount: 6 },
        { number: 205, title: 'Vidas que Resvalam o Tempo', pagesCount: 8 }
      ]
    },
    {
      title: 'Jujutsu Kaisen',
      slug: 'jujutsu-kaisen',
      description: 'Por algum motivo, Yuji Itadori, apesar de seu atletismo insano, prefere apenas relaxar com o Clube de Ocultismo de sua escola. No entanto, ele logo descobre que o ocultismo é tão real quanto parece quando seus membros do clube são atacados! Ao engolir um dedo amaldiçoado lendário, Yuji compartilha seu corpo com o Rei das Maldições, Sukuna.',
      status: 'ongoing',
      release_year: 2018,
      authorSlugs: ['gege-akutami'],
      tagSlugs: ['acao', 'sobrenatural', 'fantasia', 'shounen'],
      chapters: [
        { number: 1, title: 'Ryomen Sukuna', pagesCount: 8 },
        { number: 2, title: 'Execução Secreta', pagesCount: 6 },
        { number: 250, title: 'Batalha Decisiva no Vazio Infinito', pagesCount: 7 }
      ]
    },
    {
      title: 'Berserk',
      slug: 'berserk',
      description: 'Guts, conhecido como o Espadachim Negro, busca refúgio dos espíritos demoníacos atraídos por ele e sua marca demoníaca, enquanto caça o homem que o traiu. Acompanhado apenas de sua força titânica, sua espada descomunal e sua determinação imutável, Guts desafia o próprio destino.',
      status: 'ongoing',
      release_year: 1989,
      authorSlugs: ['kentaro-miura'],
      tagSlugs: ['acao', 'fantasia', 'drama', 'seinen', 'sobrenatural'],
      chapters: [
        { number: 1, title: 'O Espadachim Negro', pagesCount: 8 },
        { number: 2, title: 'A Marca do Sacrifício', pagesCount: 7 }
      ]
    },
    {
      title: 'Attack on Titan',
      slug: 'attack-on-titan',
      description: 'Séculos atrás, a humanidade foi quase extinta pelos Titãs. Seres gigantes sem inteligência que parecem devorar humanos apenas pelo prazer. Um pequeno percentual de humanos sobreviveu se protegendo em uma cidade cercada por muralhas extremamente altas.',
      status: 'completed',
      release_year: 2009,
      authorSlugs: ['hajime-isayama'],
      tagSlugs: ['acao', 'drama', 'misterio', 'shounen', 'ficcao-cientifica'],
      chapters: [
        { number: 1, title: 'Para Você, daqui a 2000 Anos', pagesCount: 8 },
        { number: 139, title: 'Rumo à Árvore Naquela Colina', pagesCount: 8 }
      ]
    },
    {
      title: 'Solo Leveling: Ragnarok',
      slug: 'solo-leveling-ragnarok',
      description: 'Quando uma fenda dimensional surge, a Terra se conecta com mundos habitados por monstros. Sung Suho descobre poderes ocultos ao herdar o legado das sombras.',
      status: 'ongoing',
      release_year: 2023,
      authorSlugs: ['kohei-horikoshi'],
      tagSlugs: ['acao', 'aventura', 'isekai', 'fantasia'],
      chapters: [
        { number: 1, title: 'O Despertar do Monarca', pagesCount: 6 },
        { number: 2, title: 'Portão Vermelho', pagesCount: 6 }
      ]
    }
  ];

  for (const item of mangasToCreate) {
    console.log(`Creating Manga: ${item.title}...`);
    const coverBuffer = await generateDemoPageBuffer(item.title, `Lançamento ${item.release_year}`, 1, 1, true);
    
    const authorIds = item.authorSlugs.map(s => createdAuthors[s]?.id).filter(Boolean);
    const tagIds = item.tagSlugs.map(s => createdTags[s]?.id).filter(Boolean);

    const manga = await mangaService.createManga({
      title: item.title,
      slug: item.slug,
      description: item.description,
      status: item.status,
      release_year: item.release_year,
      author_ids: authorIds,
      tag_ids: tagIds,
    }, coverBuffer);

    for (const ch of item.chapters) {
      console.log(`  Adding Chapter ${ch.number}: ${ch.title}...`);
      const pageFiles = [];
      for (let p = 1; p <= ch.pagesCount; p++) {
        const pageBuffer = await generateDemoPageBuffer(item.title, ch.title, p, ch.pagesCount, false);
        pageFiles.push({
          buffer: pageBuffer,
          originalname: `page_${p}.webp`,
          mimetype: 'image/webp'
        });
      }

      await chapterService.createChapter(manga.id, {
        number: ch.number,
        title: ch.title,
        slug: `chapter-${ch.number}`,
      }, pageFiles);
    }
  }

  console.log('✅ Seed finished successfully! Database and sample chapters are ready.');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = { seed };
