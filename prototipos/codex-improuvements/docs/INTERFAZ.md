# Interfaz modular a pantalla completa

## Componentes y responsabilidades

`src/App.tsx` conecta el estado y la navegación. `Reading` comparte la estructura de widget entre el listado y el detalle: icono/título, estado, lectura/unidad, gráfico y procedencia/fecha. La UI no conoce el formato interno del CSV ni valida archivos por su cuenta: `data/readings.ts` normaliza la entrada y `logic/crew.ts` suscribe las vistas.

`components/Shape.tsx` identifica a las personas mediante figuras, sin nombres ni roles visibles. `components/Icon.tsx` mantiene una caja común de 24 unidades y un grosor uniforme. Las etiquetas de texto aclaran categorías y métricas; las figuras tienen nombres accesibles.

`components/Chart.tsx` representa series válidas. Para importaciones usa fechas reales en el eje temporal; no inventa seis horas de historia. Una sola lectura se presenta sin tendencia. Un total de horas de sueño importado no genera un hipnograma: faltan registros de etapas para ello. Las etapas y fases de la demo se identifican como sintéticas. Los medidores usan una sola tonalidad sin arco multicolor.

## Jerarquía y distribución

Fondo neutro oscuro y superficies planas. Verde, ámbar y rojo suave indican estados; el azul identifica selección. Los módulos no cambian de fondo ni muestran bordes de estado. Las posiciones permanecen iguales entre tripulantes. La retícula principal es 2×2, sin elemento superpuesto en el centro.

Toda la zona principal del módulo es un botón. Los tres botones de categorías son hermanos del botón principal, nunca controles anidados. El selector superior sustituye la columna derecha duplicada. Los widgets conservan su orden: recibir datos no cambia la categoría, el foco ni el orden del contenido.

El layout se compone con flex/grid sobre `100dvh` y safe areas. No escala un lienzo fijo. En escritorio/tablet horizontal muestra seis widgets en 3×2. En ventanas estrechas reorganiza columnas y permite desplazamiento. El detalle desplaza su contenido localmente cuando hace falta.

## Interacción

Respuesta al pulsar, objetivos de al menos 48 píxeles CSS en controles principales, foco visible y soporte de movimiento reducido, transparencia reducida y contraste alto. Se usa `dialog` nativo para Opciones y apoyo simulado; Escape y restauración de foco están disponibles. No se requiere hover para acceder a acciones.

La revisión y solicitud de apoyo solo generan confirmaciones durante esta sesión. No hay mensajes enviados ni integración médica. La información adicional se concentra en detalle; el inicio no incluye lemas, nombres, roles ni instrucciones redundantes.

## Comprobaciones

Capturas e inspección en Chromium a 1024×768, 1180×820, 1366×1024, 1920×1080, 820×1180 y 390×844. Las vistas de escritorio/tablet horizontal se comprobaron sin desbordamiento global; la versión estrecha conserva el contenido mediante reflujo y desplazamiento. El recorrido de importación desde archivo actualizó pulso a 72 y presentó `null` como ausencia de lectura, sin dibujar una gráfica falsa.

Se probaron navegación, revisión, apoyo simulado y ausencia de errores JavaScript. Esto no acredita tacto ni Safari en hardware iPad real. No se realizó una auditoría exhaustiva de lector de pantalla.

Referencia: [Apple HIG](https://developer.apple.com/design/human-interface-guidelines), especialmente layout, color, tipografía, botones, accesibilidad y gráficos. La documentación describe adaptación web; no implica una implementación nativa de iPadOS.
