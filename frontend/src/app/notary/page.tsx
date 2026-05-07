"use client";

import { useEffect, useState } from "react";
import { getDocuments, notarizeDocument, Document } from "@/lib/api";
import StatusBadge from "@/components/ui/StatusBadge";

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
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Notary Cabinet</h1>
        <p className="text-slate-500 text-sm mt-1">
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
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">No documents pending notarization.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wide">
                  File
                </th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wide">
                  Submitted
                </th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{doc.originalName}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(doc.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleApprove(doc._id)}
                      disabled={approvingId === doc._id}
                      className="bg-slate-900 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
