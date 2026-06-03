---
name: backend-respostas-pt-br
description: "Use when editing backend/API responses, error messages, validation text, and user-facing payloads so they are always written in pt-BR for end users."
argument-hint: "Aplicar padrao de pt-BR nas respostas do backend"
---

# Respostas do Backend em pt-BR

## Quando usar
- Ao criar ou ajustar respostas de API que o front-end exibe ao usuário.
- Ao revisar mensagens de erro, validação, autenticação, confirmação e feedback.
- Ao padronizar textos retornados por controllers, services, guards, interceptors e filtros de exceção.

## Objetivo
- Garantir que qualquer texto visível ao usuário final saia em pt-BR.
- Manter a redação natural, curta e clara para interface.
- Evitar misturar idiomas na mesma resposta.

## Procedimento
1. Identifique todas as strings que podem chegar ao usuário na resposta do backend.
2. Reescreva cada mensagem em pt-BR, com linguagem simples e direta.
3. Preserve o significado original, mas adapte para uma frase natural de interface.
4. Se a mensagem for técnica ou de log interno, mantenha-a fora da resposta pública.
5. Verifique se erros, validações e casos de sucesso seguem o mesmo padrão de idioma.

## Regras
- Respostas públicas devem ser sempre em pt-BR.
- Prefira mensagens curtas, específicas e educadas.
- Não deixe textos de fallback em inglês.
- Não exponha detalhes internos desnecessários para o usuário.

## Checklist de conclusão
- Todas as mensagens retornadas ao usuário estão em pt-BR.
- Não restou nenhum texto público em inglês.
- A resposta continua clara para o front-end consumir e exibir.
- A linguagem está consistente em sucesso, erro e validação.

## Exemplos
- "Invalid credentials" -> "E-mail ou senha inválidos."
- "User not found" -> "Usuário não encontrado."
- "Something went wrong" -> "Ocorreu um erro. Tente novamente."
