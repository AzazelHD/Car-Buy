(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  const decimal = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const euro = (value) => money.format(Math.round((value + Number.EPSILON) * 100) / 100);
  const number = (id) => {
    const value = Number.parseFloat($(id).value);
    return Number.isFinite(value) ? value : 0;
  };
  const signedEuro = (value) => `${value > 0 ? '+' : ''}${euro(value)}`;

  let previousTerm = null;
  let state = null;

  function calculateBalance(month, principal, monthlyRate, payment, finalPayment, term) {
    if (month >= term) return finalPayment;
    if (monthlyRate === 0) return Math.max(0, principal - payment * month);
    const balance = principal * Math.pow(1 + monthlyRate, month)
      - payment * (Math.pow(1 + monthlyRate, month) - 1) / monthlyRate;
    return Math.max(0, balance);
  }

  function calculateApr(principal, fee, payment, finalPayment, term) {
    if (principal <= 0) return 0;
    const presentValueDifference = (rate) => {
      let discount = 1;
      let presentValue = 0;
      for (let month = 1; month <= term; month += 1) {
        discount /= 1 + rate;
        presentValue += payment * discount;
      }
      return presentValue + finalPayment * discount - (principal - fee);
    };
    if (presentValueDifference(0) <= 0) return 0;
    let low = 0;
    let high = 1;
    for (let iteration = 0; iteration < 80; iteration += 1) {
      const middle = (low + high) / 2;
      if (presentValueDifference(middle) > 0) low = middle;
      else high = middle;
    }
    return Math.pow(1 + (low + high) / 2, 12) - 1;
  }

  function buildAmortizationTable() {
    const dialog = $('dlg');
    if (!dialog.open || !state) return;
    let balance = state.principal;
    let rows = '<thead><tr><th>Mes</th><th>Cuota</th><th>Intereses</th><th>Capital</th><th>Pendiente</th></tr></thead><tbody>';
    for (let month = 1; month <= state.term; month += 1) {
      const interest = balance * state.rate;
      const payment = state.payment + (month === state.term ? state.finalPayment : 0);
      const capital = payment - interest;
      balance = Math.max(0, balance - capital);
      rows += `<tr${month === state.cancelMonth ? ' class="current"' : ''}><td>${month}</td><td>${euro(payment)}</td><td>${euro(interest)}</td><td>${euro(capital)}</td><td>${euro(balance)}</td></tr>`;
    }
    $('tbl').innerHTML = `${rows}</tbody>`;
  }

  function renderChart({ principal, term, cancelMonth, balanceAtCancel, balanceAt }) {
    const svg = $('chart');
    const bounds = svg.getBoundingClientRect();
    const width = Math.max(300, Math.round(bounds.width) || 640);
    const height = Math.max(100, Math.round(bounds.height) || 170);
    const left = 8;
    const right = 8;
    const top = 18;
    const bottom = 23;
    const innerWidth = width - left - right;
    const innerHeight = height - top - bottom;
    const x = (month) => left + (month / term) * innerWidth;
    const y = (balance) => top + (principal > 0 ? 1 - balance / principal : 1) * innerHeight;
    const points = [];
    const step = Math.max(1, Math.ceil(term / 120));
    for (let month = 0; month <= term; month += step) points.push([month, balanceAt(month)]);
    if (points[points.length - 1][0] !== term) points.push([term, balanceAt(term)]);

    const fullLine = points.map(([month, balance], index) => `${index ? 'L' : 'M'}${x(month).toFixed(1)} ${y(balance).toFixed(1)}`).join(' ');
    const completed = points.filter(([month]) => month <= cancelMonth);
    if (completed[completed.length - 1][0] !== cancelMonth) completed.push([cancelMonth, balanceAtCancel]);
    const paidLine = completed.map(([month, balance], index) => `${index ? 'L' : 'M'}${x(month).toFixed(1)} ${y(balance).toFixed(1)}`).join(' ');
    const paidArea = `${paidLine} L${x(cancelMonth).toFixed(1)} ${y(0).toFixed(1)} L${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;
    const cx = x(cancelMonth);
    const cy = y(balanceAtCancel);
    const label = (text, centerY, color) => {
      const labelWidth = text.length * 6.6 + 18;
      const labelX = Math.max(left, Math.min(width - right - labelWidth, cx - labelWidth / 2));
      return `<g><rect x="${labelX}" y="${centerY - 11}" width="${labelWidth}" height="22" rx="7" fill="#101827" fill-opacity=".88" stroke="#293750"/><text x="${labelX + labelWidth / 2}" y="${centerY + 4}" text-anchor="middle" style="fill:${color};font-size:11px;font-weight:700">${text}</text></g>`;
    };

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = `
      <defs>
        <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#62d6a4" stop-opacity=".3"/><stop offset="1" stop-color="#62d6a4" stop-opacity=".02"/></linearGradient>
        <linearGradient id="remainingGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#83c8ff" stop-opacity=".25"/><stop offset="1" stop-color="#83c8ff" stop-opacity=".01"/></linearGradient>
      </defs>
      <path d="${fullLine}" fill="none" stroke="#50617f" stroke-width="2" stroke-dasharray="4 5"/>
      <path d="${paidArea}" fill="url(#paidGradient)"/>
      <path d="M${x(0)} ${y(principal)} L${cx} ${y(principal)} ${completed.slice().reverse().map(([month, balance]) => `L${x(month).toFixed(1)} ${y(balance).toFixed(1)}`).join(' ')} Z" fill="url(#remainingGradient)"/>
      <path d="${paidLine}" fill="none" stroke="#83c8ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${cancelMonth < term ? `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${y(0)}" stroke="#83c8ff" stroke-dasharray="3 4" opacity=".8"/>` : ''}
      <line x1="${left}" y1="${y(0)}" x2="${width - right}" y2="${y(0)}" stroke="#293750"/>
      <circle cx="${cx}" cy="${cy}" r="6" fill="#edf2fb" stroke="#83c8ff" stroke-width="3"/>
      ${label(`Amortizado ${euro(principal - balanceAtCancel)}`, Math.max(13, Math.min(height - 38, cy + 25)), '#62d6a4')}
      ${balanceAtCancel > 0 && y(0) - cy > 32 ? label(`Pendiente ${euro(balanceAtCancel)}`, (cy + y(0)) / 2, '#83c8ff') : ''}
      <text x="${left}" y="${height - 5}">Mes 0</text><text x="${width - right}" y="${height - 5}" text-anchor="end">Mes ${term}</text>`;
  }

  function renderCostBars(totalCancel, totalKeep, cashPrice, financedPrice) {
    const maximum = Math.max(totalCancel, totalKeep, cashPrice, financedPrice, 1) * 1.025;
    const percent = (value) => `${Math.max(0, value / maximum * 100)}%`;
    const bar = (total) => {
      const base = Math.min(total, cashPrice);
      const extra = Math.max(0, total - cashPrice);
      return `<i class="bar-base" style="width:${percent(base)}"></i><i class="bar-extra" style="width:${percent(extra)}"></i>`;
    };
    $('trC').innerHTML = bar(totalCancel);
    $('trK').innerHTML = bar(totalKeep);
    $('scale').innerHTML = `<span class="scale-mark" style="left:${percent(cashPrice)}">Contado ${euro(cashPrice)}</span>${Math.abs(financedPrice - cashPrice) / maximum > .12 ? `<span class="scale-mark" style="left:${percent(financedPrice)}">Financiado ${euro(financedPrice)}</span>` : ''}`;
  }

  function calculate() {
    const cashPrice = Math.max(0, number('pCon'));
    const financedPrice = Math.max(0, number('pFin'));
    const enteredDeposit = Math.max(0, number('ent'));
    const term = Math.min(120, Math.max(1, Math.round(number('mes') || 1)));
    const annualRate = Math.min(60, Math.max(0, number('tin'))) / 100;
    const openingRate = Math.min(10, Math.max(0, number('ap'))) / 100;
    const cancellationRate = Math.min(10, Math.max(0, number('com'))) / 100;
    const monthlyRate = annualRate / 12;
    const deposit = Math.min(enteredDeposit, financedPrice);
    const principal = Math.max(0, financedPrice - deposit);
    const finalPayment = Math.min(principal, Math.max(0, number('fin')));
    const openingFee = principal * openingRate;
    const payment = monthlyRate === 0
      ? (principal - finalPayment) / term
      : (principal - finalPayment / Math.pow(1 + monthlyRate, term)) * monthlyRate / (1 - Math.pow(1 + monthlyRate, -term));
    const apr = calculateApr(principal, openingFee, payment, finalPayment, term);

    let error = '';
    if (enteredDeposit > financedPrice) error = 'La entrada no puede superar el precio financiado.';
    if (number('fin') > principal) error = error || 'La cuota final no puede superar el importe del préstamo.';
    $('err').textContent = error;

    const slider = $('cancel');
    if (previousTerm !== term) {
      const previousMonth = Number.parseInt(slider.value, 10) || 0;
      slider.max = String(term);
      slider.value = String(previousTerm === null ? Math.min(24, term) : Math.min(previousMonth, term));
      previousTerm = term;
    }
    const cancelMonth = Math.min(Number.parseInt(slider.value, 10) || 0, term);
    const balanceAt = (month) => calculateBalance(month, principal, monthlyRate, payment, finalPayment, term);
    const outstanding = balanceAt(cancelMonth);
    const cancellationFee = cancelMonth >= term ? 0 : outstanding * cancellationRate;
    const totalKeep = deposit + openingFee + payment * term + finalPayment;
    const totalCancel = deposit + openingFee + payment * cancelMonth + outstanding + cancellationFee;
    const saving = totalKeep - totalCancel;
    const paidPercent = principal > 0 ? Math.min(1, Math.max(0, 1 - outstanding / principal)) : 1;

    slider.style.setProperty('--progress', `${cancelMonth / term * 100}%`);
    $('mesLbl').textContent = String(cancelMonth);
    $('tickEnd').textContent = String(term);
    $('mesPill').textContent = cancelMonth >= term ? 'Préstamo completo' : `Cancelación · mes ${cancelMonth}`;

    $('ahorro').textContent = euro(saving);
    $('ahorro').classList.toggle('positive', saving > .005);
    $('ahorroTxt').textContent = cancelMonth >= term
      ? 'No hay cancelación anticipada: pagas el préstamo completo.'
      : saving > .005
        ? `Eso es lo que te ahorras frente a mantenerlo hasta el mes ${term}.`
        : 'Con estas condiciones, la comisión absorbe el ahorro en intereses.';

    $('cap').textContent = euro(principal);
    $('cuota').textContent = euro(payment);
    $('fTin').textContent = `${decimal.format(annualRate * 100)} %`;
    $('fTae').textContent = `${decimal.format(apr * 100)} %`;
    $('fFin').textContent = euro(finalPayment);
    $('fAp').textContent = euro(openingFee);
    $('fTot').textContent = euro(payment * term + finalPayment + openingFee);
    $('fCoste').textContent = euro(payment * term + finalPayment + openingFee - principal);

    $('pend').textContent = euro(outstanding);
    $('pendTxt').textContent = cancelMonth === 0 ? 'Todo el capital financiado' : cancelMonth >= term ? 'Último pago del préstamo' : `Después de la cuota ${cancelMonth}`;
    $('comis').textContent = euro(cancellationFee);
    $('comisTxt').textContent = `${decimal.format(cancellationRate * 100)} % del capital pendiente`;
    $('pagadas').textContent = `${Math.round(paidPercent * 100)} %`;
    $('pagadasTxt').textContent = `${euro(principal - outstanding)} de capital devuelto`;
    $('ringArc').setAttribute('stroke-dasharray', `${paidPercent * 131.9} 132`);

    $('hCancel').textContent = cancelMonth >= term ? 'Sin cancelar antes de tiempo' : `Cancelando en el mes ${cancelMonth}`;
    $('totC').textContent = euro(totalCancel);
    $('totK').textContent = euro(totalKeep);
    $('exCC').textContent = signedEuro(totalCancel - cashPrice);
    $('exCK').textContent = signedEuro(totalKeep - cashPrice);
    $('exFC').textContent = signedEuro(totalCancel - financedPrice);
    $('exFK').textContent = signedEuro(totalKeep - financedPrice);

    renderChart({ principal, term, cancelMonth, balanceAtCancel: outstanding, balanceAt });
    renderCostBars(totalCancel, totalKeep, cashPrice, financedPrice);
    state = { principal, rate: monthlyRate, payment, finalPayment, term, cancelMonth };
    buildAmortizationTable();
  }

  ['pFin', 'pCon', 'ent', 'mes', 'tin', 'ap', 'fin', 'com', 'cancel'].forEach((id) => {
    $(id).addEventListener('input', calculate);
  });
  $('openTable').addEventListener('click', () => {
    $('dlg').showModal();
    buildAmortizationTable();
    const currentRow = $('dlg').querySelector('tr.current');
    if (currentRow) currentRow.scrollIntoView({ block: 'center' });
  });
  $('closeDlg').addEventListener('click', () => $('dlg').close());
  $('dlg').addEventListener('click', (event) => {
    if (event.target === $('dlg')) $('dlg').close();
  });

  calculate();
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => renderChart({
      principal: state?.principal ?? 0,
      term: state?.term ?? 1,
      cancelMonth: state?.cancelMonth ?? 0,
      balanceAtCancel: state?.principal ?? 0,
      balanceAt: (month) => state ? calculateBalance(month, state.principal, state.rate, state.payment, state.finalPayment, state.term) : 0
    }));
    observer.observe($('chart'));
  } else {
    window.addEventListener('resize', calculate);
  }
})();
