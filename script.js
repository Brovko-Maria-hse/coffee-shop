function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function loadData(file, key) {
  return fetch(file)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .catch(function (e) {
      if (window[key]) return window[key];
      throw e;
    });
}

function initShop() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  const qty = {};
  const priceRadio = document.getElementById('price');
  const titleRadio = document.getElementById('title');
  const search = document.getElementById('search');
  let products = [];

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
    if (list.length === 0) {
      grid.appendChild(el('p', 'text-muted', 'Ничего не найдено'));
      return;
    }
    list.forEach(function (p) {
      const col = el('div', 'col');
      const card = el('article', 'card h-100');
      const img = el('img', 'card-img-top');
      img.src = p.img;
      img.alt = p.title;
      const body = el('div', 'card-body d-flex flex-column');
      const order = el('label', 'd-flex align-items-center gap-2 mt-auto', 'Заказать');
      const input = el('input', 'form-control');
      input.type = 'number';
      input.min = '0';
      input.value = qty[p.id] || 0;
      input.name = p.vendor_code;
      input.addEventListener('input', function () { qty[p.id] = Number(input.value) || 0; });
      order.appendChild(input);
      body.append(
        el('h5', 'card-title', p.title),
        el('p', 'text-muted small mb-1', 'Артикул: ' + p.vendor_code),
        el('p', 'card-text', p.description || 'Без описания'),
        el('p', 'fw-bold', 'Цена: ' + p.price + ' ₽'),
        order
      );
      card.append(img, body);
      col.appendChild(card);
      grid.appendChild(col);
    });
  }

  priceRadio.addEventListener('change', render);
  titleRadio.addEventListener('change', render);
  search.addEventListener('input', render);

  loadData('shop.json', 'SHOP_DATA')
    .then(function (data) { products = data; render(); })
    .catch(function (e) { grid.textContent = 'Не удалось загрузить каталог: ' + e.message; });

  document.getElementById('add-to-cart').addEventListener('click', function () {
    const params = new URLSearchParams({ q: 'search' });
    let count = 0;
    products.forEach(function (p) {
      if (qty[p.id] > 0) { params.append(p.vendor_code, qty[p.id]); count++; }
    });
    if (count === 0) { alert('Выберите хотя бы один товар'); return; }
    window.open('https://www.google.com/search?' + params.toString(), '_blank');
  });
}

function initTeam() {
  const box = document.getElementById('team');
  if (!box) return;
  loadData('team.json', 'TEAM_DATA')
    .then(function (data) {
      data.forEach(function (m) {
        const col = el('div', 'col');
        const card = el('article', 'card h-100 text-center');
        const img = el('img', 'card-img-top photo rounded-circle object-fit-cover mx-auto mt-3');
        img.src = m.photo;
        img.alt = m.name;
        const body = el('div', 'card-body d-flex flex-column');
        const mail = el('a', '', m.email);
        mail.href = 'mailto:' + m.email;
        const links = el('div', 'mt-auto pt-3 d-flex flex-wrap justify-content-center gap-2');
        m.links.forEach(function (l) {
          const a = el('a', 'btn btn-outline-secondary btn-sm', l.text);
          a.href = l.url;
          a.target = '_blank';
          a.rel = 'noopener';
          links.appendChild(a);
        });
        body.append(
          el('p', 'text-muted small mb-1', m.role),
          el('h5', 'card-title', m.name),
          el('p', 'card-text', m.description),
          mail,
          links
        );
        card.append(img, body);
        col.appendChild(card);
        box.appendChild(col);
      });
    })
    .catch(function (e) { box.textContent = 'Не удалось загрузить данные: ' + e.message; });
}

function initForm() {
  const form = document.getElementById('order-form');
  if (!form) return;
  form.onsubmit = function (event) {
    event.preventDefault();
    const params = new URLSearchParams({ q: 'search' });
    const lines = [];
    new FormData(form).forEach(function (value, key) {
      params.append(key, value);
      lines.push(key + '=' + value);
    });
    const preview = document.getElementById('order-preview');
    preview.hidden = false;
    preview.textContent = 'Отправлено:\n' + lines.join('\n');
    window.open('https://www.google.com/search?' + params.toString(), '_blank');
  };
}

document.addEventListener('DOMContentLoaded', function () {
  initShop();
  initTeam();
  initForm();
});