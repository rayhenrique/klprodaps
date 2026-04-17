# PRD: ProdAPS (Productivity APS)

## 1. Visão Geral
O ProdAPS é uma plataforma de gestão de performance para a Atenção Primária à Saúde. O sistema substitui formulários manuais por um fluxo digitalizado de recolha de dados diários, oferecendo painéis visuais (velocímetros) para monitorização de metas em tempo real.

## 2. Personas e Matriz de Permissões

| Papel | Descrição | Permissões Principais |
| :--- | :--- | :--- |
| **Superadmin** | Administrador do Sistema | Personalização de marca (logo/nome), gestão de utilizadores e atribuição de diretores às suas respetivas UBS. |
| **Coordenador** | Gestor Operacional | Visualização total de todas as UBS, cadastro de unidades e metas mensais, edição de qualquer registo e geração de relatórios. |
| **Diretor** | Execução na Unidade | Preenchimento da produção diária da sua UBS, visualização de dashboard próprio e edição limitada ao próprio dia. |

## 3. Requisitos Funcionais

### RF01: Recolha de Produção Diária (Mobile-First)
- **Campos Numéricos:** Médico, Enfermagem, Odontologia, Receitas, Notificações, Nutricionista, Psicologia e Faltas.
- **Campo de Texto:** **Observação** (Obrigatório se algum campo crítico estiver a zero, opcional nos restantes casos).
- **Regra de Bloqueio:** O sistema deve impedir novos registos aos Sábados e Domingos.

### RF02: Gestão de Metas e Cores
- O sistema deve permitir configurar metas mensais para Médicos, Enfermagem e Odontologia por UBS.
- **Cálculo de Status (Legenda Semafórica):**
    - **< 100%:** Regular (Vermelho)
    - **100% - 149%:** Suficiente (Laranja)
    - **150% - 250%:** Bom (Verde)
    - **> 250%:** Ótimo (Azul)
ou
### RF02.01: Motor de Status Quantitativo
As cores dos Dashboards (Gauges) serão disparadas pelos seguintes valores acumulados (Exemplo configurável por UBS):
- **0 a 99 atendimentos:** Regular (Vermelho)
- **100 a 149 atendimentos:** Suficiente (Laranja)
- **150 a 249 atendimentos:** Bom (Verde)
- **250 ou mais atendimentos:** Ótimo (Azul)

A performance não é baseada em percentual, mas em **faixas de produção absoluta** acumulada no mês.

*Nota: Os valores de corte devem ser editáveis pelo Coordenador para cada UBS.*

### RF03: Janela de Edição e Integridade
- O Diretor só pode editar o seu próprio envio se a data atual for igual à data do registo (`created_at`).
- O Coordenador tem "master bypass" para editar qualquer data.

### RF04: Dashboard de Gestão
- Lista de pendências: Identificar quais UBS ainda não submeteram a produção no dia útil atual.
- Alerta de Observação: Se um registo possui texto no campo "Observação", deve exibir um ícone de alerta no painel do Coordenador.

### RF05: Campo de Observação
- Incluído campo de texto livre no formulário diário para justificativas operacionais.

## 4. Requisitos Não Funcionais
- **Interface:** Clean, Light Mode, baseada em `shadcn/ui`.
- **Performance:** Carregamento de Dashboards em menos de 2 segundos.
- **Segurança:** Row Level Security (RLS) no Supabase para isolamento de dados por UBS para o perfil Diretor.

## 5. Casos de Borda (Edge Cases)
- **Feriados:** O sistema deve permitir preenchimento em dias úteis que sejam feriados (visto que a UBS pode ter escala especial).
- **Troca de Diretor:** O Superadmin deve conseguir reatribuir uma UBS a um novo utilizador sem perder o histórico.