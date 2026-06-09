---
applyTo: "backend/**/*.{ts,tsx},frontend/src/**/*.{ts,tsx}"
description: "Use when creating or editing features that upload, store, remove, list, or retrieve files through the backend API."
---

# Regra: features com upload e recuperacao de arquivos

## Objetivo
Padronizar features que enviam, armazenam, removem ou recuperam arquivos, mantendo as regras de negocio desacopladas do armazenamento fisico.

O storage local e apenas uma implementacao de infraestrutura. Casos de uso, controllers e modulos de dominio nao devem depender diretamente de disco local, caminhos absolutos, `fs`, S3, Azure Blob, Google Cloud Storage ou qualquer provider concreto.

## Regras obrigatorias no backend
- Usar sempre o contrato `StorageProvider` para salvar, remover ou obter URL/caminho de arquivo.
- Nao acessar `LocalStorageProvider` diretamente em controllers ou regras de negocio.
- Nao usar `fs`, `path` de armazenamento, ou escrita em disco dentro de services de negocio.
- Delegar armazenamento ao provider configurado pela factory de storage.
- Persistir no banco apenas metadados necessarios e o caminho/identificador retornado pelo provider.
- Nao salvar o conteudo binario do arquivo no banco.
- Validar extensao, MIME Type e assinatura/conteudo do arquivo antes de persistir metadados.
- Aceitar apenas formatos explicitamente permitidos pelo projeto.
- Gerar nomes armazenados unicos; nunca confiar no nome original para gravar no disco/provider.
- Tratar path traversal e nomes invalidos no provider de infraestrutura.
- Retornar mensagens publicas em pt-BR.
- Nao expor caminhos internos absolutos, stack traces, detalhes de filesystem ou mensagens tecnicas para o usuario.

## Fluxo padrao no backend
1. Controller recebe a requisicao HTTP e extrai o arquivo.
2. Controller valida autenticacao/autorizacao quando aplicavel.
3. Controller chama um service/caso de uso tipado.
4. Service valida entrada e regras de negocio.
5. Service delega armazenamento ao `StorageProvider`.
6. Service persiste metadados no repositorio/Prisma.
7. Em falha na persistencia depois do upload, remover o arquivo salvo para evitar lixo no storage.
8. Controller retorna somente dados seguros para o frontend.

## Recuperacao de arquivo
- Buscar metadados pelo identificador no banco.
- Usar o provider para montar URL/caminho de acesso quando necessario.
- Nao montar URL/caminho manualmente no controller.
- Nao retornar caminho absoluto local.
- Se o arquivo nao existir no banco, retornar erro de aplicacao em pt-BR.

## Remocao de arquivo
- Buscar os metadados antes da remocao.
- Remover o arquivo via `StorageProvider`.
- Remover ou marcar como removido no banco conforme a regra da feature.
- Considerar compensacao ou log quando houver falha entre remover do storage e atualizar o banco.

## Estrutura recomendada
```txt
backend/src/modules/<modulo>/
  <modulo>.controller.ts
  <modulo>.routes.ts
  <modulo>.service.ts
  <modulo>.schemas.ts
  repositories/
  domain/
```

Para infraestrutura compartilhada de arquivos, reutilizar:
```txt
backend/src/modules/files/
  domain/storage-provider.ts
  infrastructure/storage/
  validation/
  repositories/
```

## Regras obrigatorias no frontend
- Nao usar `fetch` direto em componentes, paginas, hooks ou contextos.
- Toda chamada ao backend deve passar por `frontend/src/services/api.ts`.
- Criar um service tipado em `frontend/src/services/` para encapsular endpoints de arquivo.
- Componentes devem consumir funcoes do service, nao montar requests manualmente.
- Se a feature usar `FormData`, ajustar o handler central `request<T>` para nao forcar `Content-Type: application/json` em requests multipart.
- Deixar o navegador definir automaticamente o `Content-Type` de `FormData`.
- Nao tratar erro de API localmente com toasts paralelos se o handler central ja cobre o caso.
- Tipar respostas de upload/get com os metadados retornados pela API.

## Exemplo de service frontend
```ts
import { request } from './api';

type StoredFile = {
  id: string;
  originalName: string;
  storedName: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type FileResponse = {
  file: StoredFile;
};

export const uploadFile = (file: File, token: string) => {
  const formData = new FormData();
  formData.append('file', file);

  return request<FileResponse>('/files', {
    method: 'POST',
    body: formData,
  }, token);
};

export const fetchFileById = (fileId: string, token: string) => {
  return request<FileResponse>(`/files/${fileId}`, {}, token);
};
```

## Checklist rapido
- A regra de negocio depende apenas de contrato, e nao de provider concreto?
- O arquivo foi validado por extensao, MIME Type e assinatura?
- O nome armazenado e unico e gerado pelo backend?
- O banco salva apenas metadados e referencia/caminho seguro?
- Existe compensacao para falha depois de salvar no storage?
- O frontend usa service tipado e `request<T>` centralizado?
- Upload multipart evita `Content-Type: application/json` no request central?
- As respostas e erros publicos estao em pt-BR?
