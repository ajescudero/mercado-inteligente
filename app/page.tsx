import ShoppingList from "@/components/ShoppingList";

export default function Home() {
  return (
    <main className="min-h-screen pb-20 bg-[var(--background)] max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-[var(--primary)] p-6 rounded-b-[2rem] shadow-lg z-10 relative">
        <h1 className="text-2xl font-bold text-white text-center">
          🛒 Mi Lista
        </h1>
        <p className="text-white/90 text-center text-sm mt-1">
          ¡Vamos de compras!
        </p>
      </header>

      {/* Main Content */}
      <div className="p-4">
        <ShoppingList />
      </div>
    </main>
  );
}
