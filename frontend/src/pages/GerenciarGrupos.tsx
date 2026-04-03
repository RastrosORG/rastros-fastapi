import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Key, Printer, X, Lock, Unlock,
  AlertTriangle, CheckCircle, ChevronRight, Shield,
  RefreshCw, UserPlus, ArrowRightLeft
} from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Variants } from 'framer-motion'

// ── Mocks — substituídos pelo store/backend depois ──────────────
const AVALIADOR_ATUAL = { id: 'av1', nome: 'Avaliador 1' }

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

// ── Tipos ───────────────────────────────────────────────────────
interface Usuario {
  id: string
  login: string
  senha: string
  grupoId: string
}

interface Grupo {
  id: string
  nome: string
  avaliadorId: string
  avaliadorNome: string
  membros: Usuario[]
}

interface LockEdicao {
  avaliadorId: string
  avaliadorNome: string
  desde: Date
}

// ── Helpers ─────────────────────────────────────────────────────
function gerarSenha(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function distribuirEmGrupos(usuarios: Usuario[], avaliadores: { id: string; nome: string }[]): Grupo[] {
  const total = usuarios.length
  const grupos: Grupo[] = []
  let grupoCount = 0
  let i = 0

  // Calcula quantos grupos de 3 e de 4 são necessários
  // total = 4a + 3b, minimizando grupos de 3
  let qtd4 = Math.floor(total / 4)
  let resto = total % 4
  let qtd3 = 0

  if (resto === 1 && qtd4 >= 1) { qtd4 -= 1; qtd3 = 3 }
  else if (resto === 2 && qtd4 >= 2) { qtd4 -= 2; qtd3 = 4 - 2; qtd3 = 2; qtd4 = Math.floor((total - qtd3 * 3) / 4) }
  else if (resto === 2) { qtd4 = 0; qtd3 = Math.ceil(total / 3) }
  else if (resto === 3) { qtd3 = 1 }

  // Recalcula corretamente
  qtd4 = 0; qtd3 = 0
  if (total % 4 === 0) { qtd4 = total / 4 }
  else if (total % 4 === 1) { qtd4 = Math.floor(total / 4) - 1; qtd3 = 3 }
  else if (total % 4 === 2) { qtd4 = Math.floor(total / 4); qtd3 = 2 }
  else if (total % 4 === 3) { qtd4 = Math.floor(total / 4); qtd3 = 1 }

  const tamanhos = [...Array(qtd4).fill(4), ...Array(qtd3).fill(3)]

  for (const tam of tamanhos) {
    const avIdx = grupoCount % avaliadores.length
    const av = avaliadores[avIdx]
    const grupoId = `grupo_${grupoCount + 1}`
    const membros = usuarios.slice(i, i + tam).map(u => ({ ...u, grupoId }))
    grupos.push({
      id: grupoId,
      nome: `Grupo ${String(grupoCount + 1).padStart(2, '0')}`,
      avaliadorId: av.id,
      avaliadorNome: av.nome,
      membros,
    })
    i += tam
    grupoCount++
  }

  return grupos
}

// ── Mock avaliadores ─────────────────────────────────────────────
const mockAvaliadores = [
  { id: 'av1', nome: 'Avaliador 1' },
  { id: 'av2', nome: 'Avaliador 2' },
  { id: 'av3', nome: 'Avaliador 3' },
]

// ── Componente membro arrastável ────────────────────────────────
function MembroCard({ usuario, editando }: { usuario: Usuario; editando: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: usuario.id, disabled: !editando })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all
        ${isDragging
          ? 'opacity-40 border-primary/60 bg-primary/10'
          : editando
            ? 'border-border bg-black/20 hover:border-primary/40 cursor-grab active:cursor-grabbing'
            : 'border-border bg-black/20 cursor-default'
        }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-xs font-mono text-primary">
            {usuario.login.replace('user', '')}
          </span>
        </div>
        <span className="text-sm font-mono text-foreground">{usuario.login}</span>
      </div>
      {editando && (
        <div className="flex items-center gap-1 text-muted-foreground/40">
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
        </div>
      )}
    </div>
  )
}

// ── Componente grupo ────────────────────────────────────────────
function GrupoCard({
  grupo, editando, index,
  onTransferir,
}: {
  grupo: Grupo
  editando: boolean
  index: number
  onTransferir: (grupoId: string) => void
}) {
  const meuGrupo = grupo.avaliadorId === AVALIADOR_ATUAL.id
  const tamanho = grupo.membros.length
  const tamanhoOk = tamanho === 3 || tamanho === 4

  return (
    <motion.div variants={fadeUp} custom={index} initial="hidden" animate="show"
      className={`bg-card/70 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300
        ${meuGrupo ? 'border-primary/40' : 'border-border'}`}
    >
      {/* Header do grupo */}
      <div className={`px-4 py-3 flex items-center justify-between border-b
        ${meuGrupo ? 'border-primary/20 bg-primary/5' : 'border-border bg-black/20'}`}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
            {grupo.nome}
          </h3>
          <span className={`text-xs font-mono px-1.5 py-0.5 rounded border
            ${tamanhoOk
              ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
              : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
            }`}>
            {tamanho} membros
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {meuGrupo ? (
              <span className="text-primary/70">Seu grupo</span>
            ) : grupo.avaliadorNome}
          </span>
          {editando && !meuGrupo && (
            <button
              onClick={() => onTransferir(grupo.id)}
              title="Transferir para mim"
              className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowRightLeft size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Membros */}
      <div className="p-3 flex flex-col gap-1.5">
        <SortableContext items={grupo.membros.map(m => m.id)} strategy={verticalListSortingStrategy}>
          {grupo.membros.map(m => (
            <MembroCard key={m.id} usuario={m} editando={editando} />
          ))}
        </SortableContext>
        {grupo.membros.length === 0 && (
          <div className="py-4 flex items-center justify-center text-muted-foreground/40 text-xs font-mono tracking-widest uppercase border border-dashed border-border rounded-lg">
            Grupo vazio
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Página principal ────────────────────────────────────────────
export default function GerenciarGrupos() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [ultimaGeracao, setUltimaGeracao] = useState<Date | null>(null)
  const [lockEdicao, setLockEdicao] = useState<LockEdicao | null>(null)
  const [editando, setEditando] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Modais
  const [modalGerar, setModalGerar] = useState(false)
  const [modalCredenciais, setModalCredenciais] = useState(false)
  const [modalTransferir, setModalTransferir] = useState<string | null>(null) // grupoId
  const [modalConfirmarGerar, setModalConfirmarGerar] = useState(false)
  const [modalAdicionarUm, setModalAdicionarUm] = useState(false)

  const [qtdUsuarios, setQtdUsuarios] = useState('')
  const [todasCredenciais, setTodasCredenciais] = useState<Usuario[]>([])
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'erro' } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function mostrarToast(msg: string, tipo: 'ok' | 'erro') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Gerar usuários ───────────────────────────────────────────
  function tentarGerar() {
    const qtd = parseInt(qtdUsuarios)
    if (isNaN(qtd) || qtd < 4) {
      mostrarToast('Mínimo de 4 usuários.', 'erro'); return
    }
    if (ultimaGeracao) {
      const diff = (Date.now() - ultimaGeracao.getTime()) / 1000 / 60 / 60
      if (diff < 24) {
        mostrarToast('Usuários já foram gerados nas últimas 24h.', 'erro'); return
      }
    }
    setModalGerar(false)
    setModalConfirmarGerar(true)
  }

  function confirmarGerar() {
    // TODO backend: verificar lock de geração simultânea via API antes de prosseguir
    const qtd = parseInt(qtdUsuarios)
    const agora = new Date()
    const novosUsuarios: Usuario[] = Array.from({ length: qtd }, (_, i) => {
      const num = String(todasCredenciais.length + i + 1).padStart(2, '0')
      return {
        id: `user_${Date.now()}_${i}`,
        login: `user${num}`,
        senha: gerarSenha(),
        grupoId: '',
      }
    })

    const novosGrupos = distribuirEmGrupos(novosUsuarios, mockAvaliadores)
    setGrupos(novosGrupos)
    setTodasCredenciais(prev => [...prev, ...novosUsuarios])
    setUltimaGeracao(agora)
    setModalConfirmarGerar(false)
    setQtdUsuarios('')
    mostrarToast(`${qtd} usuários gerados e distribuídos em ${novosGrupos.length} grupos!`, 'ok')
  }

  // ── Adicionar um usuário extra ───────────────────────────────
  function adicionarUmUsuario() {
    const num = String(todasCredenciais.length + 1).padStart(2, '0')
    const novoUsuario: Usuario = {
      id: `user_${Date.now()}`,
      login: `user${num}`,
      senha: gerarSenha(),
      grupoId: '',
    }

    const gruposDeTres = grupos.filter(g => g.membros.length === 3)

    setGrupos(prev => {
      if (gruposDeTres.length > 0) {
        // Adiciona ao primeiro grupo de 3
        return prev.map(g => g.id === gruposDeTres[0].id
          ? { ...g, membros: [...g.membros, { ...novoUsuario, grupoId: g.id }] }
          : g
        )
      } else {
        // Cria novo grupo — tira 2 membros de grupos de 4
        const gruposDe4 = prev.filter(g => g.membros.length === 4)
        if (gruposDe4.length < 2) {
          mostrarToast('Não há grupos suficientes para redistribuir.', 'erro')
          return prev
        }
        const novoGrupoId = `grupo_${prev.length + 1}`
        const av = mockAvaliadores[prev.length % mockAvaliadores.length]
        let membrosTirados: Usuario[] = []
        const atualizado = prev.map(g => {
          if (membrosTirados.length < 2 && g.membros.length === 4) {
            const tirado = g.membros[g.membros.length - 1]
            membrosTirados.push({ ...tirado, grupoId: novoGrupoId })
            return { ...g, membros: g.membros.slice(0, -1) }
          }
          return g
        })
        const novoGrupo: Grupo = {
          id: novoGrupoId,
          nome: `Grupo ${String(prev.length + 1).padStart(2, '0')}`,
          avaliadorId: av.id,
          avaliadorNome: av.nome,
          membros: [...membrosTirados, { ...novoUsuario, grupoId: novoGrupoId }],
        }
        return [...atualizado, novoGrupo]
      }
    })

    setTodasCredenciais(prev => [...prev, novoUsuario])
    setModalAdicionarUm(false)
    mostrarToast('Usuário adicionado com sucesso!', 'ok')
  }

  // ── Lock de edição ────────────────────────────────────────────
  function ativarEdicao() {
    if (lockEdicao && lockEdicao.avaliadorId !== AVALIADOR_ATUAL.id) {
      mostrarToast(`${lockEdicao.avaliadorNome} está editando. Aguarde.`, 'erro'); return
    }
    // TODO backend: registrar lock via API/WebSocket
    setLockEdicao({ avaliadorId: AVALIADOR_ATUAL.id, avaliadorNome: AVALIADOR_ATUAL.nome, desde: new Date() })
    setEditando(true)
  }

  function desativarEdicao() {
    // TODO backend: liberar lock via API/WebSocket
    setLockEdicao(null)
    setEditando(false)
  }

  // ── Drag and drop ─────────────────────────────────────────────
  function onDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  const onDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setGrupos(prev => {
      const grupoOrigem = prev.find(g => g.membros.some(m => m.id === active.id))
      const grupoDestino = prev.find(g =>
        g.membros.some(m => m.id === over.id) || g.id === over.id
      )
      if (!grupoOrigem || !grupoDestino || grupoOrigem.id === grupoDestino.id) return prev

      const membro = grupoOrigem.membros.find(m => m.id === active.id)!

      return prev.map(g => {
        if (g.id === grupoOrigem.id) return { ...g, membros: g.membros.filter(m => m.id !== active.id) }
        if (g.id === grupoDestino.id) return { ...g, membros: [...g.membros, { ...membro, grupoId: g.id }] }
        return g
      })
    })
  }, [])

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    // Valida tamanhos após drop
    const invalidos = grupos.filter(g => g.membros.length < 3 || g.membros.length > 4)
    if (invalidos.length > 0) {
      mostrarToast('Grupos devem ter entre 3 e 4 membros.', 'erro')
    }
  }

  // ── Transferir grupo entre avaliadores ───────────────────────
  function transferirGrupo(grupoId: string, novoAvaliadorId: string) {
    const av = mockAvaliadores.find(a => a.id === novoAvaliadorId)!
    setGrupos(prev => prev.map(g => g.id === grupoId
      ? { ...g, avaliadorId: av.id, avaliadorNome: av.nome }
      : g
    ))
    setModalTransferir(null)
    mostrarToast('Grupo transferido com sucesso!', 'ok')
  }

  const usuarioAtivo = grupos.flatMap(g => g.membros).find(m => m.id === activeId)
  const podeMostrarCredenciais = todasCredenciais.length > 0
  const podeGerar = !ultimaGeracao || (Date.now() - ultimaGeracao.getTime()) / 1000 / 60 / 60 >= 24

  const inputClass = `w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground
    placeholder:text-muted-foreground/50 font-mono focus:outline-none focus:border-primary/50 transition-colors`

  return (
    <div className="relative min-h-full"
      style={{
        backgroundColor: '#0d0d0f',
        backgroundImage: `
          linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      <div className="p-8 flex flex-col gap-8">

        {/* Cabeçalho */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-muted-foreground text-xs font-mono tracking-widest uppercase mb-1">
              Administração
            </p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              Gerenciar Grupos
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {podeMostrarCredenciais && (
              <button onClick={() => setModalCredenciais(true)}
                className="flex items-center gap-2 px-4 py-2 border border-border text-muted-foreground
                           hover:text-foreground hover:border-primary/40 font-mono text-xs tracking-widest
                           rounded-lg transition-all duration-200 uppercase">
                <Key size={15} /> Credenciais
              </button>
            )}
            {grupos.length > 0 && (
              <button onClick={() => setModalAdicionarUm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-border text-muted-foreground
                           hover:text-foreground hover:border-primary/40 font-mono text-xs tracking-widest
                           rounded-lg transition-all duration-200 uppercase">
                <UserPlus size={15} /> Add Usuário
              </button>
            )}
            <button
              onClick={() => podeGerar ? setModalGerar(true) : mostrarToast('Aguarde 24h desde a última geração.', 'erro')}
              className={`flex items-center gap-2 px-5 py-2.5 border font-mono text-xs tracking-widest
                         rounded-lg transition-all duration-200 uppercase
                         ${podeGerar
                           ? 'bg-primary/10 hover:bg-primary/20 border-primary/40 hover:border-primary text-primary'
                           : 'border-border text-muted-foreground opacity-50 cursor-not-allowed'
                         }`}>
              <RefreshCw size={15} />
              {grupos.length > 0 ? 'Regerar' : 'Gerar Usuários'}
            </button>
          </div>
        </motion.div>

        {/* Status da edição */}
        {grupos.length > 0 && (
          <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
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
                <>
                  <Unlock size={16} className="text-primary" />
                  <span className="text-sm font-mono text-primary">
                    Modo de edição ativo — arraste membros entre grupos
                  </span>
                </>
              ) : lockEdicao && lockEdicao.avaliadorId !== AVALIADOR_ATUAL.id ? (
                <>
                  <Lock size={16} className="text-destructive" />
                  <span className="text-sm font-mono text-destructive">
                    {lockEdicao.avaliadorNome} está editando os grupos agora
                  </span>
                </>
              ) : (
                <>
                  <Lock size={16} className="text-muted-foreground" />
                  <span className="text-sm font-mono text-muted-foreground">
                    Edição bloqueada — ative para reorganizar os grupos
                  </span>
                </>
              )}
            </div>
            {(!lockEdicao || lockEdicao.avaliadorId === AVALIADOR_ATUAL.id) && (
              <button
                onClick={editando ? desativarEdicao : ativarEdicao}
                className={`flex items-center gap-2 px-4 py-1.5 border font-mono text-xs
                           tracking-widest rounded-lg transition-all duration-200 uppercase
                           ${editando
                             ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                             : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                           }`}
              >
                {editando ? <><CheckCircle size={13} /> Concluir</> : <><Unlock size={13} /> Editar</>}
              </button>
            )}
          </motion.div>
        )}

        {/* Estado vazio */}
        {grupos.length === 0 && (
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show"
            className="flex flex-col items-center justify-center gap-5 py-32"
          >
            <div className="p-5 bg-card border border-border rounded-full">
              <Users size={32} className="text-muted-foreground/40" />
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-lg font-bold text-foreground tracking-widest uppercase"
                style={{ fontFamily: 'Syne, sans-serif' }}>
                Nenhum grupo criado
              </h2>
              <p className="text-muted-foreground font-mono text-sm max-w-sm leading-relaxed">
                Gere os usuários para criar e distribuir os grupos automaticamente.
              </p>
            </div>
            <button onClick={() => setModalGerar(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20
                         border border-primary/40 hover:border-primary text-primary font-mono
                         text-xs tracking-widest rounded-lg transition-all duration-200 uppercase">
              <Plus size={16} /> Gerar Usuários
            </button>
          </motion.div>
        )}

        {/* Grid de grupos com DnD */}
        {grupos.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {grupos.map((grupo, i) => (
                <GrupoCard
                  key={grupo.id}
                  grupo={grupo}
                  editando={editando}
                  index={i + 2}
                  onTransferir={(grupoId) => setModalTransferir(grupoId)}
                />
              ))}
            </div>
            <DragOverlay>
              {activeId && usuarioAtivo && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border
                                border-primary/60 bg-primary/10 shadow-xl cursor-grabbing">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <span className="text-xs font-mono text-primary">
                        {usuarioAtivo.login.replace('user', '')}
                      </span>
                    </div>
                    <span className="text-sm font-mono text-foreground">{usuarioAtivo.login}</span>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ── Modais ─────────────────────────────────────────────── */}

      {/* Modal gerar usuários */}
      <AnimatePresence>
        {modalGerar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalGerar(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-sm
                              pointer-events-auto shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/40">
                  <div>
                    <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">Geração</p>
                    <h3 className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                      Gerar Usuários
                    </h3>
                  </div>
                  <button onClick={() => setModalGerar(false)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
                    <X size={18} />
                  </button>
                </div>
                <div className="p-6 flex flex-col gap-5 bg-[#0f0f14]">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                      Quantidade de Usuários
                    </label>
                    <input
                      type="number" min="4" placeholder="Ex: 40"
                      value={qtdUsuarios}
                      onChange={e => setQtdUsuarios(e.target.value)}
                      className={inputClass}
                    />
                    <span className="text-xs text-muted-foreground/50 font-mono">
                      Mínimo 4. Grupos serão formados com 3 ou 4 membros.
                    </span>
                  </div>
                  {ultimaGeracao && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <AlertTriangle size={14} className="text-amber-400" />
                      <span className="text-xs font-mono text-amber-400">
                        Isso irá substituir os grupos existentes.
                      </span>
                    </div>
                  )}
                  <button onClick={tentarGerar}
                    className="w-full py-3 bg-primary/10 hover:bg-primary/20 border border-primary/40
                               hover:border-primary text-primary font-mono text-sm tracking-widest
                               rounded-lg transition-all uppercase">
                    Continuar
                    <ChevronRight size={16} className="inline ml-2" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal confirmação gerar */}
      <AnimatePresence>
        {modalConfirmarGerar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalConfirmarGerar(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-sm p-6
                              pointer-events-auto shadow-2xl flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-400" />
                    <h3 className="font-mono text-sm tracking-widest uppercase text-white">Confirmar Geração</h3>
                  </div>
                  <p className="text-muted-foreground text-sm font-mono leading-relaxed">
                    Serão gerados <span className="text-primary">{qtdUsuarios} usuários</span> e
                    distribuídos automaticamente em grupos. Esta ação não pode ser desfeita.
                    Tem certeza?
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setModalConfirmarGerar(false)}
                    className="px-4 py-2 border border-border text-muted-foreground font-mono text-xs
                               tracking-widest rounded-lg hover:bg-secondary transition-all uppercase">
                    Cancelar
                  </button>
                  <button onClick={confirmarGerar}
                    className="px-4 py-2 border border-primary/40 bg-primary/10 text-primary
                               hover:bg-primary/20 font-mono text-xs tracking-widest rounded-lg
                               transition-all uppercase">
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal credenciais */}
      <AnimatePresence>
        {modalCredenciais && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalCredenciais(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-2xl
                              max-h-[85vh] flex flex-col pointer-events-auto shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/40">
                  <div>
                    <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">Acesso Restrito</p>
                    <h3 className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                      Credenciais Geradas
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-3 py-1.5 border border-border text-muted-foreground
                                 hover:text-foreground hover:border-primary/40 font-mono text-xs tracking-widest
                                 rounded-lg transition-all uppercase">
                      <Printer size={14} /> Imprimir
                    </button>
                    <button onClick={() => setModalCredenciais(false)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 bg-[#0f0f14]">
                  {/* Agrupado por grupo */}
                  {grupos.map(grupo => (
                    <div key={grupo.id} className="border-b border-white/5 last:border-0">
                      <div className="px-6 py-3 bg-black/20 flex items-center justify-between">
                        <span className="text-xs font-mono text-primary/70 tracking-widest uppercase">
                          {grupo.nome}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {grupo.avaliadorNome}
                        </span>
                      </div>
                      <div className="px-6 py-3 grid grid-cols-2 gap-2">
                        {grupo.membros.map(m => (
                          <div key={m.id} className="flex items-center justify-between px-3 py-2
                                                      bg-black/20 border border-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Shield size={13} className="text-primary/60" />
                              <span className="font-mono text-sm text-foreground">{m.login}</span>
                            </div>
                            <span className="font-mono text-sm text-muted-foreground tracking-widest">
                              {m.senha}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal adicionar um usuário */}
      <AnimatePresence>
        {modalAdicionarUm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalAdicionarUm(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-sm p-6
                              pointer-events-auto shadow-2xl flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <UserPlus size={18} className="text-primary" />
                    <h3 className="font-mono text-sm tracking-widest uppercase text-white">
                      Adicionar Usuário
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm font-mono leading-relaxed">
                    {grupos.some(g => g.membros.length === 3)
                      ? 'Um novo usuário será adicionado ao primeiro grupo com 3 membros.'
                      : 'Dois membros de grupos existentes formarão um novo grupo com o novo usuário.'
                    }
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setModalAdicionarUm(false)}
                    className="px-4 py-2 border border-border text-muted-foreground font-mono text-xs
                               tracking-widest rounded-lg hover:bg-secondary transition-all uppercase">
                    Cancelar
                  </button>
                  <button onClick={adicionarUmUsuario}
                    className="px-4 py-2 border border-primary/40 bg-primary/10 text-primary
                               hover:bg-primary/20 font-mono text-xs tracking-widest rounded-lg
                               transition-all uppercase">
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal transferir grupo */}
      <AnimatePresence>
        {modalTransferir && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalTransferir(null)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-sm p-6
                              pointer-events-auto shadow-2xl flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm tracking-widest uppercase text-white">
                    Transferir Grupo
                  </h3>
                  <button onClick={() => setModalTransferir(null)}
                    className="p-1.5 rounded text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-muted-foreground text-sm font-mono">
                  Escolha o avaliador que receberá este grupo:
                </p>
                <div className="flex flex-col gap-2">
                  {mockAvaliadores
                    .filter(av => av.id !== grupos.find(g => g.id === modalTransferir)?.avaliadorId)
                    .map(av => (
                      <button key={av.id}
                        onClick={() => transferirGrupo(modalTransferir, av.id)}
                        className="flex items-center justify-between px-4 py-3 border border-border
                                   hover:border-primary/40 hover:bg-primary/5 rounded-lg transition-all group">
                        <span className="text-sm font-mono text-foreground">{av.nome}</span>
                        <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    ))
                  }
                </div>
              </div>
            </motion.div>
          </>
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