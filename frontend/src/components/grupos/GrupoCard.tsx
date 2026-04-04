import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ArrowRightLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import MembroCard from './MembroCard'
import type { Usuario } from './MembroCard'
import type { Variants } from 'framer-motion'

export interface Grupo {
  id: string
  nome: string
  avaliadorId: string
  avaliadorNome: string
  membros: Usuario[]
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

const AVALIADOR_ATUAL_ID = 'av1' // TODO: substituir pelo authStore

interface Props {
  grupo: Grupo
  editando: boolean
  index: number
  onTransferir: (grupoId: string) => void
}

export default function GrupoCard({ grupo, editando, index, onTransferir }: Props) {
  const meuGrupo = grupo.avaliadorId === AVALIADOR_ATUAL_ID
  const tamanho = grupo.membros.length
  const tamanhoOk = tamanho === 3 || tamanho === 4

  return (
    <motion.div
      variants={fadeUp} custom={index} initial="hidden" animate="show"
      className={`bg-card/70 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300
        ${meuGrupo ? 'border-primary/40' : 'border-border'}`}
    >
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b
        ${meuGrupo ? 'border-primary/20 bg-primary/5' : 'border-border bg-black/20'}`}>
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
            {grupo.nome}
          </h3>
          <span className={`text-xs font-mono px-1.5 py-0.5 rounded border
            ${tamanhoOk
              ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
              : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
            }`}>
            {tamanho} membros
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {meuGrupo
              ? <span className="text-primary/70">Seu grupo</span>
              : grupo.avaliadorNome
            }
          </span>
          {editando && !meuGrupo && (
            <button onClick={() => onTransferir(grupo.id)} title="Transferir para mim"
              className="p-1 rounded text-muted-foreground hover:text-primary transition-colors">
              <ArrowRightLeft size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Membros */}
      <div className="p-3 flex flex-col gap-1.5">
        <SortableContext items={grupo.membros.map(m => m.id)} strategy={verticalListSortingStrategy}>
          {grupo.membros.map(m => (
            <MembroCard key={m.id} usuario={m} editando={editando} />
          ))}
        </SortableContext>
        {grupo.membros.length === 0 && (
          <div className="py-4 flex items-center justify-center text-muted-foreground/40
                          text-xs font-mono tracking-widest uppercase border border-dashed
                          border-border rounded-lg">
            Grupo vazio
          </div>
        )}
      </div>
    </motion.div>
  )
}