---
title: "Reescribí mi app de React Native en Swift y medí las dos"
description: "La misma app, la misma fototeca de 21.000 fotos y el mismo test automático para las dos. La versión en Swift gasta hasta 7 veces menos CPU y enseña la primera foto casi 4 veces antes."
pubDatetime: 2026-11-04T09:00:00Z
tags: ["ios", "swift", "react native", "performance", "testing", "ai"]
draft: false
ogImage: "https://blog.jaimechapinal.com/images/ayer-native-swift/og.jpg"
locale: "es"
translationKey: "ayer-react-native-to-native-swift"
---

**En resumen:** he pasado mi app [Ayer](https://chapiware.com/ayer) de React Native a Swift nativo y he
puesto las dos versiones a pasar el mismo test automático con una fototeca de 21.000 fotos. La de Swift
enseña la primera foto en **0,58 s en vez de 2,17 s**, carga los días con **7 veces menos CPU** y usa
**la mitad de memoria** al arrancar. Al desplazarse, empate.

<video src="/images/ayer-native-swift/ayer-rn-vs-native.mp4" poster="/images/ayer-native-swift/poster-next-day.jpg" controls muted playsinline preload="metadata" width="540"></video>

*React Native a la izquierda, Swift a la derecha. El mismo test y las mismas fotos.*

## La app

Ayer te enseña las fotos que hiciste tal día como hoy en años anteriores. También tiene un widget para
la pantalla de inicio, collages para poner dos años lado a lado y tarjetas de recuerdo para compartir.
Siempre ha sido gratis y privada: sin cuenta, sin anuncios y sin que tus fotos salgan del móvil. Eso no
ha cambiado; ahora simplemente va mucho más rápida. La tienes
[en la App Store](https://apps.apple.com/app/id6755725357).

Hasta ahora era una app de Expo. En el fondo es una capa fina sobre el framework Photos de Apple, y en
React Native cada una de esas llamadas pasa por JavaScript y por un puente. Quería saber cuánto costaba
eso.

Para ser justo con React Native: es la app **tal y como la publiqué**. Expo 53, React Native 0.79,
Hermes, FlashList, expo-image y la arquitectura antigua (`newArchEnabled: false`). No es la mejor app de
React Native que se podría escribir, es la que yo tenía.

## Cómo se hizo el port

No escribí el Swift a mano. Le pedí a Claude Code que analizara la app de React Native y escribiera un
plan, y después le di el port entero como una sola tarea larga, con criterios de "terminado" que podía
comprobar él mismo: que compile, que pasen los tests, que cada traducción exista en los 7 idiomas y que
cada pantalla tenga su captura junto a la de React Native.

El port en sí fue la parte rápida. La lenta fue todo lo de después: usar la app en mi móvil, unas
cuantas rondas de revisión de código y arreglar lo que iba saliendo. Lo que hizo mal:

- Un bundle ID que era solo para el benchmark acabó en el proyecto de la App Store. Dos veces. Las dos
  lo vi yo al abrir Xcode.
- Un bloqueo en el primer arranque que solo pasaba en un iPhone de verdad, nunca en el simulador.
- Dos fallos de rendimiento que solo aparecen con una fototeca grande. Los cuento más abajo.

Para que "la misma app" significara algo, tenía que poder comprobarse. Por eso las traducciones se
generan desde el código de React Native en vez de volver a escribirlas, y lo que elige una foto
"aleatoria" para el widget y las notificaciones se compara con datos sacados de ejecutar el TypeScript
original.

## Cómo lo medí

La regla: mismos pasos, mismas comprobaciones y mismas fotos. Si mides cada app con una herramienta
distinta, estás comparando herramientas.

- **Un solo test para las dos.** Un target de XCUITest sin app anfitriona lanza la app que le digas por
  su bundle ID. La build de Swift tiene su propio bundle ID para poder instalar las dos a la vez.
- **Builds Release en los dos lados.** Una build de depuración de React Native haría que la nativa
  pareciera mejor de lo que es.
- **Una fototeca realista.** Escribí un pequeño script en Swift que genera 20.920 JPEG con fechas EXIF
  reales de 2014 a 2026, con más fotos los fines de semana y en verano, y algunos días cargados con más
  de 300 fotos. 8 GB en total.
- **Las métricas de Apple.** `XCTCPUMetric` y `XCTMemoryMetric` miden el proceso de la app, no el del
  test, y la preparación queda fuera de la parte cronometrada.
- **Un orden justo.** Primero, pasadas de calentamiento; las apps se turnan para ir primero, y cada
  número es la mediana de 10 ejecuciones.

## Resultados

Simulador del iPhone 17 Pro, 20.926 fotos y 120 vídeos.

| | React Native | Swift | |
|---|---|---|---|
| Primer arranque: permitir Photos → primera foto | 2,17 s | **0,58 s** | 3,7× más rápida |
| Arranque hasta que responde | 1,48 s | **0,82 s** | 1,8× más rápida |
| Arranque, memoria máxima | 167 MB | **81 MB** | 2,1× menos |
| "Día siguiente" ×10, tiempo de CPU | 35,8 s | **5,2 s** | 6,9× menos |
| Pulsar "Día siguiente" → fotos en pantalla | 0,8–1,0 s | **0,35 s** | ~2,5× más rápida |
| Visor, 15 fotos, tiempo de CPU | 13,7 s | **4,9 s** | 2,8× menos |
| Desplazarse por un día cargado, CPU | 12,4 s | 13,2 s | igual |

La columna de CPU es la que me sorprendió. En un móvil, el tiempo de CPU es batería y calor, y ahí es
donde más se nota el cambio.

El empate también me sorprendió. Desplazarse por 349 fotos es sobre todo decodificar miniaturas, y eso
ocurre dentro del framework Photos de Apple en las dos apps. Lo nativo no lo hace todo más rápido.
Quita el trabajo propio de la app.

### ¿Y en qué gasta tanta CPU React Native?

No lo he perfilado, así que esto sale de leer el código. Para cargar un día, la app de React Native
recorre `expo-media-library` página a página para cada año, y cada página cruza el puente en JSON.
Después, en iOS, llama a `getAssetInfoAsync` **una vez por foto** solo para saber si es favorita. La
versión en Swift hace una sola consulta a Photos por día y el dato de favorita le viene gratis.

Así que parte de la diferencia es de React Native y parte es de cómo lo usaba mi código. Seguramente
pasa en casi todas las reescrituras.

## Un reloj dentro del vídeo

<video src="/images/ayer-native-swift/scene-3-next-day.mp4" poster="/images/ayer-native-swift/poster-next-day.jpg" autoplay loop muted playsinline width="540"></video>

Los números convencen a los ingenieros; todos los demás quieren verlo. Así que grabé las dos apps con
`simctl io recordVideo` y las puse lado a lado, cada una con su cronómetro. Pensaba que sería cosa de
una tarde. La primera versión se desviaba más de dos segundos.

simctl solo escribe un fotograma cuando cambia la pantalla, las grabaciones pueden empezar un segundo
tarde y, con carga, las marcas de tiempo bailan o incluso van hacia atrás. Así que los cronómetros y la
imagen no cuadraban.

La solución: mientras graba, un script cambia el reloj de la barra de estado del simulador entre
"1:11" y "8:88" a intervalos aleatorios y apunta cuándo lo hizo. Cada cambio es un fotograma nuevo en
el vídeo, así que tengo un punto de sincronización más o menos cada segundo. No hace falta OCR: un 8
enciende más píxeles que un 1. Como los intervalos son aleatorios, solo encaja una alineación, incluso
después de un parón, y luego cada fotograma se recoloca en la hora real con una expresión `setpts` de
ffmpeg.

Con eso, los cronómetros y la imagen coinciden con uno o dos fotogramas de diferencia.

## El benchmark encontró fallos en mi port

Lo mejor. La fototeca grande encontró problemas en la versión *en Swift* que mi fototeca de
demostración, con unas pocas docenas de fotos, no habría encontrado nunca:

1. **La primera carga se podía quedar atascada para siempre.** Cada aviso de cambios de Photos la
   reiniciaba, y mientras iCloud sincroniza esos avisos no paran. Ahora los cambios se agrupan y la
   carga en marcha puede terminar.
2. **El visor guardaba todas las fotos en memoria.** Pasar 15 fotos llegaba a 404 MB, más que la app
   de React Native. Ahora solo las páginas al lado de la visible conservan su imagen: 177 MB.

Los dos habrían llegado a los usuarios. Y los dos son el tipo de fallo que un agente no encuentra por
su cuenta: el código era correcto, simplemente no escalaba.

## Limitaciones

- Son números de simulador. Un Mac es mucho más rápido que un móvil, así que fíjate en las
  proporciones, no en los tiempos.
- La fluidez al desplazarse y las fototecas que están solo en iCloud necesitan un dispositivo real.
  Eso será el siguiente artículo.

## Con qué me quedo

- **Mide antes de creértelo.** Habría apostado por más mejora al desplazarse y menos en CPU. Fue
  justo al revés.
- **Un benchmark también es una batería de tests.** Encontró dos fallos reales en mi port "terminado".
- **Un agente puede portar una app, pero "terminado" tiene que ser algo que puedas comprobar.**
- **Si no te puedes fiar del reloj, mete uno en la imagen.**

Si quieres ver cómo es "este día, en todos tus años" con tus propias fotos, Ayer está en la
[App Store](https://apps.apple.com/app/id6755725357). Igual de gratis, igual de privada y ahora mucho
más rápida. Más información en [chapiware.com/ayer](https://chapiware.com/ayer).
