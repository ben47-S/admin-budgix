# Routes API utilisées pour les statistiques des utilisateurs

## Page Stats (`/stats`)

### Route principale utilisée

**GET `/api/admin/stats`**

Cette route est utilisée pour récupérer toutes les statistiques globales de la plateforme, y compris le nombre d'utilisateurs standards.

#### Structure de la réponse attendue

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "premium": 150,
      "admin": 5,
      "regular": 845  // ← Nombre d'utilisateurs standards
    },
    "transactions": {
      "total": 5000,
      "totalAmount": 100000,
      "totalExpenses": 60000,
      "totalIncome": 40000
    },
    "features": {
      "budgets": 2000,
      "debts": 500,
      "externalSubscriptions": 300,
      "globalCategories": 50
    },
    "subscriptions": {
      "active": 150
    }
  }
}
```

#### Utilisation dans le code

**Fichier:** `app/(dashboard)/stats/page.tsx`

```typescript
const response = await adminApi.stats.getStats()
// response.data contient directement les stats (pas response.data.stats)
const stats = response.data
// Accès aux utilisateurs standards: stats.users.regular
```

**Fichier:** `lib/api.ts`

```typescript
adminApi.stats.getStats(): Promise<ApiResponse<GlobalStats>>
// Retourne directement GlobalStats dans data, pas { stats: GlobalStats }
```

---

## Pour récupérer la liste des utilisateurs standards (si nécessaire)

Si vous avez besoin de récupérer la **liste paginée** des utilisateurs standards (pas seulement le compteur), utilisez:

**GET `/api/admin/users?role=USER`**

### Paramètres

- `role=USER` : **OBLIGATOIRE** - Filtre pour récupérer uniquement les utilisateurs standards
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 20)
- `isPremium=false` : Optionnel, pour exclure les utilisateurs premium
- `search` : Optionnel, recherche par nom/email/téléphone

### Exemple d'URL complète

```
GET /api/admin/users?page=1&limit=20&role=USER
```

### Structure de la réponse

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-id",
        "username": "john_doe",
        "phone": "+33123456789",
        "email": "john@example.com",
        "isPremium": false,
        "role": "USER",
        "createdAt": "2024-01-01T00:00:00Z",
        "_count": {
          "transactions": 50,
          "budgets": 5,
          "debts": 2
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 845,
      "totalPages": 43
    }
  }
}
```

### Utilisation dans le code

**Fichier:** `lib/api.ts`

```typescript
adminApi.users.getUsers({
  page: 1,
  limit: 20,
  role: "USER",  // ← IMPORTANT: Filtrer les utilisateurs standards
  isPremium: false  // Optionnel: exclure les premium
})
```

**Fichier:** `app/(dashboard)/users/page.tsx`

Cette page utilise déjà cette route correctement avec `role: "USER"`.

---

## Résumé

### Pour les statistiques (compteurs)
- **Route:** `GET /api/admin/stats`
- **Utilisée dans:** `app/(dashboard)/stats/page.tsx`
- **Retourne:** `data.users.regular` (nombre d'utilisateurs standards)

### Pour la liste des utilisateurs standards
- **Route:** `GET /api/admin/users?role=USER`
- **Utilisée dans:** `app/(dashboard)/users/page.tsx`
- **Retourne:** Liste paginée des utilisateurs standards

---

## Corrections apportées

1. ✅ Correction du type TypeScript dans `lib/api.ts` : `ApiResponse<GlobalStats>` au lieu de `ApiResponse<{ stats: GlobalStats }>`
2. ✅ Correction de l'accès aux données dans `app/(dashboard)/stats/page.tsx` : `response.data` au lieu de `response.data.stats`
3. ✅ Correction de l'accès aux données dans `app/(dashboard)/page.tsx` : `response.data` au lieu de `response.data.stats`

Ces corrections garantissent que `data.users.regular` est correctement accessible et affiché dans la page stats.

