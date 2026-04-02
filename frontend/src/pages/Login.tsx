import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, X } from 'lucide-react'

type Modo = 'login' | 'cadastro'
type Role = 'avaliador' | 'aluno' | null

export default function Login() {
  const [modo, setModo] = useState<Modo>('login')
  const [role, setRole] = useState<Role>(null)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarChave, setMostrarChave] = useState(false)
  const [mostrarTermos, setMostrarTermos] = useState(false)
  const [concordou, setConcordou] = useState(false)

  return (
    <div className="relative min-h-screen bg-[#0d0d0f] flex items-center justify-center overflow-hidden">

      {/* Grade tática no fundo */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Gradiente radial central */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 70%)'
        }}
      />

      {/* Logo RASTROS — esquerda */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="absolute left-[12%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-3
                   max-xl:static max-xl:translate-y-0 max-xl:mb-10"
      >
        <h1
          className="text-6xl font-bold text-white tracking-[0.15em] flex items-center gap-1 select-none"
          style={{ fontFamily: 'Amonos Display, sans-serif' }}
        >
          RASTR
          <motion.img
            src="/rastros_.png"
            alt="O"
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-14 h-14 object-contain inline-block"
            style={{ marginBottom: '-4px' }}
          />
          S
        </h1>
        {/* Linha neon dourada */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 100, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="h-px bg-primary"
          style={{ boxShadow: '0 0 8px rgba(201,168,76,0.6), 0 0 20px rgba(201,168,76,0.3)' }}
        />
      </motion.div>

      {/* Formulário */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-sm bg-card/80 backdrop-blur-md border border-border 
                   rounded-2xl p-8 shadow-2xl mx-4"
      >
        <AnimatePresence mode="wait">
          {modo === 'login' ? (
            <motion.div key="login"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            >
              <h2 className="text-xl font-bold text-foreground text-center mb-6 tracking-widest font-mono uppercase">
                Login
              </h2>

              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Usuário"
                  className="bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground
                             placeholder:text-muted-foreground font-mono focus:outline-none 
                             focus:border-primary/60 transition-colors"
                />

                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="Senha"
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 text-sm 
                               text-foreground placeholder:text-muted-foreground font-mono 
                               focus:outline-none focus:border-primary/60 transition-colors pr-10"
                  />
                  <button type="button" onClick={() => setMostrarSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button className="w-full py-3 bg-primary/10 hover:bg-primary/20 border border-primary/40 
                                   hover:border-primary text-primary font-mono text-sm tracking-widest 
                                   rounded-lg transition-all duration-200 uppercase">
                  Entrar
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-5 font-mono">
                Não possui login?{' '}
                <button onClick={() => setModo('cadastro')}
                  className="text-primary hover:underline transition-all">
                  Cadastre-se
                </button>
              </p>
            </motion.div>

          ) : (
            <motion.div key="cadastro"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            >
              <h2 className="text-xl font-bold text-foreground text-center mb-6 tracking-widest font-mono uppercase">
                Cadastro
              </h2>

              <div className="flex flex-col gap-4">
                <input type="text" placeholder="Usuário"
                  className="bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground
                             placeholder:text-muted-foreground font-mono focus:outline-none 
                             focus:border-primary/60 transition-colors" />

                <input type="password" placeholder="Senha"
                  className="bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground
                             placeholder:text-muted-foreground font-mono focus:outline-none 
                             focus:border-primary/60 transition-colors" />

                <input type="password" placeholder="Confirme a Senha"
                  className="bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground
                             placeholder:text-muted-foreground font-mono focus:outline-none 
                             focus:border-primary/60 transition-colors" />

                {/* Seleção de papel */}
                <div className="flex gap-3">
                  {(['avaliador', 'aluno'] as Role[]).map((r) => (
                    <button key={r} onClick={() => setRole(r)}
                      className={`flex-1 py-2 border rounded-lg font-mono text-xs tracking-widest uppercase transition-all duration-200
                        ${role === r
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                    >
                      {r === 'avaliador' ? 'Avaliador' : 'Aluno'}
                    </button>
                  ))}
                </div>

                {/* Campo chave de autenticação */}
                <AnimatePresence>
                  {role && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                      className="flex flex-col gap-3 overflow-hidden"
                    >
                      <div className="relative">
                        <input
                          type={mostrarChave ? 'text' : 'password'}
                          placeholder="Chave de Autenticação"
                          className="w-full bg-input border border-border rounded-lg px-4 py-3 text-sm 
                                     text-foreground placeholder:text-muted-foreground font-mono 
                                     focus:outline-none focus:border-primary/60 transition-colors pr-10"
                        />
                        <button type="button" onClick={() => setMostrarChave(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {mostrarChave ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {role === 'avaliador' && (
                        <input type="email" placeholder="E-mail"
                          className="bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground
                                     placeholder:text-muted-foreground font-mono focus:outline-none 
                                     focus:border-primary/60 transition-colors" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => role && setMostrarTermos(true)}
                  className={`w-full py-3 border font-mono text-sm tracking-widest rounded-lg 
                              transition-all duration-200 uppercase
                              ${role
                                ? 'bg-primary/10 hover:bg-primary/20 border-primary/40 hover:border-primary text-primary'
                                : 'border-border text-muted-foreground cursor-not-allowed opacity-50'
                              }`}
                >
                  Cadastrar
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-5 font-mono">
                Já possui login?{' '}
                <button onClick={() => setModo('login')}
                  className="text-primary hover:underline transition-all">
                  Entrar
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal Termos */}
      <AnimatePresence>
        {mostrarTermos && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] 
                         flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-mono text-sm tracking-widest uppercase text-foreground">
                  Termo de Responsabilidade
                </h3>
                <button onClick={() => setMostrarTermos(false)}
                  className="text-muted-foreground hover:text-destructive transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="overflow-y-auto flex-1 px-6 py-5 text-sm text-muted-foreground leading-relaxed font-mono space-y-4">
                <p>
                  <span className="text-foreground font-bold">Comprometo-me</span> a tratar os dados pessoais 
                  de pessoas desaparecidas com o mais alto grau de responsabilidade, zelo e respeito à 
                  dignidade humana, em estrita observância à{' '}
                  <span className="text-primary">Lei nº 13.709/2018</span> – LGPD.
                </p>
                <p><span className="text-foreground font-bold">Declaro estar ciente</span> de que os dados devem ser utilizados exclusivamente para:</p>
                <ul className="space-y-2 pl-4">
                  {['Localização da pessoa desaparecida', 'Proteção de seus direitos fundamentais', 'Cooperação com os órgãos competentes'].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">›</span> {item}
                    </li>
                  ))}
                </ul>
                <p><span className="text-foreground font-bold">Compromissos específicos:</span></p>
                <ul className="space-y-2 pl-4">
                  {[
                    'Utilizar os dados somente para os fins previstos e legalmente autorizados',
                    'Garantir a segurança, confidencialidade e integridade das informações',
                    'Abster-me de divulgar ou compartilhar indevidamente qualquer dado pessoal',
                    'Comunicar imediatamente qualquer incidente de segurança ou suspeita de violação',
                    'Respeitar os direitos dos titulares dos dados e de seus representantes legais',
                    'Cumprir todas as orientações institucionais sobre tratamento de dados pessoais',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">›</span> {item}
                    </li>
                  ))}
                </ul>
                <div className="border-l-2 border-primary/50 pl-4 py-2 bg-primary/5 rounded-r-lg">
                  <p><span className="text-foreground font-bold">Declaro estar ciente</span> de que o descumprimento 
                  poderá ensejar responsabilização administrativa, civil e/ou penal.</p>
                </div>
              </div>

              {/* Rodapé modal */}
              <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-mono text-muted-foreground">
                  <input type="checkbox" checked={concordou} onChange={e => setConcordou(e.target.checked)}
                    className="accent-[#c9a84c]" />
                  Li e concordo com os termos
                </label>
                <div className="flex gap-3">
                  <button onClick={() => setMostrarTermos(false)}
                    className="px-4 py-2 border border-border text-muted-foreground font-mono text-xs 
                               tracking-widest rounded-lg hover:bg-secondary transition-all uppercase">
                    Cancelar
                  </button>
                  <button disabled={!concordou}
                    className={`px-4 py-2 border font-mono text-xs tracking-widest rounded-lg 
                                transition-all uppercase
                                ${concordou
                                  ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary'
                                  : 'border-border text-muted-foreground opacity-40 cursor-not-allowed'
                                }`}
                  >
                    Concordar e Cadastrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo INTELIS — rodapé */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed bottom-5 right-5 hover:opacity-100 transition-opacity duration-300"
      >
        <img src="/intelis.png" alt="INTELIS" className="h-16 w-auto grayscale hover:grayscale-0 transition-all duration-300" />
      </motion.div>

    </div>
  )
}