$(() => {
	console.log("page loaded");
	$("form").on("submit", formSubmitHandler);
});

function formSubmitHandler(event) {
	event.preventDefault();
	let inputs = $("input[type=text]");
	$.ajax({
		url: "data",
		type: "GET",
		data: {
			start: inputs[0].value,
			end: inputs[1].value,
		},
	})
		.done((res) => {
			console.log(res);
		})
		.fail((err) => {
			console.log(err);
		});
}
