const BASE_URL = "http://localhost:4001";
const PAYMENT_URL = "http://localhost:3001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: isFormData
      ? options?.headers
      : { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? error.error ?? "Request failed");
  }

  return res.json();
}

export interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

export interface Document {
  _id: string;
  fileName: string;
  status: string;
  createdAt: string;
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(name: string, email: string, password: string) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function uploadDocument(file: File, token: string, sourceLang: string, targetLang: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("sourceLang", sourceLang);
  form.append("targetLang", targetLang);

  return request<Document>("/api/documents/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}

export function getDocuments(token: string) {
  return request<Document[]>("/api/documents", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createPaymentSession(documentId: string, customerEmail: string) {
  return fetch(`${PAYMENT_URL}/api/payments/create-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId, amount: 2999, customerEmail }),
  }).then((res) => res.json() as Promise<{ url: string }>);
}

export function notarizeDocument(id: string, token: string) {
  return request<Document>(`/api/documents/${id}/notarize`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getDocumentDownloadUrl(id: string, token: string) {
  return request<{ url: string }>(`/api/documents/${id}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
