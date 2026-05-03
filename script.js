let jwtToken = "";
let myChart = null;
let globalData = [];
let sortDirection = 1;

// Funkcja sterująca ekranem ładowania
function toggleLoader(show, text = "Ładowanie...") {
    const loader = document.getElementById("loaderOverlay");
    document.getElementById("loaderText").innerText = text;
    if (show) {
        loader.classList.remove("hidden");
    } else {
        loader.classList.add("hidden");
    }
}

// Funkcja sterująca błędami logowania
function showError(msg) {
    const errorBox = document.getElementById("errorBox");
    if (msg) {
        errorBox.innerText = msg;
        errorBox.classList.remove("hidden");
    } else {
        errorBox.classList.add("hidden");
    }
}

async function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    showError("");

    toggleLoader(true, "Autoryzacja użytkownika...");
    try {
        const response = await fetch(`http://127.0.0.1:8000/login?username=${user}&password=${pass}`, { method: "POST" });
        if (response.ok) {
            const data = await response.json();
            jwtToken = data.access_token;
            document.getElementById("loginSection").classList.add("hidden");
            document.getElementById("dataSection").classList.remove("hidden");
        } else {
            showError("Błąd: Nieprawidłowy login lub hasło!");
        }
    } catch (e) {
        showError("Błąd krytyczny: Brak połączenia z serwerem. Czy kontener Docker/skrypt Python jest włączony?");
    } finally {
        toggleLoader(false);
    }
}

async function integrateData() {
    toggleLoader(true, "Pobieranie i integrowanie danych z Banku Światowego...\nTo może potrwać do 10 sekund.");
    try {
        const response = await fetch("http://127.0.0.1:8000/integrate-data", { method: "GET" });
        if (response.ok) {
            alert("✅ Pełny sukces! Dane zostały poprawnie pobrane i zapisane w bazie SQLite.");
        } else {
            alert("❌ Błąd Serwera: Wystąpił problem podczas przetwarzania danych.");
        }
    } catch (e) {
        alert("❌ Błąd krytyczny: Utracono połączenie z serwerem.");
    } finally {
        toggleLoader(false);
    }
}

async function fetchData() {
    toggleLoader(true, "Pobieranie danych z bazy i generowanie wykresów...");
    try {
        const response = await fetch("http://127.0.0.1:8000/export-data", {
            method: "GET",
            headers: { "Authorization": jwtToken }
        });

        if (response.ok) {
            globalData = await response.json();
            if (globalData.length === 0) {
                alert("⚠️ UWAGA: Baza SQLite jest pusta!\nWykonaj najpierw Krok 1 (żółty przycisk), aby ją zasilić.");
                return;
            }

            drawChart(globalData);
            drawTable(globalData);
            document.getElementById("tableContainer").classList.remove("hidden");
        } else {
            alert("🔒 Odmowa dostępu: Twój token JWT wygasł lub jest nieprawidłowy. Zaloguj się ponownie.");
            logout();
        }
    } catch (e) {
        alert("❌ Wystąpił błąd podczas komunikacji z bazą danych.");
    } finally {
        toggleLoader(false);
    }
}

function sortTable(column) {
    globalData.sort((a, b) => {
        let valA = a[column] !== null ? a[column] : "";
        let valB = b[column] !== null ? b[column] : "";
        if (valA < valB) return -1 * sortDirection;
        if (valA > valB) return 1 * sortDirection;
        return 0;
    });
    sortDirection *= -1;
    drawTable(globalData);
}

function drawChart(dataArray) {
    if (myChart) myChart.destroy();

    const data2019 = dataArray.filter(row => row.year === 2019 && row.gdp && row.broadband_subs);
    const labels = data2019.map(row => row.country_name);
    const internetData = data2019.map(row => row.broadband_subs);
    const gdpData = data2019.map(row => row.gdp);

    const ctx = document.getElementById('myChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Internet (na 100 osób)',
                    data: internetData,
                    backgroundColor: 'rgba(54, 162, 235, 0.85)',
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'PKB (USD)',
                    data: gdpData,
                    backgroundColor: 'rgba(255, 99, 132, 0.85)',
                    borderRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { font: { family: 'Inter', size: 13 } } }
            },
            scales: {
                x: { ticks: { font: { family: 'Inter' } } },
                y: {
                    type: 'linear', display: true, position: 'left',
                    title: { display: true, text: 'Ilość łączy', font: { family: 'Inter', weight: 'bold' } },
                    ticks: { font: { family: 'Inter' } }
                },
                y1: {
                    type: 'linear', display: true, position: 'right',
                    title: { display: true, text: 'PKB w USD', font: { family: 'Inter', weight: 'bold' } },
                    grid: { drawOnChartArea: false },
                    ticks: { font: { family: 'Inter' } }
                }
            }
        }
    });
}

function drawTable(dataArray) {
    const tableBody = document.querySelector("#dataTable tbody");
    tableBody.innerHTML = "";

    dataArray.forEach(row => {
        const tr = document.createElement("tr");
        const popFormatted = row.population ? row.population.toLocaleString('pl-PL') : "Brak";
        const gdpFormatted = row.gdp ? "$ " + row.gdp.toLocaleString('pl-PL') : "Brak";
        const netFormatted = row.broadband_subs ? row.broadband_subs.toFixed(2) : "Brak";

        tr.innerHTML = `
            <td>${row.country_name} (${row.country_code})</td>
            <td style="text-align: center;">${row.year}</td>
            <td>${netFormatted}</td>
            <td>${popFormatted}</td>
            <td>${gdpFormatted}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function logout() {
    jwtToken = "";
    globalData = [];
    document.getElementById("username").value = "admin";
    document.getElementById("password").value = "admin";
    document.getElementById("loginSection").classList.remove("hidden");
    document.getElementById("dataSection").classList.add("hidden");
    document.getElementById("tableContainer").classList.add("hidden");
    showError("");
    if (myChart) myChart.destroy();
}