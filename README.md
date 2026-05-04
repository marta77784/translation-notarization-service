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

| Name | GitHub | Area | Tasks |
|------|--------|------|-------|
| Marta | @marta77784 | Infra / DevOps | #1 ✅ #3 #18 #19 #20 |
| Alex | @alex-builds | Backend API | #5 #6 #7 #8 #9 |
| Юля | @yuliasteele | Frontend (Next.js) | #10 #11 #12 #13 #29 |
| Олеся | @olessya2907 | Payments + Notarization | #14 #16 #22 #30 #31 |
| Вадим | @vadimvovnenko | Translation Workers | #15 #24 #25 #26 #27 |
| Нурай | @nurayalybaeva-tech | Kubernetes Manifests | #21 #23 #28 #32 #33 |
| Алекс | @Alexwp01 | Docs & Demo | #2 ✅ #4 #17 #34 #35 |

---

## 📋 Tasks by Area

### 🔧 Infra / DevOps — Marta (@marta77784)
- [x] #1 Создать репо и структуру
- [ ] #3 Купить/подготовить VDS
- [ ] #18 Установить k3s на VDS
- [ ] #19 Манифесты MongoDB и Redis
- [ ] #20 Манифесты MinIO

### ⚙️ Backend API — Alex (@alex-builds)
- [ ] #6 Backend базовый API Node.js + Express
- [ ] #7 Модели MongoDB
- [ ] #8 JWT аутентификация
- [ ] #9 Загрузка документов в MinIO
- [ ] #5 Docker-compose с Mongo, Redis, MinIO

### 🎨 Frontend — Юля (@yuliasteele)
- [ ] #10 Next.js проект и базовый layout
- [ ] #11 Страницы регистрации и логина
- [ ] #12 Форма загрузки документа
- [ ] #13 Кабинет пользователя
- [ ] #29 Кабинет нотариуса

### 💳 Payments + Notarization — Олеся (@olessya2907)
- [ ] #14 Stripe интеграция
- [ ] #16 Notarization service базовая структура
- [ ] #30 Email уведомления нотариусу
- [ ] #31 Endpoint подписания документа
- [ ] #22 Ingress для маршрутизации

### 🤖 Translation Workers — Вадим (@vadimvovnenko)
- [ ] #15 Translation Worker заглушка
- [ ] #24 Деплой Ollama в Kubernetes
- [ ] #25 Заменить заглушку на Ollama
- [ ] #26 HorizontalPodAutoscaler
- [ ] #27 Обработка падений воркеров

### ☸️ Kubernetes Manifests — Нурай (@nurayalybaeva-tech)
- [ ] #21 Манифесты Backend, Frontend, Workers
- [ ] #23 Деплой и проверка в k8s
- [ ] #32 Cloudflare Tunnel
- [ ] #33 Playwright e2e тесты
- [ ] #28 Нагрузочное тестирование

### 📚 Docs & Demo — Алекс (@Alexwp01)
- [x] #2 Создать чат и расшарить доступы
- [ ] #4 Зафиксировать MVP границы
- [ ] #17 Проверить flow end-to-end
- [ ] #34 README с архитектурной схемой
- [ ] #35 Демо-видео

---

## 🛠️ Tech Stack

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, JWT, MinIO
- **AI Translation**: Ollama, Redis (queue)
- **Payments**: Stripe, Email notifications
- **Infra**: Docker, Docker Compose, k3s, Ingress, Cloudflare Tunnel, Playwright

---

## 🚦 Getting Started (Local)

```bash
git clone https://github.com/marta77784/translation-notarization-service.git
cd translation-notarization-service
docker-compose up -d
```

App will be available at `http://localhost:3000`

---

## ☸️ Kubernetes Deployment

```bash
curl -sfL https://get.k3s.io | sh -
kubectl apply -f k8s/
```

---

## 🧪 Testing

```bash
npx playwright test
```

---

## 📬 Contributing

1. Pick an issue from the board
2. Create a branch: `git checkout -b feature/your-feature`
3. Open a Pull Request to `main`

---

## 📄 License

MIT © 2026 — Translation & Notarization Service Team
