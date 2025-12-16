"use client"

import { useState } from "react"
import { Navbar } from "@/components/shared/ui/navbar"
import { Card, CardContent } from "@/components/shared/ui/card"
import { ChevronDown, HelpCircle, Search } from "lucide-react"
import { Input } from "@/components/shared/ui/input"
import { motion, AnimatePresence } from "framer-motion"

const faqs = [
  {
    categoria: "General",
    preguntas: [
      {
        pregunta: "¿Qué es SkillsForge?",
        respuesta: "SkillsForge es una plataforma de gestión de talleres profesionales que permite a estudiantes inscribirse en cursos y a administradores gestionar el contenido educativo. Utilizamos tecnología de punta con AWS y un asistente de IA para mejorar tu experiencia."
      },
      {
        pregunta: "¿Cómo me registro como estudiante?",
        respuesta: "Haz clic en 'Estudiantes' en la barra de navegación, luego selecciona 'Registrarse'. Completa el formulario con tu nombre, email y contraseña. Verifica el CAPTCHA y listo, ¡ya puedes inscribirte en talleres!"
      },
      {
        pregunta: "¿Es gratis usar SkillsForge?",
        respuesta: "¡Sí! La plataforma es completamente gratuita para estudiantes. Puedes ver todos los talleres disponibles, inscribirte y gestionar tus inscripciones sin costo alguno."
      }
    ]
  },
  {
    categoria: "Talleres",
    preguntas: [
      {
        pregunta: "¿Cómo me inscribo en un taller?",
        respuesta: "Una vez logueado como estudiante, ve a 'Talleres', encuentra el curso que te interesa y haz clic en 'Inscribirme'. El asistente de IA también puede ayudarte a encontrar talleres según tus intereses."
      },
      {
        pregunta: "¿Puedo cancelar mi inscripción?",
        respuesta: "Sí, puedes anular tu inscripción en cualquier momento antes de que inicie el taller. Ve a 'Mis Registros' y haz clic en 'Anular' en el taller que deseas cancelar."
      },
      {
        pregunta: "¿Qué pasa si un taller se llena?",
        respuesta: "Cada taller tiene un cupo limitado. Si el taller está lleno, no podrás inscribirte. Te recomendamos usar el asistente de IA para encontrar alternativas similares o inscribirte temprano en los talleres populares."
      },
      {
        pregunta: "¿Hay talleres de Arroz con Pollo?",
        respuesta: "¡Por supuesto! Tenemos una categoría completa de Cocina Tech que incluye el famoso 'Arroz con Pollo I: Fundamentos' y su secuela 'El Sofrito'. También 'Empanadas con AWS Lambda' y 'Tacos y Terraform'. 🍳"
      }
    ]
  },
  {
    categoria: "Cuenta",
    preguntas: [
      {
        pregunta: "¿Olvidé mi contraseña, qué hago?",
        respuesta: "Por el momento, contacta al soporte técnico para restablecer tu contraseña. Estamos trabajando en implementar la recuperación automática por email."
      },
      {
        pregunta: "¿Puedo cambiar mi email?",
        respuesta: "El email está vinculado a tu cuenta de AWS Cognito. Para cambiarlo, contacta al administrador del sistema."
      },
      {
        pregunta: "¿Cómo cierro sesión?",
        respuesta: "Haz clic en el botón 'Salir' en la esquina superior derecha de la pantalla cuando estés logueado."
      }
    ]
  },
  {
    categoria: "Asistente IA",
    preguntas: [
      {
        pregunta: "¿Qué puede hacer el asistente de IA?",
        respuesta: "El asistente puede recomendarte talleres según tus intereses, generar rutas de aprendizaje personalizadas, inscribirte directamente en cursos y filtrar talleres por categoría. ¡Pregúntale lo que necesites!"
      },
      {
        pregunta: "¿El asistente IA usa mis datos personales?",
        respuesta: "El asistente solo tiene acceso a información pública de los talleres y a tus inscripciones actuales para darte mejores recomendaciones. No almacenamos conversaciones ni datos sensibles."
      },
      {
        pregunta: "¿Qué es la 'Ruta del Desarrollador Caótico'?",
        respuesta: "Es una ruta de aprendizaje humorística generada por la IA que incluye talleres como 'Git Blame: Culpar a Otros', 'Como Salir de Vim' y 'Stack Overflow CopyPaste Pro'. ¡Perfecta para desarrolladores con sentido del humor!"
      }
    ]
  },
  {
    categoria: "Técnico",
    preguntas: [
      {
        pregunta: "¿Qué tecnologías usa SkillsForge?",
        respuesta: "Frontend con Next.js 15 y React, backend serverless con AWS Lambda, base de datos DynamoDB, autenticación con AWS Cognito, y asistente IA con Amazon Bedrock (Nova Micro)."
      },
      {
        pregunta: "¿La plataforma es segura?",
        respuesta: "Sí, usamos JWT tokens firmados por AWS Cognito, verificación de roles para rutas administrativas, y todas las comunicaciones están encriptadas con HTTPS."
      }
    ]
  }
]

function FAQItem({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  const [abierto, setAbierto] = useState(false)
  
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-purple-400 transition-colors"
      >
        <span className="font-medium text-white pr-4">{pregunta}</span>
        <ChevronDown className={`h-5 w-5 text-purple-400 flex-shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-white/70 leading-relaxed">{respuesta}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQPage() {
  const [busqueda, setBusqueda] = useState("")
  
  const faqsFiltradas = faqs.map(cat => ({
    ...cat,
    preguntas: cat.preguntas.filter(p => 
      p.pregunta.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.respuesta.toLowerCase().includes(busqueda.toLowerCase())
    )
  })).filter(cat => cat.preguntas.length > 0)

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
            <HelpCircle className="h-8 w-8 text-purple-400" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Preguntas Frecuentes
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/70 mb-8"
          >
            Encuentra respuestas a las dudas más comunes sobre SkillsForge
          </motion.p>
          
          {/* Buscador */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md mx-auto relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <Input
              type="text"
              placeholder="Buscar preguntas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </motion.div>
        </div>
      </section>
      
      {/* FAQs */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        {faqsFiltradas.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-12 text-center">
              <p className="text-white/60">No se encontraron preguntas que coincidan con tu búsqueda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {faqsFiltradas.map((cat, i) => (
              <motion.div
                key={cat.categoria}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <h2 className="text-lg font-semibold text-purple-400 mb-4">{cat.categoria}</h2>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    {cat.preguntas.map((faq, j) => (
                      <FAQItem key={j} pregunta={faq.pregunta} respuesta={faq.respuesta} />
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Card className="bg-[#0b0e13] border-purple-500/30 shadow-lg shadow-purple-500/10">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold mb-2 text-white">¿No encontraste lo que buscabas?</h3>
              <p className="text-white/70 mb-4">Nuestro equipo de soporte está listo para ayudarte</p>
              <a href="/soporte" className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:brightness-110 transition">
                Contactar Soporte
              </a>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  )
}
