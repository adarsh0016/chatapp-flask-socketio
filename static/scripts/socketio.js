document.addEventListener('DOMContentLoaded', () => {

    //connect ot socket.io
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    //if there is a room_name (came here from create_room page) it joins the room and if not (came here from login page) makes the input bar invisible.
    room = room_name;
    if (room_name != "") {
        joinRoom(room);
    } else {
        document.getElementById("user_message").style.visibility="hidden";
        document.getElementById("send_message").style.visibility="hidden";
        document.getElementById("send_image").style.visibility="hidden";
        msg = "Select a room and start chating!";
        printSysMsg(msg);
    }

    // displays incomming messages
    // Display all incoming messages
    socket.on('message', data => {
        print_msg_other(data,username);
    });

    socket.on('img', img_data => {
        if (img_data['username'] != username){
            printOtherImg(img_data['img'],img_data['username']);
        }
    });
   
    // send message
    document.querySelector('#send_message').onclick = () =>{
        if (document.querySelector('#user_message').value != ""){
            var data = {'msg': document.querySelector('#user_message').value, 'username': username, 'room': room };
            print_my_msg(data,username);
            socket.send(data);
        }

        // console.log(document.getElementById('img_upload').files[0]);
        var imgSelected = document.getElementById("img_upload").files;
        if (imgSelected.length > 0){
            var fileToLoad = imgSelected[0];

            var fileReader = new FileReader();

            fileReader.onload = function(fileLoadedEvent) {
                var img_src = fileLoadedEvent.target.result;

                var img_data = {'img': img_src, 'username':username, 'room':room };
                printMyImg(img_src, username);
                socket.emit('img', img_data);
            }
            fileReader.readAsDataURL(fileToLoad);
        }

        document.getElementById('img_upload').value = "";
        var image = document.getElementById('img_output');
        image.style.display = "none";
        document.querySelector(".selected_img").style.display="none";

        //clear input box
        document.querySelector('#user_message').value = '';
        document.querySelector('#user_message').focus();
    };

    //Room selesction
    document.querySelectorAll('.select-room').forEach(p => {
        p.onclick = () => {

            socket.on('new_join_history', data => {
                socket.off('new_join_history');
                for (var i =0; i<data.length; i++){
                    print_msg_history(data[i],username);
                }
            });
            
            // remove the menu
            if (window.innerWidth < 875) { 
                document.querySelectorAll(".mobile-hide").forEach(p => {
                    p.style.display="none";
                });
            }

            //making the input bar visible.
            document.getElementById("user_message").style.visibility="visible";
            document.getElementById("send_message").style.visibility="visible";
            document.getElementById("send_image").style.visibility="visible";
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

    window.onbeforeunload = function () {
        socket.emit('leave', {'username': username, 'room': room});
    }

    function print_msg_other(data,username){
        // Display current message
        if (data.msg) {
            const p = document.createElement('p');
            const span_username = document.createElement('span');
            const span_timestamp = document.createElement('span');
            const br = document.createElement('br');
            // Display other users' messages
            if (data.username != username){
                if (typeof data.username !== 'undefined') {
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
        }
        scrollDownChatWindow();
    }

    function print_my_msg(data,username){
        var d = new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
        var m = d.getMonth();
        var date = d.getDate();
        var hr = d.getHours();
        var min = d.getMinutes();
        if (min < 10) {
            min = "0" + min;
        }
        var ampm = "AM";
        if( hr > 12 ) {
            hr -= 12;
            ampm = "PM";
        }
        
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
                    span_timestamp.innerText = monthNames[m] + "-" + date + " " + hr +":" + min + ampm;

                    // HTML to append
                    p.innerHTML += span_username.outerHTML + br.outerHTML + data.msg + br.outerHTML + span_timestamp.outerHTML

                    //Append
                    document.querySelector('#display-message-section').append(p);
            }
        }
        scrollDownChatWindow();
    }

    function printMyImg(img_src,username){
        if (img_src) {
            const p = document.createElement('p');
            const span_username = document.createElement('span');
            const chat_img = document.createElement('img');
            const br = document.createElement('br')
            // Display user's own img
                p.setAttribute("class", "my-img");
                chat_img.setAttribute("class", "chat-img");
                chat_img.src = img_src;

                // Username
                span_username.setAttribute("class", "my-username");
                span_username.innerText = username;

                // HTML to append
                p.innerHTML += span_username.outerHTML + br.outerHTML + chat_img.outerHTML;

                //Append
                document.querySelector('#display-message-section').append(p);

                //open image
                document.querySelectorAll('.chat-img').forEach(p => {
                    p.onclick = () => {
                        document.querySelector(".enlarged-img").style.display = "block";
                        var img_src = p.src;
                        document.querySelector("#open_img").src = img_src;
                    }
                });
        }
        scrollDownChatWindow();
    }

    function printOtherImg(img_src,username){
        if (img_src) {
            const p = document.createElement('p');
            const span_username = document.createElement('span');
            const chat_img = document.createElement('img');
            const br = document.createElement('br')
            // Display other user's img
                p.setAttribute("class", "other-img");
                chat_img.setAttribute("class", "chat-img");
                chat_img.src = img_src;

                // Username
                span_username.setAttribute("class", "other-username");
                span_username.innerText = username;

                // HTML to append
                p.innerHTML += span_username.outerHTML + br.outerHTML + chat_img.outerHTML;

                //Append
                document.querySelector('#display-message-section').append(p);

                //open image
                document.querySelectorAll('.chat-img').forEach(p => {
                    p.onclick = () => {
                        document.querySelector(".enlarged-img").style.display = "block";
                        var img_src = p.src;
                        document.querySelector("#open_img").src = img_src;
                    }
                });
        }
        scrollDownChatWindow();
    }

    function print_msg_history(data,username){
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
        }
        scrollDownChatWindow();
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
        document.querySelector('#' + CSS.escape(room)).style.backgroundColor = "#0704b1";
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