"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Input } from "@/components/shared/ui/input"
import { Label } from "@/components/shared/ui/label"
import { Button } from "@/components/shared/ui/button"
import { useToast } from "@/lib/hooks/use-toast"
import { apiFetch, guardarTokenEstudiante } from "@/lib/api"
import { Eye, EyeOff, Copy, Wand2, RefreshCw, ShieldCheck, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/shared/ui/progress"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/shared/ui/navbar"
import { Toaster } from "@/components/shared/ui/toaster"

// Generar código CAPTCHA aleatorio
function generarCodigoCaptcha(longitud = 6) {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres confusos (0,O,1,I)
  let codigo = '';
  for (let i = 0; i < longitud; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}

// Componente CAPTCHA visual con canvas
function CaptchaCanvas({ codigo, onRefresh }: { codigo: string; onRefresh: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo con gradiente oscuro
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Líneas de ruido de fondo
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${100 + Math.random() * 100}, ${50 + Math.random() * 100}, ${150 + Math.random() * 100}, 0.3)`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.bezierCurveTo(
        Math.random() * canvas.width, Math.random() * canvas.height,
        Math.random() * canvas.width, Math.random() * canvas.height,
        Math.random() * canvas.width, Math.random() * canvas.height
      );
      ctx.stroke();
    }
    
    // Puntos de ruido
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, ${0.1 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Dibujar cada letra con estilo diferente
    const colors = ['#a855f7', '#8b5cf6', '#6366f1', '#ec4899', '#f472b6', '#c084fc'];
    const startX = 20;
    const spacing = (canvas.width - 40) / codigo.length;
    
    codigo.split('').forEach((char, i) => {
      ctx.save();
      
      // Posición con variación
      const x = startX + i * spacing + (Math.random() - 0.5) * 10;
      const y = canvas.height / 2 + (Math.random() - 0.5) * 15;
      
      // Rotación aleatoria
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      
      // Estilo de texto
      const fontSize = 28 + Math.random() * 8;
      ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      // Sombra
      ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Dibujar letra
      ctx.fillText(char, 0, 0);
      
      // Borde/outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 0.5;
      ctx.strokeText(char, 0, 0);
      
      ctx.restore();
    });
    
    // Líneas que cruzan las letras
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${150 + Math.random() * 105}, ${100 + Math.random() * 155}, ${200 + Math.random() * 55}, 0.4)`;
      ctx.lineWidth = 1 + Math.random();
      ctx.moveTo(0, Math.random() * canvas.height);
      ctx.lineTo(canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
    
  }, [codigo]);

  return (
    <div className="flex items-center gap-2">
      <canvas
        ref={canvasRef}
        width={200}
        height={60}
        className="rounded-md border border-white/20 select-none"
        style={{ imageRendering: 'crisp-edges' }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-white/60 hover:text-white hover:bg-white/10 h-10 w-10 p-0 rounded-md border border-white/10 hover:border-white/20"
        onClick={onRefresh}
        aria-label="Nuevo código"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}

function generarContrasena(longitud = 14, usarSimbolos = true) {
  const letras = "abcdefghijklmnopqrstuvwxyz"
  const mayus = letras.toUpperCase()
  const numeros = "0123456789"
  const simbolos = "!@#$%^&*()-_=+[]{};:,.?/"
  const conjuntos = [letras, mayus, numeros, ...(usarSimbolos ? [simbolos] : [])]
  const obligatorio = conjuntos.map((set) => set[Math.floor(Math.random() * set.length)])
  const pool = conjuntos.join("")
  const restante = longitud - obligatorio.length
  const aleatorios = new Uint32Array(restante)
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) window.crypto.getRandomValues(aleatorios)
  else for (let i = 0; i < restante; i++) aleatorios[i] = Math.floor(Math.random() * pool.length)
  const otros = Array.from(aleatorios, (n) => pool[n % pool.length])
  const base = [...obligatorio, ...otros]
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[base[i], base[j]] = [base[j], base[i]]
  }
  return base.join("")
}

function puntuarContrasena(valor: string) {
  let score = 0
  if (valor.length >= 8) score += 20
  if (valor.length >= 12) score += 20
  if (/[a-z]/.test(valor)) score += 15
  if (/[A-Z]/.test(valor)) score += 15
  if (/\d/.test(valor)) score += 15
  if (/[^A-Za-z0-9]/.test(valor)) score += 15
  return Math.min(score, 100)
}

export default function RegistroEstudiante() {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [mostrar, setMostrar] = useState(false)
  const [cargando, setCargando] = useState(false)
  
  // CAPTCHA state
  const [captchaCodigo, setCaptchaCodigo] = useState(() => generarCodigoCaptcha())
  const [captchaInput, setCaptchaInput] = useState("")
  const [captchaVerificado, setCaptchaVerificado] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/"

  const fuerza = useMemo(() => puntuarContrasena(contrasena), [contrasena])
  const etiquetaFuerza = useMemo(() => (fuerza < 40 ? "Débil" : fuerza < 70 ? "Media" : "Fuerte"), [fuerza])

  // Verificar CAPTCHA en tiempo real (case insensitive)
  useEffect(() => {
    if (captchaInput.toUpperCase() === captchaCodigo) {
      setCaptchaVerificado(true);
    } else {
      setCaptchaVerificado(false);
    }
  }, [captchaInput, captchaCodigo]);

  // Regenerar CAPTCHA
  const regenerarCaptcha = useCallback(() => {
    setCaptchaCodigo(generarCodigoCaptcha());
    setCaptchaInput("");
    setCaptchaVerificado(false);
  }, []);

  useEffect(() => {
    if (!contrasena) setContrasena(generarContrasena(14, true))
  }, [])
  
  async function copiar() {
    try {
      await navigator.clipboard.writeText(contrasena)
      toast({ title: "Copiado", description: "Contraseña copiada al portapapeles." })
    } catch {
      toast({ title: "No se pudo copiar", description: "Copia manualmente la contraseña.", variant: "destructive" })
    }
  }

  function generar() {
    const pwd = generarContrasena(14, true)
    setContrasena(pwd)
    toast({ title: "Contraseña generada", description: "Copia o ajusta tu contraseña antes de registrar." })
  }

  async function registrar() {
    if (!nombre.trim() || !email.trim() || !contrasena) {
      toast({ title: "Campos requeridos", description: "Completa nombre, email y contraseña.", variant: "destructive" })
      return
    }
    
    // Verificar CAPTCHA
    if (!captchaVerificado) {
      toast({ title: "Verificación requerida", description: "Por favor resuelve la operación matemática para continuar.", variant: "destructive" })
      return
    }
    
    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({ title: "Email inválido", description: "Por favor ingresa un email válido.", variant: "destructive" })
      return
    }
    
    // Validar requisitos de contraseña
    if (contrasena.length < 8) {
      toast({ title: "Contraseña muy corta", description: "La contraseña debe tener al menos 8 caracteres.", variant: "destructive" })
      return
    }
    if (!/[A-Z]/.test(contrasena)) {
      toast({ title: "Contraseña inválida", description: "La contraseña debe contener al menos una letra mayúscula.", variant: "destructive" })
      return
    }
    if (!/[a-z]/.test(contrasena)) {
      toast({ title: "Contraseña inválida", description: "La contraseña debe contener al menos una letra minúscula.", variant: "destructive" })
      return
    }
    if (!/[0-9]/.test(contrasena)) {
      toast({ title: "Contraseña inválida", description: "La contraseña debe contener al menos un número.", variant: "destructive" })
      return
    }
    if (!/[!@#$%^&*(),.?":{}|<>\-_=+\[\];'/\\]/.test(contrasena)) {
      toast({ title: "Contraseña inválida", description: "La contraseña debe contener al menos un carácter especial (!@#$%^&*).", variant: "destructive" })
      return
    }
    
    setCargando(true)
    try {
      const data = await apiFetch("/auth/estudiantes/registro", {
        metodo: "POST",
        cuerpo: { nombre, email, contrasena },
      })
      guardarTokenEstudiante(data.token)
      toast({ title: "¡Cuenta creada!", description: "Bienvenido a SkillsForge. Ya puedes inscribirte a talleres." })
      router.push(next)
    } catch (e: any) {
      let msg = e?.message || "Ocurrió un error inesperado"
      // Mensajes más amigables
      if (/email.*(uso|existe|registrado)|correo.*(uso|existe)/i.test(msg)) {
        msg = "Este correo ya está registrado. ¿Quieres iniciar sesión?"
      } else if (/usuario.*(uso|existe)/i.test(msg)) {
        msg = "Este usuario ya está registrado."
      } else if (/contraseña|password/i.test(msg)) {
        msg = "La contraseña no cumple los requisitos. Usa la contraseña generada automáticamente o crea una con mayúsculas, minúsculas, números y símbolos."
      }
      toast({ title: "No se pudo crear la cuenta", description: msg, variant: "destructive" })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white">
      <Navbar />
      <main className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Crear cuenta de estudiante</CardTitle>
            <CardDescription className="text-white/85">
              Regístrate para poder inscribirte a talleres y administrar tus inscripciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre" className="text-white/90">Nombre completo</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="bg-black/30 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-white/90">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="bg-black/30 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contrasena" className="text-white/90">Contraseña</Label>
              <div className="flex gap-2">
                <Input
                  id="contrasena"
                  type={mostrar ? "text" : "password"}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••••"
                  className="bg-black/30 border-white/20 text-white placeholder:text-white/60"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/30 [&>svg]:text-white"
                  onClick={() => setMostrar((s) => !s)}
                  aria-label="Alternar visibilidad"
                >
                  {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/30 [&>svg]:text-white"
                  onClick={copiar}
                  aria-label="Copiar contraseña"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-110"
                  onClick={generar}
                  aria-label="Generar contraseña"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={fuerza} className="w-full bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-indigo-600"/>
                <span className="text-sm text-white/85 w-14 text-right">{etiquetaFuerza}</span>
              </div>
            </div>
            
            {/* CAPTCHA Section */}
            <div className="grid gap-3 p-4 rounded-lg bg-gradient-to-r from-purple-500/5 to-indigo-500/5 border border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                <Label className="text-white/90 text-sm font-medium">Verificación de seguridad</Label>
                {captchaVerificado && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 ml-auto" />
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <CaptchaCanvas codigo={captchaCodigo} onRefresh={regenerarCaptcha} />
                <div className="flex-1 w-full sm:w-auto">
                  <Input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                    placeholder="Escribe el código"
                    className={`bg-black/30 border text-white text-center font-mono tracking-widest uppercase placeholder:text-white/40 placeholder:normal-case placeholder:tracking-normal ${
                      captchaVerificado 
                        ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' 
                        : captchaInput.length > 0 && !captchaVerificado 
                          ? 'border-red-500/50' 
                          : 'border-white/20'
                    }`}
                    maxLength={6}
                  />
                </div>
              </div>
              
              <p className="text-xs text-white/50">
                Escribe los caracteres que ves en la imagen (no distingue mayúsculas)
              </p>
            </div>
            
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cargando || !captchaVerificado}
              onClick={registrar}
            >
              {cargando ? "Creando cuenta..." : "Registrarme"}
            </Button>
          </CardContent>
        </Card>
      </main>
      <Toaster />
    </div>
  )
}
