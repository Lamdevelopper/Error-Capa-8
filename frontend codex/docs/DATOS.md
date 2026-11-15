# Datos de salud de la tripulación

La interfaz utiliza cuatro integrantes ficticios y datos sintéticos deterministas. `getMetrics(id, escenario)` devuelve el mismo resultado ante los mismos argumentos. `fatigue` cambia cortisol, HRV y sueño de Star, y añade una advertencia de sueño de Square; `nominal` elimina esos cambios. Las series tienen 24 puntos ilustrativos calculados a partir del valor y del perfil, no un registro temporal real. La presión muestra una pareja simulada y su valor numérico representa únicamente el componente sistólico.

| Métrica | Origen en la maqueta | Limitación |
| --- | --- | --- |
| Frecuencia cardíaca, SpO₂, respiración, temperatura, HRV | Wearable sintético | No procede de un dispositivo. |
| Presión arterial | Estimación sintética | No es una medición validada. |
| Movimiento | Registro sintético | Minutos ilustrativos. |
| Sueño | Duración derivada de un registro simulado | No es un estudio del sueño. |
| Cortisol | Resultado de laboratorio sintético | El contexto y el momento de la toma importan; no representa radiación. |
| Osteocalcina y NTX | Marcadores provisionales | Sin lectura validada; aparecen como datos ausentes. |
| Radiación | Sensor pendiente | Sin lectura disponible. |

Los estados son etiquetas de demostración, no diagnósticos ni umbrales clínicos. La prioridad de agregación es `alert > warn > unknown > ok`; una categoría vacía es `unknown`, por lo que la ausencia nunca se considera normal. La ordenación conserva el orden original dentro de cada prioridad y no modifica la lista de entrada. No se calculan riesgos ni probabilidades médicas.

El resumen de tripulación considera exclusivamente señales con valor disponible y muestra por separado los tres canales pendientes. Las categorías sí incluyen cobertura incompleta. Esta distinción evita que un canal sin medición oculte los cambios en las señales disponibles o se presente como normal.

El hipnograma utiliza una ventana sintética de 23:00 a 07:00 con muestras de seis minutos. La suma de muestras dormidas coincide con la duración de la tarjeta a esa resolución; la distribución de etapas es ilustrativa. La temperatura se grafica desde su serie; no se usa un dial fijo. La actividad usa una escala visual de 60 minutos, que no representa un objetivo médico.

Las etiquetas del CSV sobre radiación, método de HRV, muestreo de cortisol y osteocalcina/NTx requieren validación antes de conectar datos reales. Las unidades de biomarcadores son provisionales. No se convierte cortisol en dosis ni se reutiliza la afirmación de calibración NASA del script histórico: esta demo no tiene calibración clínica o espacial verificada.

Para ejecutar las pruebas con Node compatible con eliminación de tipos:

```powershell
npm test
```

Ocho casos comprueban precedencia de estados, datos ausentes, fatiga de Star, sueño de Square, determinismo, límites de series y coherencia del hipnograma. El build comprueba por separado los tipos de los componentes. No se ha ejecutado una prueba real de navegador por bloqueo de la herramienta de UI.
