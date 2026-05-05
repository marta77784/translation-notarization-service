"use client";

type OrderStatus =
  | "uploaded"
  | "paid"
  | "translating"
  | "translated"
  | "notarizing"
  | "notarized"
  | "done";

interface Order {
  id: string;
  fileName: string;
  submittedAt: string;
  status: OrderStatus;
}

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

const MOCK_ORDERS: Order[] = [
  { id: "1", fileName: "passport.pdf", submittedAt: "2026-04-28", status: "done" },
  { id: "2", fileName: "birth_certificate.pdf", submittedAt: "2026-05-01", status: "translating" },
  { id: "3", fileName: "contract.docx", submittedAt: "2026-05-03", status: "paid" },
  { id: "4", fileName: "diploma.pdf", submittedAt: "2026-05-04", status: "notarizing" },
];

export default function DashboardPage() {
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

      {MOCK_ORDERS.length === 0 ? (
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
              {MOCK_ORDERS.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{order.fileName}</td>
                  <td className="px-6 py-4 text-gray-500">{order.submittedAt}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[order.status]}`}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {order.status === "done" && (
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
