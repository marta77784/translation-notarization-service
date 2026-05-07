# E2E Flow Report — #17

Автор: Алекс (@Alexwp01)
Дата: 06.05.2026

## Что проверялось

Полный flow: регистрация → логин → загрузка → оплата → перевод → нотаризация

## Результаты

| Шаг | Статус | Комментарий |
|-----|--------|-------------|
| 1. Регистрация | ✅ Работает | /register — форма работает |
| 2. Логин | ✅ Работает | /login — JWT получен |
| 3. Загрузка документа | ❌ Баг | "Request failed" — см. баг #1 |
| 4. Оплата Stripe | ⏳ Не проверено | Блокирует баг #1 |
| 5. Перевод Ollama | ⏳ Не проверено | Блокирует баг #1 |
| 6. Нотаризация | ⏳ Не проверено | Блокирует баг #1 |

## Баги

### Баг #1 — Upload не работает
- Страница: /upload
- Файлы: test.docx, Notary Test.pdf
- Ошибка: "Request failed"
- Причина: frontend/src/lib/api.ts — функция uploadDocument передаёт
  Content-Type: application/json вместо multipart/form-data
- Кто чинит: Юля (@yuliasteele)

## Инфраструктура

| Сервис | Статус |
|--------|--------|
| MongoDB | ✅ Running |
| Redis | ✅ Running |
| MinIO | ✅ Running |
| Backend API | ✅ Running
