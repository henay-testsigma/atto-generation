import {
  Search,
  BookOpen,
  ListChecks,
  Sparkles,
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertCircle,
  CirclePlay,
  SquareCheck,
  Layers,
  Wrench,
  Bot,
  FileText,
  FileCheck2,
  MessageCircleQuestion,
  PieChart,
  DatabaseZap,
  Gauge,
  MessageSquare,
  Inbox,
  EyeOff,
  Pause,
  Play,
  CircleStop,
  Wand2,
  type LucideIcon,
} from 'lucide-react'
import type { CatalogEntry } from './catalogData'

/**
 * Single source of truth for milestone/timeline lucide icons. Keyed by a
 * logical string so it can be reused both by `TimelineRail` (which stores the
 * key on each step) and by the catalog index/chips.
 */
export const ICON_BY_KEY: Record<string, LucideIcon> = {
  // legacy keys used by PrototypeApp's TOOL_ICONS / Done row
  search: Search,
  book: BookOpen,
  checks: ListChecks,
  sparkles: Sparkles,
  shield: ShieldCheck,
  check: Check,
  // catalog keys
  session: CirclePlay,
  session_done: CheckCircle2,
  pause: Pause,
  resume: Play,
  stopped: CircleStop,
  error: AlertCircle,
  plan: ListChecks,
  plan_item: SquareCheck,
  phase: Layers,
  tool: Wrench,
  agent: Bot,
  scenario: FileText,
  testcase: FileCheck2,
  validation: ShieldCheck,
  question: MessageCircleQuestion,
  chart: PieChart,
  skill: Wand2,
  backfill: DatabaseZap,
  score: Gauge,
  chat: MessageSquare,
  inbound: Inbox,
  suppress: EyeOff,
}

/** Logical icon key for a catalog entry (also valid as a TimelineItem.icon). */
export function iconKeyFor(entry: CatalogEntry): string {
  const e = entry.event
  // failure / terminal-error states always read as an alert
  if (/(_failed|_error|_terminated|^error$)/.test(e)) return 'error'
  if (entry.final === 'Suppress') return 'suppress'
  // event-name specials
  if (e === 'session_paused') return 'pause'
  if (e === 'session_resumed') return 'resume'
  if (e === 'session_terminated') return 'stopped'
  if (e === 'session_completed' || e === 'session_complete') return 'session_done'
  if (e === 'visualization' || e.includes('viz')) return 'chart'
  if (e === 'skill_loaded') return 'skill'
  if (e.includes('backfill')) return 'backfill'
  if (e.includes('scoring') || e.includes('score')) return 'score'
  if (e === 'welcome' || e === 'message' || e === 'user_message' || e === 'dev_context') return 'chat'
  // by group type
  switch (entry.groupType) {
    case 'session':
      return 'session'
    case 'plan':
      return 'plan'
    case 'plan_item':
      return 'plan_item'
    case 'phase':
      return 'phase'
    case 'tool':
      return 'tool'
    case 'sub_agent':
      return 'agent'
    case 'scenario':
      return 'scenario'
    case 'test_case':
      return 'testcase'
    case 'validation':
      return 'validation'
    case 'question':
      return 'question'
    case 'inbound':
      return 'inbound'
    default:
      return 'sparkles'
  }
}

export function iconFor(entry: CatalogEntry): LucideIcon {
  return ICON_BY_KEY[iconKeyFor(entry)] ?? Sparkles
}
