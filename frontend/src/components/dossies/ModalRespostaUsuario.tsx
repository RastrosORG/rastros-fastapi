import { X, Upload, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

const categorias = [
  { id: 'familia', label: 'Família', pontos: 10 },
  { id: 'info_basicas', label: 'Informações Básicas', pontos: 15 },
  { id: 'info_avancadas', label: 'Informações Avançadas', pontos: 30 },
  { id: 'dia_desaparecimento', label: 'Dia do Desaparecimento', pontos: 25 },
  { id: 'atividades_pos', label: 'Atividades Pós-Desaparecimento', pontos: 35 },
  { id: 'darkweb', label: 'Dark Web', pontos: 50 },
  { id: 'localizacao', label: 'Localização', pontos: 60 },
]

interface FormData {
  titulo: string
  descricao: string
  link: string
  categoria: string
  arquivos: File[]
}

interface Props {
  nome: string
  form: FormData
  erros: Partial<Record<keyof FormData, string>>
  enviando: boolean
  onFechar: () => void
  onEnviar: () => void
  onChangeForm: (form: FormData) => void
  onLimparErro: (campo: keyof FormData) => void
}

export default function ModalRespostaUsuario({
  nome, form, erros, enviando, onFechar, onEnviar, onChangeForm, onLimparErro
}: Props) {

  function handleArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files)
      onChangeForm({ ...form, arquivos: [...form.arquivos, ...Array.from(e.target.files!)] })
  }

  function removerArquivo(index: number) {
    onChangeForm({ ...form, arquivos: form.arquivos.filter((_, i) => i !== index) })
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onFechar} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-xl
                        max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl">

          <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/40">
            <div>
              <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">Enviar Resposta</p>
              <h3 className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                {nome}
              </h3>
            </div>
            <button onClick={onFechar}
              className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-5 bg-[#0f0f14]">

            {/* Título */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Título <span className="text-primary">*</span>
              </label>
              <input value={form.titulo}
                onChange={e => { onChangeForm({ ...form, titulo: e.target.value }); onLimparErro('titulo') }}
                placeholder="Ex: Localização confirmada em Lisboa"
                className={`bg-input border rounded-lg px-4 py-2.5 text-sm text-foreground
                           placeholder:text-muted-foreground/50 font-mono focus:outline-none transition-colors
                           ${erros.titulo ? 'border-destructive' : 'border-border focus:border-primary/50'}`} />
              {erros.titulo && <span className="text-xs text-destructive font-mono">{erros.titulo}</span>}
            </div>

            {/* Descrição */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Descrição <span className="text-primary">*</span>
              </label>
              <textarea value={form.descricao}
                onChange={e => { onChangeForm({ ...form, descricao: e.target.value }); onLimparErro('descricao') }}
                placeholder="Descreva as informações encontradas com detalhes..."
                rows={4}
                className={`bg-input border rounded-lg px-4 py-2.5 text-sm text-foreground
                           placeholder:text-muted-foreground/50 font-mono focus:outline-none resize-none transition-colors
                           ${erros.descricao ? 'border-destructive' : 'border-border focus:border-primary/50'}`} />
              {erros.descricao && <span className="text-xs text-destructive font-mono">{erros.descricao}</span>}
            </div>

            {/* Categoria */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Categoria <span className="text-primary">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categorias.map(cat => (
                  <button key={cat.id}
                    onClick={() => { onChangeForm({ ...form, categoria: cat.id }); onLimparErro('categoria') }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border
                               text-xs font-mono transition-all duration-200 text-left
                               ${form.categoria === cat.id
                                 ? 'border-primary bg-primary/10 text-primary'
                                 : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                               }`}>
                    <span>{cat.label}</span>
                    <span className={`text-xs ${form.categoria === cat.id ? 'text-primary' : 'text-muted-foreground/50'}`}>
                      {cat.pontos}pts
                    </span>
                  </button>
                ))}
              </div>
              {erros.categoria && <span className="text-xs text-destructive font-mono">{erros.categoria}</span>}
            </div>

            {/* Link */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Link <span className="text-muted-foreground/40">(opcional)</span>
              </label>
              <input value={form.link} onChange={e => onChangeForm({ ...form, link: e.target.value })}
                placeholder="https://..."
                className="bg-input border border-border focus:border-primary/50 rounded-lg
                           px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50
                           font-mono focus:outline-none transition-colors" />
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
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-secondary rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-primary/60" />
                        <span className="text-xs font-mono text-muted-foreground truncate max-w-[280px]">{arq.name}</span>
                      </div>
                      <button onClick={() => removerArquivo(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {erros.arquivos && <span className="text-xs text-destructive font-mono">{erros.arquivos}</span>}
            </div>

            <button onClick={onEnviar} disabled={enviando}
              className="w-full py-3 bg-primary/10 hover:bg-primary/20 border border-primary/50
                         hover:border-primary text-primary font-mono text-sm tracking-widest
                         rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {enviando ? 'ENVIANDO...' : 'ENVIAR RESPOSTA'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}