import { motion, useReducedMotion } from 'framer-motion'

interface Props {
  active: boolean
  intensity?: number
}

/**
 * Full-surface animated gradient using the "Generate with AI" button colors
 * (salmon → purple from the theme variables). It drifts/pulses while Atto is
 * generating (active) and calms to static when Atto needs input, the run is
 * complete, or under prefers-reduced-motion. Kept very subtle (low opacity +
 * heavy blur) so text stays readable.
 */
export function GradientField({ active, intensity = 1 }: Props) {
  const reduce = useReducedMotion()
  const op = (active ? 0.3 : 0.05) * intensity
  return (
    <motion.div
      className="proto-gradient-field"
      style={{
        backgroundImage:
          'conic-gradient(from 0deg,' +
          ' hsl(var(--ai-gradient-from, 356 66% 70%) / 0.6),' +
          ' #ffffff,' +
          ' hsl(var(--ai-gradient-to, 263 72% 55%) / 0.55),' +
          ' #ffffff,' +
          ' hsl(var(--ai-gradient-from, 356 66% 70%) / 0.6))',
        filter: 'blur(90px) saturate(1)',
      }}
      // On launch (Atto's Home), bloom in: start darker + smaller and ease to a
      // lighter, fuller resting state — a slow, calm entrance.
      initial={reduce ? { opacity: op } : { opacity: 0.32, scale: 0.78, rotate: -8 }}
      animate={
        active && !reduce
          ? { rotate: 360, scale: [1, 1.1, 1], opacity: op }
          : { rotate: 0, scale: 1, opacity: op }
      }
      transition={
        active && !reduce
          ? {
              rotate: { duration: 5, ease: 'linear', repeat: Infinity },
              scale: { duration: 2.4, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' },
              opacity: { duration: 0.6 },
            }
          : { duration: 2.6, ease: 'easeOut' }
      }
      aria-hidden
    />
  )
}
