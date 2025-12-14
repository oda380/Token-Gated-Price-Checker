import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="w-full border-t border-white/20 bg-black py-8 mt-20">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Branding */}
                <div className="text-white/60 text-sm font-mono">
                    NEXUS_PRICES © {new Date().getFullYear()}
                </div>

                {/* Links */}
                <div className="flex items-center gap-6">
                    <Link
                        href="https://ktlimweb3.me"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative px-4 py-2 bg-[#1A1A1A] border border-white/20 hover:border-[#CCFF00] transition-colors"
                    >
                        <span className="text-sm font-bold text-white group-hover:text-[#CCFF00] uppercase tracking-wider">
                            My Site
                        </span>
                    </Link>

                    <Link
                        href="mailto:ktlim380@yahoo.com"
                        className="text-white/60 hover:text-[#FF00FF] text-sm font-medium transition-colors uppercase tracking-wider"
                    >
                        Contact
                    </Link>
                </div>
            </div>
        </footer>
    );
}
