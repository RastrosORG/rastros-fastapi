import { motion } from 'framer-motion'
import { FileText, Paperclip, Users, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Variants } from 'framer-motion'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

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

export default function Dossies() {
  const navigate = useNavigate()

  return (
    <div className="relative flex flex-col min-h-full">

      {/* Fundo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 right-0 h-[35%]">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('/bg-operacao.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#0d0d0f]" />
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-[65%]"
          style={{
            backgroundColor: '#0d0d0f',
            backgroundImage: `
              linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Cronômetro */}
      <div className="relative z-10 w-full flex justify-center py-4 border-b border-primary/20 bg-black/30 backdrop-blur-sm">
        <span className="font-mono text-2xl font-bold text-foreground tracking-[0.3em]">
          00:00:00
        </span>
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center px-8 py-12 gap-10">

        {/* Título */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="flex flex-col items-center gap-3"
        >
          <p className="text-muted-foreground text-xs font-mono tracking-widest uppercase">
            Operação Ativa
          </p>
          <h1 className="text-4xl font-bold text-white tracking-widest uppercase"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Dossiês
          </h1>
          <div className="w-16 h-px bg-primary/60" />
          <p className="text-muted-foreground font-mono text-sm tracking-wider">
            Consulte os casos ativos e envie informações relevantes.
          </p>
        </motion.div>

        {/* Cards dos dossiês */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-6xl">
          {dossies.map((d, i) => (
            <motion.div
              key={d.id}
              variants={fadeUp}
              custom={i + 1}
              initial="hidden"
              animate="show"
              className="bg-card/70 backdrop-blur-sm border border-primary/40 rounded-xl 
                         flex flex-col overflow-hidden"
            >
              {/* Topo do card */}
              <div className="p-6 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-white font-bold text-xl"
                    style={{ fontFamily: 'Syne, sans-serif' }}>
                    {d.nome}
                  </h2>
                  <span className="text-xs font-mono text-primary border border-primary/30 
                                   rounded px-2 py-0.5 shrink-0">
                    #{String(d.id).padStart(2, '0')}
                  </span>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  {d.descricao}
                </p>

                {/* Arquivos */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-primary text-xs font-mono tracking-widest uppercase">
                    <Paperclip size={13} />
                    <span>Arquivos</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {d.arquivos.map((arq) => (
                      <div key={arq}
                        className="flex items-center gap-2 text-muted-foreground text-sm 
                                   hover:text-foreground transition-colors cursor-pointer group">
                        <FileText size={13} className="text-primary/60 group-hover:text-primary transition-colors" />
                        <span className="font-mono text-xs">{arq}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipes */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-primary text-xs font-mono tracking-widest uppercase">
                    <Users size={13} />
                    <span>Equipes participantes</span>
                  </div>
                  {d.equipes.length > 0 ? (
                    d.equipes.map((eq) => (
                      <span key={eq} className="text-sm text-muted-foreground font-mono">
                        {eq}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground/50 font-mono italic">
                      Nenhuma equipe participando
                    </span>
                  )}
                </div>
              </div>

              {/* Botão */}
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => navigate(`/dossies/${d.id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 
                             bg-primary/10 hover:bg-primary/20 border border-primary/40 
                             hover:border-primary text-primary font-mono text-xs 
                             tracking-widest rounded-lg transition-all duration-200 group"
                >
                  ACESSAR DOSSIÊ
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}