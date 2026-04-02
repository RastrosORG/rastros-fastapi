import { motion } from 'framer-motion'
import { ClipboardList, Activity, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Variants } from 'framer-motion'

const USER_ROLE: 'user' | 'avaliador' = 'avaliador'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

const cards = [
  {
    titulo: 'Dossiês',
    subtitulo: 'GERENCIE OS CASOS',
    descricao: 'Crie e edite os dossiês das pessoas desaparecidas.',
    icon: ClipboardList,
    rota: '/dossies',
  },
  {
    titulo: 'Avaliar',
    subtitulo: 'AVALIE AS RESPOSTAS',
    descricao: 'Analise e julgue as respostas enviadas pelos grupos.',
    icon: Activity,
    rota: '/avaliar',
  },
  {
    titulo: 'Pontuação',
    subtitulo: 'RANKING DOS GRUPOS',
    descricao: 'Acompanhe o desempenho e a classificação de cada grupo.',
    icon: Trophy,
    rota: '/pontuacao',
  },
]

function HomeAvaliador() {
  const navigate = useNavigate()

  return (
    <div className="relative flex flex-col min-h-full">

      {/* Fundo com imagem */}
      <div className="absolute inset-0 z-0">
        {/* Imagem ocupa só os primeiros 55% da altura */}
        <div className="absolute top-0 left-0 right-0 h-[65%]">
            <div className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('/inicio.png')` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-[#0d0d0f]" />
        </div>

        {/* Grade tática no restante */}
        <div className="absolute bottom-0 left-0 right-0 h-[35%]"
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

      {/* Cronômetro no topo */}
      <motion.div
        variants={fadeUp} custom={0} initial="hidden" animate="show"
        className="relative z-10 w-full flex justify-center py-4 border-b border-primary/20 bg-black/30 backdrop-blur-sm"
      >
        <span className="font-mono text-2xl font-bold text-foreground tracking-[0.3em]">
          00:00:00
        </span>
      </motion.div>

      {/* Conteúdo central */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 py-16 gap-12">

        {/* Título */}
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
          className="flex flex-col items-center gap-3"
        >
          <h1
            className="text-4xl font-bold text-white text-center tracking-widest uppercase"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Bem-vindo(a), <span className="text-primary">Avaliador</span>
          </h1>
          <div className="w-16 h-px bg-primary/60" />
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
          {cards.map(({ titulo, subtitulo, descricao, icon: Icon, rota }, i) => (
            <motion.button
              key={titulo}
              variants={fadeUp}
              custom={i + 2}
              initial="hidden"
              animate="show"
              onClick={() => navigate(rota)}
              className="group relative bg-card/60 backdrop-blur-sm border border-primary/50 
                         hover:border-primary hover:bg-card/80
                         rounded-xl p-8 flex flex-col items-center gap-4 text-center 
                         transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Brilho no hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                              bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

              <Icon size={28} className="text-primary" />
              <div className="flex flex-col gap-1">
                <p className="text-white font-bold text-2xl tracking-tight"
                   style={{ fontFamily: 'Syne, sans-serif' }}>
                  {titulo}
                </p>
                <p className="text-primary text-xs font-mono tracking-widest">{subtitulo}</p>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{descricao}</p>
            </motion.button>
          ))}
        </div>

      </div>
    </div>
  )
}

function HomeUsuario() {
  return <div className="p-8 text-foreground">Em construção...</div>
}

export default function Home() {
  return USER_ROLE === 'avaliador' ? <HomeAvaliador /> : <HomeUsuario />
}