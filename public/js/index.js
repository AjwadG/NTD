// Get all the elements with class shadow__btn and attach a click event listener to each one
document.querySelectorAll(".shadow__btn").forEach((element) => {
  // When a button is clicked
  element.addEventListener("click", () => {
    // Get the id of the clicked button
    const id = element.id;
    // Get the value of the radio button that is checked
    let compiler = document.querySelector(".choice-circle:checked").value;
    // Get the value of the textarea (code)
    let code = element.parentElement.parentElement.lastChild.value;
    // Make an AJAX POST request to /que with the compiler, code, and id as data
    $.ajax({
      url: "/2",
      type: "POST",
      data: {
        compiler,
        code,
        id,
      },
      // If the request is successful, update the text content of output with the data received
      success: function (data) {
        element.parentElement.parentElement.parentElement.lastElementChild.firstChild.textContent =
          data.data;
          if (data.correct) {
            element.setAttribute("style", "background-color: green");
            setTimeout(() => {
              element.remove();
              if(document.querySelectorAll(".shadow__btn").length == 0) {
                location.reload();
              };
            }, 1000);
          } else {
            element.setAttribute("style", "background-color: red");
          }
      },
      // If there is an error, log the data to the console
      error: function (data) {
        console.log(data);
      },
    });
  });
});

