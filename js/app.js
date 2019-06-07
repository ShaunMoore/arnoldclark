var PaymentSchedule = function(){

	/*
	Set thisObject = this. Done because issues generally are 
	arising when referencing once you go into a callback function.
	*/
	var thisObject = this;

	/*
	Set the properties for main input fields.
	*/
	this.vehiclePrice;
	this.depositAmount;
	this.deliveryDate;
	this.financeOption;

	/*
	The different finance options config from
	one to three years.
	*/
	this.allFinanceOptions = {
		'oneYear': {
			value: 'One Year',
			months: 12
		},
		'twoYear': {
			value: 'Two Year',
			months: 24
		},
		'threeYear': {
			value: 'Three Year',
			months: 36
		},
	};

	/*
	Minimum deposit setting. Can be changed down to the line. Used
	primarily within the validation.
	*/
	this.minimumDepositAmount = 15;
	
	// Extra amount added to monthly fee for the first month
	this.arrangementFee = 88;
	// Extra amount added to monthly fee for the last month
	this.completionFee = 20;

	/*
	Here we set the vehicle price minus the deposit. Which
	is self explanatory but is done because we will divide the 
	difference by the finance option (in months) and find the standard monthly 
	payment.
	*/
	this.vehiclePriceMinusDeposit = 0;
	// The value of the monthly payment
	this.monthlyPayment = 0;

	// Value of the monthly payment plus arrangement fee
	this.monthlyPaymentPlusArrangementFee = this.monthlyPayment + this.arrangementFee;
	// Value of the monthly payment plus completion fee
	this.monthlyPaymentPlusCompletionFee = this.monthlyPayment + this.completionFee;

	/*
	In this array we will eventually store all the payments to be made. 
	It includes properties for the payment value for that month and also a 
	date object for the date the payment should be made.
	*/
	this.getPaymentsBreakdown = [];

	// The endpoint to ping. We dynamically create it with a new monthly payment amount.
	this.carDataEndpoint = '';
	// The amount of cars that we want to show in the cars container.
	this.carsToShow = 6;

	// Below are containers which are used throughout for DOM manipulation
	this.errorContainer = document.getElementById('errors');
	this.carsContainer = document.getElementById('cars');
	this.paymentsScheduleContainer = document.getElementById('payments-schedule');
	this.paymentsScheduleDatesContainer = document.getElementById('payments-schedule-dates');

	/*
	This object stores error messages and is used 
	as part of the checkValidation() function.
	*/
	this.validate = {
		'status': true,
		'errors': {}
	};

	// Simple init to get the ball rolling
	this.init = function(){

		/*
		This function just clears HTML produced by an old
		instance or displays none to hide containers.
		*/
		this.resetAllBlockHTML();

		// Here we'll check validation before we go any further
		if(this.checkValidation() === false){
			return this.displayErrors();
		}

		/*
		If validation is successful for each input field. We 
		will now go ahead and calculate the payments and get some
		car data then display all of this.
		*/
		this.calculatePayments();

	};

	/*
	This function just clears HTML produced by an old
	instance or displays none to hide containers.
	*/
	this.resetAllBlockHTML = function(){
		this.errorContainer.innerHTML = '';
		this.carsContainer.innerHTML = '';
		this.paymentsScheduleDatesContainer.innerHTML = '';
		this.paymentsScheduleContainer.style.display = 'none';
	};

	/******** Check validation & build errors array *********/

	/*
	Check the vehicle price is valid and we pull this value
	directly from the input value.
	*/
	this.vehiclePriceValidation = function(){

		var errors = [];
		var inputField = this.getVehiclePriceInputField();

		if(isNaN(inputField) || inputField == 0 || inputField == ''){
			errors.push('Please set a vehicle price');
		}

		if(errors.length){
			this.validate.status = false;
			this.validate.errors['vehiclePrice'] = errors;
		}

	};

	/*
	Check the deposit amount is valid and we pull this value
	directly from the input value.
	*/
	this.depositAmountValidation = function(){

		var errors = [];
		var inputField = this.getDepositAmountInputField();

		if(isNaN(inputField) || inputField == 0 || inputField == ''){
			errors.push('Please set a deposit amount');
		}

		if(this.calculateDepositAmountPercentage() < this.minimumDepositAmount){
			errors.push('Minimum deposit is '+this.minimumDepositAmount+'%, your current deposit amount is '+this.calculateDepositAmountPercentage()+'%')
		}

		if(errors.length){
			this.validate.status = false;
			this.validate.errors['depositAmount'] = errors;
		}

	};

	/*
	Check the delivery date is valid and we pull this value
	directly from the input value.
	*/

	this.deliveryDateValidation = function(){

		var errors = [];
		var inputField = this.getDeliveryDateInputField();

		if(inputField == ''){
			errors.push('Please set a delivery date');
		}

		if( !moment(inputField, "DD-MM-YYYY").isValid() ){
			errors.push('Your delivery date is not a valid date')
		}

		if(errors.length){
			this.validate.status = false;
			this.validate.errors['deliveryDate'] = errors;
		}

	};

	/*
	Check the finance option is valid and we pull this value
	directly from the input value.
	*/
	this.financeOptionValidation = function(){

		var errors = [];
		var inputField = this.allFinanceOptions[this.getFinanceOptionInputField()];

		if(inputField === undefined){
			errors.push('Please set a finance option');
		}

		if(errors.length){
			this.validate.status = false;
			this.validate.errors['financeOption'] = errors;
		}

	};

	/*
	The function which triggers validation for each
	input and returns false if there is invalid data and true
	if everything passed validation.
	*/
	this.checkValidation = function(){

		this.vehiclePriceValidation();
		this.depositAmountValidation();
		this.deliveryDateValidation();
		this.financeOptionValidation();

		if(this.validate.status == false){
			return false;
		}

		return true;

	};

	/******** Calculating payments based on inputted data *********/

	this.calculatePayments = function(){

		/*
		For each input field we will get the data directly from the 
		input value itself and then we pass this to the set function. We can 
		now get this newly set value throughout by calling this.getVehiclePrice() 
		for example.
		*/
		var setVehiclePrice = this.setVehiclePrice(this.getVehiclePriceInputField());
		var setDepositAmount = this.setDepositAmount(this.getDepositAmountInputField());
		var setDeliveryDate = this.setDeliveryDate(this.getDeliveryDateInputField());
		var setFinanceOption = this.setFinanceOption(this.getFinanceOptionInputField());

		/*
		The function to calculate the date of payments and 
		the amounts to be paid.
		*/
		this.setPaymentObjects();

		/*
		This function makes an AJAX call to the Arnold Clark 
		endpoint, once that's complete we then take the response data and 
		update the DOM.
		*/
		this.getAndDisplayCarData();

		/*
		This simply produces a block on the API detailing
		each payment and the date this has to be made.
		*/
		this.displayPayments();

	};

	/*
	The function to calculate the dates and the amounts 
	that have to be paid every month.
	*/
	this.setPaymentObjects = function(){

		// Here we calculate the monthly payment
		this.setMonthlyPayment();

		/*
		We now get the start date of the loan and the 
		end date of the loan. We will soon iterate over each month
		between the start and end date.
		*/
		var startDate = moment(this.getDeliveryDate(), "DD-MM-YYYY").add(1, 'months').format("DD-MM-YYYY");
		var endDate = moment(startDate, "DD-MM-YYYY").add(this.allFinanceOptions[this.getFinanceOption()].months, 'months');

		// Copy of the start date
		var startDateLoop = moment(startDate, "DD-MM-YYYY");

		/*
		The loop that will iterate over each month.
		*/
		while (startDateLoop.isBefore(endDate)){
			this.getPaymentsBreakdown.push({
				// This value should be the first Monday of each month
				'paymentDate': this.getPaymentDate(startDateLoop.month(), startDateLoop.year()),
				// This value is the standard monthly payment to be paid for this month
				'paymentValue': this.monthlyPayment,
			})
			/*
			After each loop we add 1 month to the start date until 
			the start date is no longer before the endDate set above.
			*/
			startDateLoop.add(1, 'months');
		}

		// Here the arrangement and completion fees are set.
		this.setAdditionalPayments();

	};

	/*
	This funciton was created as this.monthlyPayment seems 
	to be getting set to type of string somewhere. Which was affecting calculations.
	*/
	this.getMonthlyPayment = function(){
		return parseInt(this.monthlyPayment);
	};

	// Here we calculate the monthly payment
	this.setMonthlyPayment = function(){
		this.vehiclePriceMinusDeposit = this.getVehiclePrice() - this.getDepositAmount();
		this.monthlyPayment = this.vehiclePriceMinusDeposit / this.allFinanceOptions[this.getFinanceOption()].months;
	};

	// Set arrangement and completion fee
	this.setAdditionalPayments = function(){
		this.getPaymentsBreakdown[0].paymentValue += this.arrangementFee;
		this.getPaymentsBreakdown[this.getPaymentsBreakdown.length - 1].paymentValue += this.completionFee;
	};

	/*
	Here we find the day of the month to take payment.
	*/
	this.getPaymentDate = function(month, year){

		// Start at the 1st of the month for this year
		var dateObject = new Date(year, month, 1, 0, 0, 0, 0);

		/*
		Loop until we hit a monday and return the 
		date object from the function.
		*/
		while(dateObject.getDay() != 1){
			dateObject.setDate( dateObject.getDate() + 1 );
		}

		return dateObject;

	};

	/*
	Calculate the deposit amount. Mainly used for the error message
	when running through the validation.
	*/
	this.calculateDepositAmountPercentage = function(){
		return (this.getDepositAmountInputField()/this.getVehiclePriceInputField()) * 100;
	};

	/******** Get & Set for each <input> *********/

	/*
	Below are the setters and getters for each input field. There are 2 get functions.
	One to get the value that has been set and one to get the value directly from the 
	<input> field DOM value. There is one set method which takes a 
	parameter (which is usually from the input field directly) and sets it.
	*/

	this.getVehiclePriceInputField = function(){
		return parseInt(document.getElementsByName('vehiclePrice')[0].value);
	};

	this.getVehiclePrice = function(){
		return this.vehiclePrice;
	};

	this.setVehiclePrice = function(price){
		return this.vehiclePrice = (isNaN(price)) ? 0 : price;
	};

	this.getDepositAmountInputField = function(){
		return parseInt(document.getElementsByName('depositAmount')[0].value);
	};

	this.getDepositAmount = function(){
		return this.depositAmount;
	};

	this.setDepositAmount = function(amount){
		return this.depositAmount = (isNaN(amount)) ? 0 : amount;
	};

	this.getDeliveryDateInputField = function(){
		return document.getElementsByName('deliveryDate')[0].value;
	};

	this.getDeliveryDate = function(){
		return this.deliveryDate;
	};

	this.setDeliveryDate = function(date){
		return this.deliveryDate = moment(date, "DD-MM-YYYY").format("DD-MM-YYYY");
	};

	this.getFinanceOptionInputField = function(){
		return document.getElementsByName('financeOption')[0].value;
	};

	this.getFinanceOption = function(){
		return this.financeOption;
	};

	this.setFinanceOption = function(option){
		return this.financeOption = option;
	};

	/******** Getting data & displaying data in DOM *********/

	/*
	The endpoint to get data from. The maximum monthly 
	price is dynamic.
	*/
	this.setCarEndpoint = function(){
		return this.carDataEndpoint = 'https://cors-anywhere.herokuapp.com/https://www.arnoldclark.com/used-cars/search.json?payment_type=monthly&amp;min_price=100&amp;max_price='+this.monthlyPayment+'&amp;sort_order=monthly_payment_down';
	};

	/*
	Here we handle the AJAX request
	*/
	this.startAjax = function(url, type, data, callback){

		/*
		Get request object, set the URL and data to be passed. We
		do not send any data. Our parameters are GET within the URL itself.
		*/
		var request = new XMLHttpRequest();
		request.open(type, url);
		request.send(JSON.stringify(data));

		// Here we handle the response and execute the callback()
		request.onreadystatechange = function(){
			if(request.status >= 200 && request.status < 400){
				if(request.readyState == 4 && request.status == 200){
					callback(JSON.parse(request.responseText));
				}
			}else{
				callback(JSON.parse(request.responseText));
			}
		};

	};

	/*
	This function checks for errors created during validation
	and displays them in the DOM if they exist.
	*/
	this.displayErrors = function(){

		var errors = this.validate.errors;
		Object.keys(this.validate.errors).forEach(function(key){
			errors[key].forEach(function(errorItem){

				/*
				We loop through each error array item and simply
				display the test within a SPAN that is nested within a DIV.
				We then append these elements to the error container
				*/

				var errorElement = document.createElement('div');
				errorElement.className += ' error';

				var errorSpan = document.createElement('span');
				errorSpan.className += ' error-span';
				errorSpan.textContent = errorItem;

				errorElement.appendChild(errorSpan);
				thisObject.errorContainer.appendChild(errorElement);

			});
		});

	};

	this.displayPayments = function(){

		/*
		Set the H1 for the first months payment. This payment is
		calculated as the standard monthly + the arrangement fee.
		*/
		var monthlyPaymentPlusArrangement = document.querySelector('#monthly-payment-plus-arrangement-fee h1');
		monthlyPaymentPlusArrangement.innerHTML = '&pound;'+(this.getMonthlyPayment()+this.monthlyPaymentPlusArrangementFee);

		/*
		Set the H1 for the last months payment. This payment is
		calculated as the standard monthly + the completion fee.
		*/
		var monthlyPaymentPlusCompletion = document.querySelector('#monthly-payment-plus-completion-fee h1');
		monthlyPaymentPlusCompletion.innerHTML = '&pound;'+(this.getMonthlyPayment()+this.monthlyPaymentPlusCompletionFee);

		/*
		Set the H1 for the standard monthly payment.
		*/
		var monthlyPaymentStandard = document.querySelector('#standard-monthly-payment h1');
		monthlyPaymentStandard.innerHTML = '&pound;'+this.getMonthlyPayment();

		/*
		Here we want to create payments grid for each payment date 
		and the amount to be paid on that date.
		*/
		this.getPaymentsBreakdown.forEach(function(payment){

			var paymentsScheduleDate = document.createElement('div');
			paymentsScheduleDate.className += 'col-sm-1 payments-schedule-date';

			/*
			This holds the following:
				The day of the month with ordinal suffix & the month shorthand "FEB" or "APR"
				The year as "2019" or "2021" etc
				The monthly amount for this month.
			*/
			var span = document.createElement('span');
			span.innerHTML += moment(payment.paymentDate).format('Do')+' '+moment(payment.paymentDate).format('MMM')+'<br>';
			span.innerHTML += payment.paymentDate.getFullYear()+'<br><br>';
			span.innerHTML += '&pound;'+parseFloat(parseInt(payment.paymentValue)).toFixed(2)+'<br>';

			paymentsScheduleDate.appendChild(span);
			thisObject.paymentsScheduleDatesContainer.appendChild(paymentsScheduleDate);

		});

		this.paymentsScheduleContainer.style.display = 'inline-block';

	};

	this.getAndDisplayCarData = function(){

		// Set the dynamic endpoint based on monthly payment amount
		this.setCarEndpoint();

		// Set the loading overlay to active
		var loading = document.getElementById('loading');
		loading.className += ' active';

		thisObject = this;

		// Make the AJAX request
		this.startAjax(this.carDataEndpoint, 'GET', {}, function(cars){

			/*
			Loop through each car within the response.
			*/
			cars.searchResults.forEach(function(thisCar){
				if(
					// Check that the car has photos
					thisCar.photos.length && 
					/* 
					Check that the monthly payment for this car is equal
					to or less than the quote you were given.
					*/
					thisCar.salesInfo.pricing.monthlyPayment <= thisObject.monthlyPayment && 
					/*
					This number decreases each time it goes into the IF statement.
					It is set at the top and starts at 6.
					*/
					thisObject.carsToShow > 0
				){

					// Create main element for this car in the grid
					var car = document.createElement('a');
					car.className += 'car col-sm-4';
					car.setAttribute('href', 'https://www.arnoldclark.com'+thisCar.url);
					car.setAttribute('target', '_blank');
					car.setAttribute('onmouseover', 'activeToggle(this)');
					car.setAttribute('onmouseout', 'unsetActiveToggles(this)');

					// Create img for this car to be nested within car element above
					var carImgContainer = document.createElement('div');
					carImgContainer.className += 'car-img-container';
					carImgContainer.style.backgroundImage = 'url("'+thisCar.photos[0]+'")';

					// Create description seciton for this car to be nested within car element above
					var carDescContainer = document.createElement('div');
					carDescContainer.className += ' car-desc-container';

					var h2 = document.createElement('h2');
					h2.textContent = thisCar.title.name;

					var h3 = document.createElement('h3');
					h3.innerHTML = '&pound;'+thisCar.salesInfo.pricing.monthlyPayment + ' per month';

					var span = document.createElement('span');
					span.textContent = thisCar.branch.name;

					var readMore = document.createElement('div');
					readMore.className += ' btn btn-success';
					readMore.textContent = 'Read More';

					/*
					Now append all of the newly created elements
					above into their necessary parent container.
					*/
					car.appendChild(carImgContainer);
					car.appendChild(carDescContainer);
					car.appendChild(readMore);
					carDescContainer.appendChild(h2);
					carDescContainer.appendChild(h3);
					carDescContainer.appendChild(span);
					thisObject.carsContainer.appendChild(car);

					/*
					Decrease each time until there are 6 cars added to 
					the main car container in the DOM.
					*/
					thisObject.carsToShow--;

				}else{
					return;
				}
			});
			
			// Remove the loading screen once the AJAX call is finished
			var loading = document.getElementById('loading');
			loading.classList.remove('active');

		});

	};

};
