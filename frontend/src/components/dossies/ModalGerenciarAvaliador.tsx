import { X } from 'lucide-react'
import { motion } from 'framer-motion'

interface FormDossie {
  nome: string
  descricao: string
  data_desaparecimento: string
  local: string
}

interface Props {
  modo: 'criar' | 'editar'
  form: FormDossie
  onFechar: () => void
  onSalvar: () => void
  onChangeForm: (form: FormDossie) => void
}

export default function ModalGerenciarAvaliador({ modo, form, onFechar, onSalvar, onChangeForm }: Props) {

  const inputClass = `w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground
    placeholder:text-muted-foreground/50 font-mono focus:outline-none focus:border-primary/50 transition-colors`

  const valido = form.nome.trim() && form.descricao.trim()

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
        <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-lg
                        max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl">

          <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/40">
            <div>
              <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">
                {modo === 'criar' ? 'Novo Dossiê' : 'Editar Dossiê'}
              </p>
              <h3 className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                {modo === 'criar' ? 'Preencha os dados' : form.nome}
              </h3>
            </div>
            <button onClick={onFechar}
              className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-5 bg-[#0f0f14]">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Nome Completo <span className="text-primary">*</span>
              </label>
              <input type="text" placeholder="Nome da pessoa desaparecida"
                value={form.nome} onChange={e => onChangeForm({ ...form, nome: e.target.value })}
                className={inputClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Descrição <span className="text-primary">*</span>
              </label>
              <textarea placeholder="Descreva as circunstâncias do desaparecimento..."
                value={form.descricao} onChange={e => onChangeForm({ ...form, descricao: e.target.value })}
                rows={4} className={`${inputClass} resize-none`} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                  Data <span className="text-primary">*</span>
                </label>
                <input type="date" value={form.data_desaparecimento}
                  onChange={e => onChangeForm({ ...form, data_desaparecimento: e.target.value })}
                  className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                  Local <span className="text-primary">*</span>
                </label>
                <input type="text" placeholder="Cidade, Estado"
                  value={form.local} onChange={e => onChangeForm({ ...form, local: e.target.value })}
                  className={inputClass} />
              </div>
            </div>

            <button onClick={onSalvar} disabled={!valido}
              className={`w-full py-3 border font-mono text-sm tracking-widest rounded-lg
                          transition-all uppercase
                          ${valido
                            ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary'
                            : 'border-border text-muted-foreground opacity-40 cursor-not-allowed'
                          }`}>
              {modo === 'criar' ? 'Criar Dossiê' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}