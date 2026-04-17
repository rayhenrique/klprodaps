# Escopo do MVP: ProdAPS

O objetivo do MVP é validar a substituição das folhas de cálculo e o engajamento dos diretores com o feedback visual das metas.

## ✅ O QUE ESTÁ NO SCOPE (Must Have)

### 1. Infraestrutura e Auth
- Sistema de login com 3 níveis de acesso.
- Redirecionamento automático baseado no papel (Role-based redirect).

### 2. Módulo do Diretor (Ponta)
- Dashboard simplificado com o status atual do mês (Barra de progresso colorida).
- Formulário de envio diário otimizado para telemóvel.
- **Campo de observação** integrado no envio.
- Trava lógica para bloqueio de envios ao fim de semana.

### 3. Módulo do Coordenador (Gestão)
- Painel consolidado com a lista de todas as UBS.
- Filtro por data para verificar produções passadas.
- Visualização de **observações** enviadas pela ponta.
- Cadastro manual de metas (Médico, Enf, Odonto) para cada unidade.

### 4. Customização (Superadmin)
- Interface para upload de Logótipo (Supabase Storage).
- Alteração do nome do sistema para exibição no Header e Relatórios.

### 5. Ratificando o scope
1. **Lógica de Acumuladores:** O sistema deve somar a produção diária do mês corrente e comparar o total com as faixas quantitativas da UBS.
2. **Dashboard de Velocímetros:** O ponteiro do Gauge deve apontar para o valor absoluto acumulado. O fundo do Gauge deve ser colorido conforme a faixa atingida.
3. **Trava de FDS:** Bloqueio de inputs aos sábados e domingos.
4. **Edição Restrita:** Diretor edita apenas no próprio dia; Coordenador edita sempre.
5. **Observações:** Persistência de texto para notas de campo.

## ❌ O QUE NÃO ESTÁ NO SCOPE (Future Scope)
- Exportação automática de relatórios para PDF ou Excel.
- Envio de alertas de pendência via WhatsApp.
- Gráficos de linha históricos para análise de sazonalidade.
- Gestão de stock de insumos da UBS.

## 💡 Hipóteses a Validar
1. O campo de **Observação** reduz a necessidade de chamadas telefónicas da coordenação para entender baixas de produção.
2. A impossibilidade de editar após o dia do envio aumenta a precisão e a responsabilidade no preenchimento dos dados.
3. A visualização das metas em cores (Verde/Azul vs Vermelho) gera uma competição saudável entre as unidades.

## 📈 Métricas de Sucesso do MVP
- Taxa de adesão: > 90% das UBS preenchendo diariamente nos primeiros 30 dias.
- Tempo de resposta: Coordenadores conseguirem fechar o relatório de produtividade em menos de 10 minutos após o fim do mês.