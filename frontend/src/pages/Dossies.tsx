import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Paperclip, Users, ChevronRight, X, Upload, CheckCircle } from 'lucide-react'
import type { Variants } from 'framer-motion'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

const categorias = [
  { id: 'familia', label: 'Família', pontos: 10 },
  { id: 'info_basicas', label: 'Informações Básicas', pontos: 15 },
  { id: 'info_avancadas', label: 'Informações Avançadas', pontos: 30 },
  { id: 'dia_desaparecimento', label: 'Dia do Desaparecimento', pontos: 25 },
  { id: 'atividades_pos', label: 'Atividades Pós-Desaparecimento', pontos: 35 },
  { id: 'darkweb', label: 'Dark Web', pontos: 50 },
  { id: 'localizacao', label: 'Localização', pontos: 60 },
]

const dossies = [
  {
    id: 1,
    nome: 'Jack Dawson',
    descricao: 'Jack Dawson é um jovem de 22 anos que desapareceu na cidade de Southampton, na Inglaterra. Segundo testemunhas do bar que costumava frequentar, o Sr. Dawson desapareceu no dia 10 de abril após ganhar uma aposta.',
    arquivos: ['jack.webp', 'Locator-map-Southampton.png'],
    equipes: ['Turma do Scooby-Doo'],
  },
  {
    id: 2,
    nome: 'Chuck Noland',
    descricao: 'Chuck Noland é um adulto de 45 anos que desapareceu na cidade de Memphis, Tennessee. Segundo sua noiva, Kelly Frears, a última vez em que foi visto foi no dia 22 de Novembro de 1995, quando saiu em viagem para a Malásia.',
    arquivos: ['Chuck.png', 'Helen_Hunt_Cast_Away_2.png', 'Helen_Hunt_Cast_Away_4.png'],
    equipes: [],
  },
  {
    id: 3,
    nome: 'Lucy Withmore',
    descricao: 'Lucy Withmore é uma jovem de 25 anos que desapareceu na cidade de Oahu, no Havaí. A jovem sofre de perda de memória recente.',
    arquivos: ['Lucy-vi.mp4', 'Lucy.png'],
    equipes: [],
  },
]

interface FormData {
  titulo: string
  descricao: string
  link: string
  categoria: string
  arquivos: File[]
}

const formVazio: FormData = {
  titulo: '',
  descricao: '',
  link: '',
  categoria: '',
  arquivos: [],
}

export default function Dossies() {
  const [modalDossie, setModalDossie] = useState<typeof dossies[0] | null>(null)
  const [form, setForm] = useState<FormData>(formVazio)
  const [erros, setErros] = useState<Partial<Record<keyof FormData, string>>>({})
  const [sucesso, setSucesso] = useState(false)
  const [enviando, setEnviando] = useState(false)

  function abrirModal(dossie: typeof dossies[0]) {
    setModalDossie(dossie)
    setForm(formVazio)
    setErros({})
  }

  function fecharModal() {
    setModalDossie(null)
    setForm(formVazio)
    setErros({})
  }

  function validar() {
    const novosErros: Partial<Record<keyof FormData, string>> = {}
    if (!form.titulo.trim()) novosErros.titulo = 'Título é obrigatório'
    if (!form.descricao.trim()) novosErros.descricao = 'Descrição é obrigatória'
    if (!form.categoria) novosErros.categoria = 'Selecione uma categoria'
    if (form.arquivos.length === 0) novosErros.arquivos = 'Anexe pelo menos um arquivo'
    return novosErros
  }

  function handleArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setForm(f => ({ ...f, arquivos: [...f.arquivos, ...Array.from(e.target.files!)] }))
    }
  }

  function removerArquivo(index: number) {
    setForm(f => ({ ...f, arquivos: f.arquivos.filter((_, i) => i !== index) }))
  }

  async function enviar() {
    const novosErros = validar()
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      return
    }
    setEnviando(true)
    // Simulação de envio — integração com backend vem depois
    await new Promise(r => setTimeout(r, 800))
    setEnviando(false)
    fecharModal()
    setSucesso(true)
    setTimeout(() => setSucesso(false), 3000)
  }

  return (
    <div className="relative flex flex-col min-h-full">

      {/* Fundo */}
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

      {/* Cronômetro */}
      <div className="relative z-10 w-full flex justify-center py-4 border-b border-primary/20 bg-black/30 backdrop-blur-sm">
        <span className="font-mono text-2xl font-bold text-foreground tracking-[0.3em]">00:00:00</span>
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center px-8 py-12 gap-10">

        {/* Título */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="flex flex-col items-center gap-3">
          <p className="text-muted-foreground text-xs font-mono tracking-widest uppercase">Operação Ativa</p>
          <h1 className="text-4xl font-bold text-white tracking-widest uppercase"
            style={{ fontFamily: 'Syne, sans-serif' }}>Dossiês</h1>
          <div className="w-16 h-px bg-primary/60" />
          <p className="text-muted-foreground font-mono text-sm tracking-wider">
            Consulte os casos ativos e envie informações relevantes.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-6xl">
          {dossies.map((d, i) => (
            <motion.div key={d.id} variants={fadeUp} custom={i + 1} initial="hidden" animate="show"
              className="bg-card/70 backdrop-blur-sm border border-primary/40 rounded-xl flex flex-col overflow-hidden">

              <div className="p-6 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-white font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {d.nome}
                  </h2>
                  <span className="text-xs font-mono text-primary border border-primary/30 rounded px-2 py-0.5 shrink-0">
                    #{String(d.id).padStart(2, '0')}
                  </span>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed">{d.descricao}</p>

                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-primary text-xs font-mono tracking-widest uppercase">
                    <Paperclip size={13} />
                    <span>Arquivos</span>
                  </div>
                  {d.arquivos.map((arq) => (
                    <div key={arq} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                      <FileText size={13} className="text-primary/60 group-hover:text-primary transition-colors" />
                      <span className="font-mono text-xs">{arq}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-primary text-xs font-mono tracking-widest uppercase">
                    <Users size={13} />
                    <span>Equipes participantes</span>
                  </div>
                  {d.equipes.length > 0 ? (
                    d.equipes.map((eq) => (
                      <span key={eq} className="text-sm text-muted-foreground font-mono">{eq}</span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground/50 font-mono italic">Nenhuma equipe participando</span>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-border">
                <button onClick={() => abrirModal(d)}
                  className="w-full flex items-center justify-center gap-2 py-2.5
                             bg-primary/10 hover:bg-primary/20 border border-primary/40
                             hover:border-primary text-primary font-mono text-xs
                             tracking-widest rounded-lg transition-all duration-200 group">
                  ENVIAR RESPOSTA
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalDossie && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={fecharModal}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            />

            {/* Janela */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-xl 
                              max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl">

                {/* Header do modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/40">
                  <div>
                    <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">
                      Enviar Resposta
                    </p>
                    <h3 className="text-white font-bold text-lg mt-0.5"
                      style={{ fontFamily: 'Syne, sans-serif' }}>
                      {modalDossie.nome}
                    </h3>
                  </div>
                  <button onClick={fecharModal}
                    className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
                    <X size={18} />
                  </button>
                </div>

                {/* Corpo do modal */}
                <div className="p-6 flex flex-col gap-5 bg-[#0f0f14]">

                  {/* Título */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                      Título <span className="text-primary">*</span>
                    </label>
                    <input
                      value={form.titulo}
                      onChange={e => {
                        setForm(f => ({ ...f, titulo: e.target.value }))
                        setErros(er => ({ ...er, titulo: '' }))
                      }}
                      placeholder="Ex: Localização confirmada em Lisboa"
                      className={`bg-input border rounded-lg px-4 py-2.5 text-sm text-foreground 
                                 placeholder:text-muted-foreground/50 font-mono focus:outline-none 
                                 transition-colors ${erros.titulo ? 'border-destructive' : 'border-border focus:border-primary/50'}`}
                    />
                    {erros.titulo && (
                      <span className="text-xs text-destructive font-mono">{erros.titulo}</span>
                    )}
                  </div>

                  {/* Descrição */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                      Descrição <span className="text-primary">*</span>
                    </label>
                    <textarea
                      value={form.descricao}
                      onChange={e => {
                        setForm(f => ({ ...f, descricao: e.target.value }))
                        setErros(er => ({ ...er, descricao: '' }))
                      }}
                      placeholder="Descreva as informações encontradas com detalhes..."
                      rows={4}
                      className={`bg-input border rounded-lg px-4 py-2.5 text-sm text-foreground 
                                 placeholder:text-muted-foreground/50 font-mono focus:outline-none 
                                 resize-none transition-colors ${erros.descricao ? 'border-destructive' : 'border-border focus:border-primary/50'}`}
                    />
                    {erros.descricao && (
                      <span className="text-xs text-destructive font-mono">{erros.descricao}</span>
                    )}
                  </div>

                  {/* Categoria */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                      Categoria <span className="text-primary">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {categorias.map((cat) => (
                        <button key={cat.id}
                          onClick={() => {
                            setForm(f => ({ ...f, categoria: cat.id }))
                            setErros(er => ({ ...er, categoria: '' }))
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border 
                                     text-xs font-mono transition-all duration-200 text-left
                                     ${form.categoria === cat.id
                                       ? 'border-primary bg-primary/10 text-primary'
                                       : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                     }`}
                        >
                          <span>{cat.label}</span>
                          <span className={`text-xs ${form.categoria === cat.id ? 'text-primary' : 'text-muted-foreground/50'}`}>
                            {cat.pontos}pts
                          </span>
                        </button>
                      ))}
                    </div>
                    {erros.categoria && (
                      <span className="text-xs text-destructive font-mono">{erros.categoria}</span>
                    )}
                  </div>

                  {/* Link */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                      Link <span className="text-muted-foreground/40">(opcional)</span>
                    </label>
                    <input
                      value={form.link}
                      onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                      placeholder="https://..."
                      className="bg-input border border-border focus:border-primary/50 rounded-lg 
                                 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 
                                 font-mono focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Arquivos */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                      Arquivos <span className="text-primary">*</span>
                    </label>
                    <label className="flex items-center justify-center gap-3 border border-dashed 
                                     border-border hover:border-primary/50 rounded-lg px-4 py-4 
                                     cursor-pointer transition-all group">
                      <Upload size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground font-mono transition-colors">
                        Clique para anexar arquivos
                      </span>
                      <input type="file" multiple className="hidden" onChange={handleArquivos}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
                    </label>
                    {form.arquivos.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        {form.arquivos.map((arq, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-1.5 
                                                   bg-secondary rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText size={13} className="text-primary/60" />
                              <span className="text-xs font-mono text-muted-foreground truncate max-w-[280px]">
                                {arq.name}
                              </span>
                            </div>
                            <button onClick={() => removerArquivo(i)}
                              className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {erros.arquivos && (
                      <span className="text-xs text-destructive font-mono">{erros.arquivos}</span>
                    )}
                  </div>


                  {/* Botão enviar */}
                  <button onClick={enviar} disabled={enviando}
                    className="w-full py-3 bg-primary/10 hover:bg-primary/20 border border-primary/50 
                               hover:border-primary text-primary font-mono text-sm tracking-widest 
                               rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                    {enviando ? 'ENVIANDO...' : 'ENVIAR RESPOSTA'}
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