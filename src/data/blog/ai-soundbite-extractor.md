---
title: "He publicado AI Soundbite Extractor: de un vídeo largo a clips de audio revisables"
description: "Una herramienta local para transcribir vídeos, proponer frases cortas y exportar solo los soundbites que tú apruebas."
pubDatetime: 2026-07-17T10:00:00Z
tags: ["ai", "audio", "python", "open-source"]
draft: true
---

Cuando quieres sacar sonidos de un vídeo largo para un soundboard, el trabajo no suele estar en exportar un MP3. Está antes: escuchar todo el vídeo, detectar las frases que merecen la pena, encontrar el principio y el final de cada una, y repetirlo muchas veces.

He publicado [AI Soundbite Extractor](https://github.com/Xatpy/ai-sounds-extractor) para quitar buena parte de ese trabajo repetitivo sin fingir que una máquina sabe mejor que tú qué frase merece guardarse.

Le das un vídeo local o una URL. La herramienta transcribe el audio, propone clips cortos, los deja preparados en una página de revisión local y tú decides cuáles sobreviven. Puedes escucharlos, recortarlos, combinarlos y exportarlos como MP3.

La idea importante es esta: no es un botón de “encuéntrame algo viral”. Es una herramienta de descubrimiento y revisión humana.

## El flujo completo

El uso más básico, con un vídeo local, es este:

```bash
.venv/bin/ai-soundbite-extractor --file "input/video.mp4" --language es
```

También acepta URLs compatibles con `yt-dlp`:

```bash
.venv/bin/ai-soundbite-extractor --url "https://www.youtube.com/watch?v=..." --language es
```

Al terminar, abre un `review.html` en el navegador. No hace falta levantar un servidor local ni crear una cuenta.

Dentro de esa página se puede:

- escuchar cada frase candidata;
- ordenar y filtrar los clips;
- ver su posición original en el vídeo;
- ajustar el inicio y el final en una forma de onda;
- descargar un clip individual o la versión recortada;
- unir varios clips y descargar un MP3 combinado;
- marcar cada clip como aprobado, rechazado o pendiente.

Cuando ya están decididos, la página descarga un pequeño JSON con las decisiones. Se aplica de vuelta al mismo procesamiento así:

```bash
.venv/bin/ai-soundbite-extractor \
  --run-dir ai-soundbite-extractor/runs/<run_id> \
  --apply-decisions ~/Downloads/ai-soundbite-extractor-decisions.json
```

Eso genera una carpeta `approved/` con solo los clips aprobados y actualiza un manifiesto local. No publica nada automáticamente en ninguna plataforma.

## Qué ocurre por dentro

El proyecto está hecho en Python y se ejecuta de forma local. La primera versión está preparada y probada especialmente para macOS con Apple Silicon, Python 3.11 y `ffmpeg`.

El pipeline es bastante deliberadamente simple:

1. Descarga el vídeo con `yt-dlp` o importa un archivo local.
2. Extrae una pista WAV mono a 16 kHz con `ffmpeg`.
3. Transcribe y alinea las palabras con WhisperX.
4. Agrupa palabras en frases usando silencios y límites naturales de la transcripción.
5. Descarta candidatos demasiado cortos, demasiado largos o que son solo muletillas configuradas.
6. Ajusta los bordes con la energía real del audio para reducir silencios al principio o al final.
7. Exporta los candidatos a MP3 y construye la interfaz de revisión estática.

La parte que más me interesaba no era la descarga ni la exportación: ambas ya tienen herramientas buenas. Era la segmentación. Un vídeo con una transcripción correcta sigue siendo incómodo si se convierte en un bloque enorme de texto o si cada frase corta a mitad de una palabra.

Por eso el programa conserva todos los artefactos intermedios: vídeo, audio, transcripción, segmentos, clips y datos de revisión. Si cambio una parte del proceso, no tiene por qué descargar ni transcribir todo otra vez. Y si solo quiero regenerar la interfaz de revisión, puedo hacerlo sin volver a procesar el vídeo.

```bash
.venv/bin/ai-soundbite-extractor \
  --run-dir ai-soundbite-extractor/runs/<run_id> \
  --review-only \
  --language es
```

## Lo que es IA y lo que no

Hay una distinción que me parece importante hacer explícita.

La transcripción y la alineación de palabras usan modelos de voz. Eso permite trabajar con tiempos de inicio y final muy concretos en vez de con párrafos aproximados.

En cambio, las etiquetas de emoción, los títulos, la detección de frases repetidas y la señal de prioridad son heurísticas locales y deterministas. Sirven para ordenar una lista larga, no para tomar decisiones editoriales. Una estrella o una etiqueta de “sorpresa” no hace que un clip sea bueno; simplemente puede ayudar a encontrar antes algo que conviene escuchar.

El programa nunca aprueba ni publica clips por sí solo. La revisión final siempre es humana.

## Local primero

No quería convertir esto en otro servicio donde subes un vídeo, esperas a que alguien lo procese y luego aceptas unas condiciones que no has leído. AI Soundbite Extractor no tiene servidor propio, no requiere cuenta y no usa APIs de pago en su recorrido normal.

Eso no significa que no haya red: descargar una URL, instalar dependencias o bajar pesos de modelos puede requerirla. Pero el procesamiento y los archivos de salida se quedan en tu equipo.

El proyecto usa por defecto el detector de actividad de voz Silero, que funciona localmente y no necesita token de Hugging Face. Hay una alternativa con Pyannote para comparar resultados, pero requiere sus condiciones y un token propio.

## Límites que no quiero esconder

Es un proyecto temprano, no una promesa de automatización perfecta.

- Música de fondo, ruido, conversaciones solapadas, acentos y transcripciones malas pueden dar límites pobres.
- Las plataformas cambian con frecuencia; la descarga por URL depende de `yt-dlp` y puede fallar.
- Instagram, X y otros sitios pueden requerir cookies o no funcionar en un momento concreto.
- No es una herramienta para decidir derechos de autor, consentimiento o cumplimiento de las reglas de una plataforma.

La responsabilidad de tener permiso para descargar, procesar, publicar o redistribuir un vídeo y sus clips sigue siendo de quien lo usa.

## Cómo probarlo

El repositorio es [open source bajo Apache-2.0](https://github.com/Xatpy/ai-sounds-extractor/blob/main/LICENSE). Para una instalación limpia en un Mac con Apple Silicon:

```bash
git clone https://github.com/Xatpy/ai-sounds-extractor.git
cd ai-sounds-extractor
brew install ffmpeg python@3.11
./scripts/setup_macos.sh
```

La primera transcripción tarda más porque tiene que preparar dependencias y modelos. Después, los artefactos de cada ejecución se reutilizan cuando es posible.

Me interesa especialmente saber dos cosas: si las frases propuestas se parecen a las que tú habrías extraído manualmente, y en qué momento del flujo todavía te obliga a hacer trabajo repetitivo. Si lo pruebas, puedes abrir un issue en el [repositorio](https://github.com/Xatpy/ai-sounds-extractor).
