import Login from '@/components/Login'
import GateGuard from '@/components/GateGuard'
import PriceViewer from '@/components/PriceViewer'

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Token Gated Prices</h1>

      {/* Single button for Connect + SIWE (your patched Login.tsx) */}
      <Login />

      {/* Show dashboard only if gate passes */}
      <GateGuard>
        <PriceViewer />
      </GateGuard>
    </main>
  )
}
