import { motion } from 'framer-motion'
import { X, Calendar, MapPin, MessageSquare, Paperclip, FileText, Download, ExternalLink, User } from 'lucide-react'

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

interface Props {
  dossie: Dossie
  onFechar: () => void
  onAbrirMapa: () => void
  onAbrirFoto: () => void
  userRole: 'user' | 'avaliador'
}

export default function ModalDetalhesDossie({ dossie: d, onFechar, onAbrirMapa, onAbrirFoto, userRole }: Props) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onFechar} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-2xl
                        max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl">

          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-primary/20 bg-black/40 gap-4">
            <div className="flex items-start gap-4">
              {/* Foto no header do modal */}
              <button onClick={d.foto ? onAbrirFoto : undefined}
                className={`shrink-0 w-14 h-14 rounded-xl border overflow-hidden
                            flex items-center justify-center transition-all mt-0.5
                            ${d.foto ? 'border-primary/40 hover:border-primary cursor-pointer' : 'border-border bg-input cursor-default'}`}>
                {d.foto
                  ? <img src={d.foto} alt={d.nome} className="w-full h-full object-cover" />
                  : <User size={20} className="text-muted-foreground/30" />
                }
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-mono tracking-widest uppercase px-2 py-0.5 rounded-full
                    ${d.status === 'ativo'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                    {d.status}
                  </span>
                  <span className="text-xs font-mono text-primary border border-primary/30 rounded px-2 py-0.5">
                    #{String(d.id).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="text-white font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {d.nome}
                </h3>
              </div>
            </div>
            <button onClick={onFechar}
              className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all shrink-0">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-6 bg-[#0f0f14]">

            {/* Descrição completa */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">Descrição do Caso</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{d.descricao}</p>
            </div>

            {/* Metadados */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 bg-black/20 rounded-lg p-3 border border-white/5">
                    <p className="text-xs font-mono text-primary/60 tracking-widest uppercase">Desaparecimento</p>
                    <div className="flex items-center gap-2 text-sm text-foreground font-mono">
                    <Calendar size={14} className="text-primary/60" />
                    {new Date(d.data_desaparecimento).toLocaleDateString('pt-BR')}
                    </div>
                </div>
                {d.data_nascimento && (
                    <div className="flex flex-col gap-1.5 bg-black/20 rounded-lg p-3 border border-white/5">
                    <p className="text-xs font-mono text-primary/60 tracking-widest uppercase">Nascimento</p>
                    <div className="flex items-center gap-2 text-sm text-foreground font-mono">
                        <Calendar size={14} className="text-primary/60" />
                        {new Date(d.data_nascimento).toLocaleDateString('pt-BR')}
                        <span className="text-muted-foreground/50 text-xs">
                        ({calcularIdade(d.data_nascimento)} anos)
                        </span>
                    </div>
                    </div>
                )}
                <button
                    onClick={d.coordenadas ? onAbrirMapa : undefined}
                    className={`flex flex-col gap-1.5 bg-black/20 rounded-lg p-3 border text-left transition-all
                    ${d.coordenadas ? 'border-primary/20 hover:border-primary/50 cursor-pointer' : 'border-white/5 cursor-default'}`}>
                    <p className="text-xs font-mono text-primary/60 tracking-widest uppercase">Local</p>
                    <div className="flex items-center gap-2 text-sm text-foreground font-mono">
                    <MapPin size={14} className="text-primary/60" />
                    <span className={d.coordenadas ? 'underline underline-offset-2 decoration-primary/40' : ''}>
                        {d.local}
                    </span>
                    </div>
                </button>
                </div>

            {/* Arquivos do dossiê */}
            {d.arquivos.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-mono text-primary/70 tracking-widest uppercase flex items-center gap-2">
                  <Paperclip size={13} /> Arquivos do Dossiê
                </p>
                <div className="flex flex-col gap-2">
                  {d.arquivos.map(arq => (
                    <div key={arq}
                      className="flex items-center justify-between px-3 py-2.5 bg-black/20
                                 border border-white/5 rounded-lg group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-primary/60" />
                        <span className="text-sm font-mono text-muted-foreground">{arq}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href="#" target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                          title="Abrir no navegador">
                          <ExternalLink size={13} />
                        </a>
                        <a href="#" download={arq}
                          className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                          title="Baixar">
                          <Download size={13} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Arquivos de apoio do avaliador */}
            {userRole === 'avaliador' && d.arquivosAvaliador.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-mono text-primary/70 tracking-widest uppercase flex items-center gap-2">
                  <Paperclip size={13} /> Arquivos de Apoio
                </p>
                <div className="flex flex-col gap-2">
                  {d.arquivosAvaliador.map(arq => (
                    <div key={arq}
                      className="flex items-center justify-between px-3 py-2.5 bg-black/20
                                 border border-white/5 rounded-lg group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-primary/60" />
                        <span className="text-sm font-mono text-muted-foreground">{arq}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href="#" target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                          title="Abrir no navegador">
                          <ExternalLink size={13} />
                        </a>
                        <a href="#" download={arq}
                          className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                          title="Baixar">
                          <Download size={13} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipes — só usuário vê */}
            {userRole === 'user' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-mono text-primary/70 tracking-widest uppercase flex items-center gap-2">
                  <MessageSquare size={13} /> Equipes Participantes
                </p>
                {d.equipes.length > 0
                  ? d.equipes.map(eq => (
                    <span key={eq} className="text-sm text-muted-foreground font-mono px-3 py-2 bg-black/20 border border-white/5 rounded-lg">
                      {eq}
                    </span>
                  ))
                  : <span className="text-sm text-muted-foreground/50 font-mono italic">Nenhuma equipe participando</span>
                }
              </div>
            )}

            {/* Respostas recebidas */}
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <MessageSquare size={13} className="text-primary/60" />
              <span>{d.respostas} resposta{d.respostas !== 1 ? 's' : ''} recebida{d.respostas !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}