"use client"

import { useState } from "react"
import { Button } from "@/components/shared/ui/button"
import { Check, Copy, Terminal } from "lucide-react"

/**
 * Propiedades del componente CodeBlock
 */
type Props = {
  /** Código a mostrar en el bloque */
  code?: string
  /** Etiqueta descriptiva para el bloque de código */
  label?: string
  /** Lenguaje de programación para el resaltado de sintaxis */
  language?: string
}

/**
 * Componente para mostrar bloques de código con funcionalidad de copiado
 * Incluye una interfaz similar a un terminal con botones de ventana
 * y funcionalidad de copiado al portapapeles
 */
export function CodeBlock({ code = "", label = "", language = "bash" }: Props) {
  /** Estado que indica si el código fue copiado recientemente */
  const [copied, setCopied] = useState(false)

  /**
   * Copia el código al portapapeles y muestra confirmación visual
   */
  async function copiar() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { 
      // Silenciosamente ignora errores de copiado
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/95 backdrop-blur-sm shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700/50 bg-gray-800/80">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"></div>
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-300">
              {label || language}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={copiar}
          className="h-7 px-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label="Copiar código"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1 text-green-400" />
              <span className="text-xs">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1" />
              <span className="text-xs">Copiar</span>
            </>
          )}
        </Button>
      </div>

      {/* Contenido del código */}
      <div className="relative">
        <pre className="p-4 text-sm leading-relaxed overflow-auto max-h-80 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600/50">
          <code className="text-gray-200 font-mono">
            {code}
          </code>
        </pre>

        {/* Superposición de degradado para contenido extenso */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-900/95 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Sutil brillo en los bordes */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-gray-600/10 via-transparent to-gray-600/10 pointer-events-none"></div>
    </div>
  )
}
