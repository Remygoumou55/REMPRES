# 07 — Error Governance Report

## État actuel

| Pattern | Exemple |
|---------|---------|
| try/catch + message | server actions |
| Silent catch | automation executor, notifications |
| Console only | webhooks, approvals partial |
| UI toast | clients forms |

## Lacunes

- `lib/logger.ts` — persistance serveur TODO
- Pas de couche erreur unifiée pour server actions
- Erreurs approval exécution maintenant surfacées (lot 1)

## Unified Error Governance Layer (cible)

```text
Mutation → guard → service → Result<T, RuntimeError>
RuntimeError: { code, message, retryable, auditId }
```

## Principes

1. Ne jamais réussir si side-effect a échoué (approvals corrigé)
2. Logger structuré JSON (à implémenter)
3. Boundary error pages inchangées (middleware OK)

## Lot 2

- Implémenter `persistServerLog` vers table `activity_logs`
- Corréler `errorId` dans réponses action
