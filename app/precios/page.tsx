"use client"

import { Navbar } from "@/components/shared/ui/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Badge } from "@/components/shared/ui/badge"
import { Check, Sparkles, Zap, Crown, Building2 } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

const planes = [
  {
    nombre: "Gratis",
    precio: "$0",
    periodo: "para siempre",
    descripcion: "Perfecto para empezar tu viaje de aprendizaje",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-500",
    popular: false,
    caracteristicas: [
      "Acceso a todos los talleres públicos",
      "Inscripción ilimitada",
      "Asistente IA básico",
      "Gestión de inscripciones",
      "Certificados de participación",
      "Soporte por email"
    ],
    cta: "Empezar Gratis",
    href: "/estudiantes/registro"
  },
  {
    nombre: "Pro",
    precio: "$9.99",
    periodo: "por mes",
    descripcion: "Para estudiantes comprometidos con su desarrollo",
    icon: Zap,
    color: "from-purple-500 to-indigo-500",
    popular: true,
    caracteristicas: [
      "Todo lo del plan Gratis",
      "Talleres exclusivos Pro",
      "Asistente IA avanzado",
      "Rutas de aprendizaje personalizadas",
      "Prioridad en cupos limitados",
      "Soporte prioritario 24/7",
      "Acceso anticipado a nuevos cursos",
      "Descarga de materiales"
    ],
    cta: "Próximamente",
    href: "#",
    disabled: true
  },
  {
    nombre: "Premium",
    precio: "$24.99",
    periodo: "por mes",
    descripcion: "La experiencia definitiva de aprendizaje",
    icon: Crown,
    color: "from-amber-500 to-orange-500",
    popular: false,
    caracteristicas: [
      "Todo lo del plan Pro",
      "Mentoría 1:1 mensual",
      "Acceso a grabaciones",
      "Proyectos reales con empresas",
      "Badge verificado de SkillsForge",
      "Networking con instructores",
      "Certificaciones oficiales",
      "API access para integraciones"
    ],
    cta: "Próximamente",
    href: "#",
    disabled: true
  }
]

const empresarial = {
  nombre: "Empresarial",
  descripcion: "Solución personalizada para equipos y organizaciones",
  icon: Building2,
  caracteristicas: [
    "Talleres privados para tu equipo",
    "Panel de administración dedicado",
    "Reportes y analytics avanzados",
    "Integración con SSO/SAML",
    "SLA garantizado",
    "Account manager dedicado",
    "Personalización de la plataforma",
    "Facturación empresarial"
  ]
}

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-[#0b0e13] text-white">
      <Navbar />
      
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[30rem] w-[50rem] blur-3xl opacity-20"
          style={{ background: "radial-gradient(ellipse at center, rgba(168,85,247,0.4) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)" }}
        />
        
        <div className="max-w-6xl mx-auto px-4 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-400 border-purple-500/30 mb-6">
              💡 Plan Gratis disponible
            </Badge>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Planes y Precios
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/70 max-w-2xl mx-auto"
          >
            Elige el plan que mejor se adapte a tus necesidades. 
            Comienza gratis y escala cuando estés listo.
          </motion.p>
        </div>
      </section>
      
      {/* Planes */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {planes.map((plan, i) => (
            <motion.div
              key={plan.nombre}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 px-4 py-1">
                    Más Popular
                  </Badge>
                </div>
              )}
              
              <Card className={`h-full bg-white/5 border-white/10 relative overflow-hidden ${plan.popular ? 'ring-2 ring-purple-500/50' : ''}`}>
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
                )}
                
                <CardHeader className="text-center pb-2 relative">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${plan.color} mx-auto mb-4 bg-opacity-20`}>
                    <plan.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">{plan.nombre}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{plan.precio}</span>
                    <span className="text-white/60 ml-2">{plan.periodo}</span>
                  </div>
                  <p className="text-sm text-white/60 mt-2">{plan.descripcion}</p>
                </CardHeader>
                
                <CardContent className="relative">
                  <ul className="space-y-3 mb-6">
                    {plan.caracteristicas.map((feat, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-purple-400' : 'text-emerald-400'}`} />
                        <span className="text-sm text-white/80">{feat}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href={plan.href}>
                    <Button 
                      className={`w-full ${plan.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110' 
                        : 'bg-white/10 hover:bg-white/20'
                      } text-white`}
                      disabled={plan.disabled}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Plan Empresarial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="bg-[#0b0e13] border-purple-500/30 shadow-lg shadow-purple-500/10">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20">
                      <Building2 className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{empresarial.nombre}</h3>
                      <p className="text-white/60">{empresarial.descripcion}</p>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-3">
                    {empresarial.caracteristicas.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-white/80">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-center md:text-right">
                  <p className="text-white/60 mb-4">Precio personalizado según tus necesidades</p>
                  <Link href="/soporte">
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white px-8">
                      Contactar Ventas
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* FAQ rápido */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold mb-8">¿Tienes preguntas?</h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <h4 className="font-semibold text-white mb-2">¿Puedo cancelar?</h4>
              <p className="text-sm text-white/60">Sí, puedes cancelar en cualquier momento sin compromiso.</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-white mb-2">¿Hay reembolsos?</h4>
              <p className="text-sm text-white/60">Ofrecemos reembolso completo en los primeros 7 días.</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-white mb-2">¿Necesito tarjeta?</h4>
              <p className="text-sm text-white/60">No, el plan gratis no requiere tarjeta de crédito.</p>
            </div>
          </div>
          
          <Link href="/faq" className="inline-block mt-8 text-purple-400 hover:text-purple-300 transition">
            Ver todas las preguntas frecuentes →
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
