"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  function refreshAuth() {
    setToken(localStorage.getItem("token"));
    setRole(localStorage.getItem("role"));
  }

  useEffect(() => {
    refreshAuth();
    function onAuth() { refreshAuth(); }
    function onNotification() { setNotifCount((n) => n + 1); }
    window.addEventListener("legaldocs:auth", onAuth);
    window.addEventListener("legaldocs:notification", onNotification);
    return () => {
      window.removeEventListener("legaldocs:auth", onAuth);
      window.removeEventListener("legaldocs:notification", onNotification);
    };
  }, []);

  function handleSignOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
    setMobileOpen(false);
    router.push("/");
  }

  function handleBell() {
    setNotifCount(0);
    router.push(role === "notary" ? "/notary" : "/dashboard");
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="text-white font-semibold text-lg tracking-tight">
          LegalDocs
        </a>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {!token ? (
            <>
              <a href="/" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-md transition-colors">
                Home
              </a>
              <a href="/login" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-md transition-colors">
                Sign in
              </a>
              <a href="/register" className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm px-4 py-2 rounded-md font-medium transition-colors ml-1">
                Register
              </a>
            </>
          ) : (
            <>
              {role === "notary" ? (
                <a href="/notary" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-md transition-colors">
                  Notary Cabinet
                </a>
              ) : (
                <>
                  <a href="/dashboard" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-md transition-colors">
                    My Documents
                  </a>
                  <a href="/upload" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-md transition-colors">
                    Upload
                  </a>
                </>
              )}

              {/* Bell */}
              <button
                onClick={handleBell}
                className="relative text-slate-400 hover:text-white p-2 rounded-md transition-colors ml-1"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleSignOut}
                className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-md transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </nav>

        {/* Mobile right side */}
        <div className="flex sm:hidden items-center gap-2">
          {token && (
            <button
              onClick={handleBell}
              className="relative text-slate-400 hover:text-white p-2 rounded-md transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="text-slate-400 hover:text-white p-2 rounded-md transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 flex flex-col gap-1">
          {!token ? (
            <>
              <a href="/" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white text-sm px-3 py-2.5 rounded-md transition-colors">Home</a>
              <a href="/login" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white text-sm px-3 py-2.5 rounded-md transition-colors">Sign in</a>
              <a href="/register" onClick={() => setMobileOpen(false)} className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm px-3 py-2.5 rounded-md font-medium transition-colors mt-1">Register</a>
            </>
          ) : role === "notary" ? (
            <>
              <a href="/notary" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white text-sm px-3 py-2.5 rounded-md transition-colors">Notary Cabinet</a>
              <button onClick={handleSignOut} className="text-slate-300 hover:text-white text-sm px-3 py-2.5 rounded-md transition-colors text-left">Sign out</button>
            </>
          ) : (
            <>
              <a href="/dashboard" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white text-sm px-3 py-2.5 rounded-md transition-colors">My Documents</a>
              <a href="/upload" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white text-sm px-3 py-2.5 rounded-md transition-colors">Upload</a>
              <button onClick={handleSignOut} className="text-slate-300 hover:text-white text-sm px-3 py-2.5 rounded-md transition-colors text-left">Sign out</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
