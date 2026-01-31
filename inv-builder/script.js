/* --- KONFIGURASI UTAMA --- */
// 1. TAMPAL URL YANG ANDA SALIN DARI LANGKAH 1 DI SINI
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw3PpcWE8-q413p0GI2l2WcCeLanSw3rlmpY_4u3_gK6N4t3mnLf6rrqCRVSo8Bml0/exec"; 
// 2. PASSWORD UNTUK MASUK KE BUILDER (Mesti sama dengan dalam Google Script)
const ADMIN_PASSWORD = "JERSYX2024"; 

/* --- Utility Function --- */
function fmt(n) {
    return Number(n || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

const ITEMS_LIST = document.getElementById('itemsList');
const INVOICE_ROOT = document.getElementById('invoiceRoot');
const LOGO_DATA_URL = 'https://i.postimg.cc/BQ23Nf9X/logo-jersyx-01.png';
const STAMP_DATA_URL = 'https://i.postimg.cc/JhLhF5xc/SIGN-RARA-JA-01.png';

const INPUT_FIELDS = {
    fInvoiceNo: 'invoiceInput',
    fCustomer: 'customer',
    fAddress: 'address',
    fPhone: 'phone',
    fPaymentStatus: 'status',
    fDeposit: 'deposit',
    fDesign: 'designCharge',
    fPaid: 'paid',
    fIssuedBy: 'issuedBy',
    fAcceptedBy: 'acceptedBy'
};

/* --- SISTEM LOGIN & VIEW-ONLY MODE --- */
window.onload = async function() {
    const token = window.location.hash.substring(1);
    
    if (token && token.length > 5) {
        // MOD CUSTOMER: Sorok semua alat pembina (builder)
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.querySelector('.topbar').style.display = 'none';
        document.querySelector('.col.form').style.display = 'none';
        
        // Tarik data dari Cloud berdasarkan token di link
        await loadInvoiceFromCloud(token);
    } else {
        // MOD ADMIN: Tunjuk skrin login
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }
};

function checkLogin() {
    const pass = document.getElementById('adminPass').value;
    if (pass === ADMIN_PASSWORD) {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        populateCloudDropdown(); // Sini kita panggil fungsi load dropdown
        generatePreview();
    } else {
        document.getElementById('loginMsg').innerText = "Password Salah!";
    }
}

/* --- FUNGSI SAVE & DELETE (CLOUDSYNC) --- */

async function saveToCloud() {
    const btn = document.getElementById('btnSave');
    btn.innerText = "Saving...";
    
    const data = getInvoiceFormData();
    data.action = "save";

    try {
        // Kita hantar guna kaedah 'text/plain' untuk elakkan sekatan CORS Google
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data)
        });

        // Jika sampai sini, kita anggap berjaya kerana 'no-cors' tak bagi baca response
        localStorage.setItem(data.invNo, JSON.stringify(data));
        alert("Data dihantar ke Cloud! Sila semak Google Sheet anda dalam masa 5 saat.");
        
    } catch (e) {
        alert("Ralat: " + e.message);
    } finally {
        btn.innerText = "Save";
    }
}

async function deleteInvoice() {
    const invNo = `INV-${document.getElementById('fInvoiceNo').value}`;
    
    // Jangan bagi padam kalau No Invoice kosong
    if (invNo === "INV-") {
        alert("Sila load invoice terlebih dahulu sebelum padam.");
        return;
    }

    if (!confirm(`Padam invoice ${invNo} secara kekal dari Cloud?`)) return;

    const btn = document.getElementById('btnClear'); // Butang padam anda
    const originalText = btn.innerText;
    btn.innerText = "Deleting...";
    btn.disabled = true;

    try {
        // Hantar request padam ke Google Script
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Guna no-cors untuk Google Script
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: "delete", invNo: invNo })
        });

        // Padam dari backup LocalStorage
        localStorage.removeItem(invNo);

        alert(`Invoice ${invNo} telah dipadam dari Cloud.`);
        
        // KEKAL DALAM SISTEM: Kita cuma kosongkan borang, bukan reload page
        resetFormOnly(); 
        
        // Update semula dropdown supaya nama yang dipadam hilang
        await populateCloudDropdown();

    } catch (e) {
        alert("Ralat teknikal: " + e.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Fungsi baharu untuk kosongkan borang tanpa logout
function resetFormOnly() {
    document.getElementById('fInvoiceNo').value = '';
    document.getElementById('fCustomer').value = '';
    document.getElementById('fAddress').value = '';
    document.getElementById('fPhone').value = '';
    document.getElementById('fDeposit').value = 0;
    document.getElementById('fDesign').value = 0;
    document.getElementById('fPaid').value = 0;
    ITEMS_LIST.innerHTML = '';
    addItem('SUBLIMATION JERSEY ROUNDNECK S/S', 1, 40.00); // Reset item asal
    generatePreview();
}

/* --- SISTEM LOAD DARI CLOUD --- */

// 1. Fungsi untuk isi dropdown dengan senarai nama dari Google Sheet
async function populateCloudDropdown() {
    const select = document.getElementById('fLoadInvoiceSelect');
    if (!select) return;

    try {
        const response = await fetch(`${WEB_APP_URL}?action=list`);
        const invoices = await response.json();

        select.innerHTML = '<option value="">-- Pilih Invoice --</option>';
        
        invoices.reverse().forEach(inv => {
            const opt = document.createElement('option');
            opt.value = inv.token; // Guna token sebagai kunci rahsia
            opt.textContent = `${inv.invNo} - ${inv.customer}`;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Gagal ambil senarai:", e);
        select.innerHTML = '<option value="">Gagal muat data cloud</option>';
    }
}

// 2. Fungsi untuk tarik data penuh bila butang Load ditekan
async function handleLoadButtonClick() {
    const select = document.getElementById('fLoadInvoiceSelect');
    const token = select.value;

    if (!token) {
        alert("Sila pilih invoice dari senarai dahulu.");
        return;
    }

    const btn = document.getElementById('btnLoadCloud');
    btn.innerText = "Loading...";
    btn.disabled = true;

    try {
        const response = await fetch(`${WEB_APP_URL}?token=${token}`);
        const data = await response.json();
        
        if (data && data !== "Not Found") {
            // Masukkan data ke dalam borang
            document.getElementById('fInvoiceNo').value = data.invNo.replace('INV-', '');
            document.getElementById('fCustomer').value = data.customer;
            document.getElementById('fAddress').value = data.address;
            document.getElementById('fPhone').value = data.phone;
            document.getElementById('fPaymentStatus').value = data.status;
            document.getElementById('fDeposit').value = data.deposit;
            document.getElementById('fDesign').value = data.designCharge;
            document.getElementById('fPaid').value = data.paid;
            document.getElementById('fIssuedBy').value = data.issuedBy;
            document.getElementById('fAcceptedBy').value = data.acceptedBy;

            // Kosongkan item lama dan masukkan item baharu
            ITEMS_LIST.innerHTML = '';
            data.items.forEach(it => addItem(it.desc, it.qty, it.price));
            
            // Update preview di sebelah kanan
            generatePreview();
            alert("Data berjaya di-load!");
        }
    } catch (e) {
        alert("Ralat memuatkan data: " + e.message);
    } finally {
        btn.innerText = "Load Data";
        btn.disabled = false;
    }
}

// 3. Sambungkan butang dengan fungsi (PENTING!)
document.getElementById('btnLoadCloud').addEventListener('click', handleLoadButtonClick);

// Tambah event listener untuk dropdown
document.getElementById('fLoadInvoiceSelect').addEventListener('change', async (e) => {
    const token = e.target.value;
    if (token) {
        await loadInvoiceFromCloud(token);
    }
});

async function loadInvoiceFromCloud(token) {
    try {
        const response = await fetch(`${WEB_APP_URL}?token=${token}`);
        const data = await response.json();
        
        if (data && data !== "Not Found") {
            // Isi maklumat asas
            document.getElementById('fInvoiceNo').value = data.invNo.replace('INV-', '');
            document.getElementById('fCustomer').value = data.customer;
            document.getElementById('fAddress').value = data.address;
            document.getElementById('fPhone').value = data.phone;
            document.getElementById('fPaymentStatus').value = data.status;
            document.getElementById('fDeposit').value = data.deposit;
            document.getElementById('fDesign').value = data.designCharge;
            document.getElementById('fPaid').value = data.paid;
            document.getElementById('fIssuedBy').value = data.issuedBy;
            document.getElementById('fAcceptedBy').value = data.acceptedBy;

            // Kosongkan item lama dan masukkan item baharu
            ITEMS_LIST.innerHTML = '';
            data.items.forEach(it => addItem(it.desc, it.qty, it.price));
            
            // Update preview
            generatePreview();
            alert("Invoice berjaya dimuat turun!");
        }
    } catch (e) {
        alert("Gagal memuatkan data.");
    }
}

/* --- LOGIK ASAL ANDA (DIKEKALKAN) --- */

function createItemRow(desc = '', qty = 1, price = 0) {
    const wrapper = document.createElement('div');
    wrapper.className = 'item-row';
    wrapper.innerHTML = `
        <input type="text" class="i-desc" placeholder="Description" value="${desc}">
        <input type="number" class="i-qty" min="0" value="${qty}">
        <input type="number" class="i-price" min="0" step="0.01" value="${price}">
        <button type="button" class="btn remove" style="padding:6px 8px">✕</button>
    `;
    wrapper.querySelector('.remove').addEventListener('click', () => {
        wrapper.remove();
        generatePreview();
    });
    wrapper.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', generatePreview);
    });
    return wrapper;
}

function addItem(desc = '', qty = 1, price = 0) {
    ITEMS_LIST.appendChild(createItemRow(desc, qty, price));
}

function gatherItems() {
    const rows = [];
    ITEMS_LIST.querySelectorAll('.item-row').forEach(r => {
        const desc = r.querySelector('.i-desc')?.value.trim();
        const qty = parseFloat(r.querySelector('.i-qty')?.value) || 0;
        const price = parseFloat(r.querySelector('.i-price')?.value) || 0;
        if (desc || qty || price) {
            rows.push({ desc, qty, price, amount: qty * price });
        }
    });
    return rows;
}

function getInvoiceFormData() {
    const data = {};
    for (const [id, key] of Object.entries(INPUT_FIELDS)) {
        const input = document.getElementById(id);
        if (input) {
            data[key] = input.type === 'number' ? parseFloat(input.value) || 0 : input.value.trim();
        }
    }

    const invNo = `INV-${data.invoiceInput || 'TEMP'}`;
    const items = gatherItems();
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const grand = subtotal - data.deposit + data.designCharge;
    const balance = grand - data.paid;

    return { ...data, invNo, items, subtotal, grand, balance };
}

function generatePreview() {
    // 1. Ambil data terkini (sama ada dari taipan manual atau hasil LOAD dari Cloud)
    const data = getInvoiceFormData();
    
    // Destructuring data supaya pembolehubah di bawah (invNo, customer, dll) berfungsi
    const {
        invNo,
        customer,
        address,
        phone,
        status,
        paid,
        balance,
        items,
        subtotal,
        deposit,
        designCharge,
        grand,
        issuedBy,
        acceptedBy
    } = data;

    // 2. Kekalkan logik warna status asal anda
    const statusClass = `status-${status}`;

    // 3. Bina baris item (Table Rows)
    const itemsHtml = items.map((it, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${it.desc}</td>
          <td class="right">${it.qty}</td>
          <td class="right">${fmt(it.price)}</td>
          <td class="right">${fmt(it.amount)}</td>
        </tr>
    `).join('');

    // 4. Masukkan Template HTML Asal v1 anda
    INVOICE_ROOT.innerHTML = `
        <div class="header">
          <div class="logo-block">
            <img src="${LOGO_DATA_URL}" alt="logo">
            <div>
              <div class="company-name">JERSYX APPAREL</div>
              <div style="font-size:12px;" class="muted">(003771902-W)</div>
              <div style="font-size:12px; margin-top:6px" class="muted">
                No. 53, Kampung Masjid Lama,<br>
                Mukim Lepai, 05350 Alor Setar, Kedah<br>
                Phone: 011-6241 5446 | Email: jersyxapparel@gmail.com
              </div>
            </div>
          </div>
          <div class="meta">
            <div style="font-size:20px; font-weight:700;">INVOICE</div>
            <div>No. Inv: ${invNo}</div>
            <div>By: ${issuedBy}</div>
            <div class="muted">${new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </div>

        <hr class="sep">

        <div class="cust-pay">
          <div class="cust">
            <div style="font-weight:700">Customer</div>
            <div class="muted">${customer || '-'}</div>
            <div class="muted" style="margin-top:6px; white-space: pre-wrap;">${address || '-'}</div>
            <div class="muted" style="margin-top:6px">${phone || '-'}</div>
          </div>
          <div class="pay">
            <div style="font-weight:700">Payment Status</div>
            <div class="${statusClass}" style="font-size:20px; font-weight:700; margin-top:6px">${status}</div>
            <div style="margin-top:6px" class="muted"><strong>Total Paid:</strong> RM ${fmt(paid)}</div>
            <div style="margin-top:6px" class="muted"><strong>Balance:</strong> RM ${fmt(balance)}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width:6%">#</th>
              <th>Description</th>
              <th style="width:12%" class="right">Qty</th>
              <th style="width:15%" class="right">Unit (RM)</th>
              <th style="width:15%" class="right">Amount (RM)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr><td class="muted">Subtotal</td><td class="right">${fmt(subtotal)}</td></tr>
            <tr><td class="muted">Deposit</td><td class="right">-${fmt(deposit)}</td></tr>
            <tr><td class="muted">Design Charge</td><td class="right">${fmt(designCharge)}</td></tr>
            <tr><td style="font-weight:700; padding-top:8px">Grand Total</td><td class="right" style="font-weight:700; padding-top:8px">RM ${fmt(grand)}</td></tr>
          </table>
        </div>

        <div class="footer" style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div class="footer-column" style="width:48%; text-align:left; margin-left:30px;">
            <p>Issued By:</p>
            <div class="stamp">
              <img src="${STAMP_DATA_URL}" alt="Company Stamp">
            </div>
          </div>
          <div class="footer-column" style="width:48%; text-align:right; margin-right:80px;">
            <p>Accepted By:</p>
            <p>${acceptedBy}</p>
            <br>
          </div>
        </div>
    `;
}

function clearInvoice() {
    window.location.reload();
}

/* --- EVENT LISTENERS --- */
document.getElementById('addItemBtn').addEventListener('click', () => { addItem(); generatePreview(); });
document.getElementById('btnSave').addEventListener('click', saveToCloud);
document.getElementById('btnClear').addEventListener('click', deleteInvoice); // Ganti Clear dengan Delete
document.getElementById('btnGenerate').addEventListener('click', generatePreview);
document.getElementById('btnGenerate2').addEventListener('click', generatePreview);
document.getElementById('btnPrint').addEventListener('click', () => window.print());

// Initial Item
addItem('SUBLIMATION JERSEY ROUNDNECK S/S', 1, 40.00);