"use client";

import { useEffect, useState } from "react";
import { getDocuments, notarizeDocument, Document } from "@/lib/api";

export default function NotaryPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchDocuments() {
    const token = localStorage.getItem("token") ?? "";
    const all = await getDocuments(token);
    setDocuments(all.filter((doc) => doc.status === "notarizing"));
  }

  useEffect(() => {
    fetchDocuments()
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load documents"))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    setApprovingId(id);
    setError(null);
    try {
      const token = localStorage.getItem("token") ?? "";
      await notarizeDocument(id, token);
      await fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Notarization failed");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notary Cabinet</h1>
        <p className="text-gray-500 text-sm mt-1">
          Documents awaiting your notarization signature.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          No documents pending notarization.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">File</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Submitted</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{doc.fileName}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleApprove(doc._id)}
                      disabled={approvingId === doc._id}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {approvingId === doc._id ? "Signing…" : "Sign & Approve"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
