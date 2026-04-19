import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, CheckCircle, Clock, XCircle, Paperclip, MessageSquare, CheckCheck, ExternalLink, FileSearch, Download, Image, FileType } from 'lucide-react'
import type { Variants } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { listarMinhasRespostas } from '../api/respostasApi'
import type { RespostaAPI, DossieRespostasAPI } from '../api/respostasApi'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

const categorias = [
  { id: 'familia', label: 'Família' },
  { id: 'info_basicas', label: 'Informações Básicas' },
  { id: 'info_avancadas', label: 'Informações Avançadas' },
  { id: 'dia_desaparecimento', label: 'Dia do Desaparecimento' },
  { id: 'atividades_pos', label: 'Atividades Pós-Desaparecimento' },
  { id: 'darkweb', label: 'Dark Web' },
  { id: 'localizacao', label: 'Localização' },
]

function labelCategoria(id: string): string {
  return categorias.find((c) => c.id === id)?.label ?? id
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusConfig = {
  pendente: {
    label: 'Pendente',
    icon: Clock,
    className: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  },
  aprovada: {
    label: 'Aprovada',
    icon: CheckCircle,
    className: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  },
  aprovada_parcial: {
    label: 'Aprovada Parcialmente',
    icon: CheckCheck,
    className: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  },
  rejeitada: {
    label: 'Rejeitada',
    icon: XCircle,
    className: 'text-destructive border-destructive/30 bg-destructive/10',
  },
} as const

function tipoArquivo(url: string): 'imagem' | 'pdf' | 'outro' {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'imagem'
  if (ext === 'pdf') return 'pdf'
  return 'outro'
}

export default function Respostas() {
  const usuario = useAuthStore((s) => s.usuario)
  const [dossies, setDossies] = useState<DossieRespostasAPI[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalResposta, setModalResposta] = useState<RespostaAPI | null>(null)
  const [dossieModal, setDossieModal] = useState('')
  const [modalArquivo, setModalArquivo] = useState<{ nome: string; url: string } | null>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await listarMinhasRespostas()
        setDossies(dados)
      } catch {
        // mantém lista vazia
      } finally {
        setCarregando(false)
      }
    }

    async function atualizarSilencioso() {
      try {
        const dados = await listarMinhasRespostas()
        setDossies(dados)
      } catch { /* silencia erros de rede no poll silencioso */ }
    }

    carregar()
    const intervalo = setInterval(atualizarSilencioso, 20000)
    return () => clearInterval(intervalo)
  }, [])

  function abrirModal(resposta: RespostaAPI, dossieNome: string) {
    setModalResposta(resposta)
    setDossieModal(dossieNome)
  }

  function fecharModal() {
    setModalResposta(null)
    setDossieModal('')
  }

  const todasRespostas = dossies.flatMap((d) => d.respostas)
  const totalEnviadas = todasRespostas.length
  const totalAprovadas = todasRespostas.filter(
    (r) => r.status === 'aprovada' || r.status === 'aprovada_parcial'
  ).length
  const totalPendentes = todasRespostas.filter((r) => r.status === 'pendente').length
  const totalPontos = todasRespostas.reduce((acc, r) => acc + (r.avaliacao?.pontos ?? 0), 0)

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase animate-pulse">
          Carregando respostas...
        </span>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col min-h-full">

      {/* Fundo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 right-0 h-[30%]">
          <div className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('/bg-operacao.jpg')` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#0d0d0f]" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[70%]"
          style={{
            backgroundColor: '#0d0d0f',
            backgroundImage: `
              linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }} />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center px-8 py-12 gap-10">

        {/* Título */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="flex flex-col items-center gap-3">
          <p className="text-muted-foreground text-xs font-mono tracking-widest uppercase">Histórico</p>
          <h1 className="text-4xl font-bold text-white tracking-widest uppercase"
            style={{ fontFamily: 'Syne, sans-serif' }}>Respostas</h1>
          <div className="w-16 h-px bg-primary/60" />
          {usuario && (
            <p className="text-muted-foreground font-mono text-sm tracking-wider">
              Respostas enviadas pelo seu grupo
            </p>
          )}
        </motion.div>

        {/* Resumo */}
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
          className="grid grid-cols-4 gap-4 w-full max-w-3xl">
          {[
            { label: 'Enviadas', value: totalEnviadas, cor: 'text-foreground' },
            { label: 'Aprovadas', value: totalAprovadas, cor: 'text-emerald-400' },
            { label: 'Pendentes', value: totalPendentes, cor: 'text-yellow-400' },
            { label: 'Pontos', value: totalPontos, cor: 'text-primary' },
          ].map((s) => (
            <div key={s.label}
              className="bg-card/70 border border-border rounded-xl p-4 flex flex-col items-center gap-1">
              <span className={`font-mono text-3xl font-bold ${s.cor}`}>{s.value}</span>
              <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Dossiês */}
        {dossies.length === 0 ? (
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show"
            className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
            <FileSearch size={40} className="opacity-30" />
            <p className="font-mono text-sm tracking-widest uppercase">Nenhuma resposta enviada ainda</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-8 w-full max-w-4xl">
            {dossies.map((dossie, di) => (
              <motion.div key={dossie.dossie_id} variants={fadeUp} custom={di + 2} initial="hidden" animate="show"
                className="flex flex-col gap-3">

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-primary/60">
                    #{String(dossie.dossie_id).padStart(2, '0')}
                  </span>
                  <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {dossie.dossie_nome}
                  </h2>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-mono text-muted-foreground">
                    {dossie.respostas.length} resposta{dossie.respostas.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {dossie.respostas.length === 0 ? (
                  <div className="bg-card/40 border border-dashed border-border rounded-xl p-6 text-center">
                    <p className="text-muted-foreground/50 font-mono text-sm italic">
                      Nenhuma resposta enviada para este dossiê ainda.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {dossie.respostas.map((r) => {
                      const status = statusConfig[r.status]
                      const StatusIcon = status.icon
                      return (
                        <button key={r.id} onClick={() => abrirModal(r, dossie.dossie_nome)}
                          className="bg-card/70 backdrop-blur-sm border border-border hover:border-primary/40
                                     rounded-xl px-5 py-4 flex items-center justify-between gap-4
                                     transition-all duration-200 group text-left w-full">
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="text-white text-sm font-semibold truncate group-hover:text-primary transition-colors">
                              {r.titulo}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-primary/60">
                                {labelCategoria(r.categoria)}
                              </span>
                              <span className="text-xs font-mono text-muted-foreground/50">·</span>
                              <span className="text-xs font-mono text-muted-foreground/60">
                                {formatarData(r.criado_em)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {r.arquivos.length > 0 && (
                              <div className="flex items-center gap-1 text-muted-foreground/50">
                                <Paperclip size={12} />
                                <span className="text-xs font-mono">{r.arquivos.length}</span>
                              </div>
                            )}
                            {r.avaliacao?.comentario && (
                              <MessageSquare size={13} className="text-primary/50" />
                            )}
                            <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1
                                             rounded-full border ${status.className}`}>
                              <StatusIcon size={11} />
                              {status.label}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* Modal de arquivo */}
      <AnimatePresence>
        {modalArquivo && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalArquivo(null)}
              className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-3xl
                              max-h-[90vh] flex flex-col pointer-events-auto shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-primary/20 bg-black/40 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {tipoArquivo(modalArquivo.url) === 'imagem'
                      ? <Image size={14} className="text-primary/60 shrink-0" />
                      : tipoArquivo(modalArquivo.url) === 'pdf'
                      ? <FileType size={14} className="text-primary/60 shrink-0" />
                      : <FileText size={14} className="text-primary/60 shrink-0" />
                    }
                    <span className="text-sm font-mono text-foreground/80 truncate">{modalArquivo.nome}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={modalArquivo.url} download={modalArquivo.nome}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-muted-foreground
                                 hover:text-foreground border border-border hover:border-primary/40
                                 rounded-lg transition-all">
                      <Download size={12} /> Baixar
                    </a>
                    <button onClick={() => setModalArquivo(null)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-auto flex items-center justify-center bg-black/60 min-h-0">
                  {tipoArquivo(modalArquivo.url) === 'imagem' && (
                    <img src={modalArquivo.url} alt={modalArquivo.nome}
                      className="max-w-full max-h-full object-contain p-4" />
                  )}
                  {tipoArquivo(modalArquivo.url) === 'pdf' && (
                    <iframe src={modalArquivo.url} title={modalArquivo.nome}
                      className="w-full h-full min-h-[60vh] border-0" />
                  )}
                  {tipoArquivo(modalArquivo.url) === 'outro' && (
                    <div className="flex flex-col items-center gap-5 py-16 text-muted-foreground">
                      <FileText size={48} className="opacity-20" />
                      <p className="font-mono text-sm tracking-widest uppercase">Pré-visualização indisponível</p>
                      <a href={modalArquivo.url} download={modalArquivo.nome}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20
                                   border border-primary/40 hover:border-primary text-primary font-mono
                                   text-xs tracking-widest rounded-lg transition-all uppercase">
                        <Download size={14} /> Baixar arquivo
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de detalhe */}
      <AnimatePresence>
        {modalResposta && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={fecharModal}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-xl
                              max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/40">
                  <div>
                    <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">{dossieModal}</p>
                    <h3 className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {modalResposta.titulo}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const status = statusConfig[modalResposta.status]
                      const StatusIcon = status.icon
                      return (
                        <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1
                                         rounded-full border ${status.className}`}>
                          <StatusIcon size={11} />
                          {status.label}
                        </span>
                      )
                    })()}
                    <button onClick={fecharModal}
                      className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-5 bg-[#0f0f14]">

                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-mono text-foreground/60 tracking-widest uppercase">Categoria</p>
                    <span className="text-primary font-mono text-sm">
                      {labelCategoria(modalResposta.categoria)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-mono text-foreground/60 tracking-widest uppercase">Descrição</p>
                    <p className="text-foreground/90 text-sm leading-relaxed">{modalResposta.descricao}</p>
                  </div>

                  {modalResposta.link && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs font-mono text-foreground/60 tracking-widest uppercase">Link</p>
                      <a href={modalResposta.link} target="_blank" rel="noopener noreferrer"
                        className="text-primary font-mono text-sm hover:underline truncate flex items-center gap-1.5">
                        {modalResposta.link}
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}

                  {modalResposta.arquivos.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-mono text-foreground/60 tracking-widest uppercase">Arquivos Anexados</p>
                      <div className="flex flex-col gap-1.5">
                        {modalResposta.arquivos.map((arq) => {
                          const tipo = tipoArquivo(arq.url_s3)
                          const Icone = tipo === 'imagem' ? Image : tipo === 'pdf' ? FileType : FileText
                          return (
                            <button key={arq.id}
                              onClick={() => setModalArquivo({ nome: arq.nome_arquivo, url: arq.url_s3 })}
                              className="flex items-center gap-2 px-3 py-2 bg-secondary/50
                                         rounded-lg hover:bg-secondary transition-colors group text-left w-full">
                              <Icone size={13} className="text-primary/60 group-hover:text-primary transition-colors shrink-0" />
                              <span className="text-sm font-mono text-foreground/80 group-hover:text-foreground transition-colors flex-1 truncate">
                                {arq.nome_arquivo}
                              </span>
                              <ExternalLink size={11} className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <span className="text-xs font-mono text-muted-foreground/50">
                      Enviado em {formatarData(modalResposta.criado_em)}
                    </span>
                  </div>

                  {/* Avaliação */}
                  {modalResposta.avaliacao && (
                    <div className={`flex flex-col gap-3 mt-2 p-4 rounded-xl border ${
                      modalResposta.status === 'aprovada'
                        ? 'bg-emerald-950/40 border-emerald-500/20'
                        : modalResposta.status === 'aprovada_parcial'
                        ? 'bg-orange-950/40 border-orange-400/20'
                        : 'bg-destructive/10 border-destructive/20'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-mono tracking-widest uppercase flex items-center gap-2"
                          style={{
                            color: modalResposta.status === 'aprovada'
                              ? '#34d399'
                              : modalResposta.status === 'aprovada_parcial'
                              ? '#fb923c'
                              : 'var(--destructive)',
                          }}>
                          <MessageSquare size={12} />
                          Avaliação do Avaliador
                        </p>
                        {modalResposta.avaliacao.pontos > 0 && (
                          <span className="text-xs font-mono text-primary border border-primary/30 rounded px-2 py-0.5">
                            +{modalResposta.avaliacao.pontos} pts
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {modalResposta.avaliacao.comentario}
                      </p>

                      {modalResposta.avaliacao.categoria_nova && (
                        <div className="flex items-center gap-2 text-xs font-mono mt-1">
                          <span className="text-muted-foreground">Categoria corrigida:</span>
                          <span className="text-muted-foreground/50 line-through">
                            {labelCategoria(modalResposta.avaliacao.categoria_original ?? '')}
                          </span>
                          <span className="text-orange-400">→</span>
                          <span className="text-orange-400">
                            {labelCategoria(modalResposta.avaliacao.categoria_nova)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
