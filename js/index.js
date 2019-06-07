var init = function(){

	// Set up event listener to look for clicks on the calculate button
	document.getElementById('calculate').addEventListener('click', function(){

		event.preventDefault();

		// Get instance of Payment Schedule
		var paymentScheduleObject = new PaymentSchedule({});

		// Init in order to calculate
		paymentScheduleObject.init();

	});

};

/*
This function is a simple function to show some animation
when hovering over each car on the results block. Is triggered
when you mouseover.
*/
var activeToggle = function(element){

	/*
	Here we'll get the container that the cars will
	be loaded into and add a is-hovering class
	*/
	var container = document.getElementById('cars');
	container.className += ' is-hovering';

	// Loop through all cars and remove active class
	var allCars = document.getElementsByClassName('allCars');
	for (var i = allCars.length - 1; i >= 0; i--) {
		allCars[i].classList.remove('active');
	};

	/*
	Then we want to add the active class
	to the current one you are hovering on for
	the visual effect.
	*/
	element.className += ' active';

};

/*
This function is the opposite to the activeToggle
function above. Is triggered when you mouseout.
*/
var unsetActiveToggles = function(element){

	// Remove the active class from the class you hovered out of
	element.classList.remove('active');

	// Remove the is-hovering class from the main container
	var container = document.getElementById('cars');
	container.classList.remove('is-hovering');

};

/*
Instantiate the date picker library.
*/
var datepicker = document.getElementById('datepicker').flatpickr({
	'dateFormat': 'd-m-Y'
});

init();