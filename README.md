# 📄 Translation & Notarization Service

> Full-stack platform for document translation with notarization support — built by a distributed team as a DevOps bootcamp project.

[![GitHub](https://img.shields.io/badge/GitHub-translation--notarization--service-black?logo=github)](https://github.com/marta77784/translation-notarization-service)
![Status](https://img.shields.io/badge/status-in%20development-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🚀 Project Overview

A cloud-native web application that allows users to upload documents, request translations powered by AI (Ollama), pay via Stripe, and receive notarized results through a dedicated notary cabinet.

---

## 🏗️ Architecture

```
User → Next.js Frontend
         ↓
      Backend API (Node.js + Express)
         ↓              ↓
    MongoDB         MinIO (S3)
         ↓
  Translation Worker (Ollama)
         ↓
  Notarization Service + Stripe
         ↓
  Kubernetes (k3s) on VPS
```

---

## 👥 Team & Responsibilities

| Name | GitHub | Area |
|------|--------|------|
| Marta | @marta77784 | Infra / DevOps / Kubernetes |
| Alex | @alex-builds | Backend API |
| Юля | @yuliasteele | Frontend (Next.js) |
| Олеся | @olessya2907 | Payments + Notarization |
| Нурай | @nurayalybaeva-tech | Translation Workers |
| TBD | — | Kubernetes Manifests |
| TBD | — | Docs & Demo |

---

## 🛠️ Tech Stack

### Frontend
- **Next.js** — pages, forms, user & notary dashboards
- **Tailwind CSS** — styling

### Backend
- **Node.js + Express** — REST API
- **MongoDB** — database
- **JWT** — authentication
- **MinIO** — document storage (S3-compatible)

### AI Translation
- **Ollama** — local LLM for translation
- **Redis** — task queue

### Payments & Notarization
- **Stripe** — payment processing
- **Email notifications** — notary alerts

### Infrastructure
- **Docker + Docker Compose** — local development
- **Kubernetes (k3s)** — production deployment on VPS
- **Ingress + Cloudflare Tunnel** — routing & SSL
- **Playwright** — end-to-end tests

---

## 📦 Project Structure

```
translation-notarization-service/
├── backend/          # Node.js API
├── frontend/         # Next.js app
├── workers/          # Translation workers (Ollama)
├── notarization/     # Notarization service
├── k8s/              # Kubernetes manifests
│   ├── backend.yaml
│   ├── frontend.yaml
│   ├── workers.yaml
│   ├── mongodb.yaml
│   ├── redis.yaml
│   ├── minio.yaml
│   └── ingress.yaml
├── docker-compose.yml
└── README.md
```

---

## 🗺️ Milestones

- [x] **Milestone 1** — Repo setup, structure, labels
- [ ] **Milestone 2** — Backend API + Auth + MinIO
- [ ] **Milestone 3** — Frontend + User flows
- [ ] **Milestone 4** — Translation Workers + Ollama
- [ ] **Milestone 5** — Payments + Notarization
- [ ] **Milestone 6** — Kubernetes deploy + E2E tests + Demo

---

## 🚦 Getting Started (Local)

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Git

### Run locally

```bash
git clone https://github.com/marta77784/translation-notarization-service.git
cd translation-notarization-service
docker-compose up -d
```

App will be available at `http://localhost:3000`

---

## ☸️ Kubernetes Deployment

```bash
# Install k3s on VPS
curl -sfL https://get.k3s.io | sh -

# Apply manifests
kubectl apply -f k8s/
```

---

## 🧪 Testing

```bash
# Run Playwright e2e tests
npx playwright test
```

---

## 📬 Contributing

1. Pick an issue from the board
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes
4. Open a Pull Request to `main`

Branch naming: `feature/`, `fix/`, `infra/`, `docs/`

---

## 📄 License

MIT © 2026 — Translation & Notarization Service Team
