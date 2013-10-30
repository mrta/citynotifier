// Autocomplete Service
var autoCompleteService = new google.maps.places.AutocompleteService();

/**
 * sendNotify() permette all'utente di segnalare una situazione al sistema CityNotifier
 */
function sendNotify() {
    xmlhttp = new XMLHttpRequest();
    url = URLSERVER.concat("/segnalazione");

	// Type object: Type & Subtype
    var notifyType = new Object();
    notifyType.type = ($('#notifyType').find(":selected").text()).toLowerCase().replace(/ /g, "_");
    notifyType.subtype = ($('#notifySubType').find(":selected").text()).toLowerCase().replace(/ /g, "_");

    // Notify object: Type Object, latlng coordinates, address, description
    var notifyObj = new Object();
    notifyObj.type = notifyType;
    notifyObj.lat = userMarker.getPosition().lat();
    notifyObj.lng = userMarker.getPosition().lng();
    notifyObj.description = $('#notifyDescription').val();
    notifyObj.address_components = lastAddress; //Geocoder global variable: last address geocoded

    // Create JSON Object from notifyObject
    var notifyJSON = JSON.stringify(notifyObj);
	
    if ((notifyType.type != "select_type") && (notifyType.subtype != "select_subtype") && $('#notifyAddress').val()) {
		    $.ajax({
		        url: url,
		        type: 'POST',
		        data: notifyJSON,
		        contentType: "application/json; charset=utf-8",
		        success: function(datiString, status, richiesta) {
		            successAlert(datiString.result.charAt(0).toUpperCase() + datiString.result.slice(1));
		            	var eventIDRemote = datiString.event[0].event_id;
		            	// Check if the event already exists in eventArray
						var result = $.grep(eventArray, function(e){ return e.eventID == eventIDRemote; });
						
						if (result.length == 0) {
							// New event from remote server
						  	createEvent(datiString.event[0]);
						  
						} 
						else if (result.length == 1) {
							// Update local event
							//clearEvent(result[0]);
						  	updateEvent(result[0], datiString.event[0], 0, notifyObj);
						}

		        },
		        error: function(err) {
		            errorAlert("Ajax Notify error");
		        }
		    });
		    $('#notify').parent().removeClass('open');
    }

    // Error: Type not selected
    if ((notifyType.type == "select_type")){
        $('#notifyType').selectpicker('setStyle','btn-danger');
    }
    else if ((notifyType.subtype == "select_subtype") && (!$('#notifySubType').attr('disabled')))
    	$('#notifySubType').selectpicker('setStyle','btn-danger'); // Error: SubType not selected

    // Error: Address not selected
    if (!$('#notifyAddress').val() && $('#notifyAddress').next().is('button')) {
        $('#notifyAddress').parent().addClass("error");
        $('#notifyType').attr('data-style', 'btn-danger');
        $('#notifyAddress').next().addClass("btn-danger");
        $('#addressMarkerNotify').addClass("icon-white");
    }

    // Type ok
    $("#notifyType").on("change", function() {
        $('#notifyType').next().children().removeClass('btn-danger');
    });

    // Subtype ok
    $("#notifySubType").on("change", function() {
        $('#notifySubType').next().children().removeClass('btn-danger');
    });

    // Address ok
    $('#notifyAddress').on("keypress", function() {
        $('#notifyAddress').parent().removeClass("error");
        $('#addressMarkerNotify').removeClass("icon-white");
        $('#addressButtonNotify').removeClass("btn-danger");
    });
}

/**
 * Notify event on click on Submit button
 */
$("#notify").next().on("click", "#notifySubmit", function() {
    sendNotify();
});

/**
 * Notify event on click on Notify dropdown Menu
 */
$('#notify').on('click', function() {
	
	// Create new userMarker if it's not on map
	if(!userMarker){
		// Create new markerPosition
		var markerPosition = new google.maps.LatLng(lastLatitude, lastLongitude);

		// Drop userMarker on map
		createUserMarker(markerPosition);
	}
	
	// RadiusWidget Toogle
    if(radiusWidget)
    	radiusWidget.set('distance', 0);
    if(sizer){
    	sizer.unbind('map');
    	sizer.unbind('position');
    	sizer.setMap(null);
    }
    radiusWidgetCheck = false;
});


/**
 * Notify address autocomplete
 */
$('#notifyAddress').typeahead({
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
						$('#notifyAddress').parent().addClass("error");
						$('#notifyAddress').parent().addClass("error");
						$('#addressButtonNotify').addClass("btn-danger");
						$('#addressMarkerNotify').addClass("icon-white");
					}
					else{
						// Ok: Address selected
						$('li.open ul.typeahead').parent().removeClass("error");
						$('#addressButtonNotify').removeClass("btn-danger");
						$('#addressMarkerNotify').removeClass("icon-white");
					}
					return prediction.description;
				}));
			}
			else if( status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) 
				console.log("No results");
		});
	},
	updater: function (item) {
		// In case of Address selected
		geocoder.geocode({ address: item }, function(results, status) {
			if (status != google.maps.GeocoderStatus.OK) {
				// Error: Wrong address selected
				$('#notifyAddress').parent().addClass("error");
				errorAlert('Cannot find address');
				return;
			}
			else{
				// Ok: Address selected
				$('li.open ul.typeahead').parent().removeClass("error");
				$('#addressButtonNotify').removeClass("btn-danger");
				$('#addressMarkerNotify').removeClass("icon-white");

				// Drop userMarker on map
				createUserMarker(results[0].geometry.location);
				}
		});
		return item;
	}
});

/**
 * Notify Type updater on click
 */
$("#notifyType").next().on('click', function() {
    var conceptName = $('#notifyType').find(":selected").text();
    if (conceptName != "Select Type") {
    	// A type selected
        $('#notifySubType').removeAttr("disabled");
        $('#notifySubType').html('<option disabled selected>Select subtype</option>');
        switch (conceptName) {
            case "Problemi stradali":
                $('#notifySubType').html('<option disabled selected>Select subtype</option>\
												<option>Incidente</option>\
												<option>Buca</option>\
												<option>Coda</option>\
												<option>Lavori in corso</option>\
												<option>Strada impraticabile</option>');
                break;
            case "Emergenze sanitarie":
                $('#notifySubType').html('<option disabled selected>Select subtype</option>\
												<option>Incidente</option>\
												<option>Malore</option>\
												<option>Ferito</option>');
                break;
            case "Reati":
                $('#notifySubType').html('<option disabled selected>Select subtype</option>\
												<option>Furto</option>\
												<option>Attentato</option>');
                break;
            case "Problemi ambientali":
                $('#notifySubType').html('<option disabled selected>Select subtype</option>\
												<option>Incendio</option>\
												<option>Tornado</option>\
												<option>Neve</option>\
												<option>Alluvione</option>');
                break;
            case "Eventi pubblici":
                $('#notifySubType').html('<option disabled selected>Select subtype</option>\
												<option>Partita</option>\
												<option>Manifestazione</option>\
												<option>Concerto</option>');
                break;
        }
        $('#notifySubType').prop('disabled',false);
        $('.selectpicker').selectpicker('refresh');
        $('.selectpicker').selectpicker('render');

    }
});

/**
 * Notify Citynotifier about an event modification
 */
function changeStatus(){

	// Change Object: ID, coordinates, Modify reason, type, subtype
	var changeObj = new Object();
	changeObj.event_id = $('#eventIDModal').html();
	changeObj.lat = $('#coordModal').html().split(" , ")[0];
	changeObj.lng = $('#coordModal').html().split(" , ")[1];
	changeObj.description = $('#descModal').val();
	changeObj.type = $('#typeModal').html().toLowerCase().replace(/ /g, "_");;
	changeObj.subtype = $('#subtypeModal').html().toLowerCase().replace(/ /g, "_");

	// Status skeptical
	if($('input[name=optionsRadios]:checked').val())
		changeObj.status = $('input[name=optionsRadios]:checked').val().toLowerCase();
	else
		changeObj.status = $('#statusModalValue').html().toLowerCase();



	// Create JSON Object from notifyObject
    var changeJSON = JSON.stringify(changeObj);
	
	xmlhttp = new XMLHttpRequest();
    url = URLSERVER.concat("/notifica");	

    $('#notifyPanel').modal('toggle');
    infoWindow.close();
	
	$.ajax({
            url: url,
            type: 'POST',
            data: changeJSON,
            contentType: "application/json; charset=utf-8",
            success: function(datiString, status, richiesta) {
            	successAlert("Modifica segnalata con successo"); 

            	if(datiString.event_id){ //Update Event remote
            		changeObj.new_id = URLSERVER.split(".")[0].split("//")[1] + "_" + datiString.event_id; //New ID
            	} 
            	updateInfoWindow(changeObj);
            },
            error: function(err) {
                errorAlert("Errore nella modifica dell'evento");
                $('#notifyPanel').modal('toggle');
            }  	
       });
}


function updateInfoWindow(changeObj){

	var markerFoundArray = $.grep(markersArray, function(e){ return e.id == changeObj.event_id; });
	var eventsFoundArray = $.grep(eventArray, function(e){ return e.eventID == changeObj.event_id; });
	
	if(changeObj.new_id){
		changeObj.event_id = changeObj.new_id;
	}


	// New marker
	if(markerFoundArray[0].status != "Skeptical"){
		if(changeObj.status == "closed"){
    		markerFoundArray[0].status = "Closed";
    		markerFoundArray[0].setIcon(getPin(markerFoundArray[0].type, markerFoundArray[0].subtype, markerFoundArray[0].status));

    		if(changeObj.subtype == "coda"){
    			var heatmapFoundArray = $.grep(heatmapArray, function(e){ return e.eventID == changeObj.event_id; });
    			var heatmapFound = heatmapFoundArray[0];
    			if(heatmapFound){
		            var gradient = [
		                'rgba(34, 139, 34, 0)',
		                'rgba(34, 139, 34, 1)' //Gradiente verde
		            ];
		            heatmapFound.setOptions({
		                gradient: gradient
		            });
       		 	}
    		}
		}
    	else{
			markerFoundArray[0].status = "Skeptical";
			markerFoundArray[0].setIcon(getPin(markerFoundArray[0].type, markerFoundArray[0].subtype, markerFoundArray[0].status));
    	}
	}

	// New Status
	switch (markerFoundArray[0].status) {
			case "Open":
				var statusHtml = '<button class="btn btn-success">'+markerFoundArray[0].status;
				break;
			case "Closed":
				var statusHtml = '<button class="btn btn-danger">'+markerFoundArray[0].status;
				break;
			case "Skeptical":
				var statusHtml = '<button class="btn btn-warning">'+markerFoundArray[0].status;
				break;	
	}

	$('#'+changeObj.event_id+'tr td:nth-child(6)').html(statusHtml);

	// New Description
	markerFoundArray[0].description.unshift(changeObj.description);
	if(changeObj.description){
		$('#'+changeObj.event_id+'but').removeClass('disabled');
		$('#'+changeObj.event_id+'but').next().prepend('<li><p>'+changeObj.description+'</p></li>');
	}

	markerFoundArray[0].id = changeObj.event_id;
	markerFoundArray[0].setTitle(changeObj.event_id);
	$('#'+changeObj.event_id+'tr').attr("id",changeObj.event_id+"tr");
	$('#'+changeObj.event_id).attr("id",changeObj.event_id);
	$('#'+changeObj.event_id+'but').attr("id",changeObj.event_id+"but");

	eventsFoundArray[0].eventID = changeObj.event_id;

	// New Number of Notifications
	eventsFoundArray[0].numNot++;
	$('#'+changeObj.event_id+'tr td:nth-child(5)').html(eventsFoundArray[0].numNot+' / '+eventsFoundArray[0].reliability);

}

function clearEvent(event){
	var markerFoundArray = $.grep(markersArray, function(e){ return e.id == event.eventID; });
	
	// Clear old descriptions
	markerFoundArray[0].description = [];
	event.description = [];
	$("#"+event.eventID+"but").next().html('');

	// Clear old number of notifications
	event.numNot = 0;
}