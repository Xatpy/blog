---
title: "Reescribí mi app de React Native en Swift y monté un benchmark para comprobar si merecía la pena"
description: "Cómo porté Ayer de React Native a iOS nativo y cómo medí las dos apps lado a lado con una fototeca de 21.000 fotos: métricas de XCUITest, una fototeca sintética y un reloj en la barra de estado para sincronizar los vídeos."
pubDatetime: 2026-11-04T09:00:00Z
tags: ["ios", "swift", "react native", "performance", "testing", "ai"]
draft: false
ogImage: "https://blog.jaimechapinal.com/images/ayer-native-swift/og.jpg"
locale: "es"
translationKey: "ayer-react-native-to-native-swift"
---

"En nativo irá más rápido" es de esas cosas que todo el mundo dice y nadie mide. Acabo de reescribir
[Ayer](https://chapiware.com/ayer) de React Native a Swift nativo, y la versión 2.0 ya está
[en la App Store](https://apps.apple.com/app/id6755725357). Antes de publicarla tuve una oportunidad
poco habitual de comprobarlo: dos builds de la misma app, con las mismas pantallas y las mismas
funciones, sobre la misma fototeca.

Este artículo va sobre todo de cómo medirlo. ¿Cómo comparas de forma justa dos apps cuando una es
React Native y la otra SwiftUI? ¿Cómo metes una fototeca realista de 21.000 fotos en un simulador? ¿Y
cómo haces vídeos lado a lado con cronómetros de los que te puedas fiar?

<video src="/images/ayer-native-swift/ayer-rn-vs-native.mp4" poster="/images/ayer-native-swift/poster-next-day.jpg" controls muted playsinline preload="metadata" width="540"></video>

*React Native a la izquierda, Swift nativo a la derecha, las dos movidas por el mismo test automático.*

## La app y por qué la porté

Ayer te enseña las fotos que hiciste tal día como hoy en años anteriores. Funciona entero en el
dispositivo: sin cuenta, sin servidor y sin seguimiento. Hasta esta versión, la de la App Store era una
app de Expo/React Native para iOS y Android.

En el fondo, la app es una capa fina sobre el framework Photos de Apple: para cada día de cada año
anterior consulta la fototeca, monta un listado, abre un visor con zoom y alimenta un widget. En React
Native cada una de esas llamadas pasa por módulos nativos y por JavaScript, y las miniaturas pasan
además por una capa de carga de imágenes encima de Photos. Quería saber cuánto tiempo de la app se iba
en eso.

### Qué se compara exactamente

Es la app de React Native **tal y como estaba publicada**, no la mejor app de React Native que podría
haber escrito:

- **React Native:** Expo SDK 53, React Native 0.79.6, Hermes, `@shopify/flash-list` 1.7 para el
  listado, `expo-image` 2.4 para las miniaturas y `expo-media-library` 17 para Photos. Funciona con la
  **arquitectura antigua** (`newArchEnabled: false`). Puede que la New Architecture reduzca parte de la
  diferencia; no lo he probado.
- **Nativa:** Swift, SwiftUI con UIKit donde SwiftUI se queda corto, PhotoKit y WidgetKit, sin
  dependencias de terceros.

Las dos son builds Release. Más sobre eso abajo.

## Cómo se hizo el port (sí, con un agente de IA)

No escribí el Swift a mano. Le pedí a [Claude Code](https://claude.com/claude-code) que analizara la
app de React Native y escribiera un plan de port, y después le di el port entero como una sola tarea
larga con criterios de "terminado" explícitos. Mi trabajo fue decidir, revisar y probar.

**Primero, el plan.** `PORT_PLAN.md` inventariaba cada pantalla, servicio y ajuste, emparejaba cada
librería de React Native con su equivalente en iOS, listaba los formatos de datos con los que la app
nueva tenía que seguir siendo compatible y dividía el trabajo en diez fases. También dejaba fijadas las
decisiones de antemano, para que el agente no tuviera que adivinar:

- **iOS 17 como mínimo.** SwiftUI, con UIKit donde SwiftUI se queda corto: el visor de fotos
  paginado, el zoom con dos dedos y el calendario.
- **Un paquete Swift local** (`AyerKit`) compartido por la app y la extensión de WidgetKit.
- **Cero dependencias de terceros en tiempo de ejecución.** Hasta la fuente Ionicons va incluida,
  para que los iconos coincidan píxel a píxel.
- **El mismo bundle ID y el mismo app group,** para que se instale como una actualización. En el
  primer arranque lee los ajustes antiguos de AsyncStorage y borra las cachés de React Native.
- **Qué no portar:** código muerto, un onboarding que no se usaba, la analítica y todo lo que era solo
  de Android.

**Los criterios de "terminado" se podían comprobar.** El proyecto se genera y compila sin errores;
pasan los tests unitarios de las fechas, de las maquetaciones y del hash; cada clave de traducción
existe en los 7 idiomas; cada pantalla se captura en claro y en oscuro y se compara con la app de
React Native; y un fichero de estado lista cada diferencia con la app original y todo lo que necesita
un dispositivo real.

**Los plazos.** El plan se escribió la noche del 22 de octubre. El benchmark de este artículo se
ejecutó sobre el port terminado la tarde siguiente. Después vino una semana de la parte que no es
automática: probarla en mi iPhone, pedirle a un segundo modelo (Codex) que revisara el código cinco
veces y arreglar lo que encontraba, una revisión de seguridad y rendimiento, y pulir la interfaz. La
envié a revisión el 30 de octubre.

**Lo que hizo mal o se le escapó:**

- **Un bundle ID que era solo para el benchmark acabó en el proyecto de la App Store. Dos veces.** Las
  dos veces lo vi yo al abrir el proyecto en Xcode. Por eso ahora el benchmark vive en un proyecto
  aparte (lo explico abajo).
- **Un bloqueo en el primer arranque en un dispositivo real.** Tras aceptar las notificaciones, el
  aviso de recordatorios se quedaba en pantalla con el indicador de carga y no respondía durante
  varios segundos. En el simulador nunca pasó.
- **Una barra de botones del visor demasiado apretada** con tamaños de letra grandes. Técnicamente era
  "igual que en React Native", pero en mi móvil se veía mal.
- **Dos fallos de rendimiento que solo aparecen con una fototeca grande.** Los encontró el benchmark,
  y los cuento al final.

El resultado son 48 ficheros Swift: unas 8.700 líneas de código de la app, el widget y el paquete, y
unas 1.100 de tests. Las carpetas `src` y `app` del repositorio de React Native suman unas 21.000
líneas de TypeScript, aunque eso incluye código solo de Android y código sin usar que no se portó.

## Paridad por construcción, no a ojo

"Exactamente la misma app" es fácil de decir y difícil de comprobar, para un agente y para mí. Casi
todo el trabajo de paridad consistió en convertir "es igual" en algo que un test pueda verificar:

- **Las traducciones se generan, no se vuelven a escribir.** Un script lee el `translations.ts` de
  React Native y escribe el catálogo de cadenas de Xcode: 7 idiomas, 328 claves.
- **Las mismas elecciones "aleatorias".** Ayer usa un hash de una cadena para elegir el mensaje de la
  notificación diaria, la foto de la notificación y la del widget. Los tests unitarios de Swift lo
  comparan con datos generados ejecutando el TypeScript original, así que las dos apps eligen la misma
  foto el mismo día.
- **Las cuentas de maquetación tienen tests:** los collages y las tarjetas de recuerdo, los límites
  del zoom y el desplazamiento, el contraste WCAG y las ventanas de cada día. En esas ventanas es donde
  están los casos raros: los cambios de hora, el 29 de febrero y las fotos de antes del 2000.
- **Capturas de las dos apps.** Cada pantalla se capturó en la app de React Native y en la nativa, en
  modo claro y oscuro, y se compararon.

![Pantalla de inicio, React Native frente a Swift nativo](/images/ayer-native-swift/parity-home-light.webp)

*El formato de la fecha cambia solo porque los dos simuladores tenían configurada una región distinta.*

Y entonces llegó la pregunta de verdad: ¿es más rápida?

## Regla número uno: mismos pasos, mismas comprobaciones, misma fototeca

El benchmark tenía que tratar las dos apps como cajas negras. Si mides la app de React Native con una
herramienta y la nativa con otra, estás comparando herramientas, no apps.

### Las dos apps en el mismo dispositivo

Una especificación de XcodeGen aparte añade una configuración `Bench`: una build Release con su propio
bundle ID y su propio app group. Se instala junto a la app de React Native en el simulador, o junto a
la de la App Store en mi móvil, sin tocar sus datos. Vive en su propio proyecto
(`AyerBench.xcodeproj`), así que el proyecto que archivo para la App Store no tiene ningún
identificador `.bench`:

```yaml
# bench.yml (XcodeGen), on top of project.yml
include: [project.yml]
name: AyerBench
configs:
  Bench: release
settings:
  configs:
    Bench:
      AYER_APP_GROUP: group.com.chapiware.ayer.bench
      AYER_DISPLAY_NAME: Ayer Bench
targets:
  Ayer:
    settings:
      configs:
        Bench:
          PRODUCT_BUNDLE_IDENTIFIER: com.chapiware.ayer.bench
```

La de React Native es una build **Release** de verdad: bytecode de Hermes, sin Metro y sin menú de
desarrollo. Es lo que se publica en la App Store. Medir una build de depuración de React Native haría
que la nativa pareciera mejor de lo que es.

### Un solo target de tests que mueve cualquier app

`BenchUITests` es un target de XCUITest **sin app anfitriona**. Lanza el bundle ID que le digas, así
que exactamente el mismo código de test mueve las dos apps:

```swift
private var bundleId: String { env["BENCH_BUNDLE_ID"] ?? "com.chapiware.ayer.bench" }
private lazy var app = XCUIApplication(bundleIdentifier: bundleId)
```

Las variables de entorno llegan al test a través de xcodebuild con el prefijo `TEST_RUNNER_`:

```sh
TEST_RUNNER_BENCH_BUNDLE_ID=com.chapiware.ayer \
  xcodebuild test-without-building -project build/AyerBench.xcodeproj -scheme Bench -destination "id=$UDID" \
  -only-testing:BenchUITests/BenchmarkTests/test3_nextDayTimesTen
```

### Que dos apps distintas parezcan iguales para un test

Lo más difícil fue definir "este día ya ha cargado" de forma que significara lo mismo en las dos apps.
Las dos etiquetan sus miniaturas con la misma clave de traducción: `"Photo from 10/23/2024"`. Así que
"el día ha cargado" quiere decir "hay en pantalla una miniatura con la fecha de ese día". Pero el
árbol de accesibilidad de React Native no es el de UIKit:

- **El `Pressable` de React Native no tiene el rasgo de botón,** así que `app.buttons["Next day"]` no
  encuentra nada. Los controles se buscan por su etiqueta, sea cual sea el tipo de elemento.
- **Los contenedores de React Native exponen las etiquetas de todos sus hijos concatenadas.** Por eso
  un `CONTAINS` normal encuentra primero una vista padre. Las miniaturas se buscan con un patrón exacto:

```swift
private func thumbnail(_ token: String) -> XCUIElement {
  app.descendants(matching: .any).matching(NSPredicate(
    // Exact pattern: RN containers expose the concatenated labels of all their children.
    format: "label MATCHES '^(Photo|Video) from [0-9]+/[0-9]+/[0-9]+$' AND label CONTAINS %@", token
  )).firstMatch
}
```

## Una fototeca que merezca la pena medir

Mi fototeca de demostración tiene unas pocas docenas de fotos, y con unas pocas docenas de fotos
cualquier app va rápida. Las fototecas de verdad tienen decenas de miles, con algunos días
(cumpleaños, Navidad, vacaciones) que acumulan cientos.

Así que escribí un pequeño generador en Swift. Dibuja 20.920 JPEG con Core Graphics y le pone a cada
uno una fecha de captura en el EXIF. Las fechas van de 2014 a 2026 y pesan más los fines de semana, los
veranos y los años recientes, como en una fototeca familiar real. Algunos días cargados tienen entre
300 y 480 fotos, y los diez días siguientes a "hoy" tienen una carga constante para el escenario de
"día siguiente".

```swift
let stamp = exifDate(item.date) // "2019:10:23 14:07:51"
let props: [CFString: Any] = [
  kCGImageDestinationLossyCompressionQuality: 0.82,
  kCGImagePropertyExifDictionary: [kCGImagePropertyExifDateTimeOriginal: stamp,
                                   kCGImagePropertyExifDateTimeDigitized: stamp],
]
CGImageDestinationAddImage(dest, render(item), props as CFDictionary)
```

Cada imagen lleva además miles de cuadraditos aleatorios de "grano", para que los JPEG se compriman
como fotos y no como gráficos planos. Los 8 GB de fototeca entraron en el simulador por tandas con
`xcrun simctl addmedia`.

**Una trampa con los vídeos:** Photos ignora `com.apple.quicktime.creationdate` al importar, y los 120
vídeos de prueba aparecían como hechos "hoy". Photos lee en su lugar el átomo `CreateDate` de
QuickTime, que escribí con `exiftool -api QuickTimeUTC`.

## Qué se mide

Cada escenario usa las métricas de rendimiento propias de XCTest. `XCTCPUMetric` y `XCTMemoryMetric`
miden el proceso *de la app* (no el del test), así que miden Ayer, no XCUITest:

```swift
func test3_nextDayTimesTen() {
  let o = options
  o.invocationOptions = [.manuallyStart]
  measure(metrics: [XCTClockMetric(), XCTCPUMetric(application: app), XCTMemoryMetric(application: app)],
          options: o) {
    launchAndWaitForToday()           // not timed
    let next = control("Next day")
    startMeasuring()
    for offset in 1...10 {
      next.tap()
      XCTAssertTrue(waitForDay(offset: offset), "day +\(offset)")
    }
  }
}
```

`manuallyStart` y `manuallyStop` dejan la preparación fuera de la parte cronometrada. Los escenarios:

| Escenario | Qué hace |
|---|---|
| Primer arranque tras instalar | Reinstala (eso reinicia el permiso de Photos), pulsa "Permitir acceso completo" en el aviso real del sistema y cronometra hasta que aparece la primera foto |
| Arranque en frío → primera foto | Cierra la app, la abre y espera a la primera miniatura de hoy |
| Arranque (métrica del sistema) | `XCTApplicationLaunchMetric(waitUntilResponsive: true)`: desde que arranca el proceso hasta que la app responde |
| Día siguiente ×10 | Pulsa "Día siguiente" diez veces y espera cada vez a las fotos de ese día |
| Desplazarse por un día cargado | 12 desplazamientos rápidos por 349 fotos, con las métricas de desplazamiento |
| Visor | Abre la primera foto y pasa 15 |

### Ser justo

Un benchmark así premia al que se ejecuta segundo, o al que se ejecuta cuando el Mac está libre. El
script que lo lanza (`run.sh`) intenta evitarlo:

1. **Primero, pasadas de calentamiento.** Después de importar, Photos genera las miniaturas poco a
   poco, así que la app que se ejecutara primero pagaría por ello.
2. **Orden alterno:** React Native primero en la ronda 1, la nativa primero en la ronda 2, y así.
3. **Una invocación de xcodebuild por escenario,** para que un escenario que falle no deje la app en
   un estado que rompa el siguiente.
4. **Los avisos se cierran fuera de las partes cronometradas.** La hoja de "¿Te gusta Ayer?" de la
   app de React Native volvía a salir una y otra vez en el simulador, donde StoreKit no la limita.
5. **Medianas,** con desviación típica, de 2 rondas × 5 iteraciones.

Cada ejecución genera un `.xcresult` por app, escenario y ronda. `xcresulttool` exporta las métricas
en JSON, y un pequeño script en Python las junta por app y escribe el informe:

```sh
xcrun xcresulttool get test-results metrics --path native-r1-test3.xcresult --compact
```

## Resultados

Simulador del iPhone 17 Pro (iOS 26.5), 20.926 fotos y 120 vídeos, medido el 23 de octubre sobre el
port terminado. La 2.0 publicada ha recibido desde entonces correcciones de las revisiones y retoques
de la interfaz; no he repetido el benchmark sobre esa build exacta.

| | React Native | Swift nativo | |
|---|---|---|---|
| Primer arranque: permitir Photos → primera foto | 2,17 s | **0,58 s** | 3,7× más rápida |
| Arranque hasta responder (métrica del sistema) | 1,48 s | **0,82 s** | 1,8× más rápida |
| Arranque en frío, tiempo de CPU | 4,37 s | **1,91 s** | 2,3× menos |
| Arranque en frío, memoria máxima | 167 MB | **81 MB** | 2,1× menos |
| Día siguiente ×10, tiempo real | 22,2 s | **13,6 s** | 1,6× más rápida |
| Día siguiente ×10, tiempo de CPU | 35,8 s | **5,2 s** | 6,9× menos |
| Pulsar "Día siguiente" → fotos en pantalla | 0,8–1,0 s | **0,34–0,37 s** | ~2,5× más rápida |
| Visor, 15 fotos, tiempo de CPU | 13,7 s | **4,9 s** | 2,8× menos |
| Visor, memoria máxima | 262 MB | **177 MB** | 1,5× menos |
| Desplazarse por un día cargado, CPU | 12,4 s | 13,2 s | igual |
| Desplazamiento, memoria máxima | 315 MB | **216 MB** | 1,5× menos |

Sobre el tamaño: los `.app` del simulador ocupan 56 MB (React Native) y 17 MB (nativa), pero una build
de simulador no es lo que se descarga la gente. La descarga de la 2.0 en la App Store es de 10,2 MB.

Me llamaron la atención dos cosas.

**La primera, la columna de CPU.** Avanzar diez días le cuesta a la app de React Native 35,8 s de CPU
y a la nativa 5,2 s. La diferencia en tiempo real es mucho menor (22,2 s frente a 13,6 s), porque
casi todos los 13,6 s de la nativa son XCUITest consultando la pantalla. En un móvil, el tiempo de CPU
es batería y calor, y ahí es donde más se nota el port.

**La segunda, el empate.** Desplazarse por 349 fotos cuesta la misma CPU en las dos apps. Ese trabajo
es decodificar miniaturas dentro del framework Photos de Apple, y las dos apps llaman al mismo
framework. Así que lo nativo no lo hace *todo* más rápido. Lo que quita es el trabajo propio de la
app: arrancar, cargar un día, montar el listado y mover el visor.

### ¿En qué gasta la CPU React Native?

No he perfilado la app de React Native, así que esto sale de leer el código, no de medirlo. Para cargar
un día, la app de React Native le pide a `expo-media-library` los elementos de ese día en cada año
anterior, página a página, y los metadatos de cada página cruzan el puente de la arquitectura antigua
en JSON. Después, en iOS, llama a `getAssetInfoAsync` **una vez por foto** (de cinco en cinco) solo
para saber si es favorita, porque la llamada del listado no lo devuelve. Un año sin fotos en ese día
lanza además una búsqueda de reserva en una página de elementos recientes, que existe para las
importaciones del simulador. Por último, cada URI de miniatura va a `expo-image`, que vuelve a pedirla
a Photos.

La app nativa hace una sola llamada a `PHAsset.fetchAssets` por día, con una ventana de fechas por año
unidas con OR en el predicado. `isFavorite` viene con cada `PHAsset`, y las miniaturas salen
directamente de `PHCachingImageManager`. Parte de esa diferencia es de React Native en sí y parte es
de cómo lo usaba mi código. Instruments diría cuánto es cada cosa; eso no lo he hecho.

## Vídeos de los que te puedas fiar

Una tabla de números convence a los ingenieros. Todos los demás quieren *verlo*. Así que grabé las dos
apps haciendo un recorrido automático y las puse lado a lado, cada una con su cronómetro:

<video src="/images/ayer-native-swift/scene-1-first-launch.mp4" poster="/images/ayer-native-swift/poster-first-launch.jpg" autoplay loop muted playsinline width="540"></video>

*Primer arranque: pulsar "Permitir acceso completo" y esperar a la primera foto.*

<video src="/images/ayer-native-swift/scene-3-next-day.mp4" poster="/images/ayer-native-swift/poster-next-day.jpg" autoplay loop muted playsinline width="540"></video>

*"Día siguiente" cinco veces, esperando a las fotos de cada día.*

La grabación es `xcrun simctl io <udid> recordVideo`. El test apunta la hora del Mac al principio y al
final de cada escena (el simulador comparte el reloj del Mac), y ffmpeg recorta cada escena, apila
los dos móviles y añade una cabecera. Parecía cosa de una tarde. La primera versión se desviaba más de
dos segundos.

### Problema 1: simctl solo escribe un fotograma cuando cambia la pantalla

Si no se mueve nada durante cinco segundos, no hay fotograma en cinco segundos. Recortar en una marca
de tiempo y ponerla a cero (`setpts=PTS-STARTPTS`) toma el *siguiente cambio* como el instante cero,
así que todos los clips cuya pantalla estaba quieta en el corte empezaban tarde. La solución es
rellenar los huecos con el filtro `fps` de ffmpeg (repite el último fotograma) *antes* de recortar.

### Problema 2: el reloj de la grabación no es el del Mac

Incluso con fotogramas constantes, los cronómetros y las imágenes no cuadraban. Al alinear las
grabaciones con sucesos conocidos encontré tres problemas:

- **Arranques tardíos:** una grabación puede empezar más de un segundo después de que simctl diga
  "Recording started".
- **Parones:** mientras la app de React Native estaba ocupada arrancando, una grabación se paró y
  perdió 2,2 s.
- **Marcas de tiempo inestables:** con carga, las marcas de tiempo de los fotogramas bailan hasta un
  segundo, y algunas incluso van hacia atrás.

El truco que lo arregló fue meter un reloj dentro del vídeo. Mientras graba, el script cambia la hora
de la barra de estado del simulador con `simctl status_bar override` y apunta la hora del Mac de cada
cambio:

```python
def tick(self):
    i, gaps = 0, random.Random(7)
    while not self.done.wait(gaps.uniform(0.6, 1.6)):
        value = CLOCKS[i % 2]  # "1:11" or "8:88"
        subprocess.run(["xcrun", "simctl", "status_bar", self.udid, "override", "--time", value])
        self.ticks.append((time.time(), value))
        i += 1
```

Cada cambio es un cambio de pantalla, así que simctl escribe un fotograma unos 0,03 s después. Eso da
un punto de sincronización más o menos cada segundo: esta hora del Mac es este instante del vídeo.
Hay tres detalles que lo hacen funcionar:

- **Sin OCR.** "1:11" y "8:88" se distinguen contando los píxeles de la zona del reloj que se alejan
  mucho de su color mediano: unos 1.050 para "1:11" y unos 1.820 para "8:88". Funciona en la pantalla
  de inicio, sobre el fondo crema de la app y en las pantallas oscuras.
- **Intervalos irregulares.** Mi primera versión cambiaba exactamente cada segundo y alternaba dos
  valores, así que un desfase de −1,1 s y uno de +1,1 s encajaban igual de bien. Con intervalos
  aleatorios de 0,6 a 1,6 s, solo una alineación encaja con la secuencia. El algoritmo busca el desfase
  que mejor encaja con cada cambio y los cinco siguientes, así que sigue un parón de un par de segundos
  sin perderse.
- **Recolocar cada fotograma.** Los puntos de sincronización se convierten en una expresión `setpts`
  de ffmpeg lineal a trozos, que recoloca cada fotograma en la hora del Mac. Tiene una pinta así:
  `if(lt(T,12.31),(3.2+(T-11.5)*1.02),if(lt(T,…),…))`.
  Con eso, el cronómetro y la imagen de cada app coinciden con uno o dos fotogramas de diferencia.

En los vídeos finales el reloj parpadeante está difuminado. La cabecera (título de la escena, nombres
de las apps y cronómetros) la dibuja fotograma a fotograma una pequeña herramienta en Swift/AppKit,
porque mi ffmpeg de Homebrew no tiene filtro de texto.

Los vídeos enseñan la diferencia; no la miden. Cada uno es una sola ejecución, con el grabador de
pantalla usando CPU del Mac. Los números de verdad están en la tabla de arriba.

## El benchmark encontró fallos en mi port

Lo mejor: la fototeca de 21.000 fotos encontró problemas en la app *nativa* que la fototeca de
demostración no habría encontrado nunca.

**1. La primera carga se podía quedar atascada para siempre.** Cada aviso de cambios de Photos
reiniciaba la carga. Durante una importación, o mientras iCloud sincroniza una fototeca grande después
de instalar, los avisos no paran, así que la app enseñaba "Cargando recuerdos…" indefinidamente.
Ahora los cambios se agrupan y se deja terminar la carga que ya está en marcha:

```swift
private func libraryDidChange() {
  changeTask?.cancel()
  changeTask = Task {
    try? await Task.sleep(for: .milliseconds(800))
    guard !Task.isCancelled else { return }
    await loadTask?.value
    guard !Task.isCancelled else { return }
    clearCache()
    load(silent: true)
  }
}
```

**2. El visor guardaba en memoria la imagen a pantalla completa de todas las páginas.** Pasar 15 fotos
llegaba a 404 MB, *más* que la app de React Native. Ahora las páginas que están a más de un paso de la
visible sueltan su imagen, y el máximo bajó a 177 MB con la misma velocidad:

```swift
ForEach(Array(assets.enumerated()), id: \.element.id) { index, asset in
  page(asset, isNear: abs(index - activeIndex) <= 1)
}
```

**3. En una instalación nueva, el aviso de recordatorios tapaba la pantalla de permiso de Photos.** Lo
detectó el escenario de primer arranque: el test no llegaba al botón "Continuar" de la pantalla de
permiso. React Native solo enseña ese aviso después de conceder el acceso; ahora la nativa hace lo
mismo.

**4. Una ayuda para las capturas de la App Store, pensada solo para el simulador, se ejecutaba en las
builds Release.** Hacía una llamada a Photos por foto, hasta 500 fotos, en cada carga. Ahora solo
existe en Debug.

Sin el benchmark, los fallos 1 y 2 habrían llegado a los usuarios. Además son justo el tipo de fallo
que un agente no encuentra por su cuenta con una fototeca de demostración: el código era correcto,
simplemente no escalaba.

## Lo que un simulador no te puede decir

- **Los tiempos absolutos no son los de un iPhone.** La CPU de mi Mac es mucho más rápida que la de
  un móvil, así que fíjate en las proporciones.
- **La fluidez al desplazarse no se puede medir.** El simulador renderiza con la GPU del Mac, así que
  los tirones y los fotogramas perdidos necesitan un dispositivo real.
- **Las fototecas de iCloud con "Optimizar almacenamiento" no se pueden probar.** El simulador no
  tiene fototeca de iCloud, y en un móvil real las miniaturas que están solo en la nube lo cambian todo.
- **La app de React Native a veces dejaba de responder.** En 4 de 10 ejecuciones de "Día siguiente
  ×10", la app de React Native ignoró el primer toque durante más de 90 segundos después de arrancar.
  No se reproducía de forma fiable, así que de momento es una pista, no un resultado.

El mismo script funciona en un dispositivo: instala "Ayer Bench" junto a la app de la App Store,
ejecuta `tools/bench/run.sh <id-del-iphone> 2 5` y deja el móvil cargando una hora y media. Eso será
el siguiente artículo.

## Con qué me quedo

- **Mide antes de creértelo.** La mejora de CPU fue mayor de lo que esperaba y la del desplazamiento,
  cero. Habría apostado justo al revés.
- **Un benchmark también es una batería de tests.** Encontró dos fallos reales en mi port
  "terminado", y los dos solo aparecen con una fototeca grande.
- **Un agente puede portar una app, pero "terminado" tiene que ser algo que puedas comprobar.** Las
  traducciones generadas, los datos sacados del código original, las capturas de las dos apps y un
  benchmark hicieron más por la paridad de lo que habría hecho leer el código. El resto salió de usarla
  en mi propio móvil.
- **Haz la comparación justa antes de hacerla rápida.** Eso significa una build Release de React
  Native, orden alterno, pasadas de calentamiento y cronómetros que dejan fuera la preparación. Si no,
  estás midiendo el orden en que se ejecutaron tus tests.
- **Cuando no te puedas fiar de un reloj, mete uno en la imagen.**

Siguiente parada: ejecutarlo todo en mi iPhone con mi fototeca de verdad, y ver si el simulador decía
la verdad.
