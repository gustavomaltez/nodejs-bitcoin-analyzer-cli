const WebSocket = require('ws');
require('colors');
const { getDate, getMonth, getYear, getMinutes, getHours, getSeconds, formatDistance} = require('date-fns');
const ws = new WebSocket('wss://stream.binance.com/ws', {port: 9443});

ws.on('open', function open() {
  ws.send(JSON.stringify({
    "method": "SUBSCRIBE",
    "params":
    [
    "btcusdt@aggTrade",
    ],
    "id": 1
    }));
});

let min, max, oldPrice, price;
let minDate, maxDate;
let isFirstLoad = true;

function getFormatedTime(date){
    const day = String(getDate(date));
    const month = String(getMonth(date) + 1).padStart(2, '0');
    const year = String(getYear(date));
    const hours = String(getHours(date)).padStart(2, '0');
    const minutes = String(getMinutes(date)).padStart(2, '0');
    const seconds = String(getSeconds(date)).padStart(2, '0');
    
    return `${day}/${month}/${year} ~ ${hours}:${minutes}:${seconds}`
}

function getTimeSince(date){
    const time = formatDistance(date, new Date(), {includeSeconds: true, addSuffix: true});
    return time.charAt(0).toUpperCase() + time.slice(1);
}
ws.on('message', function incoming(data) {
    
 const { p } = JSON.parse(data)

 if(p !== undefined){
    price = Number(p).toFixed(2);
 
    if(isFirstLoad) {
        min = max = oldPrice = price;
        minDate = maxDate = new Date();
        isFirstLoad = false;
    }
   
    if(price < min){
        min = price;
        minDate = new Date();
    }
   
    if(price > max){
        max = price;
        maxDate = new Date();
    }
   
    const priceColor = (oldPrice === price ? 'bgYellow' : (oldPrice > price ? 'bgRed' : 'bgGreen'));
    const isLowestPrice = (min === price);
    const isFloating = (price > min && price < max);
    
    console.clear()
    console.log(`[!] STATUS:`.cyan + ` ${isFloating ? 'Floating'.yellow : (isLowestPrice ? 'LOWEST'.red : 'HIGHEST'.green) }`);

    const maxData = `MAX....: ${max}`.bgBrightGreen.black + ` @ ${getFormatedTime(maxDate)}`.gray;
    const priceData = `PRICE..: ${price}`[priceColor].black + ` @ ${getFormatedTime(new Date())}`.gray;
    const minData = `MIN....: ${min}`.bgBrightRed.black + ` @ ${getFormatedTime(minDate)}`.gray;
    console.log(maxData)
    console.log(priceData)
    console.log(minData)
    console.log(`HIGHEST.: ${getTimeSince(maxDate)}`.brightYellow);
    console.log(`LOWEST..: ${getTimeSince(minDate)}`.brightYellow);
   
    oldPrice = price;
 }
});