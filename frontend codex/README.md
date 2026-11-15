# iluikali.health — frontend Codex

Prototipo independiente de la pantalla central de bienestar de la tripulación. Está contenido en esta carpeta y no modifica `frontend/` ni `Website/`.

## Ejecutar

Requiere Node.js 22.12 o posterior; las pruebas usan el soporte TypeScript nativo de Node. Desarrollado y comprobado con Node 24.

```powershell
cd "C:\Users\lamoy\Desktop\proyectos_coding\Error-Capa-8\frontend codex"
npm install
npm run dev
```

Abrir <http://127.0.0.1:4173/>. Si el puerto está ocupado, detener la otra instancia o ejecutar `npm run dev -- --port 4174`. El servidor acepta conexiones solo desde este equipo.

```powershell
npm test
npm run build
npm run preview
```

`build` comprueba TypeScript y genera `dist/`. Las fuentes e iconos se empaquetan localmente; el funcionamiento del prototipo no requiere CDN, cuentas ni API externas. El enlace a NASA sí necesita conexión.

## Pantalla de tripulación

Cuatro perfiles ficticios se identifican mediante triángulo, cuadrado, círculo y estrella. Cada tarjeta muestra nombre, rol, estado de las señales disponibles y accesos a sueño/recuperación, salud general y bienestar mental. El panel Mission Pulse resume esas señales y permite abrir el perfil que requiere atención.

Los estados combinan texto, color e indicadores. Las tres mediciones pendientes se muestran por separado: un estado estable de las señales disponibles no significa que exista información completa ni certifica la salud de la persona.

## Pantalla del astronauta

Al pulsar una forma o una categoría, se abre el perfil con métricas ordenadas: atención, advertencia y señales disponibles estables; los canales sin lectura quedan al final. La barra lateral cambia de categoría. `Only changes` filtra advertencias y alertas. Hay seis tarjetas por página, con navegación para recorrer todas las métricas.

Se reutilizaron los gráficos SVG que ya existían en `frontend/`, copiados a esta carpeta. Cada widget contiene icono, valor/unidad, gráfico y estado; las alertas cambian el borde y el tinte del fondo. La franja retro es decorativa. La interfaz se adapta a escritorio, tablet y móvil sin reducir todo el contenido a una imagen escalada.

## Detalle de una métrica

Un widget abre su gráfico ampliado, referencia ilustrativa, explicación, siguiente paso y enlace de contexto al Human Research Program. Los textos son contexto de demostración, sin diagnóstico, recetas ni probabilidad de enfermedad. La interfaz identifica que la IA no está conectada.

`Mark as reviewed` guarda una revisión local. `Request support` abre una confirmación que explica que la solicitud es simulada y no contacta a ninguna persona ni servicio. El diálogo nativo permite cerrarlo con Escape y retiene el foco mientras está abierto.

## Mission log y almacenamiento

El historial contiene las últimas 30 revisiones o solicitudes simuladas, almacenadas en `localStorage` de este navegador y origen. Persiste al recargar. Si el navegador impide guardar, el registro permanece en memoria durante la sesión y la UI informa de esa limitación.

Es almacenamiento de una demo con perfiles ficticios; no es un repositorio adecuado para expedientes médicos reales. No hay envío a nube, sistema médico ni backend.

## Escenarios reproducibles

La demo inicia con `fatigue`: Nova Ellis tiene cambios de cortisol/HRV y sueño; Alex Rivera presenta una advertencia de sueño. `Reset demo` cambia a `nominal`, sin borrar el registro. `Simulate fatigue` vuelve al escenario inicial. No hay números aleatorios ni umbrales clínicos.

Las rutas hash permiten navegación atrás/adelante y acceso directo:

```text
#/
#/crew/star/all
#/crew/star/mental
#/crew/star/mental/cortisol
```

## Datos y extensión

- [DATOS.md](docs/DATOS.md): catálogo, origen, unidades provisionales, criterios de estado y pruebas.
- [DISENO-FRONTEND.md](docs/DISENO-FRONTEND.md): diseño retro, navegación, adaptación y comprobaciones de navegador.
- [WIDGETS.md](docs/WIDGETS.md): gráficos SVG y escala relativa del dial de temperatura.
- [PROMPT.md](PROMPT.md): prompt organizado del producto para continuar el desarrollo.
- [CSV del equipo](docs/tipos-de-valores-a-medir.csv): fuente de los indicadores solicitados.

`src/data.ts` contiene el catálogo y los escenarios. `src/health.ts` agrega y ordena estados. `src/components.tsx` contiene los widgets y gráficos compartidos. `src/App.tsx` conecta navegación, vistas y registro. `src/styles.css` centraliza paleta, estados y adaptación por tamaño.

Para conectar sensores, sustituir la obtención de fixtures por lecturas verificadas con unidad, procedencia y tiempo de captura. Para conectar JEV/System One, definir primero el contrato real en el backend; no incluir secretos en Vite ni reutilizar los estados de demo como decisiones clínicas. No se implementó integración ficticia de IA.

## Referencias e interpretación

La imagen adjunta guía paleta crema/marino, tarjetas redondeadas, franjas cálidas y gráficos; las páginas 3–5 de la presentación aportan la navegación de tripulación, astronauta y detalle. Los nombres, cifras, copy y ajustes de composición son decisiones de este prototipo. La documentación antigua del repositorio se trató como contexto y no amplió el alcance a reloj, hardware o backend.

El [Human Research Program de NASA](https://www.nasa.gov/hrp/risks/) proporciona contexto público de riesgos humanos en vuelo espacial; no valida nuestros indicadores, estados ni algoritmo. Consultado el 14 de noviembre de 2026. La página del reto enlazada en el material devolvió HTTP 502 durante esta sesión; el enunciado se consultó en el texto adjunto.

## Comprobaciones y límites

- Compilación de producción y comprobación de tipos: correctas.
- Ocho pruebas de datos, estados y coherencia de duración del hipnograma: correctas.
- Revisión de código de navegación y estados: realizada; no sustituye pruebas de interacción.
- Verificación visual/interactiva: realizada en Chromium, con navegación, filtros, paginación, revisión, apoyo simulado, historial, escenarios y capturas de escritorio/tablet/móvil. Se verificó continuidad de navegación sin red con la aplicación ya cargada y movimiento reducido. Véase el detalle y los límites en [DISENO-FRONTEND.md](docs/DISENO-FRONTEND.md).

Las tres pantallas y sus diálogos fueron revisados en navegador. No hay integración real con wearable, biomarcadores, radiación, JEV o System One.
