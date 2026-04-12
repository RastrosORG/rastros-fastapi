import { useState } from 'react'
import { Play, Pause, RotateCcw, Plus, Lock, Unlock, Timer } from 'lucide-react'
import { useTimerStore } from '../../store/timerStore'
import { useAuthStore } from '../../store/authStore'
import {
  iniciarCronometro,
  pausarCronometro,
  retomarCronometro,
  incrementarCronometro,
  adquirirLock,
  liberarLock,
} from '../../api/cronometroApi'

function formatarTempo(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

// ── Sub-componente: painel de controle do avaliador ──────────────
function PainelAvaliador() {
  const { ativo, pausado, encerrado, segundosRestantes, duracaoSegundos, temLock, setEstado } =
    useTimerStore()
  const usuario = useAuthStore((s) => s.usuario)

  const [carregando, setCarregando] = useState(false)
  const [modalIniciar, setModalIniciar] = useState(false)
  const [horasInput, setHorasInput] = useState('1')
  const [minutosInput, setMinutosInput] = useState('0')
  const [erroInput, setErroInput] = useState('')

  async function handleLock() {
    if (temLock) {
      await liberarLock()
      setEstado({ temLock: false })
    } else {
      try {
        await adquirirLock()
        setEstado({ temLock: true })
      } catch {
        alert('Outro avaliador está com o controle no momento.')
      }
    }
  }

  async function handleIniciar() {
    const h = parseInt(horasInput) || 0
    const m = parseInt(minutosInput) || 0
    const total = h * 3600 + m * 60
    if (total <= 0) {
      setErroInput('Defina uma duração maior que zero.')
      return
    }
    setErroInput('')
    setCarregando(true)
    try {
      await iniciarCronometro(total)
      setModalIniciar(false)
    } catch {
      // estado vem via WS
    } finally {
      setCarregando(false)
    }
  }

  async function handlePausar() {
    setCarregando(true)
    try {
      await pausarCronometro()
    } catch {
      //
    } finally {
      setCarregando(false)
    }
  }

  async function handleRetomar() {
    setCarregando(true)
    try {
      await retomarCronometro()
    } catch {
      //
    } finally {
      setCarregando(false)
    }
  }

  async function handleIncrementar(segundos: number) {
    setCarregando(true)
    try {
      await incrementarCronometro(segundos)
    } catch {
      //
    } finally {
      setCarregando(false)
    }
  }

  if (!usuario?.is_avaliador) return null

  const btnBase =
    'flex items-center gap-1.5 px-3 py-1.5 border font-mono text-xs tracking-widest rounded-lg transition-all duration-200 uppercase disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Botão lock */}
        <button
          onClick={handleLock}
          disabled={carregando}
          title={temLock ? 'Liberar controle' : 'Assumir controle'}
          className={`${btnBase} ${
            temLock
              ? 'border-primary/60 bg-primary/10 text-primary hover:bg-primary/20'
              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          {temLock ? <Unlock size={13} /> : <Lock size={13} />}
          {temLock ? 'Liberar' : 'Controlar'}
        </button>

        {temLock && (
          <>
            {/* Iniciar / Reiniciar */}
            {(!ativo && !pausado) || encerrado ? (
              <button
                onClick={() => setModalIniciar(true)}
                disabled={carregando}
                className={`${btnBase} border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
              >
                <Play size={13} />
                {encerrado || duracaoSegundos > 0 ? 'Reiniciar' : 'Iniciar'}
              </button>
            ) : null}

            {/* Pausar */}
            {ativo && (
              <button
                onClick={handlePausar}
                disabled={carregando}
                className={`${btnBase} border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20`}
              >
                <Pause size={13} /> Pausar
              </button>
            )}

            {/* Retomar */}
            {pausado && (
              <button
                onClick={handleRetomar}
                disabled={carregando}
                className={`${btnBase} border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
              >
                <RotateCcw size={13} /> Retomar
              </button>
            )}

            {/* +5min / +15min — só quando ativo ou pausado */}
            {(ativo || pausado) && segundosRestantes > 0 && (
              <>
                <button
                  onClick={() => handleIncrementar(300)}
                  disabled={carregando}
                  className={`${btnBase} border-border text-muted-foreground hover:border-primary/40 hover:text-foreground`}
                >
                  <Plus size={12} /> 5min
                </button>
                <button
                  onClick={() => handleIncrementar(900)}
                  disabled={carregando}
                  className={`${btnBase} border-border text-muted-foreground hover:border-primary/40 hover:text-foreground`}
                >
                  <Plus size={12} /> 15min
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Modal de iniciar */}
      {modalIniciar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setModalIniciar(false)}
          />
          <div className="relative bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Timer size={18} className="text-primary" />
              <h3 className="font-mono text-sm tracking-widest uppercase text-white">
                Definir Duração
              </h3>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                  Horas
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={horasInput}
                  onChange={(e) => setHorasInput(e.target.value)}
                  className="bg-input border border-border rounded-lg px-3 py-2 font-mono text-sm
                             text-foreground focus:outline-none focus:border-primary/60 text-center"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                  Minutos
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutosInput}
                  onChange={(e) => setMinutosInput(e.target.value)}
                  className="bg-input border border-border rounded-lg px-3 py-2 font-mono text-sm
                             text-foreground focus:outline-none focus:border-primary/60 text-center"
                />
              </div>
            </div>

            {erroInput && (
              <p className="text-xs font-mono text-red-400">{erroInput}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalIniciar(false)}
                className="px-4 py-2 border border-border text-muted-foreground font-mono text-xs
                           tracking-widest rounded-lg hover:bg-secondary transition-all uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={handleIniciar}
                disabled={carregando}
                className="px-4 py-2 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400
                           hover:bg-emerald-500/20 font-mono text-xs tracking-widest rounded-lg
                           transition-all uppercase disabled:opacity-40"
              >
                {carregando ? 'Iniciando...' : 'Iniciar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Componente principal ─────────────────────────────────────────
export default function TimerBar() {
  const { ativo, pausado, encerrado, segundosRestantes, inicializado } = useTimerStore()

  const corTempo = encerrado
    ? 'text-red-400'
    : !inicializado || (!ativo && !pausado && segundosRestantes === 0)
    ? 'text-muted-foreground'
    : segundosRestantes < 300
    ? 'text-red-400'
    : ativo
    ? 'text-foreground'
    : 'text-amber-400'

  const label = encerrado
    ? 'ENCERRADO'
    : pausado
    ? 'PAUSADO'
    : ativo
    ? 'EM ANDAMENTO'
    : 'AGUARDANDO'

  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3 border-b border-primary/20 bg-black/30 backdrop-blur-sm">
      {/* Tempo */}
      <div className="flex items-center gap-3 shrink-0">
        <span className={`font-mono text-2xl font-bold tracking-[0.3em] ${corTempo}`}>
          {formatarTempo(segundosRestantes)}
        </span>
        <span className="text-xs font-mono text-muted-foreground/50 tracking-widest uppercase">
          {label}
        </span>
      </div>

      {/* Controles do avaliador */}
      <PainelAvaliador />
    </div>
  )
}
