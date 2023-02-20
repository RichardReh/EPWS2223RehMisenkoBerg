let clientId = null;
    var sessionId = ""
    // Aus irgend einem Grund wird die sessionId als undefined im untersten Codeblock für die Image
    // sende-logik gespeichert und lässt sich nicht ein mal korrekt referenzieren.
    // darum benutzen wir die "sessionId_for_image_send"
    var sessionId_for_image_send = ""
    var clientId_for_undo_or_clear = ""

    let ws = new WebSocket("wss://arv-ep2223.onrender.com/:8003")

    const btnJoin = document.getElementById("btnJoin");
    const txtSessionId = document.getElementById("txtSessionId");
    const btnCreate = document.getElementById("btnCreate");
    const nutzername = document.getElementById("txtNameId");
    const div_users = document.getElementById("div_users")
    const joincode = document.getElementById("join_code");

    //Event für Button für die Erstellung einer Sitzung
    btnCreate.addEventListener("click", e =>{    
            const payLoad = {
            "method": "create",
            "clientId": clientId
            }
        ws.send(JSON.stringify(payLoad));
    })


    var hasJoined = false;
    //Event für Button für das betreten einer Sitzung
    btnJoin.addEventListener("click", e =>{

    
    sessionId = txtSessionId.value

    sessionId_for_image_send = sessionId


    const payLoad = {
        "method": "join",
        "clientId": clientId,
        "sessionId": sessionId,
        "nutzername" : nutzername.value
    }
    ws.send(JSON.stringify(payLoad));


    })


    ws.onmessage = message => {
        const response = JSON.parse(message.data);
        
        if(response.method === "connect"){
            clientId = response.clientId;

            clientId_for_undo_or_clear = clientId
        }

        if (response.method === "create"){
            sessionId = response.session.id

            //Anzeigen der Session ID auf dem Frontend

            let d = document.createElement("h2")
            d.textContent = "SessionID:  " + sessionId
            d.style.fontFamily = "Arial"
            d.addEventListener("click", e =>{
                var copyText = sessionId
                navigator.clipboard.writeText(copyText).then(() => {
                    var copyNotification = document.createElement("h2")
                    copyNotification.textContent = "copied!"
                    copyNotification.style.fontFamily = "Arial"
                    copyNotification.style.marginRight = "10rem"
                    d.textContent = copyNotification.textContent
                    setTimeout(function(){
                        if(sessionId_for_image_send == ""){
                            d.textContent = "SessionID:  " + sessionId
                        } else {
                            d.textContent = "SessionID:  " + sessionId_for_image_send
                        }
                    }, 1000);
                })
            })

            if (joincode.firstChild){
                joincode.firstChild.textContent = ("SessionID:  " + sessionId)
            } else {
                joincode.appendChild(d)
            }

        }

        if (response.method === "join"){
            sessionId = response.session.sessionId
            let session = response.session
            let newJoin = response.newJoin

            //Anzeigen der Nutzernamen auf dem Frontend

            if(!hasJoined){
                var d = document.createElement("h3")
                d.textContent = "In der Session: "
                const div = document.getElementById("main")
                div.prepend(d)
            }

            if(newJoin){
                hasJoined = true;
                const imageHtmlSection = document.getElementById("imageHtmlSection")
                imageHtmlSection.dataset.value = "has_joined"
            }

            while(div_users.firstChild){
                div_users.removeChild(div_users.firstChild)
            } 

            session.clients.forEach(c => {
                const d = document.createElement("div")
                d.textContent = c.nutzername
                d.style.fontFamily = "Arial"
                div_users.appendChild(d)
            });

            //Zeichnen des Bildes und anschließende Umrechnung der Koordinatendaten für das Zeichnen
            //auf der korrekten Position

            if(session.image != ""){
                const encodedImage = new Image()
                encodedImage.onload = function() {
                    var canvas = document.getElementById('imageCanvas');
                    canvas.width = encodedImage.width;
                    canvas.height = encodedImage.height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(encodedImage,0,0);

                    originalImageX = encodedImage.width
                    originalImageY = encodedImage.height
                    let canvasSizeX = canvas.scrollWidth
                    let canvasSizeY = canvas.scrollHeight
                    let relativePositionX = canvasSizeX/originalImageX
                    let relativePositionY = canvasSizeY/originalImageY
                    kehrwertX = 1/relativePositionX
                    kehrwertY = 1/relativePositionY
                }
                encodedImage.src = session.image
            }
        }

        if (response.method === "get_image"){
            const image = response.image
            const newImage = response.newImage

            //Zeichnen des Bildes und hinzufügen in das restore_array

            const encodedImage = new Image()
            encodedImage.onload = function() {
                var canvas = document.getElementById('imageCanvas');
                canvas.width = encodedImage.width;
                canvas.height = encodedImage.height;
                originalImageX = encodedImage.width;
                originalImageY = encodedImage.height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(encodedImage,0,0);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                restore_array.push(imageData)
                index += 1

                //Anpassen der Zeichnungs-Koordinaten, wenn ein neues Bild mit neuer Auflösung hochgeladen wird

                if(newImage){
                    initialImage = context.getImageData(0, 0, canvas.width, canvas.height)
                    restore_array = [];
                    index = -1;

                    let canvasSizeX = canvas.scrollWidth
                    let canvasSizeY = canvas.scrollHeight
                    let relativePositionX = canvasSizeX/originalImageX
                    let relativePositionY = canvasSizeY/originalImageY
                    kehrwertX = 1/relativePositionX
                    kehrwertY = 1/relativePositionY
                }
            }
            encodedImage.src = image
        }

        if (response.method === "undoImage"){
            //Wenn restore_array mehr als 1 Eintrag hat, soll das Bild einfach ,,gecleared" werden
            //Ansonsten soll der letzte Eintrag aus dem restore_array geladen werden und index um 1 dekrementiert.
            if(index <= 0){
            restore_array = [];
            index = -1;

            context.putImageData(initialImage, 0 , 0)

            } else {
                restore_array.pop();
                index -= 1
                context.putImageData(restore_array[index], 0, 0)
            }
        }

        if (response.method === "clearImage"){
            if(initialImage != ""){
                context.putImageData(initialImage, 0 , 0)
                restore_array = [];
                index = -1;
            }
        }

        if (response.method === "error"){
            console.log(response.message) 
        }
    } 

    // LOGIK FÜR DEN IMAGE UPLOAD

        const image_input = document.querySelector("#image_input");
        var imageLoader = document.getElementById('image_input');
        imageLoader.addEventListener('change', handleImage, false);
        var canvas = document.getElementById('imageCanvas');
        var context = canvas.getContext('2d');

        var initialImage = ""
        var originalImageX = 0
        var originalImageY = 0

        let restore_array = [];
        let index = -1;

        //Funktion um das Bild von der Festplatte zu hochzuladen und anschließende Umrechnung der Zeichnungskoordinaten

        function handleImage(e){
            var reader = new FileReader();
            reader.onload = function(event){
                var img = new Image();
                img.onload = function(){

                    canvas.width = img.width;
                    canvas.height = img.height;
                    originalImageX = img.width;
                    originalImageY = img.height
                    context.drawImage(img,0,0);
                    initialImage = context.getImageData(0, 0, canvas.width, canvas.height)
                    restore_array = [];
                    index = -1;
                   
                    let canvasSizeX = canvas.scrollWidth
                    let canvasSizeY = canvas.scrollHeight
                    let relativePositionX = canvasSizeX/originalImageX
                    let relativePositionY = canvasSizeY/originalImageY
                    kehrwertX = 1/relativePositionX
                    kehrwertY = 1/relativePositionY
                }
            img.src = event.target.result;
            var sendableImage = event.target.result;

                if(sessionId_for_image_send != ""){
                const payLoad = {
                    "method": "upload_image",
                    "clientId": clientId_for_undo_or_clear,
                    "sessionId": sessionId_for_image_send,
                    "image" : sendableImage,
                    "newImage" : true
                }
                ws.send(JSON.stringify(payLoad));
                }
            }
            reader.readAsDataURL(e.target.files[0]);     
        }

    //Funktionen für das Zeichnen auf dem HTML-Canvas

    let isDrawing = false;
    let x = 0;
    let y = 0;
    var offsetX;
    var offsetY;

    var kehrwertX = 0
    var kehrwertY = 0

    var activeColor = "black";

    function change_color(element){
        activeColor = element.style.background;
    }

    function startup() {
        canvas.addEventListener('touchstart', handleStart);
        canvas.addEventListener('touchend', handleEnd);
        canvas.addEventListener('touchcancel', handleCancel);
        canvas.addEventListener('touchmove', handleMove);
        canvas.addEventListener('mousedown', (e) => {
            x = e.offsetX;
            y = e.offsetY;
            isDrawing = true;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
            //Anpassung der Zeichnungskoordinaten durch vorher errechneten Korrekturfaktor (kehrwertX und kehrwertY)
            drawLine(context, x * kehrwertX, y * kehrwertY, e.offsetX * kehrwertX, e.offsetY * kehrwertY);
            x = e.offsetX;
            y = e.offsetY;
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (isDrawing) {
            //Anpassung der Zeichnungskoordinaten durch vorher errechneten Korrekturfaktor (kehrwertX und kehrwertY)
            drawLine(context, x * kehrwertX, y * kehrwertY, e.offsetX * kehrwertX, e.offsetY * kehrwertY);
            x = 0;
            y = 0;
            isDrawing = false;
            }

            if(e.type != 'mouseout'){
                restore_array.push(context.getImageData(0, 0, canvas.width, canvas.height));
                index += 1;
            }

            var jpegUrl = canvas.toDataURL("image/jpeg");

            const payLoad = {
                "method" : "upload_image",
                "clientId" : clientId_for_undo_or_clear,
                "sessionId" : sessionId_for_image_send,
                "image" : jpegUrl,
                "newImage" : false
            }

            ws.send(JSON.stringify(payLoad));
        });
    }

    //Sobald das DOM geladen wurde, sollen dem Canvas die Events für das Zeichnen angefügt werden.
    document.addEventListener("DOMContentLoaded", startup);

    const ongoingTouches = [];

    function handleStart(evt) {
        evt.preventDefault();
        const touches = evt.changedTouches;
        offsetX = canvas.getBoundingClientRect().left;
        offsetY = canvas.getBoundingClientRect().top;
        for (let i = 0; i < touches.length; i++) {
            ongoingTouches.push(copyTouch(touches[i]));
        }
    }

    function handleMove(evt) {
        evt.preventDefault();
        const touches = evt.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const color = activeColor
            const idx = ongoingTouchIndexById(touches[i].identifier);
            if (idx >= 0) {
            context.beginPath();
            context.moveTo(ongoingTouches[idx].clientX - offsetX, ongoingTouches[idx].clientY - offsetY);
            context.lineTo(touches[i].clientX - offsetX, touches[i].clientY - offsetY);
            context.lineWidth = document.getElementById('pen_range').value;
            context.strokeStyle = color;
            context.lineJoin = "round";
            context.closePath();
            context.stroke();
            ongoingTouches.splice(idx, 1, copyTouch(touches[i]));
            }
        }
    }

    function handleEnd(evt) {
        evt.preventDefault();
        const touches = evt.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const color = activeColor
            let idx = ongoingTouchIndexById(touches[i].identifier);
            if (idx >= 0) {
            context.lineWidth = document.getElementById('pen_range').value;
            context.fillStyle = color;
            ongoingTouches.splice(idx, 1);  
            }
        }
    }

    function handleCancel(evt) {
        evt.preventDefault();
        const touches = evt.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            let idx = ongoingTouchIndexById(touches[i].identifier);
            ongoingTouches.splice(idx, 1);  
        }
    }

    function copyTouch({ identifier, clientX, clientY }) {
        return { identifier, clientX, clientY };
    }

    function ongoingTouchIndexById(idToFind) {
        for (let i = 0; i < ongoingTouches.length; i++) {
            const id = ongoingTouches[i].identifier;
            if (id === idToFind) {
            return i;
            }
        }
        return -1;  
    }

    function drawLine(context, x1, y1, x2, y2) {
        context.beginPath();
        context.strokeStyle = activeColor
        context.lineWidth = document.getElementById('pen_range').value;
        context.lineJoin = "round";
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.closePath();
        context.stroke();
    }

    function clearArea() {

        if(initialImage != ""){

            context.putImageData(initialImage, 0, 0)

            restore_array = [];
            index = -1;

            const payLoad = {
                "method" : "clear",
                "clientId" : clientId_for_undo_or_clear,
                "sessionId" : sessionId_for_image_send,
            }

            ws.send(JSON.stringify(payLoad));
        }
    }

    function undo() {
        if(index <= 0){

            restore_array = [];
            index = -1;

            context.putImageData(initialImage, 0, 0)

            const payLoad = {
                "method" : "clear",
                "clientId" : clientId_for_undo_or_clear,
                "sessionId" : sessionId_for_image_send,
            }

            ws.send(JSON.stringify(payLoad));
        } else {
            index -= 1
            restore_array.pop();
            context.putImageData(restore_array[index], 0, 0)
        
            const payLoad = {
                "method" : "undo",
                "sessionId" : sessionId_for_image_send,
                "clientId" : clientId_for_undo_or_clear,
            }

            ws.send(JSON.stringify(payLoad));
        }
    }