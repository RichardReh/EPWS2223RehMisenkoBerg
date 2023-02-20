const http = require("http");
const { connect } = require("http2");
const { join } = require("path");
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(8003, () => console.log("Listening.. on 8003"))

//hashmap für Clients
const clients = {};
//hashmap für Sitzungen
const sessions = {};

const wsServer = new websocketServer({
    //Es wurde extra ein so hoher Wert genommen, damit Bilder mit eventuell sehr hoher Dateigröße akzeptiert werden. 
    "httpServer": httpServer,
    "maxReceivedFrameSize": 9999999,
    "maxReceivedMessageSize": 10 * 1024 * 1024,
})

wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opended!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)

        //eine Sitzung erstellen mit einer neuen Sitzungs ID
        if (result.method === "create"){ 
            const clientId = result.clientId
            const sessionId = guid()
            sessions[sessionId] = {
                "id": sessionId,
                "clients": [],
                "image" : ""
            }


            const payLoad = {
                "method": "create",
                "session": sessions[sessionId]
            }

            const connection = clients[clientId].connection
            connection.send(JSON.stringify(payLoad))

        }

        if (result.method === "join"){ 
            const clientId = result.clientId
            const sessionId = result.sessionId
            const nutzername = result.nutzername
            let session = null

        
            session = sessions[sessionId]

            if (!sessions[sessionId]) {
                const errorPayload = {
                  "method": "error",
                  "message": "Session does not exist"
                }
                clients[clientId].connection.send(JSON.stringify(errorPayload));
              } else {
                session.clients.push({
                    "clientId" : clientId,
                    "nutzername" : nutzername
                })
    
                const payLoad = {
                    "method" : "join",
                    "session" : session,
                    "newJoin" : false
                }

                const payLoad2 = {
                    "method" : "join",
                    "session" : session,
                    "newJoin" : true
                }
    
                session.clients.forEach(c => {
                    if(c.clientId !== clientId){
                        clients[c.clientId].connection.send(JSON.stringify(payLoad))
                    } else {
                        clients[c.clientId].connection.send(JSON.stringify(payLoad2))
                    }
                });
              }
        }

        if (result.method === "upload_image"){
            const clientId = result.clientId
            const sessionId = result.sessionId
            const image = result.image
            const newImage = result.newImage
            let session = null

            const payLoad = {
                "method" : "get_image",
                "image" : image,
                "newImage" : newImage
            }

            session = sessions[sessionId]
            session.image = image

            session.clients.forEach(c => {
                if(c.clientId !== clientId){
                    clients[c.clientId].connection.send(JSON.stringify(payLoad))
                }
            })
        }

        if (result.method === "undo"){
            const sessionId = result.sessionId
            const clientId = result.clientId
            const session = sessions[sessionId]

            const payLoad = {
                "method" : "undoImage",
            }

            session.clients.forEach(c => {
                if(c.clientId !== clientId){
                    clients[c.clientId].connection.send(JSON.stringify(payLoad))
                }
            })
        }

        if (result.method === "clear"){
            const sessionId = result.sessionId
            const clientId = result.clientId
            const session = sessions[sessionId]

            const payLoad = {
                "method" : "clearImage",
            }

            session.clients.forEach(c => {
                if(c.clientId !== clientId){
                    clients[c.clientId].connection.send(JSON.stringify(payLoad))
                }
            })
        }


    })

    //neue client ID erstellen, sobald ein Client sich verbindet und anschließend diese an ihn senden.
    const clientId = guid();
    clients[clientId] = {
        "connection": connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }

    connection.send(JSON.stringify(payLoad))
})

//Funktion für die Erstellung einer ID, egal ob für Clients oder Sessions.

function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}

const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
