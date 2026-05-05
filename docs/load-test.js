import http from 'k6/http';
import { sleep, check } from 'k6';

// Настройки нагрузочного теста
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Плавно набираем 10 пользователей
    { duration: '1m',  target: 50 },  // Увеличиваем до 50 пользователей
    { duration: '30s', target: 100 }, // Пиковая нагрузка — 100 пользователей
    { duration: '30s', target: 0 },   // Плавно снижаем до 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% запросов быстрее 2 секунд
    http_req_failed:   ['rate<0.05'],  // Ошибок меньше 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Тестовый пользователь
const TEST_USER = {
  name:     'Test User',
  email:    `test_${Date.now()}@example.com`,
  password: 'TestPassword123',
};

export default function () {
  // 1. Регистрация
  const registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(TEST_USER),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(registerRes, {
    'register: статус 200 или 201': (r) =>
      r.status === 200 || r.status === 201,
  });

  sleep(1);

  // 2. Логин
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email:    TEST_USER.email,
      password: TEST_USER.password,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login: статус 200': (r) => r.status === 200,
    'login: есть токен': (r) => {
      try {
        return JSON.parse(r.body).token !== undefined;
      } catch {
        return false;
      }
    },
  });

  sleep(1);

  // 3. Получить список документов (с токеном)
  let token = '';
  try {
    token = JSON.parse(loginRes.body).token;
  } catch {}

  if (token) {
    const docsRes = http.get(`${BASE_URL}/api/documents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
      },
    });

    check(docsRes, {
      'documents: статус 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
