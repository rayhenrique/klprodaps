# Brief: ProdAPS - Gestão de Produtividade na Atenção Primária

## Problema
A coordenação de Atenção Primária (APS) sofre com a falta de dados em tempo real. O processo atual via Google Forms/Sheets gera dados fragmentados, dificulta a cobrança de pendências, não permite permissões de acesso por unidade e torna o acompanhamento de metas um processo manual e visualmente exaustivo.

## Solução
Uma plataforma web mobile-first (Next.js + Supabase) onde Diretores de UBS registram a produção diária de forma simples. O sistema consolida automaticamente os dados em Dashboards de performance (Gauges) com alertas visuais por cores, permitindo que a gestão identifique gargalos instantaneamente.

## Público-Alvo
- **Secretarias Municipais de Saúde**: Coordenação de Atenção Básica/Primária.
- **Diretores de UBS**: Responsáveis pelo preenchimento diário.

## Diferencial Competitivo
- **Visualização Semafórica**: Cores intuitivas para metas (Vermelho a Azul).
- **Controle de Acesso Rígido**: Cada Diretor vê apenas sua unidade; Coordenadores veem o todo.
- **Trava de Integridade**: Bloqueio de envios em fins de semana e janela restrita para edição.

## Métricas de Sucesso
- 100% das UBS com dados preenchidos até as 23h de cada dia útil.
- Redução de zero para tempo real no fechamento mensal de produtividade.