---
applyTo: "backend/src/modules/posts/**/*.{ts,tsx},frontend/src/components/posts/**/*.{ts,tsx},frontend/src/pages/DashboardPage.tsx,frontend/src/services/postsService.ts,backend/prisma/schema.prisma,backend/prisma/migrations/**/*"
description: "Use when creating or editing academic posts, filters, votes, attachments, rich text content, or related schema/migrations."
---

# Regras do modulo de posts academicos

## Escopo funcional
- Posts academicos sao usados para compartilhamento de materiais entre estudantes.
- Todo post deve estar associado a uma disciplina (`subjectId` obrigatorio).
- O schema atual nao deve adicionar `courseId` em `Post`.
- Uma disciplina pode estar vinculada a mais de um curso por `SubjectCourse`.
- Todos os estudantes autenticados podem visualizar posts publicados.
- A criacao e edicao de posts devem permitir selecionar apenas disciplinas vinculadas ao curso do autor.
- O filtro por disciplina filtra diretamente por `Post.subjectId`.
- O filtro por curso filtra posts por disciplinas vinculadas ao curso selecionado via `SubjectCourse`.
- Quando um curso for selecionado no filtro, o filtro de disciplinas deve exibir apenas disciplinas vinculadas a esse curso.
- No filtro de cursos, abaixo de "Todos os cursos", o curso do usuario deve aparecer primeiro quando existir e estiver ativo; os demais cursos aparecem depois.
- O sistema de votos existente deve ser reutilizado para upvote/downvote.

## Conteudo do post
- O post deve possuir titulo obrigatorio.
- O subtitulo e opcional e deve aparecer mediante acao explicita do usuario no editor.
- O conteudo rich text pode ser vazio somente se houver pelo menos um anexo.
- O botao de publicar deve ficar bloqueado quando nao houver conteudo escrito nem anexo.
- Conteudo rich text deve ser persistido como JSON estruturado, nao como HTML.
- Renderizacao de rich text no frontend deve ser feita de forma segura, sem `dangerouslySetInnerHTML`.
- Validar links e protocolos permitidos.
- Limitar tamanho do JSON rich text, quantidade de nos e quantidade de texto para evitar payloads abusivos.
- Materiais extensos devem ser enviados como anexos, nao como texto gigante dentro do JSON do editor.

## Editor rich text
- O editor deve preservar, quando possivel, formatacao moderna semelhante a Notion.
- Deve suportar:
  - negrito;
  - italico;
  - sublinhado;
  - tachado;
  - codigo inline;
  - blocos de codigo;
  - listas;
  - citacoes;
  - links;
  - cabecalhos.

## Anexos
- Anexos devem usar o modulo de arquivos e o contrato `StorageProvider`.
- Nao acoplar posts diretamente ao storage local, filesystem, S3, R2 ou provider concreto.
- Imagens permitidas: JPG, JPEG, PNG e WEBP.
- PDFs devem permitir preview dentro da aplicacao, modal de visualizacao e download.
- Todos os anexos devem possuir opcao de download.
- Imagens devem ser exibidas inline no post, sem exigir clique para visualizacao inicial.
- Se houver mais de 4 imagens, mostrar as 4 primeiras e overlay `+N`.
- Modal de imagens deve permitir avancar/voltar quando houver imagem anterior/proxima.
- Upload deve validar extensao, MIME Type, assinatura/conteudo e tamanho.
- Nomes armazenados devem ser gerados pelo backend e unicos.

## Feed e filtros
- O feed deve exibir posts de todos os cursos por padrao.
- Deve haver filtro pesquisavel por curso.
- Deve haver filtro pesquisavel por disciplina.
- Selecionar curso deve restringir as disciplinas disponiveis no filtro de disciplina.
- Se a disciplina selecionada nao pertencer mais ao curso selecionado, a selecao de disciplina deve ser limpa.
- O post nao deve crescer indefinidamente na tela; conteudo longo deve colapsar com acao "Ler mais...".
- Votos devem aparecer na parte inferior esquerda do post.
- O voto escolhido pelo usuario deve ficar visualmente marcado.
- Autores devem ter menu de tres pontos no canto superior direito com editar e excluir.
- Editar e excluir devem ser funcionais apenas para o autor.
- Confirmacao de exclusao deve usar modal/toast/componentes da aplicacao, nao `window.alert` ou confirmacao nativa do navegador.

## Backend
- Validar autenticacao em todos os endpoints de posts e arquivos relacionados.
- Criacao e edicao devem garantir que a disciplina escolhida pertence ao curso ativo do autor.
- Listagem de posts deve evitar N+1, especialmente para votos e anexos.
- Filtros frequentes devem ter indices adequados.
- Respostas publicas e mensagens de validacao devem estar em pt-BR.
- Erros internos, stack traces, paths absolutos e detalhes de filesystem nao devem ser expostos ao usuario.

## Frontend
- Chamadas HTTP devem passar por `frontend/src/services/api.ts`.
- Endpoints de posts e anexos devem ser encapsulados em service tipado.
- Componentes e paginas nao devem usar `fetch` direto.
- Requests com `FormData` nao devem definir manualmente `Content-Type`.
- Erros de API devem seguir o fluxo centralizado do handler global.

## Evolucao futura
- A modelagem e os services devem evitar acoplamentos que dificultem:
  - comentarios;
  - compartilhamentos;
  - favoritos;
  - mencoes;
  - notificacoes;
  - moderacao;
  - busca avancada.
