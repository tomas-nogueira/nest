# 📋 Documentação de Alterações - CRUD de Cursos e Validação de Matérias

**Data:** Junho 9, 2026
**Objetivo:** Implementar o frontend para gerenciamento de cursos, adicionar rota no sidebar e garantir que a criação de matérias só ocorra se houver pelo menos um curso criado.

---

## 📊 Resumo de alterações

| Arquivo | Tipo | Status | Descrição |
|---|---|---|---|
| `frontend/src/services/coursesService.ts` | Criação | ✅ | Novo service com API tipada para gerenciamento de cursos |
| `frontend/src/pages/CoursesPage.tsx` | Criação | ✅ | Página de CRUD de cursos com interface de listagem e modal |
| `frontend/src/components/app-sidebar.tsx` | Modificação | ✅ | Adiciona rota de cursos ao menu lateral |
| `frontend/src/routes/AppRoutes.tsx` | Modificação | ✅ | Registra rota protegida para a página de cursos |
| `frontend/src/services/subjectsService.ts` | Modificação | ✅ | Extende payloads de matérias para aceitar curso vinculado |
| `frontend/src/pages/SubjectsPage.tsx` | Modificação | ✅ | Adiciona validação de existência de cursos e seleção de curso na criação |

---

## 🔧 Detalhamento por arquivo

### `frontend/src/services/coursesService.ts`

**O que faz:**
- Encapsula todas as chamadas HTTP relacionadas a cursos.
- Usa o handler centralizado `request()` de `frontend/src/services/api.ts` para garantir tratamento de erro uniforme.
- Define tipos TypeScript para o retorno e payload.

**Por que alterei/adicionei:**
- Para evitar `fetch` direto em componentes e seguir a regra do `.github/instructions/frontend-api-handler.instructions.md`.
- Para ter um ponto único de manutenção das chamadas de curso.

**Funcionamento:**
- `fetchCourses(page, limit)`: busca lista paginada de cursos.
- `createCourse(payload)`: cria um curso.
- `updateCourse(id, payload)`: atualiza um curso existente.
- `deleteCourse(id)`: remove um curso.

**Importância:**
- Garante consistência no consumo da API.
- Facilita testes futuros e refatorações.
- Reduz duplicação e mantém a mesma abordagem usada por `subjectsService.ts`.

---

### `frontend/src/pages/CoursesPage.tsx`

**O que faz:**
- Exibe a listagem de cursos em cards.
- Permite criar, editar e excluir cursos.
- Mostra estados vazios e carregamento.

**Por que alterei/adicionei:**
- O projeto precisava de uma interface de gerenciamento de cursos para suportar a relação `Subject` ↔ `Course`.
- Sem essa página, o usuário não teria como cadastrar cursos e vincular matérias corretamente.

**Funcionamento:**
- Ao montar, carrega a página de cursos com `fetchCourses(1, 20)`.
- Usa modal para criar/editar cursos com controle de estado local.
- Atualiza a lista após operações de cadastro, edição e exclusão.

**Importância:**
- Permite ao usuário gerir a base de cursos antes de criar matérias.
- Oferece uma experiência consistente com o restante do app, usando os mesmos componentes de UI.

---

### `frontend/src/components/app-sidebar.tsx`

**O que faz:**
- Mostra a navegação lateral do aplicativo.
- Adiciona um item `Cursos` ao menu principal.

**Por que alterei:**
- O dashboard já tinha links para `Posts` e `Matérias`.
- Era necessário tornar `Cursos` acessível com o mesmo nível de prioridade.

**Funcionamento:**
- Insere `Cursos` entre `Posts` e `Matérias`.
- Usa o mesmo componente de ícone e estrutura de menu existente.

**Importância:**
- Melhora a usabilidade, evitando que a nova funcionalidade fique oculta.
- Assegura consistência visual e de navegação com o layout atual.

---

### `frontend/src/routes/AppRoutes.tsx`

**O que faz:**
- Define as rotas principais da aplicação React.
- Registra a rota protegida `courses` para o `CoursesPage`.

**Por que alterei:**
- A nova página precisava estar disponível dentro da navegação autenticada.
- Sem isso, o link no sidebar não funcionaria corretamente.

**Funcionamento:**
- Adiciona `<Route path="courses" element={<CoursesPage />} />` dentro das rotas protegidas.
- Mantém `home` e `subjects` com a mesma proteção de acesso.

**Importância:**
- Permite acessar a página de cursos somente após autenticação.
- Integra a nova funcionalidade com a arquitetura de rotas existente.

---

### `frontend/src/services/subjectsService.ts`

**O que faz:**
- Define as chamadas de API relacionadas a matérias.
- Estende os payloads de criação/atualização para suportar `courseIds`.

**Por que alterei:**
- O backend agora permite criar uma matéria vinculada a um curso.
- Era necessário refletir essa capacidade no frontend para enviar a informação correta.

**Funcionamento:**
- `createSubject({ name, courseIds })` envia o curso selecionado ao backend.
- `updateSubject(id, { name, courseIds })` permanece compatível com futuras atualizações.

**Importância:**
- Torna o fluxo de criação de matéria compatível com o relacionamento do banco.
- Evita problemas de integração entre frontend e backend.

---

### `frontend/src/pages/SubjectsPage.tsx`

**O que faz:**
- Exibe a lista de matérias.
- Controla criação, edição e exclusão de matérias.
- Verifica se existem cursos para permitir a criação de matérias.
- Inclui seleção de curso no modal de criação.

**Por que alterei:**
- O requisito era impedir a criação de matérias quando não houver nenhum curso.
- Precisávamos garantir que cada matéria estivesse vinculada a pelo menos um curso.

**Funcionamento:**
- Carrega a lista de cursos com `fetchCourses` ao abrir a página.
- Desabilita `+ Nova Matéria` se não houver cursos.
- Se não houver cursos e não houver matérias, mostra mensagem com botão para ir a `/courses`.
- No modal, apresenta um `select` de cursos antes de criar uma nova matéria.
- Ao criar, envia `courseIds: [selectedCourseId]` para o backend.

**Importância:**
- Garante a integridade do fluxo de criação de matérias conforme o modelo de dados.
- Melhora a experiência do usuário ao mostrar claramente que um curso é pré-requisito.
- Evita falhas de validação e requisições inválidas ao backend.

---

## 📌 Observações finais

- A documentação segue o formato do `CHANGELOG-SESSION.md` existente, com seção de resumo e detalhamento por arquivo.
- Todas as alterações foram feitas sem modificar `CHANGELOG-SESSION.md` original.
- As regras do `.github/instructions/frontend-api-handler.instructions.md` foram respeitadas.
- Os textos e botões foram mantidos em pt-BR para consistência de linguagem.
