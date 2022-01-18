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

router.get('/', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<h1>Hello from Express.js!</h1>');
    res.end();
});

router.get('/list', async(req, res) => {
    const { q } = req.query;
    if (q) {
        const directory = await unzipper.Open.url(zipRequestProxy(), q);
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

const zipRequestProxy = () => {
    //{ url: string, headers: Record<string, string> }
    return function(options) {
        const { url, headers } = options;
        //console.log(`calling url '${url}' with following headers ${JSON.stringify(headers)}...`);
        const stream = got.stream(url, { headers });
        //resp0111.on('response', (r01) => { console.log(r01.headers); });
        var proxy = Object.assign(stream, { abort: stream.destroy });
        return proxy;
    }
}

module.exports = app;
module.exports.handler = serverless(app);