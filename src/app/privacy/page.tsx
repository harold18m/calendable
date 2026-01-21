import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad - Calendable",
  description: "Política de privacidad de Calendable",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <div className="p-8">
            <h1 className="text-4xl font-bold mb-6 text-zinc-900 dark:text-white">
              Política de Privacidad
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
              Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  1. Información que Recopilamos
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Calendable accede a la siguiente información de tu cuenta de Google mediante OAuth 2.0:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
                  <li><strong>Perfil básico:</strong> Nombre y dirección de correo electrónico</li>
                  <li><strong>Calendario:</strong> Eventos, disponibilidad y metadatos de tu Google Calendar para crear y gestionar rutinas personalizadas</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  2. Cómo Usamos la Información
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
                  Utilizamos la información recopilada exclusivamente para:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
                  <li>Leer tu calendario para verificar disponibilidad y evitar conflictos</li>
                  <li>Crear y gestionar eventos de rutinas personalizadas según tus solicitudes</li>
                  <li>Actualizar, mover o eliminar eventos cuando lo solicites</li>
                  <li>Proporcionar sugerencias inteligentes basadas en tu disponibilidad</li>
                </ul>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mt-4">
                  <strong>No utilizamos tu información para:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
                  <li>Publicidad o marketing</li>
                  <li>Venta de datos a terceros</li>
                  <li>Análisis de comportamiento para fines comerciales</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  3. Protección de Datos
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
                  Nos comprometemos a proteger tu privacidad:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
                  <li><strong>No compartimos tu información:</strong> No vendemos, alquilamos ni compartimos tus datos personales con terceros</li>
                  <li><strong>Almacenamiento mínimo:</strong> Solo almacenamos temporalmente los tokens de acceso necesarios para la funcionalidad de la aplicación</li>
                  <li><strong>OAuth 2.0:</strong> Utilizamos el protocolo OAuth 2.0 de Google para un acceso seguro y estándar</li>
                  <li><strong>Control del usuario:</strong> Puedes revocar el acceso en cualquier momento desde tu cuenta de Google</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  4. Retención de Datos
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Los tokens de acceso se almacenan solo mientras tu sesión esté activa. No almacenamos permanentemente 
                  el contenido de tu calendario. Cuando revoques el acceso desde Google, eliminamos inmediatamente 
                  todos los tokens asociados.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  5. Tus Derechos
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
                  Tienes derecho a:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
                  <li>Revocar el acceso a tu cuenta de Google en cualquier momento</li>
                  <li>Solicitar información sobre los datos que tenemos sobre ti</li>
                  <li>Eliminar tu cuenta y todos los datos asociados</li>
                </ul>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mt-4">
                  Para revocar el acceso, ve a tu cuenta de Google → Seguridad → Aplicaciones de terceros con acceso a tu cuenta → 
                  Encuentra "Calendable" y haz clic en "Revocar acceso".
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  6. Cambios a esta Política
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Nos reservamos el derecho de actualizar esta política de privacidad. Te notificaremos de cualquier 
                  cambio significativo publicando la nueva política en esta página y actualizando la fecha de "Última actualización".
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  7. Contacto
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Si tienes preguntas sobre esta política de privacidad o sobre cómo manejamos tus datos, 
                  puedes contactarnos a través de:
                </p>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mt-2">
                  <strong>Email:</strong> [tu-email@ejemplo.com]
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
