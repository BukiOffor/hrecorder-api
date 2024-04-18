const app = require('express')();
const bodyparser = require('body-parser');

const functions = require('./classes/functions.js');

require('dotenv').config();

app.listen(3000, () => {
    console.log('Listening on port 3000');
});

app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())


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

