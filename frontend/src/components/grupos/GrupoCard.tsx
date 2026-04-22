import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { ArrowRightLeft, Trash2, Pencil, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'
import MembroCard from './MembroCard'
import type { Usuario } from './MembroCard'
import type { Variants } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'

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

interface Props {
  grupo: Grupo
  editando: boolean
  index: number
  onTransferir: (grupoId: string) => void
  onExcluirGrupo?: (grupo: Grupo) => void
  onExcluirMembro?: (usuario: Usuario, grupoNome: string) => void
  onRenomear?: (grupoId: string, novoNome: string) => void
}

export default function GrupoCard({
  grupo, editando, index, onTransferir, onExcluirGrupo, onExcluirMembro, onRenomear,
}: Props) {
  const usuario = useAuthStore(s => s.usuario)
  const meuGrupo = grupo.avaliadorId === usuario?.id.toString()
  const tamanho = grupo.membros.length
  const tamanhoOk = tamanho === 3 || tamanho === 4
  const invalido = editando && !tamanhoOk

  const [editandoNome, setEditandoNome] = useState(false)
  const [novoNome, setNovoNome] = useState(grupo.nome)

  function confirmarRename() {
    const nome = novoNome.trim()
    if (nome.length >= 2 && nome !== grupo.nome) {
      onRenomear?.(grupo.id, nome)
    }
    setEditandoNome(false)
  }

  function cancelarRename() {
    setNovoNome(grupo.nome)
    setEditandoNome(false)
  }

  const { setNodeRef: setGrupoRef, isOver } = useDroppable({
    id: `grupo-${grupo.id}`,
    disabled: !editando,
  })

  return (
    <motion.div
      variants={fadeUp} custom={index} initial="hidden" animate="show"
      className={`bg-card/70 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300
        ${invalido ? 'border-destructive/60' : meuGrupo ? 'border-primary/40' : 'border-border'}`}
    >
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b
        ${invalido ? 'border-destructive/30 bg-destructive/5' : meuGrupo ? 'border-primary/20 bg-primary/5' : 'border-border bg-black/20'}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {editando && editandoNome ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmarRename()
                  if (e.key === 'Escape') cancelarRename()
                }}
                autoFocus
                maxLength={50}
                className="bg-transparent border-b border-primary/50 text-white font-bold text-sm
                           focus:outline-none w-28 font-[Syne,sans-serif]"
              />
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={confirmarRename}
                className="p-0.5 text-primary hover:text-primary/70 transition-colors"
              >
                <Check size={12} />
              </button>
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={cancelarRename}
                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-white font-bold text-sm truncate" style={{ fontFamily: 'Syne, sans-serif' }}>
                {grupo.nome}
              </h3>
              {editando && onRenomear && (
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => { setNovoNome(grupo.nome); setEditandoNome(true) }}
                  title="Renomear grupo"
                  className="p-0.5 rounded text-muted-foreground/40 hover:text-primary transition-colors flex-shrink-0"
                >
                  <Pencil size={11} />
                </button>
              )}
            </>
          )}
          <span className={`text-xs font-mono px-1.5 py-0.5 rounded border flex-shrink-0
            ${invalido
              ? 'text-destructive border-destructive/30 bg-destructive/10'
              : tamanhoOk
                ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
            }`}>
            {tamanho} membros
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-xs font-mono text-muted-foreground">
            {meuGrupo
              ? <span className="text-primary/70">Seu grupo</span>
              : grupo.avaliadorNome
            }
          </span>
          {editando && (
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={() => onTransferir(grupo.id)}
              title="Transferir grupo para outro avaliador"
              className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowRightLeft size={13} />
            </button>
          )}
          {editando && onExcluirGrupo && (
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={() => onExcluirGrupo(grupo)}
              title="Excluir grupo permanentemente"
              className="p-1 rounded text-muted-foreground/40 hover:text-destructive transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Membros */}
      <div ref={setGrupoRef} className={`p-3 flex flex-col gap-1.5 rounded-b-xl transition-colors ${isOver && editando ? 'bg-primary/5' : ''}`}>
        <SortableContext items={grupo.membros.map(m => m.id)} strategy={verticalListSortingStrategy}>
          {grupo.membros.map(m => (
            <MembroCard
              key={m.id}
              usuario={m}
              editando={editando}
              onExcluir={onExcluirMembro
                ? (u) => onExcluirMembro(u, grupo.nome)
                : undefined}
            />
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
