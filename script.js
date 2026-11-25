// Один скрипт для всех страниц: каждый блок запускается, только если нужный элемент есть на странице.

// Вспомогательная функция: создать элемент с классом и текстом
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Загрузка JSON-файла (работает только по http(s): GitHub Pages или Live Server)
function loadData(file) {
  return fetch(file).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

// ---------- Магазин: карточки, сортировка (радио price/title), поиск, корзина ----------
function initShop() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  const qty = {};                                   // выбранное количество по id товара
  const priceRadio = document.getElementById('price');
  const titleRadio = document.getElementById('title');
  const search = document.getElementById('search');
  let products = [];

  // Перерисовка: поиск по title / description / price, затем сортировка (как в примере преподавателя)
  function render() {
    const word = search.value.trim().toLowerCase();
    const list = products.filter(function (p) {
      return p.title.toLowerCase().includes(word) ||
             p.description.toLowerCase().includes(word) ||
             p.price.toString().includes(word);
    });
    if (priceRadio.checked) {
      list.sort(function (a, b) { return a.price - b.price; });
    } else {
      list.sort(function (a, b) {
        const nameA = a.title.toUpperCase(), nameB = b.title.toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
    }
    grid.textContent = '';
    if (list.length === 0) { grid.appendChild(el('p', 'text-muted', 'Ничего не найдено')); return; }
    list.forEach(function (p) {
      const col = el('div', 'col');
      const card = el('article', 'card h-100');
      const img = el('img', 'card-img-top'); img.src = p.img; img.alt = p.title;
      const body = el('div', 'card-body d-flex flex-column');
      const order = el('label', 'd-flex align-items-center gap-2 mt-auto', 'Заказать');
      const input = el('input', 'form-control'); input.type = 'number'; input.min = '0';
      input.value = qty[p.id] || 0; input.name = p.title;
      input.addEventListener('input', function () { qty[p.id] = Number(input.value) || 0; });
      order.appendChild(input);
      body.append(el('h5', 'card-title', p.title), el('p', 'text-muted small mb-1', 'Артикул: ' + p.vendor_code),
                  el('p', 'card-text', p.description || 'Без описания'),
                  el('p', 'fw-bold', 'Цена: ' + p.price + ' ₽'), order);
      card.append(img, body); col.appendChild(card); grid.appendChild(col);
    });
  }

  priceRadio.addEventListener('change', render);
  titleRadio.addEventListener('change', render);
  search.addEventListener('input', render);

  loadData('shop.json').then(function (data) { products = data; render(); })
    .catch(function (e) { grid.textContent = 'Не удалось загрузить каталог: ' + e.message; });

  // Кнопка «В корзину»: отправляет выбранные товары на удалённый сервер (GET на google.com/search?)
  document.getElementById('add-to-cart').addEventListener('click', function () {
    const items = products.filter(function (p) { return qty[p.id] > 0; })
                          .map(function (p) { return p.title + ' (арт. ' + p.vendor_code + ') x' + qty[p.id]; });
    if (items.length === 0) { alert('Выберите хотя бы один товар'); return; }
    const q = 'Заказ из магазина: ' + items.join('; ');
    window.open('https://www.google.com/search?' + new URLSearchParams({ q: q }).toString(), '_blank');
  });
}

// ---------- Программа: карточки участников из team.json ----------
function initTeam() {
  const box = document.getElementById('team');
  if (!box) return;
  loadData('team.json').then(function (data) {
    data.forEach(function (m) {
      const col = el('div', 'col');
      const card = el('article', 'card h-100 text-center');
      const img = el('img', 'card-img-top photo rounded-circle object-fit-cover mx-auto mt-3');
      img.src = m.photo; img.alt = m.name;
      const body = el('div', 'card-body d-flex flex-column');
      const mail = el('a', '', m.email); mail.href = 'mailto:' + m.email;
      const links = el('div', 'mt-auto pt-3 d-flex flex-wrap justify-content-center gap-2');
      m.links.forEach(function (l) {
        const a = el('a', 'btn btn-outline-secondary btn-sm', l.text);
        a.href = l.url; a.target = '_blank'; a.rel = 'noopener'; links.appendChild(a);
      });
      body.append(el('p', 'text-muted small mb-1', m.role), el('h5', 'card-title', m.name),
                  el('p', 'card-text', m.description), mail, links);
      card.append(img, body); col.appendChild(card); box.appendChild(col);
    });
  }).catch(function (e) { box.textContent = 'Не удалось загрузить данные: ' + e.message; });
}

// ---------- Форма: перехват отправки и сбор ВСЕХ полей ----------
function initForm() {
  const form = document.getElementById('order-form');
  if (!form) return;
  form.onsubmit = function (event) {
    event.preventDefault();
    const pairs = [];
    // FormData содержит text, number и выбранные radio
    new FormData(form).forEach(function (value, key) { pairs.push(key + '=' + value); });
    const text = 'Заказ кофе: ' + pairs.join('; ');
    // Google понимает параметр q — в поиске будет вся строка целиком
    const url = form.action.split('?')[0] + '?' + new URLSearchParams({ q: text }).toString();
    const preview = document.getElementById('order-preview');
    preview.hidden = false;
    preview.textContent = 'Отправлено:\n' + pairs.join('\n');
    window.open(url, '_blank');
  };
}

document.addEventListener('DOMContentLoaded', function () { initShop(); initTeam(); initForm(); });