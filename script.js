// زر اللمبة 💡

const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", function () {

    document.body.classList.toggle("light");

    if (document.body.classList.contains("light")) {
        themeBtn.textContent = "🌙";
    } else {
        themeBtn.textContent = "💡";
    }

});


// اختيار الغرفة

function selectRoom(roomName) {

    document.getElementById("room").value = roomName;

    document.getElementById("booking")
        .scrollIntoView({
            behavior: "smooth"
        });
}


// تأكيد الحجز

document.getElementById("bookingForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const name =
            document.getElementById("name").value;

        const room =
            document.getElementById("room").value;

        document.getElementById("message").textContent =
            "تم استلام طلب الحجز بنجاح يا " +
            name +
            " — الغرفة: " +
            room;

        this.reset();
    });