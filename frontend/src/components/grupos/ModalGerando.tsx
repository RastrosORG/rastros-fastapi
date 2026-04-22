import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function ModalGerando() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-primary/30 rounded-2xl w-full max-w-xs p-8
                        pointer-events-auto shadow-2xl flex flex-col items-center gap-6">

          {/* Spinner animado */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-primary/10" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={20} className="text-primary/60 animate-spin" style={{ animationDuration: '2s' }} />
            </div>
          </div>

          {/* Texto */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
              Gerando usuários
            </p>
            <PointsDot />
            <p className="text-muted-foreground/60 font-mono text-xs leading-relaxed max-w-[200px]">
              Criando contas e distribuindo em grupos. Aguarde um momento.
            </p>
          </div>
        </div>
      </motion.div>
    </>
  )
}

function PointsDot() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
