# MS-Admin_user

Microservice NestJS responsable de la gestion des comptes administrateurs de HubertApp (comptes du personnel, avec e-mail et mot de passe), distincts des comptes utilisateurs finaux gérés par MS-User (connexion Google).

## Rôle dans l'architecture HubertApp

MS-Admin_user est un subgraph Apollo Federation (fédération v2.0), exposé au gateway comme les autres microservices du projet. Il a deux responsabilités :

1. Authentifier un administrateur par e-mail et mot de passe (requête `byEmailAndPassword`), utilisée par la mutation `loginAdmin` de MS-Auth.
2. Gérer le cycle de vie des comptes administrateurs (création, consultation, mise à jour, suppression), avec un contrôle d'accès par rôle.

## Stack technique

* NestJS 11, GraphQL en mode schéma (Apollo Federation v2, `@nestjs/apollo`), Apollo Server 5.
* MongoDB via Mongoose.
* bcrypt pour le hachage des mots de passe (12 tours de sel).
* `@nestjs/throttler` pour la limitation de débit (100 requêtes par minute par défaut).
* Jest pour les tests unitaires et d'intégration.

## Démarrage rapide

```bash
npm ci
cp .env.example .env   # puis renseigner les valeurs, voir tableau ci-dessous
npm run start:dev
```

Avec le Makefile fourni :

```bash
make install   # npm ci
make lint      # eslint
make test      # jest avec couverture
make build     # nest build
make validate  # install + lint + test + build, utilisé en CI
```

Docker : `make docker-build` construit l'image `ms-admin-user:local` ; `make docker-up` / `make docker-down` pilotent le `docker-compose.yml` fourni pour un environnement de développement local (service plus MongoDB plus Mongo Express).

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `PORT` | Port d'écoute HTTP du service |
| `NODE_ENV` | `production` désactive le playground GraphQL |
| `MONGO_URL` | Connexion MongoDB pour la persistance des comptes administrateurs |
| `ALLOWED_ORIGINS` | Liste d'origines autorisées pour le CORS, séparées par des virgules |
| `INTERNAL_SECRET` | Secret partagé avec le gateway, vérifié en production sur l'en-tête `x-internal-secret` (voir sécurité ci-dessous) |
| `ME_CONFIG_BASICAUTH_USERNAME` / `ME_CONFIG_BASICAUTH_PASSWORD` | Identifiants de Mongo Express, développement uniquement, à ne jamais exposer en production |

## API GraphQL

```graphql
type AdminUser @key(fields: "id") {
  id: ID!
  firstname: String!
  lastname: String!
  email: String!
  authLevel: Int!
}

type Query {
  adminUsers: [AdminUser!]!
  adminUser(id: ID!): AdminUser
  byEmailAndPassword(email: String!, password: String!): AdminUser
}

type Mutation {
  createAdminUser(createAdminUserInput: CreateAdminUserInput!): AdminUser!
  updateAdminUser(updateAdminUserInput: UpdateAdminUserInput!): AdminUser
  removeAdminUser(id: ID!): AdminUser
}
```

Règles d'autorisation, appliquées dans le resolver :

* `createAdminUser` et `removeAdminUser` : réservées à un appelant `SUPER_ADMIN`.
* `adminUsers` (liste complète) : réservée à un appelant `SUPER_ADMIN`.
* `adminUser(id)` et `updateAdminUser` : autorisées pour un `SUPER_ADMIN`, ou pour l'administrateur consultant ou modifiant son propre profil.
* `byEmailAndPassword` : aucune garde d'authentification, puisque c'est justement le point d'entrée qui sert à s'authentifier. Le mot de passe est comparé au hachage stocké via bcrypt ; en cas d'échec (e-mail inconnu ou mot de passe incorrect), une erreur générique est renvoyée sans préciser lequel des deux est fautif.

## Authentification interservice

`FederatedAuthGuard` exige les en-têtes `x-auth-state: VALID` et `x-user-id`, injectés par le gateway une fois le token de l'appelant vérifié en amont. Les en-têtes `x-user-role`, `x-user-email`, `x-user-pseudo` sont également repris pour construire le contexte de la requête. En production, une couche supplémentaire est vérifiée : l'en-tête `x-internal-secret` doit correspondre à la variable d'environnement `INTERNAL_SECRET`, ce qui n'est pas le cas dans les autres microservices du projet observés à ce jour (MS-User, MS-notifications). Ce guard fait confiance aux en-têtes transmis sans vérification cryptographique de bout en bout ; une garantie complète suppose un gateway ou un mTLS correctement configuré en amont.

## Point de vigilance connu (intégration avec MS-Auth)

MS-Auth interroge ce service pour authentifier un administrateur (mutation `loginAdmin`), mais la requête envoyée par MS-Auth (`byEmailAndPassword(adminUserInput: $input) { email pseudo age role }`) ne correspond pas au schéma actuel de MS-Admin_user, qui expose `byEmailAndPassword(email: String!, password: String!): AdminUser` avec les champs `id`, `firstname`, `lastname`, `email`, `authLevel` (pas de `pseudo`, `age`, ni `role`). En l'état, un appel `loginAdmin` depuis MS-Auth échouera à la validation du schéma GraphQL. À vérifier et aligner des deux côtés avant de considérer la connexion administrateur comme fonctionnelle de bout en bout.

## Tests

```bash
npm test         # unitaires
npm run test:cov # unitaires avec couverture
npm run test:e2e # bout en bout
```

Les tests unitaires couvrent le resolver (règles d'autorisation par rôle), le service (hachage et vérification bcrypt), le repository, et les guards (`FederatedAuthGuard`, `GqlThrottlerGuard`).
