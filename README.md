# Brújula — tutor de estudio con Gemini

Landing académica con chat de tutoría. La función de servidor `api/chat.js` integra **Gemini 3.5 Flash-Lite** mediante Gemini API (`generateContent`) y conserva la clave en el servidor.

Gemini 3.5 Flash-Lite tiene acceso sin costo en el Free Tier de Gemini API, sujeto a límites de uso. La cuenta y el proyecto también deben ser elegibles: Google puede marcar un proyecto como `Restricted` o `Free tier unavailable`. Cambiar a un modelo más liviano no elimina una restricción de acceso a nivel de proyecto.

## Ejecutar en local

1. Copiá `.env.example` como `.env.local`.
2. Agregá a `.env.local` una clave de tipo **Auth** creada en AI Studio para un proyecto elegible (`GEMINI_API_KEY` o `GOOGLE_API_KEY`). El servidor local también busca `.env` y `backend/.env`.
3. Ejecutá `npm start` con Node.js 20 o superior.
4. Abrí `http://localhost:3000`.

No agregues la clave a Git ni a `app.js`, `index.html` o cualquier archivo público.

## Comprobar el acceso gratuito de Google

En [Google AI Studio → Projects](https://aistudio.google.com/projects), confirma que el proyecto muestre el Free Tier disponible y que no figure como `Restricted`. Si muestra `Restricted` / `Free tier unavailable`, crear otra clave en ese mismo proyecto no lo corrige. Debe habilitarlo Google o debes usar un proyecto que ya sea elegible. No actives facturación para mantener el uso gratuito.

La API key no tiene una cuota independiente: hereda el estado del proyecto. El código usa `gemini-3.5-flash-lite`, un modelo estable y de menor costo diseñado para tareas de alto volumen; la [tabla oficial de precios](https://ai.google.dev/gemini-api/docs/pricing) indica que sus tokens tienen costo cero en Free Tier. Los límites exactos dependen del proyecto y aparecen en AI Studio.

## Configurar en Vercel

1. En el proyecto `brujula-tutor-estudio`, abre **Settings → Environment Variables**.
2. Agrega `GEMINI_API_KEY` (o `GOOGLE_API_KEY`), pega la clave Auth de un proyecto con Free Tier habilitado y selecciona **Production**. Vercel no lee el `.env` local; hay que guardar la variable en Vercel.
3. Guarda la variable como secreto.
4. En **Deployments**, vuelve a desplegar el último deployment para que aplique la variable.
5. Prueba el chat en `https://brujula-tutor-estudio.vercel.app/#tutor`.

`401` indica que Google rechazó la clave enviada; comprueba que Vercel tenga la clave Auth actual y vuelve a desplegar. Si defines ambos nombres, el endpoint prioriza `GOOGLE_API_KEY`. `403` indica que la clave o el proyecto no tiene acceso. `429` indica que se alcanzó una cuota gratuita; espera a que se restablezca.

## Integración y prompt

El navegador envía hasta 12 mensajes a `api/chat.js`. El servidor valida el método, el formato y el tamaño; agrega un prompt de sistema y llama a Gemini. La conversación vive en memoria del navegador y no se guarda en una base de datos. El prompt define el rol y objetivo del tutor, su contexto educativo, estilo, restricciones y formato de respuesta; está documentado en [ENTREGA.md](ENTREGA.md).

En el Free Tier, Google indica que las solicitudes pueden usarse para mejorar sus productos. Para la demo no ingreses datos personales ni información sensible.

## Referencias

- [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)
- [Precios y Free Tier de Gemini API](https://ai.google.dev/gemini-api/docs/pricing)
- [Tipos de claves Gemini y migración a Auth](https://ai.google.dev/gemini-api/docs/api-key)
- [Errores y proyectos restringidos](https://ai.google.dev/gemini-api/docs/troubleshooting)
- [Configurar variables de entorno en Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables)
