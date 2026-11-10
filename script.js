const defaults = {
  financedPrice: 25000,
  cashPrice: 27000,
  downPayment: 5000,
  months: 96,
  apr: 7,
  cancelMonth: 48,
  fee: 0
};

const $ = (id) => document.getElementById(id);
const fields = Object.keys(defaults);
const money = (value) => new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(Number.isFinite(value) ? value : 0);
const number = (id) => {
  const value = Number($(id).value);
  return Number.isFinite(value) ? value : 0;
};

function calculate() {
  const financedPrice = Math.max(0, number('financedPrice'));
  const cashPrice = Math.max(0, number('cashPrice'));
  const downPayment = Math.min(financedPrice, Math.max(0, number('downPayment')));
  const months = Math.max(1, Math.min(480, Math.round(number('months') || 1)));
  const apr = Math.max(0, number('apr'));
  const feeRate = Math.max(0, number('fee')) / 100;
  const cancelMonth = Math.max(0, Math.min(months, Math.round(number('cancelMonth'))));
  const principal = Math.max(0, financedPrice - downPayment);

  // Convert effective annual TAE into an effective monthly rate.
  const monthlyRate = Math.pow(1 + apr / 100, 1 / 12) - 1;
  const payment = monthlyRate === 0
    ? principal / months
    : principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));

  // French amortization balance immediately after the selected instalment.
  const paidInstallments = payment * cancelMonth;
  let remainingBalance;
  if (cancelMonth >= months) {
    remainingBalance = 0;
  } else if (monthlyRate === 0) {
    remainingBalance = Math.max(0, principal - payment * cancelMonth);
  } else {
    remainingBalance = Math.max(0,
      principal * Math.pow(1 + monthlyRate, cancelMonth) -
      payment * (Math.pow(1 + monthlyRate, cancelMonth) - 1) / monthlyRate
    );
  }

  const cancellationFee = remainingBalance * feeRate;
  const totalPaid = downPayment + paidInstallments + remainingBalance + cancellationFee;
  const fullTermTotal = downPayment + payment * months;
  const interestPaid = Math.max(0, paidInstallments + remainingBalance - principal);
  const extraVsFinanced = totalPaid - financedPrice;
  const extraVsCash = totalPaid - cashPrice;
  const earlySavings = fullTermTotal - totalPaid;

  $('cancelMonth').max = String(months);
  $('cancelMonth').value = String(cancelMonth);
  $('cancelMonthValue').textContent = `${cancelMonth} ${cancelMonth === 1 ? 'mes' : 'meses'}`;

  $('totalPaid').textContent = money(totalPaid);
  $('monthlyPayment').textContent = money(payment);
  $('principal').textContent = money(principal);
  $('paidInstallments').textContent = money(paidInstallments);
  $('remainingBalance').textContent = money(remainingBalance);
  $('interestPaid').textContent = money(interestPaid);
  $('feePaid').textContent = money(cancellationFee);
  $('extraFinanced').textContent = signedMoney(extraVsFinanced);
  $('extraCash').textContent = signedMoney(extraVsCash);
  $('fullTermTotal').textContent = money(fullTermTotal);
  $('earlySavings').textContent = signedMoney(earlySavings);

  setDifferenceTone($('extraFinanced'), extraVsFinanced);
  setDifferenceTone($('extraCash'), extraVsCash);
  $('earlySavings').className = earlySavings >= 0 ? 'positive' : 'negative';
}

function signedMoney(value) {
  if (Math.abs(value) < 0.005) return money(0);
  return `${value > 0 ? '+' : '−'}${money(Math.abs(value))}`;
}
function setDifferenceTone(element, value) {
  element.className = value > 0.005 ? 'negative' : value < -0.005 ? 'positive' : '';
}

fields.forEach((id) => $(id).addEventListener('input', calculate));
$('reset').addEventListener('click', () => {
  fields.forEach((id) => { $(id).value = defaults[id]; });
  calculate();
});

calculate();
