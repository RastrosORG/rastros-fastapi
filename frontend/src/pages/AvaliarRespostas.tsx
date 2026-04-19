import { useState, useMemo, lazy, Suspense, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Clock, CheckCircle, ChevronRight, Search } from 'lucide-react'
import type { Variants } from 'framer-motion'

import GrupoSeletor from '../components/avaliar/GrupoSeletor'
import type { GrupoResumo } from '../components/avaliar/GrupoSeletor'
import RespostaCard from '../components/avaliar/RespostaCard'
import type { Resposta } from '../components/avaliar/RespostaCard'

import {
  listarGruposDoAvaliador,
  listarRespostasGrupo as listarRespostasGrupoAPI,
  avaliarResposta as avaliarRespostaAPI,
} from '../api/respostasApi'
import type { RespostaAPI } from '../api/respostasApi'

const ModalAvaliar = lazy(() => import('../components/avaliar/ModalAvaliar'))
const ModalVerAvaliada = lazy(() => import('../components/avaliar/ModalVerAvaliada'))

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function mapRespostaAPI(r: RespostaAPI): Resposta {
  return {
    id: r.id,
    dossieId: r.dossie_id,
    dossieNome: r.dossie_nome,
    titulo: r.titulo,
    descricao: r.descricao,
    categoria: r.categoria,
    link: r.link ?? undefined,
    arquivos: r.arquivos.map((a) => ({ id: a.id, nome: a.nome_arquivo, url: a.url_s3 })),
    dataEnvio: formatarData(r.criado_em),
    status: r.status,
    avaliacao: r.avaliacao
      ? {
          comentario: r.avaliacao.comentario,
          categoriaOriginal: r.avaliacao.categoria_original ?? undefined,
          categoriaNova: r.avaliacao.categoria_nova ?? undefined,
          pontos: r.avaliacao.pontos,
        }
      : undefined,
  }
}

type AbaView = 'pendentes' | 'avaliadas' | 'favoritas'

export default function AvaliarRespostas() {
  const [grupos, setGrupos] = useState<GrupoResumo[]>([])
  const [carregandoGrupos, setCarregandoGrupos] = useState(true)
  const [carregandoRespostas, setCarregandoRespostas] = useState(false)

  const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(null)
  const [aba, setAba] = useState<AbaView>('pendentes')
  const [busca, setBusca] = useState('')
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set())
  const [modalAvaliar, setModalAvaliar] = useState<Resposta | null>(null)
  const [modalVer, setModalVer] = useState<Resposta | null>(null)
  const [respostas, setRespostas] = useState<Record<string, Resposta[]>>({})

  // ── Carrega grupos na montagem ────────────────────────────────
  useEffect(() => {
    function mapearGrupos(dados: Awaited<ReturnType<typeof listarGruposDoAvaliador>>) {
      return dados.map((g) => ({
        id: String(g.grupo_id),
        nome: g.grupo_nome,
        pendentes: g.pendentes,
        total: g.total,
      }))
    }

    async function carregar() {
      try {
        const dados = await listarGruposDoAvaliador()
        setGrupos(mapearGrupos(dados))
      } finally {
        setCarregandoGrupos(false)
      }
    }

    async function atualizarSilencioso() {
      try {
        const dados = await listarGruposDoAvaliador()
        setGrupos(mapearGrupos(dados))
      } catch { /* silencia erros de rede no poll silencioso */ }
    }

    carregar()
    const intervalo = setInterval(atualizarSilencioso, 20000)
    return () => clearInterval(intervalo)
  }, [])

  // ── Carrega respostas ao selecionar grupo ─────────────────────
  const carregarRespostasGrupo = useCallback(async (grupoId: string) => {
    if (respostas[grupoId]) return // já carregado — o poll cuida das atualizações
    setCarregandoRespostas(true)
    try {
      const dados = await listarRespostasGrupoAPI(parseInt(grupoId))
      setRespostas((prev) => ({ ...prev, [grupoId]: dados.map(mapRespostaAPI) }))
    } finally {
      setCarregandoRespostas(false)
    }
  }, [respostas])

  // ── Poll do grupo selecionado — detecta novas submissões ──────
  useEffect(() => {
    if (!grupoSelecionado) return
    const intervalo = setInterval(async () => {
      try {
        const dados = await listarRespostasGrupoAPI(parseInt(grupoSelecionado))
        setRespostas((prev) => ({ ...prev, [grupoSelecionado]: dados.map(mapRespostaAPI) }))
      } catch { /* silencia erros de rede no poll silencioso */ }
    }, 20000)
    return () => clearInterval(intervalo)
  }, [grupoSelecionado])

  function selecionarGrupo(id: string) {
    setGrupoSelecionado(id)
    setAba('pendentes')
    setBusca('')
    carregarRespostasGrupo(id)
  }

  // ── Grupos com contagens atualizadas pelo estado local ────────
  const gruposResumo: GrupoResumo[] = useMemo(
    () =>
      grupos.map((g) => ({
        ...g,
        pendentes: respostas[g.id]
          ? respostas[g.id].filter((r) => r.status === 'pendente').length
          : g.pendentes,
        total: respostas[g.id]?.length ?? g.total,
      })),
    [grupos, respostas]
  )

  // ── Respostas filtradas do grupo selecionado ──────────────────
  const respostasFiltradas = useMemo(() => {
    if (!grupoSelecionado) return []
    const lista = respostas[grupoSelecionado] ?? []
    return lista
      .filter((r) => {
        if (aba === 'pendentes') return r.status === 'pendente'
        if (aba === 'avaliadas') return r.status !== 'pendente'
        if (aba === 'favoritas') return favoritos.has(r.id)
        return true
      })
      .filter(
        (r) => busca.trim() === '' || r.titulo.toLowerCase().includes(busca.toLowerCase())
      )
  }, [grupoSelecionado, aba, respostas, favoritos, busca])

  // ── Favoritas globais (todos os grupos carregados) ────────────
  const todasFavoritas = useMemo(() => {
    if (aba !== 'favoritas') return []
    return Object.values(respostas)
      .flat()
      .filter((r) => favoritos.has(r.id))
      .filter(
        (r) => busca.trim() === '' || r.titulo.toLowerCase().includes(busca.toLowerCase())
      )
  }, [aba, respostas, favoritos, busca])

  const totalPendentesGlobal = gruposResumo.reduce((acc, g) => acc + g.pendentes, 0)

  // ── Favorito toggle ───────────────────────────────────────────
  function toggleFavorito(e: React.MouseEvent, id: number) {
    e.stopPropagation()
    setFavoritos((prev) => {
      const novo = new Set(prev)
      novo.has(id) ? novo.delete(id) : novo.add(id)
      return novo
    })
  }

  // ── Avaliar / corrigir ────────────────────────────────────────
  async function avaliar(
    grupoId: string,
    respostaId: number,
    resultado: {
      tipo: 'aprovada' | 'aprovada_parcial' | 'rejeitada'
      comentario: string
      categoriaNova?: string
    }
  ) {
    try {
      const atualizada = await avaliarRespostaAPI(respostaId, {
        tipo: resultado.tipo,
        comentario: resultado.comentario,
        categoria_nova: resultado.categoriaNova,
      })
      setRespostas((prev) => ({
        ...prev,
        [grupoId]: (prev[grupoId] ?? []).map((r) =>
          r.id === respostaId ? mapRespostaAPI(atualizada) : r
        ),
      }))
    } catch {
      // mantém estado anterior em caso de erro
    }
  }

  // ── Nome do grupo selecionado ─────────────────────────────────
  const nomeGrupoSelecionado = grupos.find((g) => g.id === grupoSelecionado)?.nome ?? ''

  return (
    <div className="h-full" style={{
      backgroundColor: '#0d0d0f',
      backgroundImage: `
        linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }}>
      <div className="flex h-full overflow-hidden">

        {/* ── Sidebar de grupos ─────────────────────────────────── */}
        <div className="w-72 shrink-0 border-r border-border flex flex-col bg-card/30 overflow-hidden">
          <div className="p-4 border-b border-border shrink-0">
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
            {carregandoGrupos ? (
              <p className="text-xs font-mono text-muted-foreground/50 tracking-widest text-center py-8 animate-pulse">
                Carregando...
              </p>
            ) : grupos.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground/50 tracking-widest text-center py-8">
                Nenhum grupo encontrado
              </p>
            ) : (
              <GrupoSeletor
                grupos={gruposResumo}
                grupoSelecionado={grupoSelecionado}
                onSelecionar={selecionarGrupo}
              />
            )}
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
              {/* Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {nomeGrupoSelecionado}
                  </h2>
                  <p className="text-xs font-mono text-muted-foreground">
                    {(respostas[grupoSelecionado] ?? []).filter((r) => r.status === 'pendente').length} pendente(s) ·{' '}
                    {(respostas[grupoSelecionado] ?? []).length} total
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-input border border-border rounded-lg px-3 py-1.5">
                  <Search size={14} className="text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar resposta..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="bg-transparent text-sm font-mono text-foreground
                               placeholder:text-muted-foreground/50 focus:outline-none w-44"
                  />
                </div>
              </div>

              {/* Abas */}
              <div className="px-6 pt-4 pb-0 flex gap-2 border-b border-border shrink-0">
                {([
                  { key: 'pendentes', label: 'Pendentes', icon: Clock },
                  { key: 'avaliadas', label: 'Avaliadas', icon: CheckCircle },
                  { key: 'favoritas', label: 'Favoritas', icon: Star },
                ] as const).map((a) => (
                  <button key={a.key} onClick={() => setAba(a.key)}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 font-mono text-xs
                               tracking-widest transition-all uppercase
                               ${aba === a.key
                                 ? 'border-primary text-primary'
                                 : 'border-transparent text-muted-foreground hover:text-foreground'
                               }`}>
                    <a.icon size={13} />
                    {a.label}
                    {a.key === 'pendentes' &&
                      (respostas[grupoSelecionado] ?? []).filter((r) => r.status === 'pendente').length > 0 && (
                        <span className="ml-1 text-xs font-mono px-1.5 py-0.5 rounded-full
                                         bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {(respostas[grupoSelecionado] ?? []).filter((r) => r.status === 'pendente').length}
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

                {carregandoRespostas ? (
                  <div className="flex items-center justify-center py-20">
                    <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase animate-pulse">
                      Carregando respostas...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Favoritas — agrupadas por grupo */}
                    {aba === 'favoritas' && (
                      todasFavoritas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                          <Star size={32} className="opacity-20" />
                          <p className="font-mono text-sm tracking-widest uppercase">Nenhuma resposta favoritada</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-6">
                          {grupos.map((g) => {
                            const favs = todasFavoritas.filter((r) =>
                              (respostas[g.id] ?? []).some((rg) => rg.id === r.id)
                            )
                            if (favs.length === 0) return null
                            return (
                              <div key={g.id} className="flex flex-col gap-3">
                                <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase
                                              flex items-center gap-2">
                                  {g.nome}
                                </p>
                                {favs.map((r, i) => (
                                  <motion.div key={r.id} variants={fadeUp} custom={i} initial="hidden" animate="show">
                                    <RespostaCard
                                      resposta={r}
                                      favoritada={favoritos.has(r.id)}
                                      onAbrir={() =>
                                        r.status === 'pendente' ? setModalAvaliar(r) : setModalVer(r)
                                      }
                                      onToggleFavorito={(e) => toggleFavorito(e, r.id)}
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
                      const porDossie = respostasFiltradas.reduce<
                        Record<number, { nome: string; lista: Resposta[] }>
                      >((acc, r) => {
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
                                      onAbrir={() =>
                                        r.status === 'pendente' ? setModalAvaliar(r) : setModalVer(r)
                                      }
                                      onToggleFavorito={(e) => toggleFavorito(e, r.id)}
                                    />
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )
                    })()}
                  </>
                )}
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
