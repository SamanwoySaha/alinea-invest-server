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
const SMA = require(`technicalindicators`).SMA;
const _ = require(`lodash`);
var websocket = require('websocket').server;
require("firebase/firestore");
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const app = express_1.default();
app.use(cors_1.default());
app.use(body_parser_1.default.json());
const alpaca = new Alpaca({
    keyId: process.env.API_KEY,
    secretKey: process.env.SECRET_API_KEY,
    paper: true,
    usePolygon: false
});
alpaca.lastQuote('AAPL').then((response) => {
    console.log(response);
});
const watchlist = db.collection('watchlist').doc('aturing');
const addData = async () => {
    const res = await watchlist.set({
        'first': 'Alan',
        'middle': 'Mathison',
        'last': 'Turing',
        'born': 1912
    });
    console.log(res);
};
addData();
alpaca.getBars('day', 'AAPL', {
    limit: 5
}).then((barset) => {
    const aapl_bars = barset['AAPL'];
    // See how much AAPL moved in that timeframe.
    const week_open = aapl_bars[0].o;
    const week_close = aapl_bars.slice(-1)[0].c;
    const percent_change = (week_close - week_open) / week_open * 100;
    console.log(`AAPL moved ${percent_change}% over the last 5 days`);
});
const client = alpaca.data_ws;
client.onConnect(function () {
    console.log("Connected");
});
client.connect();
app.listen(port, () => console.log('listenin to port'));
