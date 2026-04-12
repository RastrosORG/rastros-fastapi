import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, CartesianGrid,
  Cell,
} from 'recharts'
import { Trophy, Medal, Star, Loader2 } from 'lucide-react'
import type { Variants } from 'framer-motion'
import { listarRanking } from '../api/pontuacaoApi'
import type { GrupoPontuacao, IntervaloDados } from '../api/pontuacaoApi'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

const coresGrupos = [
  '#c9a84c','#60a5fa','#34d399','#f472b6',
  '#a78bfa','#fb923c','#22d3ee','#e879f9',
  '#4ade80','#f87171','#facc15','#818cf8',
]

const COR_GOLD   = '#c9a84c'
const COR_SILVER = '#94a3b8'
const COR_BRONZE = '#b87333'

function corPosicao(i: number) {
  if (i === 0) return COR_GOLD
  if (i === 1) return COR_SILVER
  if (i === 2) return COR_BRONZE
  return '#334155'
}

const tooltipStyle = {
  backgroundColor: '#13131a',
  border: '1px solid rgba(201,168,76,0.2)',
  borderRadius: '8px',
  color: '#e8e6e0',
  fontFamily: 'monospace',
  fontSize: '12px',
}

// Achata { rotulo, dados } para o formato flat que o Recharts espera
function achatar(intervalos: IntervaloDados[]): Record<string, unknown>[] {
  return intervalos.map(({ rotulo, dados }) => ({ tempo: rotulo, ...dados }))
}

// Computa radarDados a partir do top 3 do ranking
function computarRadar(top3: GrupoPontuacao[], maxPontos: number) {
  const norm = (v: number, max: number) => max > 0 ? Math.round((v / max) * 10) : 0
  return [
    {
      categoria: 'Aprovadas',
      ...Object.fromEntries(top3.map(g => [g.nome, g.aprovadas])),
    },
    {
      categoria: 'Parciais',
      ...Object.fromEntries(top3.map(g => [g.nome, g.parciais])),
    },
    {
      categoria: 'Respostas',
      ...Object.fromEntries(top3.map(g => [g.nome, g.respostas])),
    },
    {
      categoria: 'Pontuação',
      ...Object.fromEntries(top3.map(g => [g.nome, norm(g.pontos, maxPontos)])),
    },
    {
      categoria: 'Eficiência',
      ...Object.fromEntries(
        top3.map(g => [g.nome, g.respostas > 0 ? Math.round((g.aprovadas / g.respostas) * 10) : 0])
      ),
    },
  ]
}

export default function Pontuacao() {
  const [ranking, setRanking] = useState<GrupoPontuacao[]>([])
  const [atividadeRaw, setAtividadeRaw] = useState<IntervaloDados[]>([])
  const [evolucaoRaw, setEvolucaoRaw] = useState<IntervaloDados[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [gruposSelecionados, setGruposSelecionados] = useState<string[]>([])

  useEffect(() => {
    listarRanking()
      .then(dados => {
        setRanking(dados.ranking)
        setAtividadeRaw(dados.atividade)
        setEvolucaoRaw(dados.evolucao)
        // Pré-seleciona os 3 primeiros no filtro de atividade
        setGruposSelecionados(dados.ranking.slice(0, 3).map(g => g.nome))
      })
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }, [])

  function toggleGrupo(nome: string) {
    setGruposSelecionados(prev =>
      prev.includes(nome)
        ? prev.length === 1 ? prev : prev.filter(g => g !== nome)
        : [...prev, nome]
    )
  }

  const top3     = ranking.slice(0, 3)
  const maxPontos = Math.max(ranking[0]?.pontos ?? 0, 1)

  const atividadeDados = useMemo(() => achatar(atividadeRaw), [atividadeRaw])
  const evolucaoDados  = useMemo(() => achatar(evolucaoRaw),  [evolucaoRaw])
  const radarDados     = useMemo(() => computarRadar(top3, maxPontos), [top3, maxPontos])
  const nomesTodosGrupos = useMemo(() => ranking.map(g => g.nome), [ranking])
  const larguraScroll    = Math.max(ranking.length * 80, 900)

  // Top 5 nomes para o gráfico de evolução
  const top5Nomes = ranking.slice(0, 5).map(g => g.nome)

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <Loader2 size={32} className="animate-spin text-primary/60" />
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="flex flex-col items-center gap-3 text-center">
          <Trophy size={32} className="text-muted-foreground/30" />
          <p className="font-mono text-sm text-muted-foreground tracking-widest uppercase">
            Erro ao carregar pontuação
          </p>
          <p className="font-mono text-xs text-muted-foreground/50">
            Verifique a conexão com o servidor
          </p>
        </div>
      </div>
    )
  }

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

          {/* PÓDIO */}
          {top3.length >= 3 && (
            <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
              className="bg-[#13131a] border border-primary/20 rounded-2xl overflow-hidden">
              <div className="px-7 py-5 border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-center gap-3">
                <Trophy size={18} className="text-primary" />
                <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Pódio</h2>
              </div>
              <div className="p-8 flex items-end justify-center gap-6">

                {/* 2º */}
                <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show"
                  className="flex flex-col items-center gap-3 flex-1 max-w-[200px]">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-400/30 to-slate-400/5 border border-slate-400/40 flex items-center justify-center">
                    <Medal size={24} className="text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{top3[1].nome}</p>
                    <p className="text-slate-400 font-mono text-lg font-bold">{top3[1].pontos} pts</p>
                    <p className="text-muted-foreground/50 font-mono text-xs">{top3[1].respostas} respostas</p>
                  </div>
                  <div className="w-full bg-slate-400/20 border border-slate-400/30 rounded-t-xl flex items-center justify-center py-6">
                    <span className="text-4xl font-bold font-mono text-slate-400/60">2</span>
                  </div>
                </motion.div>

                {/* 1º */}
                <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show"
                  className="flex flex-col items-center gap-3 flex-1 max-w-[220px]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/40 to-primary/5 border border-primary/50 flex items-center justify-center">
                    <Trophy size={28} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-primary font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{top3[0].nome}</p>
                    <p className="text-primary font-mono text-2xl font-bold">{top3[0].pontos} pts</p>
                    <p className="text-muted-foreground/50 font-mono text-xs">{top3[0].respostas} respostas</p>
                  </div>
                  <div className="w-full bg-primary/10 border border-primary/30 rounded-t-xl flex items-center justify-center py-10">
                    <span className="text-5xl font-bold font-mono text-primary/40">1</span>
                  </div>
                </motion.div>

                {/* 3º */}
                <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show"
                  className="flex flex-col items-center gap-3 flex-1 max-w-[200px]">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-700/30 to-amber-700/5 border border-amber-700/40 flex items-center justify-center">
                    <Star size={24} className="text-amber-700" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{top3[2].nome}</p>
                    <p className="text-amber-700 font-mono text-lg font-bold">{top3[2].pontos} pts</p>
                    <p className="text-muted-foreground/50 font-mono text-xs">{top3[2].respostas} respostas</p>
                  </div>
                  <div className="w-full bg-amber-700/10 border border-amber-700/30 rounded-t-xl flex items-center justify-center py-4">
                    <span className="text-4xl font-bold font-mono text-amber-700/40">3</span>
                  </div>
                </motion.div>

              </div>
            </motion.div>
          )}

          {/* PONTUAÇÃO POR GRUPO */}
          <motion.div variants={fadeUp} custom={5} initial="hidden" animate="show"
            className="bg-[#13131a] border border-border rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Pontuação por Grupo</p>
              {ranking.length > 10 && (
                <p className="text-xs font-mono text-muted-foreground/40">← arraste para ver todos →</p>
              )}
            </div>
            <div className="overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,168,76,0.3) transparent' }}>
              <div style={{ width: larguraScroll, height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ranking} barSize={40} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="nome" tick={{ fill: '#6b6875', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }}
                      axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="pontos" name="Pontos" radius={[6, 6, 0, 0]}>
                      {ranking.map((_, i) => (
                        <Cell key={i} fill={coresGrupos[i % coresGrupos.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              {ranking.map((g, i) => (
                <div key={g.nome} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: coresGrupos[i % coresGrupos.length] }} />
                  <span className="text-xs font-mono text-muted-foreground">{g.nome}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RESPOSTAS POR STATUS */}
          <motion.div variants={fadeUp} custom={6} initial="hidden" animate="show"
            className="bg-[#13131a] border border-border rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Respostas por Status</p>
              {ranking.length > 10 && (
                <p className="text-xs font-mono text-muted-foreground/40">← arraste para ver todos →</p>
              )}
            </div>
            <div className="overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,168,76,0.3) transparent' }}>
              <div style={{ width: larguraScroll, height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ranking} barSize={40} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="nome" tick={{ fill: '#6b6875', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }}
                      axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="aprovadas"  name="Aprovadas"  stackId="a" fill="#34d399" />
                    <Bar dataKey="parciais"   name="Parciais"   stackId="a" fill="#fb923c" />
                    <Bar dataKey="rejeitadas" name="Rejeitadas" stackId="a" fill="#f87171" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {[['Aprovadas','#34d399'],['Parciais','#fb923c'],['Rejeitadas','#f87171']].map(([nome,cor]) => (
                <div key={nome} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cor }} />
                  <span className="text-xs font-mono text-muted-foreground">{nome}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ATIVIDADE AO LONGO DO TEMPO */}
          {atividadeDados.length > 1 && (
            <motion.div variants={fadeUp} custom={7} initial="hidden" animate="show"
              className="bg-[#13131a] border border-border rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                    Atividade ao Longo do Tempo
                  </p>
                  <p className="text-xs font-mono text-muted-foreground/40 mt-1">
                    Respostas enviadas (acumulado por 10 minutos)
                  </p>
                </div>
                <p className="text-xs font-mono text-muted-foreground/40">Selecione os grupos para comparar</p>
              </div>

              {/* Filtro */}
              <div className="flex flex-wrap gap-2">
                {nomesTodosGrupos.map((nome, i) => {
                  const selecionado = gruposSelecionados.includes(nome)
                  const cor = coresGrupos[i % coresGrupos.length]
                  return (
                    <button key={nome} onClick={() => toggleGrupo(nome)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all duration-200"
                      style={{
                        borderColor: selecionado ? cor : 'rgba(255,255,255,0.1)',
                        backgroundColor: selecionado ? `${cor}20` : 'transparent',
                        color: selecionado ? cor : '#6b6875',
                      }}>
                      <div className="w-2 h-2 rounded-full transition-all"
                        style={{ backgroundColor: selecionado ? cor : '#6b6875' }} />
                      {nome}
                    </button>
                  )
                })}
              </div>

              {/* Gráfico */}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={atividadeDados} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="tempo" tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(value, name) => [`${value} respostas`, String(name)]} />
                  {nomesTodosGrupos.map((nome, i) =>
                    gruposSelecionados.includes(nome) ? (
                      <Line key={nome} type="monotone" dataKey={nome}
                        stroke={coresGrupos[i % coresGrupos.length]}
                        strokeWidth={2}
                        dot={{ fill: coresGrupos[i % coresGrupos.length], r: 4 }}
                        activeDot={{ r: 6 }}
                        animationDuration={400}
                      />
                    ) : null
                  )}
                </LineChart>
              </ResponsiveContainer>

              <div className="flex flex-wrap gap-4">
                {gruposSelecionados.map(nome => {
                  const i = nomesTodosGrupos.indexOf(nome)
                  return (
                    <div key={nome} className="flex items-center gap-1.5">
                      <div className="w-4 h-0.5 rounded-full"
                        style={{ backgroundColor: coresGrupos[i % coresGrupos.length] }} />
                      <span className="text-xs font-mono text-muted-foreground">{nome}</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* EVOLUÇÃO + RADAR lado a lado */}
          {(evolucaoDados.length > 1 || top3.length >= 3) && (
            <div className="grid grid-cols-2 gap-6">

              {evolucaoDados.length > 1 && (
                <motion.div variants={fadeUp} custom={8} initial="hidden" animate="show"
                  className="bg-[#13131a] border border-border rounded-2xl p-6 flex flex-col gap-4">
                  <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                    Evolução de Pontos — Top {top5Nomes.length}
                  </p>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={evolucaoDados}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="tempo" tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }}
                        axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }}
                        axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      {top5Nomes.map((nome, i) => (
                        <Line key={nome} type="monotone" dataKey={nome}
                          stroke={coresGrupos[i]} strokeWidth={2}
                          dot={{ fill: coresGrupos[i], r: 3 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3">
                    {top5Nomes.map((nome, i) => (
                      <div key={nome} className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: coresGrupos[i] }} />
                        <span className="text-xs font-mono text-muted-foreground">{nome}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {top3.length >= 3 && (
                <motion.div variants={fadeUp} custom={9} initial="hidden" animate="show"
                  className="bg-[#13131a] border border-border rounded-2xl p-6 flex flex-col gap-4">
                  <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Comparativo — Top 3</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={radarDados}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="categoria"
                        tick={{ fill: '#6b6875', fontSize: 10, fontFamily: 'monospace' }} />
                      <Radar name={top3[0].nome} dataKey={top3[0].nome} stroke={COR_GOLD}   fill={COR_GOLD}   fillOpacity={0.15} strokeWidth={2} />
                      <Radar name={top3[1].nome} dataKey={top3[1].nome} stroke={COR_SILVER} fill={COR_SILVER} fillOpacity={0.10} strokeWidth={2} />
                      <Radar name={top3[2].nome} dataKey={top3[2].nome} stroke={COR_BRONZE} fill={COR_BRONZE} fillOpacity={0.10} strokeWidth={2} />
                      <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 justify-center">
                    {([[top3[0].nome, COR_GOLD],[top3[1].nome, COR_SILVER],[top3[2].nome, COR_BRONZE]] as [string,string][]).map(([nome,cor]) => (
                      <div key={nome} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cor }} />
                        <span className="text-xs font-mono text-muted-foreground">{nome}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>
          )}

          {/* RANKING GERAL */}
          <motion.div variants={fadeUp} custom={10} initial="hidden" animate="show"
            className="bg-[#13131a] border border-primary/20 rounded-2xl overflow-hidden">
            <div className="px-7 py-5 border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-1">Classificação</p>
              <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Ranking Geral</h2>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {ranking.map((g, i) => {
                const cor    = corPosicao(i)
                const pct    = Math.round((g.pontos / maxPontos) * 100)
                return (
                  <motion.div key={g.grupo_id} variants={fadeUp} custom={i + 11} initial="hidden" animate="show"
                    className={`flex items-center gap-5 px-5 py-4 rounded-xl border transition-all
                               ${i === 0 ? 'border-primary/30 bg-primary/5' : 'border-border bg-card/20'}`}>
                    <span className="font-mono font-bold text-lg w-6 shrink-0 text-center" style={{ color: cor }}>
                      {i + 1}
                    </span>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                    <span className="font-semibold text-sm text-white w-24 shrink-0"
                      style={{ fontFamily: 'Syne, sans-serif' }}>{g.nome}</span>
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cor }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-24 text-right shrink-0">
                      {g.respostas} respostas
                    </span>
                    <span className="font-mono font-bold text-base w-20 text-right shrink-0" style={{ color: cor }}>
                      {g.pontos} pts
                    </span>
                  </motion.div>
                )
              })}

              {ranking.length === 0 && (
                <p className="text-center text-muted-foreground font-mono text-sm py-8">
                  Nenhum grupo com pontuação ainda.
                </p>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
