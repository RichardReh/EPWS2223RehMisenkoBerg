const express = require("express");
const app = express()



app.get("/", (req, res) => {
    res.sendFile(__dirname +"/index.html")
})

const port = process.env.PORT || 8002
app.listen(port, ()=> {console.log(`listening on port ${port}`)})