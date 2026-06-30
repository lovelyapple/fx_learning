/**
 * Glossary - FX & technical analysis terms reference.
 */

interface Term {
  term: string
  reading?: string   // yomigana
  en?: string        // English
  desc: string
}

interface Category {
  title: string
  emoji: string
  terms: Term[]
}

const categories: Category[] = [
  {
    title: 'ローソク足の基本',
    emoji: '🕯️',
    terms: [
      { term: 'ローソク足', reading: 'ろうそくあし', en: 'Candlestick', desc: '1本の棒グラフで始値・高値・安値・終値（OHLC）を表したもの。江戸時代の日本で米相場を分析するために考案された。' },
      { term: '陽線', reading: 'ようせん', en: 'Bullish candle', desc: '終値が始値より高い足（上昇）。日本では赤で表示することが多い。' },
      { term: '陰線', reading: 'いんせん', en: 'Bearish candle', desc: '終値が始値より低い足（下落）。日本では緑で表示することが多い。' },
      { term: '実体', reading: 'じったい', en: 'Body', desc: '始値と終値の間の四角い部分。実体が大きいほど価格の動きが大きかったことを示す。' },
      { term: '上ひげ', reading: 'うわひげ', en: 'Upper wick / Shadow', desc: '実体の上に伸びる細い線。その期間中の最高値を示す。' },
      { term: '下ひげ', reading: 'したひげ', en: 'Lower wick / Shadow', desc: '実体の下に伸びる細い線。その期間中の最安値を示す。' },
      { term: '始値', reading: 'はじめね', en: 'Open', desc: 'その時間足が始まった時点の価格。' },
      { term: '終値', reading: 'おわりね', en: 'Close', desc: 'その時間足が終了した時点の価格。' },
      { term: '高値', reading: 'たかね', en: 'High', desc: 'その時間足中の最も高かった価格。' },
      { term: '安値', reading: 'やすね', en: 'Low', desc: 'その時間足中の最も低かった価格。' },
      { term: '時間足', reading: 'じかんあし', en: 'Timeframe', desc: '1本のローソク足が表す時間。1分足・5分足・1時間足・日足など。短い時間足ほど細かい動きが見える。' },
    ],
  },
  {
    title: 'トレンド・相場の状態',
    emoji: '📈',
    terms: [
      { term: 'トレンド', en: 'Trend', desc: '相場の方向性。価格が一定の方向に継続して動く状態。' },
      { term: '上昇トレンド', reading: 'じょうしょうとれんど', en: 'Uptrend', desc: '高値と安値が切り上がっていく状態。「押し目買い」が基本戦略。' },
      { term: '下降トレンド', reading: 'かこうとれんど', en: 'Downtrend', desc: '高値と安値が切り下がっていく状態。「戻り売り」が基本戦略。' },
      { term: 'レンジ相場', reading: 'れんじそうば', en: 'Range / Sideways', desc: '上昇でも下降でもなく、一定の価格帯を行き来する状態。トレンドがない相場。' },
      { term: 'サポート', en: 'Support', desc: '価格が下落するときに止まりやすい価格帯（下値支持線）。過去に何度も安値を付けた水準。' },
      { term: 'レジスタンス', en: 'Resistance', desc: '価格が上昇するときに止まりやすい価格帯（上値抵抗線）。過去に何度も高値を付けた水準。' },
      { term: 'ブレイクアウト', en: 'Breakout', desc: 'サポートやレジスタンスを価格が突き破ること。強いトレンド発生のサインとなることが多い。' },
      { term: 'ロールリバーサル', en: 'Role Reversal', desc: 'サポートだった水準がブレイク後にレジスタンスに変わる（またはその逆）現象。' },
      { term: '押し目', reading: 'おしめ', en: 'Pullback', desc: '上昇トレンド中の一時的な価格下落。上昇継続前の「買い場」として注目される。' },
      { term: '戻り', reading: 'もどり', en: 'Rally / Bounce', desc: '下降トレンド中の一時的な価格上昇。下落継続前の「売り場」として注目される。' },
      { term: 'モメンタム', en: 'Momentum', desc: '価格変動の勢い・速度。モメンタムが強いほどトレンドが継続しやすい。' },
    ],
  },
  {
    title: 'テクニカル指標',
    emoji: '📊',
    terms: [
      { term: 'テクニカル分析', reading: 'てくにかるぶんせき', en: 'Technical Analysis', desc: '過去の価格や出来高のデータをもとにチャートを分析し、将来の価格動向を予測しようとする手法。' },
      { term: 'SMA（単純移動平均）', en: 'Simple Moving Average', desc: '一定期間の終値の平均値を繋いだ線。20日SMAなら過去20本の終値の平均。相場のトレンドや勢いを把握するのに使う。' },
      { term: 'EMA（指数移動平均）', en: 'Exponential Moving Average', desc: '直近の価格に重みをつけた移動平均線。SMAより最新の値動きに敏感に反応する。' },
      { term: 'ゴールデンクロス', en: 'Golden Cross', desc: '短期移動平均線が長期移動平均線を下から上に抜けること。上昇転換のサインとされる。' },
      { term: 'デッドクロス', en: 'Dead Cross', desc: '短期移動平均線が長期移動平均線を上から下に抜けること。下落転換のサインとされる。' },
      { term: 'ボリンジャーバンド', en: 'Bollinger Bands', desc: '移動平均線の上下に標準偏差を基にしたバンドを表示したもの。価格の変動範囲を把握でき、バンドの幅が広がると相場の変動率が高い。' },
      { term: 'RSI', en: 'Relative Strength Index', desc: '0〜100の範囲で相場の「買われすぎ・売られすぎ」を示す指標。70以上で買われすぎ、30以下で売られすぎとされることが多い。' },
      { term: 'MACD', en: 'Moving Average Convergence Divergence', desc: '2本のEMAの差を使ってトレンドの方向や転換を示す指標。シグナル線を上抜けると買い、下抜けると売りのサインとされる。' },
      { term: 'オシレーター系指標', reading: 'おしれーたーけいしひょう', en: 'Oscillator', desc: '相場の買われすぎ・売られすぎを判断する指標の総称（RSI、MACDなど）。レンジ相場で特に有効。' },
      { term: 'トレンド系指標', reading: 'とれんどけいしひょう', desc: '相場のトレンドの方向や強さを示す指標の総称（移動平均線など）。トレンド相場で特に有効。' },
    ],
  },
  {
    title: 'FX基本用語',
    emoji: '💱',
    terms: [
      { term: 'FX', en: 'Foreign Exchange', desc: '外国為替取引の略。異なる通貨を交換・売買することで利益を狙う取引。' },
      { term: '通貨ペア', reading: 'つうかぺあ', en: 'Currency Pair', desc: '取引する2つの通貨の組み合わせ。USD/JPY（ドル円）はアメリカドルと日本円のペア。' },
      { term: 'USD/JPY（ドル円）', en: 'Dollar-Yen', desc: '米ドルと日本円の通貨ペア。例えばレートが157.50の場合、1ドルが157円50銭を意味する。' },
      { term: 'レート', en: 'Rate / Price', desc: '現在の為替相場の値。リアルタイムで変動している。' },
      { term: 'ピップス', en: 'Pips', desc: '通貨の最小変動単位。USD/JPYの場合、0.01円（1銭）が1ピップス。' },
      { term: 'スプレッド', en: 'Spread', desc: '買値（ask）と売値（bid）の差。取引コストとも言える。スプレッドが小さいほど取引コストが低い。' },
      { term: 'ロング（買いポジション）', en: 'Long', desc: '価格が上昇することを期待して通貨を買う取引。価格が上がれば利益になる。' },
      { term: 'ショート（売りポジション）', en: 'Short', desc: '価格が下落することを期待して通貨を売る取引。価格が下がれば利益になる。' },
      { term: 'ストップロス', en: 'Stop Loss', desc: '損失を一定以内に抑えるために設定する自動決済ライン（損切りライン）。リスク管理の基本。' },
      { term: 'テイクプロフィット', en: 'Take Profit', desc: '利益確定のために設定する自動決済ライン（利食いライン）。' },
      { term: 'ボラティリティ', en: 'Volatility', desc: '価格の変動幅・変動の激しさ。ボラティリティが高い時は価格が大きく動きやすい。' },
      { term: '仮説', reading: 'かせつ', en: 'Hypothesis', desc: 'チャートを見て「この後こう動くだろう」と立てた予測。根拠（テクニカル的な理由）を明確にすることが重要。' },
    ],
  },
]

export function Glossary() {
  return (
    <div className="glossary-page">
      <div className="glossary-header">
        <h2>📖 FX用語集</h2>
        <p className="glossary-note">テクニカル分析・FX取引でよく使う用語をまとめています。</p>
      </div>
      <div className="glossary-categories">
        {categories.map(cat => (
          <div key={cat.title} className="glossary-category">
            <h3 className="glossary-cat-title">{cat.emoji} {cat.title}</h3>
            <div className="glossary-terms">
              {cat.terms.map(t => (
                <div key={t.term} className="glossary-term">
                  <div className="glossary-term-header">
                    <span className="glossary-term-name">{t.term}</span>
                    {t.reading && <span className="glossary-term-reading">（{t.reading}）</span>}
                    {t.en && <span className="glossary-term-en">{t.en}</span>}
                  </div>
                  <p className="glossary-term-desc">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
