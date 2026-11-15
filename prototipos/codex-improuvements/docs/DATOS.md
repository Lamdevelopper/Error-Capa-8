# Importación de lecturas

La aplicación abre con datos de demostración. El reloj comienza detenido; las métricas de sueño, ritmo circadiano, laboratorio y ejercicio de demostración permanecen estables al cambiar el tiempo. Estas muestras son sintéticas y no llevan una fecha de captura inventada.

El importador acepta un archivo JSON que contiene una lista de lecturas:

```json
[
  {"astroId":"triangle","metricId":"hr","value":72,"capturedAt":"2026-11-14T12:30:00Z","recordId":"monitor-001","source":"monitor","synthetic":false,"unit":"lpm"},
  {"astroId":"square","metricId":"bp","value":120,"value2":80,"capturedAt":"2026-11-14T12:30:00Z"},
  {"astroId":"circle","metricId":"sleep","value":null,"capturedAt":"2026-11-14T07:00:00Z"}
]
```

- `astroId`: `triangle`, `square`, `circle` o `star`.
- `metricId`: `sleep`, `circ`, `hrv`, `cortisol`, `afi`, `hr`, `bp`, `spo2`, `resp`, `temp`, `move`, `osteo` o `rad`.
- `value` es un número finito o `null` si no se dispone de la medición. `value2` es opcional y sirve para una segunda lectura, por ejemplo, la presión diastólica.
- `capturedAt` es obligatorio, en formato ISO 8601 con zona horaria. `recordId`, `source`, `synthetic` y `unit` son opcionales. La unidad, cuando se proporciona, debe coincidir exactamente con la del catálogo. Para identificar explícitamente un dato como real, se debe indicar `synthetic: false`; si se omite, se considera sintético. La fuente procede del archivo.

Cada lote se valida por completo antes de modificar los datos. `recordId`, si existe, identifica el evento dentro de la combinación de astronauta y métrica; sin él se usa astronauta, métrica y fecha normalizada. Volver a importar el mismo evento lo actualiza. Se ordenan por fecha de captura y la lectura más reciente prevalece sobre la demostración, incluso si es `null`: en ese caso el estado es «Sin datos». El historial usa las fechas reales de captura y muestra hasta 40 lecturas numéricas consecutivas posteriores al último valor `null`, sin unir gráficamente las observaciones separadas por datos ausentes.

Los datos importados permanecen únicamente en memoria durante la sesión de la página; se pierden al recargarla. No existe conexión automática con dispositivos, persistencia ni validación clínica o de unidades. Los valores deben llegar en las unidades indicadas en el catálogo de la interfaz. Las métricas sin lecturas importadas siguen mostrando la demostración.

Como punto de partida se incluye `public/data/lecturas-ejemplo.json`; sus valores son sintéticos.

## CSV y sesiones de sueño

También se pueden importar archivos CSV con cabeceras `astroId,metricId,value,capturedAt` y columnas opcionales `value2,recordId,source,synthetic,unit,periodStart,periodEnd,sleepStages`. Un valor vacío en `value` indica un dato ausente; `value2` vacío indica que la segunda medida no se proporcionó. Los campos con comas deben ir entre comillas CSV. `sleepStages` es una lista JSON dentro de una celda CSV, con sus comillas escapadas duplicándolas. Hay ejemplos completos en `public/data/lecturas-ejemplo.json` y `public/data/lecturas-ejemplo.csv`.

Para una sesión se pueden indicar juntos `periodStart` y `periodEnd` como fechas ISO con zona horaria. En la métrica `sleep`, `sleepStages` contiene etapas `awake`, `rem`, `light` o `deep` con `startAt` y `endAt`. Cada etapa debe tener duración positiva, estar ordenada sin solaparse y, si hay periodo, quedar dentro de él. Se permiten huecos: no se inventan etapas ni se deducen de las horas totales. Las fechas de captura, periodo y etapas deben ser fechas reales.

Los umbrales del catálogo son de demostración y no están validados para datos reales: las lecturas con `synthetic: false` se muestran con estado desconocido, pendiente de revisión. El sistema no diagnostica ni convierte unidades.
