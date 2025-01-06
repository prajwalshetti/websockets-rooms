import { useCallback, useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [room,setRoom]=useState('')
  const [message,setMessage]=useState('')
  const [chats,setChats]=useState([])
  const [socket,setSocket]=useState(null)
  const [isConnected,setIsConnected]=useState(false)
  const [error,setError]=useState("")

  const connectWebSocket=useCallback(()=>{
    const ws=new WebSocket("ws://localhost:5000")

    ws.addEventListener('open',()=>{
      setIsConnected(true)
      setError('')
    })

    ws.addEventListener('message',(event)=>{
      try {
        const data=JSON.parse(event.data)
        console.log('Client received:', data)  // Add this
        setChats((prevChats)=>[...prevChats,data])
      } catch (error) {
        console.log(error)
      }
    })

    ws.addEventListener('close',()=>{
      setIsConnected(false)
      setTimeout(connectWebSocket, 3000);
    })

    ws.addEventListener('error',(error)=>{
      setError(error)
      console.log(error)
    })

    setSocket(ws)
    return ()=>{
      if(ws.readyState==WebSocket.OPEN){
        ws.close()
      }
    }
  },[])

  useEffect(()=>{
    connectWebSocket()
  },[connectWebSocket])

  const sendMessage=useCallback(()=>{
    if(socket?.readyState==WebSocket.OPEN&&message.trim()){
      socket.send(JSON.stringify({
        type:'chat',
        content:message,
        roomId:room
      }))
      setMessage('')
    }
  },[socket,message,room])

  const joinRoom=useCallback(()=>{
    if(socket?.readyState==WebSocket.OPEN){
      socket.send(JSON.stringify({
        type:'join',
        roomId:room
      }))
    }
  },[socket,room])

  const handleKeyPress=(event)=>{
    if(event.key=='Enter'&&!event.shiftKey){
      event.preventDefault();
      sendMessage()
    }
  }

  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto">
        {error && (
          <div className="bg-red-500 text-white p-2 mb-4 rounded">
            {error}
          </div>
        )}
        {chats.map((msg, index) => (
          <div key={index} className="mb-2 p-2 bg-gray-800 rounded">
            <div className="text-sm text-gray-400">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
            <div className={msg.type === 'system' ? 'text-yellow-400' : ''}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Enter room name"
            className="flex-1 bg-gray-700 p-2 rounded text-white"
          />
          <button 
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            onClick={joinRoom}
            disabled={!isConnected || !room.trim()}
          >
            Join Room
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 p-2 rounded text-white"
            disabled={!isConnected || !room}
          />
          <button 
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={sendMessage}
            disabled={!isConnected || !room || !message.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App
