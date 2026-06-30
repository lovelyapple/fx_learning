/**
 * Candlestick pattern definitions and matching logic.
 * Each pattern has a score() function that returns 0-1 match strength.
 */

export type CandleSign = 'bullish' | 'bearish' | 'neutral'

export interface PatternInput {
  open: number
  high: number
  low: number
  close: number
}

export interface CandlePattern {
  id: string
  name: string       // Japanese name
  nameEn: string     // English name
  sign: CandleSign
  signLabel: string
  description: string
  meaning: string
  // Normalized SVG shape: values 0-1 (0=top of chart, 1=bottom)
  svg: { highN: number; bodyTopN: number; bodyBottomN: number; lowN: number; bull: boolean }
  score: (c: PatternInput) => number
}

/** Decompose candle into normalized ratios (0-1 within total range) */
function ratios(c: PatternInput) {
  const range = c.high - c.low
  if (range < 0.0001) return { body: 0, upper: 0, lower: 0, bull: true }
  const bodyTop = Math.max(c.open, c.close)
  const bodyBot = Math.min(c.open, c.close)
  return {
    body:  (bodyTop - bodyBot) / range,
    upper: (c.high - bodyTop) / range,
    lower: (bodyBot - c.low) / range,
    bull:  c.close >= c.open,
  }
}

export const candlePatterns: CandlePattern[] = [
  {
    id: 'doji',
    name: '同時線（ドジ）',
    nameEn: 'Doji',
    sign: 'neutral',
    signLabel: '中立（反転注意）',
    description: '始値と終値がほぼ同じ。上下にひげを持つ十字線の形。',
    meaning: '買い勢力と売り勢力が拮抗している状態。トレンドの転換点になりやすく、次の足の方向を確認することが重要。',
    svg: { highN: 0.1, bodyTopN: 0.48, bodyBottomN: 0.52, lowN: 0.9, bull: true },
    score: (c) => {
      const r = ratios(c)
      if (r.body < 0.05) return 1.0
      if (r.body < 0.10) return 0.7
      if (r.body < 0.15) return 0.4
      return 0
    },
  },
  {
    id: 'dragonfly_doji',
    name: 'トンボ',
    nameEn: 'Dragonfly Doji',
    sign: 'bullish',
    signLabel: '強気サイン',
    description: '上ひげがなく、長い下ひげを持つ同時線。',
    meaning: '売り圧力が強まったが買い勢力が巻き返した。下落トレンド末期での出現は底値反転の強いサイン。',
    svg: { highN: 0.08, bodyTopN: 0.1, bodyBottomN: 0.12, lowN: 0.92, bull: true },
    score: (c) => {
      const r = ratios(c)
      if (r.body < 0.1 && r.lower > 0.6 && r.upper < 0.1) return 0.95
      if (r.body < 0.15 && r.lower > 0.5 && r.upper < 0.15) return 0.6
      return 0
    },
  },
  {
    id: 'gravestone_doji',
    name: '墓石線',
    nameEn: 'Gravestone Doji',
    sign: 'bearish',
    signLabel: '弱気サイン',
    description: '下ひげがなく、長い上ひげを持つ同時線。',
    meaning: '買いが入ったが上値を維持できず押し返された。上昇トレンド高値圏での出現は下落転換サイン。',
    svg: { highN: 0.08, bodyTopN: 0.88, bodyBottomN: 0.9, lowN: 0.92, bull: false },
    score: (c) => {
      const r = ratios(c)
      if (r.body < 0.1 && r.upper > 0.6 && r.lower < 0.1) return 0.95
      if (r.body < 0.15 && r.upper > 0.5 && r.lower < 0.15) return 0.6
      return 0
    },
  },
  {
    id: 'hammer',
    name: 'ハンマー',
    nameEn: 'Hammer',
    sign: 'bullish',
    signLabel: '強気サイン（底値圏）',
    description: '小さな実体を持ち、実体の2倍以上の長い下ひげ。上ひげはほとんどない。',
    meaning: '一度は大きく売られたが買いが入り反発。下落トレンドの底での出現は上昇転換の重要シグナル。',
    svg: { highN: 0.06, bodyTopN: 0.06, bodyBottomN: 0.3, lowN: 0.94, bull: true },
    score: (c) => {
      const r = ratios(c)
      if (r.bull && r.lower > 0.5 && r.body < 0.35 && r.upper < 0.15) return 0.9
      if (r.lower > 0.45 && r.body < 0.4 && r.upper < 0.2) return 0.55
      return 0
    },
  },
  {
    id: 'inverted_hammer',
    name: '逆ハンマー',
    nameEn: 'Inverted Hammer',
    sign: 'bullish',
    signLabel: '強気サイン（要確認）',
    description: '小さな実体を持ち、上方向に長いひげ。下ひげはほとんどない。',
    meaning: '買い試みが見られた足。下落トレンド末期に出現すれば反転上昇の可能性。次の足で確認が必要。',
    svg: { highN: 0.06, bodyTopN: 0.7, bodyBottomN: 0.94, lowN: 0.94, bull: true },
    score: (c) => {
      const r = ratios(c)
      if (r.bull && r.upper > 0.5 && r.body < 0.35 && r.lower < 0.15) return 0.8
      return 0
    },
  },
  {
    id: 'shooting_star',
    name: '流れ星',
    nameEn: 'Shooting Star',
    sign: 'bearish',
    signLabel: '弱気サイン（高値圏）',
    description: '小さな実体に長い上ひげ。下ひげはほとんどない。',
    meaning: '一度は大きく買われたが売りに押し返された。上昇トレンドの高値圏での出現は下落転換サイン。',
    svg: { highN: 0.06, bodyTopN: 0.7, bodyBottomN: 0.94, lowN: 0.94, bull: false },
    score: (c) => {
      const r = ratios(c)
      if (!r.bull && r.upper > 0.5 && r.body < 0.35 && r.lower < 0.15) return 0.9
      if (r.upper > 0.45 && r.body < 0.4 && r.lower < 0.2) return 0.55
      return 0
    },
  },
  {
    id: 'hanging_man',
    name: '首吊り線',
    nameEn: 'Hanging Man',
    sign: 'bearish',
    signLabel: '弱気サイン（高値圏）',
    description: 'ハンマーと同じ形（長い下ひげ・小さな実体）だが、上昇トレンドの高値圏に出現。',
    meaning: '一度は売られたが買いが戻した。しかし上昇後の出現は下落転換の予兆。次の足が重要。',
    svg: { highN: 0.06, bodyTopN: 0.06, bodyBottomN: 0.3, lowN: 0.94, bull: false },
    score: (c) => {
      const r = ratios(c)
      if (!r.bull && r.lower > 0.5 && r.body < 0.35 && r.upper < 0.15) return 0.85
      return 0
    },
  },
  {
    id: 'bullish_marubozu',
    name: '陽のマルボウジュ',
    nameEn: 'Bullish Marubozu',
    sign: 'bullish',
    signLabel: '強い強気サイン',
    description: 'ひげがほとんどない大きな陽線（上昇）。',
    meaning: '始値から終値まで一方的な買いが続いた。強い上昇圧力を示し、モメンタムの強さを表す。',
    svg: { highN: 0.04, bodyTopN: 0.04, bodyBottomN: 0.96, lowN: 0.96, bull: true },
    score: (c) => {
      const r = ratios(c)
      if (r.bull && r.body > 0.9) return 1.0
      if (r.bull && r.body > 0.75 && r.upper < 0.1 && r.lower < 0.1) return 0.75
      return 0
    },
  },
  {
    id: 'bearish_marubozu',
    name: '陰のマルボウジュ',
    nameEn: 'Bearish Marubozu',
    sign: 'bearish',
    signLabel: '強い弱気サイン',
    description: 'ひげがほとんどない大きな陰線（下降）。',
    meaning: '始値から終値まで一方的な売りが続いた。強い下落圧力を示し、売り優勢の相場を表す。',
    svg: { highN: 0.04, bodyTopN: 0.04, bodyBottomN: 0.96, lowN: 0.96, bull: false },
    score: (c) => {
      const r = ratios(c)
      if (!r.bull && r.body > 0.9) return 1.0
      if (!r.bull && r.body > 0.75 && r.upper < 0.1 && r.lower < 0.1) return 0.75
      return 0
    },
  },
  {
    id: 'strong_bull',
    name: '大陽線',
    nameEn: 'Strong Bullish',
    sign: 'bullish',
    signLabel: '強気',
    description: '実体が大きく（レンジの65%超）、上昇を示す陽線。',
    meaning: '買い圧力が強い状態。上昇モメンタムが継続していることを示す。',
    svg: { highN: 0.05, bodyTopN: 0.08, bodyBottomN: 0.87, lowN: 0.95, bull: true },
    score: (c) => {
      const r = ratios(c)
      if (r.bull && r.body > 0.65) return 0.75
      return 0
    },
  },
  {
    id: 'strong_bear',
    name: '大陰線',
    nameEn: 'Strong Bearish',
    sign: 'bearish',
    signLabel: '弱気',
    description: '実体が大きく（レンジの65%超）、下落を示す陰線。',
    meaning: '売り圧力が強い状態。下落モメンタムが継続していることを示す。',
    svg: { highN: 0.05, bodyTopN: 0.08, bodyBottomN: 0.87, lowN: 0.95, bull: false },
    score: (c) => {
      const r = ratios(c)
      if (!r.bull && r.body > 0.65) return 0.75
      return 0
    },
  },
  {
    id: 'small_bull',
    name: '小陽線',
    nameEn: 'Small Bullish',
    sign: 'bullish',
    signLabel: '弱い強気',
    description: '中程度の実体を持つ陽線。上下にひげがある。',
    meaning: '買い優勢だが強い勢いはない。上昇傾向の中での一歩。トレンドの継続や様子見を示す。',
    svg: { highN: 0.1, bodyTopN: 0.22, bodyBottomN: 0.68, lowN: 0.9, bull: true },
    score: (c) => {
      const r = ratios(c)
      if (r.bull && r.body >= 0.3 && r.body <= 0.65) return 0.6
      if (r.bull && r.body > 0.15) return 0.35
      return 0
    },
  },
  {
    id: 'small_bear',
    name: '小陰線',
    nameEn: 'Small Bearish',
    sign: 'bearish',
    signLabel: '弱い弱気',
    description: '中程度の実体を持つ陰線。上下にひげがある。',
    meaning: '売り優勢だが強い勢いはない。下落傾向の中での一歩。トレンドの継続や様子見を示す。',
    svg: { highN: 0.1, bodyTopN: 0.22, bodyBottomN: 0.68, lowN: 0.9, bull: false },
    score: (c) => {
      const r = ratios(c)
      if (!r.bull && r.body >= 0.3 && r.body <= 0.65) return 0.6
      if (!r.bull && r.body > 0.15) return 0.35
      return 0
    },
  },
  {
    id: 'upper_shadow_bull',
    name: '上影陽線',
    nameEn: 'Upper Shadow Bullish',
    sign: 'bullish',
    signLabel: '弱い強気（上値警戒）',
    description: '上方向に長いひげを持つ陽線。実体はレンジ下部にある。',
    meaning: '買いが上値を試みたが押し返された。それでも陽線で引けており、わずかに買い優勢。高値圏では上昇力の弱まりを示すことも。',
    svg: { highN: 0.05, bodyTopN: 0.6, bodyBottomN: 0.88, lowN: 0.92, bull: true },
    score: (c) => {
      const r = ratios(c)
      if (r.bull && r.upper > 0.35 && r.body >= 0.15 && r.body < 0.45 && r.lower < 0.25) return 0.65
      return 0
    },
  },
  {
    id: 'upper_shadow_bear',
    name: '上影陰線',
    nameEn: 'Upper Shadow Bearish',
    sign: 'bearish',
    signLabel: '弱気（上値抵抗）',
    description: '上方向に長いひげを持つ陰線。実体はレンジ下部にある。',
    meaning: '買いが上値を試みたが完全に押し返され、陰線で引けた。上値での売り圧力が強く、下落サインとなることが多い。',
    svg: { highN: 0.05, bodyTopN: 0.6, bodyBottomN: 0.88, lowN: 0.92, bull: false },
    score: (c) => {
      const r = ratios(c)
      if (!r.bull && r.upper > 0.35 && r.body >= 0.15 && r.body < 0.45 && r.lower < 0.25) return 0.65
      return 0
    },
  },
  {
    id: 'lower_shadow_bull',
    name: '下影陽線',
    nameEn: 'Lower Shadow Bullish',
    sign: 'bullish',
    signLabel: '強気（下値サポート）',
    description: '下方向に長いひげを持つ陽線。実体はレンジ上部にある。',
    meaning: '一度は売られたが買いが入り陽線で引けた。下値の買い支えが確認でき、上昇継続のサインとなりやすい。',
    svg: { highN: 0.08, bodyTopN: 0.12, bodyBottomN: 0.4, lowN: 0.95, bull: true },
    score: (c) => {
      const r = ratios(c)
      if (r.bull && r.lower > 0.35 && r.body >= 0.15 && r.body < 0.45 && r.upper < 0.25) return 0.65
      return 0
    },
  },
  {
    id: 'lower_shadow_bear',
    name: '下影陰線',
    nameEn: 'Lower Shadow Bearish',
    sign: 'bearish',
    signLabel: '弱気（下値試し）',
    description: '下方向に長いひげを持つ陰線。実体はレンジ上部にある。',
    meaning: '下値を試みたが反発し陰線で引けた。下落トレンド中に出現すると下げ継続、高値圏では反転の予兆になることも。',
    svg: { highN: 0.08, bodyTopN: 0.12, bodyBottomN: 0.4, lowN: 0.95, bull: false },
    score: (c) => {
      const r = ratios(c)
      if (!r.bull && r.lower > 0.35 && r.body >= 0.15 && r.body < 0.45 && r.upper < 0.25) return 0.65
      return 0
    },
  },
  {
    id: 'spinning_top',
    name: 'コマ足',
    nameEn: 'Spinning Top',
    sign: 'neutral',
    signLabel: '中立（迷い相場）',
    description: '小さな実体で、上下にほぼ等しい長さのひげを持つ。',
    meaning: '買いと売りが拮抗している迷いの相場。どちらへの確信もなく、方向感が失われている状態。',
    svg: { highN: 0.1, bodyTopN: 0.38, bodyBottomN: 0.62, lowN: 0.9, bull: true },
    score: (c) => {
      const r = ratios(c)
      if (r.body < 0.35 && r.upper > 0.2 && r.lower > 0.2 && Math.abs(r.upper - r.lower) < 0.25) return 0.8
      if (r.body < 0.45 && r.upper > 0.15 && r.lower > 0.15) return 0.45
      return 0
    },
  },
]

export interface PatternMatch {
  pattern: CandlePattern
  score: number
}

/** Find the best matching pattern for a given candle. Returns null if no pattern scores > 0 */
export function matchPattern(c: PatternInput): PatternMatch | null {
  let best: PatternMatch | null = null
  for (const p of candlePatterns) {
    const s = p.score(c)
    if (s > 0 && (!best || s > best.score)) {
      best = { pattern: p, score: s }
    }
  }
  return best
}
