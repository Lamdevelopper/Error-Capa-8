# Lecturas y gráficas: segunda revisión

Se trabajó únicamente en `codex-improuvements`. La composición conserva las cuatro figuras, sin nombres ni roles visibles.

## Jerarquía y profundidad

El fondo, los módulos y la navegación usan tres niveles de luminosidad. Las sombras separan módulos del fondo; la cabecera y los selectores elevados identifican controles. La transparencia se limita a navegación y diálogos. Las gráficas tienen superficies opacas para mantener el contraste. No hay degradados decorativos, halos ni bordes de estado.

El widget compartido se extrajo a `src/components/Reading.tsx`: título y estado, valor con unidad, gráfica y procedencia. Se conserva el mismo orden en cada medida. El detalle separa la lectura de los datos del registro y la revisión. Las cifras usan ancho tabular y las etiquetas secundarias tienen menos peso.

## Gráficas

`Chart.tsx` usa líneas para series puntuales, dos líneas para presión arterial y barras para sesiones de sueño y ejercicio. Cuando el archivo incluye etapas de sueño, la vista Sesión muestra su cronología y la vista Historial compara duraciones. No se generan etapas desde un total de horas. Los registros de sesión de la demo tampoco se multiplican para simular una serie continua.

El eje horizontal usa fechas de captura en importaciones e intervalos relativos en la demo. Se pueden filtrar 6 horas, 24 horas o 7 días en series; el selector no obtiene datos que la fuente no haya entregado. En detalle, las flechas o el arrastre eligen una muestra y muestran su tiempo y valor. La conversión de coordenadas respeta el escalado del SVG.

Las escalas derivan de las muestras, sin dibujar rangos clínicos heredados como si estuvieran validados. Si una segunda medida de presión falta, no se completa por estimación. Una muestra aislada aparece como tal; las lecturas ausentes no se unen a través de huecos. El estado clínico de lecturas marcadas como reales queda «Sin evaluar».

## Entrada de datos

El menú de opciones admite JSON y CSV. `importMeasurements` valida todo el lote antes de aplicarlo. Los ejemplos descargables incluyen las trece métricas, 51 registros y una sesión de sueño de ocho horas con 7,5 horas dormidas. Todos los ejemplos son sintéticos.

Se valida identidad, unidad, fechas de calendario, valores finitos, periodos, etapas ordenadas y duración de sesiones. Los identificadores permiten corregir registros sin duplicarlos. El frontend mantiene las lecturas en memoria; la recarga las borra. Una aplicación externa puede usar `ingestReadings` para entregar lotes; no se conectó un servicio ni un sensor.

Véanse [DATOS.md](DATOS.md) y [GRAFICOS.md](GRAFICOS.md).

## Texto y verificación

Se acortaron etiquetas y se reescribieron las descripciones de las trece métricas. Avoid AI Writing revisó el texto visible como documentación técnica. Solo señaló vocabulario repetido entre pantallas; se conservó la repetición de etiquetas para mantener consistencia. Su resultado no se usa como prueba de autoría.

Compilación y diez pruebas correctas. En Chromium se comprobaron las trece gráficas, carga desde archivo, etapas e historial de sueño, datos reales sin evaluación clínica, teclado y arrastre, diálogos y movimiento reducido. Se revisaron capturas a 1024×768, 1180×820, 1920×1080 y 390×844. Falta validación en iPad físico y auditoría completa con lector de pantalla.

Referencias consultadas: [gráficas](https://developer.apple.com/design/human-interface-guidelines/charts) y [materiales](https://developer.apple.com/design/human-interface-guidelines/materials) de Apple HIG. Se aplican al frontend web; no implican una interfaz nativa de iPadOS.
