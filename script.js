// 1. DATA HARGA
const dataAdultSemenanjung = [
    { type: "Round Neck", short: "RM 35", long: "RM 38" },
    { type: "V-Neck", short: "RM 38", long: "RM 41" },
    { type: "V-Neck No End", short: "RM 38", long: "RM 41" },
    { type: "Polo", short: "RM 39", long: "RM 42" },
    { type: "Polo Zipped", short: "RM 40", long: "RM 43" },
    { type: "Mandarin", short: "RM 39", long: "RM 42" },
    { type: "Mandarin Zipped", short: "RM 40", long: "RM 43" },
    { type: "Retro", short: "RM 40", long: "RM 43" },
    { type: "NFL V-Neck", short: "RM 40", long: "RM 43" },
    { type: "NFL No End", short: "RM 40", long: "RM 43" },
    { type: "Muslimah", short: "-", long: "RM 45" }
];

const dataAdultBorneo = [
    { type: "Round Neck", short: "RM 40", long: "RM 43" },
    { type: "V-Neck", short: "RM 43", long: "RM 44" },
    { type: "V-Neck No End", short: "RM 43", long: "RM 44" },
    { type: "Polo", short: "RM 44", long: "RM 45" },
    { type: "Polo Zipped", short: "RM 45", long: "RM 46" },
    { type: "Mandarin", short: "RM 44", long: "RM 45" },
    { type: "Mandarin Zipped", short: "RM 45", long: "RM 46" },
    { type: "Retro", short: "RM 45", long: "RM 46" },
    { type: "NFL V-Neck", short: "RM 45", long: "RM 46" },
    { type: "NFL No End", short: "RM 45", long: "RM 46" },
    { type: "Muslimah", short: "-", long: "RM 50" }
];

const dataKidsSemenanjung = [
    { type: "Round Neck", short: "RM 27", long: "RM 30" },
    { type: "Polo", short: "RM 30", long: "RM 33" },
    { type: "Muslimah", short: "-", long: "RM 35" }
];

const dataKidsBorneo = [
    { type: "Round Neck", short: "RM 30", long: "RM 33" },
    { type: "Polo", short: "RM 33", long: "RM 36" },
    { type: "Muslimah", short: "-", long: "RM 38" }
];

const dataAddOns = [
    { name: "Nameset Biasa", price: "+ RM 2.00" },
    { name: "Nameset Jawi", price: "+ RM 3.00" },
    { name: "Extra Size 3XL - 5XL", price: "+ RM 3.00" },
    { name: "Extra Size 6XL - 8XL", price: "+ RM 5.00" }
];

const dataAddOnsKids = [
    { name: "Nameset Biasa", price: "+ RM 2.00" },
    { name: "Nameset Jawi", price: "+ RM 3.00" },
    { name: "Extra Size 3XL - 5XL", price: "+ RM 3.00" },
    { name: "Extra Size 6XL - 8XL", price: "+ RM 5.00" }
];

const dataAddOnsPostage = [
    { name: "1pcs - 5pcs", price: "  RM 8.00" },
    { name: "6pcs - 10pcs", price: "  RM 10.00" },
    { name: "11pcs - 14pcs", price: "  RM 14.00" },
    { name: "15pcs - 200pcs", price: "  RM 1.00/pcs" }
];

const dataAddOnsPostageKids = [
    { name: "1pcs - 5pcs", price: " RM 8.00" },
    { name: "6pcs - 10pcs", price: " RM 10.00" },
    { name: "11pcs - 14pcs", price: " RM 14.00" },
    { name: "15pcs - 200pcs", price: " RM 1.00/pcs" }
];

// 2. FUNGSI PILIH LOKASI
// DATA TETAP SAMA (dataAdultSemenanjung, dan lain-lain...) [CITE: script.js]

function initSemenanjung() {
    // Gunakan data Semenanjung secara tetap
    const adultData = dataAdultSemenanjung;
    const kidsData = dataKidsSemenanjung;

    // Isi Tabel Dewasa
    document.getElementById('tableAdult').innerHTML = adultData.map(item => `
        <tr><td>${item.type}</td><td>${item.short}</td><td>${item.long}</td></tr>
    `).join('');

    // Isi Tabel Kids
    document.getElementById('tableKids').innerHTML = kidsData.map(item => `
        <tr><td>${item.type}</td><td>${item.short}</td><td>${item.long}</td></tr>
    `).join('');

    // Isi Tabel Add-on & Postage
    document.getElementById('tableAddOn').innerHTML = dataAddOns.map(item => `
        <tr><td style="text-align:left">${item.name}</td><td style="color:var(--secondary)">${item.price}</td></tr>
    `).join('');

    document.getElementById('tableAddOnKids').innerHTML = dataAddOnsKids.map(item => `
        <tr><td style="text-align:left">${item.name}</td><td style="color:var(--secondary)">${item.price}</td></tr>
    `).join('');

    document.getElementById('tableAddOnPostage').innerHTML = dataAddOnsPostage.map(item => `
        <tr><td style="text-align:left">${item.name}</td><td style="color:var(--secondary)">${item.price}</td></tr>
    `).join('');

    document.getElementById('tableAddOnPostageKids').innerHTML = dataAddOnsPostageKids.map(item => `
        <tr><td style="text-align:left">${item.name}</td><td style="color:var(--secondary)">${item.price}</td></tr>
    `).join('');
}


// 3. FUNGSI SLIDER (KE KANAN/KIRI)
function slideSection(category) {
    const slider = document.getElementById('sliderContent');
    const btnA = document.getElementById('btnAdult');
    const btnK = document.getElementById('btnKids');

    if (category === 'adult') {
        slider.style.transform = 'translateX(0%)';
        btnA.classList.add('active');
        btnK.classList.remove('active');
    } else {
        slider.style.transform = 'translateX(-50%)';
        btnK.classList.add('active');
        btnA.classList.remove('active');
    }
}

function goBack() {
    const locSection = document.getElementById('locationSection');
    const priceSection = document.getElementById('priceListSection');

    // 1. Price List jatuh ke bawah dan hilang
    priceSection.classList.add('exit-down');

    setTimeout(() => {
        // 2. Sembunyikan Price List sepenuhnya
        priceSection.style.display = 'none';
        priceSection.classList.remove('show', 'exit-down');

        // 3. Reset keadaan Location Section
        // Buang class 'exit-up' supaya ia tak duduk kat atas lagi
        locSection.classList.remove('exit-up');
        
        // Letakkan ia di atas (invisible) sebelum kita tarik turun
        locSection.classList.add('prepare-from-top');
        locSection.style.display = 'block'; // PASTIKAN INI ADA

        // 4. Tarik turun ke kedudukan asal
        setTimeout(() => {
            locSection.classList.remove('prepare-from-top');
        }, 50);
        
    }, 600); // Masa tunggu animasi priceSection selesai
}