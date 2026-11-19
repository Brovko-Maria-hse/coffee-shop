function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function loadData() {
  return fetch('data.json').then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

function initShop() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  loadData().then(function (data) {
    data.products.forEach(function (p) {
      const col = el('div', 'col');
      const card = el('article', 'card h-100');
      const img = el('img', 'card-img-top p-2'); img.src = p.image; img.alt = p.name;
      const body = el('div', 'card-body d-flex flex-column');
      const order = el('label', 'd-flex align-items-center gap-2 mt-auto', 'Заказать');
      const qty = el('input', 'form-control'); qty.type = 'number'; qty.min = '0'; qty.value = '0';
      qty.name = 'qty'; qty.dataset.price = p.price;
      order.appendChild(qty);
      body.append(el('h5', 'card-title', p.name), el('p', 'card-text', p.description),
                  el('p', 'fw-bold', 'Цена: ' + p.price + ' ₽'), order);
      card.append(img, body);
      col.appendChild(card);
      grid.appendChild(col);
    });
  }).catch(function (e) {
    grid.textContent = 'Не удалось загрузить каталог: ' + e.message + '. Откройте сайт через сервер.';
  });

  document.getElementById('add-to-cart').addEventListener('click', function () {
    let sum = 0, count = 0;
    grid.querySelectorAll('input[type="number"]').forEach(function (i) {
      const n = Number(i.value) || 0; sum += n * Number(i.dataset.price); count += n;
    });
    document.getElementById('cart-total').textContent = 'В корзине: ' + count + ' шт., сумма ' + sum + ' ₽';
  });
}

function initTeam() {
  const box = document.getElementById('team');
  if (!box) return;
  loadData().then(function (data) {
    data.team.forEach(function (m) {
      const card = el('article', 'tile');
      const img = el('img', 'photo'); img.src = m.photo; img.alt = m.name;
      const mail = el('a', '', m.email); mail.href = 'mailto:' + m.email;
      card.append(img, el('p', '', m.role), el('h3', '', m.name), el('p', '', m.description), mail);
      m.links.forEach(function (l) {
        const a = el('a', '', l.text); a.href = l.url; a.target = '_blank'; a.rel = 'noopener';
        card.appendChild(a);
      });
      box.appendChild(card);
    });
  }).catch(function (e) {
    box.textContent = 'Не удалось загрузить данные: ' + e.message;
  });
}

function initDom() {
  const out = document.getElementById('dom_result');
  if (!out) return;
  const fam = document.getElementById('src-fam').innerText;
  const nam = document.getElementById('src-nam').innerText;
  const year = document.getElementById('src-year').innerText;
  out.textContent = 'Данные, считанные из DOM:\nФамилия: ' + fam + '\nИмя: ' + nam + '\nГод рождения: ' + year;
  console.log('Считано из DOM: ' + fam + ' ' + nam + ', ' + year);
}

function initForm() {
  const form = document.getElementById('order-form');
  if (!form) return;
  form.onsubmit = function (event) {
    event.preventDefault();
    const pairs = [];
    new FormData(form).forEach(function (value, key) { pairs.push(key + '=' + value); });
    const text = 'Заказ кофе: ' + pairs.join('; ');
    const url = form.action.split('?')[0] + '?' + new URLSearchParams({ q: text }).toString();
    const preview = document.getElementById('order-preview');
    preview.hidden = false;
    preview.textContent = 'Отправлено:\n' + pairs.join('\n');
    window.open(url, '_blank');
  };
}

document.addEventListener('DOMContentLoaded', function () {
  initShop(); initTeam(); initDom(); initForm();
});