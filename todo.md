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

## Notas

- El "extra vs. contado" mezcla dos cosas: la diferencia de precio entre financiado y contado, más los intereses y comisiones. El "extra vs. financiado" aísla solo el coste del préstamo.
- `ahorro = intereses futuros evitados − comisión de cancelación`.
