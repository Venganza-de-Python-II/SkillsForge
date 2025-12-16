"use client"

import { useState } from "react"
import { Navbar } from "@/components/shared/ui/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Badge } from "@/components/shared/ui/badge"
import { Button } from "@/components/shared/ui/button"
import { 
  Code, Server, Key, Shield, Zap, Database, 
  ChevronRight, Copy, Check, ExternalLink,
  BookOpen, Terminal, Lock, Globe
} from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/lib/hooks/use-toast"
import { Toaster } from "@/components/shared/ui/toaster"

const API_BASE = "https://qt6hwpaad0.execute-api.us-east-1.amazonaws.com/dev"

const endpoints = [
  {
    categoria: "Autenticación",
    icon: Key,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    endpoints: [
      {
        method: "POST",
        path: "/auth/login",
        descripcion: "Login de administradores",
        body: { usuario: "admin@skillsforge.dev", contrasena: "contraseña" },
        response: { token: "eyJhbGciOiJIUzI1NiIs...", usuario: { email: "...", rol: "admin" } }
      },
      {
        method: "POST",
        path: "/auth/estudiantes/login",
        descripcion: "Login de estudiantes",
        body: { email: "estudiante@email.com", contrasena: "contraseña" },
        response: { token: "eyJhbGciOiJIUzI1NiIs...", estudiante: { id: "...", nombre: "..." } }
      },
      {
        method: "POST",
        path: "/auth/estudiantes/registro",
        descripcion: "Registro de nuevos estudiantes",
        body: { nombre: "Juan", apellido: "Pérez", email: "juan@email.com", contrasena: "MiPassword123!" },
        response: { message: "Estudiante registrado exitosamente", estudiante_id: "..." }
      }
    ]
  },
  {
    categoria: "Talleres",
    icon: BookOpen,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    endpoints: [
      {
        method: "GET",
        path: "/workshops",
        descripcion: "Listar todos los talleres",
        auth: false,
        response: { talleres: [{ _id: "...", nombre: "Python Básico", categoria: "programming" }] }
      },
      {
        method: "GET",
        path: "/workshops/{id}",
        descripcion: "Obtener detalle de un taller",
        auth: false,
        response: { _id: "...", nombre: "...", descripcion: "...", cupos_disponibles: 25 }
      },
      {
        method: "POST",
        path: "/workshops",
        descripcion: "Crear nuevo taller (Admin)",
        auth: true,
        body: { nombre: "Nuevo Taller", descripcion: "...", fecha: "2025-07-01", hora: "10:00", lugar: "Aula 101", categoria: "programming", cupo: 30 },
        response: { message: "Taller creado", taller_id: "..." }
      },
      {
        method: "PUT",
        path: "/workshops/{id}",
        descripcion: "Actualizar taller (Admin)",
        auth: true,
        body: { nombre: "Nombre actualizado", cupo: 40 },
        response: { message: "Taller actualizado" }
      },
      {
        method: "DELETE",
        path: "/workshops/{id}",
        descripcion: "Eliminar taller (Admin)",
        auth: true,
        response: { message: "Taller eliminado" }
      }
    ]
  },
  {
    categoria: "Inscripciones",
    icon: Database,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    endpoints: [
      {
        method: "POST",
        path: "/workshops/{id}/register",
        descripcion: "Inscribirse a un taller",
        auth: true,
        response: { message: "Inscripción exitosa", registro_id: "..." }
      },
      {
        method: "DELETE",
        path: "/workshops/{id}/register",
        descripcion: "Cancelar inscripción",
        auth: true,
        response: { message: "Inscripción cancelada" }
      },
      {
        method: "GET",
        path: "/registrations/mine",
        descripcion: "Ver mis inscripciones",
        auth: true,
        response: { inscripciones: [{ taller_id: "...", fecha_inscripcion: "..." }] }
      }
    ]
  },
  {
    categoria: "Estadísticas",
    icon: Zap,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    endpoints: [
      {
        method: "GET",
        path: "/workshops/stats",
        descripcion: "Estadísticas generales de la plataforma",
        auth: false,
        response: { talleres: 15, estudiantes: 150, registros: 89, ocupacion: 45 }
      }
    ]
  },
  {
    categoria: "IA",
    icon: Terminal,
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    endpoints: [
      {
        method: "POST",
        path: "/ai/chat",
        descripcion: "Chat con asistente IA",
        auth: true,
        body: { message: "¿Qué talleres de Python tienen cupos?" },
        response: { response: "Tenemos los siguientes talleres de Python disponibles...", actions: [] }
      }
    ]
  }
]

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30"
}

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  
  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast({ title: "Copiado al portapapeles" })
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="relative group">
      <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code className="text-white/80">{code}</code>
      </pre>
      <button
        onClick={copyCode}
        className="absolute top-2 right-2 p-2 rounded bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/60" />}
      </button>
    </div>
  )
}

function EndpointCard({ endpoint }: { endpoint: typeof endpoints[0]["endpoints"][0] }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
      >
        <Badge className={`${methodColors[endpoint.method]} border font-mono`}>
          {endpoint.method}
        </Badge>
        <code className="text-white/90 font-mono text-sm flex-1">{endpoint.path}</code>
        {endpoint.auth && (
          <Lock className="h-4 w-4 text-amber-400" title="Requiere autenticación" />
        )}
        <ChevronRight className={`h-4 w-4 text-white/40 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      
      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-white/10">
          <p className="text-white/70 text-sm">{endpoint.descripcion}</p>
          
          {endpoint.auth && (
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <Shield className="h-4 w-4" />
              Requiere header: <code className="bg-black/30 px-2 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code>
            </div>
          )}
          
          {endpoint.body && (
            <div>
              <p className="text-sm text-white/60 mb-2">Request Body:</p>
              <CodeBlock code={JSON.stringify(endpoint.body, null, 2)} />
            </div>
          )}
          
          {endpoint.response && (
            <div>
              <p className="text-sm text-white/60 mb-2">Response:</p>
              <CodeBlock code={JSON.stringify(endpoint.response, null, 2)} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function APIDocsPage() {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const { toast } = useToast()
  
  const copyBaseUrl = () => {
    navigator.clipboard.writeText(API_BASE)
    setCopiedUrl(true)
    toast({ title: "URL copiada" })
    setTimeout(() => setCopiedUrl(false), 2000)
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
            <Code className="h-8 w-8 text-purple-400" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Documentación API
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/70 mb-8"
          >
            API REST serverless con AWS Lambda, API Gateway y DynamoDB
          </motion.p>
          
          {/* Base URL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-3 bg-black/40 rounded-lg p-3 border border-white/10"
          >
            <Globe className="h-5 w-5 text-purple-400" />
            <code className="text-white/90 text-sm">{API_BASE}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyBaseUrl}
              className="h-8 text-white hover:bg-white/10 hover:text-white"
            >
              {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </motion.div>
        </div>
      </section>
      
      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Server, title: "Serverless", desc: "AWS Lambda + API Gateway" },
            { icon: Shield, title: "Seguro", desc: "JWT con AWS Cognito" },
            { icon: Zap, title: "Rápido", desc: "Respuestas < 100ms" }
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <feat.icon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{feat.title}</h3>
                    <p className="text-sm text-white/60">{feat.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Autenticación */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                Autenticación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/80">
                Los endpoints protegidos requieren un token JWT en el header <code className="bg-black/30 px-2 py-0.5 rounded">Authorization</code>.
              </p>
              <CodeBlock code={`curl -X GET "${API_BASE}/registrations/mine" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."`} language="bash" />
              <p className="text-sm text-white/60">
                Obtén tu token haciendo login en <code className="bg-black/30 px-1 rounded">/auth/login</code> o <code className="bg-black/30 px-1 rounded">/auth/estudiantes/login</code>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>
      
      {/* Endpoints */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6">Endpoints</h2>
        
        <div className="space-y-8">
          {endpoints.map((cat, i) => (
            <motion.div
              key={cat.categoria}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${cat.bgColor}`}>
                  <cat.icon className={`h-5 w-5 ${cat.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-white">{cat.categoria}</h3>
              </div>
              
              <div className="space-y-2">
                {cat.endpoints.map((ep, j) => (
                  <EndpointCard key={j} endpoint={ep} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Ejemplo completo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-12"
        >
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Terminal className="h-5 w-5 text-purple-400" />
                Ejemplo Completo: Flujo de Inscripción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/70">1. Login como estudiante:</p>
              <CodeBlock code={`curl -X POST "${API_BASE}/auth/estudiantes/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"estudiante@email.com","contrasena":"MiPassword123!"}'`} />
              
              <p className="text-white/70">2. Listar talleres disponibles:</p>
              <CodeBlock code={`curl -X GET "${API_BASE}/workshops"`} />
              
              <p className="text-white/70">3. Inscribirse a un taller:</p>
              <CodeBlock code={`curl -X POST "${API_BASE}/workshops/TALLER_ID/register" \\
  -H "Authorization: Bearer TU_TOKEN"`} />
            </CardContent>
          </Card>
        </motion.div>
        
        {/* SDKs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-8 text-center"
        >
          <p className="text-white/60 mb-4">¿Necesitas ayuda integrando la API?</p>
          <a href="/soporte">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white">
              <ExternalLink className="h-4 w-4 mr-2" />
              Contactar Soporte
            </Button>
          </a>
        </motion.div>
      </section>
      
      <Toaster />
    </div>
  )
}
