'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const url = require('url');
const router = express.Router();
const unzipper = require('unzipper');
const cors = require('cors');
const got = require('got');

router.get('/', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<h1>Hello from Express.js!</h1>');
    res.end();
});

router.get('/download', async(req, res) => {
    const { q, f } = req.query;
    if (q && f) {
        const directory = await unzipper.Open.url(zipRequestProxy, q);
        const file = directory.files.find(f => (f.type === 'File' && f.path === f));
        if (file) {
            file.stream().pipe(res);
        } else {
            res.status(400).json({
                error: 'file not found',
                query: {
                    q,
                    f
                },
                availableFiles: directory.files.map(x => x.path)
            });
        }

    } else {
        res.status(400).json({ error: 'Query param q or f not defined' });
    }
});
router.get('/list', async(req, res) => {
    const { q } = req.query;
    if (q) {
        const directory = await unzipper.Open.url(zipRequestProxy, q);
        const result = directory.files.filter(f => f.type === 'File').map(({
            path,
            compressedSize,
            crc32,
            compressionMethod,
            uncompressedSize,
            comment,
            lastModifiedDate,
            lastModifiedTime
        }) => ({
            compressedSize,
            path,
            crc32,
            compressionMethod,
            uncompressedSize,
            comment,
            lastModifiedDate,
            lastModifiedTime
        }));
        res.json(result);
    } else {
        res.status(400).json({ error: 'Query param q not defined' });
    }
});

router.get('/another', (req, res) => res.json({ route: req.originalUrl }));
router.post('/', (req, res) => res.json({ postBody: req.body }));

app.use(cors());
app.use(bodyParser.json());
app.use('/.netlify/functions/server', router); // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

//options: { url: string, headers: Record<string, string> }
const zipRequestProxy = (options) => {
    const { url, headers } = options;
    const stream = got.stream(url, { headers });
    var proxy = Object.assign(stream, { abort: stream.destroy });
    return proxy;
}

module.exports = app;
module.exports.handler = serverless(app);