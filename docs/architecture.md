# Architecture — eau-robinet

DDD + hexa stricte, calquée sur Breatheline / apnee. Le frontend Next.js ne parle jamais à Hub’Eau, Drizzle ou Supabase.

## Couches

| Couche | Emplacement | Responsabilité |
|--------|-------------|----------------|
| UI | `src/app/`, `src/components/` | Pages App Router, route handlers HTTP |
| Presentation | `src/presentation/` | View-models, i18n, mappers DTO → VM |
| Application | `src/application/` | Use cases, DTOs, ports, errors |
| Composition | `src/composition/` | `createApp()`, adapters de ports |
| Modules | `src/modules/*/` | Bounded contexts (à partir de I1) |
| Shared infra | `src/shared/infrastructure/` | Client Postgres / env |

## Flux des dépendances

```
UI → ensureApplication().*UseCase → DTOs
UI → presentation mappers → view-models
Application → Ports (interfaces + DTOs purs)
Composition → Adapters → Modules / shared infra
Presentation → Application (DTOs)
Shared → jamais Application
```

`src/app` n’importe jamais `drizzle-orm`, `postgres`, ni un client HTTP Hub’Eau.

## Bootstrap Next.js

Les Server Components et route handlers appellent `ensureApplication()` (`src/composition/bootstrap.ts`), qui initialise une fois `createApp()` puis délègue à `getApplication()`.

Les tests unitaires instancient les use cases avec `createFakeApplicationPorts()`.

## I0

Un seul port : `HealthPort.ping()` (`select 1` via Drizzle). Use case : `HealthCheckUseCase`.

Modules métier prévus ensuite : `geocoding`, `network`, `analyses`, `parameters`, `norms`, `comparison`.
