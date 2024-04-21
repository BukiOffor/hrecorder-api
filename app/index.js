const app = require('express')();
const multer = require('multer');
const crypto = require('crypto');
const bodyparser = require('body-parser');

//const functions = require('./classes/functions.js');

require('dotenv').config();

app.listen(3000, () => {
    console.log('Listening on port 3000');
});

app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())

function log(data){
    console.log(data);
}



const upload = multer();

// Define a route to handle video uploads
app.post('/upload', upload.single('video'), (req, res) => {
    log(req.body);
    if (!req.body.video) {
        return res.status(400).send('No file uploaded.');
    }

    // Read the uploaded video file
    const videoBuffer = req.file.buffer;

    // Calculate SHA256 hash of the video file
    const hash = crypto.createHash('sha256');
    hash.update(videoBuffer);

    const videoHash = hash.digest('hex');
    console.log('Video hash:', videoHash);

    // Respond with success message
    res.send(videoHash);
});




















app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/api/netmode', (req, res) => {
    res.status(200).send({"NETMODE": process.env.NETMODE});
});

app.post('/api/blockchain/hash/:hash', async (req, res) => {
    const hash = req.params.hash;
    if (typeof hash === 'undefined') {
        res.status(400).send('Bad Request');
        return;
    };

    var isExistent = await functions.checkIfHashExistsInBlockchain(hash);
    console.log(isExistent);
    if (isExistent) {
        console.log("Hash already exists in BC");
        res.status(500).send("Hash already exists in Blockchain");
        return;
    }
    //wait 500 milliseconds for the api to cool down
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    await delay(500);
    var txid = await functions.addToBlockchain(hash);
    if (txid == null) {
        res.status(500).send("Error adding to blockchain");
        return;
    }
    
    
    if (!txid) {
        res.status(500).send("Error obtaining transaction data");
        return;
    } else {
        res.status(200).send({success: true, id: txid});
    }
});


app.get("/api/blockchain/hash/:hash/exists", async (req, res) => {
    const hash = req.params.hash;
    if (typeof hash === 'undefined') {
        res.status(400).send('Bad Request');
        return;
    };
    var isExistent = await functions.checkIfHashExistsInBlockchain(hash);
    if (isExistent) {
        res.status(200).send("Hash exists in Blockchain");
    } else {
        res.status(404).send("Hash does not exist in Blockchain");
    }
});

