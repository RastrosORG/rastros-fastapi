import { Info, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { Categoria } from '../../lib/categorias'

interface Props {
  categoria: Categoria
}

export default function InfoCategoria({ categoria }: Props) {
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  function toggleAbrir(e: React.MouseEvent) {
    e.stopPropagation()
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const panelWidth = 288
    const left = Math.min(rect.left, window.innerWidth - panelWidth - 12)
    setPos({ top: rect.bottom + 8, left: Math.max(8, left) })
    setAberto(v => !v)
  }

  useEffect(() => {
    if (!aberto) return
    function fechar(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setAberto(false)
      }
    }
    function fecharEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    document.addEventListener('keydown', fecharEsc)
    return () => {
      document.removeEventListener('mousedown', fechar)
      document.removeEventListener('keydown', fecharEsc)
    }
  }, [aberto])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onPointerDown={e => e.stopPropagation()}
        onClick={toggleAbrir}
        className="p-0.5 rounded text-muted-foreground/40 hover:text-primary/70 transition-colors shrink-0"
        title={`Detalhes: ${categoria.label}`}
      >
        <Info size={11} />
      </button>

      {aberto && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-[#13131a] border border-primary/30 rounded-xl shadow-2xl w-72 max-h-80 overflow-y-auto"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-primary/20 sticky top-0 bg-[#13131a]">
            <span className="text-xs font-mono text-primary tracking-widest uppercase">
              {categoria.label}
            </span>
            <button
              type="button"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setAberto(false) }}
              className="p-0.5 rounded text-muted-foreground/50 hover:text-white transition-colors"
            >
              <X size={11} />
            </button>
          </div>
          <p className="px-3 py-2.5 text-xs font-mono text-foreground/70 leading-relaxed whitespace-pre-line">
            {categoria.descricao}
          </p>
        </div>
      )}
    </>
  )
}
