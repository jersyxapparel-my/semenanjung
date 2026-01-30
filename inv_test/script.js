/* --- Utility Function --- */
function fmt(n) {
    return Number(n || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/* --- Constants & DOM Elements --- */
const ITEMS_LIST = document.getElementById('itemsList');
const INVOICE_ROOT = document.getElementById('invoiceRoot');
const LOAD_SELECT = document.getElementById('fLoadInvoiceSelect'); // NEW: Load dropdown element
const LOGO_DATA_URL = 'https://i.postimg.cc/BQ23Nf9X/logo-jersyx-01.png';
const STAMP_DATA_URL = 'https://i.postimg.cc/JhLhF5xc/SIGN-RARA-JA-01.png';

// Input fields map for easier data gathering
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

/* --- Item Row Management --- */

/**
 * Creates a new item row element.
 * @param {string} desc - Item description.
 * @param {number} qty - Item quantity.
 * @param {number} price - Item unit price.
 * @returns {HTMLDivElement} - The created item row.
 */
function createItemRow(desc = '', qty = 1, price = 0) {
    const wrapper = document.createElement('div');
    wrapper.className = 'item-row';
    wrapper.dataset.id = Date.now() + Math.floor(Math.random() * 1000);
    wrapper.innerHTML = `
        <input type="text" class="i-desc" placeholder="Description" value="${desc}">
        <input type="number" class="i-qty" min="0" value="${qty}">
        <input type="number" class="i-price" min="0" step="0.01" value="${price}">
        <button type="button" class="btn remove" title="Remove" style="padding:6px 8px">✕</button>
    `;
    wrapper.querySelector('.remove').addEventListener('click', () => {
        wrapper.remove();
        generatePreview(); // NEW: Refresh preview after removing item
    });
    // NEW: Refresh preview when input changes
    wrapper.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', generatePreview);
    });
    return wrapper;
}

/**
 * Adds an item row to the list.
 */
function addItem(desc = '', qty = 1, price = 0) {
    ITEMS_LIST.appendChild(createItemRow(desc, qty, price));
    // Scroll to bottom of list
    ITEMS_LIST.scrollTop = ITEMS_LIST.scrollHeight;
}

/**
 * Gathers item data from the DOM.
 * @returns {Array<Object>} - List of item objects.
 */
function gatherItems() {
    const rows = [];
    ITEMS_LIST.querySelectorAll('.item-row').forEach(r => {
        const desc = r.querySelector('.i-desc')?.value.trim();
        const qty = parseFloat(r.querySelector('.i-qty')?.value) || 0;
        const price = parseFloat(r.querySelector('.i-price')?.value) || 0;
        if (desc || qty || price) {
            rows.push({
                desc,
                qty,
                price,
                amount: qty * price
            });
        }
    });
    return rows;
}

/* --- Invoice Data Handling --- */

/**
 * Gathers all invoice form data into a single object.
 * @returns {Object} - Invoice data.
 */
function getInvoiceFormData() {
    const data = {};
    for (const [id, key] of Object.entries(INPUT_FIELDS)) {
        const input = document.getElementById(id);
        if (input) {
            data[key] = input.type === 'number' || id === 'fDeposit' || id === 'fDesign' || id === 'fPaid' ?
                parseFloat(input.value) || 0 :
                input.value.trim();
        }
    }

    let {
        invoiceInput,
        deposit,
        designCharge,
        paid
    } = data;

    // Auto-generate invoice number suffix if empty
    if (invoiceInput === '') {
        invoiceInput = new Date().getTime().toString().slice(-4);
    }
    const invNo = `INV-${invoiceInput}`;

    const items = gatherItems();
    let subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const grand = subtotal - deposit + designCharge;
    const balance = grand - paid;

    return {
        ...data,
        invNo,
        items,
        subtotal,
        grand,
        balance,
        // Provide defaults for display if form fields are missing or empty
        customer: data.customer || '-',
        address: data.address || '-',
        phone: data.phone || '-',
        status: data.status || 'Partial',
        issuedBy: data.issuedBy || 'Jersyx - Rara',
        acceptedBy: data.acceptedBy || '',
    };
}

/**
 * Clears all invoice form fields.
 */
function clearInvoice() {
    document.getElementById('fInvoiceNo').value = '';
    document.getElementById('fCustomer').value = '';
    document.getElementById('fAddress').value = '';
    document.getElementById('fPhone').value = '';
    document.getElementById('fPaymentStatus').value = 'Partial';
    document.getElementById('fDeposit').value = 0;
    document.getElementById('fDesign').value = 0;
    document.getElementById('fPaid').value = 0;
    document.getElementById('fIssuedBy').value = 'Jersyx - Rara';
    document.getElementById('fAcceptedBy').value = '';
    ITEMS_LIST.innerHTML = '';
    addItem(); // Add one initial empty row
    generatePreview();
}

/* --- Save & Load --- */

/**
 * NEW: Populates the load invoice dropdown with keys from localStorage.
 */
function populateLoadDropdown() {
    LOAD_SELECT.innerHTML = '<option value="">Load Existing Invoice...</option>';
    let keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('INV-')) {
            keys.push(key);
        }
    }
    keys.sort().forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        LOAD_SELECT.appendChild(option);
    });
    // Show select element only if there are saved invoices
    LOAD_SELECT.style.display = keys.length > 0 ? 'block' : 'none';
    document.getElementById('btnLoadDropdown').style.display = keys.length > 0 ? 'inline-flex' : 'none';
}

/**
 * Saves the current invoice data to localStorage.
 */
function saveInvoice() {
    const {
        invNo,
        customer,
        address,
        phone,
        status,
        deposit,
        designCharge,
        paid,
        issuedBy,
        acceptedBy,
        items
    } = getInvoiceFormData();

    if (invNo === 'INV-') {
        alert('Invoice number cannot be empty.');
        return;
    }

    const invoiceData = {
        customer,
        address,
        phone,
        status,
        deposit,
        designCharge,
        paid,
        issuedBy,
        acceptedBy,
        items
    };

    try {
        localStorage.setItem(invNo, JSON.stringify(invoiceData));
        alert(`Invoice ${invNo} successfully saved!`);
        populateLoadDropdown(); // NEW: Refresh dropdown after saving
    } catch (error) {
        console.error("Save failed:", error);
        alert('Failed to save invoice!');
    }
}

/**
 * Loads an invoice from localStorage and populates the form.
 * @param {string} invNo - The full invoice number (e.g., 'INV-0001').
 */
function loadInvoice(invNo) {
    const data = localStorage.getItem(invNo);
    if (!data) {
        alert(`Invoice ${invNo} not found!`);
        return;
    }
    const invoiceData = JSON.parse(data);

    // Populate form fields
    const invoiceSuffix = invNo.replace('INV-', '');
    document.getElementById('fInvoiceNo').value = invoiceSuffix;
    document.getElementById('fCustomer').value = invoiceData.customer;
    document.getElementById('fAddress').value = invoiceData.address;
    document.getElementById('fPhone').value = invoiceData.phone;
    document.getElementById('fPaymentStatus').value = invoiceData.status;
    document.getElementById('fDeposit').value = invoiceData.deposit;
    document.getElementById('fDesign').value = invoiceData.designCharge;
    document.getElementById('fPaid').value = invoiceData.paid;
    document.getElementById('fIssuedBy').value = invoiceData.issuedBy;
    document.getElementById('fAcceptedBy').value = invoiceData.acceptedBy;

    // Recreate item rows
    ITEMS_LIST.innerHTML = '';
    if (invoiceData.items && invoiceData.items.length > 0) {
        invoiceData.items.forEach(item => {
            addItem(item.desc, item.qty, item.price);
        });
    } else {
        addItem(); // Ensure at least one row exists
    }

    // NEW: Reset dropdown to default and hide it
    LOAD_SELECT.value = '';
    
    generatePreview(); // Refresh preview
}

/* --- Generation & Rendering --- */

/**
 * Generates the HTML preview of the invoice.
 */
function generatePreview() {
    const data = getInvoiceFormData();
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

    // NEW: Dynamic class for payment status
    const statusClass = `status-${status}`;

    const itemsHtml = items.map((it, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${it.desc}</td>
          <td class="right">${it.qty}</td>
          <td class="right">${fmt(it.price)}</td>
          <td class="right">${fmt(it.amount)}</td>
        </tr>
    `).join('');

    INVOICE_ROOT.innerHTML = `
        <div class="header">
          <div class="logo-block">
            <img src="${LOGO_DATA_URL}" alt="logo">
            <div>
              <div class="company-name">JERSYX APPAREL</div>
              <div style="font-size:12px; class="muted">(003771902-W)</div>
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
            <div class="muted">${customer}</div>
            <div class="muted" style="margin-top:6px">${address}</div>
            <div class="muted" style="margin-top:6px">${phone}</div>
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

/**
 * Handles PDF generation using html2canvas and jspdf.
 */
async function generatePdf() {
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        alert('Error: html2canvas or jspdf library not loaded. Cannot generate PDF.');
        return;
    }
    
    generatePreview();
    const node = INVOICE_ROOT;
    const topbar = document.querySelector('.topbar');
    const oldDisplay = topbar ? topbar.style.display : 'block';

    if (topbar) topbar.style.display = 'none';

    try {
        const canvas = await html2canvas(node, {
            scale: 2,
            useCORS: true
        });
        const imgData = canvas.toDataURL('image/png');

        const {
            jsPDF
        } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210,
            pageHeight = 297;
        const imgWidth = pageWidth,
            imgHeight = (canvas.height * imgWidth) / canvas.width;
        let position = 0,
            heightLeft = imgHeight;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = -(imgHeight - heightLeft);
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
            heightLeft -= pageHeight;
        }

        const inv = document.getElementById('fInvoiceNo').value.trim() || 'INV';
        pdf.save(`INV-${inv}.pdf`);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        alert('An error occurred during PDF generation.');
    } finally {
        if (topbar) topbar.style.display = oldDisplay;
    }
}

/* --- Initialization & Event Listeners --- */

// Initial item
addItem('SUBLIMATION JERSEY ROUNDNECK S/S', 1, 40.00);

// Add item button
document.getElementById('addItemBtn').addEventListener('click', () => {
    addItem();
    generatePreview(); // Refresh preview when a new row is added
});

// NEW: Event listener for Load dropdown change
LOAD_SELECT.addEventListener('change', (e) => {
    const invNo = e.target.value;
    if (invNo) {
        loadInvoice(invNo);
    }
});

// OLD: Remove btnLoad listener and use dropdown instead, but keep the input based loading logic for fInvoiceNo
// document.getElementById('btnLoad').addEventListener('click', () => {
//     const invInput = document.getElementById('fInvoiceNo').value;
//     if (invInput) {
//         loadInvoice(`INV-${invInput}`);
//     } else {
//         alert('Please enter an Invoice Number to load.');
//     }
// });

// Clear button
document.getElementById('btnClear').addEventListener('click', clearInvoice);

// Save button
document.getElementById('btnSave').addEventListener('click', saveInvoice);

// Generate Preview buttons (consolidated) and change listeners for form fields
function setupFormListeners() {
    document.getElementById('btnGenerate').addEventListener('click', generatePreview);
    document.getElementById('btnGenerate2').addEventListener('click', generatePreview);

    // Add change listeners to all primary form fields to update preview automatically
    Object.keys(INPUT_FIELDS).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', generatePreview);
        }
    });
}

// Print button
document.getElementById('btnPrint').addEventListener('click', () => {
    generatePreview();
    window.print();
});

// PDF button
document.getElementById('btnPdf').addEventListener('click', generatePdf);

// Initial setup on load
setupFormListeners();
populateLoadDropdown(); // NEW: Load dropdown items on page load
generatePreview();