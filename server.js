const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    let extname = String(path.extname(filePath)).toLowerCase();
    let mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.svg': 'application/image/svg+xml'
    };

    let contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                fs.readFile('./404.html', function(error, content) {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            }
            else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                res.end();
            }
        }
        else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });

});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

/////

const mqtt = require('mqtt');
const WebSocket = require('ws');

// Replace with your MQTT broker's URL
const brokerUrl = 'mqtt://0.0.0.0:1883';
const topic = 'command/text';
const username = 'admin';
const password = 'hivemq';

// Connect to the MQTT broker with authentication
const mqttClient = mqtt.connect(brokerUrl, {
    username: username,
    password: password
});

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
});

mqttClient.on('error', (err) => {
    console.error('MQTT connection error:', err);
});

// Set up WebSocket server
const wss = new WebSocket.Server({ port: 8008 });

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket server');

    // When a message is received from the WebSocket client
    ws.on('message', (message) => {
        console.log('Received message from client:', message);

        // Publish the message to the MQTT broker
        mqttClient.publish(topic, message, { retain: true }, (err) => {
            if (err) {
                console.error('Failed to publish message:', err);
                ws.send('Error publishing message');
            } else {
                console.log(`Message published to ${topic}: ${message}`);
                ws.send(`Message published to MQTT topic ${topic}`);
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8008');
