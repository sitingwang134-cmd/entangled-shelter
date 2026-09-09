import type { Gesture } from './choice-data';

/** Engraved geometric ornament echoes the homepage's circles, diagonals and star. */
export function ChoiceOrbit({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 400 400" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth=".7">
      <circle cx="200" cy="200" r="183" /><circle cx="200" cy="200" r="165" />
      <circle cx="200" cy="200" r="120" /><ellipse cx="200" cy="200" rx="183" ry="70" />
      <ellipse cx="200" cy="200" rx="70" ry="183" /><path d="M17 200H383M200 17V383M70 70L330 330M70 330L330 70M200 17L383 200L200 383L17 200Z" />
      <path d="M70 70H330V330H70ZM200 70L330 200L200 330L70 200Z" />
    </g>
    <g fill="currentColor"><circle cx="200" cy="17" r="3" /><circle cx="383" cy="200" r="3" /><circle cx="200" cy="383" r="3" /><circle cx="17" cy="200" r="3" /></g>
  </svg>;
}

/** Consistent engraved silhouettes instead of platform-dependent colorful emoji. */
export function HandGlyph({ gesture, className }: { gesture: Gesture; className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {gesture === 'rock' ? <><path d="M25 67L20 49Q18 40 26 38L30 25Q32 19 39 23Q45 15 52 23Q59 17 65 26Q76 23 78 35L80 54Q80 66 69 74V84H36V75Z" /><path d="M26 38L45 39Q55 41 51 50L34 51M39 24V37M52 24V36M65 27V39M36 74H69M42 57L58 62L70 52" /></> : gesture === 'scissors' ? <><path d="M31 78L23 60Q19 51 26 47L35 49L29 17Q29 9 36 10Q41 11 43 22L49 44L60 12Q64 5 70 9Q75 12 71 21L61 51Q70 46 75 52L80 63Q82 70 70 80V89H34V80Z" /><path d="M35 49L48 53Q56 57 50 64L37 61M60 51L58 66M72 56L67 70M36 80H69" /></> : <><path d="M31 78L14 52Q10 44 17 41Q23 39 29 50L34 56L29 25Q28 17 35 16Q42 16 43 26L46 44L45 14Q45 6 52 7Q58 7 58 16L59 43L63 20Q65 11 71 15Q77 17 73 28L71 48L77 32Q81 25 87 30Q91 34 86 44L80 65Q78 75 67 82V91H36V82Z" /><path d="M36 82H67M43 60Q54 50 67 58M49 67L58 72" /></>}
      <path d="M41 86H63" strokeWidth="1" />
    </g>
  </svg>;
}
