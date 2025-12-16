"use client"

import Link from "next/link"
import { Button } from "@/components/shared/ui/button"
import { Home, ArrowLeft, Search, BookOpen, HelpCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b0e13] text-white flex items-center justify-center px-4">
      {/* Efecto de fondo con gradiente */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[40rem] w-[40rem] blur-3xl opacity-20"
        style={{ background: "radial-gradient(ellipse at center, rgba(168,85,247,0.4) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)" }}
      />

      <div className="relative text-center max-w-lg">
        {/* Número grande 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="text-[10rem] md:text-[12rem] font-bold leading-none bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 bg-clip-text text-transparent">
            404
          </span>
        </motion.div>

        {/* Icono de búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30">
            <Search className="h-8 w-8 text-purple-400" />
          </div>
        </motion.div>

        {/* Mensaje al usuario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            Página no encontrada
          </h1>
          <p className="text-white/60 mb-8">
            Parece que esta página se perdió en el código...
            ¿Quizás necesitas un taller de navegación web? 🧭
          </p>
        </motion.div>

        {/* Botones de navegación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white px-6 w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Ir al inicio
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver atrás
          </Button>
        </motion.div>

        {/* Enlaces útiles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-white/10"
        >
          <p className="text-sm text-white/40 mb-4">Enlaces útiles</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/estudiantes/talleres" className="flex items-center gap-2 text-white/60 hover:text-purple-400 transition-colors text-sm">
              <BookOpen className="h-4 w-4" />
              Ver talleres
            </Link>
            <Link href="/faq" className="flex items-center gap-2 text-white/60 hover:text-purple-400 transition-colors text-sm">
              <HelpCircle className="h-4 w-4" />
              Preguntas frecuentes
            </Link>
            <Link href="/soporte" className="flex items-center gap-2 text-white/60 hover:text-purple-400 transition-colors text-sm">
              <Search className="h-4 w-4" />
              Contactar soporte
            </Link>
          </div>
        </motion.div>

        {/* Mensaje gracioso */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-xs text-white/30"
        >
          Error 404: Esta página no pasó el CAPTCHA de la existencia
        </motion.p>
      </div>
    </div>
  )
}
