#!/usr/bin/env node
// preview-server.js - serwer podglądu komponentu

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Pobranie portu i ścieżki do komponentu z argumentów
const args = process.argv.slice(2);
let componentPath = '';
let port = 3010;

// Parsowanie argumentów
args.forEach(arg => {
    if (arg.startsWith('--port=')) {
        port = parseInt(arg.split('=')[1], 10);
    } else if (!arg.startsWith('--')) {
        componentPath = arg;
    }
});

// Sprawdzenie czy ścieżka do komponentu została podana
if (!componentPath) {
    console.error('Error: Component path is required');
    console.error('Usage: node preview-server.js [componentPath] [--port=3010]');
    process.exit(1);
}

// Sprawdzenie czy plik istnieje
if (!fs.existsSync(componentPath)) {
    console.error(`Error: Component file not found: ${componentPath}`);
    process.exit(1);
}

// Utworzenie aplikacji Express
const app = express();
app.use(cors({ origin: '*' }));

// Ścieżka do pliku HTML z podglądem
const fallbackHtmlPath = path.join(__dirname, 'public', 'preview-fallback.html');

// Funkcja do czytania zawartości komponentu
function getComponentSource() {
    try {
        return fs.readFileSync(componentPath, 'utf8');
    } catch (error) {
        console.error(`Error reading component: ${error.message}`);
        return `// Error reading component: ${error.message}`;
    }
}

// Główna trasa - serwowanie HTML z podglądem
app.get('/', (req, res) => {
    if (fs.existsSync(fallbackHtmlPath)) {
        // Jeśli istnieje plik fallback HTML, użyj go
        res.sendFile(fallbackHtmlPath);
    } else {
        // Jeśli nie ma pliku fallback, generuj HTML
        const componentSource = getComponentSource();

        // Prosty HTML fallback z wyświetleniem kodu i interaktywnym licznikiem
        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReactStream Preview</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1, h2 {
            color: #333;
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            background-color: #d4edda;
            border-left: 4px solid #28a745;
        }
        .code {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #ddd;
            overflow: auto;
            margin: 15px 0;
            font-family: monospace;
            white-space: pre-wrap;
        }
        .tabs {
            display: flex;
            border-bottom: 1px solid #ddd;
            margin-top: 20px;
        }
        .tab {
            padding: 8px 16px;
            cursor: pointer;
            background: none;
            border: none;
        }
        .tab.active {
            border-bottom: 2px solid #007bff;
            font-weight: bold;
        }
        .tab-content {
            display: none;
            padding: 15px;
            border: 1px solid #ddd;
            border-top: none;
        }
        .tab-content.active {
            display: block;
        }
        .demo-component {
            text-align: center;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background-color: #fafafa;
            margin: 20px 0;
        }
        button.counter {
            padding: 8px 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        button.counter:hover {
            background-color: #45a049;
        }
        button.refresh {
            padding: 6px 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        button.refresh:hover {
            background-color: #0069d9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ReactStream Preview</h1>
        
        <div class="status" id="status">
            Komponent załadowany w trybie zastępczym
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="openTab('preview')">Podgląd</button>
            <button class="tab" onclick="openTab('code')">Kod źródłowy</button>
            <button class="tab" onclick="openTab('info')">Informacje</button>
        </div>
        
        <div id="preview" class="tab-content active">
            <h2>Podgląd komponentu</h2>
            <div class="demo-component">
                <h3>Przykładowy komponent</h3>
                <p>To jest przykładowy komponent wyświetlany w trybie zastępczym.</p>
                <p>Edytuj kod w edytorze i kliknij "Update Preview" aby zobaczyć zmiany.</p>
                <button class="counter" id="counterBtn">Licznik: 0</button>
            </div>
        </div>
        
        <div id="code" class="tab-content">
            <h2>Kod komponentu</h2>
            <div>
                <button class="refresh" onclick="refreshCode()">Odśwież kod</button>
            </div>
            <pre class="code" id="codeDisplay">${componentSource.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
        
        <div id="info" class="tab-content">
            <h2>Informacje</h2>
            <p>Aktualnie przeglądasz komponent w trybie zastępczym (fallback). Pełna funkcjonalność ReactStream nie jest dostępna.</p>
            <p><strong>Szczegóły komponentu:</strong></p>
            <ul>
                <li>Ścieżka: ${componentPath}</li>
                <li>Rozmiar: ${fs.statSync(componentPath).size} bajtów</li>
                <li>Ostatnia modyfikacja: ${fs.statSync(componentPath).mtime.toLocaleString()}</li>
            </ul>
            <p><strong>Wskazówka:</strong> Aby zobaczyć zmiany w komponencie, kliknij przycisk "Update Preview" w głównym interfejsie aplikacji.</p>
        </div>
    </div>
    
    <script>
        // Licznik kliknięć
        let counter = 0;
        const counterBtn = document.getElementById('counterBtn');
        counterBtn.addEventListener('click', function() {
            counter++;
            this.innerText = 'Licznik: ' + counter;
            
            if (counter >= 10) {
                document.getElementById('status').innerText = 'Gratulacje! Osiągnięto 10 kliknięć!';
            }
        });
        
        // Przełączanie zakładek
        function openTab(tabName) {
            // Ukryj wszystkie zakładki
            const tabContents = document.getElementsByClassName('tab-content');
            for (let i = 0; i < tabContents.length; i++) {
                tabContents[i].classList.remove('active');
            }
            
            // Usuń aktywną klasę z przycisków
            const tabs = document.getElementsByClassName('tab');
            for (let i = 0; i < tabs.length; i++) {
                tabs[i].classList.remove('active');
            }
            
            // Pokaż wybraną zakładkę
            document.getElementById(tabName).classList.add('active');
            
            // Aktywuj przycisk
            const activeButton = document.querySelector('.tab[onclick="openTab(\\''+tabName+'\\')"]');
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
        
        // Odświeżanie kodu
        function refreshCode() {
            fetch('/component-source')
                .then(response => response.text())
                .then(data => {
                    document.getElementById('codeDisplay').innerText = data;
                    document.getElementById('status').innerText = 'Kod został odświeżony';
                })
                .catch(error => {
                    document.getElementById('status').innerText = 'Błąd podczas odświeżania kodu: ' + error.message;
                });
        }
        
        // Automatyczne odświeżanie kodu co 10 sekund
        setInterval(refreshCode, 10000);
    </script>
</body>
</html>
        `);
    }
});

// Endpoint zwracający kod komponentu
app.get('/component-source', (req, res) => {
    try {
        const source = getComponentSource();
        res.setHeader('Content-Type', 'text/plain');
        res.send(source);
    } catch (error) {
        res.status(500).send(`Error reading component: ${error.message}`);
    }
});

// Endpoint do sprawdzenia statusu
app.get('/status', (req, res) => {
    try {
        const stats = fs.statSync(componentPath);

        res.setHeader('Content-Type', 'application/json');
        res.json({
            status: 'ok',
            component: {
                path: componentPath,
                size: stats.size,
                modified: stats.mtime,
                exists: true
            },
            server: {
                timestamp: new Date().toISOString(),
                port: port,
                fallback_html_exists: fs.existsSync(fallbackHtmlPath)
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Endpoint dla monitorowania zmian (polling)
app.get('/watch', (req, res) => {
    const lastModified = req.query.lastModified || 0;

    try {
        const stats = fs.statSync(componentPath);
        const currentModified = stats.mtimeMs;

        res.setHeader('Content-Type', 'application/json');
        res.json({
            changed: currentModified > lastModified,
            lastModified: currentModified
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Uruchomienie serwera
app.listen(port, () => {
    console.log(`Preview server running at http://localhost:${port}`);
    console.log(`Serving component: ${componentPath}`);

    // Informacja o pliku fallback
    if (fs.existsSync(fallbackHtmlPath)) {
        console.log(`Using fallback HTML from: ${fallbackHtmlPath}`);
    } else {
        console.log('Using generated HTML (fallback HTML not found)');
    }
});
