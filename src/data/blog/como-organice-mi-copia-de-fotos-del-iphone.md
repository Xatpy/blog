---
title: "Cómo organicé una copia enorme de fotos del iPhone por año y mes"
description: "Un pequeño script para convertir un volcado caótico de Image Capture en un archivo cronológico, sin tocar los originales."
pubDatetime: 2026-07-13T10:00:00Z
tags: ["scripts", "photography", "backup"]
draft: false
---

Tenía un problema bastante normal, solo que a escala poco normal: muchos, muchos gigabytes de fotos y vídeos en el iPhone.

Quería una copia local en un disco duro externo. Sacarlos del teléfono fue fácil con Image Capture de macOS, pero la carpeta resultante estaba llena de nombres como `IMG_4829.HEIC` y `IMG_4830.MOV`. Eso es una copia, pero no una fototeca que apetezca navegar.

Así que hice un pequeño script en Bash que recorre ese volcado de forma recursiva y crea una segunda copia organizada.

## El resultado

Por defecto, cada archivo termina en una estructura de año y mes, con un nombre ordenable:

```text
Organized/
└── 2024/
    └── 08/
        └── 2024-08-17__14-32-09.jpg
```

El formato es intencionadamente aburrido: año, mes, día y hora. Así, navegar por carpetas y ordenar por nombre significa ordenar cronológicamente, tanto en Finder como en cualquier disco o equipo futuro.

## Qué fecha usa

La fecha de creación de un archivo no siempre dice cuándo se hizo la foto: puede haber sido copiado, exportado o restaurado años después. Por eso el script prioriza:

1. El metadato de captura de la foto o del vídeo.
2. La fecha de creación del archivo, si falta el metadato.
3. La fecha de última modificación, como último recurso.

Y si no encuentra ninguna fecha utilizable, tampoco abandona el archivo. Lo copia en la carpeta `undated` con su nombre original:

```text
undated/undated__original-file-name.ext
```

La carpeta de origen nunca se modifica ni se borra. Además, cada ejecución genera un CSV y un registro de errores, algo importante cuando estás procesando una fototeca grande y no quieres depender de la fe.

## Algunas decisiones de seguridad

Dos fotos pueden tener exactamente el mismo segundo de captura, sobre todo en ráfagas. Por defecto, el script conserva ambas:

```text
2024-08-17__14-32-09.jpg
2024-08-17__14-32-09_01.jpg
```

Existe `--overwrite-existing` si sustituir archivos es realmente lo que buscas, pero no es el comportamiento por defecto. En una copia de fotos, sobrescribir silenciosamente es una mala sorpresa.

El script procesa formatos habituales de foto, vídeo y RAW. También acepta `--all-files` para incluir cualquier archivo regular y `--flat` si prefieres dejar todo directamente en la carpeta de destino, sin la estructura año/mes.

## Cómo lo uso

Primero instalo [ExifTool](https://exiftool.org/):

```bash
brew install exiftool
```

Después hago siempre una simulación:

```bash
./organize-media-by-date.sh --dry-run "/Volumes/Backup/iPhone dump" "/Volumes/Backup/Organized"
```

Eso genera el informe sin copiar nada. Si el resultado tiene buena pinta, repito el mismo comando sin `--dry-run`.

El script está publicado como [Gist en GitHub](https://gist.github.com/Xatpy/ff79e52b953089a759ee470414902ce9).

No sustituye a una estrategia de copias de seguridad. Es una capa práctica encima de ella: una copia local, portátil y legible de los momentos que me importan, organizada por cuándo ocurrieron y no por el nombre arbitrario que les dio una aplicación.
