---
applyTo: "backend/**/*.{ts,tsx}"
description: "Use when creating or editing backend TypeScript files; keep the backend TypeScript-only and avoid generating .js files."
---

# Regra: Backend apenas em TypeScript

## Objetivo
Manter o backend como uma base TypeScript pura, sem adicionar arquivos `.js` novos ao repositório.

## Regras obrigatorias
- Nao criar novos arquivos `.js` dentro de `backend/`.
- Nao editar arquivos `.js` do backend quando existir o equivalente `.ts`.
- Se uma ferramenta gerar `.js` dentro de `backend/`, remover esses artefatos antes de finalizar a alteracao, salvo quando houver necessidade explicita do usuario.
- Preferir sempre imports, implementacoes e geracao de codigo em TypeScript.

## Observacao
Os arquivos `.js` existentes no backend devem ser tratados como artefatos gerados ou legados, nao como fonte primaria.