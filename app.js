const express = require('express')
    , app = express()
	, server = require('http').Server(app)
	, rtsp = require('rtsp-ffmpeg')
    , fs = require('fs')
    , cors = require('cors')
    ;
    const path = require('path');
    var bodyParser = require('body-parser')
    server.listen(6147, function(){

    });
    var io = require('socket.io')(server, {cors:{
        origin: "http://localhost:8081",
        methods: ["GET"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
      }});
    function uniqueID(){
    function chr4(){
      return Math.random().toString(16).slice(-4);
    }
    return chr4() + chr4() + '-' + chr4() + '-' + chr4() + '-' + chr4() + '-' + chr4() + chr4() + chr4();
  }
  var cameras=[
    {
        "id" : 1,
        "name" : "Camera 1"
    },
    {
        "id" : 2,
        "name" : "Camera 2"
    },
    {
        "id" : 3,
        "name" : "Camera 3"
    },
];

var rtspLink = {
    1 : "rtsp://93.47.192.183:554/live/ch00_0",
    2 : "rtsp://91.227.157.117:554/live/ch00_0",
    3 : "rtsp://212.80.86.68:554/live/ch00_0"
}
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
    //res.send("Welcome Rtsp Api ");
});

app.get('/cams-list',cors(), function (req, res) {
    res.json(cameras);
});

//Start socketio unique live/unique url
app.get('/start/:id',cors(), function (req, res) {
    var id = req.params.id;
    if(rtspLink.hasOwnProperty(id)){
        var stream = new rtsp.FFMpeg({input: rtspLink[id], resolution: '800x600', quality: 3});
		stream.on('start', function() {
		});
		stream.on('stop', function() {
        });
        var unique = uniqueID();
        var ns = io.of('/live/' + unique );
        ns.on('connection', function(wsocket) {
            var pipeStream = function(data) {
                wsocket.emit('data', data);
            };
            stream.on('data', pipeStream);
            wsocket.on('disconnect', function() {
                stream.removeListener('data', pipeStream);
            });
        });
        var url = "/live/"+unique
        return res.end(url);
    }
    res.send("Key Not Found");
});


var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.post('/save-image',jsonParser, function (req, res) {
    var base64Data = req.body.base64.replace(/^data:image\/png;base64,/, "");
    const date = new Date()
    var filePath = './public/image/'+date.toISOString()+'-'+Math.random().toString(16).slice(-4)+'.png';
    require("fs").writeFile(filePath, base64Data, 'base64', function(err) {
    });
    res.send('success');
});


app.get('/image-list',cors(), function (req, res) {
    var list = [];
    const fs = require('fs');
    const directoryPath = path.join(__dirname, 'public/image');
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            return err;
        } 
        files.forEach(function (file) {
            list.push("http://localhost:6147/image/"+file)
        });
        return res.json(list)
    })
});