import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="w-full border-t-2 border-white bg-black pt-12 pb-8 mt-24">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

                    {/* Column 1: Brand & Status */}
                    <div className="space-y-4">
                        <div className="text-xl font-black text-white tracking-tighter">
                            NEXUS_PRICES<span className="text-[#CCFF00]">_TERMINAL</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                            <span className="w-2 h-2 bg-[#CCFF00] rounded-full animate-pulse"></span>
                            SYSTEM STATUS: OPERATIONAL
                        </div>
                    </div>

                    {/* Column 2: Disclaimer */}
                    <div className="text-xs text-gray-500 font-mono space-y-2">
                        <p className="uppercase font-bold text-white">Disclaimer</p>
                        <p>
                            Data provided by CoinGecko API.
                            This application is for educational/hobby purposes only.
                            <span className="text-[#FF00FF]"> Not financial advice.</span>
                        </p>
                    </div>

                    {/* Column 3: Links */}
                    <div className="flex flex-col md:items-end gap-3">
                        <Link
                            href="https://ktlimweb3.me"
                            target="_blank"
                            className="neo-btn-secondary text-xs uppercase tracking-widest text-center w-full md:w-auto"
                        >
                            Built by KTLIM
                        </Link>
                        <div className="flex gap-4 text-sm font-mono text-gray-400">
                            <span>V1.0.0</span>
                            <span>© {new Date().getFullYear()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
