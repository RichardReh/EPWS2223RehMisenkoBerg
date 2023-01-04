const http = require("http");
const { connect } = require("http2");
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(8003, () => console.log("Listening.. on 8003"))

//hashmap für Clients
const clients = {};

const wsServer = new websocketServer({
    "httpServer": httpServer
})

wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opended!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)
        //Client Message empfangen
        console.log(result)

    })

    //neue client ID erstellen
    const clientId = guid();
    clients[clientId] = {
        "connection": connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }

    //Verbindung an den Server zurücksenden
    connection.send(JSON.stringify(payLoad))
})

function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}

const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
