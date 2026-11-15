# Frontend: diseño retro y navegación

Implementado en `frontend codex/`. La presentación y las imágenes adjuntas son referencias visuales y de recorrido; sus propuestas científicas o futuras integraciones no se interpretan como instrucciones para conectar servicios.

## Recorrido

- **Tripulación:** cuatro cuadrantes identificados con triángulo, cuadrado, círculo y estrella. Cada tarjeta muestra estados de categorías y lecturas sintéticas de pulso/sueño; las lecturas abren directamente su detalle. El total se deriva de `CREW`.
- **Astronauta:** categorías laterales, seis indicadores por página, orden por atención y filtro de cambios. Las lecturas pendientes permanecen explícitas. En móvil, las categorías se distribuyen en dos filas para que todas sean visibles.
- **Detalle:** gráfica ampliada, explicación, referencia ilustrativa, contexto NASA, revisión y solicitud de apoyo simulada. El historial persiste localmente. No se envían mensajes ni datos a terceros.

## Apariencia

La paleta se concentra en `src/styles.css`: papel crema `#f0e7d6`, instrumentos marino `#20283e`, tinta crema `#fff0d6`, naranja, amarillo, lavanda y azul cielo. Las franjas diagonales y los pequeños píxeles citan las referencias de los widgets y el póster Flow. Son decoración fija: el borde, el texto y la insignia comunican el estado de las señales.

`src/components.tsx` comparte la construcción de los widgets. Cortisol usa curva de área; pulso y HRV, barras de rango; sueño, hipnograma; temperatura, dial de variación relativa; oxígeno, segmentos; movimiento, medidor en arco. Los canales sin lectura muestran un estado vacío, sin gráfica inventada. Véase [WIDGETS.md](WIDGETS.md).

## Interacción y adaptación

Se aplican principios de [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines): jerarquía, respuesta inmediata al pulsar, navegación consistente, foco visible y adaptación del contenido al espacio disponible. Consultadas el 14 de noviembre de 2026.

La cabecera conserva contexto al desplazarse. El enlace «Skip to content» y la restauración de foco tras navegar facilitan el uso con teclado. El diálogo nativo conserva el foco y admite Escape. No se añadieron librerías de animación: los controles no requieren gestos ni física de arrastre.

Las preferencias de movimiento reducido, transparencia reducida y contraste alto tienen variantes CSS. Las unidades y etiquetas permanecen visibles. En escritorio se conservan tres columnas de widgets, en tablet dos y en teléfonos pequeños una para que los ejes sigan siendo legibles. La vista de tripulación se compacta para la pantalla central de 1920 × 1080 sin escalar toda la interfaz.

## Verificación realizada

- `npm run build`: TypeScript y compilación de producción correctos.
- `npm test`: ocho pruebas correctas de datos, estados y coherencia del sueño.
- Chromium real: navegación tripulación → astronauta → métrica; accesos directos de pulso/sueño; revisión; confirmación/cancelación de apoyo; persistencia del historial; cambio de escenario; filtros y estado vacío; paginación.
- Capturas e inspección de escritorio, tablet y móvil, entre 320 y 1920 píxeles, sin desbordamiento horizontal en las vistas comprobadas. Se corrigieron el contraste de los iconos sobre las franjas, la visibilidad de categorías móviles y el tamaño del dial.
- Continuidad de navegación con la página cargada y la red desactivada, y preferencia de movimiento reducido. Sin errores de consola durante el recorrido.

Esto verifica un prototipo con datos sintéticos, no una integración con sensores ni una validación médica. El arranque sin red depende de servir los archivos localmente; no se añadió una PWA ni caché de instalación. No se realizó una auditoría completa con lectores de pantalla. El detector auxiliar de diseño no pudo ejecutarse porque su paquete no está disponible en esta instalación; la revisión visual y las pruebas de navegador sí se realizaron.
