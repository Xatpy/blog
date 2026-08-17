---
title: "Programar una app desde el móvil, hablando con Codex"
description: "Un pequeño script para compilar, instalar y abrir una app iOS en mi iPhone sin tener que volver al ordenador."
pubDatetime: 2026-08-17T14:00:00Z
tags: ["ai", "scripts", "writing"]
draft: false
ogImage: "https://blog.jaimechapinal.com/images/programar-con-codex-por-voz.png"
---

![Ilustración de una persona enviando una nota de voz a Codex desde el iPhone mientras el Mac trabaja al fondo.](/images/programar-con-codex-por-voz.png)

Últimamente estoy desarrollando apps iOS de una forma que todavía me parece un poco mágica.

El ordenador puede estar en otra habitación, o yo puedo estar fuera de casa. Desde el móvil le mando una nota de voz a Codex:

> Haz este botón más grande, revisa que no rompa nada y vuelve a desplegar la app.

Codex hace el cambio y, cuando termina, compila la aplicación, la instala en mi iPhone y la abre.

No tengo que escribir el mensaje en el móvil. Tampoco tengo que volver al Mac, abrir Xcode, elegir el dispositivo y pulsar Run. Hablo, espero un poco y pruebo el resultado directamente en el teléfono.

No es que haya sustituido programar en el ordenador por completo. Para leer código largo, revisar una interfaz con calma o hacer cambios complejos, el Mac sigue siendo mucho más cómodo. Pero para iterar sobre algo que ya tengo en marcha, poder dirigir el siguiente cambio con la voz es sorprendentemente útil.

## El pequeño script que cierra el ciclo

La última parte del flujo es este script de Bash. Lo tengo dentro de cada proyecto nativo que lo necesita:

```sh
./scripts/deploy-to-iphone.sh
```

Por debajo no hay demasiada magia. Hace cuatro cosas:

1. Busca un iPhone conectado y autorizado.
2. Compila una build `Debug` para ese dispositivo.
3. Instala la aplicación.
4. Cierra la versión anterior y abre la nueva.

Este es el script completo:

```bash
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

Solo hay que cambiar tres valores al principio: el proyecto de Xcode, el esquema y el identificador de paquete. El script usa `xcodebuild` para compilar y `xcrun devicectl` para instalar y arrancar la aplicación. Son herramientas estándar de Apple; el script simplemente reúne los pasos que haría manualmente.

Si hay varios iPhone disponibles, no escoge uno al azar: muestra los identificadores y pide ejecutar, por ejemplo:

```sh
DEVICE_ID=00008120-0012345678901234 ./scripts/deploy-to-iphone.sh
```

## Por qué me resulta tan útil

El simulador de iOS es muy bueno, pero hay cosas que necesitan un teléfono de verdad: cámara, micrófono, permisos, audio, rendimiento, almacenamiento local o CarPlay. En esos casos, el iPhone deja de ser solo el sitio donde se comprueba el resultado final. Pasa a ser parte del entorno de desarrollo.

La parte interesante no es ahorrar unos clics. Es que el ciclo completo se hace muy corto:

```text
Lo digo en voz alta → Codex lo implementa → la app aparece en mi iPhone → lo pruebo
```

Esto requiere que el Mac donde trabaja Codex pueda acceder al iPhone, ya sea por cable o mediante una conexión de desarrollo ya emparejada. También necesita que el teléfono esté desbloqueado y autorizado. No funciona como una distribución remota de apps a cualquier dispositivo.

Y tampoco sustituye TestFlight ni la App Store. Es una build de desarrollo instalada en mi propio iPhone. Para compartir una beta con otra persona o publicar una versión, sigue haciendo falta el proceso normal de distribución.

Pero para el trabajo diario me está cambiando bastante la sensación. El móvil ya no es solo donde uso o pruebo la app. A veces es también el lugar desde el que le explico, con mi propia voz, cuál debería ser el siguiente cambio.
