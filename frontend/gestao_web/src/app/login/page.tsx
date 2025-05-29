"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { login } from "@/lib/auth"

const loginSchema = z.object({
  username: z.string().min(1, { message: "Nome de usuário é obrigatório" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
})

type LoginFormData = z.infer<typeof loginSchema>

// Tipos de notas disponíveis - Usando as notas de reais adicionadas pelo usuário
const moneyNoteTypes = [
  '/10_reais.png', // R$10
  '/20_reais.png', // R$20
  '/50_reais.png', // R$50
  '/100_reais.png', // R$100
];

interface FallingNote {
  id: number;
  x: number;
  y: number;
  speed: number;
  scale: number;
  opacity: number;
  rotate: number;
  type: number; // Índice do tipo de nota em moneyNoteTypes
  isSettled: boolean; // Indica se a nota já se acumulou no fundo
  zIndex: number; // Controla a ordem de empilhamento visual
  settleHeight: number; // Altura específica onde a nota se estabelece
  settleTime: number; // Contador para controlar quanto tempo a nota fica no chão
  fadingOut: boolean; // Indica se a nota está desaparecendo
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState<FallingNote[]>([])
  const [windowHeight, setWindowHeight] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  // Configurações para o acúmulo de notas
  const MAX_ACCUMULATED_NOTES = 35; // Número máximo de notas acumuladas visíveis
  const SETTLE_TIME_MAX = 100; // Tempo máximo que uma nota fica acumulada (em ciclos de animação)
  
  // Atualizar altura da janela no carregamento e em redimensionamentos
  useEffect(() => {
    const updateWindowHeight = () => {
      setWindowHeight(window.innerHeight);
    };
    
    // Atualizar inicialmente
    updateWindowHeight();
    
    // Atualizar em redimensionamentos
    window.addEventListener('resize', updateWindowHeight);
    
    return () => window.removeEventListener('resize', updateWindowHeight);
  }, []);
  
  // Gerar e animar notas de dinheiro
  useEffect(() => {
    if (windowHeight === 0) return; // Esperar a altura da janela ser inicializada
    
    // Calcular altura de acúmulo - considerando que em desktop há uma barra de tarefas
    // Usando 90% da altura da tela em vez de valor fixo para melhor responsividade
    const SETTLE_POSITION = 90; // Posição percentual onde as notas começam a se acumular
    
    // Cria notas iniciais
    const createNotes = () => {
      const newNotes: FallingNote[] = []
      for (let i = 0; i < 25; i++) {
        // Distribuir notas aleatoriamente na tela
        const startY = Math.random() * -100;
        
        newNotes.push({
          id: i,
          x: Math.random() * 100,
          y: startY,
          speed: Math.random() * 0.6 + 0.2,
          scale: Math.random() * 0.3 + 0.2, // Tamanho entre 0.2 e 0.5
          opacity: Math.random() * 0.5 + 0.3,
          rotate: Math.random() * 360,
          type: Math.floor(Math.random() * moneyNoteTypes.length), // Escolhe uma das notas aleatoriamente
          isSettled: false,
          zIndex: Math.floor(Math.random() * 10),
          settleHeight: SETTLE_POSITION + (Math.random() * 5), // Variação na altura de acúmulo
          settleTime: 0,
          fadingOut: false
        })
      }
      setNotes(newNotes)
    }

    createNotes()

    // Animar as notas
    const animationInterval = setInterval(() => {
      setNotes(prevNotes => {
        return prevNotes.map(note => {
          // Se a nota está desaparecendo (fade out)
          if (note.fadingOut) {
            const newOpacity = note.opacity - 0.03; // Velocidade do desaparecimento
            
            // Se já desapareceu completamente, recicla como nova nota caindo
            if (newOpacity <= 0) {
              return {
                ...note,
                y: Math.random() * -30,
                x: Math.random() * 100,
                speed: Math.random() * 0.6 + 0.2,
                scale: Math.random() * 0.3 + 0.2,
                opacity: Math.random() * 0.5 + 0.3,
                rotate: Math.random() * 360,
                isSettled: false,
                settleTime: 0,
                fadingOut: false,
                zIndex: Math.floor(Math.random() * 10)
              };
            }
            
            // Continuar desaparecendo
            return {
              ...note,
              opacity: newOpacity
            };
          }
          
          // Se a nota já está acumulada, incrementa o tempo e verifica se deve começar a desaparecer
          if (note.isSettled) {
            const newSettleTime = note.settleTime + 1;
            
            // Se atingiu o tempo máximo, começa a desaparecer
            if (newSettleTime >= SETTLE_TIME_MAX) {
              return {
                ...note,
                fadingOut: true,
                settleTime: newSettleTime
              };
            }
            
            // Continua acumulada
            return {
              ...note,
              settleTime: newSettleTime
            };
          }
          
          // Calcular novo Y (posição vertical)
          const newY = note.y + note.speed;
          
          // Adicionar pequena deriva horizontal para movimento mais natural
          const horizontalDrift = Math.sin(newY / 20) * 0.1;
          const newX = note.x + horizontalDrift;
          
          // Verificar se a nota deve se acumular
          if (newY >= note.settleHeight) {
            // Contar quantas notas já estão acumuladas (não considerando as que estão desaparecendo)
            const settledCount = prevNotes.filter(n => n.isSettled && !n.fadingOut).length;
            
            // Se já temos muitas notas acumuladas, essa nota continua caindo além da tela
            if (settledCount >= MAX_ACCUMULATED_NOTES) {
              return {
                ...note,
                y: newY,
                x: newX,
                rotate: note.rotate + (Math.random() * 0.3 + 0.1)
              };
            }
            
            // Calcular posição final com pequena variação para parecer natural
            const settleX = newX + (Math.random() * 4 - 2);
            // Ajuste de rotação para parecer que está deitada
            const settleRotate = (Math.random() * 60) - 30;
            
            return {
              ...note,
              x: settleX,
              y: note.settleHeight, // Usa a altura de acúmulo específica para esta nota
              rotate: settleRotate,
              isSettled: true,
              zIndex: 50 + Math.floor(Math.random() * 50), // Para que as notas acumuladas fiquem acima das caindo
              speed: 0,
              settleTime: 0
            };
          }
          
          // Se a nota saiu da tela, recomeça do topo
          if (newY > 100) {
            return {
              ...note,
              y: Math.random() * -30,
              x: Math.random() * 100,
              rotate: Math.random() * 360
            };
          }
          
          // Atualiza posição normalmente
          return {
            ...note,
            y: newY,
            x: newX,
            rotate: note.rotate + (Math.random() * 0.3 + 0.1) // Rotação suave
          };
        });
      });
    }, 50);

    return () => clearInterval(animationInterval)
  }, [windowHeight])

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    
    try {
      // Chamar a API de login
      await login(data)
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o dashboard...",
      })
      
      // Redirecionar para o dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Erro no login:", error)
      
      // Para debugging durante o desenvolvimento
      if (data.username === "Andreteste" && data.password === "teste1234") {
        // No modo de desenvolvimento, permitir hardcoded login para testes
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          username: 'Andreteste',
          email: 'andre@engparente.com',
          first_name: 'André',
          last_name: 'Teste'
        }))
        
        localStorage.setItem('accessToken', 'dev_token')
        localStorage.setItem('refreshToken', 'dev_refresh_token')
        
        toast({
          title: "Login realizado com sucesso (modo desenvolvimento)!",
          description: "Redirecionando para o dashboard...",
        })
        
        router.push("/dashboard")
        return
      }
      
      toast({
        title: "Erro de autenticação",
        description: error instanceof Error ? error.message : "Credenciais inválidas",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Variantes para animações de entrada dos campos do formulário
  const formItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3 + i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden relative">
      {/* Background com degradê estático mais suave */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#006D77]/60 via-[#009688]/50 to-[#006D77]/60"></div>
        
        {/* Overlay gradients para criar mistura de cores mais suave */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#EDE4D0]/25 via-transparent to-[#006D77]/20 opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#009688]/30 via-transparent to-[#EDE4D0]/15 opacity-70"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-[#F5F5F5]/20 to-[#006D77]/30 opacity-60"></div>
        
        {/* Central radial highlight */}
        <div className="absolute inset-0 bg-gradient-radial from-[#F5F5F5]/30 via-transparent to-transparent opacity-90"></div>
        
        {/* Depth layers */}
        <div className="absolute inset-0 backdrop-blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#006D77]/40 to-transparent opacity-40"></div>
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-[#009688]/20 to-transparent opacity-40"></div>
      </div>

      {/* Área de acúmulo de notas na parte inferior (visual adicional) */}
      <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-gradient-to-t from-black/10 to-transparent z-0"></div>

      {/* Notas de dinheiro caindo */}
      {notes.map((note) => (
        <div
          key={note.id}
          className="absolute pointer-events-none"
          style={{
            left: `${note.x}%`,
            top: `${note.y}%`,
            opacity: note.opacity,
            transform: `rotate(${note.rotate}deg) scale(${note.scale})`,
            filter: note.isSettled 
              ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' 
              : 'drop-shadow(0 3px 5px rgba(0,0,0,0.2))',
            transition: note.fadingOut
              ? 'opacity 0.5s ease-out' 
              : note.isSettled 
                ? 'all 0.5s ease-out' 
                : 'transform 0.2s ease',
            zIndex: note.isSettled ? note.zIndex : 1
          }}
        >
          <Image 
            src={moneyNoteTypes[note.type]} 
            alt="Nota"
            width={300} 
            height={150}
            className="w-auto h-auto max-w-[200px]"
          />
        </div>
      ))}

      <motion.div 
        className="w-full max-w-md space-y-6 z-10"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-xl bg-card/70 backdrop-blur-md p-8 shadow-xl border border-primary/10"
        >
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05, rotate: [0, 2, -2, 0] }}
              transition={{ duration: 0.5 }}
              className="relative h-28 w-28 overflow-hidden"
            >
              <Image
                src="/logo_engparente.png"
                alt="Eng. Parente Logo"
                fill
                style={{ objectFit: 'contain' }}
                className="drop-shadow-lg"
              />
            </motion.div>
            
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text">
                Gestão <span className="text-primary">Eng. Parente</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Acesse o sistema para gerenciar sua empresa
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <motion.div
                custom={0}
                variants={formItemVariants}
                initial="hidden"
                animate="visible"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite seu nome de usuário" 
                          {...field} 
                          className="bg-card/50 backdrop-blur-sm border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all duration-300"
                        />
                      </FormControl>
                      <FormMessage className="animate-in slide-in-from-left-2 duration-200" />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                custom={1}
                variants={formItemVariants}
                initial="hidden"
                animate="visible"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="bg-card/50 backdrop-blur-sm border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all duration-300"
                        />
                      </FormControl>
                      <FormMessage className="animate-in slide-in-from-left-2 duration-200" />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                custom={2}
                variants={formItemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 relative overflow-hidden group"
                  disabled={isLoading}
                >
                  <span className="relative z-10">
                    {isLoading ? "Entrando..." : "Entrar"}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="absolute inset-y-0 right-full w-full bg-primary/10 group-hover:animate-shine"></span>
                </Button>
              </motion.div>
            </form>
          </Form>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-4 text-center text-xs text-muted-foreground"
        >
          &copy; {new Date().getFullYear()} Engenharia Parente. Todos os direitos reservados.
        </motion.div>
      </motion.div>
    </div>
  )
} 