---
applyTo: "frontend/src/**/*.{ts,tsx}"
description: "Use when creating or editing frontend requests to backend APIs; enforce centralized request handler usage with automatic shadcn toast error handling."
---

# Regra: Requisicoes ao backend no frontend

## Objetivo
Padronizar todas as requisicoes HTTP para o backend com o handler global de `frontend/src/services/api.ts`, garantindo tratamento unico de erro e exibicao de toaster para o usuario.

## Regras obrigatorias
- Nao usar `fetch` direto em componentes, hooks, contextos, paginas ou outros services.
- Nao criar clientes HTTP paralelos (ex.: outro wrapper com `fetch`/`axios`) para backend da aplicacao.
- Toda chamada ao backend deve usar `request<T>(path, options, token?)` de `frontend/src/services/api.ts`.
- Mensagens de erro para o usuario devem vir do fluxo centralizado do handler global (toast via `sonner`).
- Se um novo caso de erro nao estiver coberto, ampliar o parser/handler em `frontend/src/services/api.ts` em vez de tratar localmente em cada tela.

## Padrao de implementacao
1. Criar/editar um service em `frontend/src/services/`.
2. Importar `request` de `frontend/src/services/api.ts`.
3. Encapsular endpoint em funcao tipada no service.
4. Consumir esse service no contexto/pagina/componente.

## Exemplo
```ts
import { request } from './api';

type ProfileResponse = {
  user: {
    id: string;
    name: string;
  };
};

export const fetchProfile = (token: string) => {
  return request<ProfileResponse>('/auth/me', {}, token);
};
```

## Checklist rapido
- Existe `fetch` direto novo no frontend? Se sim, refatorar para `request`.
- Existe toast local para erro de API? Se sim, avaliar remocao e centralizacao.
- A chamada foi movida para service tipado em `frontend/src/services/`?
