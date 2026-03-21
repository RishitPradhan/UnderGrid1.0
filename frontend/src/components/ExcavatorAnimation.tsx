import React from 'react';

export default function ExcavatorAnimation() {
    return (
        <div className="w-full flex justify-center items-center py-20 relative overflow-hidden bg-[#020408]">
            <style>{`
                @keyframes trackMove {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: -20; }
                }
                @keyframes boomMove {
                    0%, 100% { transform: rotate(-10deg); }
                    30%, 50% { transform: rotate(15deg); }
                    80% { transform: rotate(-20deg); }
                }
                @keyframes stickMove {
                    0%, 100% { transform: rotate(10deg); }
                    30% { transform: rotate(-30deg); }
                    50% { transform: rotate(-10deg); }
                    80% { transform: rotate(45deg); }
                }
                @keyframes bucketMove {
                    0%, 100% { transform: rotate(20deg); }
                    30% { transform: rotate(-40deg); }
                    40%, 50% { transform: rotate(30deg); }
                    80% { transform: rotate(-60deg); } /* Dump */
                }
                @keyframes rockPileMove {
                    0%, 25% { transform: translate(0, 0); opacity: 1; }
                    35%, 45% { transform: translate(0, 0); opacity: 0; }
                    85% { transform: translate(0, 0); opacity: 0; }
                    100% { transform: translate(0, 0); opacity: 1; }
                }
                @keyframes fallingRock {
                    0%, 75% { transform: translate(0, 0); opacity: 0; }
                    80% { transform: translate(0, 0); opacity: 1; }
                    95%, 100% { transform: translate(0, 100px); opacity: 0; }
                }
                .anim-boom {
                    transform-origin: 300px 220px;
                    animation: boomMove 6s infinite ease-in-out;
                }
                .anim-stick {
                    transform-origin: 480px 100px;
                    animation: stickMove 6s infinite ease-in-out;
                }
                .anim-bucket {
                    transform-origin: 520px 240px;
                    animation: bucketMove 6s infinite ease-in-out;
                }
                .anim-track {
                    stroke-dasharray: 10 10;
                    animation: trackMove 1s infinite linear;
                }
                .anim-rock-pile {
                    animation: rockPileMove 6s infinite ease-in-out;
                }
                .anim-falling-rock-1 {
                    animation: fallingRock 6s infinite ease-in;
                }
            `}</style>
            
            <div className="relative w-full max-w-4xl aspect-[2/1]">
                <svg viewBox="0 0 800 400" className="w-full h-full stroke-white fill-none stroke-[2px]" strokeLinecap="round" strokeLinejoin="round">
                    {/* Ground */}
                    <path d="M 0 320 L 800 320" className="stroke-white/20" />
                    <path d="M 0 350 L 800 350" className="stroke-white/10" />
                    
                    {/* Background Terrain */}
                    <path d="M 0 250 Q 150 250 300 320 T 600 280 T 800 320" className="stroke-white/10 stroke-[1px]" />
                    
                    {/* Dump Truck (Static Target) */}
                    <g transform="translate(620, 240)" className="stroke-white/40">
                        {/* Truck Body */}
                        <path d="M 20 60 L 120 60 L 140 20 L 10 20 Z" />
                        {/* Truck Cab */}
                        <path d="M 120 60 L 160 60 L 160 10 L 130 10 Z" />
                        {/* Wheels */}
                        <circle cx="40" cy="70" r="12" />
                        <circle cx="100" cy="70" r="12" />
                    </g>
                    
                    {/* Rock Pile (Mines to be collected) */}
                    <g className="anim-rock-pile" transform="translate(500, 310)">
                        <path d="M 0 10 Q 10 -10 20 5 T 40 10" />
                        <path d="M 5 5 Q 15 -5 25 5" />
                        <circle cx="10" cy="5" r="3" className="fill-white" />
                        <circle cx="20" cy="2" r="2" className="fill-white" />
                        <circle cx="30" cy="7" r="2.5" className="fill-white" />
                    </g>

                    {/* Excavator Assembly */}
                    <g>
                        {/* Tracks */}
                        <g transform="translate(200, 290)">
                            <rect x="0" y="0" width="140" height="30" rx="15" />
                            <rect x="5" y="5" width="130" height="20" rx="10" className="anim-track" />
                            <circle cx="20" cy="15" r="6" />
                            <circle cx="50" cy="15" r="6" />
                            <circle cx="90" cy="15" r="6" />
                            <circle cx="120" cy="15" r="6" />
                        </g>

                        {/* Body / Cab */}
                        <g transform="translate(220, 210)">
                            {/* Main housing */}
                            <path d="M 0 80 L 100 80 L 100 20 L 80 0 L 0 0 Z" />
                            {/* Cab */}
                            <path d="M 60 40 L 90 40 L 90 20 L 70 0 L 60 0 Z" />
                            {/* Details */}
                            <line x1="75" y1="40" x2="75" y2="10" />
                            <line x1="10" y1="20" x2="40" y2="20" />
                        </g>

                        {/* Animated Arm Assembly */}
                        {/* Boom */}
                        <g className="anim-boom">
                            {/* Base of boom is at 300, 220 */}
                            <path d="M 300 220 Q 350 100 480 100 L 490 120 Q 360 130 310 230 Z" className="fill-[#020408]" />
                            
                            {/* Stick */}
                            <g className="anim-stick">
                                {/* Joint of stick is at 480, 100 */}
                                <path d="M 480 100 L 520 240 L 505 245 L 470 115 Z" className="fill-[#020408]" />
                                
                                {/* Hydraulic cylinder on stick */}
                                <line x1="475" y1="130" x2="500" y2="200" />
                                
                                {/* Bucket */}
                                <g className="anim-bucket">
                                    {/* Joint of bucket is at 520, 240 */}
                                    <path d="M 520 240 Q 550 260 550 290 L 500 290 Q 490 260 520 240 Z" className="fill-[#020408]" />
                                    {/* Teeth */}
                                    <path d="M 550 290 L 555 300 L 545 290 L 545 300 L 535 290" />
                                    
                                    {/* Falling Rocks dumped from bucket */}
                                    <g className="anim-falling-rock-1" transform="translate(520, 260)">
                                        <circle cx="0" cy="0" r="4" className="fill-white" />
                                        <circle cx="10" cy="5" r="3" className="fill-white" />
                                        <circle cx="-5" cy="8" r="5" className="fill-white" />
                                    </g>
                                </g>
                            </g>
                        </g>
                    </g>
                </svg>
            </div>
        </div>
    );
}
