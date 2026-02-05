const channels = [
  { id: 'ch1', y: 150, d: 'M-100,150 C100,130 300,170 500,150 C700,130 900,170 1100,150 C1300,130 1400,150 1500,150' },
  { id: 'ch2', y: 280, d: 'M-100,280 C150,300 350,260 550,280 C750,300 950,260 1150,280 C1350,300 1450,280 1500,280' },
  { id: 'ch3', y: 400, d: 'M-100,400 C200,380 400,420 600,400 C800,380 1000,420 1200,400 C1400,380 1500,400 1500,400' },
  { id: 'ch4', y: 500, d: 'M-100,500 C100,520 300,480 500,500 C700,520 900,480 1100,500 C1300,520 1500,500 1500,500' },
]

const particles = [
  { channel: 'ch1', r: 4, dur: 7, delay: 0, opacity: 0.25 },
  { channel: 'ch1', r: 2.5, dur: 9, delay: 3, opacity: 0.2 },
  { channel: 'ch1', r: 3, dur: 11, delay: 6, opacity: 0.15 },
  { channel: 'ch2', r: 3.5, dur: 8, delay: 1, opacity: 0.25 },
  { channel: 'ch2', r: 2, dur: 10, delay: 5, opacity: 0.2 },
  { channel: 'ch2', r: 3, dur: 12, delay: 8, opacity: 0.15 },
  { channel: 'ch3', r: 3, dur: 9, delay: 2, opacity: 0.2 },
  { channel: 'ch3', r: 2.5, dur: 7, delay: 4, opacity: 0.25 },
  { channel: 'ch3', r: 4, dur: 11, delay: 7, opacity: 0.15 },
  { channel: 'ch4', r: 2, dur: 8, delay: 0, opacity: 0.2 },
  { channel: 'ch4', r: 3, dur: 10, delay: 3, opacity: 0.15 },
  { channel: 'ch4', r: 2.5, dur: 13, delay: 6, opacity: 0.2 },
]

const floaters = [
  { cx: 100, cy: 100, r: 2, durX: 14, durY: 10, rangeX: 40, rangeY: 30, opacity: 0.12 },
  { cx: 300, cy: 350, r: 1.5, durX: 12, durY: 16, rangeX: 30, rangeY: 40, opacity: 0.1 },
  { cx: 700, cy: 200, r: 2.5, durX: 16, durY: 12, rangeX: 50, rangeY: 35, opacity: 0.1 },
  { cx: 900, cy: 450, r: 1.5, durX: 10, durY: 14, rangeX: 35, rangeY: 45, opacity: 0.12 },
  { cx: 1100, cy: 300, r: 2, durX: 13, durY: 11, rangeX: 45, rangeY: 30, opacity: 0.1 },
  { cx: 500, cy: 500, r: 1.5, durX: 15, durY: 13, rangeX: 35, rangeY: 35, opacity: 0.08 },
]

export default function HeroAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {channels.map((ch) => (
            <path key={ch.id} id={ch.id} d={ch.d} />
          ))}
        </defs>

        {/* Subtle channel lines */}
        {channels.map((ch) => (
          <use
            key={`line-${ch.id}`}
            href={`#${ch.id}`}
            fill="none"
            stroke="#0067FF"
            strokeWidth="1"
            opacity="0.06"
          />
        ))}

        {/* Particles flowing through channels */}
        {particles.map((p, i) => (
          <circle key={`p-${i}`} r={p.r} fill="#0067FF" opacity={p.opacity}>
            <animateMotion
              dur={`${p.dur}s`}
              repeatCount="indefinite"
              begin={`${p.delay}s`}
            >
              <mpath href={`#${p.channel}`} />
            </animateMotion>
          </circle>
        ))}

        {/* Free-floating particles (Brownian-like drift) */}
        {floaters.map((f, i) => (
          <circle key={`f-${i}`} r={f.r} fill="#0067FF" opacity={f.opacity}>
            <animate
              attributeName="cx"
              values={`${f.cx};${f.cx + f.rangeX};${f.cx - f.rangeX / 2};${f.cx}`}
              dur={`${f.durX}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values={`${f.cy};${f.cy - f.rangeY};${f.cy + f.rangeY / 2};${f.cy}`}
              dur={`${f.durY}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    </div>
  )
}
