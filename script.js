// Один скрипт для всех страниц: каждый блок запускается, только если нужный элемент есть на странице.

// Вспомогательная функция: создать элемент с классом и текстом
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Загрузка data.json (работает только по http(s): GitHub Pages или Live Server)
function loadData() {
  return fetch('data.json').then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

// ---------- Магазин: карточки, сортировка, поиск, корзина ----------
function initShop() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  const qty = {};                                  // выбранное количество по названию товара
  const state = { key: null, dir: 1, query: '' };  // сортировка и поиск
  const buttons = { price: document.getElementById('sort-price'), name: document.getElementById('sort-title') };
  const labels = { price: 'Price', name: 'Title' };
  let products = [];

  // Перерисовка карточек с учётом поиска и сортировки
  function render() {
    const q = state.query.trim().toLowerCase();
    const list = products.filter(function (p) {
      return (p.name + ' ' + p.description).toLowerCase().includes(q);
    });
    if (state.key === 'price') list.sort(function (a, b) { return (a.price - b.price) * state.dir; });
    if (state.key === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru') * state.dir; });
    grid.textContent = '';
    if (list.length === 0) { grid.appendChild(el('p', 'text-muted', 'Ничего не найдено')); return; }
    list.forEach(function (p) {
      const col = el('div', 'col');
      const card = el('article', 'card h-100');
      const img = el('img', 'card-img-top'); img.src = p.image; img.alt = p.name;
      const body = el('div', 'card-body d-flex flex-column');
      const order = el('label', 'd-flex align-items-center gap-2 mt-auto', 'Заказать');
      const input = el('input', 'form-control'); input.type = 'number'; input.min = '0';
      input.value = qty[p.name] || 0; input.name = p.name;
      input.addEventListener('input', function () { qty[p.name] = Number(input.value) || 0; });
      order.appendChild(input);
      body.append(el('h5', 'card-title', p.name), el('p', 'card-text', p.description),
                  el('p', 'fw-bold', 'Цена: ' + p.price + ' ₽'), order);
      card.append(img, body); col.appendChild(card); grid.appendChild(col);
    });
  }

  // Круглые кнопки Price / Title: повторное нажатие меняет направление
  function setSort(key) {
    if (state.key === key) state.dir = -state.dir; else { state.key = key; state.dir = 1; }
    Object.keys(buttons).forEach(function (k) {
      const active = state.key === k;
      buttons[k].classList.toggle('active', active);
      buttons[k].textContent = labels[k] + (active ? (state.dir === 1 ? ' ▲' : ' ▼') : '');
    });
    render();
  }
  buttons.price.addEventListener('click', function () { setSort('price'); });
  buttons.name.addEventListener('click', function () { setSort('name'); });
  document.getElementById('search').addEventListener('input', function (e) { state.query = e.target.value; render(); });

  loadData().then(function (data) { products = data.products; render(); })
    .catch(function (e) { grid.textContent = 'Не удалось загрузить каталог: ' + e.message; });

  // Кнопка «В корзину»: отправляет выбранные товары на удалённый сервер (GET на google.com/search?)
  document.getElementById('add-to-cart').addEventListener('click', function () {
    const items = products.filter(function (p) { return qty[p.name] > 0; })
                          .map(function (p) { return p.name + ' x' + qty[p.name]; });
    if (items.length === 0) { alert('Выберите хотя бы один товар'); return; }
    const q = 'Заказ из магазина: ' + items.join('; ');
    window.open('https://www.google.com/search?' + new URLSearchParams({ q: q }).toString(), '_blank');
  });
}

// ---------- Программа: карточки участников из data.json ----------
function initTeam() {
  const box = document.getElementById('team');
  if (!box) return;
  loadData().then(function (data) {
    data.team.forEach(function (m) {
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