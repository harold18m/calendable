import type { Metadata } from "next";
import { Card, CardBody } from "@heroui/react";

export const metadata: Metadata = {
  title: "Términos de Servicio - Calendable",
  description: "Términos de servicio de Calendable",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border border-zinc-200 dark:border-zinc-800">
          <CardBody className="p-8">
            <h1 className="text-4xl font-bold mb-6 text-zinc-900 dark:text-white">
              Términos de Servicio
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
              Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  1. Aceptación de los Términos
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Al acceder y utilizar Calendable, aceptas estar sujeto a estos Términos de Servicio y a todas las 
                  leyes y regulaciones aplicables. Si no estás de acuerdo con alguno de estos términos, no debes 
                  utilizar el servicio.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  2. Descripción del Servicio
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Calendable es una aplicación web que utiliza inteligencia artificial para ayudar a los usuarios a 
                  gestionar rutinas personales mediante la integración con Google Calendar. El servicio permite crear, 
                  actualizar y gestionar eventos de calendario de forma inteligente.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  3. Requisitos de Cuenta
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
                  Para utilizar Calendable, debes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
                  <li>Tener una cuenta de Google válida</li>
                  <li>Autorizar el acceso a tu Google Calendar mediante OAuth 2.0</li>
                  <li>Ser mayor de edad o tener el consentimiento de un tutor legal</li>
                  <li>Proporcionar información precisa y actualizada</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  4. Uso del Servicio
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
                  Te comprometes a:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
                  <li>Utilizar el servicio solo para fines legales y legítimos</li>
                  <li>No intentar acceder a cuentas de otros usuarios</li>
                  <li>No utilizar el servicio para actividades fraudulentas o maliciosas</li>
                  <li>Mantener la confidencialidad de tus credenciales de acceso</li>
                  <li>Notificarnos inmediatamente de cualquier uso no autorizado de tu cuenta</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  5. Limitación de Responsabilidad
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Calendable se proporciona "tal cual" y "según disponibilidad". No garantizamos que el servicio 
                  esté libre de errores, interrupciones o defectos. No seremos responsables de ningún daño directo, 
                  indirecto, incidental o consecuente que resulte del uso o la imposibilidad de usar el servicio.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  6. Modificaciones del Servicio
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio en 
                  cualquier momento, con o sin previo aviso. No seremos responsables ante ti ni ante ningún tercero 
                  por cualquier modificación, suspensión o discontinuación del servicio.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  7. Terminación
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Puedes terminar tu uso del servicio en cualquier momento revocando el acceso desde tu cuenta de Google. 
                  Nos reservamos el derecho de suspender o terminar tu acceso al servicio en cualquier momento, con o sin 
                  causa, con o sin previo aviso, por cualquier motivo, incluyendo, entre otros, el incumplimiento de estos 
                  Términos de Servicio.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  8. Propiedad Intelectual
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  El servicio y su contenido original, características y funcionalidad son propiedad de Calendable y están 
                  protegidos por leyes de derechos de autor, marcas registradas y otras leyes de propiedad intelectual.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  9. Cambios a los Términos
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos de cualquier 
                  cambio significativo publicando los nuevos términos en esta página y actualizando la fecha de "Última actualización". 
                  Tu uso continuado del servicio después de dichos cambios constituye tu aceptación de los nuevos términos.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  10. Ley Aplicable
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Estos Términos de Servicio se regirán e interpretarán de acuerdo con las leyes aplicables, sin tener en 
                  cuenta sus disposiciones sobre conflictos de leyes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  11. Contacto
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Si tienes preguntas sobre estos Términos de Servicio, puedes contactarnos a través de:
                </p>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mt-2">
                  <strong>Email:</strong> [tu-email@ejemplo.com]
                </p>
              </section>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
