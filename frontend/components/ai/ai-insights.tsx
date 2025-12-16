"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import {
  Sparkles, TrendingUp, Users, AlertTriangle, ChevronRight,
  Calendar, Target, MessageSquare, Loader2, Send, Bot, ChevronDown, ChevronUp,
  Zap, Route, BookOpen, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Taller } from "@/types";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface AIInsightsProps {
  talleres: Taller[];
  token: string;
  userEmail?: string;
  userType: "student" | "admin";
  misRegistros?: string[];
  onInscribir?: (tallerId: string) => Promise<void>;
  onFiltrar?: (filtro: { q?: string; categoria?: string }) => void;
  // Acciones específicas de admin
  onCrearTaller?: () => void;
  onGestionarEstudiantes?: () => void;
}

interface AIAction {
  type: "inscribir" | "filtrar" | "navegar" | "ruta" | "destacar" | "crear" | "gestionar" | "analizar";
  payload: any;
  label: string;
}

interface AIResponse {
  mensaje: string;
  acciones?: AIAction[];
  ruta?: { nombre: string; talleres: string[]; descripcion: string };
}

export function AIInsights({ talleres, token, userEmail, userType, misRegistros = [], onInscribir, onFiltrar, onCrearTaller, onGestionarEstudiantes }: AIInsightsProps) {
  const [expanded, setExpanded] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [ejecutando, setEjecutando] = useState<string | null>(null);
  const [stats, setStats] = useState<{ registros: number; cupos: number; ocupacion: number } | null>(null);
  const router = useRouter();

  // Cargar stats reales del backend
  useEffect(() => {
    apiFetch("/stats")
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  const talleresCount = talleres.length;
  const registrosCount = misRegistros.length;

  // Stats rápidos - usar stats del backend si están disponibles
  const totalInscritos = stats?.registros ?? talleres.reduce((acc, t) => {
    const inscritos = (Number(t.cupo || 0) - Number(t.cupos_disponibles || t.cupo || 0));
    return acc + Math.max(0, inscritos);
  }, 0);
  const totalCupos = stats?.cupos ?? talleres.reduce((acc, t) => acc + (Number(t.cupo) || 0), 0);
  // Mostrar al menos 1% si hay registros
  const ocupacionRaw = totalCupos > 0 ? Math.round((totalInscritos / totalCupos) * 100) : 0;
  const ocupacion = ocupacionRaw === 0 && totalInscritos > 0 ? 1 : ocupacionRaw;

  // Buscar taller con pocos cupos
  const tallerUrgente = talleres.find(t =>
    (t.cupos_disponibles || 0) > 0 &&
    (t.cupos_disponibles || 0) <= 3 &&
    !misRegistros.includes(t._id)
  );

  // Ejecuta lo que manda la IA
  const ejecutarAccion = async (accion: AIAction) => {
    setEjecutando(accion.label);
    try {
      switch (accion.type) {
        case "inscribir":
          if (onInscribir) {
            await onInscribir(accion.payload.tallerId);
          }
          break;
        case "filtrar":
          if (onFiltrar) {
            onFiltrar(accion.payload);
          }
          break;
        case "navegar":
          router.push(accion.payload.url);
          break;
        case "destacar":
          const el = document.getElementById(`workshop-${accion.payload.tallerId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-[#0b0e13]');
            setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-[#0b0e13]'), 3000);
          }
          break;
      }
    } finally {
      setEjecutando(null);
    }
  };

  // Procesa la respuesta y saca acciones para el usuario
  const procesarRespuestaIA = (respuesta: string, pregunta: string): AIResponse => {
    const acciones: AIAction[] = [];
    let mensaje = respuesta;
    let ruta = undefined;

    // Si pregunta por ruta de aprendizaje
    if (pregunta.toLowerCase().includes("ruta") || pregunta.toLowerCase().includes("path") || pregunta.toLowerCase().includes("carrera")) {
      // Armamos una ruta con los talleres disponibles
      const talleresOrdenados = [...talleres]
        .filter(t => !misRegistros.includes(t._id) && (t.cupos_disponibles || 0) > 0)
        .slice(0, 4);

      if (talleresOrdenados.length > 0) {
        ruta = {
          nombre: "Ruta del Desarrollador Caótico 🚀",
          descripcion: "Tu camino hacia la iluminación (o al menos a no romper producción)",
          talleres: talleresOrdenados.map(t => t._id)
        };

        talleresOrdenados.forEach((t, i) => {
          acciones.push({
            type: "inscribir",
            payload: { tallerId: t._id, nombre: t.nombre },
            label: `${i + 1}. Inscribirme en "${t.nombre}"`
          });
        });
      }
    }

    // Ver si mencionó algún taller por nombre
    talleres.forEach(t => {
      const nombreLower = t.nombre.toLowerCase();
      if (respuesta.toLowerCase().includes(nombreLower) || pregunta.toLowerCase().includes(nombreLower)) {
        if (!misRegistros.includes(t._id) && (t.cupos_disponibles || 0) > 0) {
          acciones.push({
            type: "inscribir",
            payload: { tallerId: t._id, nombre: t.nombre },
            label: `Inscribirme en "${t.nombre}"`
          });
          acciones.push({
            type: "destacar",
            payload: { tallerId: t._id },
            label: `Ver "${t.nombre}"`
          });
        }
      }
    });

    // Ver si mencionó alguna categoría
    const categorias = ["programming", "frontend", "productivity", "ai", "devops", "cooking"];
    categorias.forEach(cat => {
      if (pregunta.toLowerCase().includes(cat) || respuesta.toLowerCase().includes(cat)) {
        acciones.push({
          type: "filtrar",
          payload: { categoria: cat },
          label: `Filtrar por ${cat}`
        });
      }
    });

    // Quitar duplicados
    const accionesUnicas = acciones.filter((a, i, arr) =>
      arr.findIndex(x => x.label === a.label) === i
    ).slice(0, 4);

    return { mensaje, acciones: accionesUnicas, ruta };
  };

  const askAI = useCallback(async () => {
    if (!aiQuestion.trim() || aiLoading) return;

    setAiLoading(true);
    setAiResponse(null);

    try {
      // Le pasamos info de los talleres a la IA
      const talleresInfo = talleres.map(t =>
        `"${t.nombre}" (${t.categoria}, ${t.cupos_disponibles} cupos, ${misRegistros.includes(t._id) ? 'YA INSCRITO' : 'disponible'})`
      ).join("; ");

      const context = `Talleres: ${talleresInfo}. El usuario tiene ${registrosCount} inscripciones de ${talleresCount} disponibles.`;

      const response = await apiFetch("/ai/assistant", {
        metodo: "POST",
        cuerpo: { mensaje: aiQuestion, contexto: context, tipo_usuario: userType },
        token
      });

      const respuestaTexto = response.respuesta || "No pude generar una respuesta.";
      const procesada = procesarRespuestaIA(respuestaTexto, aiQuestion);
      setAiResponse(procesada);
    } catch (e: any) {
      setAiResponse({ mensaje: "Error al conectar con el asistente.", acciones: [] });
    } finally {
      setAiLoading(false);
      setAiQuestion("");
    }
  }, [aiQuestion, aiLoading, token, userType, talleres, misRegistros, registrosCount, talleresCount]);

  const quickQuestions = userType === "student"
    ? ["🛤️ Genera mi ruta de aprendizaje", "🎯 ¿Qué curso me recomiendas?", "🔥 ¿Cuál es el más popular?", "🍳 Quiero aprender a cocinar"]
    : ["📊 Analiza ocupación", "🚀 ¿Qué promocionar?", "📉 Cursos con baja inscripción"];

  return (
    <div className="mt-6 mb-4">
      {/* Barra principal - siempre visible */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        {/* Stats inline */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="text-white/60 hidden sm:inline">Asistente IA</span>
            <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 px-1 py-0">
              Interactivo
            </Badge>
          </div>

          {userType === "student" ? (
            <>
              <div className="flex items-center gap-1.5 text-white/70">
                <Target className="h-3.5 w-3.5 text-indigo-400" />
                <span>{registrosCount}/{talleresCount}</span>
                <span className="text-white/40 hidden md:inline">inscritos</span>
              </div>
              {tallerUrgente && (
                <div className="flex items-center gap-1.5 text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="text-xs">¡{tallerUrgente.cupos_disponibles} cupos!</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-white/70">
                <Users className="h-3.5 w-3.5 text-indigo-400" />
                <span>{ocupacion}%</span>
                <span className="text-white/40 hidden md:inline">ocupación</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/70">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                <span>{totalInscritos}</span>
                <span className="text-white/40 hidden md:inline">inscritos</span>
              </div>
            </>
          )}
        </div>

        {/* Botón para expandir */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-7 px-2 gap-1"
        >
          <Zap className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Interactuar</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      {/* Panel de chat */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-3">
              {/* Preguntas sugeridas */}
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setAiQuestion(q); }}
                    disabled={aiLoading}
                    className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Respuesta de la IA */}
              {(aiResponse || aiLoading) && (
                <div className="space-y-2 p-3 rounded-md bg-black/20">
                  <div className="flex gap-2">
                    <Bot className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    {aiLoading ? (
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Analizando talleres...
                      </div>
                    ) : (
                      <p className="text-xs text-white/70 leading-relaxed">{aiResponse?.mensaje}</p>
                    )}
                  </div>

                  {/* Ruta personalizada */}
                  {aiResponse?.ruta && (
                    <div className="mt-3 p-2 rounded-md bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Route className="h-4 w-4 text-indigo-400" />
                        <span className="text-sm font-medium text-white">{aiResponse.ruta.nombre}</span>
                      </div>
                      <p className="text-xs text-white/60 mb-2">{aiResponse.ruta.descripcion}</p>
                      <div className="flex flex-wrap gap-1">
                        {aiResponse.ruta.talleres.map((tid, i) => {
                          const taller = talleres.find(t => t._id === tid);
                          return taller ? (
                            <Badge key={tid} className="text-[10px] bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                              {i + 1}. {taller.nombre}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Acciones sugeridas */}
                  {aiResponse?.acciones && aiResponse.acciones.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/[0.06]">
                      {aiResponse.acciones.map((accion, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant="outline"
                          onClick={() => ejecutarAccion(accion)}
                          disabled={ejecutando !== null}
                          className="text-xs h-7 px-2 border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200 hover:border-indigo-400/50"
                        >
                          {ejecutando === accion.label ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : accion.type === "inscribir" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : accion.type === "destacar" ? (
                            <BookOpen className="h-3 w-3 mr-1" />
                          ) : (
                            <Zap className="h-3 w-3 mr-1" />
                          )}
                          {accion.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Campo de texto */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askAI()}
                  placeholder="Ej: Genera mi ruta de programación, inscríbeme en Git..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
                  disabled={aiLoading}
                />
                <Button
                  onClick={askAI}
                  disabled={aiLoading || !aiQuestion.trim()}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 px-2.5"
                >
                  {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Badge para talleres con pocos cupos
export function LowStockBadge({ cupos }: { cupos: number }) {
  if (cupos > 5) return null;

  return (
    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] gap-1">
      <AlertTriangle className="h-3 w-3" />
      {cupos === 0 ? 'Agotado' : `${cupos} cupos`}
    </Badge>
  );
}

// Badge de taller popular
export function RecommendedBadge() {
  return (
    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] gap-1">
      <Sparkles className="h-3 w-3" />
      Popular
    </Badge>
  );
}
