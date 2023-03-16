
/*
 * nodejs server for debug
 * remote console logging
 * 
 * packages to install:
  
  npm install --save ws
  npm install --save rotating-file-stream
  
 */

let port = 9877;
let remoteAddress = "http://127.0.0.1";
let clientBuffSizeMb = 2;
let logFileSizeMb = 2;
let logDirectory = "/var/logs/nrcs/";

function hh(d){ return d < 10 ? '0' + d : d; }
function hhh(d){ return d < 100 ? '0' + hh(d) : d; }

function rudatestr(time) {
    time = time || 0;
    if (time < 10000000000) { time *= 1000; }
    let date = new Date(time || Date.now())
        , d = hh( date.getDate() )
        , m = hh( date.getMonth()+1)
        , h = hh( date.getHours() )
        , mm = hh( date.getMinutes() )
        , s = hh( date.getSeconds() )
        , ms = hhh( date.getMilliseconds() );
    return d + '.' + m + ' ' + h + ':' + mm + ':' + s + '.' + ms;
}

let args = {};


process.argv.forEach(val => {
    if (val && val.replace && val.trim) {
        val.trim().replace(/--(\w*)=?(.*)?/, (c, a, b) => {
            if (a && a.toLowerCase) args[a.toLowerCase()] = b==undefined ? 1 : b;
        });
    }
});

for (let i in args) { console.log("args ", JSON.stringify(args)); break; }


if (args.host) {

    let WebSocketServer = require('websocket').server;
    let http = require('http');
    let os = require('os');

    let rfs = require("rotating-file-stream");
    
    let HOST = ( ()=>{
        
        let sockets = {};
        function connectMessage(){
            
            let ifaces = os.networkInterfaces();
            let m = "";
            for (let i in ifaces){
                m += i + ': \n';
                for (let j in ifaces[i]){
                    m += '  ' + ifaces[i][j].family + ' ' + ifaces[i][j].address + ' ; \n';
                }
            }
            return 'connect by websocket on port ' + port + ' \nnetworks : \n' + m
            
        }

        var clientID = 0;
        
        return {
            
            sockets: {},
            
            start: function(_port){
                
                let t = this;
                
                t.port = _port;
                
                console.log("create WebSocket server");
                
                const WebSocket = require('ws');

                t.server = new WebSocket.Server({ port: _port });

                console.log(connectMessage());
                
                t.server.on('connection', function connection(socket) {
                    
                    let socketID = 's:'+ (clientID++) + ':' + socket._socket.remoteAddress;
                    
                    socket.on('message', function incoming(message) {
                            
                        socket.lastMessageTime = Date.now();
                        
                        if (socket.piped && socket.pipeStream){
                            
                            socket.pipeStream.write(message);
                            
                        } else {
                            
                            try {
                                let mess = JSON.parse(message);
                                if (mess){
                                    if (mess.pipeToFile){
                                        if (mess.pipeToFile.endsWith) {
                                            if (!mess.pipeToFile.endsWith('.txt')){
                                                mess.pipeToFile += '.txt';
                                            }
                                            mess.pipeToFile = mess.pipeToFile.replace(/[^\w\s]/g,'_').replace(/_txt$/,'.txt');
                                            socket.piped = mess.pipeToFile;
                                            socket.send( JSON.stringify({ piped: socket.piped }));
                                            
                                            socket.log("piped to file", socket.piped);
                                            
                                            socket.pipeStream = rfs(logDirectory + socket.piped, {
                                                size: logFileSizeMb + "M", // rotate every 10 MegaBytes written
                                                interval: "1d", // rotate daily
                                                compress: "gzip" // compress rotated files
                                            });

                                        }
                                    } else 
                                    if (mess.getPipeToFile) {
                                        socket.send( JSON.stringify({
                                            file: (rudatestr() + '_' + socketID).replace(/[^\w\s]/g,'_')
                                        }));
                                    }
                                }
                            } catch (e){
                                    
                            }
                            
                            socket.log(message);
                        }
                       
                    });
                                        
                    socket.log = function(){
                        console.log( [ rudatestr(), socketID, ": " ] .concat([].slice.call(arguments)).join(' ') );
                    }
                
                    socket.id = socketID;
                    
                    socket.lastMessageTime = 0;
                    
                    t.sockets[socketID] = socket;
                    
                    socket.on('close', ()=>{
                        socket.log('closed');
                        clearInterval( socket.pingInterval );
                        delete sockets[socketID];
                    });
                    
                    socket.on('error', e => {
                        socket.log('ERROR:');
                        console.error(e);
                    });
                    
                    socket.pingInterval = setInterval(()=>{ 
                        if (socket.lastMessageTime < Date.now() - 5000){
                            socket.send(rudatestr() + " ping\n");
                        }
                    }, 5000);
                    
                    socket.log("opened");
                    
                });
                
            }
            
        }

    })();


    HOST.start( port );

}
else
{
    
    let WebSocketClient = require('websocket').client;
    let readline = require('readline');
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    
    let input = "";
    let client = new WebSocketClient();
    
    rl.on('line', function(line){
        let connection = client.connection||0;
        if (connection.connected && connection.piped){
            connection.sendUTF(line);
            input = "";
        } else {
            input += line + "\n";
            if (input.length > clientBuffSizeMb * 1024 * 1024 ){
                input = input.substring(input.length - clientBuffSizeMb * 1024 * 1024);
            }
        }
    });

    function retryConnect(){
        if (client.connection && client.connection.piped)
              client.connection.piped = 0;
        setTimeout( client.connect, 5000 );
    }
    
    client.on('connectFailed', error => {
        console.log('Connect Error: ' + error.toString());
        retryConnect();
    });

    client.on('connect', connection => {
        console.log('WebSocket Client Connected');
        client.connection = connection;
        
        let file = args.file;
        
        connection.on('error', error => { console.log("Connection Error: " + error.toString()); });
        connection.on('close', () => { console.log('Connection Closed'); retryConnect(); });
        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                if (connection.piped) {
                    console.log(message.utf8Data);
                } else {
                    try {
                        let mess = JSON.parse(message.utf8Data);
                        if (mess.piped){
                            connection.piped = 1;
                            connection.sendUTF(input);
                            console.log("Connection piped to file", mess.piped);
                            input = "";
                        } else if ( mess.file && !file) {
                            connection.sendUTF(JSON.stringify({ pipeToFile: mess.file }));
                        }
                    } catch (e){
                        console.log(message.utf8Data);
                    }
                }
            }
        });
        
        if (file) {
            connection.sendUTF(JSON.stringify({ pipeToFile: file }));
        } else {
            connection.sendUTF(JSON.stringify({ getPipeToFile: 1 }));
        }
        
    });

    client.connect = client.connect.bind( client, remoteAddress + ":" + port, 'json');
    
    client.connect();
}




