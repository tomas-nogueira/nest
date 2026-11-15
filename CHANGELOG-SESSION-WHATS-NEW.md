# Alterações da página Novidades

- **Título alteração/implementação:** Modelo e migration de novidades
  - **Arquivo:** `backend/prisma/schema.prisma`; `backend/prisma/migrations/20261115230203_add_changelog/migration.sql`
  - **Motivo:** Persistir o histórico de mudanças no PostgreSQL e relacioná-lo ao autor.
  - **Resumo:** Adicionado o modelo `ChangeLog`, a relação com `Student` e o índice por data de publicação.

- **Título alteração/implementação:** API de novidades
  - **Arquivo:** `backend/src/modules/changelog/*`; `backend/src/routes/index.ts`
  - **Motivo:** Disponibilizar operações de listagem, criação, edição e exclusão com segurança.
  - **Resumo:** Criado CRUD paginado, validação Zod, autorização administrativa, ordenação por data e respostas sem dados sensíveis.

- **Título alteração/implementação:** Serviço frontend
  - **Arquivo:** `frontend/src/services/changelogService.ts`
  - **Motivo:** Centralizar as requisições da página no handler padrão da aplicação.
  - **Resumo:** Adicionados tipos e funções tipadas para listar, criar, atualizar e excluir novidades.

- **Título alteração/implementação:** Página Novidades
  - **Arquivo:** `frontend/src/pages/WhatsNewPage.tsx`
  - **Motivo:** Permitir que usuários autenticados consultem o histórico e que administradores o gerenciem.
  - **Resumo:** Implementados cards, paginação por URL, estados de carregamento/erro/vazio, formulários em modal e confirmação de exclusão.

- **Título alteração/implementação:** Navegação e rota protegida
  - **Arquivo:** `frontend/src/components/app-sidebar.tsx`; `frontend/src/routes/AppRoutes.tsx`; `frontend/src/layouts/ProtectedLayout.tsx`
  - **Motivo:** Tornar a página acessível pelo menu e pelo fluxo autenticado.
  - **Resumo:** Adicionado o item “Novidades”, a rota `/whats-new` e o cabeçalho correspondente.

- **Título alteração/implementação:** Documentação
  - **Arquivo:** `OVERVIEW_NEST.md`
  - **Motivo:** Registrar a nova funcionalidade na visão geral do projeto.
  - **Resumo:** Incluída uma linha sobre a página de Novidades.

- **Título alteração/implementação:** Refatoração do seed da novidade padrão
  - **Arquivo:** `backend/prisma/seed.ts`
  - **Motivo:** Manter a função `main` enxuta e seguir o padrão de funções nomeadas do seed.
  - **Resumo:** Extraídas as funções `getOrCreateAdmin` e `ensureDefaultChangeLog`, preservando a criação idempotente da novidade de boas-vindas.
