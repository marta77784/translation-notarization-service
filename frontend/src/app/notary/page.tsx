"use client";

import { useState } from "react";

interface Document {
  id: string;
  clientName: string;
  fileName: string;
  submittedAt: string;
}

const MOCK_DOCUMENTS: Document[] = [
  { id: "1", clientName: "Alice Johnson", fileName: "passport.pdf", submittedAt: "2026-05-01" },
  { id: "2", clientName: "Bob Martinez", fileName: "birth_certificate.pdf", submittedAt: "2026-05-02" },
  { id: "3", clientName: "Chen Wei", fileName: "diploma.pdf", submittedAt: "2026-05-03" },
  { id: "4", clientName: "Diana Popescu", fileName: "marriage_certificate.docx", submittedAt: "2026-05-04" },
];

export default function NotaryPage() {
  const [approved, setApproved] = useState<Set<string>>(new Set());

  function handleApprove(id: string) {
    setApproved((prev) => new Set(prev).add(id));
    // TODO: call API to sign & approve document
  }

  const pending = MOCK_DOCUMENTS.filter((doc) => !approved.has(doc.id));
  const done = MOCK_DOCUMENTS.filter((doc) => approved.has(doc.id));

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notary Cabinet</h1>
        <p className="text-gray-500 text-sm mt-1">
          Documents awaiting your notarization signature.
        </p>
      </div>

      {pending.length === 0 && done.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          No documents pending notarization.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Pending ({pending.length})
              </h2>
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Client</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">File</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Submitted</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pending.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">{doc.clientName}</td>
                        <td className="px-6 py-4 text-gray-600">{doc.fileName}</td>
                        <td className="px-6 py-4 text-gray-500">{doc.submittedAt}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleApprove(doc.id)}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Sign & Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Approved ({done.length})
              </h2>
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Client</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">File</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Submitted</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {done.map((doc) => (
                      <tr key={doc.id} className="bg-green-50">
                        <td className="px-6 py-4 font-medium text-gray-700">{doc.clientName}</td>
                        <td className="px-6 py-4 text-gray-500">{doc.fileName}</td>
                        <td className="px-6 py-4 text-gray-400">{doc.submittedAt}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Approved
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
