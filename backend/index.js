const express=require("express")
const app=express()
const cors=require("cors")
app.use(cors())

const {WebSocket,WebSocketServer}=require("ws")

const server=require("http").createServer(app);
const wss=new WebSocketServer({server})

let rooms={}

function broadcastToRoom(roomId, message, excludeClient=null) {
    if(!rooms[roomId]) {
        console.log("No such room present")
        return;
    }
    console.log(`Broadcasting to ${rooms[roomId].length} clients in room ${roomId}`); // Debug log

    // Send to self
    if(excludeClient) {
        excludeClient.send(JSON.stringify({
            type: 'message',
            content: message,
            timestamp: new Date().toISOString()
        }));
    }

    // Send to others
    rooms[roomId].forEach(client => {
        if(client !== excludeClient && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'message',
                content: message,
                timestamp: new Date().toISOString()
            }));
        }
    });
}

wss.on('connection',(ws)=>{
    console.log("New Client Entered to the web socket server!")

    ws.on('message',(data)=>{
        try {
            const message=JSON.parse(data)
            console.log('Server received:', message)  // Add this
            if(message.type==="join"){
                const roomId=message.roomId
                ws.roomId=roomId

                if(!rooms[roomId]){
                    rooms[roomId]=[]
                }
                rooms[roomId].push(ws)

                ws.send(JSON.stringify({
                    type:'system',
                    content:`Joined room: ${roomId}`,
                    timestamp:new Date().toISOString()
                }))

                broadcastToRoom(roomId,'New user joined the room',ws)
                console.log(`Client joined room: ${roomId}, ${rooms[roomId].length}`)
            }
            if(message.type==="chat"){
                if(ws.roomId){
                    broadcastToRoom(ws.roomId,message.content,ws)
                }
            }
        } catch (error) {
            console.log("server side error ",error)
        }
    })

    ws.on('close',()=>{
        if(ws.roomId){
            const roomClients=rooms[ws.roomId]
            if(roomClients){
                rooms[ws.roomId]=roomClients.filter(client=>client!==ws)
                broadcastToRoom(ws.roomId,'A user left the room')
                console.log(`Client left the room: ${ws.roomId} ${rooms[ws.roomId].length}`)
            }
        }
    })

    ws.on('error',()=>{
        console.log(error)
    })
})

const PORT=5000;
server.listen(PORT,()=>{
    console.log("server listening on port 5000",)
})