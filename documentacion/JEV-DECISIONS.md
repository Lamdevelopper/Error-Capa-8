# JEV playbook · decisiones tipadas, no diagnóstico médico

> **Supuesto de integración:** se refiere a Jev AI/TypeSafe `Choice`, `Score` y `Noul`, documentado en https://github.com/jev-ai/typesafe-ai-jev. Antes de implementar, confirmar proveedor, cuentas, políticas, versión de API y términos. API remota = **no offline**.

## Dónde sí aporta valor visible

1. **Check-in intent classification (Choice):** asignar texto libre tipo “slept poorly” a categorías permitidas `sleep | stress | general | other`, con botón de corrección manual.
2. **Question routing (Choice):** seleccionar cuál de 2–3 *cuestionarios curados* conviene mostrar después de una respuesta, sin decidir urgencia clínica.
3. **UX information prioritization (Choice):** escoger si ofrecer primero `view_trend | measurement_help | explanatory_evidence` en contextos no urgentes; reglas de seguridad deterministas siempre primero.
4. **Needs clarification (Noul):** detectar si la respuesta textual parece ambigua y pedir que el usuario la confirme, **nunca** para afirmar ausencia de riesgo médico.

**No recomendamos** el tipo Score para crear un `Health Risk Score`: eso invitaría a interpretar una predicción no validada como medicina. Las probabilidades de salida son del modelo sobre opciones, no riesgo fisiológico del astronauta.

## Ejemplo de decisión (ilustrativa; revisar schema actual en documentación oficial)

```json
{
  "state": {
    "raw_checkin_text": "I woke up often and feel tired",
    "context": "non-clinical UX routing; synthetic demo"
  },
  "questions": {
    "checkin_topic": {
      "type": "choice",
      "instructions": "Classify the check-in topic to choose which existing UX questionnaire to display. Never infer disease or medical urgency.",
      "criteria": {
        "sleep": "Sleep duration, awakenings or rest quality",
        "stress": "Self-reported workload or stress",
        "general": "General well-being",
        "other": "Ambiguous or none of the above"
      }
    }
  }
}
```

**Nota:** el ejemplo no promete un contrato exacto ni endpoint. Añadir `model`, auth y sintaxis definitiva según documentación actual del proveedor en la implementación, no en el cliente.

## Pipeline / control

```text
user input → validation + consent → deterministic safety gate
          → optional Jev (safe/low-risk, sanitized data only)
          → strict schema validator → allowed UI route
          → audit log (version + result + fallback)
```

- **Safety gate manda:** si hay aviso de síntomas graves, inconsistencia o falta un protocolo revisado, Jev no modifica la decisión: mostrar `requires human review` según contexto autorizado.
- **Jev fail closed:** timeout, offline, credenciales ausentes, respuesta inválida, `other`, baja confianza → cuestionario manual por defecto, sin inventar recomendación.
- **Privacidad:** no enviar textos médicos personales identificables al servicio externo por defecto. Para hackathon, fixtures sintéticas únicamente.
- **Transparencia:** presentar “Suggested next check-in” y permitir cambiarlo; no disfrazar modelo probabilístico como criterio NASA.
- **Evidencia:** NASA respalda el riesgo espacial, no la elección de routing de Jev.

## Pruebas mínimas (crear fixture de 15–25 ejemplos ficticios)

| Caso | Entrada | Resultado esperado |
|---|---|---|
| J01 | “I slept poorly” | `sleep` o fallback manual |
| J02 | “I am overwhelmed with tasks” | `stress` o fallback manual |
| J03 | texto vacío | input validation, no request |
| J04 | texto ambiguo | `other` / pedir aclaración |
| J05 | API timeout | `manual_general` |
| J06 | API auth error | `manual_general` + error observabilidad |
| J07 | JSON inválido | `manual_general` |
| J08 | solicitud médica crítica | bypass JEV, revisión por protocolo humano |
| J09 | clave ausente | no caída; feature apagada |
| J10 | texto con nombre real | bloquear/enmascarar; no mandar datos sin consentimiento |

## Contrato de éxito

El jurado ve **qué cambió en la UI gracias a JEV** (por ejemplo, eligió el cuestionario de sueño), cómo se puede corregir y cómo el flujo sigue exactamente igual cuando se apaga Internet. Si JEV es decorativo o bloquea la demo, eliminarlo del recorrido principal.
