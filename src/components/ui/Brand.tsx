import React from 'react';
import { WalletCards } from 'lucide-react';

export const CrewPayMark: React.FC<{ compact?: boolean; onLight?: boolean }> = ({ compact = false, onLight = false }) => (
    <div className={`flex items-center ${compact ? 'gap-2.5' : 'gap-3'}`}>
        <div
            className={`${compact ? 'w-8 h-8 rounded-lg' : 'w-9 h-9 rounded-xl'} relative bg-[#4169E1] text-white flex items-center justify-center shadow-[0_6px_18px_rgba(65,105,225,0.28)] shrink-0`}
        >
            <WalletCards className={compact ? 'w-4 h-4' : 'w-[18px] h-[18px]'} strokeWidth={2.2} />
            <span className={`absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-[#C9F2DF] border-2 ${onLight ? 'border-[#FAF9F6]' : 'border-[#14213D]'}`} />
        </div>
        {!compact && (
            <div className="min-w-0">
                <div className={`font-display font-bold text-lg tracking-tight ${onLight ? 'text-[#14213D]' : 'text-white'} truncate`}>
                    Crew<span className="text-[#C9F2DF]">Pay</span>
                </div>
                <div className="text-[9px] uppercase tracking-[0.18em] text-white/45 font-semibold">
                    Global payroll
                </div>
            </div>
        )}
    </div>
);