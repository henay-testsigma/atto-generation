import {
  Bot,
  LayoutGrid,
  Sparkles,
  Folder,
  Play,
  ListChecks,
  GitMerge,
  Settings,
  MoreVertical,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { GradientField } from './GradientField'
import { palette } from '../theme'

interface Props {
  children: ReactNode
  active?: boolean
  /** When true, GradientField rotates; otherwise calm static. */
  gradientActive?: boolean
}

const RAIL_ICONS = [
  { key: 'grid', icon: <LayoutGrid size={18} />, label: 'Dashboard' },
  { key: 'atto', icon: <Sparkles size={18} />, label: 'Atto Agent', active: true },
  { key: 'play', icon: <Play size={18} />, label: 'Runs' },
  { key: 'folder', icon: <Folder size={18} />, label: 'Projects' },
  { key: 'tcs', icon: <ListChecks size={18} />, label: 'Test Cases' },
  { key: 'integ', icon: <GitMerge size={18} />, label: 'Integrations' },
]

export function AppShell({ children, gradientActive = false }: Props) {
  return (
    <div className="proto-shell">
      <GradientField active={gradientActive} />
      <div className="proto-shell-noise" aria-hidden />
      <aside className="proto-rail" aria-label="Primary navigation">
        <div className="proto-rail-logo" title="Testsigma">
          <Bot size={22} color={palette.brand.deepTeal} />
        </div>
        <ul className="proto-rail-items">
          {RAIL_ICONS.map((it) => (
            <li key={it.key}>
              <button
                type="button"
                aria-label={it.label}
                className={`proto-rail-btn ${it.active ? 'is-active' : ''}`}
                title={it.label}
              >
                {it.icon}
              </button>
            </li>
          ))}
        </ul>
        <div style={{ flex: 1 }} />
        <ul className="proto-rail-bottom">
          <li>
            <button type="button" aria-label="Settings" className="proto-rail-btn" title="Settings">
              <Settings size={16} />
            </button>
          </li>
          <li>
            <button type="button" aria-label="More" className="proto-rail-btn" title="More">
              <MoreVertical size={16} />
            </button>
          </li>
          <li>
            <button type="button" aria-label="Account" className="proto-rail-avatar" title="Henay">
              H
            </button>
          </li>
        </ul>
      </aside>

      <main className="proto-main">
        <div className="proto-topbar">
          <button type="button" className="proto-back-pill">
            <ChevronLeft size={14} /> Atto's Home
          </button>
        </div>
        <div className="proto-main-content">{children}</div>
        <footer className="proto-secure-footer">
          <ShieldCheck size={14} color={palette.semantic.success} aria-hidden />
          <span>Your data is secure and never used for AI training</span>
        </footer>
      </main>
    </div>
  )
}
