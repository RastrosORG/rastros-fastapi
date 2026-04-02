import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, CheckCircle, Clock, XCircle, Paperclip, MessageSquare } from 'lucide-react'
import type { Variants } from 'framer-motion'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

type StatusResposta = 'pendente' | 'aprovada' | 'rejeitada'

interface Avaliacao {
  comentario: string
  categoriaNova?: string
  pontos?: number
}

interface Resposta {
  id: number
  titulo: string
  descricao: string
  categoria: string
  link?: string
  arquivos: string[]
  dataEnvio: string
  status: StatusResposta
  avaliacao?: Avaliacao
}

interface DossieRespostas {
  id: number
  nome: string
  respostas: Resposta[]
}

const mock: DossieRespostas[] = [
  {
    id: 1,
    nome: 'Jack Dawson',
    respostas: [
      {
        id: 1,
        titulo: 'Contato com familiar identificado',
        descricao: 'Conseguimos localizar a irmã de Jack Dawson, Mary Dawson, residente em Southampton. Ela confirmou que Jack saiu de casa na noite do dia 10 após receber uma ligação desconhecida.',
        categoria: 'Família',
        arquivos: ['contato_mary.pdf', 'print_ligacao.png'],
        dataEnvio: '01/04/2026 14:32',
        status: 'aprovada',
        avaliacao: {
          comentario: 'Boa investigação. A informação sobre a ligação é relevante para o caso.',
          pontos: 10,
        },
      },
      {
        id: 2,
        titulo: 'Localização aproximada via câmera',
        descricao: 'Identificamos Jack em imagens de câmera de segurança no porto de Southampton às 23h do dia 10.',
        categoria: 'Localização',
        link: 'https://maps.google.com',
        arquivos: ['camera_porto.mp4'],
        dataEnvio: '01/04/2026 15:10',
        status: 'pendente',
      },
      {
        id: 3,
        titulo: 'Registro em hotel próximo ao porto',
        descricao: 'Encontramos registro de hospedagem em nome de J. Dawson no Hotel Mariner, a 200m do porto.',
        categoria: 'Informações Básicas',
        arquivos: ['registro_hotel.pdf'],
        dataEnvio: '01/04/2026 16:45',
        status: 'rejeitada',
        avaliacao: {
          comentario: 'O registro não corresponde ao mesmo período do desaparecimento. Revisem a data.',
        },
      },
    ],
  },
  {
    id: 2,
    nome: 'Chuck Noland',
    respostas: [
      {
        id: 4,
        titulo: 'Manifesto do voo MH370',
        descricao: 'Conseguimos o manifesto do voo em que Chuck embarcou. Ele estava listado como passageiro na poltrona 14C.',
        categoria: 'Dia do Desaparecimento',
        arquivos: ['manifesto_voo.pdf', 'boarding_pass.png'],
        dataEnvio: '01/04/2026 13:00',
        status: 'pendente',
      },
    ],
  },
  {
    id: 3,
    nome: 'Lucy Withmore',
    respostas: [],
  },
]

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
  rejeitada: {
    label: 'Rejeitada',
    icon: XCircle,
    className: 'text-destructive border-destructive/30 bg-destructive/10',
  },
}

export default function Respostas() {
  const [modalResposta, setModalResposta] = useState<Resposta | null>(null)
  const [dossieModal, setDossieModal] = useState<string>('')

  function abrirModal(resposta: Resposta, dossieNome: string) {
    setModalResposta(resposta)
    setDossieModal(dossieNome)
  }

  function fecharModal() {
    setModalResposta(null)
    setDossieModal('')
  }

  const totalEnviadas = mock.reduce((acc, d) => acc + d.respostas.length, 0)
  const totalAprovadas = mock.reduce((acc, d) => acc + d.respostas.filter(r => r.status === 'aprovada').length, 0)
  const totalPendentes = mock.reduce((acc, d) => acc + d.respostas.filter(r => r.status === 'pendente').length, 0)

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

      {/* Cronômetro */}
      <div className="relative z-10 w-full flex justify-center py-4 border-b border-primary/20 bg-black/30 backdrop-blur-sm">
        <span className="font-mono text-2xl font-bold text-foreground tracking-[0.3em]">00:00:00</span>
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
        </motion.div>

        {/* Resumo */}
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
          className="grid grid-cols-3 gap-4 w-full max-w-2xl">
          {[
            { label: 'Enviadas', value: totalEnviadas, cor: 'text-foreground' },
            { label: 'Aprovadas', value: totalAprovadas, cor: 'text-emerald-400' },
            { label: 'Pendentes', value: totalPendentes, cor: 'text-yellow-400' },
          ].map((s) => (
            <div key={s.label}
              className="bg-card/70 border border-border rounded-xl p-4 flex flex-col items-center gap-1">
              <span className={`font-mono text-3xl font-bold ${s.cor}`}>{s.value}</span>
              <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Dossiês */}
        <div className="flex flex-col gap-8 w-full max-w-4xl">
          {mock.map((dossie, di) => (
            <motion.div key={dossie.id} variants={fadeUp} custom={di + 2} initial="hidden" animate="show"
              className="flex flex-col gap-3">

              {/* Header do dossiê */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-primary/60">#{String(dossie.id).padStart(2, '0')}</span>
                <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {dossie.nome}
                </h2>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-mono text-muted-foreground">
                  {dossie.respostas.length} resposta{dossie.respostas.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Respostas do dossiê */}
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
                      <button key={r.id} onClick={() => abrirModal(r, dossie.nome)}
                        className="bg-card/70 backdrop-blur-sm border border-border hover:border-primary/40
                                   rounded-xl px-5 py-4 flex items-center justify-between gap-4
                                   transition-all duration-200 group text-left w-full">
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <span className="text-white text-sm font-semibold truncate group-hover:text-primary transition-colors">
                            {r.titulo}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-primary/60">{r.categoria}</span>
                            <span className="text-xs font-mono text-muted-foreground/50">·</span>
                            <span className="text-xs font-mono text-muted-foreground/60">{r.dataEnvio}</span>
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
      </div>

      {/* Modal da resposta */}
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
                    <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">
                      {dossieModal}
                    </p>
                    <h3 className="text-white font-bold text-lg mt-0.5"
                      style={{ fontFamily: 'Syne, sans-serif' }}>
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

                {/* Corpo */}
                <div className="p-6 flex flex-col gap-5 bg-[#0f0f14]">

                  {/* Detalhes */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-mono text-foreground/60 tracking-widest uppercase">Categoria</p>
                    <span className="text-primary font-mono text-sm">{modalResposta.categoria}</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-mono text-foreground/60 tracking-widest uppercase">Descrição</p>
                    <p className="text-foreground/90 text-sm leading-relaxed">{modalResposta.descricao}</p>
                  </div>

                  {modalResposta.link && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs font-mono text-foreground/60 tracking-widest uppercase">Link</p>
                      <a href={modalResposta.link} target="_blank" rel="noopener noreferrer"
                        className="text-primary font-mono text-sm hover:underline truncate">
                        {modalResposta.link}
                      </a>
                    </div>
                  )}

                  {/* Arquivos */}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-mono text-foreground/60 tracking-widest uppercase">Arquivos Anexados</p>
                    <div className="flex flex-col gap-1.5">
                      {modalResposta.arquivos.map((arq) => (
                        <div key={arq}
                          className="flex items-center gap-2 px-3 py-2 bg-secondary/50 
                                     rounded-lg cursor-pointer hover:bg-secondary transition-colors group">
                          <FileText size={13} className="text-primary/60 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-mono text-foreground/80 group-hover:text-foreground transition-colors">
                            {arq}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <span className="text-xs font-mono text-muted-foreground/50">
                      Enviado em {modalResposta.dataEnvio}
                    </span>
                  </div>

                  {/* Avaliação do avaliador */}
                  {modalResposta.avaliacao && (
                    <div className={`flex flex-col gap-3 mt-2 p-4 rounded-xl border ${
                      modalResposta.status === 'aprovada'
                        ? 'bg-emerald-950/40 border-emerald-500/20'
                        : 'bg-destructive/10 border-destructive/20'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-mono tracking-widest uppercase flex items-center gap-2"
                          style={{ color: modalResposta.status === 'aprovada' ? '#34d399' : 'var(--destructive)' }}>
                          <MessageSquare size={12} />
                          Avaliação do Avaliador
                        </p>
                        {modalResposta.avaliacao.pontos && (
                          <span className="text-xs font-mono text-primary border border-primary/30 
                                           rounded px-2 py-0.5">
                            +{modalResposta.avaliacao.pontos} pts
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {modalResposta.avaliacao.comentario}
                      </p>
                      {modalResposta.avaliacao.categoriaNova && (
                        <p className="text-xs font-mono text-muted-foreground">
                          Categoria alterada para:{' '}
                          <span className="text-primary">{modalResposta.avaliacao.categoriaNova}</span>
                        </p>
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