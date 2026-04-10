import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Key, Lock, Unlock, CheckCircle,
  AlertTriangle, RefreshCw, UserPlus, Search
} from 'lucide-react'
import {
  DndContext, PointerSensor, useSensor, useSensors, DragOverlay, closestCenter
} from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'

import GrupoCard, { type Grupo } from '../components/grupos/GrupoCard'
import MembroCard, { type Usuario } from '../components/grupos/MembroCard'
import ModalGerarUsuarios from '../components/grupos/ModalGerarUsuarios'
import ModalConfirmarGerar from '../components/grupos/ModalConfirmarGerar'
import ModalCredenciais from '../components/grupos/ModalCredenciais'
import ModalAdicionarUm from '../components/grupos/ModalAdicionarUm'
import ModalTransferir, { mockAvaliadores } from '../components/grupos/ModalTransferir'
import { listarTodosGrupos, gerarUsuarios, transferirGrupo as transferirGrupoApi, moverMembro } from '../api/gruposApi'
import type { GrupoAPI, CredencialAPI } from '../api/gruposApi'

// ── Mocks — substituídos pelo authStore/backend depois ──────────
const AVALIADOR_ATUAL = { id: 'av1', nome: 'Avaliador 1' }

// ── Helpers ─────────────────────────────────────────────────────
function gerarSenha(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

type FiltroView = 'todos' | 'meus' | 'outros'

export default function GerenciarGrupos() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [todasCredenciais, setTodasCredenciais] = useState<CredencialAPI[]>([])

  const [ultimaGeracao, setUltimaGeracao] = useState<Date | null>(null)
  const [lockEdicao, setLockEdicao] = useState<{ avaliadorId: string; avaliadorNome: string } | null>(null)
  const [editando, setEditando] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [qtdUsuarios, setQtdUsuarios] = useState('')
  const [filtro, setFiltro] = useState<FiltroView>('todos')
  const [busca, setBusca] = useState('')
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'erro' } | null>(null)

  // Modais
  const [modalGerar, setModalGerar] = useState(false)
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [modalCredenciais, setModalCredenciais] = useState(false)
  const [modalAdicionarUm, setModalAdicionarUm] = useState(false)
  const [modalTransferir, setModalTransferir] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    carregarGrupos()
  }, [])

  async function carregarGrupos() {
    try {
      setCarregando(true)
      const dados = await listarTodosGrupos()
      setGrupos(dados.map(g => ({
        id: g.id.toString(),
        nome: g.nome,
        avaliadorId: g.avaliador_id.toString(),
        avaliadorNome: g.avaliador_nome,
        membros: g.membros.map(m => ({
          id: m.usuario.id.toString(),
          login: m.usuario.login,
          senha: '',
          grupoId: g.id.toString(),
        }))
      })))
    } catch (e) {
      console.error('Erro ao carregar grupos:', e)
    } finally {
      setCarregando(false)
    }
  }

  function mostrarToast(msg: string, tipo: 'ok' | 'erro') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Filtro + busca ────────────────────────────────────────────
  const gruposFiltrados = grupos
    .filter(g => {
      if (filtro === 'meus') return g.avaliadorId === AVALIADOR_ATUAL.id
      if (filtro === 'outros') return g.avaliadorId !== AVALIADOR_ATUAL.id
      return true
    })
    .filter(g => busca.trim() === '' || g.nome.toLowerCase().includes(busca.toLowerCase()))

  // ── Gerar usuários ────────────────────────────────────────────
  function tentarGerar() {
    const qtd = parseInt(qtdUsuarios)
    if (isNaN(qtd) || qtd < 4) { mostrarToast('Mínimo de 4 usuários.', 'erro'); return }
    if (ultimaGeracao && (Date.now() - ultimaGeracao.getTime()) / 36e5 < 24) {
      mostrarToast('Usuários já foram gerados nas últimas 24h.', 'erro'); return
    }
    setModalGerar(false)
    setModalConfirmar(true)
  }

  async function confirmarGerar() {
    try {
      const qtd = parseInt(qtdUsuarios)
      const resultado = await gerarUsuarios(qtd)
      setTodasCredenciais(resultado.credenciais)
      await carregarGrupos()
      setModalConfirmar(false)
      setQtdUsuarios('')
      mostrarToast(`${resultado.usuarios_criados} usuários gerados em ${resultado.grupos_criados} grupos!`, 'ok')
    } catch (e: any) {
      mostrarToast(e?.response?.data?.detail ?? 'Erro ao gerar usuários.', 'erro')
      setModalConfirmar(false)
    }
  }

  // ── Adicionar um usuário ──────────────────────────────────────
  function adicionarUmUsuario() {
    const num = String(todasCredenciais.length + 1).padStart(2, '0')
    const novo: Usuario = { id: `user_${Date.now()}`, login: `user${num}`, senha: gerarSenha(), grupoId: '' }

    setGrupos(prev => {
      const grupoDeTres = prev.find(g => g.membros.length === 3)
      if (grupoDeTres) {
        return prev.map(g => g.id === grupoDeTres.id
          ? { ...g, membros: [...g.membros, { ...novo, grupoId: g.id }] }
          : g
        )
      }
      const gruposDe4 = prev.filter(g => g.membros.length === 4)
      if (gruposDe4.length < 2) { mostrarToast('Grupos insuficientes para redistribuir.', 'erro'); return prev }
      const novoGrupoId = `grupo_${prev.length + 1}`
      const av = mockAvaliadores[prev.length % mockAvaliadores.length]
      let tirados: Usuario[] = []
      const atualizado = prev.map(g => {
        if (tirados.length < 2 && g.membros.length === 4) {
          tirados.push({ ...g.membros[g.membros.length - 1], grupoId: novoGrupoId })
          return { ...g, membros: g.membros.slice(0, -1) }
        }
        return g
      })
      return [...atualizado, {
        id: novoGrupoId,
        nome: `Grupo ${String(prev.length + 1).padStart(2, '0')}`,
        avaliadorId: av.id, avaliadorNome: av.nome,
        membros: [...tirados, { ...novo, grupoId: novoGrupoId }],
      }]
    })
    setModalAdicionarUm(false)
    mostrarToast('Usuário adicionado!', 'ok')
  }

  // ── Lock de edição ────────────────────────────────────────────
  function ativarEdicao() {
    if (lockEdicao && lockEdicao.avaliadorId !== AVALIADOR_ATUAL.id) {
      mostrarToast(`${lockEdicao.avaliadorNome} está editando. Aguarde.`, 'erro'); return
    }
    // TODO backend: registrar lock via WebSocket
    setLockEdicao({ avaliadorId: AVALIADOR_ATUAL.id, avaliadorNome: AVALIADOR_ATUAL.nome })
    setEditando(true)
  }

  function desativarEdicao() {
    // TODO backend: liberar lock via WebSocket
    setLockEdicao(null)
    setEditando(false)
  }

  // ── Drag and drop ─────────────────────────────────────────────
  function onDragStart(e: DragStartEvent) { setActiveId(e.active.id as string) }

  const onDragOver = useCallback((e: DragOverEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setGrupos(prev => {
      const origem = prev.find(g => g.membros.some(m => m.id === active.id))
      const destino = prev.find(g => g.membros.some(m => m.id === over.id) || g.id === over.id)
      if (!origem || !destino || origem.id === destino.id) return prev
      const membro = origem.membros.find(m => m.id === active.id)!
      return prev.map(g => {
        if (g.id === origem.id) return { ...g, membros: g.membros.filter(m => m.id !== active.id) }
        if (g.id === destino.id) return { ...g, membros: [...g.membros, { ...membro, grupoId: g.id }] }
        return g
      })
    })
  }, [])

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    if (!e.over) return

    const { active, over } = e
    const grupoOrigem = grupos.find(g => g.membros.some(m => m.id === active.id))
    const grupoDestino = grupos.find(g =>
      g.membros.some(m => m.id === over.id) || g.id === over.id
    )

    if (!grupoOrigem || !grupoDestino || grupoOrigem.id === grupoDestino.id) return

    const invalidos = grupos.filter(g => g.membros.length < 3 || g.membros.length > 4)
    if (invalidos.length > 0) {
      mostrarToast('Grupos devem ter entre 3 e 4 membros.', 'erro')
      await carregarGrupos()
      return
    }

    try {
      await moverMembro(parseInt(active.id as string), parseInt(grupoDestino.id))
      mostrarToast('Membro movido!', 'ok')
    } catch (e: any) {
      mostrarToast(e?.response?.data?.detail ?? 'Erro ao mover membro.', 'erro')
      await carregarGrupos()
    }
  }

  // ── Transferir grupo ──────────────────────────────────────────
  async function transferirGrupo(grupoId: string, avId: string) {
    try {
      await transferirGrupoApi(parseInt(grupoId), parseInt(avId))
      await carregarGrupos()
      setModalTransferir(null)
      mostrarToast('Grupo transferido!', 'ok')
    } catch (e) {
      mostrarToast('Erro ao transferir grupo.', 'erro')
    }
  }

  const usuarioAtivo = grupos.flatMap(g => g.membros).find(m => m.id === activeId)
  const podeGerar = !ultimaGeracao || (Date.now() - ultimaGeracao.getTime()) / 36e5 >= 24

  // ── Tela de carregamento ──────────────────────────────────────
  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-full" style={{
        backgroundColor: '#0d0d0f',
      }}>
        <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase animate-pulse">
          Carregando grupos...
        </span>
      </div>
    )
  }

  return (
    <div className="relative min-h-full" style={{
      backgroundColor: '#0d0d0f',
      backgroundImage: `
        linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }}>
      <div className="p-8 flex flex-col gap-8">

        {/* Cabeçalho */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-muted-foreground text-xs font-mono tracking-widest uppercase mb-1">Administração</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}>Gerenciar Grupos</h1>
          </div>
          <div className="flex items-center gap-3">
            {todasCredenciais.length > 0 && (
              <button onClick={() => setModalCredenciais(true)}
                className="flex items-center gap-2 px-4 py-2 border border-border text-muted-foreground
                           hover:text-foreground hover:border-primary/40 font-mono text-xs tracking-widest
                           rounded-lg transition-all uppercase">
                <Key size={15} /> Credenciais
              </button>
            )}
            {grupos.length > 0 && (
              <button onClick={() => setModalAdicionarUm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-border text-muted-foreground
                           hover:text-foreground hover:border-primary/40 font-mono text-xs tracking-widest
                           rounded-lg transition-all uppercase">
                <UserPlus size={15} /> Add Usuário
              </button>
            )}
            <button
              onClick={() => podeGerar ? setModalGerar(true) : mostrarToast('Aguarde 24h.', 'erro')}
              className={`flex items-center gap-2 px-5 py-2.5 border font-mono text-xs tracking-widest
                         rounded-lg transition-all uppercase
                         ${podeGerar
                           ? 'bg-primary/10 hover:bg-primary/20 border-primary/40 hover:border-primary text-primary'
                           : 'border-border text-muted-foreground opacity-50 cursor-not-allowed'
                         }`}>
              <RefreshCw size={15} />
              {grupos.length > 0 ? 'Regerar' : 'Gerar Usuários'}
            </button>
          </div>
        </motion.div>

        {/* Filtros + busca */}
        {grupos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="flex items-center gap-3 flex-wrap"
          >
            <div className="flex gap-2">
              {([
                { key: 'todos', label: 'Todos' },
                { key: 'meus', label: 'Meus Grupos' },
                { key: 'outros', label: 'Outros' },
              ] as { key: FiltroView; label: string }[]).map(f => (
                <button key={f.key} onClick={() => setFiltro(f.key)}
                  className={`px-4 py-1.5 border font-mono text-xs tracking-widest rounded-lg
                              transition-all duration-200 uppercase
                              ${filtro === f.key
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                              }`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-input border border-border rounded-lg px-3 py-1.5 ml-auto">
              <Search size={14} className="text-muted-foreground" />
              <input
                type="text" placeholder="Buscar grupo..."
                value={busca} onChange={e => setBusca(e.target.value)}
                className="bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/50
                           focus:outline-none w-40"
              />
            </div>

            <span className="text-xs text-muted-foreground font-mono">
              {gruposFiltrados.length} grupo{gruposFiltrados.length !== 1 ? 's' : ''}
            </span>
          </motion.div>
        )}

        {/* Status da edição */}
        {grupos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`flex items-center justify-between px-5 py-3 rounded-xl border transition-all
              ${editando
                ? 'bg-primary/5 border-primary/30'
                : lockEdicao && lockEdicao.avaliadorId !== AVALIADOR_ATUAL.id
                  ? 'bg-destructive/5 border-destructive/30'
                  : 'bg-card border-border'
              }`}
          >
            <div className="flex items-center gap-3">
              {editando ? (
                <><Unlock size={16} className="text-primary" />
                  <span className="text-sm font-mono text-primary">Modo de edição ativo — arraste membros entre grupos</span></>
              ) : lockEdicao && lockEdicao.avaliadorId !== AVALIADOR_ATUAL.id ? (
                <><Lock size={16} className="text-destructive" />
                  <span className="text-sm font-mono text-destructive">{lockEdicao.avaliadorNome} está editando agora</span></>
              ) : (
                <><Lock size={16} className="text-muted-foreground" />
                  <span className="text-sm font-mono text-muted-foreground">Edição bloqueada — ative para reorganizar</span></>
              )}
            </div>
            {(!lockEdicao || lockEdicao.avaliadorId === AVALIADOR_ATUAL.id) && (
              <button onClick={editando ? desativarEdicao : ativarEdicao}
                className={`flex items-center gap-2 px-4 py-1.5 border font-mono text-xs
                           tracking-widest rounded-lg transition-all uppercase
                           ${editando
                             ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                             : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                           }`}>
                {editando ? <><CheckCircle size={13} /> Concluir</> : <><Unlock size={13} /> Editar</>}
              </button>
            )}
          </motion.div>
        )}

        {/* Estado vazio */}
        {grupos.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col items-center justify-center gap-5 py-32"
          >
            <div className="p-5 bg-card border border-border rounded-full">
              <Users size={32} className="text-muted-foreground/40" />
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-lg font-bold text-foreground tracking-widest uppercase"
                style={{ fontFamily: 'Syne, sans-serif' }}>Nenhum grupo criado</h2>
              <p className="text-muted-foreground font-mono text-sm max-w-sm leading-relaxed">
                Gere os usuários para criar e distribuir os grupos automaticamente.
              </p>
            </div>
            <button onClick={() => setModalGerar(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20
                         border border-primary/40 hover:border-primary text-primary font-mono
                         text-xs tracking-widest rounded-lg transition-all uppercase">
              <Plus size={16} /> Gerar Usuários
            </button>
          </motion.div>
        )}

        {/* Grid com DnD */}
        {gruposFiltrados.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter}
            onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {gruposFiltrados.map((grupo, i) => (
                <GrupoCard key={grupo.id} grupo={grupo} editando={editando}
                  index={i} onTransferir={id => setModalTransferir(id)} />
              ))}
            </div>
            <DragOverlay>
              {activeId && usuarioAtivo && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border
                                border-primary/60 bg-primary/10 shadow-xl cursor-grabbing">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40
                                  flex items-center justify-center">
                    <span className="text-xs font-mono text-primary">
                      {usuarioAtivo.login.replace('user', '')}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-foreground">{usuarioAtivo.login}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Estado vazio do filtro */}
        {grupos.length > 0 && gruposFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Search size={32} className="opacity-20" />
            <p className="font-mono text-sm tracking-widest uppercase">Nenhum grupo encontrado</p>
          </div>
        )}
      </div>

      {/* ── Modais ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalGerar && (
          <ModalGerarUsuarios
            qtdUsuarios={qtdUsuarios} ultimaGeracao={ultimaGeracao}
            onChange={setQtdUsuarios} onContinuar={tentarGerar}
            onFechar={() => setModalGerar(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalConfirmar && (
          <ModalConfirmarGerar qtd={qtdUsuarios}
            onConfirmar={confirmarGerar} onCancelar={() => setModalConfirmar(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalCredenciais && (
          <ModalCredenciais grupos={grupos} onFechar={() => setModalCredenciais(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalAdicionarUm && (
          <ModalAdicionarUm grupos={grupos}
            onConfirmar={adicionarUmUsuario} onCancelar={() => setModalAdicionarUm(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalTransferir && (
          <ModalTransferir grupoId={modalTransferir} grupos={grupos}
            onTransferir={transferirGrupo} onFechar={() => setModalTransferir(null)} />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                       px-5 py-3 rounded-xl shadow-2xl font-mono text-sm
                       ${toast.tipo === 'ok'
                         ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-400'
                         : 'bg-red-950 border border-red-500/50 text-red-400'
                       }`}
          >
            {toast.tipo === 'ok' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}