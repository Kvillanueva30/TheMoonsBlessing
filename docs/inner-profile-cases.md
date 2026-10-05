# Los tres casos sobre las etiquetas reales del banco

> Documento de diseño. **No es una regla.** Es una comprobación de que la evidencia
> del banco separa a los tres casos canónicos SIN que ninguna regla los ordene.
>
> Las respuestas son un ejemplo de cómo respondería cada persona. No son las
> únicas respuestas posibles y **no se han guardado en el banco**.

---

## Las 4 preguntas que pueden bendecir

| Pregunta | Tema | Por qué puede |
|---|---|---|
| `b-002` | Lo que falta | Es la pregunta central de la necesidad |
| `b-003` | Identidad | Puede revelar que uno no es suficiente |
| `b-004` | Poder | Solo vía del fallo del remedio equivocado |
| `i-004` | Veinte años | Cambio, identidad y algo que reconoce |

Las otras 6 no pueden. Su evidencia es contexto, no interpretación.

---

## Gil — está en paz con su vida

El canon dice que Gil **no es "bueno"** por ser Manskling. Es que está completo. El caso
no tiene ninguna necesidad interna.

| Pregunta | Respuesta | Evidencia |
|---|---|---|
| `b-002/a` | «Nada. De verdad nada.» | `sufficiency/complete_present` |
| `b-003/b` | «Lo dejo pasar. Soy quien soy y me llega.» | `sufficiency/complete_present` |
| `b-004/b` | «No lo necesito. Debe haber otra manera.» | `sufficiency/complete_present` |
| `i-004/d` | «Nada. Ya soy quien quiero ser.» | `character_only/identity_continuity` |

**0 de `inner_search`. 0 de `desire_vs_need`. 0 de `external_desire`.**

### Lo que la revelación puede afirmar

- No le falta nada. Afirmación en presente
- No le hace falta ser otro. Se basta
- Afirma que no lo necesita y busca otra vía. No lo ha comprobado
- Responde a una situación de cambio diciendo que no quiere abandonar quien ya es

### Lo que no puede afirmar

- Que tenga una necesidad interna. **No hay ninguna evidencia de eso.**
- Que lo que busca esté dentro. No lo ha declarado.

---

## Benny — quiere ser Diubak pero no lo necesita

Su intención era noble y **no estaba destinado**. Es el caso decisivo: deseo fuerte,
necesidad inexistente.

| Pregunta | Respuesta | Evidencia |
|---|---|---|
| `b-002/b` | «Más reconocimiento. Es lo único que me falta.» | `external_desire/recognition` |
| `b-003/a` | «Lo tomo. Es el trato que quería.» | `external_desire/transformation_status` |
| `b-004/a` | «Lo uso y lo resuelvo.» | `sufficiency/complete_present` |
| `i-004/a` | «La paz.» | `character_only/peace_as_priority` |

**0 de `inner_search`. 0 de `desire_vs_need`. 2 de `external_desire`.**

### Lo que la revelación puede afirmar

- Lo que le falta está fuera: el reconocimiento de otros
- Acepta por el estatus. El objeto del deseo es la mirada de los demás
- El poder resolvió el problema. No había una necesidad detrás
- Su valor más alto es la tranquilidad

### Lo que no puede afirmar

- Que tenga una necesidad interna con contenido
- Que lo que busca esté dentro
- **Que su deseo hacia fuera sustituya algo interno.** Tiene deseo externo pero no
  está unido a ninguna necesidad interna.

---

## Darya — busca fuera lo que necesita dentro

Quería poder, reconocimiento, superioridad. Pero en el fondo sentía que no era
suficiente siendo ella. Si su vida hubiera sido otra, habría podido ser feliz.

| Pregunta | Respuesta | Evidencia |
|---|---|---|
| `b-002/f` | «Lo que busco no está en ninguna parte de fuera.» | `desire_vs_need/inward_declared` |
| `b-003/c` | «El que era tampoco me bastaba.» | `inner_search/located_identity` |
| `b-004/c` | «Y luego descubro que el problema era otro.» | `inner_search/misdirected_remedy` |
| `i-004/f` | «A mi libertad. Ya lo sé.» | `desire_vs_need/inward_declared` |

**2 de `inner_search`. 2 de `desire_vs_need`. 0 de `external_desire`.**

### Lo que la revelación puede afirmar

- Lo busca y sabe que no está fuera. Dirección sin contenido
- Lo insuficiente es **quién es**. Y ya lo ha comprobado: probó ser otro y tampoco bastó
- La necesidad existe y se descubrió por fallar el remedio equivocado. No por sentir vacío
- Ya lo sabe: reconoce lo que está dispuesto a sacrificar. Decisión tomada, no búsqueda

### Lo que no puede afirmar

**Nada.** Las cuatro evidencias son concretas, ancladas, y no hay ninguna ambigua ni
`aloneInsufficient` entre ellas.

---

## Lo que separa a los tres

| | `inner_search` | `desire_vs_need` | `external_desire` | `sufficiency` |
|---|---|---|---|---|
| **Gil** | 0 | 0 | 0 | **3** |
| **Benny** | 0 | 0 | **2** | 1 |
| **Darya** | **2** | **2** | 0 | 0 |

### El dato que importa

**Gil y Benny no se distinguen por tener o no evidencia interna.** Los dos la tienen
en cero. Se distinguen por el **subtipo de lo que sí tienen**:

- Gil → `sufficiency`: tres veces
- Benny → `external_desire`: reconocimiento y estatus

Benny tiene validación externa. Darya **no**: Darya tiene `inward_declared`, que es
declarar que lo que busca no está fuera.

**Esa es la diferencia operativa, y no requiere contar nada.**

### Y el caso que obliga a tener cuidado

Si alguien combinara el perfil de Benny (deseo externo) con una sola evidencia de
Darya (`inward_declared`), tendría ambos. ¿Es Diubak?

**Esa pregunta no está respondida en el banco.** Es el caso que quedó abierto al
diseñar la regla: necesidad interna declarada **sin** pauta de remediación fallida.
Y también el recíproco: `inward_declared` **con** remediación externa pero no interna.

---

## Conclusión

Los tres casos **se distinguen sin que ninguna regla los ordene**, porque:

1. La necesidad interna con contenido (`located_identity`, `misdirected_remedy`)
   solo aparece en Darya.
2. La declaración de que lo que busca está dentro (`inward_declared`) solo aparece
   en Darya.
3. El deseo externo sin necesidad interna aparece en Benny.
4. La suficiencia aparece en Gil.

**Pero distinguirlos no es lo mismo que decidir la naturaleza.** Falta el paso que
distingue «esta persona busca algo dentro» de «esta persona necesita transformarse».
Ese paso no está escrito, y es el siguiente.