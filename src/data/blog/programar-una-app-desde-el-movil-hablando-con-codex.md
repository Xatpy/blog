---
title: "He programado una app desde el coche, hablando con Codex"
description: "Un vídeo de dos minutos para explicar una cosa que todavía me parece bastante absurda: dictar cambios para una app y probarlos directamente en CarPlay."
pubDatetime: 2026-08-17T14:00:00Z
modDatetime: 2026-08-17T14:00:00Z
tags: ["ai", "scripts", "writing"]
draft: false
ogImage: "https://blog.jaimechapinal.com/images/programar-con-codex-por-voz.png"
---

![Ilustración de una persona enviando una nota de voz a Codex desde el iPhone mientras el Mac trabaja al fondo.](/images/programar-con-codex-por-voz.png)

He grabado un vídeo de dos minutos desde el coche que resume bastante bien cómo estoy programando algunas apps estos días.

Con el coche parado, estoy conectado al Mac por Wi‑Fi. El ordenador está en la habitación de al lado. Hablo con Codex desde el móvil y le digo qué quiero cambiar en una app de CarPlay.

Codex hace el cambio, compila la app, la instala y la abre de nuevo. Yo puedo probarla directamente en la pantalla del coche.

La app es [Ireneo](https://apps.apple.com/us/app/ireneo/id6798789699), que ya está publicada. Sirve para capturar una idea hablada desde el iPhone o CarPlay, sin tener que ponerte a escribir ni sacar el móvil.

No estoy diciendo que ahora programe sin ordenador. El ordenador está trabajando de fondo y sigue siendo donde tiene sentido leer código, revisar algo complejo o diseñar una interfaz con calma. Pero no necesito estar delante de él para cada pequeña iteración.

La parte que todavía me parece un poco absurda es esta:

```text
Lo digo en voz alta → Codex lo implementa → se despliega en el coche → lo pruebo
```

Para una app normal de iPhone ya era cómodo. Para CarPlay es especialmente interesante, porque hay muchas cosas que solo entiendes bien en el coche y en la pantalla real: la jerarquía visual, el flujo de interacción, el contexto o si algo distrae más de la cuenta. El simulador ayuda, pero no te cuenta toda la historia.

## El script que lo hace posible

El último tramo lo resuelve un pequeño script. Busca el iPhone conectado, compila una build de desarrollo, instala la app y la abre. En CarPlay, al volver a abrirse la app del iPhone, la nueva versión queda disponible también en la pantalla del coche.

No sustituye TestFlight ni la App Store, y tampoco permite desplegar en cualquier iPhone desde cualquier sitio. El Mac tiene que poder hablar con el teléfono, que debe estar autorizado y conectado por cable o por una conexión de desarrollo ya emparejada. Pero para iterar sobre una app propia, quita mucha fricción.

<details>
<summary>Ver el script completo</summary>

```sh
#!/bin/bash
# Compila, instala y abre una app en un iPhone conectado.
# Uso opcional: DEVICE_ID=<identificador> ./scripts/deploy-to-iphone.sh
set -euo pipefail

PROJECT="MiApp.xcodeproj"
SCHEME="MiApp"
BUNDLE_ID="com.ejemplo.miapp"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-$PWD/.build/iphone}"

if [[ ! -d "$PROJECT" ]]; then
  echo "Ejecuta este script desde la raíz del repositorio." >&2
  exit 1
fi

if [[ -z "${DEVICE_ID:-}" ]]; then
  DEVICE_ID="$({ xcrun devicectl list devices 2>/dev/null || true; } | awk 'NR > 2 && ($4 == "connected" || $4 == "available") { print $3 }')"
fi

if [[ -z "$DEVICE_ID" ]]; then
  echo "No encuentro ningún iPhone conectado. Conéctalo, desbloquéalo y autoriza este Mac." >&2
  exit 1
fi

if [[ "$(printf '%s\n' "$DEVICE_ID" | wc -l | tr -d ' ')" -ne 1 ]]; then
  echo "Hay más de un dispositivo disponible. Elige uno explícitamente:" >&2
  printf '%s\n' "$DEVICE_ID" >&2
  echo "Ejemplo: DEVICE_ID=<identificador> $0" >&2
  exit 1
fi

echo "Compilando para ${DEVICE_ID}…"
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination "platform=iOS,id=$DEVICE_ID" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  build

APP_PATH="$DERIVED_DATA_PATH/Build/Products/Debug-iphoneos/$SCHEME.app"

if [[ ! -d "$APP_PATH" ]]; then
  echo "La compilación terminó, pero no encuentro la app en $APP_PATH" >&2
  exit 1
fi

echo "Instalando…"
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"

echo "Abriendo la app…"
xcrun devicectl device process launch \
  --device "$DEVICE_ID" \
  --terminate-existing \
  "$BUNDLE_ID"

echo "Listo."
```

</details>

Solo hay que adaptar el proyecto de Xcode, el esquema y el identificador de paquete. Por debajo usa `xcodebuild` y `xcrun devicectl`, herramientas estándar de Apple.

El móvil ya no es solo donde uso o pruebo una app. A veces es también donde le explico, con mi propia voz, cuál debería ser el siguiente cambio.
