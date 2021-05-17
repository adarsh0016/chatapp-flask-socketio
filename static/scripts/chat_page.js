document.addEventListener('DOMContentLoaded', () => {

    //ham button mobile version
    document.querySelector("#ham").onclick = () => {
        document.querySelectorAll(".mobile-hide").forEach(p => {
            p.style.display = "block";
        });
    }
    //ham exit
    document.querySelector("#ham_exit").onclick = () =>{
        document.querySelectorAll(".mobile-hide").forEach(p => {
            p.style.display="none";
        });
    }

    // Make 'enter' key submit message
    let msg = document.querySelector("#user_message");
    msg.addEventListener("keyup", event => {
        event.preventDefault();
        if (event.keyCode === 13) {
            document.querySelector("#send_message").click();
        }
    });

});