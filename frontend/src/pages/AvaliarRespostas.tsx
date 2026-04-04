import { useState, useMemo, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Clock, CheckCircle, ChevronRight, Search } from 'lucide-react'
import type { Variants } from 'framer-motion'

import GrupoSeletor, { type GrupoResumo } from '../components/avaliar/GrupoSeletor'   // Seletor lateral de grupos
import RespostaCard, { type Resposta } from '../components/avaliar/RespostaCard'        // Card de cada resposta
import { categorias, statusConfig } from '../components/avaliar/RespostaCard'           // Configs compartilhadas

// ── Lazy — só carrega quando o modal é aberto ───────────────────
const ModalAvaliar = lazy(() => import('../components/avaliar/ModalAvaliar'))           // Modal de nova avaliação
const ModalVerAvaliada = lazy(() => import('../components/avaliar/ModalVerAvaliada'))   // Modal de revisão/correção

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

// ── Mock — substituído pelo authStore/backend depois ────────────
const mockRespostas: Resposta[] = [
  { id: 1, dossieId: 1, dossieNome: 'Jack Dawson', titulo: 'Contato com familiar identificado', descricao: 'Conseguimos localizar a irmã de Jack, Mary Dawson, residente em Southampton.', categoria: 'familia', arquivos: ['contato_mary.pdf'], dataEnvio: '01/04/2026 14:32', status: 'pendente' },
  { id: 2, dossieId: 1, dossieNome: 'Jack Dawson', titulo: 'Localização aproximada via câmera', descricao: 'Identificamos Jack em imagens de câmera no porto às 23h.', categoria: 'localizacao', link: 'https://maps.google.com', arquivos: ['camera_porto.mp4'], dataEnvio: '01/04/2026 15:10', status: 'pendente' },
  { id: 3, dossieId: 2, dossieNome: 'Chuck Noland', titulo: 'Manifesto do voo MH370', descricao: 'Manifesto completo do voo em que Chuck embarcou.', categoria: 'dia_desaparecimento', arquivos: ['manifesto.pdf'], dataEnvio: '01/04/2026 13:00', status: 'aprovada', avaliacao: { comentario: 'Excelente fonte primária.', pontos: 25 } },
  { id: 4, dossieId: 1, dossieNome: 'Jack Dawson', titulo: 'Registro em hotel próximo ao porto', descricao: 'Registro de hospedagem em nome de J. Dawson.', categoria: 'info_basicas', arquivos: ['registro.pdf'], dataEnvio: '01/04/2026 16:45', status: 'rejeitada', avaliacao: { comentario: 'Período não corresponde ao desaparecimento.', pontos: 0 } },
]

const mockGrupos: Record<string, { nome: string; respostas: Resposta[] }> = {
  'grupo_01': { nome: 'Grupo 01', respostas: mockRespostas },
  'grupo_02': { nome: 'Grupo 02', respostas: [mockRespostas[2]] },
  'grupo_03': { nome: 'Grupo 03', respostas: [] },
}

type AbaView = 'pendentes' | 'avaliadas' | 'favoritas'

export default function AvaliarRespostas() {
  const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(null)
  const [aba, setAba] = useState<AbaView>('pendentes')
  const [busca, setBusca] = useState('')
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set())
  const [modalAvaliar, setModalAvaliar] = useState<Resposta | null>(null)
  const [modalVer, setModalVer] = useState<Resposta | null>(null)
  const [respostas, setRespostas] = useState<Record<string, Resposta[]>>(
    Object.fromEntries(Object.entries(mockGrupos).map(([id, g]) => [id, g.respostas]))
  )

  // ── Resumo dos grupos para o seletor ─────────────────────────
  const gruposResumo: GrupoResumo[] = useMemo(() =>
    Object.entries(mockGrupos).map(([id, g]) => ({
      id,
      nome: g.nome,
      pendentes: (respostas[id] ?? []).filter(r => r.status === 'pendente').length,
      total: (respostas[id] ?? []).length,
    })),
    [respostas]
  )

  // ── Respostas do grupo selecionado filtradas ──────────────────
  const respostasFiltradas = useMemo(() => {
    if (!grupoSelecionado) return []
    const lista = respostas[grupoSelecionado] ?? []
    return lista
      .filter(r => {
        if (aba === 'pendentes') return r.status === 'pendente'
        if (aba === 'avaliadas') return r.status !== 'pendente'
        if (aba === 'favoritas') return favoritos.has(r.id)
        return true
      })
      .filter(r => busca.trim() === '' || r.titulo.toLowerCase().includes(busca.toLowerCase()))
  }, [grupoSelecionado, aba, respostas, favoritos, busca])

  // ── Favoritas globais (todos os grupos) ───────────────────────
  const todasFavoritas = useMemo(() => {
    if (aba !== 'favoritas') return []
    return Object.values(respostas).flat().filter(r => favoritos.has(r.id))
      .filter(r => busca.trim() === '' || r.titulo.toLowerCase().includes(busca.toLowerCase()))
  }, [aba, respostas, favoritos, busca])

  function toggleFavorito(e: React.MouseEvent, id: number) {
    e.stopPropagation()
    setFavoritos(prev => {
      const novo = new Set(prev)
      novo.has(id) ? novo.delete(id) : novo.add(id)
      return novo
    })
  }

  function avaliar(grupoId: string, respostaId: number, resultado: {
    tipo: 'aprovada' | 'aprovada_parcial' | 'rejeitada'
    comentario: string
    categoriaNova?: string
  }) {
    const pontos = resultado.tipo === 'rejeitada' ? 0
      : resultado.tipo === 'aprovada_parcial'
        ? categorias.find(c => c.id === resultado.categoriaNova)?.pontos ?? 0
        : categorias.find(c => c.id === respostas[grupoId]?.find(r => r.id === respostaId)?.categoria)?.pontos ?? 0

    setRespostas(prev => ({
      ...prev,
      [grupoId]: (prev[grupoId] ?? []).map(r => r.id === respostaId ? {
        ...r,
        status: resultado.tipo,
        avaliacao: {
          comentario: resultado.comentario,
          categoriaOriginal: resultado.categoriaNova ? r.categoria : undefined,
          categoriaNova: resultado.categoriaNova,
          pontos,
        }
      } : r)
    }))
  }

  const totalPendentesGlobal = Object.values(respostas).flat().filter(r => r.status === 'pendente').length

  return (
    <div className="relative min-h-full" style={{
      backgroundColor: '#0d0d0f',
      backgroundImage: `
        linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }}>
      <div className="flex h-screen overflow-hidden">

        {/* ── Sidebar de grupos ─────────────────────────────────── */}
        <div className="w-72 shrink-0 border-r border-border flex flex-col bg-card/30 overflow-hidden">
          <div className="p-4 border-b border-border">
            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-1">Avaliação</p>
            <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>
              Meus Grupos
            </h1>
            {totalPendentesGlobal > 0 && (
              <p className="text-xs font-mono text-amber-400 mt-1">
                {totalPendentesGlobal} resposta{totalPendentesGlobal !== 1 ? 's' : ''} pendente{totalPendentesGlobal !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <GrupoSeletor
              grupos={gruposResumo}
              grupoSelecionado={grupoSelecionado}
              onSelecionar={id => { setGrupoSelecionado(id); setAba('pendentes'); setBusca('') }}
            />
          </div>
        </div>

        {/* ── Área principal ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Estado inicial — nenhum grupo selecionado */}
          {!grupoSelecionado && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <ChevronRight size={32} className="opacity-20 -rotate-180" />
              <p className="font-mono text-sm tracking-widest uppercase">Selecione um grupo</p>
            </div>
          )}

          {grupoSelecionado && (
            <>
              {/* Header da área principal */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {mockGrupos[grupoSelecionado]?.nome}
                  </h2>
                  <p className="text-xs font-mono text-muted-foreground">
                    {respostas[grupoSelecionado]?.filter(r => r.status === 'pendente').length} pendente(s) ·{' '}
                    {respostas[grupoSelecionado]?.length} total
                  </p>
                </div>

                {/* Busca */}
                <div className="flex items-center gap-2 bg-input border border-border rounded-lg px-3 py-1.5">
                  <Search size={14} className="text-muted-foreground" />
                  <input type="text" placeholder="Buscar resposta..."
                    value={busca} onChange={e => setBusca(e.target.value)}
                    className="bg-transparent text-sm font-mono text-foreground
                               placeholder:text-muted-foreground/50 focus:outline-none w-44" />
                </div>
              </div>

              {/* Abas */}
              <div className="px-6 pt-4 pb-0 flex gap-2 border-b border-border shrink-0">
                {([
                  { key: 'pendentes', label: 'Pendentes', icon: Clock },
                  { key: 'avaliadas', label: 'Avaliadas', icon: CheckCircle },
                  { key: 'favoritas', label: 'Favoritas', icon: Star },
                ] as const).map(a => (
                  <button key={a.key} onClick={() => setAba(a.key)}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 font-mono text-xs
                               tracking-widest transition-all uppercase
                               ${aba === a.key
                                 ? 'border-primary text-primary'
                                 : 'border-transparent text-muted-foreground hover:text-foreground'
                               }`}>
                    <a.icon size={13} />
                    {a.label}
                    {a.key === 'pendentes' && respostas[grupoSelecionado]?.filter(r => r.status === 'pendente').length > 0 && (
                      <span className="ml-1 text-xs font-mono px-1.5 py-0.5 rounded-full
                                       bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {respostas[grupoSelecionado].filter(r => r.status === 'pendente').length}
                      </span>
                    )}
                    {a.key === 'favoritas' && favoritos.size > 0 && (
                      <span className="ml-1 text-xs font-mono px-1.5 py-0.5 rounded-full
                                       bg-primary/10 text-primary border border-primary/20">
                        {aba === 'favoritas' ? todasFavoritas.length : favoritos.size}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Lista de respostas */}
              <div className="flex-1 overflow-y-auto p-6">

                {/* Favoritas — agrupadas por dossiê de todos os grupos */}
                {aba === 'favoritas' && (
                  todasFavoritas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                      <Star size={32} className="opacity-20" />
                      <p className="font-mono text-sm tracking-widest uppercase">Nenhuma resposta favoritada</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {/* Agrupa por grupo */}
                      {Object.entries(mockGrupos).map(([gid, g]) => {
                        const favs = todasFavoritas.filter(r =>
                          (respostas[gid] ?? []).some(rg => rg.id === r.id)
                        )
                        if (favs.length === 0) return null
                        return (
                          <div key={gid} className="flex flex-col gap-3">
                            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase
                                          flex items-center gap-2">
                              {g.nome}
                            </p>
                            {favs.map((r, i) => (
                              <motion.div key={r.id} variants={fadeUp} custom={i} initial="hidden" animate="show">
                                <RespostaCard
                                  resposta={r}
                                  favoritada={favoritos.has(r.id)}
                                  onAbrir={() => r.status === 'pendente'
                                    ? setModalAvaliar(r)
                                    : setModalVer(r)
                                  }
                                  onToggleFavorito={e => toggleFavorito(e, r.id)}
                                />
                              </motion.div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )
                )}

                {/* Pendentes e Avaliadas — agrupadas por dossiê */}
                {aba !== 'favoritas' && (() => {
                  const porDossie = respostasFiltradas.reduce<Record<string, { nome: string; lista: Resposta[] }>>((acc, r) => {
                    if (!acc[r.dossieId]) acc[r.dossieId] = { nome: r.dossieNome, lista: [] }
                    acc[r.dossieId].lista.push(r)
                    return acc
                  }, {})

                  return Object.keys(porDossie).length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                      <CheckCircle size={32} className="opacity-20" />
                      <p className="font-mono text-sm tracking-widest uppercase">
                        {aba === 'pendentes' ? 'Nenhuma resposta pendente' : 'Nenhuma resposta avaliada'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-8">
                      {Object.entries(porDossie).map(([did, { nome, lista }], di) => (
                        <motion.div key={did} variants={fadeUp} custom={di} initial="hidden" animate="show"
                          className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-primary/60">
                              #{String(did).padStart(2, '0')}
                            </span>
                            <h3 className="text-white font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                              {nome}
                            </h3>
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs font-mono text-muted-foreground">
                              {lista.length} resposta{lista.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {lista.map((r, i) => (
                              <motion.div key={r.id} variants={fadeUp} custom={i} initial="hidden" animate="show">
                                <RespostaCard
                                  resposta={r}
                                  favoritada={favoritos.has(r.id)}
                                  onAbrir={() => r.status === 'pendente'
                                    ? setModalAvaliar(r)
                                    : setModalVer(r)
                                  }
                                  onToggleFavorito={e => toggleFavorito(e, r.id)}
                                />
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modais lazy ───────────────────────────────────────── */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {modalAvaliar && grupoSelecionado && (
            <ModalAvaliar
              resposta={modalAvaliar}
              onFechar={() => setModalAvaliar(null)}
              onAvaliar={(id, resultado) => {
                avaliar(grupoSelecionado, id, resultado)
                setModalAvaliar(null)
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {modalVer && grupoSelecionado && (
            <ModalVerAvaliada
              resposta={modalVer}
              onFechar={() => setModalVer(null)}
              onCorrigir={(id, resultado) => {
                avaliar(grupoSelecionado, id, resultado)
                setModalVer(null)
              }}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  )
}