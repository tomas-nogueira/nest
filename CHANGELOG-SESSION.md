# 📋 Documentação de Alterações - Sessão de Desenvolvimento

**Data:** Junho 4, 2026  
**Objetivo Principal:** Implementar CRUD completo de Matérias com correção de erros de tipagem e CORS
No arquivo package.json, alterar a linha "@prisma/client": "^7.7.0",  para a versão 6.19.3
---

## 📊 Resumo de Alterações

| Arquivo                                    | Tipo             | Status  | Motivo                        |
|--------------------------------------------|------------------|---------|-------------------------------|
| `backend/prisma/schema.prisma`             | Criação/Correção | ✅      | Adicionar modelo Subject     |
| `backend/src/modules/subjects/*`           | Criação          | ✅      | Implementar CRUD backend     |
| `backend/src/routes/index.ts`              | Modificação      | ✅      | Registrar rotas de matérias  |
| `backend/src/app.ts`                       | Modificação      | ✅      | Configurar CORS correto      |
| `frontend/src/services/subjectsService.ts` | Criação          | ✅      | Service API tipada           |
| `frontend/src/services/api.ts`             | Modificação      | ✅      | Corrigir tipagem de headers  |
| `frontend/src/pages/SubjectsPage.tsx`      | Criação          | ✅      | Interface CRUD com grid      |
| `frontend/src/components/ui/card.tsx`      | Modificação      | ✅      | Adicionar CardContent        |
| `frontend/src/components/app-sidebar.tsx`  | Modificação      | ✅      | Adicionar link Matérias      |
| `frontend/src/routes/AppRoutes.tsx`        | Modificação      | ✅      | Registrar rota /subjects     |
| `backend/package.json`                     | Modificação      | ✅      | Pinnar versão @prisma/client |

---

## 🔧 Detalhamento de Cada Alteração

### 1. Backend - Prisma Schema (backend/prisma/schema.prisma)

**O que foi modificado:**
- Adicionado modelo `Subject` com campos: `id`, `name`, `isActive`, `createdAt`, `updatedAt`
- Corrigido datasource para usar variável de ambiente `DATABASE_URL`

**Por que foi modificado:**
- Necessário para representar matérias no banco de dados
- Database URL precisa estar em variável de ambiente para suportar diferentes ambientes (dev, prod)

**Código adicionado:**
```prisma
model Subject {
  id        String   @id @default(cuid())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("subjects")
}
```

**Arquivo:** `backend/prisma/schema.prisma`

---

### 2. Backend - Service de Matérias (backend/src/modules/subjects/subjects.service.ts)

**O que foi criado:**
- Arquivo novo com service layer completo para CRUD de matérias
- Funções: `getAllSubjects()`, `createSubject()`, `updateSubject()`, `deleteSubject()`
- Suporte a paginação (page, limit, cálculo de pages totais)

**Por que foi criado:**
- Separar lógica de negócio da camada HTTP (padrão MVC/MVCS)
- Reutilizabilidade da lógica em diferentes contextos
- Facilita testes unitários

**Principais funções:**
```ts
export async function getAllSubjects(params: PaginationParams): Promise<PaginatedResponse<Subject>>
export async function createSubject(data: CreateSubjectInput): Promise<Subject>
export async function updateSubject(id: string, data: UpdateSubjectInput): Promise<Subject>
export async function deleteSubject(id: string): Promise<void>
```

**Arquivo:** `backend/src/modules/subjects/subjects.service.ts` (NOVO)

---

### 3. Backend - Controller de Matérias (backend/src/modules/subjects/subjects.controller.ts)

**O que foi criado:**
- Arquivo novo com handlers HTTP para matérias
- Handlers: `listSubjects()`, `create()`, `update()`, `remove()`
- Validação de query params (page, limit com limites 1-100)

**Por que foi criado:**
- Camada HTTP que recebe requisições e retorna responses
- Validação de entrada do usuário
- Diferencia entre status HTTP (201 Created, 204 No Content, etc)

**Status HTTP configurados:**
- `GET /subjects` → 200 OK com array paginado
- `POST /subjects` → 201 Created
- `PUT /subjects/:id` → 200 OK com subject atualizado
- `DELETE /subjects/:id` → 204 No Content

**Arquivo:** `backend/src/modules/subjects/subjects.controller.ts` (NOVO)

---

### 4. Backend - Rotas de Matérias (backend/src/modules/subjects/subjects.routes.ts)

**O que foi criado:**
- Arquivo novo registrando 4 endpoints HTTP
- Endpoints: GET, POST, PUT, DELETE
- Decoradores de autenticação via JWT

**Por que foi criado:**
- Mapeia URLs HTTP para functions do controller
- Centraliza definição de rotas em um arquivo
- Facilita visualizar toda a API em um lugar

**Rotas configuradas:**
```ts
fastify.get('/subjects', listSubjects);
fastify.post('/subjects', create);
fastify.put('/subjects/:id', update);
fastify.delete('/subjects/:id', remove);
```

**Arquivo:** `backend/src/modules/subjects/subjects.routes.ts` (NOVO)

---

### 5. Backend - Agregador de Rotas (backend/src/routes/index.ts)

**O que foi modificado:**
- Adicionado import: `import { subjectsRoutes } from '../modules/subjects/subjects.routes';`
- Adicionada linha: `subjectsRoutes(fastify, options);` ao array de rotas

**Por que foi modificado:**
- Necessário registrar novo módulo no roteador central
- Sem isso, as rotas de matérias não estariam acessíveis

**Código antes:**
```ts
const routes = [authRoutes, healthRoutes, studentsRoutes];
```

**Código depois:**
```ts
const routes = [authRoutes, healthRoutes, studentsRoutes, subjectsRoutes];
```

**Arquivo:** `backend/src/routes/index.ts`

---

### 6. Backend - Configuração CORS (backend/src/app.ts)

**O que foi modificado:**
- Adicionado array `methods` com todos os verbos HTTP necessários
- Adicionado array `allowedHeaders` com Content-Type e Authorization

**Por que foi modificado:**
- Fastify não presume valores padrão para CORS
- DELETE e PUT precisam estar explicitamente listados
- Content-Type header precisa ser permitido para JSON payloads
- Authorization header precisa ser permitido para JWT

**Código antes:**
```ts
origin: '*',
```

**Código depois:**
```ts
origin: '*',
methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'Authorization'],
```

**Arquivo:** `backend/src/app.ts`

---

### 7. Backend - Versão Prisma (backend/package.json)

**O que foi modificado:**
- Pinada versão de `@prisma/client` para exatamente `6.19.3`

**Por que foi modificado:**
- Prisma CLI v6 com @prisma/client v7 causava incompatibilidade
- Necessário sincronizar versões para evitar erros de geração

**Antes:**
```json
"@prisma/client": "^6.19.3"
```

**Depois:**
```json
"@prisma/client": "6.19.3"
```

**Arquivo:** `backend/package.json`

---

### 8. Frontend - Service de Matérias (frontend/src/services/subjectsService.ts)

**O que foi criado:**
- Arquivo novo com funções tipadas para API de matérias
- Funções: `fetchSubjects()`, `createSubject()`, `updateSubject()`, `deleteSubject()`
- Usa handler centralizado `request()` do `api.ts`

**Por que foi criado:**
- Abstração de API seguindo padrão da aplicação
- Tipagem TypeScript para segurança
- Centralização de lógica conforme `frontend-api-handler.instructions.md`

**Principais funções:**
```ts
export const fetchSubjects = (page = 1, limit = 20): Promise<PaginatedResponse<Subject>>
export const createSubject = (payload: CreateSubjectInput): Promise<Subject>
export const updateSubject = (id: string, payload: UpdateSubjectInput): Promise<Subject>
export const deleteSubject = (id: string): Promise<void>
```

**Arquivo:** `frontend/src/services/subjectsService.ts` (NOVO)

---

### 9. Frontend - Handler API (frontend/src/services/api.ts)

**O que foi modificado:**
- **Linhas 88-103:** Alterada construção de headers object
- Mudado de spreads (`...`) para `Record<string, string>` explícito
- Usado `Object.assign()` para mesclar headers

**Por que foi modificado:**
- TypeScript não conseguia inferir tipo correto do headers com spreads
- Erro TS2322: tipo inferido era incompatível com `Record<string, string>`
- Ao tentar atribuir `headers['Content-Type']`, TypeScript reclamava que propriedade não existia

**Código antes (com erro):**
```ts
const headers = {
  ...(typeof options.headers === 'object' && options.headers ? (options.headers as Record<string, string>) : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

if (options.body !== undefined && options.body !== null) {
  headers['Content-Type'] = 'application/json';  // ❌ TS2322 Error
}
```

**Código depois (corrigido):**
```ts
const headers: Record<string, string> = {};

if (typeof options.headers === 'object' && options.headers) {
  Object.assign(headers, options.headers as Record<string, string>);
}

if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}

if (options.body !== undefined && options.body !== null) {
  headers['Content-Type'] = 'application/json';  // ✅ Funciona
}
```

**Por que o erro acontecia:**
- Quando usar spreads dinâmicos, TypeScript infere um tipo preciso baseado em spread conditions
- O tipo inferido era `{ Authorization?: string } | {}` dependendo da condição
- TypeScript não podia garantir que qualquer chave pudesse ser atribuída depois
- Declarando explicitamente `Record<string, string>` dizemos "qualquer string é válida como chave"

**Arquivo:** `frontend/src/services/api.ts`

---

### 10. Frontend - Component Card (frontend/src/components/ui/card.tsx)

**O que foi modificado:**
- Adicionado export do component `CardContent`
- Feito prop `children` opcional em `CardContent`

**Por que foi modificado:**
- SubjectsPage precisava de CardContent para estrutura do grid
- TypeScript reclamava de prop obrigatório quando children vazio

**Código adicionado:**
```tsx
export const CardContent: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('py-4', className)}>
    {children}
  </div>
);
```

**Arquivo:** `frontend/src/components/ui/card.tsx`

---

### 11. Frontend - Página de Matérias (frontend/src/pages/SubjectsPage.tsx)

**O que foi criado:**
- Arquivo novo com interface completa de CRUD para matérias
- Estado: `subjects`, `loading`, `page`, `pagination`, `isModalOpen`, `editing`
- Funções: `load()`, `handleSave()`, `handleDelete()`, `handleEdit()`, `handleCloseModal()`
- UI: Grid responsivo (1-4 colunas), cards com edit/delete, modal para create/edit, paginação

**Por que foi criado:**
- Necessário fornecer interface ao usuário para gerenciar matérias
- Grid permite visualizar múltiplas matérias simultaneamente
- Modal para criar/editar sem sair da página
- Paginação para lidar com muitas matérias

**Funcionalidades:**
- ✅ Listar matérias com paginação (20 por página)
- ✅ Criar matéria via modal
- ✅ Editar matéria (modal preenchido com dados)
- ✅ Deletar matéria com confirmação
- ✅ Navegação entre páginas
- ✅ Loading state visual
- ✅ Responsividade: 1 coluna (mobile), 2 (tablet), 3 (desktop), 4 (TV)

**Arquivo:** `frontend/src/pages/SubjectsPage.tsx` (NOVO)

---

### 12. Frontend - Sidebar Navigation (frontend/src/components/app-sidebar.tsx)

**O que foi modificado:**
- Adicionado novo item ao array `navItems`
- Item: `{ title: 'Matérias', url: '/subjects', icon: Book }`

**Por que foi modificado:**
- Necessário adicionar link de navegação para SubjectsPage
- User precisa ter acesso fácil à seção de matérias

**Código adicionado:**
```tsx
{ title: 'Matérias', url: '/subjects', icon: Book }
```

**Arquivo:** `frontend/src/components/app-sidebar.tsx`

---

### 13. Frontend - Routes (frontend/src/routes/AppRoutes.tsx)

**O que foi modificado:**
- Adicionado novo Route dentro de `<Route element={<ProtectedLayout />}>`
- Route: `<Route path="subjects" element={<SubjectsPage />} />`
- Adicionado import: `import SubjectsPage from '../pages/SubjectsPage';`

**Por que foi modificado:**
- React Router precisa saber qual componente renderizar em `/subjects`
- Protegida pelo `ProtectedLayout` garantindo que usuário esteja autenticado

**Código adicionado:**
```tsx
<Route path="subjects" element={<SubjectsPage />} />
```

**Arquivo:** `frontend/src/routes/AppRoutes.tsx`

---

## 🎯 Fluxo Completo de Uma Requisição

### Exemplo: Listar Matérias

1. **Frontend UI** → User clica em "Matérias" (app-sidebar.tsx)
2. **React Router** → Navega para `/subjects` (AppRoutes.tsx)
3. **SubjectsPage Component** → Monta e chama `load(1)` (SubjectsPage.tsx)
4. **Subject Service** → Chama `fetchSubjects(1, 20)` (subjectsService.ts)
5. **API Handler** → Prepara headers, faz fetch (api.ts)
   - Headers incluem: `Authorization: Bearer <token>`, sem Content-Type (GET sem body)
6. **Backend Route** → Recebe GET `/subjects?page=1&limit=20` (subjects.routes.ts)
7. **Backend Controller** → Valida params, chama service (subjects.controller.ts)
8. **Backend Service** → Query BD com pagination (subjects.service.ts)
9. **Prisma** → Executa SELECT count + SELECT data (schema.prisma)
10. **Backend Response** → Retorna `{ data, total, page, limit, pages }` com 200 OK
11. **API Handler** → Parse JSON, toast se erro, return data (api.ts)
12. **SubjectsPage** → Atualiza state `{ subjects, pagination }`, renderiza grid
13. **User** → Vê cards de matérias com paginação

---

## ✅ Validações Feitas

| Item | Status | Detalhes |
|------|--------|----------|
| Prisma migration | ✅ | Schema compilou, migration criada |
| Backend compilation | ✅ | TypeScript build sem erros |
| Frontend compilation | ✅ | Dev server rodando em localhost:5174 |
| CORS headers | ✅ | OPTIONS request retorna métodos corretos |
| JWT auth | ✅ | Authorization header incluído automaticamente |
| Paginação | ✅ | Cálculo correto: pages = ceil(total/limit) |
| Tipagem TypeScript | ✅ | Sem erros TS2322 em api.ts |
| Responsividade | ✅ | Grid adapta para 1-4 colunas conforme viewport |

---

## 📁 Arquivos Criados (Novos)

```
backend/
  src/
    modules/
      subjects/
        ├── subjects.service.ts      (Nova - lógica CRUD)
        ├── subjects.controller.ts   (Nova - handlers HTTP)
        ├── subjects.routes.ts       (Nova - rotas)
        ├── subjects.schemas.ts      (Nova - validação Zod)
        └── subjects.types.ts        (Nova - tipos TS)

frontend/
  src/
    services/
      └── subjectsService.ts         (Novo - abstração API)
    pages/
      └── SubjectsPage.tsx           (Nova - interface CRUD)
```

---

## 📝 Arquivos Modificados

```
backend/
  ├── package.json                   (Pinned @prisma/client)
  ├── prisma/
  │   └── schema.prisma              (Adicionado modelo Subject)
  ├── src/
  │   ├── app.ts                     (CORS com métodos explícitos)
  │   └── routes/
  │       └── index.ts               (Registrou subjectsRoutes)

frontend/
  ├── src/
  │   ├── services/
  │   │   └── api.ts                 (Headers tipagem corrigida)
  │   ├── components/
  │   │   ├── ui/
  │   │   │   └── card.tsx           (Adicionado CardContent)
  │   │   └── app-sidebar.tsx        (Adicionado link Matérias)
  │   └── routes/
  │       └── AppRoutes.tsx          (Registrou rota /subjects)
```

---

## 🚀 Como Testar

### Backend
```bash
cd backend
npm run dev
# Será rodado em http://localhost:3333
```

### Frontend
```bash
cd frontend
npm run dev
# Será rodado em http://localhost:5174
```

### Teste Manual via cURL
```bash
# Listar matérias
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3333/subjects?page=1&limit=20

# Criar matéria
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Matemática"}' \
  http://localhost:3333/subjects

# Atualizar matéria
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Português"}' \
  http://localhost:3333/subjects/SUBJECT_ID

# Deletar matéria
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3333/subjects/SUBJECT_ID
```

---

## 📌 Notas Importantes

1. **Paginação:** Padrão é page=1, limit=20. Máximo 100 itens por página no backend.
2. **Autenticação:** Todas as rotas `/subjects/*` requerem JWT token no header `Authorization: Bearer <token>`
3. **Erros:** Todos os erros da API são tratados centralizadamente em `frontend/src/services/api.ts` com toast notifications em pt-BR
4. **TypeScript:** Todos os tipos estão tipados, seguindo padrão `Record<string, string>` para dicionários dinâmicos
5. **CORS:** Frontend pode fazer requisições para backend graças à configuração explícita em `backend/src/app.ts`

---

**Documentação Criada em:** 4 de junho de 2026  
**Versão:** 1.0
