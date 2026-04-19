import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Printer, Shield, RefreshCw } from 'lucide-react'
import type { CredencialAPI } from '../../api/gruposApi'

interface Props {
  credenciais: CredencialAPI[]
  ultimaAtualizacao: string | null
  carregandoInicial?: boolean
  onFechar: () => void
  onAtualizar: () => Promise<void>
}

export default function ModalCredenciais({ credenciais, ultimaAtualizacao, carregandoInicial, onFechar, onAtualizar }: Props) {
  const [atualizando, setAtualizando] = useState(false)
  const carregando = atualizando || !!carregandoInicial

  async function handleAtualizar() {
    setAtualizando(true)
    try { await onAtualizar() } finally { setAtualizando(false) }
  }

  function formatarData(iso: string | null) {
    if (!iso) return null
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }
  const porGrupo = credenciais.reduce<Record<string, { nome: string; lista: CredencialAPI[] }>>((acc, c) => {
    if (!acc[c.grupo_id]) acc[c.grupo_id] = { nome: c.grupo_nome, lista: [] }
    acc[c.grupo_id].lista.push(c)
    return acc
  }, {})

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'print-credenciais'
    style.textContent = `
      @media print {
        body * { visibility: hidden; }
        #credenciais-print, #credenciais-print * { visibility: visible; }
        #credenciais-print {
          display: block !important;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          max-height: none !important;
          overflow: visible !important;
          background: white;
          color: black;
          padding: 32px;
          font-family: monospace;
        }
        #credenciais-print .print-titulo {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 24px;
          border-bottom: 2px solid black;
          padding-bottom: 8px;
        }
        #credenciais-print .print-grupo {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        #credenciais-print .print-grupo-nome {
          font-size: 13px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 1px solid #ccc;
          padding-bottom: 4px;
          margin-bottom: 8px;
        }
        #credenciais-print .print-linha {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 13px;
          border-bottom: 1px dotted #ddd;
        }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onFechar} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-2xl
                        max-h-[85vh] flex flex-col pointer-events-auto shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/40">
            <div>
              <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">Acesso Restrito</p>
              <h3 className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                Credenciais Geradas
              </h3>
              {ultimaAtualizacao && (
                <p className="text-xs font-mono text-muted-foreground/60 mt-0.5">
                  Atualizado em {formatarData(ultimaAtualizacao)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleAtualizar} disabled={carregando}
                className="flex items-center gap-2 px-3 py-1.5 border border-border text-muted-foreground
                           hover:text-foreground hover:border-primary/40 font-mono text-xs tracking-widest
                           rounded-lg transition-all uppercase disabled:opacity-50">
                <RefreshCw size={14} className={carregando ? 'animate-spin' : ''} />
                {carregando ? 'Atualizando...' : 'Atualizar'}
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-1.5 border border-border text-muted-foreground
                           hover:text-foreground hover:border-primary/40 font-mono text-xs tracking-widest
                           rounded-lg transition-all uppercase">
                <Printer size={14} /> Imprimir
              </button>
              <button onClick={onFechar}
                className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Área visível na tela */}
          <div className="overflow-y-auto flex-1 bg-[#0f0f14]">
            {Object.entries(porGrupo).map(([grupoId, { nome, lista }]) => (
              <div key={grupoId} className="border-b border-white/5 last:border-0">
                <div className="px-6 py-3 bg-black/20">
                  <span className="text-xs font-mono text-primary/70 tracking-widest uppercase">{nome}</span>
                </div>
                <div className="px-6 py-3 grid grid-cols-2 gap-2">
                  {lista.map(c => (
                    <div key={c.id} className="flex items-center justify-between px-3 py-2
                                               bg-black/20 border border-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield size={13} className="text-primary/60" />
                        <span className="font-mono text-sm text-foreground">{c.login}</span>
                      </div>
                      <span className="font-mono text-sm text-muted-foreground tracking-widest">
                        {c.senha}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Área exclusiva para impressão */}
      <div id="credenciais-print" style={{ display: 'none' }}>
        <div className="print-titulo">Credenciais Geradas — Rastros</div>
        {Object.entries(porGrupo).map(([grupoId, { nome, lista }]) => (
          <div key={grupoId} className="print-grupo">
            <div className="print-grupo-nome">{nome}</div>
            {lista.map(c => (
              <div key={c.id} className="print-linha">
                <span>{c.login}</span>
                <span>{c.senha}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
