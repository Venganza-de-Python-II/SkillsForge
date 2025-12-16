/*Gestión de estudiantes*/

/*
Verifica si el administrador tiene token, si no lo redirige al login.

Permite buscar estudiantes por nombre o email.

Muestra la lista de estudiantes desde la API.

Permite eliminarlos con confirmación.

Notifica al usuario mediante toasts.
*/

'use client' //Indica que este componente se ejecuta en el cliente

import { useEffect, useState } from 'react' //hooks de React para manejar estado y efectos secundarios.
import type { Estudiante } from '@/types' //Llama al código que define un estudiante.
import { apiFetch, obtenerTokenAdmin, esTokenAdmin, limpiarTokenAdmin } from '@/lib/api' //función personalizada conecta front con back. y obtiene el token de autenticación para el admin logeado.
import { useRouter } from 'next/navigation' //hook de Next.js para redirigir.

/*
  Se importan componentes de UI (Cards, Botones, Input).
  Iconos de Lucide React (Trash2, Search).
  useToast y Toaster → sistema de notificaciones emergentes.
  Navbar → barra de navegación reutilizable.
*/
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card' 
import { Input } from '@/components/shared/ui/input'
import { Button } from '@/components/shared/ui/button'
import { Trash2, Search } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { Toaster } from '@/components/shared/ui/toaster'
import Link from 'next/link'
import { Navbar } from '@/components/shared/ui/navbar'

//Componente principal que renderiza la interfaz de administración de estudiantes.
export default function GestionEstudiantes() {
  const [lista, setLista] = useState<Estudiante[]>([]) //lista de estudiantes obtenidos de la API (inicia vacía).
  const [q, setQ] = useState('') //cadena de búsqueda query (inicia vacía).
  const [cargando, setCargando] = useState(true) //bandera de estado para mostrar “Cargando…”. 
  const [verificado, setVerificado] = useState(false) //verificación de permisos de admin
  const token = obtenerTokenAdmin() //revisa si el admin está logueado.
  const router = useRouter() //navegación redigirida /cambiar de página (ej: redirigir al login)..
  const { toast } = useToast() //mostrar notificaciones.

  //useEffect (verifica existencia de token y ROL de admin)
  useEffect(() => {
    // Verificar que el token existe Y es de un admin
    if (!token || !esTokenAdmin(token)) {
      if (token && !esTokenAdmin(token)) {
        limpiarTokenAdmin()
        toast({ 
          title: 'Acceso denegado', 
          description: 'No tienes permisos de administrador', 
          variant: 'destructive' 
        })
      }
      router.replace('/admin/login')
      return
    }
    setVerificado(true)
    cargar()
  }, [token])


  //Función para obtener estudiantes
/*
  Muestra estado de cargando.
  Llama a la API /students con un parámetro de búsqueda opcional.
  Actualiza el estado lista con los estudiantes obtenidos.
  En caso de error, muestra un toast de error.
*/
  async function cargar() {
    setCargando(true) //Inicializa la función para el ususario.
    try {
      //Si hay algo escrito en el buscador (q), lo mete en una cajita especial (params) para pedir estudiantes específicos.
      const params = q ? `?q=${encodeURIComponent(q)}` : '' 
      //Hace solicitud al backend con el parametro del estudiante y el token del admin
      const data = await apiFetch(`/students${params}`, { token })
      //Si todo sale bien, coloca los estudiantes recibidos (data) en la nueva lista.
      // La API devuelve { students: [...], total: N }, extraemos el array
      const estudiantes = Array.isArray(data) ? data : (data?.students || [])
      setLista(estudiantes)
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'No se pudo cargar estudiantes',
        variant: 'destructive'
      })
    } finally {
      //finaliza la función para el ususario.
      setCargando(false)
    }
  }

  //Función para eliminar estudiantes
  /*
  Pide confirmación al usuario.
  Llama a la API para borrar el estudiante.
  Actualiza la lista local eliminando al estudiante borrado.
  Muestra un toast de éxito o error.
*/
  async function eliminar(id: string) {
    if (!confirm('¿Eliminar estudiante y sus inscripciones?')) return
    try {
      //Llama al backend para borrar, tomando el id del estudiante y verificando el token del admin
      await apiFetch(`/students/${id}`, { metodo: 'DELETE', token })
      //Actualiza la lista LOCAL, borrando al estudiante que coincida con el id (sin recargar la página)
      setLista(prev => prev.filter(x => x._id !== id))
      toast({ title: 'Estudiante eliminado', description: 'La acción se realizó correctamente.' })
      //Manejo de errores
    } catch (e: any) {
      toast({
        title: 'No se pudo eliminar',
        description: e.message || 'Intente nuevamente.',
        variant: 'destructive'
      })
    }
  }

  
  //Renderizado de la interfaz jsx
  // No renderizar hasta verificar que es admin
  if (!verificado) {
    return (
      <div className="min-h-screen bg-[#0b0e13] text-white flex items-center justify-center">
        <p>Verificando permisos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white">
      {/*Este bloque de código construye la interfaz visual de la página de "Gestión de Estudiantes" para administradores. */}
      {/*Fondo oscuro, texto blanco, incluye la barra de navegación.*/}
      <Navbar /> 
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Gestión de Estudiantes</h1>
            <p className="text-white/80">Administra cuentas de estudiantes y su información.</p>
          </div>
            <Link href="/admin" className="underline text-sm text-white/90">
              Volver
            </Link>
        </div>

        {/*Busqueda de esyudiantes*/}
        {/*
            Muestra un cuadro de búsqueda donde el admin puede escribir nombres o emails de estudiantes.
            Incluye un botón "Buscar" para aplicar el filtro.
            Actualiza la lista automáticamente cuando se busca (usando el estado q y la función cargar).
        */}
        <Card className="mt-6 bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Buscar Estudiantes</CardTitle>
            <CardDescription className="text-white/80">Encuentra estudiantes por nombre o email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative w-full">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                <Input
                  className="pl-9 bg-black/30 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Buscar por nombre o email..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Button
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
                type="button"
                onClick={cargar}
                disabled={cargando}
              >
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>
        

        {/*Lista de estudiantes*/}
        {/*
         Muestra una lista de estudiantes (nombre y email).
          Incluye un botón "Eliminar" para cada estudiante.
          
          Gestiona tres estados posibles:
           -Cargando datos (cargando).
           -Lista vacía (lista.length === 0)
           -Lista con resultados.
        */}
        <Card className="mt-6 bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Lista de Estudiantes</CardTitle>
            <CardDescription className="text-white/80">{lista.length} resultados</CardDescription>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <p className="text-sm text-white/80">Cargando...</p>
            ) : lista.length === 0 ? (
              <p className="text-sm text-white/80">Sin resultados.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {lista.map(e => (
                  <li key={e._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{e.nombre}</div>
                      <div className="text-sm text-white/80">{e.email}</div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => eliminar(e._id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        

        {/*Renderiza los mensajes emergentes.*/}
      </section>
      {/* Toast del portal */}
      <Toaster />
    </div>
  )
}


