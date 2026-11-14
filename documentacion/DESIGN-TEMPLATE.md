# Design System starter · plantilla editable por el responsable UI

**Propósito:** ofrecer una base funcional y consistente, no imponer estética. El equipo de UX/UI puede sustituir todos los tokens y componentes; conservar contrastes, estados y semántica del producto.

## Dirección creativa sugerida (provisional)

**Calm mission control + human care.** Una herramienta seria de misión, no videojuego sci-fi, hospital corporativo ni dashboard cargado. El nombre *Error en Capa 8* puede reflejarse en una anomalía gráfica sutil, una textura de huella o un detalle de `8`, pero nunca debe sustituir un icono crítico ni dificultar la lectura.

**Moodboard:** instrumentación, señal, seguimiento temporal, precisión, calma, privacidad. Evitar neón excesivo, líneas decorativas simulando datos, glassmorphism con blur intenso y alertas rojas por cambios leves.

## Tokens propuestos (cámbialos libremente)

```css
:root {
  /* Base accesible; validar contraste real antes de congelar */
  --bg: #0A111B;
  --surface: #121F2C;
  --surface-raised: #1A2A39;
  --border: #334454;
  --text-primary: #F2F6F8;
  --text-secondary: #B9C8D1;
  --accent: #8BC9DA;
  --attention: #F0BF72;
  --critical: #F28E8E; /* solo protocolo/urgencia verificada */
  --positive: #82CDBA;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --space-unit: 4px;
  --font-ui: system-ui, sans-serif;
  --font-data: ui-monospace, SFMono-Regular, Consolas, monospace;
}
```

**Semántica: `normal` ≠ healthy; `needs_review` ≠ disease.** Diseñar estados con texto explícito. No dibujar puntuación única `Health 82/100` sin validación.

## Escalas base

| Token | Valor inicial | Regla |
|---|---|---|
| Space | 4, 8, 12, 16, 24, 32, 48 px | Usa escala, evita espaciado random |
| Body PC | 14–16 px | Legible a distancia de pantalla |
| Display | 28–40 px | Solo hero y alertas importantes |
| Data | 20–28 px | Acompañar de unidad y label |
| Radius | 8/14/22 px | Sin exceso de estilos |
| Min tap watch | aprox. 48 dp | Verificar en dispositivo redondo real |
| Charts | 1 foco, máx. 2 series esenciales | Estilo sobrio, anotaciones útiles |

## Wireframes en texto

### PC Overview (~1440px)

```text
┌─ NAV / Mission Day / Local sync status ───────────────────────────────┐
│ MAIN: Your health overview                    Evidence & context     │
│ ┌───────────────────────────────────┐          ┌─────────────────┐   │
│ │ ONE ACTION: Sleep trend changed   │          │ Why this matters│   │
│ │ 3 nights below baseline          │          │ Source NASA     │   │
│ │ [Review assessment]              │          │ Limitations     │   │
│ └───────────────────────────────────┘          └─────────────────┘   │
│ ┌────────┐ ┌────────┐ ┌────────┐                                 │
│ │HR      │ │Sleep   │ │Check-in│  Trend / Baseline                 │
│ └────────┘ └────────┘ └────────┘                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Watch (circular)

```text
     STATUS
  1 item to review
   Sleep trend
 [Open on PC]
     Sync •
```

## Design inventory a construir

| Componente | Inputs/variantes | A11y / contenido obligatorio |
|---|---|---|
| `StatusCard` | no items, attention, missing data | ícono + label específico |
| `MetricCard` | HR, sleep, mood, etc. | unit, timestamp, provenance, freshness |
| `TrendChart` | 7/14/30d, baseline overlay | ejes, descripción textual, nota synthetic |
| `AssessmentStepper` | step, answers, validation | progreso y retroceso |
| `EvidencePanel` | title, NASA link, limits | distinción evidencia/interpretación |
| `ActionCard` | preapproved actions | explicación, confirmación, estado |
| `ConnectionStatus` | online LAN, offline ground, stale | precisión sobre qué conexión falló |
| `WatchPrompt` | short, two-button | targets grandes, contraste, háptica opcional |
| `ProvenanceChip` | device / entered / synthetic / NASA | nunca ocultar en tooltip exclusivo |

## Template para cada pantalla nueva

```md
### Screen: [nombre]
- User job:
- Entry point:
- Primary CTA:
- Key information (max 3):
- Data provenance shown:
- Empty / loading / error / offline / stale:
- NASA evidence / safety note:
- Desktop keyboard behavior:
- Watch touch target or handoff:
- Motion/haptic:
- Success measurement:
```

## Handoff de diseño a implementación

- Guardar tokens finales y captura por estado normal/attention/empty/error.
- Estados no pueden depender solo de animación o color.
- Gráficas sin números falsos o estética que simule datos reales.
- Probar contraste WCAG AA para texto y componentes; tamaño adaptable del texto.
- No referenciar marcas NASA/Samsung como patrocinadores ni insinuar aval oficial.
- Revisar `docs/UX-FLOWS.md` antes de añadir pantallas. **La demo manda.**
