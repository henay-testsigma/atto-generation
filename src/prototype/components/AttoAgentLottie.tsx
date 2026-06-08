import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'
import animationData from '../assets/atto-agent.json'

interface Props {
  size?: number
  loop?: boolean
  autoplay?: boolean
}

/**
 * Hero-only Atto Agent mascot, played from a self-contained Lottie JSON
 * (images base64-inlined into the JSON file at build prep). Uses
 * lottie-web directly to sidestep `lottie-react`'s CJS interop quirks
 * with our `verbatimModuleSyntax` tsconfig.
 */
export function AttoAgentLottie({
  size = 160,
  loop = true,
  autoplay = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay,
      animationData,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    })
    return () => {
      anim.destroy()
    }
  }, [loop, autoplay])

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size, lineHeight: 0 }}
      role="img"
      aria-label="Atto Agent"
    />
  )
}
