document.querySelectorAll(".run-btn").forEach((element) => {
  element.addEventListener("click", () => {
    let compiler = document.querySelector(".choice-circle:checked").value;
    let code = element.parentElement.parentElement.lastChild.value;
    console.log(compiler, code);
    $.ajax({
      url: "/que",
      type: "POST",
      data: {
        compiler,
        code,
      },
      success: function (data) {
        element.parentElement.parentElement.parentElement.lastElementChild.firstChild.textContent =
          data.data;
        console.log(data);
      },
      error: function (data) {
        console.log(data);
      },
    });
  });
});
