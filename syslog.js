//log PI system stats into influxdb
const app = require('express')();
const http = require('http').Server(app);
//getting system variables
var os = require('os');
//database name: datalogdb
//measurement name:sysstatus
const Influx = require('influx');
const influx = new Influx.InfluxDB({
 host: 'localhost',
 database: 'datalogdb',
 schema: [
   {
     measurement: 'sysstatus',
     fields: {
       cpuload: Influx.FieldType.FLOAT,
       freemem: Influx.FieldType.INTEGER,
       totalmem: Influx.FieldType.INTEGER,
       uptime: Influx.FieldType.FLOAT
     },
     tags: ['host', 'machineid']
   }
 ]
});

//check if database already exists
influx.getDatabaseNames()
  .then(names => {
    if (!names.includes('datalogdb')) {
        console.log('database created');
      return influx.createDatabase('datalogdb');
    }    
  })
  .catch(err => {
    console.error(`Error creating Influx database!`);
  })

//function towrite to db, this returns a promise
async function insertDB () {
    influx.writePoints([
    {
      measurement: 'sysstatus',
      tags: { host: os.hostname(), machineid: 'pi1' },
      fields: { 
        //load avg array of time values 5, 10, 15 mins
        cpuload: os.loadavg()[2],
        freemem: os.freemem(),
        totalmem: os.totalmem(),
        uptime: os.uptime() 
        },
    }
  ], {
    //sets time to seconds instead of nanoseconds, saves space
    precision: 's', 
  })
  .catch(error => {
    console.error(`Error saving data to InfluxDB! ${err.stack}`)
  });
}

//put the write in an async function with await for writing to the db function above
async function writeDBInterval () {
    try {
      //can use await for the db insert to finish
      //if need the results before proceeding  
      insertDB();
      console.log('db measurement inserted');
    }
    catch(err) {
        console.error(`***ERROR*** writeDBInterval func ${err}`);
    }
}

//run the function every minute
//setInterval calls a function asynchronously anyway, but writen like above for future
setInterval(writeDBInterval, 60000);

//query data
//influx.query('select * from sysstatus').then(results => {
//    console.log(results);
// })


//routes
app.get("/", function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

//call server on port 8080, local host
http.listen(8080, () => {
    console.log('http started on port 8080');
});