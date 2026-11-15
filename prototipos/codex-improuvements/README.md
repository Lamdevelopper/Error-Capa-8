# codex-improuvements

Rediseño independiente de `iluikali-ui`. La versión original no se modifica.

## Ejecutar

Desde esta carpeta:

```powershell
npm ci
npm run dev
```

Abrir http://127.0.0.1:5181/. El servidor solo escucha en este equipo.

```powershell
npm run build
node --test tests/readings.test.mjs
```

## Uso

Las cuatro figuras identifican a los tripulantes. Pulsar el área principal abre sus indicadores; Sueño, Salud y Mente abren directamente una categoría. El selector superior cambia de figura conservando la categoría. Cada widget abre su detalle. La flecha vuelve al nivel anterior.

En **••• → Cargar datos** se pueden introducir JSON o CSV sin cambiar las pantallas. El mismo menú permite descargar un ejemplo y solicitar pantalla completa. Los archivos se validan antes de aplicarse; un error no importa un lote parcial. Las lecturas importadas están en memoria y se pierden al recargar: no es un almacén de expedientes médicos.

El sueño y las métricas de sesión permanecen fijos hasta recibir registros nuevos o corregidos. No existe actualización automática del reloj. Las lecturas puntuales cambian cuando se importan datos, no por animación de la interfaz.

- [Formato y API de entrada](docs/DATOS.md)
- [Diseño y componentes](docs/INTERFAZ.md)
- [Segunda revisión: lecturas y diseño](docs/LECTURAS-Y-DISENO.md)
- [Plan que guio el rediseño](PLAN-REDISENO.md)

## Validación y límites

Compilación de producción y diez pruebas de datos y gráficas correctas. Recorrido comprobado en Chromium: selección de figura/categoría, detalle, revisión local, solicitud de apoyo simulada, importación desde archivo y lectura ausente. Se verificaron escritorio y tablet sin desplazamiento global, y composición adaptable en pantallas estrechas. No hay sensores, backend, IA remota ni envío de mensajes conectados. Los umbrales heredados son reglas ilustrativas del prototipo, sin validación clínica.

La composición ocupa la ventana disponible; ocultar las barras del navegador depende de su soporte de pantalla completa. No se ha comprobado en un iPad físico ni se entrega una PWA instalable. En ventanas pequeñas y con texto ampliado se permite desplazamiento para evitar recortes.
