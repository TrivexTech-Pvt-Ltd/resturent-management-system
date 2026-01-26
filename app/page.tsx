import Link from 'next/link';

export default function Home() {
  const screens = [
    { name: 'Cashier / Billing', href: '/cashier', icon: '💰', color: 'bg-indigo-600' },
    { name: 'Kitchen Display', href: '/kitchen', icon: '👨‍🍳', color: 'bg-rose-600' },
    { name: 'Customer Display', href: '/customer', icon: '📺', color: 'bg-emerald-600' },
    { name: 'Status Board', href: '/status', icon: '📋', color: 'bg-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tight italic">
            FOODSH<span className="text-indigo-600">❤</span>P
          </h1>
          <p className="text-xl text-slate-500 font-medium">Next-Gen Restaurant Management System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {screens.map((screen) => (
            <Link
              key={screen.href}
              href={screen.href}
              className="group relative overflow-hidden glass-card rounded-3xl p-8 hover:scale-[1.02] transition-all hover:shadow-2xl hover:shadow-indigo-200/50"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${screen.color} opacity-5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500`} />

              <div className="flex items-center gap-6 relative z-10">
                <div className={`w-16 h-16 ${screen.color} rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>
                  {screen.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{screen.name}</h2>
                  <p className="text-slate-500">Launch terminal interface</p>
                </div>
              </div>

              <div className="mt-8 flex items-center text-indigo-600 font-bold gap-2 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
                <span>Enter Terminal</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-24 text-center text-slate-400 font-medium border-t pt-8">
          <p>© 2026 FoodShop Systems. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
