import { motion } from 'framer-motion'
import { useId } from 'react'

interface Props {
  size?: number
  /** When true, gently bob & breathe. */
  alive?: boolean
}

/**
 * Atto AI brand icon — the gradient "smiling capsule" mark.
 * Sourced from the project's exported SVG; `useId()` namespaces the
 * gradient/clip defs so multiple instances on the page don't collide.
 */
export function AvatarRobot({ size = 56, alive = false }: Props) {
  const rid = useId().replace(/:/g, '')
  const g1 = `atto-g1-${rid}`
  const g2 = `atto-g2-${rid}`
  const clip = `atto-clip-${rid}`
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      role="img"
      aria-label="Atto AI"
      animate={alive ? { y: [0, -1.5, 0, 1.5, 0] } : { y: 0 }}
      transition={{
        repeat: alive ? Infinity : 0,
        duration: 3,
        ease: 'easeInOut',
      }}
    >
      <g clipPath={`url(#${clip})`}>
        <path
          d="M0.324951 11.3975C0.618377 11.658 0.953287 11.8785 1.323 12.0449C1.73865 12.232 2.16081 12.4018 2.58667 12.5566C3.83813 14.8085 6.24073 16.3328 8.99976 16.333C11.7603 16.333 14.1627 14.8065 15.4138 12.5527C15.8609 12.3912 16.304 12.2128 16.74 12.0166C17.0769 11.8649 17.386 11.6676 17.6628 11.4365C16.6 15.2228 13.1256 18 8.99976 18L8.53687 17.9883C4.6018 17.7886 1.33517 15.0609 0.324951 11.3975ZM9.46265 0.0117188C12.7609 0.178818 15.5889 2.12281 17.0134 4.9043C16.5722 4.7214 16.0843 4.62794 15.573 4.64844L14.9197 4.67383C13.5856 2.85151 11.4314 1.66699 8.99976 1.66699C6.57076 1.6672 4.41801 2.84884 3.08374 4.66797L2.55444 4.64648C1.98055 4.62295 1.4346 4.7427 0.950928 4.97266C2.42887 2.02464 5.4775 0.000249403 8.99976 0L9.46265 0.0117188Z"
          fill={`url(#${g1})`}
        />
        <path
          d="M14.9111 5.09923C16.6008 5.04503 18 6.39986 18 8.09044V8.40196C17.9999 9.77005 17.2037 11.0135 15.9609 11.5856C11.5432 13.6191 6.45677 13.6191 2.03906 11.5856C0.796306 11.0135 0.000133684 9.77005 0 8.40196V8.09044C0 6.39986 1.39922 5.04503 3.08887 5.09923L9 5.28966L14.9111 5.09923ZM5.48047 7.62852H5.16406V9.46837H5.48145V9.90684H6.11719V9.46837H6.43652V9.00743H6.59277V8.08751H6.43652V7.62852H6.11719V7.19981H5.48047V7.62852ZM12.0723 7.19981V7.62852H11.7559V9.46837H12.0723V9.90684H12.708V9.46837H13.0273V9.00743H13.1846V8.08751H13.0273V7.62852H12.708V7.19981H12.0723ZM5.00098 9.00938H5.16016V8.08946H5.00098V9.00938ZM11.5928 8.08946V9.00938H11.752V8.08946H11.5928Z"
          fill={`url(#${g2})`}
        />
      </g>
      <defs>
        <linearGradient
          id={g1}
          x1="8.80846"
          y1="-6.1875"
          x2="29.7217"
          y2="5.05003"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E58086" />
          <stop offset="1" stopColor="#5C27F5" />
        </linearGradient>
        <linearGradient
          id={g2}
          x1="8.80749"
          y1="2.34314"
          x2="19.6936"
          y2="15.9848"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E58086" />
          <stop offset="1" stopColor="#5C27F5" />
        </linearGradient>
        <clipPath id={clip}>
          <rect width="18" height="18" fill="white" />
        </clipPath>
      </defs>
    </motion.svg>
  )
}
