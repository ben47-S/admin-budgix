# Admin Budgix

Interface d'administration pour la plateforme Budgix.

## 🚀 Installation

```bash
# Installer les dépendances
npm install
# ou
pnpm install
# ou
yarn install

# Copier le fichier d'environnement
cp .env.local.example .env.local

# Modifier .env.local avec votre URL d'API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Lancer le serveur de développement
npm run dev
# ou
pnpm dev
```

Ouvrez [http://localhost:3001](http://localhost:3001) dans votre navigateur.

## 📁 Structure du projet

```
admin-budgix/
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/            # Routes d'authentification
│   ├── (dashboard)/       # Routes du dashboard admin
│   └── layout.tsx         # Layout racine
├── components/            # Composants React
│   ├── ui/               # Composants UI de base
│   ├── layout/           # Composants de layout
│   └── admin/            # Composants spécifiques admin
├── lib/                  # Utilitaires et configurations
│   ├── api.ts            # Client API
│   └── utils.ts          # Fonctions utilitaires
├── hooks/                # Hooks React personnalisés
└── store/                # Store Zustand (état global)
```

## 🔐 Authentification

L'application utilise l'authentification par token JWT. Le token est stocké dans le localStorage et envoyé dans le header `Authorization` de chaque requête.

## 📱 Tester sur un autre appareil

### Méthode 1 : Réseau local (recommandé pour test rapide)

1. **Trouver votre adresse IP locale** :
   - **Windows** : Ouvrez PowerShell et tapez `ipconfig`, cherchez "Adresse IPv4" (ex: `192.168.1.100`)
   - **Mac/Linux** : Ouvrez Terminal et tapez `ifconfig` ou `ip addr`, cherchez votre IP locale

2. **Démarrer le serveur avec accès réseau** :
   ```bash
   npm run dev:network
   # ou
   pnpm dev:network
   ```

3. **Sur l'autre appareil** (connecté au même Wi-Fi) :
   - Ouvrez le navigateur et allez à `http://VOTRE_IP:3001`
   - Exemple : `http://192.168.1.100:3001`

4. **Configurer le backend** :
   - Si votre backend écoute aussi sur `localhost`, vous devrez le démarrer avec accès réseau également
   - Ou utilisez ngrok pour exposer le backend (voir Méthode 2)

### Méthode 2 : ngrok (pour accès depuis internet)

1. **Exposer le frontend Next.js avec ngrok** :
   ```bash
   ngrok http 3001
   ```

2. **Exposer le backend avec ngrok** (dans un autre terminal) :
   ```bash
   ngrok http 3000
   ```

3. **Configurer `.env.local`** avec l'URL ngrok du backend :
   ```env
   NEXT_PUBLIC_API_URL=https://xxxx-xx-xx-xx-xx.ngrok-free.app
   ```

4. **Sur l'autre appareil** :
   - Utilisez l'URL ngrok du frontend (ex: `https://yyyy-yy-yy-yy-yy.ngrok-free.app`)

⚠️ **Important** :
- Les deux appareils doivent être sur le même réseau Wi-Fi pour la méthode 1
- Vérifiez que votre pare-feu autorise les connexions sur le port 3001
- Pour ngrok, configurez CORS sur votre backend pour autoriser l'URL ngrok du frontend

## 📚 Documentation API

Consultez la documentation du backend pour connaître toutes les routes disponibles :
- `/api/admin/auth/login` - Connexion admin
- `/api/admin/users` - Gestion des utilisateurs
- `/api/admin/stats` - Statistiques globales
- `/api/admin/categories` - Gestion des catégories

