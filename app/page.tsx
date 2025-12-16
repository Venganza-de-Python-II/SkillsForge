"use client";

import { Navbar } from "@/components/shared/ui/navbar";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import { Card, CardContent } from "@/components/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/shared/ui/accordion";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import type { Taller } from "@/types";
import { BookOpen, Users, Percent, Tag, Star, Building2, Github, Terminal, Zap, Rocket, } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CodeBlock } from "@/components/shared/code-block";
import { Marquee } from "@/components/shared/marquee";
import type { JSX } from "react/jsx-runtime";
import { useToast } from "@/components/shared/ui/use-toast";

// Empresas de ejemplo para el carrusel
const empresas = [
  "Acme Learning",
  "NovaTech",
  "EduWave",
  "DevForge",
  "TalentHub",
  "Skillverse",
  "Cognita",
  "Quantum Labs",
];

// Tipo para stats de repos de GitHub
type GHStat = { name: string; stars: number };

// Estado de los widgets externos
type Widgets = {
  gh: GHStat[];
  cita: { content: string; author: string } | null;
  loading: boolean;
};

export default function Landing() {
  // Stats generales de la plataforma
  const [stats, setStats] = useState<{
    talleres: number;
    estudiantes: number;
    registros: number;
  } | null>(null);
  // Los mejores talleres
  const [destacados, setDestacados] = useState<Taller[]>([]);
  // Datos de GitHub
  const [widgets, setWidgets] = useState<Widgets>({
    gh: [],
    cita: null,
    loading: true,
  });

  // Posición del mouse para el efecto de luz
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // Toast
  const { toast } = useToast();

  // Al cargar: traemos stats y talleres destacados
  useEffect(() => {
    apiFetch("/stats")
      .then(setStats)
      .catch(() => {
        setStats({ talleres: 0, estudiantes: 0, registros: 0 });
        toast({
          title: "Error cargando estadísticas",
          description: "Se mostraron valores por defecto.",
          variant: "destructive",
        });
      });

    apiFetch("/workshops?sort=rating&order=desc&limit=3")
      .then((data) => {
        console.log("Workshops response:", data);
        // Asegurar que siempre sea un array
        if (Array.isArray(data)) {
          setDestacados(data);
        } else if (data?.workshops && Array.isArray(data.workshops)) {
          setDestacados(data.workshops);
        } else if (data?.data && Array.isArray(data.data)) {
          setDestacados(data.data);
        } else {
          console.error("Unexpected workshops format:", data);
          setDestacados([]);
        }
      })
      .catch((err) => {
        console.error("Error loading workshops:", err);
        setDestacados([]);
        toast({
          title: "Error cargando talleres destacados",
          description: "No se pudieron obtener los datos.",
          variant: "destructive",
        });
      });
  }, [toast]);

  // Seguimiento del mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) =>
      setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Carga de datos de GitHub
  useEffect(() => {
    let cancelado = false;

    // Helper para timeout
    const timeout = (ms: number) =>
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("timeout")), ms)
      );

    // Fetch con timeout incluido
    const fetchJSON = (url: string) =>
      Promise.race([
        fetch(url, { cache: "no-store" }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
        timeout(7000),
      ]);

    async function cargarWidgets() {
      try {
        // Traemos repos de GitHub en paralelo
        const reposResult = await Promise.allSettled([
          fetchJSON("https://api.github.com/repos/vercel/next.js"),
          fetchJSON("https://api.github.com/repos/aws/aws-cli"),
        ]);

        const gh: GHStat[] = [];
        const [nextRes, awsRes] = reposResult;

        if (
          nextRes?.status === "fulfilled" &&
          nextRes.value?.stargazers_count != null
        ) {
          gh.push({
            name: "Next.js",
            stars: Number(nextRes.value.stargazers_count),
          });
        }
        if (
          awsRes?.status === "fulfilled" &&
          awsRes.value?.stargazers_count != null
        ) {
          gh.push({
            name: "AWS CLI",
            stars: Number(awsRes.value.stargazers_count),
          });
        }

        if (cancelado) return;

        setWidgets({ gh, cita: null, loading: false });

        if (gh.length === 0) {
          toast({
            title: "Datos no disponibles",
            description: "No se pudieron obtener las estrellas de GitHub.",
            variant: "warning",
          });
        }
      } catch {
        if (cancelado) return;
        setWidgets({ gh: [], cita: null, loading: false });
        toast({
          title: "Error cargando widgets",
          description: "Verifica tu conexión e intenta más tarde.",
          variant: "destructive",
        });
      }
    }

    cargarWidgets();
    return () => {
      cancelado = true;
    };
  }, [toast]);

  // Ocupación del backend. Si hay registros pero sale 0%, mostramos al menos 1%
  const ocupacionRaw = stats?.ocupacion ?? 0;
  const ocupacion = ocupacionRaw === 0 && stats?.registros && stats.registros > 0
    ? Math.max(1, Math.round((stats.registros / Math.max(stats.cupos || 1, 1)) * 100))
    : ocupacionRaw;

  // Componente para cada tarjeta de features
  const FeatureCard = ({
    icon,
    title,
    desc,
  }: {
    icon: JSX.Element;
    title: string;
    desc: string;
  }) => (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group"
    >
      <Card className="bg-white/5 border-white/10 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute -inset-16 rounded-[40px] blur-3xl bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),rgba(99,102,241,0.15),transparent_60%)]" />
        </div>
        <CardContent className="p-5 relative">
          <div className="inline-flex p-2 rounded-lg bg-gradient-to-r from-purple-600/40 to-cyan-500/40 mb-3 ring-1 ring-white/10 group-hover:ring-white/20 transition">
            <div className="text-white [&>svg]:text-white">{icon}</div>
          </div>
          <div className="font-semibold text-white">{title}</div>
          <div className="text-sm text-white/80">{desc}</div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Skeleton de carga
  const Skeleton = ({ lines = 2 }: { lines?: number }) => (
    <div className="animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-white/10 rounded mb-2" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white relative overflow-hidden">
      {/* Glow morado del hero */}
      <div
        className="pointer-events-none absolute top-[-10rem] left-1/2 -translate-x-1/2 h-[40rem] w-[40rem] blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(168,85,247,0.25) 0%, rgba(56,189,248,0.15) 35%, transparent 60%)",
        }}
      />

      {/* Luz que sigue el mouse */}
      <div
        className="pointer-events-none fixed w-96 h-96 rounded-full opacity-20 blur-3xl transition-all duration-300 ease-out z-0"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          background:
            "radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(56,189,248,0.3) 30%, transparent 70%)",
        }}
      />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Sección hero */}
        <section className="py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-tr from-purple-600/40 to-cyan-500/40 ring-1 ring-white/10"
          >
            <BookOpen className="h-10 w-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              SkillsForge
            </span>
            {" - Forja tus Habilidades"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-white/80 max-w-3xl mx-auto mt-4"
          >
            Plataforma integral para la gestión y participación en talleres de
            formación profesional. Desarrolla tus habilidades técnicas y blandas
            con nuestra moderna plataforma de aprendizaje.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Link href="/estudiantes/talleres">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-[1.15] hover:shadow-[0_0_30px_rgba(124,58,237,0.35)] text-white hover:text-white">
                Explorar Talleres
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/15 hover:text-white bg-transparent"
              >
                Panel de Administración
              </Button>
            </Link>
          </motion.div>

          {/* Empresas que confían en nosotros */}
          <div className="mt-12">
            <p className="text-white/80 text-sm mb-4">
              Con la confianza de equipos en
            </p>
            <Marquee
              items={empresas.map((e, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-white/85">{e}</span>
                </div>
              ))}
            />
          </div>
        </section>

        {/* Qué ofrecemos */}
        <section className="py-10">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Para estudiantes */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 text-white">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Para Estudiantes
                </h2>
                <p className="text-white/80 mt-1">
                  Inscríbete fácil, gestiona tus registros y descubre talleres.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <FeatureCard
                    icon={<Users className="h-5 w-5" />}
                    title="Registro Simple"
                    desc="Cuenta en un clic."
                  />
                  <FeatureCard
                    icon={<Zap className="h-5 w-5" />}
                    title="Inscripción Rápida"
                    desc="Cupos en vivo."
                  />
                  <FeatureCard
                    icon={<Tag className="h-5 w-5" />}
                    title="Filtros inteligentes"
                    desc="Por categoría e instructor."
                  />
                  <FeatureCard
                    icon={<Star className="h-5 w-5" />}
                    title="Talleres destacados"
                    desc="Recomendados."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Para admins */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 text-white">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Para Administradores
                </h2>
                <p className="text-white/80 mt-1">
                  Crea, edita y cancela con control de cupos y reportes.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <FeatureCard
                    icon={<BookOpen className="h-5 w-5" />}
                    title="Gestión de talleres"
                    desc="CRUD completo."
                  />
                  <FeatureCard
                    icon={<Percent className="h-5 w-5" />}
                    title="Capacidad y ocupación"
                    desc="Sin sobrecupos."
                  />
                  <FeatureCard
                    icon={<Rocket className="h-5 w-5" />}
                    title="API REST"
                    desc="Integra tus sistemas."
                  />
                  <FeatureCard
                    icon={<Terminal className="h-5 w-5" />}
                    title="Seguridad JWT"
                    desc="Acceso por rol."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Métricas de impacto */}
        <section className="py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Impacto
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { titulo: "Talleres Activos", valor: stats?.talleres ?? 0 },
              { titulo: "Estudiantes", valor: stats?.estudiantes ?? 0 },
              { titulo: "Ocupación Promedio", valor: `${ocupacion}%` },
              { titulo: "Registros", valor: stats?.registros ?? 0 },
            ].map((m, i) => (
              <motion.div
                key={m.titulo}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-white">
                      {m.valor}
                    </div>
                    <div className="text-white/85 text-sm mt-1">{m.titulo}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Top talleres */}
        <section className="py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Talleres Destacados
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {destacados.map((t, i) => (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="bg-purple-600 hover:bg-purple-600">
                          Destacado
                        </Badge>
                        <h3 className="text-lg font-semibold mt-2 text-white">
                          {t.nombre}
                        </h3>
                        <p className="text-sm text-white/80 line-clamp-3">
                          {t.descripcion}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="h-4 w-4 fill-amber-400" />
                        <span className="text-sm">
                          {(t.rating ?? 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="border-white/20 text-white"
                      >
                        {t.fecha} {t.hora}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-white/20 text-white"
                      >
                        {t.instructor || "Por asignar"}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <Link href="/estudiantes/talleres">
                        <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-[1.15] text-white hover:text-white">
                          Ver más
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Docs de la API */}
        <section id="api-docs" className="py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Documentación API
          </h2>
          <p className="text-white/80 text-center mt-2">
            Integra SkillsForge con tu aplicación usando nuestra API REST.
          </p>

          <Tabs defaultValue="resumen" className="mt-8">
            <TabsList className="bg-white/5 border border-white/10 rounded-xl p-1">
              {["resumen", "talleres", "auth", "ejemplos"].map((k) => (
                <TabsTrigger
                  key={k}
                  value={k}
                  className="text-white/90 hover:text-white data-[state=active]:text-white data-[state=active]:bg-white/10 px-4 py-2 rounded-lg"
                >
                  {k === "resumen"
                    ? "Resumen"
                    : k === "talleres"
                      ? "Talleres"
                      : k === "auth"
                        ? "Autenticación"
                        : "Ejemplos"}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="resumen" className="mt-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 space-y-4">
                  <CodeBlock code={API_BASE_URL} label="Base URL" />
                  <CodeBlock
                    code={"Authorization: Bearer <token>"}
                    label="Autorización"
                  />
                  <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <h4 className="font-semibold text-white">Documentación de la API</h4>
                    </div>
                    <p className="text-sm text-white/80 mb-3">
                      Consulta todos los endpoints disponibles y su documentación en formato JSON:
                    </p>
                    <a
                      href="/api-docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <Terminal className="w-4 h-4" />
                      Ver documentación de la API
                    </a>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      Endpoints públicos
                    </h4>
                    <ul className="text-sm text-white/90 list-disc pl-5">
                      <li>GET /api — Documentación de la API</li>
                      <li>GET /workshops</li>
                      <li>GET /workshops/{"\{id\}"}</li>
                      <li>GET /stats</li>
                      <li>GET /categories</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="talleres" className="mt-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 space-y-4">
                  <CodeBlock
                    label="Listado con filtros"
                    code={`GET ${API_BASE_URL}/workshops?q=python&categoria=tecnologia&sort=fecha&order=asc&limit=10`}
                  />
                  <CodeBlock
                    label="Detalle"
                    code={`GET ${API_BASE_URL}/workshops/{id}`}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="auth" className="mt-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 space-y-4">
                  <CodeBlock
                    label="Admin"
                    code={`POST ${API_BASE_URL}/auth/login
Body: { "usuario": "admin", "contrasena": "admin123" }`}
                  />
                  <CodeBlock
                    label="Estudiantes"
                    code={`POST ${API_BASE_URL}/auth/estudiantes/registro
POST ${API_BASE_URL}/auth/estudiantes/login
GET  ${API_BASE_URL}/registrations/me
POST ${API_BASE_URL}/workshops/{id}/register
DELETE ${API_BASE_URL}/workshops/{id}/register`}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ejemplos" className="mt-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 space-y-4">
                  <CodeBlock
                    label="Fetch (JS)"
                    code={`fetch('${API_BASE_URL}/workshops')
.then(r => r.json())
.then(console.log)`}
                  />
                  <CodeBlock
                    label="Inscribirse (JS)"
                    code={`fetch('${API_BASE_URL}/workshops/{id}/register', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' }
})`}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Preguntas frecuentes */}
        <section id="faq" className="py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Preguntas Frecuentes
          </h2>
          <div className="max-w-3xl mx-auto mt-6 space-y-3">
            <Accordion type="single" collapsible className="space-y-3">
              <AccordionItem value="q1" className="border-none">
                <AccordionTrigger className="px-4 py-3 text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 data-[state=open]:bg-white/10 data-[state=open]:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
                  ¿Necesito cuenta para inscribirme?
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-white/80">
                  Sí, crea tu cuenta de estudiante para gestionar tus
                  inscripciones.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q2" className="border-none">
                <AccordionTrigger className="px-4 py-3 text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 data-[state=open]:bg-white/10 data-[state=open]:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
                  ¿Cómo se limitan los cupos?
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-white/80">
                  Cada taller define su capacidad y la API bloquea registros
                  cuando se completa.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q3" className="border-none">
                <AccordionTrigger className="px-4 py-3 text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 data-[state=open]:bg-white/10 data-[state=open]:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
                  ¿Puedo cancelar mi inscripción?
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-white/80">
                  Sí, desde Mis Registros puedes anular tu participación cuando
                  quieras.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-12 text-center">
          <div className="inline-flex p-1 rounded-full bg-gradient-to-r from-purple-600/30 to-indigo-600/30 ring-1 ring-white/10">
            <div className="px-5 py-2 rounded-full bg-black/40 text-white">
              ¿Listo para empezar?
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/estudiantes/talleres">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-[1.15] text-white hover:text-white">
                Ver talleres
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/15 hover:text-white bg-transparent"
              >
                Panel de administración
              </Button>
            </Link>
          </div>
        </section>

        {/* Pie de página */}
        <footer className="py-12 border-t border-white/10 mt-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="inline-flex items-center gap-2">
                <div className="bg-gradient-to-tr from-purple-500 to-cyan-400 rounded-md p-2">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold">SkillsForge</span>
              </div>
              <p className="text-white/80 text-sm mt-3">
                Organiza, inscribe y mide el impacto de tus programas de
                formación.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Producto</h4>
              <ul className="space-y-2 text-white/85 text-sm">
                <li>
                  <Link
                    href="/estudiantes/talleres"
                    className="hover:underline"
                  >
                    Talleres
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:underline">
                    Panel de Admin
                  </Link>
                </li>
                <li>
                  <Link href="/api-docs" className="hover:underline">
                    API Docs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Recursos</h4>
              <ul className="space-y-2 text-white/85 text-sm">
                <li>
                  <Link href="/faq" className="hover:underline">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/precios" className="hover:underline">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="/soporte" className="hover:underline">
                    Soporte
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Tecnologías</h4>
              <ul className="space-y-2 text-white/85 text-sm">
                <li className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-white" /> Next.js:{" "}
                  <span className="text-white">
                    {widgets.gh
                      .find((x) => x.name === "Next.js")
                      ?.stars?.toLocaleString() ?? "—"}{" "}
                    ⭐
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-white" /> AWS CLI:{" "}
                  <span className="text-white">
                    {widgets.gh
                      .find((x) => x.name === "AWS CLI")
                      ?.stars?.toLocaleString() ?? "—"}{" "}
                    ⭐
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-white/80">
            © {new Date().getFullYear()} SkillsForge · Todos los derechos
            reservados.
          </div>
        </footer>
      </main>
    </div>
  );
}
