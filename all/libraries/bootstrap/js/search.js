// Global Variables
var infoWindow;
var urlCrossDomain = -1; // -1 if no other Server is specified
var eventArray = [];
var markersArray = [];
var radiusWidgetCheck = false; // Check if radiusWidget is displayed
var timeMin = 1; // 1 January 1970
var searching = false;


// Create Event infoWindow
infoWindow = new google.maps.InfoWindow( { maxWidth: 800 });


/**
 * searchEvent() allows the user to search events in the database
 */
function searchEvent() {
	searching = true;
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
	parameters["radius"] =  distanceDefault * 1000;

	// Event min Timestamp
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
		if (!$('#searchAddress').val()) {
		    $('#searchAddress').parent().addClass("error");
		    $('#searchAddress').next().addClass("btn-danger");
		    $('#addressMarkerSearch').addClass("icon-white");
    	}
	}
}

/**
 * searchLocal() allows the user to search local events in the database
 */
function searchLocal(){
	// First call: local
		$.ajax({
			url: url,
			type: 'GET',
			success: function(datiString, status, richiesta) {
				successAlert("Ricerca in corso...");	

				if(datiString.events)
					$.each(datiString.events, function(index, event){
						var eventIDRemote = event.event_id;
					
						// Check if the event already exists in eventArray
						var result = $.grep(eventArray, function(e){ return e.eventID == eventIDRemote; });
						
						if (result.length == 0) {
							// New event from remote server
						  	createEvent(event);
						  
						} 
						else if (result.length == 1) {
							// Update local event
						  	updateEvent(result[0], event);
						}
					});

				// Remove spinner animation
				$('#spinner').fadeOut(2000, function() { $(this).remove(); });
	 		},
		    error: function(err) {
		        errorAlert("Ajax Search error");
		    }
		});
		$('#search').parent().removeClass('open');
		if(isiPad) $('#map_canvas').click(); // iPad bugfix
}

/**
 * searchRemote() allows the user to search remote events in the remote servers' database
 * @param parameters New get event parameters
 */
function searchRemote(parameters){
	// Second call: remote
		parameters["scope"] = "remote"
		url = URLSERVER.concat(buildUrl("/richieste", parameters));

		$.ajax({
			url: url,
			type: 'GET',
			success: function(responseRemote, status, richiesta) {
				successAlert("Aggiornamento in corso...");
				console.log("Remote...");

				// Avoid double remoteSearch
				$('#liveButton').removeAttr('disabled');
				searching = false;
				
				// Update events local with new informations
				// Add new event from remote servers
				$.each(responseRemote, function(index, response){
					if(response && response.events)
						$.each(response.events, function(index, event){
							if(event){
								var eventIDRemote = event.event_id;
								console.log("Cerco l'evento "+event + " " + event.event_id);
							
								// Check if the event already exists in eventArray
								var result = $.grep(eventArray, function(e){ return e.eventID == eventIDRemote; });
								
								if (result.length == 0) {
									console.log("Nuovo evento");
									// New event from remote server
								  	createEvent(event);
								  
								} 
								else if (result.length == 1) {
									console.log("Vecchio evento");
									console.log("Aggiorno " + result[0]);
									// Update local event
								  	updateEvent(result[0], event);
								}
							}
						});
			 	});
		 	},
			error: function(err) {
				errorAlert("Ajax Remote Search error");
			}
		});
}

/**
 * searchSkeptical() allows the user to search skeptical events near the user's position
 * @param parameters New get event parameters
 */
function searchSkeptical(parameters){
	// Third call: skeptical around me
	parameters["scope"] = "local";
	parameters["status"] = "skeptical";

	// Event min Timestamp
	parameters["timemin"] = timeMin;

	// Event max Timestamp
	timeMax = toTimestamp(new Date()); // Now
	parameters["timemax"] = timeMax;

	parameters["type"] = "all";
	parameters["subtype"] = "all"

	// Event radius (metres)
	parameters["radius"] = SKEPTICAL_METERS * 1000;

    if (navigator.geolocation) {
        var options = { timeout: 2000 }; // milliseconds
        navigator.geolocation.getCurrentPosition(
        	function(position){

        		// Geolocation Success
        		parameters["lat"] = position.coords.latitude;
    			parameters["lng"] = position.coords.longitude;

    			url = URLSERVER.concat(buildUrl("/richieste", parameters));

    			$.ajax({
					url: url,
					type: 'GET',
					success: function(responseSkeptical, status, richiesta) {
				        // Update events local with new informations
						// Add new event from remote servers
						if(responseSkeptical.events){
								
								$.each(responseSkeptical.events, function(index, event){
									var eventIDRemote = event.event_id;
								
									// Check if the event already exists in eventArray
									var result = $.grep(eventArray, function(e){ return e.eventID == eventIDRemote; });
									if (result.length == 0) {
										skepticalAlert("Sono stati trovati eventi scettici vicino a te! Aiutaci a risolverli");	
										// New event from remote server
									  	createEvent(event);
									}
								});
							}
			 		},
				    error: function(err) {
				        errorAlert("Skeptical Ajax error");
				    }
				});
        	},
        	function(){
        		// Geolocation error
        		console.log("Errore GeoLocalizzazione per trovare gli eventi scettici");
        	}, 
        	options);
    } else
        errorAlert("Il browser non supporta le geolocalizzazione");
}

/**
 * startUpSearch() is used on CityNotifier's startUp in order to search Events
 */
function startUpSearch(){
	// Create new distanceWidget
	distanceWidget = new DistanceWidget(map);
    radiusWidgetCheck = true;

    searchEvent();

    startUp = false;
}

/**
 * searchLive() allows the user to search events dynamically
 */
function searchLive(){
	// Current timestamp - LIVE_SECOND
	var dateNow = new Date();

	// If userMarker dragged, restart Live
	if(restartLive){ clearOverlays(); $('#modalBody').html(''); searchEvent(); restartLive = false; return; }

	timeMin = new Date(dateNow.getTime() - LIVE_SECOND).getTime() / 1000;
	
	searchEvent();
	updateQueue();
}

/**
 * updateEvent updates a local event when new info is received
 * @param eventLocal local event to be updated
 * @param EventRemote remote event with updated info
 */
function updateEvent(eventLocal, eventRemote){

	var markerFoundArray = $.grep(markersArray, function(e){ return e.id == eventLocal.eventID; });

	// New Description
	eventLocal.description = eventRemote.description;
	var descriptionHtml = "";
	var fullArray = checkArray(eventLocal.description);
	if(fullArray){
		for (j in eventLocal.description){
			if(eventLocal.description[j]){
				eventLocal.description[j] = eventLocal.description[j].charAt(0).toUpperCase() + eventLocal.description[j].slice(1);
				markerFoundArray[0].description.push(eventLocal.description[j]);
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
    		markerFoundArray[0].status = eventLocal.status;
    		markerFoundArray[0].setIcon(getPin(markerFoundArray[0].type, markerFoundArray[0].subtype, markerFoundArray[0].status));
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
		eventLocal.startTimeUnformatted = parseFloat(event.start_time);
	}
	

    // New reliability
	var reli = ( parseFloat(eventLocal.reliability) * 2 * parseInt(eventLocal.numNot) + parseFloat(eventRemote.reliability) * 2 * parseInt(eventRemote.number_of_notifications))/( 2 * ( eventLocal.numNot + eventRemote.number_of_notifications));
    eventLocal.reliability = Math.round(reli * 100) / 100 + "%";

    // New number of Notification
    eventLocal.numNot += parseInt(eventRemote.number_of_notifications);

    // Update Events Table
	$('#'+eventLocal.eventID+'tr td:nth-child(2)').html(eventLocal.startTime);
	$('#'+eventLocal.eventID+'tr td:nth-child(3)').html(eventLocal.address);
	$('#'+eventLocal.eventID+'tr td:nth-child(5)').html(eventLocal.numNot+' / '+eventLocal.reliability);
	$('#'+eventLocal.eventID+'tr td:nth-child(6)').html(statusHtml);
	
	// Check expire Event
    var fadedTime = parseFloat(eventLocal.freshness) + 10*60;
    var expireTime = parseFloat(eventLocal.freshness) + 20*60;
    var nowTime = new Date().getTime() / 1000;

    if(eventLocal.subtype.toLowerCase() == "coda"){	
    	var markerFoundArray = $.grep(markersArray, function(e){ return e.id == eventLocal.eventID; });
    	var heatmapFoundArray = $.grep(heatmapArray, function(e){ return e.eventID == eventLocal.eventID; });
    	var markerFound = markerFoundArray[0];
    	var heatmapFound = heatmapFoundArray[0];

    	if(heatmapFound){
	        if(expireTime < nowTime){ //L'evento è scaduto
	            var gradient = [
	                'rgba(34, 139, 34, 0)',
	                'rgba(34, 139, 34, 1)' //Gradiente verde
	            ];
	            heatmapFound.setOptions({
	                gradient: gradient
	            });
	        }
	        else if(fadedTime < nowTime){ //L'evento è sbiadito
	            var gradient = [
	                'rgba(255, 165, 0, 0)',
	                'rgba(255, 165, 0, 1)' //Gradiente arancio
	            ];
	            heatmapFound.setOptions({
	                gradient: gradient
	            });
	        }
	        else{ //Coda Fresca
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
	eventObject.startTimeUnformatted = parseFloat(event.start_time);
	
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
	eventObject.reliability = Math.round( parseFloat(event.reliability * 100)) + "%";

	// Number of Notification
	eventObject.numNot = event.number_of_notifications;

	// Event coordinates
	if(eventObject.subtype != "Coda"){
		eventObject.lat = middlePoint(event.locations).lat();
		eventObject.lng = middlePoint(event.locations).lng();
	}
	else{
		eventObject.lat = event.locations[0].lat;
		eventObject.lng = event.locations[0].lng;
	}
		
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
	if(eventObject.subtype.toLowerCase() == "coda"){
		drawQueue(event);
	}

	// Add Event marker on map
	addEventMarker(eventObject);

	// Html description creation
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

	// Reset timeMin to 1 January 1970
	timeMin = 1; 

    searchEvent();
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
    	    radiusWidget.center_changedd();
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
$("#searchType").next().on('click', function() {
    var conceptName = $('#searchType').find(":selected").text();
    	// A type selected
        $('#searchSubType').html('<option disabled selected>Select subtype</option>');
        switch (conceptName) {
        	case "All":
                $('#searchSubType').html('<option disabled>Select subtype</option>\
                								<option selected>All</option>');
                break;
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
        $('.selectpicker').selectpicker('refresh');
        $('.selectpicker').selectpicker('render');
});

/**
 * Draw heatMap queue on map from event object
 * @param event Event info
 */
function drawQueue(event){
		if(event.locations.length != 1){
			// Choose two random points from pointsEvent Array
			var endUnformatted = event.locations.pop();
			var end = new google.maps.LatLng(endUnformatted.lat,endUnformatted.lng);
			var startUnformatted = event.locations.shift();
			var start = new google.maps.LatLng(startUnformatted.lat,startUnformatted.lng);
			
			// Compute distance between points
			var distanceSE = calcDistance(start, end);
			
			var waypointsArray = [];
			
			// For each points in the array, check if it's inside or outside of the route
			// If outside, it becomes new route vertex
			

			$.each(event.locations, function(j){
				var point = new google.maps.LatLng(event.locations[j].lat, event.locations[j].lng);
				var distancePS = calcDistance(point, start);
				var distancePE = calcDistance(point, end);

					if(distancePE > distanceSE || distancePS > distanceSE){
					    // This point will become the new vertex
					    if ( distancePS > distanceSE ){
					            var wayPoint = { location : end };
					            end = point;
					    }
					    else if( distancePE > distanceSE){
					            var wayPoint = { location : start };
					            start = point;
					    }
					    distanceSE = calcDistance(start, end);
					}
			});
			
			// Compute the expireTime 
			console.log(event.freshness);
            var fadedTime = parseFloat(event.freshness) + (10*60);
            var expireTime = parseFloat(event.freshness) + (20*60);
            var nowTime = new Date().getTime() / 1000;
                            
            console.log("Expire: " + expireTime)
            console.log("Now: " + nowTime)
            if(expireTime < nowTime){
                var gradient = [
                'rgba(34, 139, 34, 0)',
                'rgba(34, 139, 34, 1)' //Gradiente verde
                ];
                distRoute(start, end, null, event.event_id, gradient);
            }
            else if(fadedTime < nowTime){ /*L'evento è sbiadito*/
                var gradient = [
                'rgba(255, 165, 0, 0)',
                'rgba(255, 165, 0, 1)' //Gradiente arancio
                ];
                distRoute(start, end, null, event.event_id, gradient);
            }
            else{ //Coda Fresca
            	console.log("Fresca");
                var gradient = [
                'rgba(255, 0, 0, 0)',
                'rgba(255, 0, 0, 1)' //Gradiente rosso
                ];
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
        icon: getPin(eventObject.type, eventObject.subtype, eventObject.status),
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
	searchMarker.description = eventObject.description;
			
	// Add EventMarker to markerArray
	markersArray.push(searchMarker);				
	
	var onMarkerClick = function() {
		var marker = this;
		infoWindow.id = this.id;
		infoWindow.type = this.type;	
		infoWindow.subtype = this.subtype;	
		infoWindow.status = this.status;
		infoWindow.address = this.address;
		infoWindow.description = this.description;

		if($.isNumeric(infoWindow.id))
			infoWindow.scope = "local";
		else
			infoWindow.scope = "remote";
	  
		var latLng = marker.getPosition();

		// Create the Window on click
		createInfoWindow(marker.getPosition(), infoWindow);

		infoWindow.open(map, marker);
	};					

	// Create infoWindow on click
	google.maps.event.addListener(searchMarker, 'click', onMarkerClick);

	// Close infoWindow on map click
	google.maps.event.addListener(map, 'click', function() { infoWindow.close(); });
}