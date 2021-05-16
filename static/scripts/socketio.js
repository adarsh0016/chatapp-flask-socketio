document.addEventListener('DOMContentLoaded', () => {

    //connect ot socket.io
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    console.log(socket)

    room = room_name;
    if (room_name != "") {
        joinRoom(room);
    } else {
        document.getElementById("user_message").style.visibility="hidden";
        document.getElementById("send_message").style.visibility="hidden";
        msg = "Select a room and start chating!";
        printSysMsg(msg);
    }

    // displays incomming messages
    // Display all incoming messages
    socket.on('message', data => {

        // Display current message
        if (data.msg) {
            const p = document.createElement('p');
            const span_username = document.createElement('span');
            const span_timestamp = document.createElement('span');
            const br = document.createElement('br')
            // Display user's own message
            if (data.username == username) {
                    p.setAttribute("class", "my-msg");

                    // Username
                    span_username.setAttribute("class", "my-username");
                    span_username.innerText = data.username;

                    // Timestamp
                    span_timestamp.setAttribute("class", "timestamp");
                    span_timestamp.innerText = data.time_stamp;

                    // HTML to append
                    p.innerHTML += span_username.outerHTML + br.outerHTML + data.msg + br.outerHTML + span_timestamp.outerHTML

                    //Append
                    document.querySelector('#display-message-section').append(p);
            }
            // Display other users' messages
            else if (typeof data.username !== 'undefined') {
                p.setAttribute("class", "others-msg");

                // Username
                span_username.setAttribute("class", "other-username");
                span_username.innerText = data.username;

                // Timestamp
                span_timestamp.setAttribute("class", "timestamp");
                span_timestamp.innerText = data.time_stamp;

                // HTML to append
                p.innerHTML += span_username.outerHTML + br.outerHTML + data.msg + br.outerHTML + span_timestamp.outerHTML;

                //Append
                document.querySelector('#display-message-section').append(p);
            }
            // Display system message
            else {
                // Checks if other user has joined or its our own msg.
                if (data.name != username){
                    printSysMsg(data.msg);
                }
            }


        }
        scrollDownChatWindow();
    });

   
    // send message
    document.querySelector('#send_message').onclick = () =>{
        socket.send({'msg': document.querySelector('#user_message').value, 'username': username, 'room': room });
        //clear input box
        document.querySelector('#user_message').value = '';
    };

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

    //Logout button
    document.querySelector('#logout_button').onclick = () => {
        leaveRoom(room_name)
    }


    //Leave room
    function leaveRoom(room){
        socket.emit('leave', {'username': username, 'room': room});

        //non-highlighting the room name
        document.querySelectorAll('.select-room').forEach(p => {
            p.style.backgroundColor = "";
            p.style.textAlign = "left";
            p.style.padding = "0";
            p.style.borderRadius = "0";
        });
    }

    //joinroom
    function joinRoom(room){
        socket.emit('join', {'username': username, 'room': room});

        // Highlight selected room
        document.querySelector('#' + CSS.escape(room)).style.backgroundColor = "tomato";
        document.querySelector('#' + CSS.escape(room)).style.textAlign = "center";
        document.querySelector('#' + CSS.escape(room)).style.padding = "0.5em";
        document.querySelector('#' + CSS.escape(room)).style.borderRadius = "20px";

        // Clear message area
        document.querySelector('#display-message-section').innerHTML = ''
        // autofocus on the textbox
        document.querySelector('#user_message').focus();

        //printing you joined the room
        printSysMsg("You joined the '" + room + "' room.")
    }

    // Scroll chat window down
    function scrollDownChatWindow() {
        const chatWindow = document.querySelector("#display-message-section");
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Print system messages
    function printSysMsg(msg) {
        const p = document.createElement('p');
        p.setAttribute("class", "system-msg");
        p.innerHTML = msg;
        document.querySelector('#display-message-section').append(p);
        scrollDownChatWindow()

        // Autofocus on text box
        document.querySelector("#user_message").focus();
    }
});

//38