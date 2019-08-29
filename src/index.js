const path =require("path");
const express = require("express");
const port = process.env.PORT || 3000
const socketio = require("socket.io")
const http = require("http")
const Filter = require("bad-words")
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const DirPath = path.join(__dirname,'../public')
const { genMsg } = require("./utils/message");
const { locMsg } = require("./utils/message");
const {addUser,removeUser,getUser,getUserRoom} = require("./utils/users");
app.use(express.static(DirPath))

io.on("connection",(socket)=>{
    
    socket.on('join',(options,callback)=>{
        const {error, user }=addUser({id:socket.id, ...options})
        if(error){
            return callback(error)
        }
        
        socket.join(user.room)
        socket.emit("message",genMsg("Admin","Welcome"));  
        socket.broadcast.to(user.room).emit("message",genMsg("Admin",`${user.username} has joined...`))
        
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUserRoom(user.room)
        })

        callback()   
    })

    socket.on("sendMessage",(msg,callback)=>{
        const user = getUser(socket.id)

        const filter = new Filter();

        if(filter.isProfane(msg)){
            return callback("Profanity is not allowed!")
        }
        io.to(user.room).emit("message",genMsg(user.username,msg))
        callback("Delivered")
    })
    
    socket.on("sendLocation",(coords,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit("locationShared", locMsg(user.username,`https://google.com/maps?q=${coords.lat},${coords.lon}`))
        callback("Done")
    })
    
    
    socket.on("disconnect",()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit("message",genMsg('Admin',`${user.username} has left!`));
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUserRoom(user.room)
            })
        }
    })
})




server.listen(port,()=>{
    console.log("Server"+port)
})