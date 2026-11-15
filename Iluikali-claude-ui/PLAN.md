# Plan de rediseño estilo Apple — Iluikali

Referencia visual: captura del dashboard de dron (`../Captura de pantalla 2026-11-14 212905.png`). Se toman de ella la paleta y la estructura; las funciones de dron quedan fuera. Objetivo: una app de iPad a pantalla completa, fácil de leer, tranquila, con jerarquía clara, donde todo se pueda tocar y que acepte datos reales sin cambiar las pantallas.

Estado: ✅ implementado · ⏳ pendiente.

## Principios

1. Primero se lee, luego se decora: si un elemento no ayuda a entender el estado, se quita.
2. Un solo foco por pantalla: el color aparece solo cuando algo pide atención.
3. Los mismos módulos van en el mismo lugar, con la misma anatomía en todas sus variantes.
4. Todo el módulo es el botón, incluida la figura y el fondo.
5. Los datos llegan sin que la pantalla salte: entra una lectura, cambia ese valor y nada más se mueve.

## 1. Paleta ✅

| Token | Uso | Valor |
|---|---|---|
| `--bg` | Fondo | `#0B0B0D` |
| `--surface` | Módulos (capa base) | `#1C1C1E` |
| `--surface-2` | Controles (capa elevada) | `#2C2C2E` |
| `--label` / `--label-2` / `--label-3` | Texto principal, secundario y terciario | `#F5F5F7` / 62 % / 38 % |
| `--accent` | Selección y foco | `#64A8FF` |
| `--ok` / `--warn` / `--alert` | Estable / Observar / Atención | `#30D158` / `#FFD60A` / `#FF453A` |

Se eliminaron los degradados, las estrellas, las scanlines, la franja arcoíris, los halos, el pulso, los bordes de color y los fondos teñidos. El estado se muestra con un punto y su texto. El verde significa que algo está bien.

## 2. Tipografía ✅

Fuente del sistema (SF Pro en iPad) y números redondeados `tabular-nums`. Se eliminaron Audiowide y Outfit. Los títulos llevan espaciado negativo y el cuerpo va a 0.

## 3. Pantalla completa ✅

Se quitó el lienzo escalado de 1920×1080. El layout usa CSS Grid sobre el viewport completo con `safe-area-inset`, más `viewport-fit=cover`, un manifest `display: fullscreen` y un botón Fullscreen en el rail. Hay ajustes para orientación vertical y para anchos de 1000 y 700 px.

## 4. Barra rediseñada ✅

El rail lateral de 76 px (inicio, figuras con estado, pantalla completa, reloj) reemplaza al footer, a la columna derecha y al mosaico de mini tripulantes. Las categorías pasan a un control segmentado con un indicador que se desliza.

## 5. Módulos tocables ✅

En el inicio, cada módulo tiene un botón de fondo que lo cubre entero, y las categorías son botones hermanos (no hay un botón dentro de otro). La respuesta al presionar es inmediata. Las zonas tocables miden 44–56 px o más.

## 6. Tripulante y detalle ✅

Los widgets tienen anatomía fija y orden de catálogo; ya no se reordenan por gravedad. En el detalle, el valor y las gráficas son el foco, y al lado están Qué hacer, Qué mide, la estimación experimental y el contacto con tierra (botón plano que se llena al mantenerlo y confirma en una hoja modal).

## 7. Íconos y gráficas ✅

Hay una sola familia de íconos de contorno. Las figuras están centradas ópticamente. Las gráficas se dibujan al tamaño medido, con márgenes comunes; la línea se corta si falta una muestra y hay un estado *Sin lecturas*. El arco de nivel sustituye al gauge segmentado de los años 80.

## 8. Datos en tiempo real ⏳

- `DataSource` debe recibir lecturas `{astroId, metricId, value|null, unit, capturedAt, source, quality, synthetic}` en lugar de un `tick`.
- Cada métrica declara su tipo: puntual, sesión (sueño), acumulado, laboratorio o derivado. El reloj no debe hacer avanzar el sueño.
- Adaptadores intercambiables: demo, luego CSV validado y luego API o WebSocket. Estados visibles: cargando, sin lectura, dato antiguo, desconectado y error.

La UI ya está lista para esto: el widget muestra la hora de la lectura, la gráfica tolera huecos y `fmtValue` muestra «—» cuando no hay valor.

## 9. Validación

- ✅ `tsc --noEmit`, renderizado de las tres pantallas y de todas las gráficas sin `NaN`.
- ⏳ Revisión visual a 1024×768, 1180×820, 1366×1024 y 1920×1080, en horizontal y en vertical.
- ⏳ Prueba física en iPad: tacto, orientación y pantalla completa desde la pantalla de inicio.

Fuentes: Apple Human Interface Guidelines, capítulos [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode), [Color](https://developer.apple.com/design/human-interface-guidelines/color), [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [Going full screen](https://developer.apple.com/design/human-interface-guidelines/going-full-screen) y [Charts](https://developer.apple.com/design/human-interface-guidelines/charts).
