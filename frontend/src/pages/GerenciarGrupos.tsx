import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Key, Lock, Unlock, CheckCircle, X,
  AlertTriangle, RefreshCw, UserPlus, Search, ClipboardList, Trash2,
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
import ModalConfirmarConclusao from '../components/grupos/ModalConfirmarConclusao'
import ModalGerando from '../components/grupos/ModalGerando'
import {
  listarTodosGrupos, gerarUsuarios, transferirGrupo as transferirGrupoApi,
  adicionarMembro, excluirUsuario, excluirGrupo, listarLogExclusoesGrupos,
  listarCredenciais, reorganizarMembros, adquirirLock, liberarLock, statusLock,
  renomearGrupoAvaliador, listarAvaliadores,
} from '../api/gruposApi'
import type { CredencialAPI, LogExclusaoUsuarioAPI, AvaliadorAPI } from '../api/gruposApi'
import { useAuthStore } from '../store/authStore'

type FiltroView = 'todos' | 'meus' | 'outros'

// Exclusão de usuário individual pendente
type PendingUserDeletion = {
  usuario: Usuario
  grupoId: string
  grupoNome: string
  motivo: string
}

// Exclusão de grupo inteiro pendente (inclui snapshot dos membros para exibição e restauração)
type PendingGroupDeletion = {
  grupo: Grupo
  motivo: string
  indiceOriginal: number
}

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

  const [avaliadores, setAvaliadores] = useState<AvaliadorAPI[]>([])
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

  // Filas de exclusão pendentes (só executadas ao Concluir)
  const [pendingUsers, setPendingUsers] = useState<PendingUserDeletion[]>([])
  const [pendingGroups, setPendingGroups] = useState<PendingGroupDeletion[]>([])

  // Modais
  const [modalGerar, setModalGerar] = useState(false)
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [modalCredenciais, setModalCredenciais] = useState(false)
  const [modalAdicionarUm, setModalAdicionarUm] = useState(false)
  const [modalTransferir, setModalTransferir] = useState<string | null>(null)

  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<{ usuario: Usuario; grupoNome: string } | null>(null)
  const [excluindoUsuario, setExcluindoUsuario] = useState(false)
  const [grupoParaExcluir, setGrupoParaExcluir] = useState<Grupo | null>(null)
  const [excluindoGrupo, setExcluindoGrupo] = useState(false)
  const [modalLog, setModalLog] = useState(false)
  const [logs, setLogs] = useState<LogExclusaoUsuarioAPI[]>([])
  const [modalConfirmarConclusao, setModalConfirmarConclusao] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const editandoRef = useRef(false)
  useEffect(() => { editandoRef.current = editando }, [editando])

  // Bug 5: libera o lock se o avaliador navegar para outra página enquanto edita
  useEffect(() => {
    return () => {
      if (editandoRef.current) {
        liberarLock().catch(() => {})
      }
    }
  }, [])

  // Polling do lock compartilhado
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
    listarAvaliadores().then(setAvaliadores).catch(() => {/* ignora */})
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
    try { await carregarCredenciais() } finally { setCarregandoCredenciais(false) }
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
    setModalConfirmar(false)
    setGerando(true)
    try {
      const qtd = parseInt(qtdUsuarios)
      const resultado = await gerarUsuarios(qtd)
      await Promise.all([carregarGrupos(), carregarCredenciais()])
      setQtdUsuarios('')
      mostrarToast(`${resultado.usuarios_criados} usuários gerados em ${resultado.grupos_criados} grupos!`, 'ok')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      mostrarToast(e?.response?.data?.detail ?? 'Erro ao gerar usuários.', 'erro')
    } finally {
      setGerando(false)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    setPendingUsers([])
    setPendingGroups([])
    try { await liberarLock() } catch { /* ignora */ }
  }

  function tentarConcluir() {
    if (pendingUsers.length > 0 || pendingGroups.length > 0) {
      setModalConfirmarConclusao(true)
    } else {
      executarConclusao()
    }
  }

  async function executarConclusao() {
    setModalConfirmarConclusao(false)
    if (!gruposSnapshot) {
      setEditando(false)
      setLockEdicao(null)
      setPendingUsers([])
      setPendingGroups([])
      try { await liberarLock() } catch { /* ignora */ }
      return
    }

    setSalvando(true)

    // Captura os valores das filas antes de qualquer await (fechamento estável para os toasts)
    const usersParaExcluir = [...pendingUsers]
    const gruposParaExcluir = [...pendingGroups]
    const houveLimpeza = usersParaExcluir.length > 0 || gruposParaExcluir.length > 0

    // 1. Exclusões de usuários individuais
    // Rastreia os já excluídos para não repetir em caso de retry
    const idsUserExcluidos = new Set<string>()
    for (const pending of usersParaExcluir) {
      try {
        await excluirUsuario(parseInt(pending.usuario.id), pending.motivo)
        idsUserExcluidos.add(pending.usuario.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        // Remove da fila apenas os que já foram excluídos com sucesso
        setPendingUsers(prev => prev.filter(p => !idsUserExcluidos.has(p.usuario.id)))
        mostrarToast(
          `Erro ao excluir ${pending.usuario.login}: ${e?.response?.data?.detail ?? 'erro desconhecido'}`,
          'erro'
        )
        setSalvando(false)
        return
      }
    }
    setPendingUsers([])

    // 2. Reorganização via DnD — ANTES das exclusões de grupo para evitar que membros
    //    movidos para fora de um grupo deletado sejam apagados junto com ele no banco
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
      try {
        await reorganizarMembros(movimentos)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        mostrarToast(e?.response?.data?.detail ?? 'Erro ao salvar reorganização.', 'erro')
        await carregarGrupos()
        setSalvando(false)
        return
      }
    }

    // 3. Exclusões de grupos inteiros — depois da reorganização para que membros
    //    movidos para fora já estejam em outro grupo no banco
    const idsGrupoExcluidos = new Set<string>()
    for (const pending of gruposParaExcluir) {
      try {
        await excluirGrupo(parseInt(pending.grupo.id), pending.motivo)
        idsGrupoExcluidos.add(pending.grupo.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setPendingGroups(prev => prev.filter(p => !idsGrupoExcluidos.has(p.grupo.id)))
        mostrarToast(
          `Erro ao excluir grupo ${pending.grupo.nome}: ${e?.response?.data?.detail ?? 'erro desconhecido'}`,
          'erro'
        )
        await carregarGrupos()
        setSalvando(false)
        return
      }
    }
    setPendingGroups([])

    // Recarrega e exibe resultado
    await Promise.all([carregarGrupos(), carregarCredenciais()])

    const partes: string[] = []
    if (movimentos.length > 0) partes.push(`${movimentos.length} membro(s) realocado(s)`)
    if (houveLimpeza) partes.push('exclusões aplicadas')
    if (partes.length > 0) mostrarToast(`${partes.join(' e ')} com sucesso!`, 'ok')

    setSalvando(false)
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

    if (editando) {
      const grupoAtual = grupos.find(g => g.membros.some(m => m.id === usuarioParaExcluir.usuario.id))
      setPendingUsers(prev => [...prev, {
        usuario: usuarioParaExcluir.usuario,
        grupoId: grupoAtual?.id ?? usuarioParaExcluir.usuario.grupoId,
        grupoNome: usuarioParaExcluir.grupoNome,
        motivo,
      }])
      setGrupos(prev => prev.map(g => ({
        ...g,
        membros: g.membros.filter(m => m.id !== usuarioParaExcluir.usuario.id),
      })))
      setUsuarioParaExcluir(null)
      return
    }

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

  function desfazerExclusaoUsuario(usuarioId: string) {
    const pending = pendingUsers.find(p => p.usuario.id === usuarioId)
    if (!pending) return

    // Bug 4: o grupo de destino pode estar ele mesmo na fila de exclusão.
    // Nesse caso, não tem como restaurar o usuário — o grupo não existe mais no estado.
    const grupoEstaSendoExcluido = pendingGroups.some(pg => pg.grupo.id === pending.grupoId)
    if (grupoEstaSendoExcluido) {
      mostrarToast(
        `O grupo "${pending.grupoNome}" também está sendo excluído. Desfaça a exclusão do grupo primeiro.`,
        'erro'
      )
      return
    }

    setGrupos(prev => prev.map(g =>
      g.id === pending.grupoId ? { ...g, membros: [...g.membros, pending.usuario] } : g
    ))
    setPendingUsers(prev => prev.filter(p => p.usuario.id !== usuarioId))
  }

  // ── Exclusão de grupo ─────────────────────────────────────────
  async function confirmarExcluirGrupo(motivo: string) {
    if (!grupoParaExcluir) return

    if (editando) {
      // Captura os membros atuais do grupo (inclui quem foi movido via DnD)
      const grupoComMembrosAtuais = grupos.find(g => g.id === grupoParaExcluir.id) ?? grupoParaExcluir
      const indiceOriginal = grupos.findIndex(g => g.id === grupoParaExcluir.id)

      setPendingGroups(prev => [...prev, { grupo: grupoComMembrosAtuais, motivo, indiceOriginal }])

      // Remove o grupo da view
      setGrupos(prev => prev.filter(g => g.id !== grupoParaExcluir.id))
      setGrupoParaExcluir(null)
      return
    }

    setExcluindoGrupo(true)
    try {
      await excluirGrupo(parseInt(grupoParaExcluir.id), motivo)
      const remover = (gs: Grupo[]) => gs.filter(g => g.id !== grupoParaExcluir.id)
      setGrupos(remover)
      if (gruposSnapshot) setGruposSnapshot(remover(gruposSnapshot))
      mostrarToast(`Grupo ${grupoParaExcluir.nome} excluído.`, 'ok')
      setGrupoParaExcluir(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      mostrarToast(e?.response?.data?.detail ?? 'Erro ao excluir grupo.', 'erro')
    } finally {
      setExcluindoGrupo(false)
    }
  }

  function desfazerExclusaoGrupo(grupoId: string) {
    const pending = pendingGroups.find(p => p.grupo.id === grupoId)
    if (!pending) return
    setGrupos(prev => {
      const novo = [...prev]
      // Reinsere na posição original; se a lista encolheu usa o fim
      const pos = Math.min(pending.indiceOriginal, novo.length)
      novo.splice(pos, 0, pending.grupo)
      return novo
    })
    setPendingGroups(prev => prev.filter(p => p.grupo.id !== grupoId))
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

      if (editando) {
        // Durante edição: atualiza só o dono no estado local para não apagar
        // as movimentações de DnD não salvas ainda
        const avNovo = avaliadores.find(a => a.id.toString() === avId)
        const atualizarDono = (g: Grupo) =>
          g.id === grupoId ? { ...g, avaliadorId: avId, avaliadorNome: avNovo?.login ?? avId } : g
        setGrupos(prev => prev.map(atualizarDono))
        setGruposSnapshot(prev => prev ? prev.map(atualizarDono) : null)
      } else {
        await carregarGrupos()
      }

      setModalTransferir(null)
      mostrarToast('Grupo transferido!', 'ok')
    } catch {
      mostrarToast('Erro ao transferir grupo.', 'erro')
    }
  }

  // ── Renomear grupo (avaliador) ────────────────────────────────
  async function renomearGrupo(grupoId: string, novoNome: string) {
    try {
      await renomearGrupoAvaliador(parseInt(grupoId), novoNome)
      const atualizarNome = (g: Grupo) => g.id === grupoId ? { ...g, nome: novoNome } : g
      setGrupos(prev => prev.map(atualizarNome))
      setGruposSnapshot(prev => prev ? prev.map(atualizarNome) : null)
      mostrarToast('Nome do grupo atualizado!', 'ok')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      mostrarToast(e?.response?.data?.detail ?? 'Erro ao renomear grupo.', 'erro')
    }
  }

  const usuarioAtivo = grupos.flatMap(g => g.membros).find(m => m.id === activeId)
  const podeGerar = !ultimaGeracao || (Date.now() - ultimaGeracao.getTime()) / 36e5 >= 24
  const grupoInvalido = grupos.some(g => g.membros.length < 3 || g.membros.length > 4)
  const totalPendente = pendingUsers.length + pendingGroups.length

  // ── Tela de carregamento ──────────────────────────────────────
  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-full" style={{ backgroundColor: '#0d0d0f' }}>
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

        {/* Barra de status da edição + filas de exclusão */}
        {grupos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col gap-3"
          >
            {/* Banner principal de edição */}
            <div className={`flex items-center justify-between px-5 py-3 rounded-xl border transition-all
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
                    <span className="text-sm font-mono text-primary">
                      Modo de edição ativo — arraste membros, renomeie ou exclua
                    </span></>
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
                      onClick={tentarConcluir}
                      disabled={salvando || grupoInvalido}
                      title={grupoInvalido ? 'Todos os grupos precisam ter entre 3 e 4 membros' : undefined}
                      className={`flex items-center gap-2 px-4 py-1.5 border font-mono text-xs
                                 tracking-widest rounded-lg transition-all uppercase
                                 ${salvando || grupoInvalido
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
            </div>

            {/* Fila de exclusões pendentes */}
            {editando && totalPendente > 0 && (
              <div className="px-5 py-4 rounded-xl border border-destructive/30 bg-destructive/5">
                <p className="text-xs font-mono text-destructive/60 uppercase tracking-widest mb-3">
                  Aguardando exclusão ao concluir ({totalPendente}):
                </p>
                <div className="flex flex-col gap-2">

                  {/* Grupos pendentes com seus membros */}
                  {pendingGroups.map(pg => (
                    <div key={pg.grupo.id}
                      className="rounded-lg border border-destructive/20 bg-destructive/10 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Users size={13} className="text-destructive/70 flex-shrink-0" />
                          <span className="text-sm font-mono text-destructive/90 font-semibold">
                            {pg.grupo.nome}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">
                            — {pg.grupo.membros.length} membro{pg.grupo.membros.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => desfazerExclusaoGrupo(pg.grupo.id)}
                          className="text-xs font-mono text-muted-foreground hover:text-foreground
                                     px-2 py-0.5 rounded hover:bg-white/5 transition-all flex-shrink-0"
                        >
                          desfazer
                        </button>
                      </div>
                      {pg.grupo.membros.length > 0 && (
                        <div className="px-3 pb-2 flex flex-wrap gap-x-3 gap-y-0.5 border-t border-destructive/15 pt-1.5">
                          {pg.grupo.membros.map(m => (
                            <span key={m.id} className="text-xs font-mono text-muted-foreground">
                              {m.login}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Usuários individuais pendentes */}
                  {pendingUsers.map(p => (
                    <div key={p.usuario.id}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg
                                 bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-2">
                        <Trash2 size={12} className="text-destructive/60 flex-shrink-0" />
                        <span className="text-sm font-mono text-destructive/80">
                          {p.usuario.login}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          ({p.grupoNome})
                        </span>
                      </div>
                      <button
                        onClick={() => desfazerExclusaoUsuario(p.usuario.id)}
                        className="text-xs font-mono text-muted-foreground hover:text-foreground
                                   px-2 py-0.5 rounded hover:bg-white/5 transition-all"
                      >
                        desfazer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Estado vazio */}
        {grupos.length === 0 && !editando && (
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
                  onRenomear={renomearGrupo}
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
        {gerando && <ModalGerando />}
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
          <ModalTransferir
            grupoId={modalTransferir}
            grupos={grupos}
            avaliadores={avaliadores}
            onTransferir={transferirGrupo}
            onFechar={() => setModalTransferir(null)}
          />
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
          <ModalLogExclusoesGrupos logs={logs} onFechar={() => setModalLog(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalConfirmarConclusao && (
          <ModalConfirmarConclusao
            grupos={pendingGroups.map(pg => ({
              id: pg.grupo.id,
              nome: pg.grupo.nome,
              membros: pg.grupo.membros.map(m => ({ login: m.login })),
            }))}
            usuarios={pendingUsers.map(p => ({
              login: p.usuario.login,
              grupoNome: p.grupoNome,
            }))}
            onConfirmar={executarConclusao}
            onCancelar={() => setModalConfirmarConclusao(false)}
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
