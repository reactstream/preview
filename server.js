#!/usr/bin/env node
// preview/server.js - serwer podglądu komponentu

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

// Pobranie portu i ścieżki do komponentu z argumentów
const args = process.argv.slice(2);
let componentPath = '';
let port = process.env.PREVIEW_PORT || 3010;

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
    console.error('Usage: node server.js [componentPath] [--port=3010]');
    process.exit(1);
}

// Normalizacja ścieżki komponentu
componentPath = path.resolve(componentPath);

// Sprawdzenie czy plik istnieje
if (!fs.existsSync(componentPath)) {
    console.error(`Error: Component file not found: ${componentPath}`);
    process.exit(1);
}

// Utworzenie aplikacji Express
const app = express();
app.use(cors({ origin: '*' }));

// Serwowanie plików statycznych z katalogu public
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint API do odczytu kodu komponentu
app.get('/api/component-source', (req, res) => {
    try {
        const source = fs.readFileSync(componentPath, 'utf8');
        res.setHeader('Content-Type', 'text/plain');
        res.send(source);
    } catch (error) {
        res.status(500).send(`Error reading component: ${error.message}`);
    }
});

// Endpoint API do zapisu kodu komponentu
app.post('/api/component-source', express.json(), (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'No code provided'
            });
        }

        fs.writeFileSync(componentPath, code, 'utf8');

        res.json({
            success: true,
            message: 'Component updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error updating component: ${error.message}`
        });
    }
});

// Endpoint API do sprawdzenia statusu
app.get('/api/status', (req, res) => {
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
                port: port
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Główna trasa - serwowanie HTML z podglądem
app.get('/', (req, res) => {
    // Ścieżka do pliku HTML z podglądem
    const fallbackHtmlPath = path.join(__dirname, 'public', 'preview-fallback.html');

    // Sprawdź czy plik fallback istnieje
    if (fs.existsSync(fallbackHtmlPath)) {
        res.sendFile(fallbackHtmlPath);
    } else {
        // Wygeneruj prosty HTML fallback w locie
        const componentSource = fs.existsSync(componentPath)
            ? fs.readFileSync(componentPath, 'utf8')
            : '// Component file not found';

        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Preview</title>
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
        .demo-component {
            text-align: center;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background-color: #fafafa;
            margin: 20px 0;
        }
        button {
            padding: 8px 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Component Preview</h1>
        
        <div class="status" id="status">
            Component loaded in fallback mode
        </div>
        
        <div class="demo-component">
            <h2>Sample Component Preview</h2>
            <p>This is a sample component displayed in fallback mode.</p>
            <p>Edit the code in the editor and click "Update Preview" to see changes.</p>
            <button id="counterBtn">Counter: 0</button>
        </div>
        
        <h2>Component Source:</h2>
        <pre class="code">${componentSource.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
    
    <script>
        // Add simple interactivity to the counter button
        let counter = 0;
        const counterBtn = document.getElementById('counterBtn');
        counterBtn.addEventListener('click', function() {
            counter++;
            this.innerText = 'Counter: ' + counter;
            
            if (counter >= 10) {
                document.getElementById('status').innerText = 'Congratulations! You reached 10 clicks!';
            }
        });
        
        // Auto-refresh the component source every 5 seconds
        setInterval(() => {
            fetch('/api/component-source')
                .then(response => response.text())
                .then(data => {
                    document.querySelector('.code').innerText = data;
                    document.getElementById('status').innerText = 'Component source refreshed at ' + new Date().toLocaleTimeString();
                })
                .catch(error => {
                    console.error('Error refreshing component source:', error);
                });
        }, 5000);
    </script>
</body>
</html>
        `);
    }
});

// Catch-all route dla pozostałych tras
app.get('*', (req, res) => {
    res.redirect('/');
});

// Uruchomienie serwera
app.listen(port, () => {
    console.log(`Preview server running at http://localhost:${port}`);
    console.log(`Serving component: ${componentPath}`);
});
