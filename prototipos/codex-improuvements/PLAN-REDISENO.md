# Plan de rediseño: iluikali-ui

Estado: propuesta para revisión; no implementada. Fecha: 14 de noviembre de 2026.

## Objetivo y alcance

Usar `iluikali-ui/` como base del recorrido tripulación → categoría → métrica. Pantalla completa táctil, con prioridad a iPad horizontal y pantalla central. Abandonar la estética retro. Las capturas son referencias de problemas y dirección visual, no instrucciones para añadir funciones de drones o del Centro de control.

## Hallazgos del código

- `components/parts.tsx`: Stage escala un lienzo fijo de 1920×1080. Ocupar la ventana requiere composición adaptable, no agrandar el mismo lienzo.
- `screens/Home.tsx` y `styles.css`: los cuadrantes inferiores invierten su estructura; nombres cambian de lado; solo la figura tiene el acceso principal. El círculo central se superpone a la retícula.
- `screens/Astronaut.tsx`: la columna derecha repite identidad y navegación, además de listar señales ya presentes. La selección implícita de categoría y el orden por gravedad dependen de datos cambiantes.
- `logic/store.ts`: cada 1,5 segundos avanza diez minutos simulados. No representa un reloj de adquisición real.
- `data/types.ts`: ya existe DataSource, pero depende del tick y carece de fecha de captura, calidad, procedencia y ausencia de lectura. Reutilizar esta separación, sin construir otro sistema paralelo.
- `components/Chart.tsx`: tamaños explícitos y márgenes distintos entre miniatura y detalle. Necesita tratamiento de series vacías, una sola muestra y datos inválidos antes de conectarse a una fuente externa.

## 1. Estructura a pantalla completa

- Sustituir el escalado global por una composición que ocupe el viewport dinámico y respete safe areas.
- Inicio: cabecera discreta y cuatro módulos iguales en retícula 2×2. Figura, estado y categorías siempre en las mismas posiciones. Sin nombres de astronautas, roles ni subtítulos redundantes. Eliminar círculo central, franjas, estrellas decorativas y scanlines; conservar la estrella que identifica a un tripulante.
- Sin scroll global en el inicio para los tamaños objetivo. En detalle, permitir desplazamiento local para contenido largo y texto ampliado, sin recortar información ni reducir todas las fuentes.
- Probar 1024×768, 1180×820, 1366×1024 y 1920×1080. En vertical, recomponer según el espacio disponible; no añadir bandas negras para mantener 16:9.
- Diferenciar ocupar toda la ventana de ocultar la interfaz del navegador. La entrada a fullscreen debe ser una acción explícita donde exista soporte; comprobar también Safari y modo instalado en un iPad real.

## 2. Sistema visual

Paleta inicial propuesta, sujeta a pruebas de contraste:

| Función | Color |
|---|---|
| Fondo | #111214 |
| Módulos | #1C1D20 |
| Controles / selección secundaria | #292B30 |
| Texto principal | #F5F5F7 |
| Texto secundario | #A8ABB3 |
| Navegación seleccionada | #83B9FF |
| Estable | #70C49A |
| Observar | #D8B468 |
| Atención | #E58C86 |
| Sin datos | Gris con etiqueta explícita |

Superficies planas; sin degradados decorativos, halos ni bordes de estado. El color semántico aparece en el símbolo y una etiqueta breve. Verde significa señales disponibles estables; no certifica salud ni convierte ausencia de datos en normalidad. Azul identifica selección, independientemente del estado.

Tipografía del sistema, sin Audiowide. Escala inicial web: 17–18 px para lectura, 14–15 px para información auxiliar y 36–48 px para valores principales. Estas cifras son decisiones del prototipo, no equivalencias automáticas de puntos nativos. Espaciado consistente y radios de 16–24 px según el tamaño del módulo.

## 3. Módulos táctiles coherentes

- Toda el área principal de cada tripulante, incluida figura y fondo, abre su perfil.
- Sueño, Salud y Mente son tres botones independientes con icono, nombre y estado. No anidar botones dentro de otro botón.
- Objetivos táctiles web de al menos 48×48 CSS px, sin depender del tamaño de un lienzo escalado.
- Respuesta visual desde pointer-down, confirmación al soltar y posibilidad de cancelar al salir. Ninguna función depende de hover.
- Mantener triángulo, cuadrado, círculo y estrella como identificadores principales, con posición y tamaño óptico consistentes. Conservar identificadores internos estables para asociar los datos; las etiquetas accesibles describen la figura sin mostrar nombres personales.

### Contenido autoexplicativo

- Eliminar nombres personales y roles de tarjetas, selectores, cabeceras y detalle.
- Eliminar lemas, explicaciones de cómo navegar y subtítulos que repitan el título o la selección actual.
- Conservar etiquetas cortas de categorías, nombres de métricas, valores, unidades y estados. La simplicidad no debe obligar a adivinar qué mide un icono.
- Mostrar hora, periodo y procedencia donde expliquen la lectura; ampliar información solo en detalle. Mantener explícitos los datos simulados y la ausencia de lecturas.
- Evitar repetir la figura seleccionada en varios paneles. Una única indicación persistente identifica al tripulante consultado.

## 4. Replantear navegación y columna derecha

- Una cabecera compartida: volver, figura seleccionada, fuente/actualización y acceso secundario a opciones.
- Sustituir el mosaico de mini-tripulantes por un selector compacto de figuras, sin nombres ni roles. Cambiar de persona conserva la categoría consultada.
- Mantener una única navegación de categorías a la izquierda, con iconos y texto; en espacios estrechos, convertirla en control horizontal.
- Retirar la tarjeta grande de identidad y la lista repetida de señales de la derecha. Recuperar ese espacio para los indicadores.
- Los avisos se resumen con una acción explícita «Ver cambios». No cambian por sí solos la pantalla ni desplazan widgets mientras se consulta.
- Orden fijo de indicadores dentro de cada categoría. Filtrar u ordenar por atención solo mediante una acción de la persona.

## 5. Widgets, gráficas y detalle

Un Widget compartido con posiciones fijas: icono+título, estado, valor+unidad, gráfica y última lectura. Misma altura y mismos márgenes para módulos equivalentes.

Usar una sola familia de iconos web consistente. Luna para sueño, corazón/pulso para salud, cerebro para mente; acompañarlos con texto. Normalizar caja de 24×24, grosor y alineación óptica. SF Symbols aporta la referencia de consistencia; no suponer que es una fuente web universal.

Gráficas con área de trazado y márgenes comunes, ejes legibles y colores contenidos. Líneas para tendencias, hipnograma para sueño y medidores solo cuando la escala tenga significado. Reservar el verde para estado, sin colorear toda la serie como saludable. Mostrar unidades y tiempos reales; no inventar continuidad donde faltan muestras.

Detalle: lectura y evolución como foco principal; debajo o al lado, explicación, contexto y siguiente paso. Selector temporal que filtre datos disponibles, inspección táctil de muestras y acceso claro a volver. Contexto científico, inferencia local y medición se distinguen. AFI y porcentajes predictivos no encabezan la vista sin explicar origen y carácter experimental.

## 6. Preparación para cargar datos

**Requisito confirmado:** el reloj no hace avanzar todos los indicadores. El sueño, por ejemplo, conserva la última sesión completada y solo cambia al recibir otra sesión o una corrección explícita.

| Comportamiento | Ejemplos | Disparador de actualización |
|---|---|---|
| Lectura puntual | Pulso, temperatura | Nueva lectura válida de esa fuente |
| Registro de sesión | Sueño, ejercicio completado | Nueva sesión o revisión identificada del mismo registro |
| Acumulado | Exposición acumulada | Nueva contribución válida, sin contar dos veces el mismo evento |
| Resultado puntual | Laboratorio | Nuevo resultado validado o corrección |
| Derivado | Resumen calculado | Cambio de sus entradas pertinentes |

La definición de cada métrica declara su comportamiento y criterio de antigüedad. No tener datos nuevos de sueño durante el día no significa desconexión: mostrar «Última noche» y fecha de la sesión. Distinguir fecha de captura, periodo medido y fecha de recepción. No fabricar lecturas al repintar una gráfica.

La entrada común permite cargar una lectura, un lote o una sesión con identificador estable; las correcciones reemplazan su revisión anterior. La UI consume el resultado normalizado, independientemente de si procede de un archivo o una API. El prototipo empezará con datos de ejemplo que permitan comprobar este recorrido sin backend.

Evolucionar DataSource existente: catálogo separado de lecturas; lecturas con identificador de tripulante/métrica, valor nullable, unidad, capturedAt, fuente, calidad y marca sintética. Mantener separados estado de salud orientativo, disponibilidad del dato y estado de conexión.

- Adaptador de demo primero; CSV con validación de todas las columnas, unidades y fechas después; adaptador API cuando exista contrato real.
- Una lectura nueva actualiza la métrica afectada. Su fecha determina frescura; el reloj de demo no decide que un dato es reciente.
- Ritmo de presentación configurable por fuente y métrica. Durante exploración histórica, mantener la ventana consultada y ofrecer «Volver a últimas lecturas».
- Sin cambio de categoría, orden, escala o foco inesperado en cada actualización. Cambios de estado persistentes, sin parpadeos continuos.
- Estados visibles: cargando, sin lectura, dato antiguo, desconectado y error. Conservar la última lectura válida con su hora; no rellenar silenciosamente con datos sintéticos.
- Separar los controles de simulación del funcionamiento habitual y rotular la demo antes de cualquier acción de apoyo. No afirmar envío real.

## 7. Secuencia de implementación y aceptación

1. **Estructura:** shell adaptable y Home 2×2 sin hub. Aceptación: cuatro módulos consistentes, sin recortes, fondo principal táctil.
2. **Componentes:** tokens, iconos, categorías y Widget compartido. Aceptación: misma posición de cada elemento en todas las variantes, sin bordes de estado.
3. **Navegación y detalle:** selector compacto, categorías persistentes y una gráfica principal. Aceptación: recorrido completo con volver, teclado y toque; sin duplicación de identidad ni navegación automática inesperada.
4. **Datos:** contrato de lecturas y demo determinista con casos de ausencia, error, desconexión y antigüedad. Aceptación: sustituir la fuente no requiere modificar pantallas; avanzar el reloj no cambia el sueño; recibir una nueva sesión actualiza únicamente sus datos y los derivados pertinentes; importar un evento repetido no duplica acumulados.
5. **Validación:** pruebas de navegador con tamaños objetivo, datos rápidos/lentos/ausentes, texto ampliado y movimiento reducido. Verificación física de tacto, orientación y pantalla completa en iPad antes de afirmar soporte comprobado.

Documentar cada sección implementada y sus límites en Markdown. No ampliar ahora el alcance a backend, hardware, diagnóstico o IA remota.

## Fuentes de diseño

Se revisaron el índice HIG y los capítulos pertinentes a este recorrido; esto no equivale a una auditoría exhaustiva de toda la documentación de Apple.

- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- [iPadOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados)
- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)
- [Charts](https://developer.apple.com/design/human-interface-guidelines/charts)
- [SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)
