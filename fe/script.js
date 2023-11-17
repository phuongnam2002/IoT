import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js'
import { getDatabase, ref, onChildAdded, set, onValue, child, onChildChanged, query, limitToLast, get } from "./firebase-database.js"

const firebaseConfig = {
    apiKey: "AIzaSyA_Q8yM9GhqwY3uxlHqPnr0CiTPLsmhw4U",
    authDomain: "iot-center-3245d.firebaseapp.com",
    databaseURL: "https://iot-center-3245d-default-rtdb.firebaseio.com",
    projectId: "iot-center-3245d",
    storageBucket: "iot-center-3245d.appspot.com",
    messagingSenderId: "727137918019",
    appId: "1:727137918019:web:acc177ac6b1b48dc2e08f6",
    measurementId: "G-Q9YL4CXEFM"
  };

let chart = new Chart(document.getElementById('myChart'), {
    type: 'line',
    data: {
        datasets: [
            {
                label: 'Temp',
            },
            {
                label: 'Humidity',
            },
            {
                label: 'Air Pollution',
            }
        ]
    }
});

let subChart = new Chart(document.getElementById('subChart'), {
    type: 'line',
    data: {
        datasets: [
            {
                label: 'Light'
            }
        ]
    },
});

function addData (temp, humid, light, air) {
    var real_time = new Date();
    var hour = real_time.getHours();
    var minute = real_time.getMinutes();
    var second = real_time.getSeconds();
    chart.data.labels.push(hour+':'+minute+':'+second);
    subChart.data.labels.push(hour+':'+minute+':'+second);
    if (chart.data.datasets[0].data.length > 9) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
        chart.data.datasets[2].data.shift();
        subChart.data.datasets[0].data.shift();
    }
    chart.data.datasets[0].data.push(temp);
    chart.data.datasets[1].data.push(humid);
    chart.data.datasets[2].data.push(air);
    subChart.data.datasets[0].data.push(light);
    chart.update();
    subChart.update();
}

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const sensorRef = ref(database, 'sensorData');
const statusPull = ref(database, 'status');
const historyLed = ref(database, 'ledHistory');

const textHumid = document.getElementById('text-humid');
const textTemp = document.getElementById('text-temp');
const textLight = document.getElementById('text-light');
const textDust = document.getElementById('text-air-pollution');
const livingRoomSwitch = document.getElementById('living-room-switch');
const bedroomSwith = document.getElementById('bedroom-switch');
const lamphistory = document.getElementById('Lamphistory');
const fanhistory = document.getElementById('Fanhistory');

let disableInit = true;
onChildAdded(sensorRef, (snapshot) => {
    if (!disableInit) {
        const data = snapshot.val();
        const obj = JSON.parse(data);
        textHumid.innerHTML = obj.humid.toFixed(1);
        document.getElementById('card-temp').style.backgroundImage = getTempLevel(obj.temp);
        textTemp.innerHTML = obj.temp.toFixed(1);
        document.getElementById('card-humid').style.backgroundImage = getHumidLevel(obj.humid);
        textDust.innerHTML = obj.dust.toFixed(1);
        document.getElementById('card-air-pollution').style.backgroundImage = getAirPollutionLevel(obj.dust);
        textLight.innerHTML = obj.lux.toFixed(1);
        document.getElementById('card-light').style.backgroundImage = getLightLevel(obj.lux);
        addData(obj.temp, obj.humid, obj.lux, obj.dust);
    }
});

onChildAdded(query(sensorRef, limitToLast(10)), (snapshot) => {
    const data = snapshot.val();
    const obj = JSON.parse(data);
    textHumid.innerHTML = obj.humid.toFixed(1);
    document.getElementById('card-temp').style.backgroundImage = getTempLevel(obj.temp);
    textTemp.innerHTML = obj.temp.toFixed(1);
    document.getElementById('card-humid').style.backgroundImage = getHumidLevel(obj.humid);
    if (obj.lux != null) {
        textLight.innerHTML = obj.lux.toFixed(1);
        document.getElementById('card-light').style.backgroundImage = getLightLevel(obj.lux);
    }
    addData(obj.temp, obj.humid, obj.lux, obj.dust);
});


onValue(sensorRef, () => {
    disableInit = false;
}, { onlyOnce: true });

onChildAdded(statusPull, (snapshot) => {
    console.log(snapshot.val())
    if (snapshot.key == "l1") {
        livingRoomSwitch.checked = snapshot.val().on;
    } else if (snapshot.key == "l2") {
        bedroomSwith.checked = snapshot.val().on;
    }
});

onChildChanged(statusPull, (snapshot) => {
    if (snapshot.key == "l1") {
        livingRoomSwitch.checked = snapshot.val().on;
    } else if (snapshot.key == "l2") {
        bedroomSwith.checked = snapshot.val().on;
    }
});

livingRoomSwitch.addEventListener('change', function () {
    set(child(statusPull, "l1/on"), this.checked);
});

bedroomSwith.addEventListener('change', function () {
    set(child(statusPull, "l2/on"), this.checked);
});

let getTempLevel = temp => {
    if (temp < 20) {
        return getVar("--good-gradient");
    } else if (temp < 30) {
        return getVar("--warning-gradient");
    } else {
        return getVar("--severe-gradient");
    }
}

let getHumidLevel = humid => {
    if (humid <= 60) {
        return getVar("--good-gradient");
    } else if (humid < 80) {
        return getVar("--warning-gradient");
    } else {
        return getVar("--severe-gradient");
    }
}

let getLightLevel = light => {
    if (light < 900) {
        return getVar("--good-gradient");
    } else if (light <= 1024) {
        return getVar("--warning-gradient");
    } else {
        return getVar("--severe-gradient");
    }
}

let getAirPollutionLevel = light => {
    if (light < 30) {
        return getVar("--good-gradient");
    } else if (light <= 70) {
        return getVar("--warning-gradient");
    } else {
        return getVar("--severe-gradient");
    }
}

let getVar = str => getComputedStyle(document.documentElement).getPropertyValue(str);

get(historyLed).then((snapshot) => {
    let data = [];
    snapshot.forEach(child => {
        data.push(JSON.parse(child.val()))
    });
    let onlamp = data.filter((body) => body.id == "l1");
    onlamp = onlamp.filter((body) => body.on == true);
    lamphistory.innerHTML = onlamp.length;

    onlamp = data.filter((body) => body.id == "l2");
    onlamp = onlamp.filter((body) => body.on == true);
    fanhistory.innerHTML = onlamp.length;
});