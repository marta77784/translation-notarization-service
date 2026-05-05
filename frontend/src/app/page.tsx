export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Document Translation & Notarization
      </h2>
      <p className="text-gray-600 text-lg mb-8 text-center max-w-xl">
        Upload your document, pay securely, and receive a professionally
        translated and notarized copy.
      </p>
      <div className="flex gap-4">
        <a
          href="/register"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Get Started
        </a>
        <a
          href="/login"
          className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
        >
          Login
        </a>
      </div>
    </div>
  );
}
