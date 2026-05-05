const BASE_URL = "http://localhost:4001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "Request failed");
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

export function uploadDocument(file: File, token: string) {
  const form = new FormData();
  form.append("file", file);

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

export function notarizeDocument(id: string, token: string) {
  return request<Document>(`/api/documents/${id}/notarize`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
}
