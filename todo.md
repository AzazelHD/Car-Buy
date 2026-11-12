# TODO — CarBuy

## Pendiente

- [ ] **Opción "Financiar comisión de apertura"**
  Ahora la calculadora trata la comisión de apertura como un pago aparte. BBVA (y muchas financieras) la **financia dentro del principal**, así que hoy no se puede reproducir una oferta real con las cuatro cifras a la vez (cuota, TAE, total e intereses).
  - Casilla en el panel de datos.
  - Si está marcada: `principal = P + fee`, la cuota se calcula sobre ese principal, el TAE se calcula sobre el neto (`P`) y el total es solo `cuota × n`.
  - Si está desmarcada: comportamiento actual (comisión pagada al contado).
  - Validar con la oferta de BBVA: PVP 17.990 €, seguro 2.184,12 €, apertura 3,95 % (796,88 €), 120 meses, TIN 9,99 % → cuota 277,01 €, TAE 11,49 %, total 33.241,20 €.

- [ ] **Campo de seguro / protección de pagos (opcional)**
  BBVA incluye 2.184,12 € de Seguro de Protección de Pagos dentro del importe financiado. No es coste de financiación, así que conviene un campo aparte para no mezclarlo con los intereses.

- [ ] **Redondeo de cuota**
  La calculadora muestra 277,02 € y el banco 277,01 €. Revisar si conviene truncar/redondear la cuota y ajustar la última para que `cuota × n` cuadre con el total de la oferta.

- [ ] **Tooltips explicativos (opcional)**
  Textos de ayuda junto a TIN, TAE, comisión de apertura y comisión de cancelación, explicando la diferencia entre TIN y TAE y qué es el capital pendiente.

## Hecho

- [x] Leyenda de colores en la caja de costes (hasta contado / extra).
- [x] Escala con eje real y tick en el precio de contado.
- [x] Tabla comparativa en tarjetas apiladas en móvil.
- [x] Igualar el alto de las celdas de la fila roja.
- [x] Resaltar el ahorro y el sobrecoste de financiar en el héroe.
- [x] Mostrar también el "extra vs. financiado" en el héroe (segunda línea del badge).
- [x] Evitar que un `script.js` cacheado deje la página en blanco: URLs versionadas (`?v=`) y comprobaciones de existencia.
- [x] Aviso si JavaScript está desactivado y mensaje de error si los cálculos no cargan.

## Notas

- El "extra vs. contado" mezcla dos cosas: la diferencia de precio entre financiado y contado, más los intereses y comisiones. El "extra vs. financiado" aísla solo el coste del préstamo.
- `ahorro = intereses futuros evitados − comisión de cancelación`.
- **Al cambiar `styles.css` o `script.js`, subir el `?v=` de `index.html`** (p. ej. `?v=<hash-del-commit>`). Si no, el navegador puede seguir usando la versión antigua y la página quedará en blanco.
- Si alguien ve la página vacía: recarga forzada con `Ctrl+F5` (`Cmd+Shift+R` en Mac).

## Decisiones

- **La comisión de cancelación se aplica también en el mes 0** (decisión del 12/11/2026). No se añade campo de permanencia mínima ni se hace gratis el mes 0: el usuario prefiere no meter más campos.
  - Con los valores por defecto, cancelar en el mes 0 cuesta 19.885 € = 19.400 € de capital + 291 € de apertura + 194 € de cancelación (1 %).
  - Si algún día se quisiera cambiar, basta con `comision=(k===0||k>=n)?0:pend*com;` en `script.js`; no requiere tocar el HTML.
