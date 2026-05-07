"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/lib/api";

const STEPS = ["Upload", "Pay", "Processing", "Download"];

const LANGUAGES = [
  { code: "ru", label: "Russian" },
  { code: "en", label: "English" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
];

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState("ru");
  const [targetLang, setTargetLang] = useState("en");

  function handleSourceLangChange(val: string) {
    setSourceLang(val);
    if (targetLang === val) {
      const fallback = LANGUAGES.find((l) => l.code !== val);
      if (fallback) setTargetLang(fallback.code);
    }
  }
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      await uploadDocument(file, token, sourceLang, targetLang);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Step indicator */}
        <div className="flex items-start justify-center mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0
                      ? "bg-slate-900 text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium ${
                    i === 0 ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-12 h-px bg-slate-300 mb-5 mx-1" />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Upload document</h1>
            <p className="text-slate-500 text-sm mt-1">
              PDF, DOC, DOCX — max 20 MB
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-sm font-medium text-slate-700">
                  Source language
                </label>
                <select
                  value={sourceLang}
                  onChange={(e) => handleSourceLangChange(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="pb-2.5 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-sm font-medium text-slate-700">
                  Target language
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white"
                >
                  {LANGUAGES.filter((l) => l.code !== sourceLang).map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                dragOver
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
              }`}
            >
              <label htmlFor="file-input" className="cursor-pointer">
                <svg
                  className="w-10 h-10 text-slate-400 mx-auto mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 10l-4-4m0 0L8 10m4-4v12"
                  />
                </svg>
                {file ? (
                  <>
                    <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-700">
                      Drag & drop or click to select
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX up to 20 MB</p>
                  </>
                )}
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {file && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  (document.getElementById("file-input") as HTMLInputElement).value = "";
                }}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors text-center -mt-3"
              >
                Remove file
              </button>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className="bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Uploading…" : "Submit document →"}
            </button>

            <p className="text-xs text-slate-400 text-center leading-relaxed">
              By submitting, you confirm you have the right to share this document.
              Your files are encrypted in transit and at rest. See our{" "}
              <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
