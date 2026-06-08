// Centralized design tokens for the Atto Generator prototype.
// Values come from the Figma reference (variable_defs pulled via MCP) which
// uses an Atlassian-style palette, plus the brand gradients seen in screenshots.

export const palette = {
  text: {
    primary: '#172b4d',
    secondary: '#647188',
    tertiary: '#8993a4',
    placeholder: '#c2c7d1',
    inverse: '#ffffff',
  },
  icon: {
    primary: '#42526e',
    secondary: '#8993a4',
  },
  brand: {
    deepTeal: '#093f4d',
    deepTealHover: '#0c5063',
  },
  bg: {
    white: '#ffffff',
    surface: 'rgba(255,255,255,0.9)',
    base200: '#f1f2f4',
    base300: '#dcdfe5',
    chipBg: 'rgba(255,255,255,0.7)',
  },
  line: {
    line200: '#ebecf0',
    line300: '#e5e7eb',
    line400: '#dcdfe5',
    line500: '#c1c7d0',
  },
  semantic: {
    success: '#2b9a66',
    successBg: '#e6f4ec',
    info: '#0a64f0',
    infoBg: '#d2deff',
    warning: '#a16207',
    warningBg: '#fff6d6',
    error: '#dc3545',
    errorBg: '#feeae9',
  },
  category: {
    happy: { fg: '#1f7a4d', bg: '#e1f5e9', dot: '#2b9a66' },
    error: { fg: '#a8470b', bg: '#fde7d6', dot: '#d97706' },
    errorCritical: { fg: '#b42318', bg: '#fee4e2', dot: '#dc2626' },
    data: { fg: '#175cd3', bg: '#dbeafe', dot: '#2563eb' },
    edge: { fg: '#6940c4', bg: '#ece5fb', dot: '#8b5cf6' },
  },
  priority: {
    p0: '#dc2626',
    p1: '#dc2626',
    p2: '#d97706',
    p3: '#16a34a',
  },
} as const

export const gradient = {
  // Background wash on the chat surface
  background:
    'linear-gradient(135deg, #f1ecff 0%, #f3efff 18%, #fbe9e3 60%, #fde2d3 95%)',
  backgroundNoise:
    'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%221%22 stitchTiles=%22stitch%22/><feColorMatrix values=%220 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")',
  // Pink → purple → violet gradient used on the prompt textarea border and
  // primary CTAs (Generate / Proceed / Send)
  brandStroke:
    'linear-gradient(95deg, #f8a4d8 0%, #d77be8 35%, #a079f0 70%, #7a8df5 100%)',
  brandFill:
    'linear-gradient(95deg, #ef84cf 0%, #c46be0 35%, #8c61ec 70%, #6577f3 100%)',
  brandFillHover:
    'linear-gradient(95deg, #e76bc0 0%, #ba5cd7 35%, #815ae3 70%, #5b6deb 100%)',
  // Animated conic used by GradientField as the AI activity indicator
  conic:
    'conic-gradient(from 0deg, #f7c6e6, #e8b3f3, #c9b8f7, #b2c6fb, #ffd6cc, #f7c6e6)',
} as const

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
} as const

export const spacing = {
  px1: 4,
  px2: 8,
  px3: 12,
  px4: 16,
  px5: 20,
  px6: 24,
  px8: 32,
  px10: 40,
} as const

export const shadow = {
  card: '0 1px 1px rgba(0,0,0,0.06), 0 4px 12px rgba(15,15,30,0.06)',
  cardHover: '0 2px 4px rgba(0,0,0,0.08), 0 8px 24px rgba(15,15,30,0.10)',
  pill: '0 1px 1px rgba(0,0,0,0.06), 0 2px 4px rgba(15,15,30,0.06)',
  button:
    '0 1px 1px rgba(0,0,0,0.10), 0 4px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)',
} as const

export const type = {
  family:
    "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  // (size, lineHeight, weight, letterSpacing?)
  display: { size: 28, line: 36, weight: 500, ls: -0.4 },
  h1: { size: 24, line: 32, weight: 500, ls: -0.2 },
  h2: { size: 18, line: 26, weight: 600, ls: 0 },
  body: { size: 14, line: 20, weight: 400, ls: 0 },
  bodyM: { size: 14, line: 20, weight: 500, ls: 0 },
  small: { size: 13, line: 18, weight: 400, ls: 0 },
  smallM: { size: 13, line: 18, weight: 500, ls: 0 },
  tiny: { size: 12, line: 16, weight: 400, ls: 0 },
  tinyM: { size: 12, line: 16, weight: 500, ls: 0 },
  mono: { size: 12, line: 16, weight: 500, ls: 0 },
} as const

export const categoryFor = (
  category: string | undefined,
): { label: string; fg: string; bg: string; dot: string } => {
  const c = (category ?? '').toLowerCase()
  if (c.includes('happy')) {
    return { label: 'Happy Path', ...palette.category.happy }
  }
  if (c.includes('error') && c.includes('security')) {
    return { label: 'Error handling', ...palette.category.errorCritical }
  }
  if (c.includes('error')) {
    return { label: 'Error handling', ...palette.category.error }
  }
  if (c.includes('data')) {
    return { label: 'Data handling', ...palette.category.data }
  }
  if (c.includes('edge')) {
    return { label: 'Edge case', ...palette.category.edge }
  }
  return { label: category ?? 'Other', ...palette.category.data }
}
