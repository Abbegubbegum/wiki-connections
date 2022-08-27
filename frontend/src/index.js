$(() => {
    console.log("page loaded");
    $("form").on("submit", formSubmitHandler);
});

function formSubmitHandler(event) {
    event.preventDefault();
    console.log("form submit");
    let inputs = $("input[type=url]");
    $.ajax({
        url: "data",
        type: "GET",
        data: {
            url1: inputs[0].value,
            url2: inputs[1].value,
        },
    })
        .done((res) => {
            console.log(res);
        })
        .fail((err) => {
            console.log(err);
        });
}
