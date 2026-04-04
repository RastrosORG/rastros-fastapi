import { useState, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Paperclip, Users, ChevronRight, CheckCircle, Clock, Lock, Plus, Pencil, Archive, MapPin, Calendar, MessageSquare, FileSearch, X } from 'lucide-react'
import type { Variants } from 'framer-motion'
import { User } from 'lucide-react'

// ── Mocks — substituídos pelo store depois ──────────────────────
const USER_ROLE: 'user' | 'avaliador' = 'user'
const CRONOMETRO_ATIVO = true

// ── Lazy loading dos modais exclusivos ─────────────────────────
const ModalRespostaUsuario = lazy(() => import('../components/dossies/ModalRespostaUsuario'))
const ModalGerenciarAvaliador = lazy(() => import('../components/dossies/ModalGerenciarAvaliador'))
const ModalFoto = lazy(() => import('../components/dossies/ModalFoto'))
const ModalMapa = lazy(() => import('../components/dossies/ModalMapa'))
const ModalDetalhesDossie = lazy(() => import('../components/dossies/ModalDetalhesDossie'))

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

interface Dossie {
  id: number
  nome: string
  descricao: string
  data_nascimento?: string
  data_desaparecimento: string
  local: string
  coordenadas?: string
  foto?: string
  arquivos: string[]
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

const mockDossies: Dossie[] = [
  { id: 1, nome: 'Jack Dawson', descricao: 'Jack Dawson é um jovem de 22 anos que desapareceu na cidade de Southampton após ganhar uma aposta em bar local. Testemunhas relatam que ele havia acabado de ganhar uma passagem de navio em um jogo de cartas e estava comemorando com amigos quando foi visto pela última vez saindo em direção ao porto. Sua família, residente em Chippewa Falls, Wisconsin, não teve mais notícias desde então.', data_nascimento: '1890-04-10', data_desaparecimento: '1912-04-10', local: 'Southampton, Inglaterra', coordenadas: '50.9097,-1.4044', foto: 'https://static.wikia.nocookie.net/jamescameronstitanic/images/c/c6/Untitledaksjk.png/revision/latest?cb=20130918130638', arquivos: ['jack.webp', 'mapa-southampton.png'], arquivosAvaliador: ['relatorio-testemunhas.pdf'], equipes: ['Turma do Scooby-Doo'], respostas: 7, status: 'ativo' },
  { id: 2, nome: 'Chuck Noland', descricao: 'Chuck Noland é um adulto de 45 anos desaparecido após voo para a Malásia. Última localização registrada em Memphis, Tennessee. Trabalhava como executivo da FedEx e estava em viagem de negócios quando a aeronave desapareceu dos radares sobre o Oceano Pacífico. Sua noiva, Kelly Frears, registrou o desaparecimento após não receber nenhum contato desde a data da partida.', data_nascimento: '1950-11-05', data_desaparecimento: '1995-11-22', local: 'Memphis, EUA', coordenadas: '35.1495,-90.0490', foto: 'https://cinreservas.com/wp-content/uploads/2021/02/31-1024x554.png', arquivos: ['chuck.png'], arquivosAvaliador: [], equipes: [], respostas: 12, status: 'ativo' },
  { id: 3, nome: 'Lucy Withmore', descricao: 'Lucy Withmore é uma jovem de 25 anos com perda de memória recente. Desaparecida na ilha de Oahu, Havaí. Sofre de amnésia anterógrada, condição que a impede de formar novas memórias. Foi vista pela última vez em uma praia próxima a Honolulu, usando vestido amarelo. Familiares pedem que qualquer pessoa com informações entre em contato imediatamente.', data_nascimento: '1999-06-22', data_desaparecimento: '2024-03-15', local: 'Oahu, Havaí', coordenadas: '21.3069,-157.8583', foto: 'https://static.wikia.nocookie.net/disabledcharacters/images/3/32/LucyWhitmore.jpg/revision/latest?cb=20230712125423', arquivos: ['lucy.png'], arquivosAvaliador: ['ficha-medica.pdf'], equipes: [], respostas: 3, status: 'arquivado' },
]

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
  const [dossies, setDossies] = useState<Dossie[]>(mockDossies)
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
  const [modalFoto, setModalFoto] = useState<{ nome: string; url: string } | null>(null)
  const [modalMapa, setModalMapa] = useState<{ local: string; coordenadas: string } | null>(null)
  const [modalDetalhes, setModalDetalhes] = useState<Dossie | null>(null)

  const dossieFiltrados = USER_ROLE === 'avaliador'
    ? dossies.filter(d => filtro === 'todos' ? true : d.status === filtro)
    : dossies.filter(d => d.status === 'ativo')

  // ── Handlers usuário ──────────────────────────────────────────
  function abrirModalResposta(d: Dossie) {
    if (!CRONOMETRO_ATIVO) return
    setModalDossie(d)
    setFormResposta(formRespostaVazio)
    setErros({})
  }

  async function enviarResposta() {
    const novosErros: Partial<Record<keyof FormResposta, string>> = {}
    if (!formResposta.titulo.trim()) novosErros.titulo = 'Título é obrigatório'
    if (!formResposta.descricao.trim()) novosErros.descricao = 'Descrição é obrigatória'
    if (!formResposta.categoria) novosErros.categoria = 'Selecione uma categoria'
    if (formResposta.arquivos.length === 0) novosErros.arquivos = 'Anexe pelo menos um arquivo'
    if (Object.keys(novosErros).length > 0) { setErros(novosErros); return }
    setEnviando(true)
    await new Promise(r => setTimeout(r, 800))
    setEnviando(false)
    setModalDossie(null)
    setSucesso(true)
    setTimeout(() => setSucesso(false), 3000)
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

  function salvarDossie() {
    if (!formDossie.nome.trim() || !formDossie.descricao.trim()) return
    
    const fotoUrl = formDossie.foto
        ? URL.createObjectURL(formDossie.foto)
        : undefined

    if (modalModo === 'criar') {
        setDossies(prev => [...prev, {
        nome: formDossie.nome,
        descricao: formDossie.descricao,
        data_desaparecimento: formDossie.data_desaparecimento,
        local: formDossie.local,
        coordenadas: formDossie.coordenadas,
        foto: fotoUrl,
        arquivos: [],
        arquivosAvaliador: formDossie.arquivosAvaliador.map(f => f.name),
        equipes: [],
        respostas: 0,
        status: 'ativo',
        id: Date.now(),
        }])
    } else if (dossieEditando) {
        setDossies(prev => prev.map(d => d.id === dossieEditando.id ? {
        ...d,
        nome: formDossie.nome,
        descricao: formDossie.descricao,
        data_desaparecimento: formDossie.data_desaparecimento,
        local: formDossie.local,
        coordenadas: formDossie.coordenadas,
        foto: fotoUrl ?? d.foto,
        arquivosAvaliador: formDossie.arquivosAvaliador.length > 0
            ? formDossie.arquivosAvaliador.map(f => f.name)
            : d.arquivosAvaliador,
        } : d))
    }
    setModalModo(null)
    }

  function arquivar(id: number) {
    setDossies(prev => prev.map(d => d.id === id ? { ...d, status: d.status === 'ativo' ? 'arquivado' : 'ativo' } : d))
    setConfirmandoArquivar(null)
  }

  const cronometroAtivo = CRONOMETRO_ATIVO

  // ── Tela de bloqueio (usuário com cronômetro zerado) ──────────
  if (USER_ROLE === 'user' && !cronometroAtivo) {
    return (
      <div className="relative flex flex-col min-h-full">
        <Fundo />
        <div className="relative z-10 w-full flex justify-center py-4 border-b border-primary/20 bg-black/30 backdrop-blur-sm">
          <span className="font-mono text-2xl font-bold text-muted-foreground tracking-[0.3em]">00:00:00</span>
        </div>
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

      {/* Cronômetro */}
      <div className="relative z-10 w-full flex justify-center py-4 border-b border-primary/20 bg-black/30 backdrop-blur-sm">
        <span className="font-mono text-2xl font-bold text-foreground tracking-[0.3em]">
          {cronometroAtivo ? '01:24:38' : '00:00:00'}
        </span>
      </div>

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
              <button onClick={abrirCriar}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20
                           border border-primary/40 hover:border-primary text-primary font-mono
                           text-xs tracking-widest rounded-lg transition-all duration-200 uppercase">
                <Plus size={16} /> Novo Dossiê
              </button>
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
                  {/* Arquivos — só usuário vê */}
                  {USER_ROLE === 'user' && (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-center gap-2 text-primary text-xs font-mono tracking-widest uppercase">
                        <Paperclip size={13} /><span>Arquivos</span>
                      </div>
                      {d.arquivos.map(arq => (
                        <div key={arq} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                          <FileText size={13} className="text-primary/60 group-hover:text-primary transition-colors" />
                          <span className="font-mono text-xs">{arq}</span>
                        </div>
                      ))}
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

                  {/* Equipes — só usuário vê */}
                  {USER_ROLE === 'user' && (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-center gap-2 text-primary text-xs font-mono tracking-widest uppercase">
                        <Users size={13} /><span>Equipes participantes</span>
                      </div>
                      {d.equipes.length > 0
                        ? d.equipes.map(eq => <span key={eq} className="text-sm text-muted-foreground font-mono">{eq}</span>)
                        : <span className="text-sm text-muted-foreground/50 font-mono italic">Nenhuma equipe participando</span>
                      }
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
    </div>
  )
}