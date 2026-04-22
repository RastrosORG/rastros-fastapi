import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Key, Lock, Unlock, CheckCircle, X,
  AlertTriangle, RefreshCw, UserPlus, Search, ClipboardList
} from 'lucide-react'
import {
  DndContext, PointerSensor, useSensor, useSensors, DragOverlay, closestCenter
} from '@dnd-kit/core'
import type { DragOverEvent, DragStartEvent } from '@dnd-kit/core'

import GrupoCard, { type Grupo } from '../components/grupos/GrupoCard'
import type { Usuario } from '../components/grupos/MembroCard'
import ModalGerarUsuarios from '../components/grupos/ModalGerarUsuarios'
import ModalConfirmarGerar from '../components/grupos/ModalConfirmarGerar'
import ModalCredenciais from '../components/grupos/ModalCredenciais'
import ModalAdicionarUm from '../components/grupos/ModalAdicionarUm'
import ModalTransferir from '../components/grupos/ModalTransferir'
import ModalConfirmarExclusaoUsuario from '../components/grupos/ModalConfirmarExclusaoUsuario'
import ModalConfirmarExclusaoGrupo from '../components/grupos/ModalConfirmarExclusaoGrupo'
import ModalLogExclusoesGrupos from '../components/grupos/ModalLogExclusoesGrupos'
import {
  listarTodosGrupos, gerarUsuarios, transferirGrupo as transferirGrupoApi,
  adicionarMembro, excluirUsuario, excluirGrupo, listarLogExclusoesGrupos,
  listarCredenciais, reorganizarMembros, adquirirLock, liberarLock, statusLock,
} from '../api/gruposApi'
import type { CredencialAPI, LogExclusaoUsuarioAPI } from '../api/gruposApi'
import { useAuthStore } from '../store/authStore'

type FiltroView = 'todos' | 'meus' | 'outros'

export default function GerenciarGrupos() {
  const usuario = useAuthStore(s => s.usuario)
  const avaliadorId = usuario?.id.toString() ?? ''
  const avaliadorNome = usuario?.login ?? ''

  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [todasCredenciais, setTodasCredenciais] = useState<CredencialAPI[]>(() => {
    try {
      const cache = localStorage.getItem('rastros_credenciais_cache')
      if (!cache) return []
      return (JSON.parse(cache) as { data: CredencialAPI[] }).data
    } catch { return [] }
  })
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(() => {
    try {
      const cache = localStorage.getItem('rastros_credenciais_cache')
      if (!cache) return null
      return (JSON.parse(cache) as { ultima_atualizacao: string | null }).ultima_atualizacao
    } catch { return null }
  })

  const [ultimaGeracao] = useState<Date | null>(null)
  const [lockEdicao, setLockEdicao] = useState<{ avaliadorId: string; avaliadorNome: string } | null>(null)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [carregandoCredenciais, setCarregandoCredenciais] = useState(false)
  const [gruposSnapshot, setGruposSnapshot] = useState<Grupo[] | null>(null)
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

  // Exclusão de usuário
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<{ usuario: Usuario; grupoNome: string } | null>(null)
  const [excluindoUsuario, setExcluindoUsuario] = useState(false)
  // Exclusão de grupo
  const [grupoParaExcluir, setGrupoParaExcluir] = useState<Grupo | null>(null)
  const [excluindoGrupo, setExcluindoGrupo] = useState(false)
  // Log de exclusões
  const [modalLog, setModalLog] = useState(false)
  const [logs, setLogs] = useState<LogExclusaoUsuarioAPI[]>([])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const editandoRef = useRef(false)
  useEffect(() => { editandoRef.current = editando }, [editando])

  // Polling do lock compartilhado — mantém todos os avaliadores sincronizados
  useEffect(() => {
    async function verificarLock() {
      try {
        const status = await statusLock()
        if (status.bloqueado && status.avaliador_id !== null) {
          setLockEdicao({ avaliadorId: status.avaliador_id.toString(), avaliadorNome: status.avaliador_nome ?? '' })
        } else if (!editandoRef.current) {
          setLockEdicao(null)
        }
      } catch { /* ignora erros de rede */ }
    }
    verificarLock()
    const intervalo = setInterval(verificarLock, 8000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    carregarGrupos()
  }, [])

  async function carregarGrupos() {
    try {
      setCarregando(true)
      const dados = await listarTodosGrupos()
      setGrupos(dados.map(g => ({
        id: g.id.toString(),
        nome: g.nome_custom || g.nome,
        avaliadorId: g.avaliador_id.toString(),
        avaliadorNome: g.avaliador_nome,
        membros: g.membros.map(m => ({
          id: m.usuario.id.toString(),
          login: m.usuario.login,
          nome_custom: m.usuario.nome_custom,
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

  async function carregarCredenciais() {
    try {
      const resultado = await listarCredenciais()
      setTodasCredenciais(resultado.credenciais)
      setUltimaAtualizacao(resultado.ultima_atualizacao)
      localStorage.setItem('rastros_credenciais_cache', JSON.stringify({
        data: resultado.credenciais,
        ultima_atualizacao: resultado.ultima_atualizacao,
      }))
    } catch (e) {
      console.error('Erro ao carregar credenciais:', e)
    }
  }

  async function abrirModalCredenciais() {
    setModalCredenciais(true)
    setCarregandoCredenciais(true)
    try {
      await carregarCredenciais()
    } finally {
      setCarregandoCredenciais(false)
    }
  }

  function mostrarToast(msg: string, tipo: 'ok' | 'erro') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Filtro + busca ────────────────────────────────────────────
  const gruposFiltrados = grupos
    .filter(g => {
      if (filtro === 'meus') return g.avaliadorId === avaliadorId
      if (filtro === 'outros') return g.avaliadorId !== avaliadorId
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
      await Promise.all([carregarGrupos(), carregarCredenciais()])
      setModalConfirmar(false)
      setQtdUsuarios('')
      mostrarToast(`${resultado.usuarios_criados} usuários gerados em ${resultado.grupos_criados} grupos!`, 'ok')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      mostrarToast(e?.response?.data?.detail ?? 'Erro ao gerar usuários.', 'erro')
      setModalConfirmar(false)
    }
  }

  // ── Adicionar um usuário ──────────────────────────────────────
  async function adicionarUmUsuario() {
    try {
      await adicionarMembro()
      await Promise.all([carregarGrupos(), carregarCredenciais()])
      setModalAdicionarUm(false)
      mostrarToast('Usuário adicionado!', 'ok')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      mostrarToast(e?.response?.data?.detail ?? 'Erro ao adicionar usuário.', 'erro')
      setModalAdicionarUm(false)
    }
  }

  // ── Lock de edição ────────────────────────────────────────────
  async function ativarEdicao() {
    try {
      await adquirirLock()
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      const nome = detail?.avaliador_nome ?? 'Outro avaliador'
      mostrarToast(`Aguarde. ${nome} está editando os grupos no momento.`, 'erro')
      return
    }
    setGruposSnapshot(grupos.map(g => ({ ...g, membros: [...g.membros] })))
    setLockEdicao({ avaliadorId, avaliadorNome })
    setEditando(true)
  }

  async function cancelarEdicao() {
    if (gruposSnapshot) setGrupos(gruposSnapshot)
    setGruposSnapshot(null)
    setLockEdicao(null)
    setEditando(false)
    try { await liberarLock() } catch { /* ignora */ }
  }

  async function concluirEdicao() {
    if (!gruposSnapshot) {
      setEditando(false)
      setLockEdicao(null)
      try { await liberarLock() } catch { /* ignora */ }
      return
    }

    // Detecta membros que trocaram de grupo
    const movimentos: { usuario_id: number; grupo_id: number }[] = []
    for (const grupo of grupos) {
      for (const membro of grupo.membros) {
        const grupoAntes = gruposSnapshot.find(g => g.membros.some(m => m.id === membro.id))
        if (grupoAntes && grupoAntes.id !== grupo.id) {
          movimentos.push({ usuario_id: parseInt(membro.id), grupo_id: parseInt(grupo.id) })
        }
      }
    }

    if (movimentos.length > 0) {
      setSalvando(true)
      try {
        await reorganizarMembros(movimentos)
        await Promise.all([carregarGrupos(), carregarCredenciais()])
        mostrarToast(`${movimentos.length} membro(s) realocado(s) com sucesso!`, 'ok')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        mostrarToast(e?.response?.data?.detail ?? 'Erro ao salvar mudanças.', 'erro')
        await carregarGrupos()
        setSalvando(false)
        return
      }
      setSalvando(false)
    }

    setGruposSnapshot(null)
    setLockEdicao(null)
    setEditando(false)
    try { await liberarLock() } catch { /* ignora */ }
  }

  // ── Drag and drop ─────────────────────────────────────────────
  function onDragStart(e: DragStartEvent) { setActiveId(e.active.id as string) }

  const onDragOver = useCallback((e: DragOverEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setGrupos(prev => {
      const origem = prev.find(g => g.membros.some(m => m.id === active.id))
      const destino = prev.find(g => g.membros.some(m => m.id === over.id) || `grupo-${g.id}` === over.id)
      if (!origem || !destino || origem.id === destino.id) return prev
      const membro = origem.membros.find(m => m.id === active.id)!
      return prev.map(g => {
        if (g.id === origem.id) return { ...g, membros: g.membros.filter(m => m.id !== active.id) }
        if (g.id === destino.id) return { ...g, membros: [...g.membros, { ...membro, grupoId: g.id }] }
        return g
      })
    })
  }, [])

  function onDragEnd() { setActiveId(null) }

  // ── Exclusão de usuário ───────────────────────────────────────
  async function confirmarExcluirUsuario(motivo: string) {
    if (!usuarioParaExcluir) return
    setExcluindoUsuario(true)
    try {
      await excluirUsuario(parseInt(usuarioParaExcluir.usuario.id), motivo)
      await carregarGrupos()
      mostrarToast(`Usuário ${usuarioParaExcluir.usuario.login} excluído.`, 'ok')
      setUsuarioParaExcluir(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      mostrarToast(e?.response?.data?.detail ?? 'Erro ao excluir usuário.', 'erro')
    } finally {
      setExcluindoUsuario(false)
    }
  }

  // ── Exclusão de grupo ─────────────────────────────────────────
  async function confirmarExcluirGrupo(motivo: string) {
    if (!grupoParaExcluir) return
    setExcluindoGrupo(true)
    try {
      await excluirGrupo(parseInt(grupoParaExcluir.id), motivo)
      await carregarGrupos()
      mostrarToast(`Grupo ${grupoParaExcluir.nome} excluído.`, 'ok')
      setGrupoParaExcluir(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      mostrarToast(e?.response?.data?.detail ?? 'Erro ao excluir grupo.', 'erro')
    } finally {
      setExcluindoGrupo(false)
    }
  }

  // ── Log de exclusões ──────────────────────────────────────────
  async function abrirLog() {
    try {
      const dados = await listarLogExclusoesGrupos()
      setLogs(dados)
      setModalLog(true)
    } catch {
      mostrarToast('Erro ao carregar log.', 'erro')
    }
  }

  // ── Transferir grupo ──────────────────────────────────────────
  async function transferirGrupo(grupoId: string, avId: string) {
    try {
      await transferirGrupoApi(parseInt(grupoId), parseInt(avId))
      await carregarGrupos()
      setModalTransferir(null)
      mostrarToast('Grupo transferido!', 'ok')
    } catch {
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
            {grupos.length > 0 && (
              <button onClick={abrirLog}
                className="flex items-center gap-2 px-4 py-2 border border-border text-muted-foreground
                           hover:text-foreground hover:border-primary/40 font-mono text-xs tracking-widest
                           rounded-lg transition-all uppercase">
                <ClipboardList size={15} /> Log Exclusões
              </button>
            )}
            {grupos.length > 0 && (
              <button onClick={abrirModalCredenciais}
                className="flex items-center gap-2 px-4 py-2 border border-border text-muted-foreground
                           hover:text-foreground hover:border-primary/40 font-mono text-xs tracking-widest
                           rounded-lg transition-all uppercase">
                <Key size={15} /> Credenciais{todasCredenciais.length > 0 ? ` (${todasCredenciais.length})` : ''}
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
                : lockEdicao && lockEdicao.avaliadorId !== avaliadorId
                  ? 'bg-destructive/5 border-destructive/30'
                  : 'bg-card border-border'
              }`}
          >
            <div className="flex items-center gap-3">
              {editando ? (
                <><Unlock size={16} className="text-primary" />
                  <span className="text-sm font-mono text-primary">Modo de edição ativo — arraste membros entre grupos</span></>
              ) : lockEdicao && lockEdicao.avaliadorId !== avaliadorId ? (
                <><Lock size={16} className="text-destructive" />
                  <span className="text-sm font-mono text-destructive">{lockEdicao.avaliadorNome} está editando agora</span></>
              ) : (
                <><Lock size={16} className="text-muted-foreground" />
                  <span className="text-sm font-mono text-muted-foreground">Edição bloqueada — ative para reorganizar</span></>
              )}
            </div>
            {(!lockEdicao || lockEdicao.avaliadorId === avaliadorId) && (
              editando ? (
                <div className="flex items-center gap-2">
                  <button onClick={cancelarEdicao} disabled={salvando}
                    className="flex items-center gap-2 px-4 py-1.5 border border-border
                               text-muted-foreground hover:text-foreground hover:border-primary/40
                               font-mono text-xs tracking-widest rounded-lg transition-all uppercase
                               disabled:opacity-40">
                    <X size={13} /> Cancelar
                  </button>
                  <button
                    onClick={concluirEdicao}
                    disabled={salvando || grupos.some(g => g.membros.length < 3 || g.membros.length > 4)}
                    title={grupos.some(g => g.membros.length < 3 || g.membros.length > 4)
                      ? 'Todos os grupos precisam ter entre 3 e 4 membros' : undefined}
                    className={`flex items-center gap-2 px-4 py-1.5 border font-mono text-xs
                               tracking-widest rounded-lg transition-all uppercase
                               ${salvando || grupos.some(g => g.membros.length < 3 || g.membros.length > 4)
                                 ? 'border-destructive/30 bg-destructive/5 text-destructive/40 cursor-not-allowed'
                                 : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                               }`}>
                    <CheckCircle size={13} />
                    {salvando ? 'Salvando...' : 'Concluir'}
                  </button>
                </div>
              ) : (
                <button onClick={ativarEdicao}
                  className="flex items-center gap-2 px-4 py-1.5 border border-border
                             text-muted-foreground hover:border-primary/40 hover:text-foreground
                             font-mono text-xs tracking-widest rounded-lg transition-all uppercase">
                  <Unlock size={13} /> Editar
                </button>
              )
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
                <GrupoCard
                  key={grupo.id}
                  grupo={grupo}
                  editando={editando}
                  index={i}
                  onTransferir={id => setModalTransferir(id)}
                  onExcluirGrupo={g => setGrupoParaExcluir(g)}
                  onExcluirMembro={(u, grupoNome) => setUsuarioParaExcluir({ usuario: u, grupoNome })}
                />
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
                  <span className="text-sm font-mono text-foreground">
                    {usuarioAtivo.nome_custom ? `${usuarioAtivo.nome_custom} (${usuarioAtivo.login})` : usuarioAtivo.login}
                  </span>
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
          <ModalCredenciais
            credenciais={todasCredenciais}
            ultimaAtualizacao={ultimaAtualizacao}
            carregandoInicial={carregandoCredenciais}
            onFechar={() => setModalCredenciais(false)}
            onAtualizar={carregarCredenciais}
          />
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

      <AnimatePresence>
        {usuarioParaExcluir && (
          <ModalConfirmarExclusaoUsuario
            login={usuarioParaExcluir.usuario.login}
            grupoNome={usuarioParaExcluir.grupoNome}
            carregando={excluindoUsuario}
            onConfirmar={confirmarExcluirUsuario}
            onCancelar={() => setUsuarioParaExcluir(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {grupoParaExcluir && (
          <ModalConfirmarExclusaoGrupo
            grupoNome={grupoParaExcluir.nome}
            membros={grupoParaExcluir.membros}
            carregando={excluindoGrupo}
            onConfirmar={confirmarExcluirGrupo}
            onCancelar={() => setGrupoParaExcluir(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalLog && (
          <ModalLogExclusoesGrupos
            logs={logs}
            onFechar={() => setModalLog(false)}
          />
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