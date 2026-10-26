# Entrega del proyecto: Brújula

**Título:** Brújula — tutor de estudio con IA  
**Tipo de solución:** prototipo web académico  
**Modelo configurado:** Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`)  
**URL:** https://brujula-tutor-estudio.vercel.app

> **Estado de acceso:** el código usa un modelo Gemini con uso sin costo en el Free Tier. La última prueba de producción con `gemini-3.5-flash-lite` devolvió `401 UNAUTHENTICATED`, así que Google no aceptó la clave que está en Vercel. Además, los proyectos comprobados en AI Studio muestran `Restricted` y `Free tier unavailable`. Google empezó a rechazar claves Standard en septiembre de 2026; la clave debe ser Auth y pertenecer a un proyecto con Free Tier habilitado. El cambio a Flash-Lite está desplegado, pero hace falta reemplazar la clave para que el chat responda.

## 1. Descripción del problema

Brújula es una propuesta ficticia para estudiantes de secundaria y de los primeros años de formación. Al estudiar, pueden surgir dudas sin que haya una persona disponible para explicarlas. También puede ser difícil identificar ideas principales, obtener un ejemplo sencillo y organizar el siguiente paso de estudio.

El proyecto presenta este caso como problema académico. No afirma representar a una institución real ni incluye estadísticas no verificadas.

## 2. Propuesta de solución y justificación del uso de IA

La solución es una landing page con un chat de tutoría. El estudiante puede preguntar sobre un concepto, pedir un ejemplo, solicitar un resumen o preparar una sesión de estudio.

Un LLM resulta adecuado porque puede interpretar preguntas formuladas de distintas maneras, generar explicaciones y usar el contexto reciente de la conversación para adaptar la respuesta. Una lista fija de preguntas frecuentes no ofrece la misma flexibilidad.

La IA funciona como apoyo para aprender. No reemplaza a docentes ni materiales de clase, no conoce el programa de una materia real y debe reconocer cuándo le falta contexto o no está segura.

## 3. Desarrollo e integración de un modelo LLM

La interfaz está construida con HTML, CSS y JavaScript. El navegador envía los últimos mensajes de la conversación a `api/chat.js`, una función de servidor Node.js desplegada en Vercel. Esta valida el método HTTP, formato y tamaño de los mensajes, agrega las instrucciones del sistema y llama al endpoint `generateContent` de Gemini API.

El modelo seleccionado es **Gemini 3.5 Flash-Lite**. Google lo describe como su modelo 3.5 más rápido y económico para tareas de alto volumen. La tabla oficial de precios indica costo cero por tokens en el Free Tier, sujeto a límites de uso. Se seleccionó para la demo porque las preguntas de tutoría requieren respuestas de texto breves y no necesitan herramientas avanzadas.

La variable `GEMINI_API_KEY` se guarda como secreto en Vercel y se lee únicamente en el backend; no aparece en el código del navegador. La conversación se conserva en memoria durante la sesión y no se almacena en una base de datos.

**Limitación observada:** aunque el modelo tiene uso sin costo en el Free Tier, Google debe considerar elegible el proyecto y la cuenta. Si AI Studio muestra `Restricted` o `Free tier unavailable`, la API devuelve `403 PERMISSION_DENIED`. Ese estado bloquea a todos los modelos Gemini y no se corrige cambiando a una versión más liviana ni creando otra clave dentro del mismo proyecto.

## 4. Configuración del sistema y diseño del prompt

El prompt está definido como `SYSTEM_INSTRUCTION` en `api/chat.js` y configura:

- **Rol:** tutor de estudio paciente y cercano.
- **Objetivo:** ayudar a comprender ideas, resumir temas, practicar conceptos y organizar sesiones.
- **Contexto:** estudiantes de secundaria y primeros años de formación; demostración general con foco ilustrativo en Introducción a la Inteligencia Artificial. El modelo solo conoce los materiales que la persona comparte en el chat.
- **Estilo:** español claro, amable y directo; palabras sencillas, ejemplos concretos y párrafos breves.
- **Restricciones:** no inventar citas, requisitos de cursos ni contenido de materiales no recibidos; reconocer incertidumbre; pedir contexto cuando haga falta; priorizar el razonamiento; no afirmar que reemplaza a docentes ni que garantiza calificaciones.
- **Estructura esperada:** responder primero a la duda; cuando ayude, agregar explicación breve, ejemplo y una pregunta o práctica de repaso. Adaptarse si la persona pide otro formato.

## Paso a paso para completar la configuración gratuita

1. **Abre AI Studio → Projects.** Entra en [aistudio.google.com/projects](https://aistudio.google.com/projects) con tu cuenta de Google.
2. **Comprueba el nivel del proyecto.** Debe mostrar Free Tier disponible y no tener estado `Restricted`. El proyecto `Proyecto IA` (`proyecto-ia-512716`) y el proyecto anterior fueron vistos como `Restricted` / `Free tier unavailable`; sus claves no pueden invocar el modelo.
3. **Crea una clave Auth.** En AI Studio → **API Keys**, pulsa **Create API key** y selecciona un proyecto elegible. Revisa que el tipo sea **Auth**; Google dejó de aceptar claves **Standard** para Gemini API en septiembre de 2026. No copies la clave a esta conversación.
4. **Si todos tus proyectos aparecen restringidos**, no cambies a Gemini 2.5 ni generes más claves en esos proyectos: Google indica que la elegibilidad es del proyecto/cuenta. Usa **Send feedback** en AI Studio o el foro oficial de [Google AI Developers](https://discuss.ai.google.dev/) para pedir una revisión de elegibilidad. Incluye el ID del proyecto, el estado `Restricted / Free tier unavailable` y el error `403 PERMISSION_DENIED`; aclara que solicitas acceso al Free Tier y no quieres habilitar facturación.
5. **No actives facturación.** El uso gratuito requiere un proyecto elegible. Vincular facturación cambia el plan y puede generar cargos.
6. **Cuando tengas una clave Auth de un proyecto elegible**, ve en Vercel a `brujula-tutor-estudio` → **Settings → Environment Variables**. Reemplaza `GEMINI_API_KEY`, selecciona **Production**, guarda el valor como secreto y vuelve a desplegar el último deployment.
7. **Prueba el tutor** en la URL publicada con una pregunta de estudio. No compartas la API key por chat ni la pegues en los archivos del navegador.

## Referencias técnicas

- [Gemini 3.5 Flash-Lite y su identificador](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)
- [Precios y acceso Free Tier](https://ai.google.dev/gemini-api/docs/pricing)
- [Tipos de clave y migración a Auth](https://ai.google.dev/gemini-api/docs/api-key)
- [Solución de errores `403` y proyectos restringidos](https://ai.google.dev/gemini-api/docs/troubleshooting)
- [Referencia de `generateContent`](https://ai.google.dev/api/generate-content)
- [Variables de entorno en Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables)
