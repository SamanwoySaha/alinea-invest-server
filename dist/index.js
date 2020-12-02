"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
require('dotenv').config();
const port = process.env.PORT || 5000;
const Alpaca = require(`@alpacahq/alpaca-trade-api`);
require("firebase/firestore");
var admin = require("firebase-admin");
var serviceAccount = require("../ss-alinea-invest-firebase-adminsdk-q567t-632bb56cb7.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://ss-alinea-invest.firebaseio.com"
});
const app = express_1.default();
app.use(cors_1.default());
app.use(body_parser_1.default.json());
const alpaca = new Alpaca({
    keyId: process.env.API_KEY,
    secretKey: process.env.SECRET_API_KEY,
    paper: true,
    usePolygon: false
});
const client = alpaca.data_ws;
client.onConnect(function () {
    console.log("Connected");
});
client.connect();
app.get('/stocks', (request, response) => {
    alpaca.getWatchlist('7e609ee6-ebb7-4e2a-b084-3029d9e15cd5')
        .then((res) => {
        if (res) {
            response.status(200).send(res.assets);
        }
        else {
            response.status(401).send('Error occured');
        }
    });
});
app.get('/stockByName/:name', (request, response) => {
    alpaca.getWatchlist('7e609ee6-ebb7-4e2a-b084-3029d9e15cd5')
        .then((res) => {
        const regex = new RegExp('.*' + request.params.name + '.*', 'i');
        const stock = res.assets.filter((item) => regex.test(item.name) === true);
        if (response) {
            response.status(200).send(stock);
        }
    });
});
app.get('/stockDetail/:symbol', (req, res) => {
    alpaca.lastQuote(req.params.symbol)
        .then((response) => {
        if (response.status === 'success') {
            res.status(200).send(response);
        }
        else {
            res.status(401).send('Error occured');
        }
    });
});
const db = admin.firestore();
const stockWatchlist = db.collection('watchlist');
const addStock = async (symbol, data) => {
    const res = await stockWatchlist.doc(symbol).set(data);
};
const removeStock = async (symbol) => {
    const res = await stockWatchlist.doc(symbol).delete();
};
app.post('/addStock', (req, res) => {
    addStock(req.body.symbol, req.body);
});
app.get('/watchlist', async (req, response) => {
    const newList = [];
    const res = await stockWatchlist.get();
    res.forEach((doc) => {
        newList.push(doc.data());
    });
    response.send(newList);
});
app.delete('/removeStock/:symbol', (req, response) => {
    removeStock(req.params.symbol);
});
app.listen(port);
