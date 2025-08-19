// src/components/Login.tsx
'use client'

export default function Login() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-950 text-white">
      <div className="max-w-md mx-auto rounded-2xl p-8 bg-slate-800 border border-slate-700 shadow-xl space-y-4 text-center">
        <h3 className="font-bold text-3xl mb-3">Welcome</h3>
        <p className="text-gray-400">
          To get started, please connect your wallet holding a valid NFT to access the app.
        </p>
        <div className="mt-6">
          {/* This is where the ConnectButton will go, as it's already in the header */}
          {/* We don't need to render it here anymore */}
        </div>
      </div>
    </div>
  );
}