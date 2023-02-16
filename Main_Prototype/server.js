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
       
        //Client Message empfangen
        //console.log(result)


        //eine Sitzung erstellen mit einer neuen Sitzungs ID
        if (result.method === "create"){ 
            const clientId = result.clientId
            const sessionId = guid()
            sessions[sessionId] = {
                "id": sessionId,
                "clients": [],
                "image" : ""
            }

            console.log("Neue Session ",sessions[sessionId]);

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
    
                console.log(session)
    
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

            //console.log(image)

            const payLoad = {
                "method" : "get_image",
                "image" : image,
                "newImage" : newImage
            }

            session = sessions[sessionId]

            session.image = image
            
            console.log(clientId)

            var i = 0

            session.clients.forEach(c => {
                if(c.clientId !== clientId){
                    i += 1
                    clients[c.clientId].connection.send(JSON.stringify(payLoad))
                }
            })
            console.log("I von upload_image ist:  "+i)
        }

        if (result.method === "undo"){
            const sessionId = result.sessionId
            const clientId = result.clientId
            const session = sessions[sessionId]

            const payLoad = {
                "method" : "undoImage",
            }

            var i = 0

            session.clients.forEach(c => {
                if(c.clientId !== clientId){
                    i += 1
                    clients[c.clientId].connection.send(JSON.stringify(payLoad))
                }
            })
            console.log("i ist: " + i)
        }

        if (result.method === "clear"){
            const sessionId = result.sessionId
            const clientId = result.clientId
            const session = sessions[sessionId]

            console.log("CLIENT ID: " + clientId)
            console.log("SESSION ID: " + sessionId)

            const payLoad = {
                "method" : "clearImage",
            }

            var i = 0

            session.clients.forEach(c => {
                if(c.clientId !== clientId){
                    i += 1
                    clients[c.clientId].connection.send(JSON.stringify(payLoad))
                }
            })
            console.log("i ist: " + i)

        }


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
