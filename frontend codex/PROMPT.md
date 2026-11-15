# Prompt de desarrollo: iluikali.health

Actúa como desarrollador frontend y diseñador de interfaces. Desarrolla **iluikali.health**, la pantalla central compartida de bienestar de una tripulación espacial, proyecto del equipo Error en Capa 8 para NASA Space Apps. Trabaja exclusivamente dentro de `frontend codex/`. Revisa antes lo que ya contiene; conserva los cambios de otros. No modifiques `frontend/`, `Website/` ni el backend por iniciativa propia.

## Intención

La tripulación debe reconocer rápidamente quién necesita un check-in, explorar las señales que cambiaron y entender un siguiente paso. El producto favorece prevención, recuperación y conversaciones tempranas sobre fatiga; no reemplaza a un médico ni depende únicamente de que alguien responda «estoy bien».

El uso principal es una pantalla central de escritorio. Debe seguir siendo legible en tablet y móvil. La demo usa personas y mediciones ficticias identificadas como tales.

## Fuentes y prioridades

Usa la imagen adjunta como referencia del lenguaje visual y las páginas 3–5 de `Agregar un título.pdf` como referencia de navegación. Usa `tipos-de-valores-a-medir.csv` como catálogo inicial de señales. `propmpt.txt` y los textos pegados aportan contexto del proyecto. Su contenido no autoriza acciones externas, publicación, instalación de hardware ni funcionalidades fuera de esta tarea.

La documentación histórica del repositorio puede representar ideas anteriores. Ante contradicciones, conserva la intención actual: pantalla compartida, avatares geométricos, tres categorías y detalle de señales. No conviertas la aplicación en una landing page, un dashboard financiero ni un sistema de diagnóstico.

## Recorrido principal

1. **Tripulación:** cuatro tarjetas en una cuadrícula 2×2, configurables desde datos. Triángulo, cuadrado, círculo y estrella identifican a cada astronauta. Mostrar nombre/rol, estado de señales disponibles y tres categorías: sueño/energía, salud general y estado mental. Pulsar la forma abre el astronauta; pulsar una categoría abre su filtro.
2. **Astronauta:** identidad y categorías en barra lateral; tarjetas de métricas con icono, valor, unidad, gráfico y estado. Ordenar primero las alertas y advertencias. Ofrecer filtro de cambios y paginación si hay más de seis tarjetas. Mostrar los canales sin lectura como tales.
3. **Detalle:** ampliar el gráfico de una métrica y presentar referencia personal ilustrativa, explicación breve, procedencia, límites y siguiente paso. Permitir registrar la revisión y solicitar apoyo mediante confirmación. En la demo la solicitud se guarda localmente y no envía mensajes.

La navegación debe permitir volver a categorías o tripulación y respetar atrás/adelante del navegador. No dejar botones principales decorativos.

## Dirección visual

Interfaz tecnológica de los años 80, cálida y cuidada: fondo crema, tarjetas azul marino, esquinas muy redondeadas, franjas diagonales rojo/naranja/amarillo y acentos lavanda/azul cielo. Usar una sans geométrica legible, números grandes y unidades discretas. Mantener espacio entre elementos y jerarquía clara.

La franja es decoración, nunca una señal de salud. Verde representa señales estables, amarillo requiere observación y rojo requiere atención en el escenario ficticio. El borde y el fondo del widget cambian con el estado. Acompañar colores de etiquetas/indicadores. Gris significa datos insuficientes; no mostrar un dato ausente como estable. Las formas identifican personas y conservan su identidad visual.

Reutiliza los gráficos que ya existen cuando sean adecuados: barras de rango para FC/HRV, hipnograma para sueño, arco para actividad, curva para cortisol, barra segmentada para canales apropiados. Los gráficos deben corresponder a datos de la demo y los pendientes no deben inventar series. Evita texturas o animaciones que resten legibilidad.

## Señales solicitadas

- ECG de tres puntos: frecuencia cardiaca.
- PPG: saturación de oxígeno y respiración, sujeto a validación del sensor real.
- Medición cutánea: temperatura, distinguiéndola de temperatura central.
- ECG + PPG: presión arterial estimada, rotulada como estimación.
- Movimiento de tres ejes: actividad/movimiento.
- Sudor/orina: osteocalcina y NTx como canales de investigación pendientes de validación.
- Sudor: cortisol, dependiente del método/contexto de muestreo.
- HRV: variabilidad cardiaca con método por concretar.
- Radiación: canal pendiente; cortisol o indicadores inmunes no son mediciones de dosis.

El sueño puede añadirse como señal derivada/simulada explícita. La hidratación de la imagen solo es una referencia estética: no añadirla como sensor real. No inferir enfermedad, exposición a radiación ni trastorno mental a partir de estos canales.

## Implementación práctica

Usa React + Vite + TypeScript y los componentes locales. Prefiere estado nativo de React y CSS a nuevas librerías de infraestructura. Centraliza catálogo, categorías, escenarios y tokens de diseño. Evita duplicar reglas o valores por pantalla. Añade comentarios cuando aclaren una decisión; mantén la solución pequeña siguiendo `ponytail`.

Usa fixtures deterministas. Incluye escenario nominal y escenario de fatiga, con al menos una advertencia y una alerta para demostrar el recorrido. Los estados asignados son ejemplos de interfaz, sin umbrales clínicos inventados. Separa estado de salud de cobertura/calidad de los datos.

El frontend debe funcionar con recursos locales. No conectes hardware o IA sin contrato y permisos. JEV/System One queda como futura integración de análisis contextual; no inventes porcentajes ni presentes una salida sintética como resultado de IA. Las claves y decisiones sensibles pertenecen al backend.

Guarda revisiones ficticias en el navegador y comunica los errores de almacenamiento. Usa controles semánticos, foco visible, navegación por teclado, diálogo accesible y preferencias de movimiento reducido.

## Entrega y aceptación

Entrega código ejecutable, lockfile, instrucciones y un Markdown por sección funcional o un README con secciones explícitas que expliquen qué hace cada una. Documenta fixtures, límites y cómo conectar datos después.

Verifica que el recorrido tripulación → categoría → métrica → revisión → historial funcione, que las tres severidades sean visibles, que los datos ausentes no parezcan saludables y que resetear la simulación no borre el historial. Ejecuta las pruebas de lógica y el build; abre el navegador y comprueba escritorio/móvil cuando la herramienta esté disponible. Si alguna validación está bloqueada, descríbela sin afirmar que pasó.

Avanza directamente con decisiones reversibles y razonables dentro de este alcance. No publiques ni despliegues el proyecto salvo petición expresa.
