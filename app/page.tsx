import ShoppingList from "@/components/ShoppingList";

export default function Home() {
  return (
    <main className="min-h-screen pb-20 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main container with glassmorphism */}
      <div className="relative max-w-md mx-auto shadow-2xl min-h-screen">
        {/* Header with gradient and glass effect */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-xl"></div>
          <div className="relative px-6 py-8 text-center">
            <div className="inline-block mb-3">
              <div className="text-5xl mb-2 floating">🛒</div>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg">
              Mi Lista Inteligente
            </h1>
            <p className="text-white/90 text-sm font-medium drop-shadow">
              Encontrá los mejores precios cerca tuyo
            </p>
          </div>
          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="rgba(255,255,255,0.1)" />
            </svg>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative px-4 pt-4">
          <ShoppingList />
        </div>
      </div>
    </main>
  );
}
