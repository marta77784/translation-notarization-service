"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDocuments, getDocumentDownloadUrl, createPaymentSession, Document } from "@/lib/api";
import { dispatchToast, dispatchNotification } from "@/components/ui/Toast";

type StepState = "pending" | "active" | "done";

interface Step {
  label: string;
  description: string;
  state: StepState;
}

function getSteps(status: string): Step[] {
  const step1: StepState = status === "pending" ? "active" : "done";

  const step2: StepState =
    status === "pending" ? "pending" :
    status === "paid" || status === "translating" ? "active" :
    "done";

  const step3: StepState =
    status === "notarized" ? "done" :
    status === "translated" || status === "notarizing" ? "active" :
    "pending";

  return [
    {
      label: "Order Placed",
      description: step1 === "active" ? "Awaiting payment" : "Order confirmed",
      state: step1,
    },
    {
      label: "Translation",
      description:
        step2 === "pending" ? "Not started" :
        step2 === "active" ? "Translating document…" :
        "Translation complete",
      state: step2,
    },
    {
      label: "Notarization",
      description:
        step3 === "pending" ? "Not started" :
        step3 === "active" ? "Under notary review…" :
        "Notarized",
      state: step3,
    },
  ];
}

function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-start gap-0 mt-5 pt-5 border-t border-slate-100">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-start flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step.state === "done"
                    ? "bg-emerald-600 text-white"
                    : step.state === "active"
                    ? "bg-slate-900 text-white ring-4 ring-slate-900/10"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step.state === "done" ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 ${
                    step.state === "done" ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
            <div className="mt-2 pr-2">
              <p className={`text-xs font-semibold ${
                step.state === "pending" ? "text-slate-400" : "text-slate-700"
              }`}>
                {step.label}
              </p>
              <p className={`text-xs mt-0.5 ${
                step.state === "active" ? "text-emerald-600" :
                step.state === "done" ? "text-slate-400" :
                "text-slate-300"
              }`}>
                {step.state === "active" && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {step.description}
                  </span>
                )}
                {step.state !== "active" && step.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusToast(status: string, name: string): { message: string; type: "success" | "info" | "error" } | null {
  switch (status) {
    case "paid":
      return { message: `Payment confirmed — "${name}" is being translated`, type: "info" };
    case "translated":
      return { message: `Translation complete — "${name}" is with the notary`, type: "info" };
    case "notarized":
      return { message: `"${name}" is notarized and ready to download!`, type: "success" };
    case "failed":
      return { message: `An error occurred processing "${name}"`, type: "error" };
    default:
      return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const prevStatusesRef = useRef<Record<string, string>>({});

  function loadDocuments(token: string) {
    return getDocuments(token)
      .then((docs) => {
        const prev = prevStatusesRef.current;
        const isFirstLoad = Object.keys(prev).length === 0;

        if (!isFirstLoad) {
          docs.forEach((doc) => {
            const prevStatus = prev[doc._id];
            if (prevStatus && prevStatus !== doc.status) {
              const toast = getStatusToast(doc.status, doc.originalName);
              if (toast) {
                dispatchToast(toast.message, toast.type);
                if (toast.type !== "error") dispatchNotification();
              }
            }
          });
        }

        const next: Record<string, string> = {};
        docs.forEach((doc) => { next[doc._id] = doc.status; });
        prevStatusesRef.current = next;

        setDocuments(docs);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load documents"));
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    loadDocuments(token).finally(() => setLoading(false));
    const interval = setInterval(() => loadDocuments(token), 30000);
    return () => clearInterval(interval);
  }, [router]);

  async function handlePay(documentId: string) {
    setPayingId(documentId);
    try {
      const email = localStorage.getItem("email") ?? "";
      const { url } = await createPaymentSession(documentId, email);
      window.location.href = url;
    } catch {
      setError("Failed to start payment. Please try again.");
      setPayingId(null);
    }
  }

  async function handleDownload(documentId: string) {
    setDownloadingId(documentId);
    try {
      const token = localStorage.getItem("token") ?? "";
      const { url } = await getDocumentDownloadUrl(documentId, token);
      window.open(url, "_blank");
    } catch {
      setError("Failed to download. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  const total = documents.length;
  const completed = documents.filter((d) => d.status === "notarized").length;
  const pending = documents.filter((d) => d.status === "pending").length;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>
          <p className="text-slate-500 text-sm mt-1">Track and manage your translation orders.</p>
        </div>
        <a
          href="/upload"
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          + Upload document
        </a>
      </div>

      {/* Stats */}
      {!loading && documents.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total orders", value: total },
            { label: "Awaiting payment", value: pending },
            { label: "Completed", value: completed },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 px-5 py-4">
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payment banners */}
      {paymentStatus === "success" && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800 font-medium">
          Payment successful! Your document is being processed.
        </div>
      )}
      {paymentStatus === "cancelled" && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 font-medium">
          Payment was cancelled. You can try again anytime.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm mb-1">No orders yet.</p>
          <a href="/upload" className="text-emerald-700 hover:text-emerald-800 text-sm font-medium">
            Upload your first document →
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className={`bg-white rounded-xl border shadow-sm px-6 py-5 ${
                doc.status === "failed" ? "border-red-200" : "border-slate-200"
              }`}
            >
              {/* Card top: file info + action */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    doc.status === "failed" ? "bg-red-50" : "bg-slate-100"
                  }`}>
                    <svg className={`w-4 h-4 ${doc.status === "failed" ? "text-red-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{doc.originalName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submitted {new Date(doc.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Action button */}
                <div className="shrink-0">
                  {doc.status === "pending" && (
                    <button
                      onClick={() => handlePay(doc._id)}
                      disabled={payingId === doc._id}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {payingId === doc._id ? "Redirecting…" : "Pay $29.99"}
                    </button>
                  )}
                  {doc.status === "notarized" && (
                    <button
                      onClick={() => handleDownload(doc._id)}
                      disabled={downloadingId === doc._id}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                      </svg>
                      {downloadingId === doc._id ? "Downloading…" : "Download"}
                    </button>
                  )}
                </div>
              </div>

              {/* Failed state */}
              {doc.status === "failed" && (
                <div className="mt-4 pt-4 border-t border-red-100 flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs text-red-600">
                    Processing failed. Please contact support or upload the document again.
                  </p>
                </div>
              )}

              {/* Translation progress bar */}
              {(doc.status === "paid" || doc.status === "translating") && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-slate-500">Translation in progress</span>
                    <span className="text-xs font-semibold text-emerald-700">{doc.progress ?? 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${doc.progress ?? 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Notarized: email confirmation note */}
              {doc.status === "notarized" && (
                <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-xs text-emerald-800 font-medium">
                  <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  A confirmation email has been sent to your registered address.
                </div>
              )}

              {/* Progress stepper (not shown for failed) */}
              {doc.status !== "failed" && (
                <StepIndicator steps={getSteps(doc.status)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
