import express from 'express';
import { Request, Response, NextFunction } from "express";
import cors from 'cors';
import bodyParser from 'body-parser';
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

const app = express();

app.use(cors());
app.use(bodyParser.json());

const alpaca = new Alpaca({
    keyId: process.env.API_KEY,
    secretKey: process.env.SECRET_API_KEY,
    paper: true,
    usePolygon: false
});


const client = alpaca.data_ws;

client.onConnect(function () {
    console.log("Connected");
})

client.connect();

app.get('/stocks', (request: Request, response: Response) => {
    alpaca.getWatchlist('7e609ee6-ebb7-4e2a-b084-3029d9e15cd5')
        .then((res: any) => {
            if (res) {
                response.status(200).send(res.assets);
            } else {
                response.status(401).send('Error occured');
            }
        })
});

app.get('/stockByName/:name', (request: Request, response: Response) => {
    alpaca.getWatchlist('7e609ee6-ebb7-4e2a-b084-3029d9e15cd5')
        .then((res: any) => {
            const regex = new RegExp('.*' + request.params.name + '.*', 'i');
            const stock = res.assets.filter((item: any) => regex.test(item.name) === true);
            if (response) {
                response.status(200).send(stock);
            }
        })
});

app.get('/stockDetail/:symbol', (req: Request, res: Response) => {
    alpaca.lastQuote(req.params.symbol)
        .then((response: any) => {
            if (response.status === 'success') {
                res.status(200).send(response);
            } else {
                res.status(401).send('Error occured');
            }
        })
});

const db = admin.firestore();
const stockWatchlist = db.collection('watchlist');

const addStock = async (symbol: string, data: any) => {
    const res = await stockWatchlist.doc(symbol).set(data);
}

const removeStock = async (symbol: string) => {
    const res = await stockWatchlist.doc(symbol).delete();
}

app.post('/addStock', (req: Request, res: Response) => {
    addStock(req.body.symbol, req.body);
})

app.get('/watchlist', async (req: Request, response: Response) => {
    const newList: any = [];
    const res = await stockWatchlist.get();
    res.forEach((doc: any) => {
        newList.push(doc.data());
    });
    response.send(newList);
});

app.delete('/removeStock/:symbol', (req: Request, response: Response) => {
    removeStock(req.params.symbol);
});

app.listen(port);