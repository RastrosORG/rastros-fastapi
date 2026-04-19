import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Pencil, Check, X, Lock, ShieldCheck, Trophy, FileText, Clock } from 'lucide-react'
import type { Variants } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { meuGrupo, atualizarNomeGrupo } from '../api/gruposApi'
import type { GrupoAPI } from '../api/gruposApi'
import { atualizarNomeUsuario } from '../api/usuariosApi'
import { listarRanking } from '../api/pontuacaoApi'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

const coresAvatar = [
  { bg: 'from-violet-500/30 to-violet-500/5', border: 'border-violet-500/40', text: 'text-violet-300' },
  { bg: 'from-primary/30 to-primary/5',       border: 'border-primary/40',    text: 'text-primary'   },
  { bg: 'from-sky-500/30 to-sky-500/5',       border: 'border-sky-500/40',    text: 'text-sky-300'   },
  { bg: 'from-emerald-500/30 to-emerald-500/5', border: 'border-emerald-500/40', text: 'text-emerald-300' },
]

export default function Grupo() {
  const navigate = useNavigate()
  const usuario = useAuthStore(s => s.usuario)

  const [grupo, setGrupo] = useState<GrupoAPI | null>(null)
  const [carregando, setCarregando] = useState(true)

  const [editandoGrupo, setEditandoGrupo] = useState(false)
  const [inputGrupo, setInputGrupo] = useState('')
  const [erroGrupo, setErroGrupo] = useState('')
  const [salvandoGrupo, setSalvandoGrupo] = useState(false)

  const [editandoNome, setEditandoNome] = useState(false)
  const [inputNome, setInputNome] = useState('')
  const [erroNome, setErroNome] = useState('')
  const [salvandoNome, setSalvandoNome] = useState(false)

  const [toast, setToast] = useState<string | null>(null)

  // Estatísticas do ranking para este grupo
  const [pontos, setPontos] = useState(0)
  const [totalRespostas, setTotalRespostas] = useState(0)
  const [posicao, setPosicao] = useState<number | null>(null)

  // Redireciona avaliadores para a página deles
  useEffect(() => {
    if (usuario?.is_avaliador) {
      navigate('/grupos', { replace: true })
    }
  }, [usuario, navigate])

  useEffect(() => {
    if (usuario?.is_avaliador) return
    carregarGrupo()
    const intervalo = setInterval(() => atualizarGrupoSilencioso(), 20000)
    return () => clearInterval(intervalo)
  }, [usuario])

  // Busca estatísticas reais do ranking após carregar o grupo
  useEffect(() => {
    if (!grupo) return
    listarRanking()
      .then(dados => {
        const idx = dados.ranking.findIndex(g => g.grupo_id === grupo.id)
        if (idx !== -1) {
          setPontos(dados.ranking[idx].pontos)
          setTotalRespostas(dados.ranking[idx].respostas)
          setPosicao(idx + 1)
        }
      })
      .catch(() => {})
  }, [grupo?.id])

  async function carregarGrupo() {
    try {
      setCarregando(true)
      const dados = await meuGrupo()
      setGrupo(dados)
    } catch {
      setGrupo(null)
    } finally {
      setCarregando(false)
    }
  }

  // Atualiza o grupo em background sem acionar o spinner de carregamento
  async function atualizarGrupoSilencioso() {
    try {
      const dados = await meuGrupo()
      setGrupo(dados)
    } catch { /* silencia erros de rede no poll silencioso */ }
  }

  function mostrarToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function salvarNomeGrupo() {
    if (!grupo) return
    const t = inputGrupo.trim()
    if (!t)           { setErroGrupo('Digite um nome'); return }
    if (t.length < 3) { setErroGrupo('Nome muito curto'); return }
    try {
      setSalvandoGrupo(true)
      const atualizado = await atualizarNomeGrupo(grupo.id, t)
      setGrupo(atualizado)
      setEditandoGrupo(false)
      mostrarToast('Nome do grupo atualizado!')
    } catch {
      setErroGrupo('Erro ao salvar. Tente novamente.')
    } finally {
      setSalvandoGrupo(false)
    }
  }

  async function salvarNomeUsuario() {
    const t = inputNome.trim()
    if (!t)           { setErroNome('Digite seu nome'); return }
    if (t.length < 2) { setErroNome('Nome muito curto'); return }
    try {
      setSalvandoNome(true)
      await atualizarNomeUsuario(t)
      // Atualiza o membro localmente sem recarregar tudo
      setGrupo(prev => {
        if (!prev) return prev
        return {
          ...prev,
          membros: prev.membros.map(m =>
            m.usuario.id === usuario?.id
              ? { ...m, usuario: { ...m.usuario, nome_custom: t, nome_alterado: true } }
              : m
          ),
        }
      })
      setEditandoNome(false)
      mostrarToast('Seu nome foi atualizado!')
    } catch {
      setErroNome('Erro ao salvar. Tente novamente.')
    } finally {
      setSalvandoNome(false)
    }
  }

  if (usuario?.is_avaliador) return null

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-full" style={{ backgroundColor: '#0d0d0f' }}>
        <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase animate-pulse">
          Carregando grupo...
        </span>
      </div>
    )
  }

  if (!grupo) {
    return (
      <div className="flex items-center justify-center min-h-full" style={{ backgroundColor: '#0d0d0f' }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <Users size={32} className="text-muted-foreground/30" />
          <p className="font-mono text-sm text-muted-foreground tracking-widest uppercase">
            Você não pertence a nenhum grupo ainda.
          </p>
        </div>
      </div>
    )
  }

  const nomeGrupo = grupo.nome_custom ?? grupo.nome
  const membroAtual = grupo.membros.find(m => m.usuario.id === usuario?.id)
  const nomeUsuario = membroAtual?.usuario.nome_custom ?? membroAtual?.usuario.login ?? usuario?.login ?? ''
  const iniciais = nomeUsuario.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="relative flex flex-col min-h-full">

      {/* Fundo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 right-0 h-[35%]">
          <div className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url('/bg-operacao.jpg')` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#0d0d0f]" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[65%]" style={{
          backgroundColor: '#0d0d0f',
          backgroundImage: `linear-gradient(rgba(201,168,76,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.04) 1px,transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative z-10 flex flex-col items-center px-8 py-12 gap-8 w-full">

        {/* Título */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="flex flex-col items-center gap-3">
          <p className="text-muted-foreground text-xs font-mono tracking-widest uppercase">Sua Equipe</p>
          <h1 className="text-4xl font-bold text-white tracking-widest uppercase"
            style={{ fontFamily: 'Syne, sans-serif' }}>Grupo</h1>
          <div className="w-16 h-px bg-primary/60" />
        </motion.div>

        <div className="w-full max-w-5xl flex flex-col gap-6">

          {/* Stats */}
          <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
            className="grid grid-cols-3 gap-4">
            {[
              { icon: Trophy,   label: 'Posição no Ranking', value: posicao ? `${posicao}º`        : '—', sub: posicao ? 'no ranking geral' : 'sem dados ainda', cor: 'text-primary'     },
              { icon: FileText, label: 'Respostas Enviadas',  value: String(totalRespostas),               sub: 'pelo grupo',                                     cor: 'text-sky-400'     },
              { icon: Clock,    label: 'Pontuação Total',     value: String(pontos),                        sub: 'pontos acumulados',                               cor: 'text-emerald-400' },
            ].map((s, i) => (
              <motion.div key={s.label} variants={fadeUp} custom={i + 2} initial="hidden" animate="show"
                className="bg-[#13131a] border border-border rounded-xl p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                  <s.icon size={18} className="text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={`font-mono font-bold text-2xl ${s.cor}`}>{s.value}</span>
                  <span className="text-xs font-mono text-muted-foreground tracking-wide">{s.label}</span>
                  <span className="text-xs font-mono text-muted-foreground/40">{s.sub}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Linha principal */}
          <div className="flex gap-5 items-start">

            {/* Card do grupo */}
            <motion.div variants={fadeUp} custom={5} initial="hidden" animate="show"
              className="flex-[3] bg-[#13131a] border border-primary/20 rounded-2xl overflow-hidden">

              <div className="px-7 py-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/15 flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-mono text-primary/60 tracking-widest uppercase">Nome da Equipe</p>

                  {editandoGrupo ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <input value={inputGrupo}
                          onChange={e => { setInputGrupo(e.target.value); setErroGrupo('') }}
                          onKeyDown={e => { if (e.key === 'Enter') salvarNomeGrupo(); if (e.key === 'Escape') setEditandoGrupo(false) }}
                          autoFocus maxLength={30} disabled={salvandoGrupo}
                          className="bg-input border border-primary/50 focus:border-primary rounded-lg px-3 py-1.5 text-white font-bold text-2xl focus:outline-none w-52 disabled:opacity-50"
                          style={{ fontFamily: 'Syne, sans-serif' }}
                        />
                        <button onClick={salvarNomeGrupo} disabled={salvandoGrupo}
                          className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-50">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setEditandoGrupo(false)} disabled={salvandoGrupo}
                          className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 transition-all disabled:opacity-50">
                          <X size={15} />
                        </button>
                      </div>
                      {erroGrupo && <span className="text-xs text-destructive font-mono">{erroGrupo}</span>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold text-white"
                        style={{ fontFamily: 'Syne, sans-serif' }}>{nomeGrupo}</h2>
                      {grupo.nome_alterado ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/40 border border-border rounded-full px-2 py-0.5">
                          <Lock size={10} /><span>fixado</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setInputGrupo(nomeGrupo); setErroGrupo(''); setEditandoGrupo(true) }}
                          className="flex items-center gap-1.5 text-xs font-mono text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/40 rounded-full px-3 py-1 transition-all">
                          <Pencil size={11} />alterar
                        </button>
                      )}
                    </div>
                  )}

                  {!grupo.nome_alterado && !editandoGrupo && (
                    <p className="text-xs font-mono text-muted-foreground/40">
                      ⚠ Pode ser alterado apenas uma vez.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 shrink-0">
                  <Users size={13} className="text-primary" />
                  <span className="text-xs font-mono text-primary">{grupo.membros.length} membros</span>
                </div>
              </div>

              {/* Membros */}
              <div className="p-5 flex flex-col gap-3">
                <p className="text-xs font-mono text-muted-foreground/50 tracking-widest uppercase mb-1">Membros</p>
                {grupo.membros.map((membro, i) => {
                  const isAtual = membro.usuario.id === usuario?.id
                  const nome = membro.usuario.nome_custom ?? membro.usuario.login
                  const cor = coresAvatar[i % coresAvatar.length]
                  const memInic = nome.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)

                  return (
                    <div key={membro.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all
                                 ${isAtual ? 'border-primary/30 bg-primary/5' : 'border-border bg-card/30'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-mono shrink-0 bg-gradient-to-br border ${cor.bg} ${cor.border} ${cor.text}`}>
                        {memInic}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`font-semibold text-sm truncate ${isAtual ? 'text-primary' : 'text-white'}`}>
                          {nome}
                        </span>
                        {membro.usuario.nome_custom && (
                          <span className="text-xs font-mono text-muted-foreground/40 truncate hidden sm:block">
                            {membro.usuario.login}
                          </span>
                        )}
                      </div>
                      {isAtual && (
                        <span className="text-xs font-mono text-primary/50 border border-primary/20 rounded-full px-1.5 py-0.5 shrink-0">
                          você
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Card de perfil */}
            <motion.div variants={fadeUp} custom={6} initial="hidden" animate="show"
              className="flex-1 flex flex-col gap-4">

              <div className="bg-[#13131a] border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border/60 bg-black/20 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-primary/60" />
                  <p className="text-xs font-mono text-foreground/50 tracking-widest uppercase">Seu Perfil</p>
                </div>
                <div className="p-5 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary font-mono">{iniciais}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white font-bold text-base"
                      style={{ fontFamily: 'Syne, sans-serif' }}>{nomeUsuario}</span>
                    <span className="text-xs font-mono text-muted-foreground/50">{membroAtual?.usuario.login}</span>
                    <span className="text-xs font-mono text-primary/50 mt-0.5">{nomeGrupo}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#13131a] border border-border rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-foreground/50 tracking-widest uppercase">
                    Nome de exibição
                  </p>
                  {!membroAtual?.usuario.nome_alterado && (
                    <span className="text-xs font-mono text-primary/40">1 vez</span>
                  )}
                </div>

                {editandoNome ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <input value={inputNome}
                        onChange={e => { setInputNome(e.target.value); setErroNome('') }}
                        onKeyDown={e => { if (e.key === 'Enter') salvarNomeUsuario(); if (e.key === 'Escape') setEditandoNome(false) }}
                        autoFocus maxLength={40} placeholder="Seu nome" disabled={salvandoNome}
                        className="flex-1 bg-input border border-primary/40 focus:border-primary rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none transition-colors disabled:opacity-50"
                      />
                      <button onClick={salvarNomeUsuario} disabled={salvandoNome}
                        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-50">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditandoNome(false)} disabled={salvandoNome}
                        className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 transition-all disabled:opacity-50">
                        <X size={14} />
                      </button>
                    </div>
                    {erroNome && <span className="text-xs text-destructive font-mono">{erroNome}</span>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-secondary/40 border border-border rounded-lg text-sm font-mono text-foreground/80 truncate">
                      {nomeUsuario}
                    </div>
                    {membroAtual?.usuario.nome_alterado ? (
                      <div className="p-2 rounded-lg border border-border text-muted-foreground/30 cursor-not-allowed">
                        <Lock size={14} />
                      </div>
                    ) : (
                      <button
                        onClick={() => { setInputNome(nomeUsuario); setErroNome(''); setEditandoNome(true) }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border hover:border-primary/30 transition-all">
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-mono text-foreground/50 tracking-widest uppercase">Usuário</p>
                  <div className="flex items-center gap-2 px-3 py-2 bg-secondary/40 border border-border rounded-lg">
                    <span className="text-sm font-mono text-muted-foreground/60 flex-1">{membroAtual?.usuario.login}</span>
                    <Lock size={12} className="text-muted-foreground/30 shrink-0" />
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-950 border border-emerald-500/50 text-emerald-400 px-5 py-3 rounded-xl shadow-2xl font-mono text-sm">
            <Check size={16} />{toast}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
