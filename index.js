// _____________¶____¶ 
// _________¶_¶¶¶¶¶¶¶¶¶¶ 
// _____¶¶¶¶¶¶¶_________¶ 
// ___¶¶¶¶¶_____________¶ 
// ___¶_________________¶ 
// ____¶________________¶¶ 
// ____¶¶________________¶ 
// _____¶________________¶¶ 
// _____¶¶_______¶¶¶____¶¶¶ 
// ______¶_____¶¶___¶¶_¶___¶ 
// ______¶_____¶¶_____¶____¶ 
// ______¶¶____¶______¶¶¶¶¶¶¶ 
// _______¶____¶¶__¶¶¶_____¶¶ 
// ______¶¶¶¶____¶¶¶¶_____¶¶ 
// ______¶¶¶_______________¶¶ 
// _______¶¶¶______________¶¶ 
// ________¶_____¶¶¶¶¶¶¶¶¶¶¶ 
// _______¶¶_______¶¶¶¶¶ 
// ______¶¶¶¶¶_____¶ 
// ___¶¶¶¶__¶¶¶¶¶¶¶¶ 
// __¶¶____¶¶_____¶¶ 
// _¶¶_____¶¶______¶¶ 
// ¶¶______¶¶_______¶¶ 
// _¶¶¶¶¶___¶¶______¶¶ 
// _¶__¶¶¶¶¶¶_______¶¶ 
// ¶¶____¶___________¶¶ 
// ¶____¶¶__________¶¶¶ 
// ¶____¶¶____________¶ 
// ¶_____¶___________¶¶¶ 
// ¶_____¶¶¶¶¶¶¶¶¶¶¶¶¶_¶ 
// ¶______¶_________¶___¶ 
// ¶¶¶¶__¶__________¶_¶¶¶ 
// _¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶ 
// ___¶¶¶¶¶¶¶¶¶____¶ 
// ___¶¶___¶__¶____¶ 
// ___¶____¶__¶____¶ 
// ___¶¶___¶__¶____¶¶ 
// __¶_______¶¶¶¶¶¶¶¶¶¶ 
// _¶¶¶¶¶¶¶¶¶¶¶__¶¶¶¶¶¶¶ 
// _¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶


require("dotenv").config()
const { Spot } = require("@binance/connector")
const axios = require("axios")


const tick = async (config, binanceClient) => {
    const { asset, base, spread, allocation } = config
    const market = `${asset}${base}`
    const market_reverse = `${base}${asset}`

    // CHECK IF THERE IS OPEN ORDERS AND CLOSE IT/THEM ¯\_( ͡◎ ͜ʖ ͡◎)_/¯
    binanceClient.allOrders(market).then(res => { 
        res.data.forEach(order => {
            if (order.status !== "FILLED")
            {
                binanceClient.cancelOrder(market, {
                    orderId: res.data.orderId
                }).then(res => {
                    console.log(res)
                })
            }
            else {
                console.log("Id: "+order.orderId+" | Qty: "+order.executedQty+" | Symbol: "+order.symbol)
            }
        })
    })
    
    // CALL COINGECKO API TO WORK WITH REAL BTC PRICE
    const result = axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd") 
    result.then(async (res) => {
        const sellPrice = res.data.bitcoin.usd * (1 + spread)
        const buyPrice = res.data.bitcoin.usd * (1 - spread)
        const account = await binanceClient.account().then(res => {
            res.data.balances.forEach(coin => {
                if (coin.asset === "BTC")
                    assetBalance = coin.free
                else if (coin.asset === "BUSD")
                    baseBalance = coin.free
            })
            console.log(assetBalance)
            console.log(baseBalance)
        })
        btcPrice = res.data.bitcoin.usd

        // CONVERT BUSD INTO BTC IF THIS ISN'T ALREADY CONVERTED AND LESS THAN 41K$
        isBought = 0
        if (btcPrice <= 41000 && isBought === 0)
        {
            price = 50
            quantity = Number(price / btcPrice).toFixed(5)
            console.log(quantity)
            binanceClient.newOrder(market, "BUY", "LIMIT", {
                price: btcPrice,
                quantity: quantity,
                timeInForce: 'GTC'
            })
            .then (res => { console.log(res) })
            isBought = 1
        }
        // CONVERT BTC INTO BUSD IF THIS IS BOUGHT AND OVER 44K$
        if (btcPrice >= 44000 && isBought === 1)
        {
            binanceClient.newOrder(market_reverse, 'BUY', 'LIMIT', {
                price: 1,
                quantity: 50,
                timeInForce: 'GTC'
            })
            .then (res => { console.log(res) })
            isBought = 0
        }
    })
}

// SET MARKET CONFIGURATION AND BINANCE CLIENT
const run = () => {
    const config = {
        asset: 'BTC',
        base: "BUSD",
        allocation: 0.1,
        spread: 0.2,
        tickInterval: 2000
    }
    const binanceClient = new Spot(process.env.TEST_KEY, process.env.TEST_SECRET, { baseURL: 'https://testnet.binance.vision'})
    tick(config, binanceClient)
    setInterval(tick, config.tickInterval, config, binanceClient)
}

run()