document.addEventListener('DOMContentLoaded', () => {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    room = room_name;
    if (room_name != "") {
        joinRoom(room);
    } else {
        document.getElementById("user_message").style.visibility="hidden";
        document.getElementById("send_message").style.visibility="hidden";
        msg = "Select a room and start chatting!";
        printSysMsg(msg);
    }

    // displays incomming messages
    socket.on('message', data => {
        const p = document.createElement('p');
        const span_username = document.createElement('span');
        const span_timestamp =document.createElement('span');
        const br = document.createElement('br');

        if (data.username) {
            span_username.innerHTML = data.username;
            span_timestamp.innerHTML = data.time_stamp;
            p.innerHTML = span_username.outerHTML + br.outerHTML + data.msg +br.outerHTML + span_timestamp.outerHTML;
            document.querySelector("#display-message-section").append(p);
        } else {
            printSysMsg(data.msg);
        }
        
    });

   
    // send message
    document.querySelector('#send_message').onclick = () =>{
        socket.send({'msg': document.querySelector('#user_message').value, 'username': username, 'room': room });
        //clear input box
        document.querySelector('#user_message').value = '';
    }

        //Room selesction
        document.querySelectorAll('.select-room').forEach(p => {
            p.onclick = () => {
                document.getElementById("user_message").style.visibility="visible";
                document.getElementById("send_message").style.visibility="visible";
                let newRoom = p.innerHTML;
                if (newRoom != room) {
                    leaveRoom(room);
                    joinRoom(newRoom);
                    room = newRoom;
                }
            };
        });

    //New room button
    document.querySelector('#create_room').onclick = () => {
        leaveRoom(room_name)
    }


    //Leave room
    function leaveRoom(room){
        socket.emit('leave', {'username': username, 'room': room});
    }

    //joinroom
    function joinRoom(room){
        socket.emit('join', {'username': username, 'room': room});
        // Clear message area
        document.querySelector('#display-message-section').innerHTML = ''
        // autofocus on the textbox
        document.querySelector('#user_message').focus();
    }

    //print system message
    function printSysMsg(msg){
        const p =document.createElement('p');
        p.innerHTML = msg;
        document.querySelector('#display-message-section').append(p);

    }
})