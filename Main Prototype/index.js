const express = require("express");
const app = express()

app.use(express.static('public'))


app.get("/", (req, res) => {
    res.sendFile(__dirname +"/views/index.html")
})

const port = process.env.PORT || 8002
app.listen(port, ()=> {console.log(`listening on port ${port}`)})