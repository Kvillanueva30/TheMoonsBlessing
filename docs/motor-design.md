# Motor narrativo — diseño conceptual

> **Regla de origen: no rellenar huecos del lore con suposiciones.** Si algo falta, se pregunta.

---

## 1. Flujo confirmado

```
FECHA REAL DEL VISITANTE
  └─> Luna de nacimiento          (capa simbólica y personal)

RESPUESTAS DEL TEST
  └─> Deseo / Necesidad           (eje de la bendición)
  └─> Afinidad con los legados    (no "ser el fundador")
        └─> Reino                 (deducido, nunca elegido)
              └─> Naturaleza compatible con el estado actual del reino

COMBINACIÓN
  └─> Resultado narrativo final
```

La Luna **no tiene ninguna arista** hacia reino o naturaleza.

---

## 2. Estado actual de Madar (el que usa el test)

Se trabaja con el estado **actual** del mundo. **No** se pregunta al visitante si es
antes o después de la Primera Guerra. **No** se usa su fecha real para eso.

| Reino | Naturalezas |
|---|---|
| Ederian | Manskling / Diubak |
| Tralan | Manskling / Diubak |
| Xorian | Manskling / Diubak |
| Tradia | **Cazut** |
| Helia | **Cazut** |
| Bastia | **Cazut** |

Coherente con el canon: *seis reinos originales, tres quedaron afectados por la
maldición* después de la Primera Guerra.

En un reino Cazut la naturaleza **siempre** es Cazut. Ver §8-bis.

### Correcciones aplicadas en `data/kingdoms/`

| Reino | Antes | Ahora |
|---|---|---|
| Ederian | `mixed` | correcto |
| Bastia | `cazut-exclusive` | correcto |
| Tralan | `cazut-exclusive` | **corregido a mixed** |
| Xorian | `cazut-exclusive` | **corregido a mixed** |
| Tradia | `cazut-exclusive` | correcto |
| Helia | `null` | **corregido a Cazut** |

---

## 3. Naturaleza — el resultado principal

La pregunta que responde la experiencia es **"¿qué eres en Madar?"**:

> **MANSKLING** · **DIUBAK** · **CAZUT**

**No** es un quiz de "¿qué personaje eres?". Los personajes sirven como referencia de
validación, nunca como resultado. El reino es **información adicional** que contextualiza.

### La naturaleza no es una alineación moral

| Prueba canon | Naturaleza | Moralidad |
|---|---|---|
| **Gil** | Manskling | Está completo. No es "bueno" por ser Manskling |
| **Benny** | Manskling | Sacrifica, nunca traiciona. Aun así Manskling |
| **Darya** | Diubak | Mucha oscuridad **y** mucho amor por Anika |
| **Rayden** | Diubak | Arrogante, se considera perfecto |
| **Alden** | Cazut | Noble |

Si "Cazut" implicara "malo", **Alden sería imposible**. Si "Manskling" implicara "bueno",
**Gil y Benny** — sacrificial, leal, nunca traidor — **serían errores**. Las dos dimensiones
son independientes.

---

## 4. La bendición — CANON CONFIRMADO

> La Diosa Luna es una **mujer loba**. Los Diubaks tienen naturaleza de hombre lobo y
> representan una cercanía especial con la naturaleza de la Diosa.

Antes de la Primera Guerra, la Diosa Luna **bendijo** a determinadas personas,
convirtiéndolas en Diubaks.

| La bendición **es** | La bendición **no** es |
|---|---|
| Un **regalo**: acercar a alguien a la naturaleza de la Diosa | Un premio |
| Respuesta a una **necesidad** que la Diosa ve | Una respuesta a la moralidad |
| Algo que puede **ayudar** a esa persona | Señal de superioridad |

La Diosa no bendice a alguien por ser bueno, superior o más poderoso.

### El criterio: deseo frente a necesidad

La Diosa ve la diferencia entre:

1. **Lo que una persona QUIERE.**
2. **Lo que una persona REALMENTE NECESITA.**

Puede ver quién es alguien en el presente **y** aquello que puede llegar a ser, incluso
aquello que esa persona todavía no comprende.

> **"Una persona puede querer algo que no necesita."**
>
> **"La Diosa no necesariamente les da a sus hijos lo que quieren; puede darles aquello
> que sabe que necesitan."**

Principios de diseño. **No** son texto literal de la interfaz.

### Los tres casos que fijan el criterio

| Personaje | Quiere | Realmente necesita | Resultado |
|---|---|---|---|
| **Gil** | Paz, poder vivir siendo quien es | Nada más. Está completo | **Manskling** |
| **Benny** | Ser Diubak: estatus, reconocimiento | Nada. Se basta a sí mismo | **Manskling** |
| **Darya** | Felicidad, reconocimiento, superioridad, poder, sentirse más fuerte | Sentirse suficiente **por dentro** | **Diubak** |

Darya buscaba fuera lo que necesitaba encontrar dentro. Si su vida hubiera sido otra y lo
hubiera encontrado siendo Manskling, **probablemente no habría necesitado la bendición**.

### Cómo lo implementa el motor

El eje central es **deseo vs necesidad**, no la moralidad.

| Patrón | Lectura | Naturaleza |
|---|---|---|
| Deseo y necesidad coinciden, o no hay brecha | Estoy completo siendo quien soy | **Manskling** |
| El deseo apunta fuera, la necesidad apunta dentro | Hay algo que no puedo resolver yo | **Diubak** |
| Cualquiera, en reino maldito | Linaje por la maldición | **Cazut** |

**No** se convierte en puntuación moral, ni en barra de luz, ni en "tu respuesta demuestra
que tienes mucha Luz Interior". La Luz Interior es una **capa narrativa** que el texto
final interpreta, nunca una puntuación visible.

### Rayden y Alden quedan fuera de este criterio

| Personaje | Por qué queda fuera |
|---|---|
| **Rayden** | Diubak **por linaje** (descende de Lucius, el primero). No es un caso de la bendición psicológica de Darya. Arrogante y se considera perfecto: Diubak **no** es bondad, humildad ni pureza |
| **Alden** | Nació **después** de la Primera Guerra, bajo la maldición. Cazut por nacimiento. **No** usar para deducir la bendición original |

**"Mucha luz = Diubak" es INCORRECTO.** **"Oscuridad = Cazut" también.**

### Prohibido

```
más bondad          = Diubak
más oscuridad       = Cazut
más luz             = Diubak
querer ser Diubak   = Diubak
sentirse insuficiente = Diubak
baja autoestima      = Diubak
necesitar poder     = Diubak
querer cambiar       = Diubak
```

La naturaleza **no** se reduce a una sola emoción.

---

## 5. Dimensiones, separadas

| Dimensión | Qué es | Determina la naturaleza |
|---|---|---|
| **Naturaleza** | Manskling / Diubak / Cazut | Es el resultado |
| **Linaje** | Ascendencia, familia | Sí, cuando existe |
| **Elección / ritual** | La bendición de la ceremonia de los 16 | Sí, cuando hay necesidad |
| **Carácter** | Decisiones, emociones, deseos, valores | **No.** Cambia con el tiempo |
| **Luz Interior** | Lo profundo que la Luna puede reconocer | **No directamente.** Capa narrativa |

| Personaje | Linaje | Ritual | Carácter | Resultado |
|---|---|---|---|---|
| Gil | — | No bendecido | Completo | Manskling |
| Benny | Padre Diubak, madre Manskling | No bendecido | Sacrificial, leal | **Manskling** |
| Darya | Dos padres Manskling | Bendecida | Se corrompe, ama a Anika | **Diubak** |
| Rayden | Toda la familia Diubak | — | Arrogante | **Diubak** |
| Alden | Reino maldito | — | Noble | **Cazut** |

**naturaleza ≠ moralidad ≠ intención ≠ carácter ≠ deseo**

Benny: la naturaleza no cambia aunque el carácter sea admirable.
Darya: la naturaleza tampoco se pierde cuando el carácter se corrompe.

---

## 6. Por qué el linaje no bloquea el test

El canon muestra **tres mecanismos**: linaje (Rayden), ritual (Darya), maldición (Alden).

**Benny y Rayden son los dos hijos de un Diubak.** Uno es Manskling y el otro Diubak. El
canon **no** dice cuál mecanismo gana cuando chocan.

**Pero para el test el conflicto no se produce: el visitante no trae linaje.** No tiene
apellido, ascendencia ni lugar de nacimiento en Madar, y eso no se puede inventar. El
mecanismo de Rayden es **estructuralmente inaplicable**.

Queda el ritual, y el ritual tiene criterio: **deseo frente a necesidad**. El visitante no
aporta un linaje que contradiga ese criterio.

---

## 7. BETWEEN — concepto especial

**Anika Griffin es la Between.** BETWEEN es un concepto del lore, **no una cuarta
naturaleza**.

Trilogía: **BETWEEN · BEYOND · BECOME**

**Prohibido:** convertir "respuestas equilibradas = Between".

**Pendiente:** qué hace el motor con Between. Si es un resultado posible, una capa o una
detección aparte. **Ninguna fórmula puede inventarse.**

---

## 8. Reglas resueltas

### 8-bis. Los reinos Cazut

> *¿Puede existir un Diubak en Bastia?* → **No. Era ilustrativo.**

En el estado actual, **Bastia, Tradia y Helia son siempre Cazut**. El motor **nunca**
genera Diubak ni Manskling en esos tres reinos.

El ejemplo *"La Diosa Luna te reconoce como DIUBAK... Reino: Bastia"* del brief era **solo
del formato de presentación**. No es un caso posible.

En Ederian, Tralan y Xorian sí puede salir Manskling o Diubak, según el criterio de
deseo vs necesidad.

### 8-tres. Decisiones ya tomadas

| # | Decisión |
|---|---|
| 1 | Fecha real → **solo** Luna. No es fecha de Madar, no se compara con la guerra |
| 2 | La Luna no altera reino ni naturaleza. Sin reglas del tipo "luna llena = Cazut" |
| 3 | Afinidad **con el legado**. No reencarnación ni copia del fundador |
| 4 | El reino se deduce. Nunca se elige |
| 5 | **Sin** pregunta de era. Estado actual únicamente |
| 6 | Naturaleza = resultado principal. Reino = contexto adicional |
| 7 | Criterio de la bendición = **deseo vs necesidad** |
| 8 | Luz Interior = **capa narrativa**, nunca puntuación ni barra |
| 9 | BETWEEN = concepto especial de Anika. **Sin** fórmula |
| 10 | La naturaleza **no** se reduce a una emoción |

---

## 9. Canon pendiente de registrar en `data/`

Ninguno de estos elementos existe todavía en los archivos del proyecto:

| Elemento | Nota |
|---|---|
| **Tussem** | Nombre de la Diosa de la Luna. Mujer loba. Crea a los Diubaks desde los Mansklings |
| **Anika Griffin** | Protagonista y narradora de BETWEEN. Es la Between |
| **Gil, Benny, Darya, Rayden** | Casos canónicos que fijan el criterio de la bendición |
| **Frelan** | Academia |
| **Los nueve discípulos** | Relacionados con los ángeles |
| **Trilogía** | BETWEEN / BEYOND / BECOME |