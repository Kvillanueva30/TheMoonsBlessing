# Retratos de los seis fundadores

Imagenes que usa la pantalla `/kingdoms`. Se muestran en el marco de la card:

- **Cara frontal** — el rey de la guerra.
- **Cara trasera** — el rey joven cuando fue nombrado por primera vez.

## Nombres

Un archivo por reino y momento, con el **id del reino**, no el nombre del
fundador. Ojo: el fundador de Bastia se llama Silas, pero el archivo se llama
`bastia-`, porque es el id del reino el que usa la pantalla.

```
ederian-guerra.jpeg   ederian-joven.jpeg
bastia-guerra.jpeg    bastia-joven.jpeg
tralan-guerra.jpeg    tralan-joven.jpeg
xorian-guerra.jpeg    xorian-joven.jpeg
tradia-guerra.jpeg    tradia-joven.jpeg
helia-guerra.jpeg     helia-joven.jpeg
```

La extension se prueba sola en este orden: `.jpg`, `.jpeg`, `.png`, `.webp`.
Si el archivo no existe, la card lo dice con su nombre en lugar de romperse.

## Tamano

Vertical **4:5**, por ejemplo `816 x 1020`.

El retrato se recorta con `object-fit: cover`, asi que una relacion distinta
no rompe nada, pero el rostro caera en otro sitio. Conviene que la cara quede
en el tercio superior.

## Cuando haya imagenes de un reino y no de otro

Se puede. El que falte muestra su hueco con el nombre del archivo, y los
otros salen con su retrato. No hace falta tener las doce a la vez.

## Nota de canon

Estas imagenes son direccion de arte, no canon. Al elegir que ropa y que
corona llevan los reyes se esta definiendo algo que el canon no declara:
la ceremonia de cada reino es `P-007` y sigue sin definir.