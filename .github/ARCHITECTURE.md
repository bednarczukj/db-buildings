# CI/CD Architecture

## Pipeline Overview

```mermaid
graph TB
    A[Push to master / Manual trigger / Pull Request] --> B{Start Pipeline}
    
    B --> C[Lint & Code Quality]
    B --> D[Unit Tests]
    
    C --> E{Lint Pass?}
    D --> F{Tests Pass?}
    
    E -->|Yes| G[Production Build]
    E -->|No| H[❌ Pipeline Failed]
    
    F -->|Yes| G
    F -->|No| H
    
    G --> I{Build Success?}
    
    I -->|Yes| J[Upload Artifacts]
    I -->|No| H
    
    J --> K[Generate Summary]
    
    K --> L{All Jobs OK?}
    
    L -->|Yes| M[✅ Pipeline Success]
    L -->|No| H
    
    M --> N[Ready for Deployment]
    
    style C fill:#e1f5ff
    style D fill:#e1f5ff
    style G fill:#e1f5ff
    style M fill:#c3f0c3
    style H fill:#ffc3c3
```

## Job Details

### 1. Lint & Code Quality

**Czas wykonania:** ~1-2 minuty

```mermaid
sequenceDiagram
    participant GH as GitHub Actions
    participant Node as Node.js 22
    participant ESLint
    participant Prettier
    
    GH->>Node: Setup Node.js + npm cache
    Node->>GH: ✅ Ready
    GH->>Node: npm ci
    Node->>GH: ✅ Dependencies installed
    GH->>ESLint: npm run lint
    ESLint->>GH: ✅ Code quality OK
    GH->>Prettier: npx prettier --check .
    Prettier->>GH: ✅ Formatting OK
```

**Co sprawdza:**
- Błędy składniowe TypeScript
- Nieużywane importy i zmienne
- Potencjalne błędy logiczne
- Zgodność z zasadami React
- Formatowanie kodu (Prettier)

### 2. Unit Tests

**Czas wykonania:** ~2-3 minuty

```mermaid
sequenceDiagram
    participant GH as GitHub Actions
    participant Vitest
    participant Coverage
    participant Codecov
    
    GH->>Vitest: npm run test:run
    Vitest->>GH: ✅ All tests passed
    GH->>Coverage: npm run test:coverage
    Coverage->>GH: ✅ Coverage report generated
    GH->>Codecov: Upload coverage
    Codecov->>GH: ✅ Coverage uploaded (optional)
```

**Co testuje:**
- Komponenty React (React Testing Library)
- Funkcje pomocnicze (utils)
- Serwisy (services)
- Hooki (custom hooks)
- Walidację schematów (Zod)

**Coverage thresholds:**
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

### 3. Production Build

**Czas wykonania:** ~2-3 minuty

```mermaid
sequenceDiagram
    participant GH as GitHub Actions
    participant Astro
    participant FS as File System
    participant Artifacts
    
    GH->>Astro: npm run build
    Astro->>Astro: Compile TypeScript
    Astro->>Astro: Bundle React components
    Astro->>Astro: Process Tailwind CSS
    Astro->>Astro: Optimize assets
    Astro->>FS: Write to dist/
    FS->>GH: ✅ Build complete
    GH->>Artifacts: Upload dist/ folder
    Artifacts->>GH: ✅ Available for 7 days
```

**Co robi:**
- Kompiluje TypeScript do JavaScript
- Bundluje komponenty React
- Przetwarza Tailwind CSS
- Optymalizuje obrazy i assety
- Generuje static HTML (SSG)
- Przygotowuje server-side rendering (SSR)

### 4. Summary

**Czas wykonania:** ~10 sekund

```mermaid
graph LR
    A[Collect Results] --> B{Check Status}
    B -->|All Pass| C[✅ Success Summary]
    B -->|Any Fail| D[❌ Failure Report]
    C --> E[Ready for Deploy]
    D --> F[Review Logs]
```

## Workflow Triggers

### Automatic Triggers

```mermaid
graph TB
    A[Developer] -->|git push| B[master branch]
    A -->|create| C[Pull Request to master]
    
    B --> D[Trigger CI/CD]
    C --> D
    
    D --> E{Branch Protection}
    E -->|Enabled| F[Must pass before merge]
    E -->|Disabled| G[Optional check]
```

### Manual Trigger

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant GH as GitHub UI
    participant Actions
    
    Dev->>GH: Navigate to Actions tab
    GH->>Dev: Show workflows
    Dev->>GH: Click "Run workflow"
    GH->>Dev: Select branch
    Dev->>GH: Confirm
    GH->>Actions: Start pipeline
    Actions->>Dev: Show real-time progress
```

## Artifacts & Reports

```mermaid
graph TB
    A[Pipeline Execution] --> B[Generate Artifacts]
    
    B --> C[Production Build]
    B --> D[Coverage Report]
    
    C --> E[dist/ folder]
    D --> F[coverage/]
    
    E --> G[Upload to GitHub]
    F --> G
    
    G --> H[Available for 7 days]
    H --> I[Download anytime]
    
    style C fill:#e1f5ff
    style D fill:#e1f5ff
    style I fill:#c3f0c3
```

### Dostępne Artifacts

| Artifact | Zawartość | Retencja |
|----------|-----------|----------|
| `production-build` | Folder `dist/` z buildem produkcyjnym | 7 dni |
| `coverage` | Raport pokrycia testów (automatyczny) | N/A |

## Concurrency Control

```mermaid
sequenceDiagram
    participant Dev1 as Push 1 (start)
    participant Dev2 as Push 2 (new)
    participant GH as GitHub Actions
    
    Dev1->>GH: Start pipeline (commit abc)
    Note over GH: Job 1: Running
    Dev2->>GH: Start pipeline (commit def)
    GH->>Dev1: Cancel old pipeline
    Note over GH: Job 1: Cancelled
    Note over GH: Job 2: Running
    GH->>Dev2: Continue with new pipeline
```

**Korzyści:**
- Oszczędność minut GitHub Actions
- Szybszy feedback dla najnowszych zmian
- Unikanie konfliktów między buildami

## Performance Optimization

### Caching Strategy

```mermaid
graph TB
    A[Start Job] --> B{Cache Exists?}
    B -->|Yes| C[Restore npm cache]
    B -->|No| D[Download all packages]
    C --> E[npm ci - fast]
    D --> E[npm ci - slow]
    E --> F[Save cache]
    F --> G[Continue pipeline]
    
    style C fill:#c3f0c3
    style D fill:#ffc3c3
```

### Parallel Execution

```mermaid
gantt
    title Pipeline Execution Timeline
    dateFormat mm:ss
    
    section Sequential (old)
    Lint           :00:00, 02:00
    Unit Tests     :02:00, 03:00
    Build          :05:00, 03:00
    Total: 8 minutes
    
    section Parallel (new)
    Lint           :00:00, 02:00
    Unit Tests     :00:00, 03:00
    Build (after)  :03:00, 03:00
    Total: 6 minutes
```

**Oszczędność:** ~25% czasu wykonania

## Security

### Secrets Management

```mermaid
graph TB
    A[Secrets in GitHub] --> B{Encrypted Storage}
    B --> C[Repository Settings]
    C --> D[Available to Workflow]
    D --> E{Access Control}
    E -->|Authorized| F[Use in Pipeline]
    E -->|Unauthorized| G[Access Denied]
    
    F --> H[Never Logged]
    F --> I[Never Exposed in Artifacts]
    
    style B fill:#fff4c3
    style H fill:#c3f0c3
    style I fill:#c3f0c3
```

### Secret Protection Rules

1. ✅ Secrets są zaszyfrowane w GitHub
2. ✅ Secrets nie są widoczne w logach
3. ✅ Secrets nie są exportowane do artifacts
4. ✅ Secrets są dostępne tylko dla authorized workflows
5. ✅ Pull Requests z forków nie mają dostępu do secrets

## Future Enhancements

```mermaid
mindmap
  root((CI/CD Future))
    E2E Tests
      Dedicated Test Environment
      Supabase Test Instance
      Visual Regression
    Deployment
      DigitalOcean
      Vercel
      Docker Registry
    Monitoring
      Sentry Integration
      Performance Tracking
      Error Reporting
    Security
      Dependency Scanning
      OWASP Checks
      Secret Scanning
    Notifications
      Slack Integration
      Email Reports
      Discord Webhooks
```

## Monitoring & Metrics

### Key Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Pipeline Duration | < 10 min | ~6 min ✅ |
| Test Coverage | > 70% | Tracked |
| Build Success Rate | > 95% | Monitor |
| Cache Hit Rate | > 80% | Auto |

### Dashboard View (GitHub Actions)

```
┌─────────────────────────────────────────┐
│ CI/CD Pipeline - master                 │
├─────────────────────────────────────────┤
│ ✅ Lint & Code Quality      1m 23s     │
│ ✅ Unit Tests               2m 15s     │
│ ✅ Production Build         2m 48s     │
│ ✅ CI Summary               11s        │
├─────────────────────────────────────────┤
│ Total: 6m 37s                          │
│ Status: Success ✅                      │
└─────────────────────────────────────────┘
```

## Best Practices

### 1. Commit Conventions

```
✅ Good commits trigger successful pipelines:
- feat: add user authentication
- fix: resolve login bug
- test: add unit tests for auth service
- refactor: improve code structure

❌ Avoid:
- WIP commits that break tests
- Commits without running local tests first
```

### 2. Local Testing First

```bash
# Before pushing, always run:
npm run lint           # Check code quality
npm run test:run       # Run unit tests
npm run build          # Verify build works
```

### 3. Branch Protection

```mermaid
graph LR
    A[Pull Request] --> B{CI/CD Pass?}
    B -->|No| C[❌ Cannot Merge]
    B -->|Yes| D[✅ Can Merge]
    D --> E[Code Review]
    E --> F[Merge to master]
```

Enable in: `Settings` → `Branches` → `Branch protection rules`

## Troubleshooting Decision Tree

```mermaid
graph TB
    A[Pipeline Failed] --> B{Which Job?}
    
    B -->|Lint| C{Local lint OK?}
    C -->|Yes| D[Check dependencies]
    C -->|No| E[Run: npm run lint:fix]
    
    B -->|Tests| F{Local tests OK?}
    F -->|Yes| G[Check test environment]
    F -->|No| H[Fix failing tests]
    
    B -->|Build| I{Local build OK?}
    I -->|Yes| J[Check environment vars]
    I -->|No| K[Fix build errors]
    
    style E fill:#c3f0c3
    style H fill:#c3f0c3
    style K fill:#c3f0c3
```

