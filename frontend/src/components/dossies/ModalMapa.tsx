import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, ExternalLink, Loader2 } from 'lucide-react'

interface Props {
  local: string
  coordenadas: string
  onFechar: () => void
}

export default function ModalMapa({ local, coordenadas, onFechar }: Props) {
  const [carregado, setCarregado] = useState(false)

  const iframeSrc = `https://maps.google.com/maps?q=${coordenadas}&z=14&output=embed`
  const gmapsUrl = `https://www.google.com/maps?q=${coordenadas}`

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onFechar} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-primary/20 rounded-2xl overflow-hidden
                        pointer-events-auto shadow-2xl w-full max-w-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/40">
            <div>
              <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">Localização</p>
              <h3 className="text-white font-bold text-base mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                {local}
              </h3>
            </div>
            <button onClick={onFechar}
              className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
              <X size={18} />
            </button>
          </div>

          {/* Mapa */}
          <div className="relative w-full h-80 bg-[#0d0d0f]">
            {!carregado && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 size={24} className="text-primary animate-spin" />
                <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                  Carregando mapa...
                </span>
              </div>
            )}
            <iframe
              src={iframeSrc}
              className={`w-full h-full border-0 transition-opacity duration-300 ${carregado ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setCarregado(true)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Rodapé */}
          <div className="px-6 py-4 border-t border-primary/20 bg-black/20 flex justify-end">
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20
                         border border-primary/40 hover:border-primary text-primary font-mono
                         text-xs tracking-widest rounded-lg transition-all duration-200 uppercase">
              <ExternalLink size={14} />
              Abrir no Google Maps
            </a>
          </div>
        </div>
      </motion.div>
    </>
  )
}