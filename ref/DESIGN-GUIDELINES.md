# Design Guidelines: ProdAPS

## Estilo Visual
- **Referência**: Linear / Vercel (Clean, High-contrast, Light Mode).
- **Base**: shadcn/ui.

## Paleta de Cores
- **Primária**: Indigo-600 (#4F46E5) ou Slate-900 para UI.
- **Status de Performance (Obrigatório)**:
    - Regular: `bg-red-500` / `text-red-700`
    - Suficiente: `bg-orange-500` / `text-orange-700`
    - Bom: `bg-green-500` / `text-green-700`
    - Ótimo: `bg-blue-500` / `text-blue-700`

## Tipografia
- **Sans-serif**: Inter ou Geist (Google Fonts).

## Componentes-Chave
- **Cards**: Para métricas individuais.
- **Gauge/Progress**: Componente personalizado para mostrar o % da meta.
- **Form**: Floating labels ou inputs grandes para facilitar uso no celular em movimento.
- **Data Table**: Com filtros por UBS e Data para o perfil Coordenador.