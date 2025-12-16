"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Navbar } from "@/components/shared/ui/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"
import { Label } from "@/components/shared/ui/label"
import { Badge } from "@/components/shared/ui/badge"
import {
  MessageSquare, Mail, Clock, Send, CheckCircle2,
  HelpCircle, Book, Bug, Lightbulb, Building2, RefreshCw
} from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/lib/hooks/use-toast"
import { Toaster } from "@/components/shared/ui/toaster"
import Link from "next/link"

const tiposConsulta = [
  { id: "general", label: "Consulta General", icon: HelpCircle },
  { id: "tecnico", label: "Soporte Técnico", icon: Bug },
  { id: "sugerencia", label: "Sugerencia", icon: Lightbulb },
  { id: "empresarial", label: "Plan Empresarial", icon: Building2 },
]

const recursos = [
  {
    titulo: "Preguntas Frecuentes",
    descripcion: "Encuentra respuestas a las dudas más comunes",
    icon: HelpCircle,
    href: "/faq",
    color: "from-emerald-500/20 to-teal-500/20"
  },
  {
    titulo: "Documentación API",
    descripcion: "Guía técnica para desarrolladores",
    icon: Book,
    href: "/api-docs",
    color: "from-blue-500/20 to-cyan-500/20"
  },
  {
    titulo: "Asistente IA",
    descripcion: "Obtén ayuda instantánea con nuestro asistente",
    icon: MessageSquare,
    href: "/estudiantes/talleres",
    color: "from-purple-500/20 to-indigo-500/20"
  }
]

// Generar código CAPTCHA alfanumérico
function generarCodigoCaptcha(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let codigo = ''
  for (let i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return codigo
}

// Componente Canvas para CAPTCHA visual
function CaptchaCanvas({ codigo, onRefresh }: { codigo: string; onRefresh: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Fondo con gradiente oscuro
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Líneas de ruido
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.strokeStyle = `rgba(${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, ${Math.random() * 100 + 155}, 0.4)`
      ctx.lineWidth = Math.random() * 2 + 1
      ctx.stroke()
    }

    // Puntos de ruido
    for (let i = 0; i < 50; i++) {
      ctx.beginPath()
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 2,
        0,
        Math.PI * 2
      )
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`
      ctx.fill()
    }

    // Texto del CAPTCHA
    const colors = ['#a855f7', '#8b5cf6', '#6366f1', '#22d3ee', '#10b981', '#f59e0b']
    const fontSize = 32
    ctx.font = `bold ${fontSize}px 'Courier New', monospace`
    ctx.textBaseline = 'middle'

    const startX = 20
    const charWidth = (canvas.width - 40) / codigo.length

    codigo.split('').forEach((char, i) => {
      ctx.save()

      const x = startX + i * charWidth + charWidth / 2
      const y = canvas.height / 2

      // Rotación aleatoria
      const rotation = (Math.random() - 0.5) * 0.5
      ctx.translate(x, y)
      ctx.rotate(rotation)

      // Escala aleatoria
      const scale = 0.9 + Math.random() * 0.3
      ctx.scale(scale, scale)

      // Color aleatorio
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]

      // Sombra
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 3
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      ctx.fillText(char, -fontSize / 3, 0)

      ctx.restore()
    })

  }, [codigo])

  return (
    <div className="flex items-center gap-2">
      <canvas
        ref={canvasRef}
        width={200}
        height={60}
        className="rounded-lg border border-white/20"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        className="text-white/60 hover:text-white hover:bg-white/10"
        title="Regenerar CAPTCHA"
      >
        <RefreshCw className="h-5 w-5" />
      </Button>
    </div>
  )
}

export default function SoportePage() {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [tipo, setTipo] = useState("general")
  const [mensaje, setMensaje] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [captchaCodigo, setCaptchaCodigo] = useState("")
  const [captchaInput, setCaptchaInput] = useState("")
  const { toast } = useToast()

  const regenerarCaptcha = useCallback(() => {
    setCaptchaCodigo(generarCodigoCaptcha())
    setCaptchaInput("")
  }, [])

  useEffect(() => {
    regenerarCaptcha()
  }, [regenerarCaptcha])

  async function enviarMensaje(e: React.FormEvent) {
    e.preventDefault()

    if (!nombre.trim() || !email.trim() || !mensaje.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      })
      return
    }

    // Validar CAPTCHA
    if (captchaInput.toUpperCase() !== captchaCodigo) {
      toast({
        title: "CAPTCHA incorrecto",
        description: "Por favor verifica el código e intenta nuevamente",
        variant: "destructive"
      })
      regenerarCaptcha()
      return
    }

    setEnviando(true)

    // Simular envío (en producción esto iría a un endpoint real)
    await new Promise(resolve => setTimeout(resolve, 1500))

    setEnviando(false)
    setEnviado(true)
    toast({
      title: "¡Mensaje enviado!",
      description: "Te responderemos lo antes posible"
    })

    // Reset form
    setNombre("")
    setEmail("")
    setTipo("general")
    setMensaje("")
    regenerarCaptcha()

    setTimeout(() => setEnviado(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[30rem] w-[50rem] blur-3xl opacity-20"
          style={{ background: "radial-gradient(ellipse at center, rgba(168,85,247,0.4) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)" }}
        />

        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex p-3 rounded-2xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 mb-6"
          >
            <MessageSquare className="h-8 w-8 text-purple-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Centro de Soporte
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/70"
          >
            Estamos aquí para ayudarte. Contáctanos y te responderemos lo antes posible.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-6 mt-6"
          >
            <div className="flex items-center gap-2 text-white/60">
              <Mail className="h-4 w-4" />
              <span className="text-sm">soporte@skillsforge.dev</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Respuesta en 24-48h</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recursos rápidos */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {recursos.map((recurso, i) => (
            <Link key={recurso.titulo} href={recurso.href}>
              <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors h-full group">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${recurso.color}`}>
                    <recurso.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">{recurso.titulo}</h3>
                    <p className="text-sm text-white/60">{recurso.descripcion}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </motion.div>
      </section>

      {/* Formulario de contacto */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-purple-400" />
                Envíanos un mensaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={enviarMensaje} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre" className="text-white/90">Nombre</Label>
                    <Input
                      id="nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre"
                      className="bg-black/30 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/90">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="bg-black/30 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/90">Tipo de consulta</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {tiposConsulta.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTipo(t.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${tipo === t.id
                            ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                          }`}
                      >
                        <t.icon className="h-4 w-4" />
                        <span className="text-sm">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensaje" className="text-white/90">Mensaje</Label>
                  <textarea
                    id="mensaje"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Describe tu consulta o problema..."
                    rows={5}
                    className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>

                {/* CAPTCHA */}
                <div className="space-y-3">
                  <Label className="text-white/90">Verificación de seguridad</Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <CaptchaCanvas codigo={captchaCodigo} onRefresh={regenerarCaptcha} />
                    <div className="flex-1 w-full sm:w-auto">
                      <Input
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                        placeholder="Escribe el código"
                        maxLength={6}
                        className="bg-black/30 border-white/20 text-white placeholder:text-white/40 font-mono tracking-widest"
                      />
                      <p className="text-xs text-white/40 mt-1">Escribe los 6 caracteres que ves en la imagen</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-sm text-white/50">
                    También puedes escribirnos a <span className="text-purple-400">soporte@skillsforge.dev</span>
                  </p>

                  <Button
                    type="submit"
                    disabled={enviando || enviado}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white px-8"
                  >
                    {enviado ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Enviado
                      </>
                    ) : enviando ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar mensaje
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info adicional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid sm:grid-cols-2 gap-6"
        >
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-3">
                Estudiantes
              </Badge>
              <h3 className="font-semibold text-white mb-2">Soporte para estudiantes</h3>
              <p className="text-sm text-white/60 mb-4">
                ¿Tienes problemas con tu cuenta, inscripciones o acceso a talleres?
                Nuestro equipo te ayudará a resolver cualquier inconveniente.
              </p>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Problemas de acceso
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Gestión de inscripciones
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Certificados y constancias
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-3">
                Empresas
              </Badge>
              <h3 className="font-semibold text-white mb-2">Soluciones empresariales</h3>
              <p className="text-sm text-white/60 mb-4">
                ¿Interesado en capacitar a tu equipo? Ofrecemos planes personalizados
                para empresas con talleres privados y reportes de progreso.
              </p>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  Planes corporativos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  Talleres a medida
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  Dashboard de analytics
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      <Toaster />
    </div>
  )
}
