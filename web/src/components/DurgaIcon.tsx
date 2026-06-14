export function DurgaIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 54"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FF8C00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="faceGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="100%" stopColor="#E8A020" />
        </radialGradient>
        <style>{`
          @keyframes durgaPulse {
            0%, 100% { opacity: 0.55; transform: scale(1); }
            50%       { opacity: 0.95; transform: scale(1.08); }
          }
          @keyframes eyeGlow {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.7; }
          }
          .durga-halo  { animation: durgaPulse 2.4s ease-in-out infinite; transform-origin: 24px 30px; }
          .durga-third { animation: eyeGlow 1.6s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* Halo */}
      <circle className="durga-halo" cx="24" cy="30" r="22" fill="url(#haloGrad)" />

      {/* Mukut (crown) — centre spike */}
      <polygon points="24,1 21,12 27,12" fill="#DAA520" />
      {/* Left spike */}
      <polygon points="13,5 11,14 18,13" fill="#DAA520" />
      {/* Right spike */}
      <polygon points="35,5 37,14 30,13" fill="#DAA520" />
      {/* Crown base band */}
      <rect x="11" y="12" width="26" height="4" rx="2" fill="#B8860B" />
      {/* Crown jewel dots */}
      <circle cx="24" cy="14" r="2" fill="#FF4444" />
      <circle cx="16" cy="14" r="1.3" fill="#FFD700" />
      <circle cx="32" cy="14" r="1.3" fill="#FFD700" />

      {/* Face */}
      <ellipse cx="24" cy="34" rx="14" ry="15" fill="url(#faceGrad)" />

      {/* Eyes — whites */}
      <ellipse cx="18.5" cy="31.5" rx="3.5" ry="2.5" fill="white" />
      <ellipse cx="29.5" cy="31.5" rx="3.5" ry="2.5" fill="white" />
      {/* Pupils */}
      <circle cx="18.5" cy="31.5" r="1.8" fill="#1a1a1a" />
      <circle cx="29.5" cy="31.5" r="1.8" fill="#1a1a1a" />
      {/* Eye shine */}
      <circle cx="19.3" cy="30.8" r="0.6" fill="white" />
      <circle cx="30.3" cy="30.8" r="0.6" fill="white" />

      {/* Third eye (trishul bindi) */}
      <ellipse className="durga-third" cx="24" cy="27" rx="2.2" ry="1.6" fill="#B22222" />
      <line x1="24" y1="24.5" x2="24" y2="22" stroke="#B22222" strokeWidth="1.2" />
      <line x1="22.5" y1="23" x2="24" y2="24.5" stroke="#B22222" strokeWidth="1" />
      <line x1="25.5" y1="23" x2="24" y2="24.5" stroke="#B22222" strokeWidth="1" />

      {/* Nose */}
      <ellipse cx="24" cy="36" rx="1.2" ry="1.8" fill="#D4940A" opacity="0.6" />

      {/* Lips */}
      <path d="M 19.5 40.5 Q 24 43.5 28.5 40.5" stroke="#C0392B" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Earrings */}
      <circle cx="10.5" cy="33" r="2" fill="#DAA520" />
      <circle cx="10.5" cy="33" r="1" fill="#FF4444" />
      <circle cx="37.5" cy="33" r="2" fill="#DAA520" />
      <circle cx="37.5" cy="33" r="1" fill="#FF4444" />
    </svg>
  );
}
