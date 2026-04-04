import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, CartesianGrid,
  Cell,
} from 'recharts'
import { Trophy, Medal, Star } from 'lucide-react'
import type { Variants } from 'framer-motion'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

const grupos = [
  { nome: 'Grupo Alpha', pontos: 340, respostas: 12, aprovadas: 9,  rejeitadas: 2, parciais: 1 },
  { nome: 'Grupo Bravo', pontos: 290, respostas: 10, aprovadas: 7,  rejeitadas: 1, parciais: 2 },
  { nome: 'Grupo Delta', pontos: 210, respostas: 9,  aprovadas: 6,  rejeitadas: 2, parciais: 1 },
  { nome: 'Grupo Echo',  pontos: 180, respostas: 8,  aprovadas: 5,  rejeitadas: 2, parciais: 1 },
  { nome: 'Grupo Foxt',  pontos: 155, respostas: 7,  aprovadas: 4,  rejeitadas: 2, parciais: 1 },
  { nome: 'Grupo Golf',  pontos: 120, respostas: 6,  aprovadas: 3,  rejeitadas: 2, parciais: 1 },
  { nome: 'Grupo Hotel', pontos: 95,  respostas: 5,  aprovadas: 3,  rejeitadas: 1, parciais: 1 },
  { nome: 'Grupo India', pontos: 60,  respostas: 4,  aprovadas: 2,  rejeitadas: 1, parciais: 1 },
]

const rankingOrdenado = [...grupos].sort((a, b) => b.pontos - a.pontos)

// Dados pra linha do tempo (mock de evolução)
const evolucao = [
  { rodada: 'R1', Alpha: 80,  Bravo: 60,  Delta: 50  },
  { rodada: 'R2', Alpha: 140, Bravo: 120, Delta: 90  },
  { rodada: 'R3', Alpha: 200, Bravo: 175, Delta: 130 },
  { rodada: 'R4', Alpha: 270, Bravo: 230, Delta: 170 },
  { rodada: 'R5', Alpha: 340, Bravo: 290, Delta: 210 },
]

// Dados radar pro top 3
const radarDados = [
  { categoria: 'Aprovadas',  Alpha: 9, Bravo: 7, Delta: 6 },
  { categoria: 'Parciais',   Alpha: 1, Bravo: 2, Delta: 1 },
  { categoria: 'Respostas',  Alpha: 12, Bravo: 10, Delta: 9 },
  { categoria: 'Pontuação',  Alpha: 10, Bravo: 8, Delta: 6 },
  { categoria: 'Eficiência', Alpha: 9, Bravo: 7, Delta: 7 },
]

const COR_GOLD   = '#c9a84c'
const COR_SILVER = '#94a3b8'
const COR_BRONZE = '#b87333'
const COR_REST   = '#334155'

function corPosicao(i: number) {
  if (i === 0) return COR_GOLD
  if (i === 1) return COR_SILVER
  if (i === 2) return COR_BRONZE
  return COR_REST
}

const tooltipStyle = {
  backgroundColor: '#13131a',
  border: '1px solid rgba(201,168,76,0.2)',
  borderRadius: '8px',
  color: '#e8e6e0',
  fontFamily: 'monospace',
  fontSize: '12px',
}

export default function Pontuacao() {
  const top3 = rankingOrdenado.slice(0, 3)

  return (
    <div className="relative flex flex-col min-h-full">

      {/* Fundo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 right-0 h-[30%]">
          <div className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url('/bg-operacao.jpg')` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#0d0d0f]" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[70%]" style={{
          backgroundColor: '#0d0d0f',
          backgroundImage: `linear-gradient(rgba(201,168,76,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.04) 1px,transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Cronômetro */}
      <div className="relative z-10 w-full flex justify-center py-4 border-b border-primary/20 bg-black/30 backdrop-blur-sm">
        <span className="font-mono text-2xl font-bold text-foreground tracking-[0.3em]">00:00:00</span>
      </div>

      <div className="relative z-10 flex flex-col items-center px-8 py-12 gap-10 w-full">

        {/* Título */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="flex flex-col items-center gap-3">
          <p className="text-muted-foreground text-xs font-mono tracking-widest uppercase">Classificação</p>
          <h1 className="text-4xl font-bold text-white tracking-widest uppercase"
            style={{ fontFamily: 'Syne, sans-serif' }}>Pontuação</h1>
          <div className="w-16 h-px bg-primary/60" />
        </motion.div>

        <div className="w-full max-w-6xl flex flex-col gap-8">

          {/* ── TOP 3 PÓDIO ── */}
          <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
            className="bg-[#13131a] border border-primary/20 rounded-2xl overflow-hidden">

            <div className="px-7 py-5 border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-center gap-3">
              <Trophy size={18} className="text-primary" />
              <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Pódio</h2>
            </div>

            <div className="p-8 flex items-end justify-center gap-6">

              {/* 2º lugar */}
              <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show"
                className="flex flex-col items-center gap-3 flex-1 max-w-[200px]">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-400/30 to-slate-400/5 
                                border border-slate-400/40 flex items-center justify-center">
                  <Medal size={24} className="text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {top3[1].nome}
                  </p>
                  <p className="text-slate-400 font-mono text-lg font-bold">{top3[1].pontos} pts</p>
                  <p className="text-muted-foreground/50 font-mono text-xs">{top3[1].respostas} respostas</p>
                </div>
                <div className="w-full bg-slate-400/20 border border-slate-400/30 rounded-t-xl flex items-center justify-center py-6">
                  <span className="text-4xl font-bold font-mono text-slate-400/60">2</span>
                </div>
              </motion.div>

              {/* 1º lugar */}
              <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show"
                className="flex flex-col items-center gap-3 flex-1 max-w-[220px]">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/40 to-primary/5 
                                border border-primary/50 flex items-center justify-center">
                  <Trophy size={28} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-primary font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {top3[0].nome}
                  </p>
                  <p className="text-primary font-mono text-2xl font-bold">{top3[0].pontos} pts</p>
                  <p className="text-muted-foreground/50 font-mono text-xs">{top3[0].respostas} respostas</p>
                </div>
                <div className="w-full bg-primary/10 border border-primary/30 rounded-t-xl flex items-center justify-center py-10">
                  <span className="text-5xl font-bold font-mono text-primary/40">1</span>
                </div>
              </motion.div>

              {/* 3º lugar */}
              <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show"
                className="flex flex-col items-center gap-3 flex-1 max-w-[200px]">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-700/30 to-amber-700/5 
                                border border-amber-700/40 flex items-center justify-center">
                  <Star size={24} className="text-amber-700" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {top3[2].nome}
                  </p>
                  <p className="text-amber-700 font-mono text-lg font-bold">{top3[2].pontos} pts</p>
                  <p className="text-muted-foreground/50 font-mono text-xs">{top3[2].respostas} respostas</p>
                </div>
                <div className="w-full bg-amber-700/10 border border-amber-700/30 rounded-t-xl flex items-center justify-center py-4">
                  <span className="text-4xl font-bold font-mono text-amber-700/40">3</span>
                </div>
              </motion.div>

            </div>
          </motion.div>

          {/* ── GRÁFICOS ── */}
          <div className="grid grid-cols-2 gap-6">

            {/* Barras — pontuação geral */}
            <motion.div variants={fadeUp} custom={5} initial="hidden" animate="show"
              className="bg-[#13131a] border border-border rounded-2xl p-6 flex flex-col gap-4">
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Pontuação por Grupo
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rankingOrdenado} barSize={28}>
                  <XAxis dataKey="nome" tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }}
                    tickFormatter={(v) => v.split(' ')[1]} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(201,168,76,0.05)' }} />
                  <Bar dataKey="pontos" name="Pontos" radius={[6, 6, 0, 0]}>
                    {rankingOrdenado.map((_, i) => (
                      <Cell key={i} fill={corPosicao(i)} fillOpacity={i < 3 ? 1 : 0.5} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Linha — evolução top 3 */}
            <motion.div variants={fadeUp} custom={6} initial="hidden" animate="show"
              className="bg-[#13131a] border border-border rounded-2xl p-6 flex flex-col gap-4">
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Evolução — Top 3
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={evolucao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="rodada" tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="Alpha" stroke={COR_GOLD}   strokeWidth={2} dot={{ fill: COR_GOLD,   r: 3 }} />
                  <Line type="monotone" dataKey="Bravo" stroke={COR_SILVER} strokeWidth={2} dot={{ fill: COR_SILVER, r: 3 }} />
                  <Line type="monotone" dataKey="Delta" stroke={COR_BRONZE} strokeWidth={2} dot={{ fill: COR_BRONZE, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 justify-center">
                {[['Alpha', COR_GOLD], ['Bravo', COR_SILVER], ['Delta', COR_BRONZE]].map(([nome, cor]) => (
                  <div key={nome} className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: cor }} />
                    <span className="text-xs font-mono text-muted-foreground">{nome}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Radar — comparativo top 3 */}
            <motion.div variants={fadeUp} custom={7} initial="hidden" animate="show"
              className="bg-[#13131a] border border-border rounded-2xl p-6 flex flex-col gap-4">
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Comparativo Top 3
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarDados}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="categoria"
                    tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }} />
                  <Radar name="Alpha" dataKey="Alpha" stroke={COR_GOLD}   fill={COR_GOLD}   fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="Bravo" dataKey="Bravo" stroke={COR_SILVER} fill={COR_SILVER} fillOpacity={0.10} strokeWidth={2} />
                  <Radar name="Delta" dataKey="Delta" stroke={COR_BRONZE} fill={COR_BRONZE} fillOpacity={0.10} strokeWidth={2} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 justify-center">
                {[['Alpha', COR_GOLD], ['Bravo', COR_SILVER], ['Delta', COR_BRONZE]].map(([nome, cor]) => (
                  <div key={nome} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cor }} />
                    <span className="text-xs font-mono text-muted-foreground">{nome}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Barras empilhadas — respostas por status */}
            <motion.div variants={fadeUp} custom={8} initial="hidden" animate="show"
              className="bg-[#13131a] border border-border rounded-2xl p-6 flex flex-col gap-4">
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Respostas por Status
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={rankingOrdenado} barSize={24}>
                  <XAxis dataKey="nome" tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }}
                    tickFormatter={(v) => v.split(' ')[1]} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(201,168,76,0.05)' }} />
                  <Bar dataKey="aprovadas" name="Aprovadas" stackId="a" fill="#34d399" radius={[0,0,0,0]} />
                  <Bar dataKey="parciais"  name="Parciais"  stackId="a" fill="#fb923c" />
                  <Bar dataKey="rejeitadas" name="Rejeitadas" stackId="a" fill="#f87171" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 justify-center">
                {[['Aprovadas','#34d399'],['Parciais','#fb923c'],['Rejeitadas','#f87171']].map(([nome,cor]) => (
                  <div key={nome} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cor }} />
                    <span className="text-xs font-mono text-muted-foreground">{nome}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── RANKING GERAL ── */}
          <motion.div variants={fadeUp} custom={9} initial="hidden" animate="show"
            className="bg-[#13131a] border border-primary/20 rounded-2xl overflow-hidden">

            <div className="px-7 py-5 border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-1">Classificação</p>
              <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
                Ranking Geral
              </h2>
            </div>

            <div className="p-4 flex flex-col gap-2">
              {rankingOrdenado.map((g, i) => {
                const cor = corPosicao(i)
                const maxPts = rankingOrdenado[0].pontos
                const pct = Math.round((g.pontos / maxPts) * 100)

                return (
                  <motion.div key={g.nome} variants={fadeUp} custom={i + 10} initial="hidden" animate="show"
                    className={`flex items-center gap-5 px-5 py-4 rounded-xl border transition-all
                               ${i === 0 ? 'border-primary/30 bg-primary/5' : 'border-border bg-card/20'}`}>

                    {/* Posição */}
                    <span className="font-mono font-bold text-lg w-6 shrink-0 text-center"
                      style={{ color: cor }}>
                      {i + 1}
                    </span>

                    {/* Nome */}
                    <span className="font-semibold text-sm text-white flex-1"
                      style={{ fontFamily: 'Syne, sans-serif' }}>
                      {g.nome}
                    </span>

                    {/* Barra */}
                    <div className="flex-[2] h-1.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cor }}
                      />
                    </div>

                    {/* Respostas */}
                    <span className="text-xs font-mono text-muted-foreground w-20 text-right shrink-0">
                      {g.respostas} respostas
                    </span>

                    {/* Pontos */}
                    <span className="font-mono font-bold text-base w-20 text-right shrink-0"
                      style={{ color: cor }}>
                      {g.pontos} pts
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}