export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="inline-block bg-emerald-700/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-700/30 mb-6">
            Notarized Translation & Notarization
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Your documents.<br />Translated and notarized.
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
            Upload your document, pay securely, and receive a professionally
            translated and notarized copy — ready for legal use.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/register"
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-3.5 rounded-lg font-semibold text-sm transition-colors"
            >
              Get Started
            </a>
            <a
              href="/login"
              className="border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white px-8 py-3.5 rounded-lg font-semibold text-sm transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900 mb-12">
            Everything you need in one place
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                title: "AI Translation",
                desc: "High-accuracy translation between Russian and English using advanced language models.",
              },
              {
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                title: "Notarization",
                desc: "Documents reviewed and notarized by licensed notaries, valid for official use.",
              },
              {
                icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
                title: "Secure Delivery",
                desc: "Download your completed document directly from your dashboard, any time.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col items-start p-6 rounded-xl border border-slate-200 bg-slate-50"
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-5 h-5 text-emerald-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900 mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Upload", desc: "Select your document and choose the language pair." },
              { step: "2", title: "Pay", desc: "Secure payment via Stripe. One flat fee of $29.99." },
              { step: "3", title: "Processing", desc: "AI translates, then a licensed notary reviews." },
              { step: "4", title: "Download", desc: "Receive your notarized document in the dashboard." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing note */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>Flat fee of $29.99 per document. No hidden charges. Payment processed securely via Stripe.</p>
          <p>
            <a href="#" className="underline hover:text-slate-600">Terms of Service</a>
            {" · "}
            <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-emerald-700">
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to get started?
          </h2>
          <p className="text-emerald-100 text-sm mb-8">
            Create a free account and submit your first document today.
          </p>
          <a
            href="/register"
            className="inline-block bg-white text-emerald-800 font-semibold px-8 py-3 rounded-lg text-sm hover:bg-emerald-50 transition-colors"
          >
            Create Account
          </a>
        </div>
      </section>
    </>
  );
}
