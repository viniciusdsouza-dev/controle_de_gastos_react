// Catálogo de bancos com logos SVG fiéis às marcas reais
import React from 'react'

export interface BancoCatalogo {
  slug: string
  nome: string
  cor:  string
  svg:  string
}

export const BANCOS_CATALOGO: BancoCatalogo[] = [
  {
    slug: 'nubank',
    nome: 'Nubank',
    cor:  '#820AD1',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#820AD1"/>
      <!-- "nu" lettering fiel ao logo -->
      <path d="M8 26V14h3.2l7.6 8.2V14H22v12h-3.2L11.2 17.8V26H8z" fill="white"/>
      <path d="M24 14h3.2v7.4c0 1.4 0.8 2.2 2 2.2s2-0.8 2-2.2V14H34v7.6c0 3-1.8 4.8-4.8 4.8s-5.2-1.8-5.2-4.8V14z" fill="white"/>
    </svg>`,
  },
  {
    slug: 'itau',
    nome: 'Itaú',
    cor:  '#EC7000',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#EC7000"/>
      <!-- Quadrado branco arredondado interno -->
      <rect x="7" y="7" width="26" height="26" rx="6" fill="white"/>
      <!-- "itaú" text estilizado -->
      <text x="20" y="25" font-size="10" font-weight="900" fill="#EC7000"
        font-family="Arial,sans-serif" text-anchor="middle" letter-spacing="-0.5">itaú</text>
    </svg>`,
  },
  {
    slug: 'bradesco',
    nome: 'Bradesco',
    cor:  '#CC092F',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brad_bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#CC092F"/>
          <stop offset="100%" stop-color="#8B0020"/>
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#brad_bg)"/>
      <!-- Árvore estilizada do Bradesco -->
      <!-- Tronco -->
      <rect x="18" y="24" width="4" height="8" rx="1" fill="white"/>
      <!-- Copa: arco superior -->
      <path d="M20 8 C12 8 8 13 8 18 C8 23 12 25 20 25 C28 25 32 23 32 18 C32 13 28 8 20 8Z" fill="none" stroke="white" stroke-width="2.2"/>
      <!-- Orbital -->
      <path d="M10 14 C14 8 26 8 30 14" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M10 22 C14 28 26 28 30 22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  },
  {
    slug: 'bb',
    nome: 'Banco do Brasil',
    cor:  '#F9BA00',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#F9BA00"/>
      <!-- Losango duplo estilizado do BB -->
      <g transform="translate(20,20)">
        <!-- Losango externo azul -->
        <polygon points="0,-13 13,0 0,13 -13,0" fill="#003882"/>
        <!-- Losango interno amarelo -->
        <polygon points="0,-7 7,0 0,7 -7,0" fill="#F9BA00"/>
        <!-- Losango central azul -->
        <polygon points="0,-3 3,0 0,3 -3,0" fill="#003882"/>
      </g>
    </svg>`,
  },
  {
    slug: 'inter',
    nome: 'Inter',
    cor:  '#FF7A00',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#FF7A00"/>
      <!-- "inter" em letras brancas bold -->
      <text x="20" y="24" font-size="9.5" font-weight="900" fill="white"
        font-family="Arial,sans-serif" text-anchor="middle" letter-spacing="0">inter</text>
    </svg>`,
  },
  {
    slug: 'caixa',
    nome: 'Caixa',
    cor:  '#005CA9',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#005CA9"/>
      <!-- X laranja e branco do logo Caixa -->
      <!-- Barra diagonal \ branca -->
      <line x1="8" y1="8" x2="32" y2="32" stroke="white" stroke-width="9" stroke-linecap="round"/>
      <!-- Barra diagonal / laranja -->
      <line x1="32" y1="8" x2="8" y2="32" stroke="#F7A800" stroke-width="9" stroke-linecap="round"/>
    </svg>`,
  },
  {
    slug: 'santander',
    nome: 'Santander',
    cor:  '#EC0000',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#EC0000"/>
      <!-- Chamas do Santander: 3 arcos brancos -->
      <!-- Elipse base -->
      <ellipse cx="20" cy="30" rx="13" ry="4" fill="white"/>
      <!-- Chama esquerda -->
      <path d="M13 28 C10 22 11 15 15 12 C13 17 14 23 16 26Z" fill="white"/>
      <!-- Chama central -->
      <path d="M20 27 C17 20 17 13 20 9 C23 13 23 20 20 27Z" fill="white"/>
      <!-- Chama direita -->
      <path d="M27 28 C30 22 29 15 25 12 C27 17 26 23 24 26Z" fill="white"/>
    </svg>`,
  },
  {
    slug: 'c6',
    nome: 'C6 Bank',
    cor:  '#242424',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#141414"/>
      <!-- C6 em fonte bold fiel -->
      <text x="20" y="26" font-size="15" font-weight="900" fill="white"
        font-family="Arial Black,Arial,sans-serif" text-anchor="middle" letter-spacing="0">C6</text>
    </svg>`,
  },
  {
    slug: 'picpay',
    nome: 'PicPay',
    cor:  '#11C76F',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#11C76F"/>
      <!-- P grande + quadradinho (marca PicPay) -->
      <!-- P -->
      <path d="M8 10 L8 30 L12 30 L12 22 L18 22 C21.5 22 24 19.5 24 16 C24 12.5 21.5 10 18 10 Z
               M12 14 L17.5 14 C19.2 14 20 15 20 16 C20 17 19.2 18 17.5 18 L12 18 Z"
            fill="#F0EDE8"/>
      <!-- Quadrado pequeno superior direito -->
      <rect x="26" y="10" width="7" height="7" rx="1" fill="none" stroke="#F0EDE8" stroke-width="2"/>
      <!-- Quadrado menor dentro -->
      <rect x="28.5" y="12.5" width="2" height="2" fill="#F0EDE8"/>
    </svg>`,
  },
  {
    slug: 'neon',
    nome: 'Neon',
    cor:  '#1199FF',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#1199FF"/>
      <!-- Arco aberto em baixo (logo Neon) -->
      <path d="M10 22 A10 10 0 1 1 30 22" fill="none" stroke="white" stroke-width="6" stroke-linecap="round"/>
    </svg>`,
  },
  {
    slug: 'will',
    nome: 'Will Bank',
    cor:  '#FFD600',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#FFD600"/>
      <!-- "will" em preto + círculo branco -->
      <text x="11" y="24" font-size="9" font-weight="900" fill="#1A1A1A"
        font-family="Georgia,serif" letter-spacing="-0.3">will</text>
      <circle cx="31" cy="20" r="5" fill="white"/>
    </svg>`,
  },
  {
    slug: 'sicoob',
    nome: 'Sicoob',
    cor:  '#007A3D',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0D3349"/>
      <!-- Triângulo invertido verde claro (topo esquerdo) -->
      <polygon points="8,8 22,8 8,24" fill="#7DC242"/>
      <!-- Triângulo invertido verde escuro (centro) -->
      <polygon points="22,8 32,8 32,20" fill="#009B3A"/>
      <!-- Triângulo amarelo-verde (baixo) -->
      <polygon points="8,24 22,8 32,20 32,32 8,32" fill="#BDD630"/>
      <!-- Pequeno triângulo escuro no centro -->
      <polygon points="19,16 25,16 19,24" fill="#0D3349" opacity="0.5"/>
    </svg>`,
  },
  {
    slug: 'xp',
    nome: 'XP',
    cor:  '#000000',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="white"/>
      <rect x="2" y="2" width="36" height="36" rx="8" fill="white" stroke="#111" stroke-width="2"/>
      <!-- xp minúsculo bold -->
      <text x="20" y="26" font-size="14" font-weight="900" fill="#111"
        font-family="Arial Black,Arial,sans-serif" text-anchor="middle" letter-spacing="-1">xp</text>
    </svg>`,
  },
  {
    slug: 'rico',
    nome: 'Rico',
    cor:  '#FF4F00',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0D0E3F"/>
      <!-- "rico" com o "o" sendo infinito/loop -->
      <text x="7" y="25" font-size="11" font-weight="900" fill="#FF4F00"
        font-family="Arial Black,Arial,sans-serif" letter-spacing="-0.5">ric</text>
      <!-- Símbolo de infinito como "o" final -->
      <path d="M29 20 C27 17 24 17 24 20 C24 23 27 23 29 20 C29 17 32 17 32 20 C32 23 29 23 29 20"
            fill="none" stroke="#FF4F00" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`,
  },
  {
    slug: 'outro',
    nome: 'Outro',
    cor:  '#2E86AB',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#1A3A4A"/>
      <!-- Ícone de banco: prédio com colunas e cifrão -->
      <!-- Telhado -->
      <polygon points="7,16 20,8 33,16" fill="#2E86AB"/>
      <!-- Corpo -->
      <rect x="9" y="16" width="22" height="14" fill="#2E86AB"/>
      <!-- Base -->
      <rect x="7" y="29" width="26" height="3" rx="1" fill="#2E86AB"/>
      <!-- Colunas brancas -->
      <rect x="11" y="17" width="3" height="12" fill="white" opacity="0.9"/>
      <rect x="18.5" y="17" width="3" height="12" fill="white" opacity="0.9"/>
      <rect x="26" y="17" width="3" height="12" fill="white" opacity="0.9"/>
      <!-- Círculo dourado com $ -->
      <circle cx="20" cy="14" r="5" fill="#F9BA00"/>
      <text x="20" y="17.5" font-size="6" font-weight="bold" fill="#1A3A4A"
        font-family="Arial,sans-serif" text-anchor="middle">$</text>
    </svg>`,
  },
]

export function getBancoPorSlug(slug: string): BancoCatalogo {
  return BANCOS_CATALOGO.find(b => b.slug === slug) ?? BANCOS_CATALOGO[BANCOS_CATALOGO.length - 1]
}

export function BancoLogoSvg({ slug, size = 32 }: { slug: string; size?: number }) {
  const banco = getBancoPorSlug(slug)
  return (
    <span
      style={{ width: size, height: size, display: 'inline-flex', flexShrink: 0 }}
      dangerouslySetInnerHTML={{
        __html: banco.svg
          .replace('viewBox="0 0 40 40"', `viewBox="0 0 40 40" width="${size}" height="${size}"`)
      }}
    />
  )
}
