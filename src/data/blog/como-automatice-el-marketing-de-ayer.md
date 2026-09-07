---
title: "Cómo automaticé el marketing de mi app móvil con Wikipedia, Playwright y 0€ de presupuesto"
description: "Cómo construí una pequeña máquina de contenido alrededor de Ayer para generar imágenes, vídeos y una web pública sin pagar anuncios."
pubDatetime: 2026-09-07T10:00:00Z
tags: ["indie hacking", "engineering as marketing", "automation", "playwright", "mobile apps"]
draft: false
locale: "es"
translationKey: "automated-marketing-ayer-app"
---

Crear una app es relativamente fácil. Lo complicado viene después: conseguir que alguien la descubra.

Hace un tiempo publiqué [Ayer](https://www.chapiware.com/ayer/), una aplicación para iOS y Android que te enseña qué fotos hiciste tal día como hoy hace uno, cinco o diez años.

La idea es muy sencilla. Abres la aplicación y puedes ver qué estabas haciendo en esa misma fecha hace algunos años. Cumpleaños, viajes, mudanzas, niños que ahora son mucho más grandes o fotos que ya ni recordabas que existían.

Ayer funciona completamente en local. No sube las fotos a ningún servidor, no necesita una cuenta y no hay ningún sistema de rastreo detrás.

El problema llegó cuando tuve que promocionarla.

Podía publicar alguna captura en redes sociales de vez en cuando, pero sabía perfectamente cómo acabaría eso: preparando dos o tres publicaciones, olvidándome durante unas semanas y volviendo a acordarme de la aplicación cuando alguien me preguntase por ella.

Así que hice lo que suelo hacer cuando algo me da pereza: intenté programarlo.

El resultado es [OnThisAyer](https://xatpy.github.io/OnThisAyer/), una web que recupera acontecimientos históricos de Wikipedia, prepara contenido para redes sociales y sirve como escaparate público para Ayer.

## La idea

Ayer habla de tus recuerdos.

OnThisAyer habla de los recuerdos de todo el mundo.

En la aplicación puedes mirar qué estabas haciendo un 7 de septiembre hace cinco años. En la web puedes descubrir qué ocurrió el 7 de septiembre de 1966, 1988 o 2001.

La conexión me pareció bastante natural. En los dos casos estás mirando una fecha y preguntándote qué pasó entonces.

La web tenía que servir para dos cosas:

1. Crear contenido visual sin tener que diseñar cada publicación desde cero.
2. Tener una página pública que pudiese descubrirse desde buscadores y enlazase con la aplicación.

La idea entra dentro de lo que se suele llamar *Engineering as Marketing*: construir algo que sea útil o interesante y que, de paso, ayude a distribuir el producto principal.

En mi caso, además, podía reutilizar el diseño de Ayer. La web, las capturas y los vídeos tienen la misma identidad visual que la aplicación.

## El flujo

El sistema funciona más o menos así:

```text
Wikipedia
    ↓
Extraer acontecimientos e imágenes
    ↓
Filtrar y ordenar
    ↓
Elegir los tres mejores
    ↓
Generar copys, capturas y vídeos
    ↓
Publicar una web estática
```

Todo está hecho con Node.js y se ejecuta en local. Los datos se guardan en archivos JSON y la web se publica en GitHub Pages.

No hay una base de datos, un servidor dedicado ni una API propia que mantener.

## Sacar algo útil de Wikipedia

Wikipedia tiene una API para consultar las efemérides de cualquier día del año.

El problema es que la respuesta puede contener muchísimos acontecimientos y que no todos sirven para crear una publicación interesante. Hay hechos históricos importantes, pero difíciles de explicar en una imagen. Otros no tienen fotografías. Algunos son demasiado locales o directamente no tienen ningún interés para una persona que está haciendo scroll en Instagram.

Por eso el extractor hace unas cuantas cosas antes de guardar un acontecimiento:

- busca las imágenes relacionadas;
- descarta los que no tienen material visual adecuado;
- elimina duplicados del mismo año;
- filtra contenido sensible;
- comprueba que las imágenes no sean mapas, banderas, logos o diagramas;
- asigna una puntuación a cada candidato.

La puntuación tiene en cuenta cosas bastante simples. Los acontecimientos recientes suelen tener más posibilidades de ser reconocibles. También tienen más peso temas como tecnología, cine, música, deporte o cultura popular.

Un lanzamiento de Apple, una misión espacial o una final de un mundial probablemente funcionen mejor en redes que un decreto local de 1742 del que no existe ninguna imagen.

No es inteligencia artificial ni pretende adivinar qué se va a hacer viral. Es solo una forma de pasar de una lista enorme a diez candidatos razonables.

## El panel de curación

Al principio podía seleccionar automáticamente los tres acontecimientos con más puntuación y ya está.

El problema es que el resultado no siempre era el mejor. A veces los tres acontecimientos eran demasiado parecidos. Otras veces la imagen elegida no me convencía. También había acontecimientos que tenían una puntuación menor pero que eran mucho más fáciles de contar.

Así que añadí un pequeño panel local de curación.

Desde ahí puedo navegar por los días del año, ver los acontecimientos encontrados, abrir sus páginas de Wikipedia y elegir los tres que quiero utilizar.

El sistema hace una primera selección automática, pero yo puedo cambiarla antes de guardarla.

Esta parte me parece bastante importante. No quería que una fórmula decidiese por completo qué merece la pena publicar. Quería quitarme de encima la parte repetitiva y quedarme con la decisión final.

La automatización busca y ordena. Yo hago de editor.

## Las capturas con Playwright

Una vez seleccionados los acontecimientos, el sistema genera una captura utilizando la misma interfaz visual de Ayer.

La pantalla está hecha con HTML y CSS. Playwright abre esa página como si fuese un navegador y captura únicamente el elemento que representa la pantalla del teléfono.

```js
const context = await browser.newContext({
  viewport: {
    width: 440,
    height: 956
  },
  deviceScaleFactor: 2.5
});
```

El resultado es una imagen de 1100 × 2390 píxeles, una resolución suficientemente grande para publicar la captura en redes sociales.

Para generar la imagen de un día concreto:

```bash
npm run render -- --day=08-29
```

Y el archivo aparece en:

```text
output/08-29.png
```

La ventaja de hacerlo así es que la pieza no es un diseño separado que tenga que mantener manualmente. Se genera a partir de la interfaz de Ayer.

Si algún día cambio los colores o la estructura de la aplicación, puedo actualizar también las capturas desde el mismo código.

## Los textos para redes sociales

El sistema también prepara los textos.

Genera versiones distintas para X, Instagram y Threads. Para X intenta mantenerse dentro del límite de caracteres y evita cortar las frases en sitios extraños. Para Instagram añade más contexto, hashtags y una pregunta relacionada con los recuerdos personales.

La parte que conecta todo suele ser algo así:

```text
¿Qué estabas haciendo tú tal día como hoy hace cinco o diez años?
Mira tu carrete de fotos 👀
```

La idea es que el acontecimiento histórico sea solo el principio. Después de leer que algo ocurrió en 1987, la persona debería pensar en qué estaba haciendo ella misma en esa fecha.

No publico automáticamente en cada red social. El sistema me deja preparado el contenido y yo decido qué quiero publicar. Para mí eso está bien: ahorra mucho trabajo sin convertir mis perfiles en una máquina que publica cualquier cosa sin revisión.

## También añadí vídeos

Después de tener las imágenes funcionando, añadí vídeos verticales para TikTok, Reels y YouTube Shorts.

La generación utiliza Remotion y combina los acontecimientos del día con imágenes y elementos visuales de Ayer.

Para generar vídeos de varios días:

```bash
npm run video:batch -- --days=7
```

También puedo generar solo uno:

```bash
npm run video -- --day=09-07
```

La gracia es que la misma información puede terminar en varios formatos:

- una página web;
- una captura de pantalla;
- un hilo;
- un texto para Instagram;
- un vídeo corto.

No tengo que pensar en cinco ideas distintas para cada día. Tengo una idea y varias formas de presentarla.

## La web pública

La parte visible del proyecto es [OnThisAyer](https://xatpy.github.io/OnThisAyer/).

Tiene un calendario y permite navegar por los días anteriores. Cada fecha muestra los acontecimientos seleccionados, imágenes, vídeos y enlaces relacionados con Ayer.

Las fechas futuras están bloqueadas hasta que llega el día correspondiente. Así puedo dejar publicada la web durante todo el año sin mostrar contenido de días que todavía no han llegado.

Los datos están organizados en archivos JSON:

```text
data/
├── curated.json
└── events/
    ├── 01-01.json
    ├── 01-02.json
    └── ...
```

Cuando hago push al repositorio, GitHub Actions ejecuta las pruebas, copia los datos y los vídeos a la web y despliega todo en GitHub Pages.

El coste mensual de la infraestructura es de 0€.

Bueno, en realidad el proyecto utiliza mi ordenador, mi tiempo y mi electricidad. Pero no tengo que pagar un servidor, una base de datos ni campañas de anuncios para mantenerlo funcionando.

## Por qué no monté un backend

Podría haber creado una aplicación web tradicional con una base de datos y una API.

Pero no hacía falta.

El contenido puede prepararse por adelantado, los datos no son privados y la web solo tiene que mostrar archivos que ya han sido generados.

La arquitectura final es bastante aburrida:

```text
Scripts locales
    ↓
Archivos JSON y vídeos
    ↓
GitHub Actions
    ↓
GitHub Pages
```

Y eso es precisamente lo que quería. Cuantas menos piezas haya, menos cosas tengo que mantener.

La web también puede consultar directamente la API de Wikipedia si no encuentra datos precalculados, aunque el contenido principal que publico procede de los archivos que he revisado y guardado previamente.

Las imágenes y los datos históricos llevan enlaces a sus páginas originales y la web incluye la atribución correspondiente a Wikimedia.

## Lo que me llevo del proyecto

Lo más interesante es que terminé construyendo una herramienta de marketing que se parece mucho a la propia aplicación.

Ayer responde a esta pregunta:

> ¿Qué estaba haciendo yo tal día como hoy?

OnThisAyer responde a esta otra:

> ¿Qué estaba pasando en el mundo tal día como hoy?

Las dos cosas hablan de recuerdos asociados a una fecha. Una mira hacia tu carrete de fotos y la otra hacia la historia.

También me ha servido para confirmar algo que ya había comprobado con otros proyectos: automatizar no significa que todo tenga que ser completamente automático.

La máquina puede descargar los datos, buscar imágenes, ordenar acontecimientos, generar capturas y preparar los textos. Pero sigue siendo útil que haya una persona mirando el resultado antes de publicarlo.

En este caso, la automatización no sustituye el criterio. Simplemente hace que el criterio se aplique sobre diez opciones razonables en vez de sobre cientos de resultados.

El código está disponible en [GitHub](https://github.com/Xatpy/OnThisAyer). Ahí se puede ver cómo se extraen los acontecimientos, cómo se puntúan, cómo se generan las capturas con Playwright y cómo se despliega la web estática.

Y si algún día te encuentras una publicación de OnThisAyer, probablemente la haya preparado mi ordenador mientras yo estaba haciendo cualquier otra cosa.
