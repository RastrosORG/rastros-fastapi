import { motion } from 'framer-motion'
import { ClipboardList, Activity, Trophy, FileSearch, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Variants } from 'framer-motion'

// Mock — substituir pelo authStore depois
const USER_ROLE: 'user' | 'avaliador' = 'avaliador'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

const cardsAvaliador = [
  {
    titulo: 'Dossiês',
    subtitulo: 'GERENCIE OS CASOS',
    descricao: 'Crie, edite e arquive os dossiês das pessoas desaparecidas da operação.',
    icon: ClipboardList,
    rota: '/dossies',
  },
  {
    titulo: 'Avaliar',
    subtitulo: 'AVALIE AS RESPOSTAS',
    descricao: 'Analise e julgue as respostas enviadas pelos grupos sob sua responsabilidade.',
    icon: Activity,
    rota: '/avaliar',
  },
  {
    titulo: 'Pontuação',
    subtitulo: 'RANKING DOS GRUPOS',
    descricao: 'Acompanhe o desempenho e a classificação de cada grupo na operação.',
    icon: Trophy,
    rota: '/pontuacao',
  },
]

const cardsUsuario = [
  {
    titulo: 'Grupo',
    subtitulo: 'SUA EQUIPE',
    descricao: 'Acesse as informações do seu grupo, membros e desempenho coletivo.',
    icon: Users,
    rota: '/grupo',
  },
  {
    titulo: 'Dossiês',
    subtitulo: 'CASOS ATIVOS',
    descricao: 'Consulte os casos em aberto e contribua com informações relevantes.',
    icon: FileSearch,
    rota: '/dossies',
  },
  {
    titulo: 'Respostas',
    subtitulo: 'SEUS ENVIOS',
    descricao: 'Acompanhe o status das respostas enviadas pelo seu grupo.',
    icon: ClipboardList,
    rota: '/respostas',
  },
]

// ── Fundo compartilhado ─────────────────────────────────────────
function Fundo({ alturaImagem = '65%', alturaGrade = '35%' }: { alturaImagem?: string; alturaGrade?: string }) {
  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute top-0 left-0 right-0" style={{ height: alturaImagem }}>
        <div className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/inicio.png')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-[#0d0d0f]" />
      </div>
      <div className="absolute bottom-0 left-0 right-0" style={{ height: alturaGrade,
        backgroundColor: '#0d0d0f',
        backgroundImage: `
          linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />
    </div>
  )
}

// ── Cards compartilhados ────────────────────────────────────────
function GridCards({ cards, custom }: {
  cards: typeof cardsAvaliador
  custom: number
}) {
  const navigate = useNavigate()
  return (
    <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
      {cards.map(({ titulo, subtitulo, descricao, icon: Icon, rota }, i) => (
        <motion.button
          key={titulo}
          variants={fadeUp}
          custom={custom + i}
          initial="hidden"
          animate="show"
          onClick={() => navigate(rota)}
          className="group relative bg-card/60 backdrop-blur-sm border border-primary/50
                     hover:border-primary hover:bg-card/80
                     rounded-xl p-8 flex flex-col items-center gap-4 text-center
                     transition-all duration-300 cursor-pointer overflow-hidden"
        >
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
  )
}

// ── Home Avaliador ──────────────────────────────────────────────
function HomeAvaliador() {
  return (
    <div className="relative flex flex-col min-h-full">
      <Fundo alturaImagem="65%" alturaGrade="35%" />

      {/* Cronômetro */}
      <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show"
        className="relative z-10 w-full flex justify-center py-4 border-b border-primary/20 bg-black/30 backdrop-blur-sm"
      >
        <span className="font-mono text-2xl font-bold text-foreground tracking-[0.3em]">
          00:00:00
        </span>
      </motion.div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 py-16 gap-12">
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
          className="flex flex-col items-center gap-3"
        >
          <h1 className="text-4xl font-bold text-white text-center tracking-widest uppercase"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Bem-vindo(a), <span className="text-primary">Avaliador</span>
          </h1>
          <div className="w-16 h-px bg-primary/60" />
        </motion.div>

        <GridCards cards={cardsAvaliador} custom={2} />
      </div>
    </div>
  )
}

// ── Home Usuário ────────────────────────────────────────────────
function HomeUsuario() {
  return (
    <div className="relative flex flex-col min-h-full">
      <Fundo alturaImagem="60%" alturaGrade="40%" />

      {/* Cronômetro */}
      <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show"
        className="relative z-10 w-full flex justify-center py-4 border-b border-primary/20 bg-black/30 backdrop-blur-sm"
      >
        <span className="font-mono text-2xl font-bold text-foreground tracking-[0.3em]">
          00:00:00
        </span>
      </motion.div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 py-16 gap-12">
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
          className="flex flex-col items-center gap-3"
        >
          <h1 className="text-4xl font-bold text-white text-center tracking-widest uppercase"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Bem-vindo(a), <span className="text-primary">Agente</span>
          </h1>
          <div className="w-16 h-px bg-primary/60" />
          <p className="text-muted-foreground font-mono text-sm tracking-wider">
            Utilize o menu abaixo para navegar pelas funcionalidades disponíveis.
          </p>
        </motion.div>

        <GridCards cards={cardsUsuario} custom={2} />
      </div>
    </div>
  )
}

// ── Export principal ────────────────────────────────────────────
export default function Home() {
  return USER_ROLE === 'avaliador' ? <HomeAvaliador /> : <HomeUsuario />
}