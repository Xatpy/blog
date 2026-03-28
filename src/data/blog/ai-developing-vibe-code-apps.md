---
title: 'Cómo construyo apps con IA: mi método real'
description: 'Desde diciembre de 2025, el rol de programador mutó por completo. Este es mi método real para construir apps con IA sin tocar el IDE.'
pubDatetime: 2026-03-28T18:30:00Z
tags: ['IA', 'desarrollo', 'workflow', 'indie']
---

Siempre me ha gustado hacer apps y quería hablar un poco sobre mi experiencia construyendo estas últimas aplicaciones.

Lo primero es que considero que, desde diciembre de 2025, mi estudio de software cambió completamente. Y creo que en general el rol de programador, si no está extinto como tal, sí que ha mutado por completo. En mi caso, yo me sigo considerando programador, pero creo que el trabajo ha cambiado muchísimo y que nos tenemos que reinventar. Para mí ha sido una revolución total.

Yo, para no quedarme fuera, he intentado seguir un poco esa ola haciendo varios proyectillos en mi tiempo libre, sobre todo para usar la inteligencia artificial de verdad y ver hasta dónde se podía llegar con ella. El objetivo principal que me planteé era bastante claro: poder hacer aplicaciones sin tener que abrir el IDE para ponerme yo a tirar líneas de código una a una. No porque no sepa o no quiera programar, sino porque quería comprobar si de verdad había cambiado ya la forma de construir software.

Y a raíz de eso estuve haciendo varias aplicaciones.

Me gustaría hablar un poco de esas aplicaciones, de cómo hemos funcionado y de cuál ha sido mi modo de trabajo. Porque al final, más que una herramienta concreta, lo interesante para mí está siendo la forma en la que organizo todo el proceso.

## Las herramientas

Diría que utilizo tres o cuatro herramientas principales: ChatGPT, Google, Anthropic Claude y Grok. En realidad, de pago solo utilizo ChatGPT y la suite de Google, el Google AI Plus. De Anthropic utilizo sobre todo la opción gratuita, más que nada para refinar ideas y prompts, pero no uso Claude Code, que es justo lo que está más de moda. Y Grok lo uso más para marketing y para temas de producto, no tanto para programar.

En cuanto a programar, sobre todo uso Codex de ChatGPT. Considero que funciona bastante bien. No es necesariamente el más rápido, pero sí hace las cosas bastante bien. Y luego también uso mucho Gemini 2.5 Pro. De hecho, una parte importante de mi flujo la hago a través de Antigravity, que aunque sea un IDE, realmente yo no lo uso como el IDE tradicional de sentarme a tocar línea a línea, sino más bien como un chatbot o un agente que puede tirar de modelos como Gemini 2.5 Pro y Claude cuando tengo tokens, aunque yo creo que da bastante pocos.

## El método: cruzar agentes

Mi modo de trabajo, básicamente, consiste en poner unos agentes delante de otros, como si estuviera sentando varias IAs en una mesa y haciéndolas discutir entre ellas, mientras yo estoy en medio organizando un poco el cotarro.

Por ejemplo, para empezar a definir una funcionalidad o simplemente aterrizar una idea de lo que quiero que haga la aplicación, lo que suelo hacer es hablar por voz con ChatGPT. Suelto el brainstorming tal cual se me ocurre, de forma bastante caótica, y dejo que me lo transcriba y me lo convierta en un resumen o en un documento algo más detallado. Ese primer paso me resulta comodísimo porque me permite pensar hablando, que es como más rápido saco las ideas.

Con ese texto ya generado, me voy a otra IA. Muchas veces me voy a Claude, normalmente a la versión web, y le digo algo como: mira, tengo esta idea, ¿qué te parece? Lo que busco ahí no es tanto que me diga que sí a todo, sino que me la rebata un poco, que me encuentre agujeros, que me diga dónde ve problemas o incoherencias. Cuando me devuelve su opinión, cojo eso y me voy a otra IA, por ejemplo Grok o Gemini, y les vuelvo a preguntar qué les parece.

Entonces se genera un pequeño ciclo bastante curioso: una IA me da una idea más ordenada, otra me la critica, otra me aporta otra visión, y luego vuelvo con todo eso a ChatGPT y le digo: vale, con todo esto encima de la mesa, ¿qué te parece ahora? Algunas cosas coinciden, otras no, y yo voy actuando un poco de filtro. Intento balancear lo que dice cada una y decidir qué tiene sentido y qué no.

## Del plan al MVP

Cuando ya tengo una idea más o menos clara de lo que quiero construir, el siguiente paso es pedir un plan detallado. En ese momento les digo básicamente: vale, ahora hazme un plan detallado de todo lo que vamos a construir. Y con ese plan vuelvo a hacer exactamente lo mismo: me voy pasando por otras IAs para que lo revisen, lo cuestionen o lo mejoren. Es decir, no me quedo nunca con la primera respuesta de una sola herramienta. Intento que haya varios ciclos de contraste.

Una vez tengo ese plan, ya sí toca meterse con el MVP. Ahí les pido que, basándose en ese plan, me generen el MVP y me lo implementen. Esto lo hago muchas veces con Codex, aunque depende del momento y del tipo de tarea. A veces también tiro de Gemini 2.5 Pro. Cuando uno de ellos me implementa una primera versión, muchas veces me voy a otro agente de código y le pido una especie de code review de lo que acaba de hacer el primero.

Eso me gusta bastante porque muchas veces detectan problemas, inconsistencias o cosas mal planteadas. Con esos comentarios vuelvo al otro y le digo: mira, me han dicho esto, ¿qué te parece? A veces lo arregla todo sin problema y otras veces hace un poco de pushback y me dice que no está de acuerdo en algunas cosas. Y ahí otra vez entro yo a decidir y a conducir un poco el proceso.

## El diseño

En paralelo a todo eso, para el diseño uso mucho Google Stitch. Cuando ya tengo más o menos claro qué quiero que haga la aplicación, le paso el documento de definición y le digo que me genere un diseño para esa app. Normalmente el primer diseño nunca está del todo afinado. De hecho, suele inventarse features, componentes o ideas que realmente no quiero. Pero me sirve muchísimo para aterrizar visualmente el producto, porque me da una primera base sobre la que reaccionar.

A partir de ahí empiezo a modificar bastante. Le cambio componentes, le ajusto la interfaz, elimino cosas inventadas, y voy llevando ese diseño un poco a tierra. Cuando ya tengo algo que me convence más, hago capturas de pantalla del diseño y se las paso al agente de código. Y entonces le digo: quiero que me implementes esto.

Y ahí empieza otro ciclo parecido al anterior. Un agente implementa, otro revisa, otro opina, otro sugiere cambios, y yo voy filtrando. Cuando veo que algo ya está más o menos validado y que la dirección es correcta, hago commit.

## Commits frecuentes y el worklog

Esto para mí es bastante importante: hago commits a menudo. Mucho más a menudo de lo que haría quizá en otro contexto. Porque en todos estos ciclos no siempre va bien. Muchas veces los agentes empiezan a liarse, se meten por una rama rarísima o se empeñan en una solución que no merece la pena seguir. Y en esos casos es importantísimo poder volver atrás rápido sin drama.

Otra cosa que utilizo muchísimo es pedirles que escriban siempre en un fichero Markdown llamado `worklog`. Ahí van anotando cuál es el proceso de todo lo que estamos haciendo: qué se ha intentado, qué se ha cambiado, qué problemas han salido, qué decisiones se han tomado. Para mí esto es clave, sobre todo para tener un histórico del proyecto y también porque ese documento sirve luego como contexto para otras IAs.

Es decir, no solo generan código. También van escribiendo este histórico en Markdown, y eso luego me permite coger a otra IA nueva, pasarle el `worklog` y ponerla al día muy rápido. Me parece una manera muy buena de mantener continuidad en el proyecto sin depender de una sola conversación o de una sola herramienta.

Y así, poco a poco, vamos iterando hasta tener el producto final.

## El cambio más grande

Ahora mismo, esa es la forma en la que yo trabajo con la IA para construir estas aplicaciones. No diría que yo he dejado de programar, pero sí diría que el trabajo ya no consiste principalmente en escribir código línea a línea. Se parece más a dirigir, revisar, contrastar, ordenar ideas, tomar decisiones y saber cómo hacer que varias herramientas trabajen juntas de una forma útil.

Para mí, ese es probablemente el cambio más grande de todos.

No escribo código. Dirijo agentes.