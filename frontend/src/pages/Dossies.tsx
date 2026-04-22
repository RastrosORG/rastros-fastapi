import { useState, lazy, Suspense, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Paperclip, ChevronRight, CheckCircle, Clock, Lock, Plus, Pencil, Archive, MapPin, Calendar, MessageSquare, FileSearch, X, Trash2, ClipboardList } from 'lucide-react'
import type { Variants } from 'framer-motion'
import { User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useTimerStore } from '../store/timerStore'
import { listarDossies, criarDossie, atualizarDossie, arquivarDossie, excluirDossie, listarLogExclusoes, uploadArquivoDossie, uploadFotoDossie } from '../api/dossiesApi'
import type { LogExclusaoAPI } from '../api/dossiesApi'
import { enviarResposta as enviarRespostaAPI } from '../api/respostasApi'

// ── Lazy loading dos modais exclusivos ─────────────────────────
const ModalRespostaUsuario = lazy(() => import('../components/dossies/ModalRespostaUsuario'))
const ModalGerenciarAvaliador = lazy(() => import('../components/dossies/ModalGerenciarAvaliador'))
const ModalFoto = lazy(() => import('../components/dossies/ModalFoto'))
const ModalMapa = lazy(() => import('../components/dossies/ModalMapa'))
const ModalDetalhesDossie = lazy(() => import('../components/dossies/ModalDetalhesDossie'))
const ModalConfirmarExclusao = lazy(() => import('../components/dossies/ModalConfirmarExclusao'))
const ModalLogExclusoes = lazy(() => import('../components/dossies/ModalLogExclusoes'))

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const mesAtual = hoje.getMonth()
  const mesNasc = nascimento.getMonth()
  if (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < nascimento.getDate())) {
    idade--
  }
  return idade
}

interface ArquivoDossie {
  id: number
  nome_arquivo: string
  url_s3: string
}

interface Dossie {
  id: number
  nome: string
  descricao: string
  data_nascimento?: string
  data_desaparecimento: string
  local: string
  coordenadas?: string
  foto?: string
  arquivos: ArquivoDossie[]
  arquivosAvaliador: string[]
  equipes: string[]
  respostas: number
  status: 'ativo' | 'arquivado'
}

interface FormResposta {
  titulo: string
  descricao: string
  link: string
  categoria: string
  arquivos: File[]
}

interface FormDossie {
  nome: string
  descricao: string
  data_nascimento: string
  data_desaparecimento: string
  local: string
  coordenadas: string
  foto?: File | null
  arquivosAvaliador: File[]
}

const formRespostaVazio: FormResposta = { titulo: '', descricao: '', link: '', categoria: '', arquivos: [] }
const formDossieVazio: FormDossie = {
  nome: '', descricao: '', data_nascimento: '',
  data_desaparecimento: '', local: '', coordenadas: '',
  foto: null, arquivosAvaliador: []
}

// ── Fundo compartilhado ─────────────────────────────────────────
function Fundo() {
  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute top-0 left-0 right-0 h-[35%]">
        <div className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/bg-operacao.jpg')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#0d0d0f]" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[65%]"
        style={{
          backgroundColor: '#0d0d0f',
          backgroundImage: `
            linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />
    </div>
  )
}

export default function Dossies() {
  const usuario = useAuthStore(state => state.usuario)
  const USER_ROLE = usuario?.is_avaliador ? 'avaliador' : 'user'
  const { ativo: cronometroAtivo, pausado, encerrado, inicializado } = useTimerStore()
  const operacaoAtiva = inicializado && (cronometroAtivo || pausado) && !encerrado

  const [dossies, setDossies] = useState<Dossie[]>([])
  const [carregando, setCarregando] = useState(true)

  // Carrega dossiês do backend
  useEffect(() => {
    async function carregar() {
      try {
        const dados = await listarDossies()
        setDossies(dados.map(d => ({
          id: d.id,
          nome: d.nome,
          descricao: d.descricao,
          data_nascimento: d.data_nascimento,
          data_desaparecimento: d.data_desaparecimento,
          local: d.local,
          coordenadas: d.coordenadas,
          foto: d.foto_url,
          arquivos: d.arquivos,
          arquivosAvaliador: [],
          equipes: [],
          respostas: d.total_respostas,
          status: d.ativo ? 'ativo' : 'arquivado',
        })))
      } catch (e) {
        console.error('Erro ao carregar dossiês:', e)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  const [modalDossie, setModalDossie] = useState<Dossie | null>(null)
  const [formResposta, setFormResposta] = useState<FormResposta>(formRespostaVazio)
  const [erros, setErros] = useState<Partial<Record<keyof FormResposta, string>>>({})
  const [sucesso, setSucesso] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [modalModo, setModalModo] = useState<'criar' | 'editar' | null>(null)
  const [dossieEditando, setDossieEditando] = useState<Dossie | null>(null)
  const [formDossie, setFormDossie] = useState<FormDossie>(formDossieVazio)
  const [confirmandoArquivar, setConfirmandoArquivar] = useState<number | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'ativo' | 'arquivado'>('todos')
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [modalFoto, setModalFoto] = useState<{ nome: string; url: string } | null>(null)
  const [modalMapa, setModalMapa] = useState<{ local: string; coordenadas: string } | null>(null)
  const [modalDetalhes, setModalDetalhes] = useState<Dossie | null>(null)
  const [dossieParaExcluir, setDossieParaExcluir] = useState<Dossie | null>(null)
  const [modalLogAberto, setModalLogAberto] = useState(false)
  const [logs, setLogs] = useState<LogExclusaoAPI[]>([])

  const dossieFiltrados = USER_ROLE === 'avaliador'
    ? dossies.filter(d => filtro === 'todos' ? true : d.status === filtro)
    : dossies.filter(d => d.status === 'ativo')

  // ── Handlers usuário ──────────────────────────────────────────
  function abrirModalResposta(d: Dossie) {
    if (!operacaoAtiva) return
    setModalDossie(d)
    setFormResposta(formRespostaVazio)
    setErros({})
  }

  async function enviarResposta() {
    const novosErros: Partial<Record<keyof FormResposta, string>> = {}
    if (!formResposta.titulo.trim()) novosErros.titulo = 'Título é obrigatório'
    if (!formResposta.descricao.trim()) novosErros.descricao = 'Descrição é obrigatória'
    if (!formResposta.categoria) novosErros.categoria = 'Selecione uma categoria'
    if (!formResposta.link.trim()) novosErros.link = 'Link é obrigatório'
    if (formResposta.arquivos.length === 0) novosErros.arquivos = 'Anexe pelo menos um arquivo'
    if (Object.keys(novosErros).length > 0) { setErros(novosErros); return }

    if (!modalDossie) return
    setEnviando(true)
    try {
      await enviarRespostaAPI(modalDossie.id, {
        titulo: formResposta.titulo,
        descricao: formResposta.descricao,
        categoria: formResposta.categoria,
        link: formResposta.link,
        arquivos: formResposta.arquivos,
      })
      setModalDossie(null)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (status === 403) {
        setModalDossie(null)
        setErroEnvio(detail ?? 'A operação foi encerrada. Não é possível enviar respostas.')
        setTimeout(() => setErroEnvio(null), 5000)
      } else {
        setErros({ titulo: 'Erro ao enviar. Tente novamente.' })
      }
    } finally {
      setEnviando(false)
    }
  }

  // ── Handlers avaliador ────────────────────────────────────────
  function abrirCriar() { setFormDossie(formDossieVazio); setDossieEditando(null); setModalModo('criar') }

  function abrirEditar(d: Dossie) {
    setFormDossie({
      nome: d.nome,
      descricao: d.descricao,
      data_nascimento: d.data_nascimento ?? '',
      data_desaparecimento: d.data_desaparecimento,
      local: d.local,
      coordenadas: d.coordenadas ?? '',
      foto: null,
      arquivosAvaliador: [],
    })
    setDossieEditando(d)
    setModalModo('editar')
  }

  async function salvarDossie() {
    if (!formDossie.nome.trim() || !formDossie.descricao.trim()) return
    try {
      if (modalModo === 'criar') {
        const novo = await criarDossie({
          nome: formDossie.nome,
          descricao: formDossie.descricao,
          data_nascimento: formDossie.data_nascimento || undefined,
          data_desaparecimento: formDossie.data_desaparecimento,
          local: formDossie.local,
          coordenadas: formDossie.coordenadas || undefined,
        })

        // Upload da foto (define foto_url) e dos arquivos anexados separadamente
        let dossieAtualizado = novo
        if (formDossie.foto) {
          try { dossieAtualizado = await uploadFotoDossie(novo.id, formDossie.foto) } catch { /* continua */ }
        }
        for (const arquivo of formDossie.arquivosAvaliador) {
          try { dossieAtualizado = await uploadArquivoDossie(novo.id, arquivo) } catch { /* continua */ }
        }

        setDossies(prev => [...prev, {
          id: dossieAtualizado.id,
          nome: dossieAtualizado.nome,
          descricao: dossieAtualizado.descricao,
          data_nascimento: dossieAtualizado.data_nascimento,
          data_desaparecimento: dossieAtualizado.data_desaparecimento,
          local: dossieAtualizado.local,
          coordenadas: dossieAtualizado.coordenadas,
          foto: dossieAtualizado.foto_url,
          arquivos: dossieAtualizado.arquivos,
          arquivosAvaliador: [],
          equipes: [],
          respostas: 0,
          status: 'ativo',
        }])
      } else if (dossieEditando) {
        const atualizado = await atualizarDossie(dossieEditando.id, {
          nome: formDossie.nome,
          descricao: formDossie.descricao,
          data_nascimento: formDossie.data_nascimento || undefined,
          data_desaparecimento: formDossie.data_desaparecimento,
          local: formDossie.local,
          coordenadas: formDossie.coordenadas || undefined,
        })

        // Upload da foto e dos arquivos ao editar
        let dossieAtualizado = atualizado
        if (formDossie.foto) {
          try { dossieAtualizado = await uploadFotoDossie(dossieEditando.id, formDossie.foto) } catch { /* continua */ }
        }
        for (const arquivo of formDossie.arquivosAvaliador) {
          try { dossieAtualizado = await uploadArquivoDossie(dossieEditando.id, arquivo) } catch { /* continua */ }
        }

        setDossies(prev => prev.map(d => d.id === dossieEditando.id ? {
          ...d,
          nome: dossieAtualizado.nome,
          descricao: dossieAtualizado.descricao,
          data_nascimento: dossieAtualizado.data_nascimento,
          data_desaparecimento: dossieAtualizado.data_desaparecimento,
          local: dossieAtualizado.local,
          coordenadas: dossieAtualizado.coordenadas,
          foto: dossieAtualizado.foto_url,
          arquivos: dossieAtualizado.arquivos,
        } : d))
      }
      setModalModo(null)
    } catch (e) {
      console.error('Erro ao salvar dossiê:', e)
    }
  }

  async function arquivar(id: number) {
    try {
      await arquivarDossie(id)
      setDossies(prev => prev.map(d =>
        d.id === id ? { ...d, status: d.status === 'ativo' ? 'arquivado' : 'ativo' } : d
      ))
    } catch (e) {
      console.error('Erro ao arquivar:', e)
    }
    setConfirmandoArquivar(null)
  }

  async function confirmarExclusao(motivo: string) {
    if (!dossieParaExcluir) return
    await excluirDossie(dossieParaExcluir.id, motivo)
    setDossies(prev => prev.filter(d => d.id !== dossieParaExcluir.id))
    setDossieParaExcluir(null)
  }

  async function abrirLog() {
    try {
      const dados = await listarLogExclusoes()
      setLogs(dados)
    } catch (e) {
      console.error('Erro ao carregar log:', e)
    }
    setModalLogAberto(true)
  }

  // ── Tela de carregamento ──────────────────────────────────────
  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase animate-pulse">
          Carregando dossiês...
        </span>
      </div>
    )
  }

  // ── Tela de bloqueio (usuário com cronômetro zerado ou encerrado) ──
  if (USER_ROLE === 'user' && !operacaoAtiva) {
    return (
      <div className="relative flex flex-col min-h-full">
        <Fundo />
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-6 py-32">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }} className="flex flex-col items-center gap-5">
            <div className="p-5 bg-card border border-border rounded-full">
              <Lock size={32} className="text-muted-foreground" />
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-xl font-bold text-foreground tracking-widest uppercase"
                style={{ fontFamily: 'Syne, sans-serif' }}>
                Operação não iniciada
              </h2>
              <p className="text-muted-foreground font-mono text-sm max-w-sm leading-relaxed">
                Os dossiês estarão disponíveis quando o avaliador iniciar o cronômetro.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
              <Clock size={14} className="text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Aguardando início
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Página principal ──────────────────────────────────────────
  return (
    <div className="relative flex flex-col min-h-full">
      <Fundo />

      <div className="relative z-10 flex flex-col items-center px-8 py-12 gap-10">

        {/* Título */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="flex flex-col items-center gap-3 w-full max-w-6xl">
          <div className="w-full flex items-center justify-between">
            <div className="flex flex-col items-start gap-1">
              <p className="text-muted-foreground text-xs font-mono tracking-widest uppercase">
                {USER_ROLE === 'avaliador' ? 'Gerenciamento' : 'Operação Ativa'}
              </p>
              <h1 className="text-4xl font-bold text-white tracking-widest uppercase"
                style={{ fontFamily: 'Syne, sans-serif' }}>Dossiês</h1>
            </div>
            {USER_ROLE === 'avaliador' && (
              <div className="flex items-center gap-2">
                <button onClick={abrirLog}
                  className="flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-secondary
                             border border-border hover:border-primary/40 text-muted-foreground
                             hover:text-foreground font-mono text-xs tracking-widest rounded-lg
                             transition-all duration-200 uppercase">
                  <ClipboardList size={14} /> Log de Exclusões
                </button>
                <button onClick={abrirCriar}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20
                             border border-primary/40 hover:border-primary text-primary font-mono
                             text-xs tracking-widest rounded-lg transition-all duration-200 uppercase">
                  <Plus size={16} /> Novo Dossiê
                </button>
              </div>
            )}
          </div>
          <div className="w-full h-px bg-primary/20" />
          {USER_ROLE === 'user' && (
            <p className="text-muted-foreground font-mono text-sm tracking-wider self-start">
              Consulte os casos ativos e envie informações relevantes.
            </p>
          )}
        </motion.div>

        {/* Filtros — só avaliador vê */}
        {USER_ROLE === 'avaliador' && (
          <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
            className="flex gap-2 w-full max-w-6xl">
            {(['todos', 'ativo', 'arquivado'] as const).map(f => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`px-4 py-1.5 border font-mono text-xs tracking-widest rounded-lg
                            transition-all duration-200 uppercase
                            ${filtro === f
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            }`}>
                {f === 'todos' ? 'Todos' : f === 'ativo' ? 'Ativos' : 'Arquivados'}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground font-mono self-center">
              {dossieFiltrados.length} dossiê{dossieFiltrados.length !== 1 ? 's' : ''}
            </span>
          </motion.div>
        )}

        {/* Grid de cards */}
        {dossieFiltrados.length === 0 ? (
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show"
            className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
            <FileSearch size={40} className="opacity-30" />
            <p className="font-mono text-sm tracking-widest uppercase">Nenhum dossiê encontrado</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full max-w-6xl">
            {dossieFiltrados.map((d, i) => (
              <motion.div key={d.id} variants={fadeUp} custom={i + 2} initial="hidden" animate="show"
                className={`bg-card/70 backdrop-blur-sm border rounded-xl flex flex-col overflow-hidden
                  transition-all duration-300
                  ${d.status === 'arquivado' && USER_ROLE === 'avaliador'
                    ? 'border-border opacity-60'
                    : 'border-primary/40 hover:border-primary/70'
                  }`}
              >
                <div className="p-6 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1.5">
                      {USER_ROLE === 'avaliador' && (
                        <span className={`text-xs font-mono tracking-widest uppercase px-2 py-0.5 rounded-full w-fit
                          ${d.status === 'ativo'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border border-border'
                          }`}>
                          {d.status}
                        </span>
                      )}
                      <h2 className="text-white font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {d.nome}
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-primary border border-primary/30 rounded px-2 py-0.5 shrink-0">
                      #{String(d.id).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{d.descricao}</p>
                    <button onClick={() => setModalDetalhes(d)}
                      className="text-xs text-primary/60 hover:text-primary font-mono tracking-widest
                              text-left transition-colors uppercase">
                      Ver mais →
                    </button>
                  </div>

                  {/* Metadados — usuário vê (mesma estrutura do avaliador) */}
                  {USER_ROLE === 'user' && (
                    <div className="flex gap-3 mt-1">

                      {/* Foto */}
                      <button
                        onClick={() => d.foto ? setModalFoto({ nome: d.nome, url: d.foto }) : undefined}
                        className={`shrink-0 w-16 h-16 rounded-lg border overflow-hidden
                                    flex items-center justify-center transition-all
                                    ${d.foto
                                      ? 'border-primary/30 hover:border-primary cursor-pointer'
                                      : 'border-border cursor-default bg-input'
                                    }`}
                        title={d.foto ? 'Ver foto' : 'Sem foto'}
                      >
                        {d.foto
                          ? <img src={d.foto} alt={d.nome} loading="lazy" className="w-full h-full object-cover" />
                          : <User size={22} className="text-muted-foreground/30" />
                        }
                      </button>

                      {/* Separador vertical */}
                      <div className="w-px bg-primary/20 self-stretch shrink-0" />

                      {/* Metadados */}
                      <div className="flex flex-col gap-1.5 text-xs font-mono text-muted-foreground flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-primary/60 shrink-0" />
                          <span>Desap.: {new Date(d.data_desaparecimento).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {d.data_nascimento && (
                          <div className="flex items-center gap-2">
                            <Calendar size={13} className="text-primary/60 shrink-0 opacity-50" />
                            <span>
                              Nasc.: {new Date(d.data_nascimento).toLocaleDateString('pt-BR')}
                              <span className="text-muted-foreground/50 ml-1">
                                ({calcularIdade(d.data_nascimento)} anos)
                              </span>
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => d.coordenadas ? setModalMapa({ local: d.local, coordenadas: d.coordenadas }) : undefined}
                          className={`flex items-center gap-2 text-left transition-colors
                                      ${d.coordenadas ? 'hover:text-primary cursor-pointer' : 'cursor-default'}`}
                        >
                          <MapPin size={13} className="text-primary/60 shrink-0" />
                          <span className={d.coordenadas ? 'underline underline-offset-2 decoration-primary/40' : ''}>
                            {d.local}
                          </span>
                        </button>
                        {d.arquivos.length > 0 && (
                          <button
                            onClick={() => setModalDetalhes(d)}
                            className="flex items-center gap-2 text-left hover:text-primary transition-colors"
                          >
                            <Paperclip size={13} className="text-primary/60 shrink-0" />
                            <span className="underline underline-offset-2 decoration-primary/40">
                              {d.arquivos.length} arquivo{d.arquivos.length !== 1 ? 's' : ''} de apoio
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadados — avaliador vê */}
                  {USER_ROLE === 'avaliador' && (
                    <div className="flex gap-3 mt-1">

                      {/* Foto */}
                      <button
                        onClick={() => d.foto ? setModalFoto({ nome: d.nome, url: d.foto }) : undefined}
                        className={`shrink-0 w-16 h-16 rounded-lg border overflow-hidden
                                    flex items-center justify-center transition-all
                                    ${d.foto
                                      ? 'border-primary/30 hover:border-primary cursor-pointer'
                                      : 'border-border cursor-default bg-input'
                                    }`}
                        title={d.foto ? 'Ver foto' : 'Sem foto'}
                      >
                        {d.foto
                          ? <img
                            src={d.foto}
                            alt={d.nome}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          : <User size={22} className="text-muted-foreground/30" />
                        }
                      </button>

                      {/* Separador vertical */}
                      <div className="w-px bg-primary/20 self-stretch shrink-0" />

                      {/* Metadados */}
                      <div className="flex flex-col gap-1.5 text-xs font-mono text-muted-foreground flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-primary/60 shrink-0" />
                          <span>Desap.: {new Date(d.data_desaparecimento).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {d.data_nascimento && (
                          <div className="flex items-center gap-2">
                            <Calendar size={13} className="text-primary/60 shrink-0 opacity-50" />
                            <span>
                              Nasc.: {new Date(d.data_nascimento).toLocaleDateString('pt-BR')}
                              <span className="text-muted-foreground/50 ml-1">
                                ({calcularIdade(d.data_nascimento)} anos)
                              </span>
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => d.coordenadas ? setModalMapa({ local: d.local, coordenadas: d.coordenadas }) : undefined}
                          className={`flex items-center gap-2 text-left transition-colors
                                      ${d.coordenadas ? 'hover:text-primary cursor-pointer' : 'cursor-default'}`}
                        >
                          <MapPin size={13} className="text-primary/60 shrink-0" />
                          <span className={d.coordenadas ? 'underline underline-offset-2 decoration-primary/40' : ''}>
                            {d.local}
                          </span>
                        </button>
                        <div className="flex items-center gap-2">
                          <MessageSquare size={13} className="text-primary/60 shrink-0" />
                          <span>{d.respostas} resposta{d.respostas !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Arquivos de apoio — abre o modal de detalhes */}
                        {d.arquivosAvaliador.length > 0 && (
                          <button
                            onClick={() => setModalDetalhes(d)}
                            className="flex items-center gap-2 text-left hover:text-primary transition-colors"
                          >
                            <Paperclip size={13} className="text-primary/60 shrink-0" />
                            <span className="underline underline-offset-2 decoration-primary/40">
                              {d.arquivosAvaliador.length} arquivo{d.arquivosAvaliador.length !== 1 ? 's' : ''} de apoio
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Ações do card */}
                <div className="p-4 border-t border-border">
                  {USER_ROLE === 'user' ? (
                    <button onClick={() => abrirModalResposta(d)}
                      className="w-full flex items-center justify-center gap-2 py-2.5
                                 bg-primary/10 hover:bg-primary/20 border border-primary/40
                                 hover:border-primary text-primary font-mono text-xs
                                 tracking-widest rounded-lg transition-all duration-200 group">
                      ENVIAR RESPOSTA
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => abrirEditar(d)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border
                                     text-muted-foreground hover:text-foreground hover:border-primary/40
                                     font-mono text-xs tracking-widest rounded-lg transition-all duration-200 uppercase">
                          <Pencil size={13} /> Editar
                        </button>
                        <button onClick={() => setConfirmandoArquivar(d.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 border font-mono
                                     text-xs tracking-widest rounded-lg transition-all duration-200 uppercase
                                     ${d.status === 'ativo'
                                       ? 'border-border text-muted-foreground hover:text-amber-400 hover:border-amber-400/40'
                                       : 'border-border text-muted-foreground hover:text-emerald-400 hover:border-emerald-400/40'
                                     }`}>
                          <Archive size={13} />
                          {d.status === 'ativo' ? 'Arquivar' : 'Reativar'}
                        </button>
                      </div>
                      {d.status === 'arquivado' && (
                        <button onClick={() => setDossieParaExcluir(d)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 border
                                     border-destructive/20 text-destructive/60 hover:text-destructive
                                     hover:border-destructive/40 hover:bg-destructive/5
                                     font-mono text-xs tracking-widest rounded-lg transition-all duration-200 uppercase">
                          <Trash2 size={13} /> Excluir Permanentemente
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modais com lazy loading */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {modalDossie && USER_ROLE === 'user' && (
            <ModalRespostaUsuario
              nome={modalDossie.nome}
              form={formResposta}
              erros={erros}
              enviando={enviando}
              onFechar={() => setModalDossie(null)}
              onEnviar={enviarResposta}
              onChangeForm={setFormResposta}
              onLimparErro={campo => setErros(e => ({ ...e, [campo]: '' }))}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {modalModo && USER_ROLE === 'avaliador' && (
            <ModalGerenciarAvaliador
              modo={modalModo}
              form={formDossie}
              onFechar={() => setModalModo(null)}
              onSalvar={salvarDossie}
              onChangeForm={setFormDossie}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {modalDetalhes && (
            <ModalDetalhesDossie
              dossie={modalDetalhes}
              userRole={USER_ROLE}
              onFechar={() => setModalDetalhes(null)}
              onAbrirMapa={() => {
                if (modalDetalhes.coordenadas)
                  setModalMapa({ local: modalDetalhes.local, coordenadas: modalDetalhes.coordenadas })
              }}
              onAbrirFoto={() => {
                if (modalDetalhes.foto)
                  setModalFoto({ nome: modalDetalhes.nome, url: modalDetalhes.foto })
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {modalFoto && (
            <ModalFoto
              nome={modalFoto.nome}
              foto={modalFoto.url}
              onFechar={() => setModalFoto(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {modalMapa && (
            <ModalMapa
              local={modalMapa.local}
              coordenadas={modalMapa.coordenadas}
              onFechar={() => setModalMapa(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {dossieParaExcluir && (
            <ModalConfirmarExclusao
              nomeDossie={dossieParaExcluir.nome}
              onFechar={() => setDossieParaExcluir(null)}
              onConfirmar={confirmarExclusao}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {modalLogAberto && (
            <ModalLogExclusoes
              logs={logs}
              onFechar={() => setModalLogAberto(false)}
            />
          )}
        </AnimatePresence>

      </Suspense>

      {/* Modal confirmação arquivar */}
      <AnimatePresence>
        {confirmandoArquivar !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmandoArquivar(null)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-sm p-6
                              shadow-2xl flex flex-col gap-5 pointer-events-auto">
                <div className="flex flex-col gap-2">
                  <h3 className="font-mono text-sm tracking-widest uppercase text-white">
                    {dossies.find(d => d.id === confirmandoArquivar)?.status === 'ativo' ? 'Arquivar' : 'Reativar'} Dossiê
                  </h3>
                  <p className="text-muted-foreground text-sm font-mono leading-relaxed">
                    {dossies.find(d => d.id === confirmandoArquivar)?.status === 'ativo'
                      ? 'Este dossiê ficará invisível para os grupos. Deseja continuar?'
                      : 'Este dossiê voltará a ficar visível para os grupos. Deseja continuar?'
                    }
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirmandoArquivar(null)}
                    className="px-4 py-2 border border-border text-muted-foreground font-mono text-xs
                               tracking-widest rounded-lg hover:bg-secondary transition-all uppercase">
                    Cancelar
                  </button>
                  <button onClick={() => arquivar(confirmandoArquivar)}
                    className="px-4 py-2 border border-amber-400/40 bg-amber-400/10 text-amber-400
                               hover:bg-amber-400/20 font-mono text-xs tracking-widest rounded-lg
                               transition-all uppercase">
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast de sucesso */}
      <AnimatePresence>
        {sucesso && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                       bg-emerald-950 border border-emerald-500/50 text-emerald-400
                       px-5 py-3 rounded-xl shadow-2xl font-mono text-sm"
          >
            <CheckCircle size={16} />
            Resposta enviada com sucesso!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast de erro de envio (ex: cronômetro encerrado) */}
      <AnimatePresence>
        {erroEnvio && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                       bg-destructive/20 border border-destructive/50 text-destructive
                       px-5 py-3 rounded-xl shadow-2xl font-mono text-sm max-w-md text-center"
          >
            <X size={16} className="shrink-0" />
            {erroEnvio}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}