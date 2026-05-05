"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDocuments, Document } from "@/lib/api";

type OrderStatus =
  | "uploaded"
  | "paid"
  | "translating"
  | "translated"
  | "notarizing"
  | "notarized"
  | "done";

const STATUS_LABEL: Record<OrderStatus, string> = {
  uploaded: "Uploaded",
  paid: "Paid",
  translating: "Translating",
  translated: "Translated",
  notarizing: "Notarizing",
  notarized: "Notarized",
  done: "Done",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  uploaded: "bg-gray-100 text-gray-600",
  paid: "bg-blue-100 text-blue-700",
  translating: "bg-yellow-100 text-yellow-700",
  translated: "bg-indigo-100 text-indigo-700",
  notarizing: "bg-orange-100 text-orange-700",
  notarized: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
};

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    getDocuments(token)
      .then(setDocuments)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load documents"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
          <p className="text-gray-500 text-sm mt-1">Track the status of your orders.</p>
        </div>
        <a
          href="/upload"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + Upload new document
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          No orders yet.{" "}
          <a href="/upload" className="text-blue-600 hover:underline">
            Upload your first document.
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">File</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Submitted</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => {
                const status = doc.status as OrderStatus;
                return (
                  <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{doc.fileName}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {STATUS_LABEL[status] ?? status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {status === "done" && (
                        <button
                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1 ml-auto"
                          onClick={() => {/* TODO: trigger file download */}}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                            />
                          </svg>
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
