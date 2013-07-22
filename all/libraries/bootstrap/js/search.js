// Global Variables
var infoWindow;
var urlCrossDomain = -1; // No other Server specified
var eventArray = [];
var markersArray = [];
var radiusWidgetCheck = false;


/**
 * searchEvent() permette all'utente di cercare eventi segnalati nel sistema CityNotifier
 */
function searchEvent() {
	xmlhttp = new XMLHttpRequest();
	    
	// Query parameters creation
	var parameters = new Array();

	// urlCrossDomain >= 0 se l'admin ha specificato un altro server a cui fare chiamate local/remote
	if(urlCrossDomain != -1){
		parameters["scope"] = "remote"
		parameters["dest"] = urlCrossDomain;
	}
	else
		parameters["scope"] = "local";

	// Event type
	parameters["type"] = ($('#searchType').find(":selected").text()).toLowerCase().replace(/ /g, "_");

	// Event subtype
	var subtypeSelected = ($('#searchSubType').find(":selected").text()).toLowerCase().replace(/ /g, "_");
	if(subtypeSelected == "select_subtype")
		parameters["subtype"] = "all";
	else
		parameters["subtype"] = subtypeSelected;
		
	// Event coordinates
	parameters["lat"] = userMarker.getPosition().lat();
	parameters["lng"] = userMarker.getPosition().lng();

	// Event radius (metres)
	radiusWidget ? parameters["radius"] = radiusWidget.get('distance') * 1000 : parameters["radius"] = distanceDefault * 1000;

	// Event min Timestamp
	var timeMin = toTimestamp(parseDate($("#timeFromText").val().replace(/\-/g,'/')));
	if(isNaN(timeMin))
		timeMin = toTimestamp(dateStart); // 6 months ago
	parameters["timemin"] = timeMin;

	// Event max Timestamp
	var timeMax = toTimestamp(parseDate($("#timeToText").val().replace(/\-/g,'/')));
	if(isNaN(timeMax))
		timeMax = toTimestamp(new Date()); // Now
	parameters["timemax"] = timeMax;

	// Event Status
	parameters["status"] = $('#searchStatus').val().toLowerCase();

	url = URLSERVER.concat(buildUrl("/richieste", parameters));

	if($('#searchAddress').val() != ''){

		// Ok search
		if(! $('#infoAddress').next().is('p'))
			$('#infoAddress').after('<p id="spinner"></p>');
		$('#searchAddress').parent().removeClass("error");
		$('#addressButtonSearch').removeClass("btn-danger");
		$('#addressMarkerSearch').removeClass("icon-white");
		
		// First call: local
		searchLocal();
		
		// Second call: remote
		searchRemote(parameters);

		// Third call: skeptical
		searchSkeptical(parameters);
	}
	else{
		// Error: Address not specified
		if (!$('#searchAddress').val() && $('#searchAddress').next().is('button')) {
		    $('#searchAddress').parent().addClass("error");
		    $('#searchAddress').next().addClass("btn-danger");
		    $('#addressMarkerSearch').addClass("icon-white");
    	}
	}
}

function searchLocal(){
	// First call: local
		$.ajax({
			url: url,
			type: 'GET',
			success: function(datiString, status, richiesta) {
				console.log("Ok local.. ");
				successAlert("Ricerca in corso...");	

		    	// Update events local with new informations
					if(datiString.events)
						$.each(datiString.events, function(index, event){
							var eventIDRemote = event.event_id;
						
							var result = $.grep(eventArray, function(e){ return e.eventID == eventIDRemote; });
							
							if (result.length == 0) {
								// New event from remote server
								console.log("Nuovo evento");
							  	createEvent(event);
							  
							} else if (result.length == 1) {
								// Update local event
								console.log("Evento esiste già");
							  	updateEvent(result[0], event);
							  
							} else
							console.log("ERROR! Più eventi fanno match!!!!");
						});

				// Animation loading
				$('#spinner').fadeOut(2000, function() { $(this).remove(); });
	 		},
		    error: function(err) {
		        errorAlert("Ajax Search error");
		    }
		});
}

function searchRemote(parameters){
	// Second call: remote
		parameters["scope"] = "remote"
		url = URLSERVER.concat(buildUrl("/richieste", parameters));

		$.ajax({
			url: url,
			type: 'GET',
			success: function(responseRemote, status, richiesta) {
				console.log("Ok remote..");
				successAlert("Aggiornamento in corso...");
				
				// Update events local with new informations
				// Add new event from remote servers
				$.each(responseRemote, function(index, response){
					if(response.events)
						$.each(response.events, function(index, event){
							var eventIDRemote = event.event_id;
						
							var result = $.grep(eventArray, function(e){ return e.eventID == eventIDRemote; });
							
							if (result.length == 0) {
								// New event from remote server
								console.log("Nuovo evento");
							  	createEvent(event);
							  
							} else if (result.length == 1) {
								// Update local event
								console.log("Evento esiste già");
							  	updateEvent(result[0], event);
							  
							} else
							console.log("ERROR! Più eventi fanno match!!!!");
						});
			 	});
		 	},
			error: function(err) {
				errorAlert("Ajax Remote Search error");
			}
		});
}

function searchSkeptical(parameters){
	// Third call: skeptical around me
	parameters["scope"] = "local";
	parameters["status"] = "skeptical";

	// Event min Timestamp
	timeMin = toTimestamp(dateStart); // 6 months ago
	parameters["timemin"] = timeMin;

	// Event max Timestamp
	timeMax = toTimestamp(new Date()); // Now
	parameters["timemax"] = timeMax;

	parameters["type"] = "all";
	parameters["subtype"] = "all"

	// Event radius (metres)
	parameters["radius"] = 0.5 * 1000;

    if (navigator.geolocation) {
        var options = {timeout: 2000}; // milliseconds (60 seconds)
        navigator.geolocation.getCurrentPosition(
        	function(position){
        		// Success
        		parameters["lat"] = position.coords.latitude;
    			parameters["lng"] = position.coords.longitude;

    			url = URLSERVER.concat(buildUrl("/richieste", parameters));

    			$.ajax({
					url: url,
					type: 'GET',
					success: function(responseSkeptical, status, richiesta) {
						skepticalAlert("Ok Skeptical.. ");
						
				    	
				        // Update events local with new informations
						// Add new event from remote servers
						$.each(responseSkeptical, function(index, response){
							if(response.events){
								skepticalAlert("Sono stati trovati eventi scettici vicino a te! Aiutaci a risolverli");	
								$.each(response.events, function(index, event){
									var eventIDRemote = event.event_id;
								
									var result = $.grep(eventArray, function(e){ return e.eventID == eventIDRemote; });
									
									if (result.length == 0) {
										// New event from remote server
										console.log("Nuovo evento Skeptical");
									  	createEvent(event);
									  
									} else if (result.length == 1) {
										// Update local event
										console.log("Evento Skeptical esiste già");
									} else
									console.log("ERROR! Più eventi fanno match!!!!");
								});
							}
			 			});
			 		},
				    error: function(err) {
				        errorAlert("Skeptical Ajax error");
				    }
				});
        	},
        	function(){
        		// Error
        		skepticalAlert("E' necessario attivare la GeoLocalizzazione per trovare gli eventi scettici");
        		console.log("GetLocation Skeptical error");
        	}, 
        	options);
    } else {
        errorAlert("Sorry, browser does not support geolocation!");
    }
}

function searchLive(){
	var dateNow = new Date();
	var dateSecondsAgo = new Date(dateNow.getTime() - LIVE_SECOND*1000);

	var day = dateSecondsAgo.getDate();
	var month = dateSecondsAgo.getMonth()+1;
	var year = dateSecondsAgo.getFullYear();
	var hours = dateSecondsAgo.getHours();
	var minutes = dateSecondsAgo.getMinutes();
	var seconds = dateSecondsAgo.getSeconds();
	$("#timeFromText").val(day+'-'+month+'-'+year+' '+ hours + ':' + minutes + ':' + seconds);

	console.log("Ricerca da "+ day+'-'+month+'-'+year+' '+ hours + ':' + minutes + ':' + seconds)
	searchEvent();
}

/**
 * updateEvent aggiorna un evento Local con nuove informazioni
 * @param eventLocal evento locale da aggiornare
 * @param EventRemote evento remoto con le informazioni aggiornate
 */
function updateEvent(eventLocal, eventRemote){

	// New Description
	eventLocal.description = eventRemote.description;
	var descriptionHtml = "";
	var fullArray = checkArray(eventLocal.description);
	if(fullArray){
		for (j in eventLocal.description){
			if(eventLocal.description[j]){
				eventLocal.description[j] = eventLocal.description[j].charAt(0).toUpperCase() + eventLocal.description[j].slice(1);
				$('#'+eventLocal.eventID+'but').next().append('<li><p>'+eventLocal.description[j]+'</p></li>');
				$('#'+eventLocal.eventID+'but').removeClass('disabled');
			}
		}	
	}
	// New Address
	if(eventRemote.route){
		var eventRemoteAddress = eventRemote.route + ", " + eventRemote.street_number;
		if(eventLocal.address != eventRemoteAddress)
			eventLocal.address = eventRemoteAddress;
	}

	// New coordinates
	eventLocal.lat = middlePoint(eventRemote.locations).lat();
	eventLocal.lng = middlePoint(eventRemote.locations).lng();

	// New Status
	if(eventLocal.status != "Skeptical"){
		if(eventRemote.freshness > eventLocal.freshness){
			eventLocal.status = eventRemote.status.charAt(0).toUpperCase() + eventRemote.status.slice(1);	
			switch (eventLocal.status) {
				case "Open":
					var statusHtml = '<button class="btn btn-success">'+eventLocal.status;
					break;
				case "Closed":
					var statusHtml = '<button class="btn btn-danger">'+eventLocal.status;
					break;
				case "Skeptical":
					var statusHtml = '<button class="btn btn-warning">'+eventLocal.status;
					break;	
			}

			var markerFoundArray = $.grep(markersArray, function(e){ return e.id == eventLocal.eventID; });
    		markerFoundArray[0].status = eventLocal.status;
		}
	}

	// New Freshness
	if(eventRemote.freshness > eventLocal.freshness)
		eventLocal.freshness = eventRemote.freshness;	

	
	// New Start Time Date
	if(eventLocal.startTimeUnformatted > eventRemote.startTime){
		var date = new Date(eventRemote.startTime*1000);
			var day = date.getDate();
			var month = date.getMonth();
			var year = date.getFullYear();
			var hours = date.getHours();
			var minutes = date.getMinutes();
			var seconds = date.getSeconds();
		eventLocal.startTime = day+'/'+month+'/'+year+'\t'+ hours + ':' + minutes + ':' + seconds;
		eventLocal.strartTimeUnformatted = event.start_time;
	}
	
	// New number of Notification
    eventLocal.numNot += eventRemote.number_of_notifications;

    // New relyability
	var rely = (eventLocal.reliability * 2 + eventRemote.reliability * 2)/(2*(eventLocal.numNot));
    eventLocal.reliability = Math.round(rely * 100) / 100;	

    // Update Events Table
	$('#'+eventLocal.eventID+'tr td:nth-child(2)').html(eventLocal.startTime);
	$('#'+eventLocal.eventID+'tr td:nth-child(3)').html(eventLocal.address);
	$('#'+eventLocal.eventID+'tr td:nth-child(5)').html(eventLocal.numNot+' / '+eventLocal.reliability);
	$('#'+eventLocal.eventID+'tr td:nth-child(6)').html(statusHtml);
	
	// Check expire Event
	var expireTimeDate = new Date(eventLocal.freshness).getTime();
    var sbiaditoTime = expireTimeDate + 10*60;
    var expireTime = expireTimeDate + 20*60;
    var nowTime = new Date().getTime() / 1000;

    if(expireTime < nowTime){
        console.log("Evento " +eventLocal.eventID+ " scaduto");
    }
    else if(sbiaditoTime < nowTime){
        console.log("Evento " +eventLocal.eventID+ " sbiadito");
    }

    if(eventLocal.subtype == "coda"){	
    	var markerFoundArray = $.grep(markersArray, function(e){ return e.id == eventLocal.eventID; });
    	var heatmapFoundArray = $.grep(heatmapArray, function(e){ return e.eventID == eventLocal.eventID; });
    	var markerFound = markerFoundArray[0];
    	var heatmapFound = heatmapFoundArray[0];

        if(expireTime < nowTime){ //L'evento è scaduto
            console.log("Coda " +eventLocal.eventID+ " scaduta");
            var gradient = [
                'rgba(34, 139, 34, 0)',
                'rgba(34, 139, 34, 1)' //Gradiente verde
            ];
            heatmapFound.setOptions({
                gradient: gradient
            });
        }
        else if(sbiaditoTime < nowTime){ //L'evento è sbiadito
            console.log("Coda " +eventLocal.eventID+ " sbiadita");
            var gradient = [
                'rgba(255, 165, 0, 0)',
                'rgba(255, 165, 0, 1)' //Gradiente arancio
            ];
            heatmapFound.setOptions({
                gradient: gradient
            });
        }
        else{ //Coda Fresca
            console.log("Coda " +eventObject.eventID+ " fresca");
            var gradient = [
                'rgba(255, 0, 0, 0)',
                'rgba(255, 0, 0, 1)' //Gradiente rosso
            ];
            heatmapFound.setOptions({
                gradient: gradient
            });
        }
    }
}

/**
 * createEvent crea un nuovo evento sulla mappa
 * @param event Informazioni sull'evento
 */
function createEvent(event){

	// Event Object: Type, Subtype, Description, StartTimeDate, Freshness, Status, NumberOfNotification, Reliability	        
	var eventObject = new Object();

	// Type & Subtype Event
	eventObject.type = event.type.type.charAt(0).toUpperCase() + event.type.type.slice(1).replace(/_/g," ");
	eventObject.subtype = event.type.subtype.charAt(0).toUpperCase() + event.type.subtype.slice(1).replace(/_/g," ");

	// Description Array
	eventObject.description = event.description;
	
	// Start Time Date
	var date = new Date(event.start_time*1000);
		var day = date.getDate();
		var month = date.getMonth();
		var year = date.getFullYear();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
	eventObject.startTime = day+'/'+month+'/'+year+'\t'+ hours + ':' + minutes + ':' + seconds;
	eventObject.strartTimeUnformatted = event.start_time;
	
	// Freshness
	eventObject.freshness = event.freshness;

	// Event Status
	var status = event.status;
	eventObject.status = status.charAt(0).toUpperCase() + status.slice(1);
	switch (eventObject.status) {
		case "Open":
			var statusHtml = '<button class="btn btn-success">'+eventObject.status;
			break;
		case "Closed":
			var statusHtml = '<button class="btn btn-danger">'+eventObject.status;
			break;
		case "Skeptical":
			var statusHtml = '<button class="btn btn-warning">'+eventObject.status;
			break;	
	}

	// Event reliability
	eventObject.reliability = Math.round(event.reliability * 100) / 100;

	// Number of Notification
	eventObject.numNot = event.number_of_notifications;

	// Event coordinates
	eventObject.lat = middlePoint(event.locations).lat();
	eventObject.lng = middlePoint(event.locations).lng();
		
	// Event ID
	eventObject.eventID = event.event_id;

	// Event address
	if(event.route && event.street_number)
		eventObject.address = event.route + ", " + event.street_number;
	else if(event.route)
		eventObject.address = event.route;
	else
		eventObject.address = eventObject.lat + ", " + eventObject.lng;
	
	// Add event to global Events Array
	eventArray.push(eventObject);
	
	// Draw Queue
	if(eventObject.subtype == "Coda"){
		drawQueue(event);
	}

	// Add Event marker on map
	addEventMarker(eventObject);

	// Update Events Table
	var latHtml = JSON.stringify(eventObject.lat).replace(/\./g,"");
	var lngHtml = JSON.stringify(eventObject.lng).replace(/\./g,"");
	var latlngHtml = (latHtml+lngHtml).replace(/""/g,"");

	// Html ul creation
	var descriptionHtml = "";
	var fullArray = checkArray(eventObject.description);
	if(fullArray){
		for (j in eventObject.description){
			if(eventObject.description[j]){
				eventObject.description[j] = eventObject.description[j].charAt(0).toUpperCase() + eventObject.description[j].slice(1);
				descriptionHtml = descriptionHtml.concat('<li><p>'+eventObject.description[j]+'</p></li>');
			}
		}	
	}
	
	// Add table row			
	$('#modalBody').append('<tr id="'+eventObject.eventID+'tr">\
						<td>'+eventObject.type+' > '+eventObject.subtype+'</td>\
						<td>'+eventObject.startTime+'</td>\
						<td id='+eventObject.eventID+'>'+eventObject.address+'</td>\
						<td><div class="btn-group">\
							<a href="#" id="'+eventObject.eventID+'but" class="btn btn-inverse dropdown-toggle" data-toggle="dropdown">Show</a>\
							<ul class="dropdown-menu">'+descriptionHtml+'</ul>\
						</div></td>\
						<td>'+eventObject.numNot+' / '+eventObject.reliability+'</td>\
						<td>'+statusHtml+'</td>\
						</tr>');
	var butID = "#"+eventObject.eventID+"but";			
	if(!fullArray)
		$(butID).addClass('disabled');
}

/**
 * Search event on click on Search button
 */
$("#search").next().on("click", "#searchSubmit", function() {
	if($('#searchAddress').val() != ''){
		// Remove all markers from map and from events Array
		clearOverlays();
		eventArray.length = 0;
	}
	// Clear list table
	$('#modalBody').html('');
    searchEvent();
    $('#search').dropdown();
});

/**
 * Radius changing listener on enter pressed
 */
$("#search").next().on('keypress', '#searchRadius', function(e) {
    if (e.which === 13){
    	//Enter pressed
    	var klm = $('#searchRadius').val().split(" ")[0].replace(',','.');
    	if(jQuery.isNumeric(klm) && klm > 0) {
    		// Valid radius
    	    radiusWidget.set('distance', klm);
    	    radiusWidget.center_changed();
    	    $('#searchRadius').parent().removeClass("error");
    	}
    	else if(!(jQuery.isNumeric(klm)) || klm <= 0){
    			// Wrong radius
				$('#searchRadius').parent().addClass("error");
				$('#searchRadius').val("Insert a valid radius");
			}
	}
});

/**
 * Radius changing listener on blur
 */
$('#searchRadius').blur(function() {
	var klm = $('#searchRadius').val().split(" ")[0].replace(',','.');
	if(klm)
	  	if(jQuery.isNumeric(klm) && klm > 0){
	  		// Valid radius
	  		radiusWidget.set('distance', klm);
		    radiusWidget.center_changed();
		    $('#searchRadius').parent().removeClass("error");
	  	}
	  	else{
	  		// Wrong radius
	  		$('#searchRadius').parent().addClass("error");
			$('#searchRadius').val("Insert a valid radius");
	  	}
});

/**
 * Remove error status on Radius on click
 */
$("#searchRadius").on('click', function(){
	if($('#searchRadius').parent().hasClass('error'))
			$('#searchRadius').val('');
});


/**
 * Search event on click on Search dropdown Menu
 */
$('#search').on('click', function() {

	// Create new userMarker if it's not on map
	if(!userMarker){

		// Create new markerPosition
		var markerPosition = new google.maps.LatLng(lastLatitude, lastLongitude);

		// Drop userMarker on map
		createUserMarker(markerPosition);

		// Create new distanceWidget
		distanceWidget = new DistanceWidget(map);
		radiusWidgetCheck = true;

	}
    	
    // Create just new distanceWidget if userMarker is on map
    if (!(radiusWidgetCheck) && userMarker){
        distanceWidget = new DistanceWidget(map);
        radiusWidgetCheck = true;
    }
    
    // Update searchRadius on sizer dragging
	google.maps.event.addListener(distanceWidget, 'distance_changed', function() {
		// Get new distance
		if(radiusWidget.get('distance') != 0)
			distanceDefault = radiusWidget.get('distance');

		// Update Radius value on search menu
		$('#searchRadius').val(Math.round(distanceDefault * 1000) / 1000 + " km");
		$('#searchRadius').val(($('#searchRadius').val().replace('.',',')));
	});
});


/**
 * Search address autocomplete
 */
$('#searchAddress').typeahead({
	source: function(query, process) {
		autoCompleteService.getPlacePredictions({
			input: query, types: ['geocode'], 
			location: CITYCENTER, radius: 5000 
		}, 
		function(predictions, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				// Autocomplete success
				process($.map(predictions, function(prediction) {
					// Error: No address selcted
					if( $('li.open ul.typeahead').css('display') == 'none'){
						$('#searchAddress').parent().addClass("error");
						$('#searchAddress').parent().addClass("error");
						$('#addressButtonSearch').addClass("btn-danger");
						$('#addressMarkerSearch').addClass("icon-white");
					}
					else{
						// Ok: Address selected
						$('li.open ul.typeahead').parent().removeClass("error");
						$('#addressButtonSearch').removeClass("btn-danger");
						$('#addressMarkerSearch').removeClass("icon-white");
					}
					return prediction.description;
				}));
			}
			else if( status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS){
				console.log("No results");
			}
		});
	},
	updater: function (item) {
		// In case of Address selected
		geocoder.geocode({ address: item }, function(results, status) {
			if (status != google.maps.GeocoderStatus.OK) {
				// Error: Wrong address selected
				$('#searchAddress').parent().addClass("error");
				errorAlert('Cannot find address');
				return;
			}
			else{
				// Ok: Address selected
				$('li.open ul.typeahead').parent().removeClass("error");
				$('#addressButtonSearch').removeClass("btn-danger");
				$('#addressMarkerSearch').removeClass("icon-white");

				// Drop userMarker on map
				createUserMarker(results[0].geometry.location);
			}
		});
		return item;
	}
});

/**
 * Search Type updater on click
 */
$("#searchType").on('change', function() {
    var conceptName = $('#searchType').find(":selected").text();
    if (conceptName != "All") {
    	// A type selected
        $('#searchSubType').removeAttr("disabled");
        $('#searchSubType').html('<option disabled selected>Select subtype</option>');
        switch (conceptName) {
            case "Problemi stradali":
                $('#searchSubType').html('<option disabled>Select subtype</option>\
                								<option selected>All</option>\
												<option>Incidente</option>\
												<option>Buca</option>\
												<option>Coda</option>\
												<option>Lavori in corso</option>\
												<option>Strada impraticabile</option>');
                break;
            case "Emergenze sanitarie":
                $('#searchSubType').html('<option disabled >Select subtype</option>\
                								<option selected>All</option>\
												<option>Incidente</option>\
												<option>Malore</option>\
												<option>Ferito</option>');
                break;
            case "Reati":
                $('#searchSubType').html('<option disabled>Select subtype</option>\
                								<option selected>All</option>\
												<option>Furto</option>\
												<option>Attentato</option>');
                break;
            case "Problemi ambientali":
                $('#searchSubType').html('<option disabled>Select subtype</option>\
                								<option selected>All</option>\
												<option>Incendio</option>\
												<option>Tornado</option>\
												<option>Neve</option>\
												<option>Alluvione</option>');
                break;
            case "Eventi pubblici":
                $('#searchSubType').html('<option disabled>Select subtype</option>\
                								<option selected>All</option>\
												<option>Partita</option>\
												<option>Manifestazione</option>\
												<option>Concerto</option>');
                break;
        }

        $('.selectpicker').selectpicker('render');
    }
    else{
    	$('#searchSubType').attr('disabled', 'disabled');
    	$('#searchSubType').html('<option disabled selected>Select subtype</option>');
    }
});

/**
 * Draw heatMap queue on map from event object
 * @param event Informazioni sull'evento
 */
function drawQueue(event){
		if(event.locations.length != 1){
			// Estraggo due punti "casuali" dall'Array di punti del percorso
			var endUnformatted = event.locations.pop();
			var end = new google.maps.LatLng(endUnformatted.lat,endUnformatted.lng);
			var startUnformatted = event.locations.shift();
			var start = new google.maps.LatLng(startUnformatted.lat,startUnformatted.lng);
			
			// Calcolo la distanza in linea d'aria tra i due punti
			var distanceSE = calcDistance(start, end);
			
			var waypointsArray = [];
			
			// Per ogni punto nell'array verifico se è interno o esterno ai due vertici presi in precedenza
			// Se il punto è esterno al segmento aggiorno il segmento con i nuovi vertici
			$.each(event.locations, function(j){
				var point = new google.maps.LatLng(event.locations[j].lat, event.locations[j].lng);
				var distancePS = calcDistance(point, start);
				var distancePE = calcDistance(point, end);
				
				if( (distancePS + distancePE) > distanceSE ){
					//Punto fuori candidato a diventare nuovo start o end
					if ( distancePS < distancePE ){
						var wayPoint = { location : start };
						start = point;
					}
					else{
						var wayPoint = { location : end };
						end = point;
					}
				}
			});
			
			// Calcolo l'eventuale scadenza dell'evento
            var expireTimeDate = new Date(event.freshness).getTime();
            var sbiaditoTime = expireTimeDate + 10*60;
            var expireTime = expireTimeDate + 20*60;
            var nowTime = new Date().getTime() / 1000;

            console.log("Sbiadisce a: "+ sbiaditoTime)
            console.log("Scade a: "+ expireTime);
            console.log("Ora sono: "+nowTime)
                            
            if(expireTime < nowTime){ /*L'evento è scaduto*/
                console.log("Coda " +event.event_id+ " scaduta");
                var gradient = [
                'rgba(34, 139, 34, 0)',
                'rgba(34, 139, 34, 1)' //Gradiente verde
                ];
                // Disegno la coda
                distRoute(start, end, null, event.event_id, gradient);
            }
            else if(sbiaditoTime < nowTime){ /*L'evento è sbiadito*/
                console.log("Coda " +event.event_id+ " sbiadita");
                var gradient = [
                'rgba(255, 165, 0, 0)',
                'rgba(255, 165, 0, 1)' //Gradiente arancio
                ];
                // Disegno la coda
                distRoute(start, end, null, event.event_id, gradient);
            }
            else{ //Coda Fresca
                console.log("Coda " +event.event_id+ " fresca");
                var gradient = [
                'rgba(255, 0, 0, 0)',
                'rgba(255, 0, 0, 1)' //Gradiente rosso
                ];
                // Disegno la coda
                distRoute(start, end, null, event.event_id, gradient);
            }
		}
}

/**
 * Add Event marker on map
 * @param event Informazioni sull'evento
 */
function addEventMarker(eventObject){
	// Create Event Marker
	searchMarker = new google.maps.Marker({
		position: new google.maps.LatLng(eventObject.lat, eventObject.lng),
        icon: getPin(eventObject.type, eventObject.subtype),
		map: map,
		draggable: false,
		title: eventObject.eventID,
		animation: google.maps.Animation.DROP
	});
	
	// Fill searchMarker object with eventObject info
	searchMarker.id = eventObject.eventID;
	searchMarker.type = eventObject.type;	
	searchMarker.subtype = eventObject.subtype;
	searchMarker.address = 	eventObject.address;	
	searchMarker.status = eventObject.status;	
			
	// Add EventMarker to markerArray
	markersArray.push(searchMarker);
	
	// Create Event infoWindow
	infoWindow = new google.maps.InfoWindow();			
	
	var onMarkerClick = function() {
		var marker = this;
		infoWindow.id = this.id;
		infoWindow.type = this.type;	
		infoWindow.subtype = this.subtype;	
		infoWindow.status = this.status;
		console.log("STATUS --> "+this.status);
		infoWindow.address = this.address;	
		if($.isNumeric(infoWindow.id))
			infoWindow.scope = "local";
		else
			infoWindow.scope = "remote";
	  
		var latLng = marker.getPosition();
		createInfoWindow(marker.getPosition(), infoWindow);
		infoWindow.open(map, marker);
	};					

	// Create infoWindow on click
	google.maps.event.addListener(searchMarker, 'click', onMarkerClick);

	// Close infoWindow on map click
	google.maps.event.addListener(map, 'click', function() { infoWindow.close(); });
}