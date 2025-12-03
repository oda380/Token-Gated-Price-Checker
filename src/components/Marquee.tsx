'use client'
import React from 'react'

export default function Marquee({ items }: { items: string[] }) {
    return (
        <div className="w-full overflow-hidden border-b-2 border-white bg-[#CCFF00] text-black py-2 select-none">
            <div className="flex whitespace-nowrap animate-marquee">
                {/* We duplicate the items to create a seamless loop */}
                <div className="flex gap-8 px-4">
                    {items.map((item, i) => (
                        <span key={`a-${i}`} className="text-sm font-bold uppercase tracking-widest font-mono">
                            {item}
                        </span>
                    ))}
                </div>
                <div className="flex gap-8 px-4">
                    {items.map((item, i) => (
                        <span key={`b-${i}`} className="text-sm font-bold uppercase tracking-widest font-mono">
                            {item}
                        </span>
                    ))}
                </div>
                <div className="flex gap-8 px-4">
                    {items.map((item, i) => (
                        <span key={`c-${i}`} className="text-sm font-bold uppercase tracking-widest font-mono">
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}
