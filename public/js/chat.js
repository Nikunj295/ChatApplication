const socket = io()
const $msgform=document.querySelector("#msgform")
const $inputform=document.querySelector("input")
const $buttonform=document.querySelector("button")
const $locationform=document.querySelector("#sendLocation")
const $messages=document.querySelector("#message");
const msgTemplate= document.querySelector("#msgtemplate").innerHTML;
const locTemplate= document.querySelector("#locationtemplate").innerHTML;
const sidebar = document.querySelector("#sidebar-template").innerHTML
const {username, room}= Qs.parse(location.search,{ignoreQueryPrefix:true})
const autoscroll = ()=>{
    const $newMessage = $messages.lastElementChild
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    const visibleHeight = $messages.offsetHeight
    const containerHeight = $messages.scrollHeight
    const scrollOffset =$messages.scrollTop + visibleHeight
    if(containerHeight-newMessageHeight<=scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}
socket.on("message",(msg)=>{
    console.log(msg);
    const html = Mustache.render(msgTemplate,{
        username:msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format("h:mm: a")
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on("locationShared",(url)=>{
    const html = Mustache.render(locTemplate,{
        username :url.username,
        url: url.text,
        createdAt: moment(url.createdAt).format("h:mm: a")
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

$msgform.addEventListener('submit',(e)=>{
    e.preventDefault()

    $buttonform.setAttribute('disabled','disabled')
    const message = e.target.elements.message.value

    socket.emit("sendMessage",message,(err)=>{
        $buttonform.removeAttribute('disabled')
        $inputform.value=''
        $inputform.focus()
        if(err){
            return console.log(err)
        }
        console.log(mess)
    })

})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebar,{
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML=html
})

$locationform.addEventListener("click",()=>{
    if(!navigator.geolocation){
        return alert("Geolocation is not supported by your browser")
    }
    $locationform.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit("sendLocation",{
            lat:position.coords.latitude,
            lon:position.coords.longitude
        },()=>{
            $locationform.removeAttribute('disabled')
            console.log("Location shared")
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})