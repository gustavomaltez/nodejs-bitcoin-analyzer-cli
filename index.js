const WebSocket = require('ws');
require('colors');
const logUpdate = require('log-update');
var center = require('center-align');
const { getDate, getMonth, getYear, getMinutes, getHours, getSeconds, formatDistance} = require('date-fns');
const ws = new WebSocket('wss://stream.binance.com/ws', {port: 9443});
const coinsOptions = require('./coinview.json');

const coins = [coinsOptions.from,coinsOptions.to];

ws.on('open', function open() {
  ws.send(JSON.stringify({
    "method": "SUBSCRIBE",
    "params":
    [
    `${coins[0]}${coins[1]}@aggTrade`,
    ],
    "id": 1
    }));
    console.clear();
});

let min, max, oldPrice, price;
let minDate, maxDate, startTime = new Date();
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
let times = 0;
ws.on('message', function incoming(data) {
    const { p, result } = JSON.parse(data)
    
    if(data.includes(`"result":null`)){
        times++;
        console.log(`[${coins[0].toUpperCase()}/${coins[1].toUpperCase()}] is invalid! Edit your coinview.json!`)
    }else if( times >= 1){
        times = 0;
        console.clear();
    }

 if(p !== undefined){
    
    price = Number(p) > 9 ? Number(p).toFixed(2) : Number(p);
 
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
    
    const maxData = `MAX....: ${max}`.bgBrightGreen.black + ` @ ${getFormatedTime(maxDate)}`.gray;
    const priceData = `PRICE..: ${price}`[priceColor].black + ` @ ${getFormatedTime(new Date())}`.gray;
    const minData = `MIN....: ${min}`.bgBrightRed.black + ` @ ${getFormatedTime(minDate)}`.gray;
    
    const highest = `HIGHEST.: ${getTimeSince(maxDate)}`.brightYellow;
    const lowest = `LOWEST..: ${getTimeSince(minDate)}`.brightYellow;
    const sessionStartedAt = `SESSION STARTED: ${getFormatedTime(startTime)}`.brightGreen;
    const sessionTime = `COMPUTING SINCE: ${getTimeSince(startTime)}`.brightGreen;
    const header = center(`[${coins[0].toUpperCase()}/${coins[1].toUpperCase()}]`,41).red;
    const status = `[!] STATUS:`.cyan + ` ${isFloating ? 'Floating'.yellow : (isLowestPrice ? 'LOWEST'.red : 'HIGHEST'.green) }`;
logUpdate(`${header}
${status}
${maxData}
${priceData}
${minData}
${highest}
${lowest}
${sessionStartedAt}
${sessionTime}
`);
    oldPrice = price;
 }
});