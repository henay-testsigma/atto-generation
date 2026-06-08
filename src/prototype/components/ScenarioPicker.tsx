import { motion } from 'framer-motion'
import type { ScenarioMeta } from '../events/scenarios'

interface Props {
  scenarios: ScenarioMeta[]
  active: string
  onChange: (id: string) => void
}

export function ScenarioPicker({ scenarios, active, onChange }: Props) {
  return (
    <div className="proto-scenario-picker" role="radiogroup" aria-label="Scenario">
      {scenarios.map((s) => (
        <motion.button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={s.id === active}
          onClick={() => onChange(s.id)}
          className={`proto-scenario-picker-btn ${s.id === active ? 'is-active' : ''}`}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="proto-scenario-picker-name">{s.name}</span>
          <span className="proto-scenario-picker-hint">{s.hint}</span>
        </motion.button>
      ))}
    </div>
  )
}
