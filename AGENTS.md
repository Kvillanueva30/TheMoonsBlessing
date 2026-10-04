# Madar Ritual — instrucciones del proyecto

Experiencia web interactiva del universo **BETWEEN / Madar**. El usuario introduce su fecha de nacimiento, descubre la luna que lo observó, responde una serie de dilemas narrativos y recibe su identidad dentro del mundo: **Moon + Kingdom + Nature + Origin + Affinity + Traits + Narrative Result**.

El lore completo vive en `data/`. **Empieza por `data/lore-rules.json`.**

## Principio inviolable

**La luz no es bondad y la oscuridad no es maldad.** Son ejes complementarios.

```text
Diubak ≠ bueno
Cazut ≠ malo
Manskling ≠ neutral moralmente
```

Alden es la prueba: línea Cazut, príncipe de un reino Cazut, corazón noble. Por eso `Nature`, `Light/Darkness` y `Character` son **tres ejes que se calculan por separado**. Ninguno se deriva de otro.

## Reglas del universo

1. Hay **6 reinos**: Ederian (Lucius), Bastia (Silas), Tralan (Ross), Xorian (Deron), Tradia (Halik), Helia (Tarik). Cada uno es una forma distinta de afrontar la vida y **ninguno es el bueno**: todos tienen sombras.
2. El usuario **nunca elige su reino**. Se determina por afinidad a partir de las respuestas, y **nunca ve las puntuaciones**.
3. Todos nacen **Manskling**. A los **16 años** hay ceremonia, bajo **la misma fase lunar del nacimiento**.
4. **Cada reino tiene su ceremonia.** No hay ceremonia universal. Ninguna está definida todavía (`P-007`).
5. Naturalezas: **Manskling**, **Diubak transformado** (por la bendición en la ceremonia), **Diubak por linaje** (herencia de los primeros Diubaks creados por la Diosa Luna) y **Cazut** (herencia de la maldición, por nacimiento, nunca por ceremonia).
6. **Nada se inventa.** Si falta un dato, se deja `null` + `TODO` y se pregunta. Ver `data/lore-rules.json` → `doNotInvent`.

## Decisiones pendientes de la autora

`data/lore-rules.json` → `pendingDecisions` tiene 9 puntos. **No los resuelvas por tu cuenta.**

- **`P-001` El reparto 3/3 no cuadra.** El brief dice 3 mixtos y 3 Cazut, pero los tipos declarados dan 1 mixto y 4 Cazut, y Helia no declara tipo. `helia.json` tiene `type: null`. **No hardcodees el 3/3.**
- **`P-002` ¿El reino Cazut fuerza la naturaleza?** Dos afirmaciones del brief se contradicen. Aplica el `default` del archivo y deja la política aislada en un único punto del motor.

## Stack

- **Angular 21** · TypeScript · **Standalone Components** · **SCSS** · Angular Router
- **Node 22.14.0** · **npm 11.20.0**
- Proyecto `madar-ritual`

## Arquitectura

```
src/app/
├── core/         modelos, servicios, motor de resultados, cálculo lunar
├── data/         acceso a los datos de /data
├── pages/        landing, birth-date, moon-reveal, questions,
│                 kingdom-reveal, ceremony, result
├── components/   componentes reutilizables
└── shared/       visuales y utilidades compartidas

data/            (raíz del proyecto, configurado como asset en angular.json)
├── lore-rules.json
├── kingdoms/    ederian, bastia, tralan, xorian, tradia, helia
├── questions/   questions.json
├── moon/        moon-phases.json
├── traits/      traits.json
└── results/     results.json
```

## Motor de resultados

```
BirthDate → MoonPhase → Answers → KingdomAffinity → Kingdom
          → Lineage/NatureRules → Nature → Traits → FinalResult
```

**Ningún componente calcula afinidades, naturaleza ni resultado.** La UI lee el motor. El motor debe poder ejecutarse sin la UI.

## Convenciones

- Código, nombres de archivo e identificadores en **inglés**; comentarios y documentación en **español**.
- **El lore es dato.** Nada de lore en componentes.
- Las preguntas son datos y **el banco está vacío a propósito**. No escribas preguntas de relleno.
- La **fase lunar** se calcula con algoritmo o librería fiable. Prohibida una lista manual de fechas.
- Estética **dark fantasy / lunar / cinematográfica**. Nada de UI corporativa, formularios, tarjetas genéricas ni botones enormes sin personalidad.
- **Sin barras de progreso tipo "Pregunta 4 de 20".** El usuario avanza por una historia.
- Responsive: desktop, laptop, tablet y **móvil** (clave, porque el resultado se compartirá por redes sociales).
- El **nombre de la experiencia no está decidido**: centralízalo en un único archivo.

## Comandos

```bash
npm install
ng serve      # desarrollo
ng build      # build
ng test       # tests
```

## Git y despliegue

Repositorio `madar-ritual`, rama `main`. **GitHub Actions: `push → build → deploy → GitHub Pages`. Sin despliegue manual.**

## Verificación

- Tests del motor para las reglas de linaje, sobre todo el **caso Cazut**.
- Los dos casos moralmente contradictorios deben seguir siendo alcanzables: `Cazut + noble + luz` y `Diubak + cruel + oscuridad`.
- La fase lunar calculada debe coincidir con la fecha real en una muestra de fechas conocidas.

## Fuera de alcance

Perfiles de personajes, ceremonías por reino, poderes, linajes, compatibilidades, imágenes por IA, animaciones, música, efectos de sonido, vídeos cortos, compartir resultado, guardar resultados, integración con el sitio de BETWEEN, agentes de IA. La arquitectura los admite; **no se construyen**.
