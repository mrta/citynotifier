/* Global Variables */
var msgArray = []; // Array per gestire visualizzazione alert
var count = 0; // Count ordine alerts

$(document).ready(function(){
	if(jQuery.cookie('session_user')){
		$('#account').fadeOut(1000, function() {
                    $('#account').html((jQuery.cookie('session_user'))[0].toUpperCase() + (jQuery.cookie('session_user')).slice(1) + ' <i class="icon-user icon-white"></i>');
                    $('#account').fadeIn(1000);
                    $('#notify').css('visibility','visible').hide().fadeIn(1000);
        });

        $('#account').next().empty();
        if(jQuery.cookie('session_auth') == 3) //ADMIN
			$('#account').next().html('<div id="logout-form">\
				<a href="#adminPanel" role="button" id="adminPanelButton" class="btn btn-info input-block-level" data-toggle="modal">Admin Panel</a>\
				<button id="logout" type="button" class="btn btn-danger input-block-level">Logout</button></div>');
		else
        	$('#account').next().html('<div id="logout-form"><button id="logout" type="button" class="btn btn-danger input-block-level">Logout</button></div>');
        $('#account').parent().removeClass('open');          
        
        if(jQuery.cookie('last_type') == "All"){
        	$('#searchType').val(jQuery.cookie('last_type'));
        }
        else{
        	$('#searchType').val(jQuery.cookie('last_type'));
        	$('#searchSubType').removeAttr("disabled");
		    $('#searchSubType').html('<option disabled selected>Select subtype</option>');
		    switch (jQuery.cookie('last_type')) {
		        case "Problemi stradali":
		            $('#searchSubType').html('<option disabled>Select subtype</option>\
		            								<option>All</option>\
													<option>Incidente</option>\
													<option>Buca</option>\
													<option>Coda</option>\
													<option>Lavori in corso</option>\
													<option>Strada impraticabile</option>');
		            break;
		        case "Emergenze sanitarie":
		            $('#searchSubType').html('<option disabled >Select subtype</option>\
		            								<option>All</option>\
													<option>Incidente</option>\
													<option>Malore</option>\
													<option>Ferito</option>');
		            break;
		        case "Reati":
		            $('#searchSubType').html('<option disabled>Select subtype</option>\
		            								<option>All</option>\
													<option>Furto</option>\
													<option>Attentato</option>');
		            break;
		        case "Problemi ambientali":
		            $('#searchSubType').html('<option disabled>Select subtype</option>\
		            								<option>All</option>\
													<option>Incendio</option>\
													<option>Tornado</option>\
													<option>Neve</option>\
													<option>Alluvione</option>');
		            break;
		        case "Eventi pubblici":
		            $('#searchSubType').html('<option disabled>Select subtype</option>\
		            								<option>All</option>\
													<option>Partita</option>\
													<option>Manifestazione</option>\
													<option>Concerto</option>');
		            break;
		    }
		    $("#searchSubType option:contains("+jQuery.cookie('last_subtype')+")").attr("selected","selected");
		}
        	
        
        $('#searchAddress').val(jQuery.cookie('last_address'));
        
        $('#searchRadius').val(jQuery.cookie('last_radius'));
        
        $('#searchStatus').val(jQuery.cookie('last_status'));
        $('#timeFromText').val(jQuery.cookie('last_timeFrom')); 
        	
        $('#timeToText').val(jQuery.cookie('last_timeTo')); 
        if($('#timeToText').val()){
			$('#liveButton').removeClass('btn-success loading');
			$('#liveButton').addClass('btn-danger');
		}
     }
     
     $('#notifyTipe').html('<option disabled selected>Select type</option>\
                                            <option>Problemi stradali</option>\
                                            <option>Emergenze sanitarie</option>\
                                            <option>Reati</option>\
                                            <option>Problemi ambientali</option>\
                                            <option>Eventi pubblici</option>');
	$('#notifySubType').html('<option disabled selected>Select subtype</option>');
});

/**
 * Test on brand click
 */
$('.brand').on('click', function(){
	//console.log(jQuery.cookie());
	errorAlert("Pota");
	/*heatMapArray = [];
	for(var i=0; i<heatmapArray.length;i++)
		heatmapArray[i].setMap(heatmapArray[i].getMap() ? null : map);
	heatmapArray = [];
	
	geocodePosition(new google.maps.LatLng(44.507188428208536, 11.342839968261728), null);*/

	/*if (typeof jQuery != 'undefined') {  
	    // jQuery is loaded => print the version
	    alert(jQuery.fn.jquery);
	}*/
	//userMarker.setMap(null);
	console.log(eventArray);
	//pota();
	//searchSkeptical(null);
	//console.log(lastLongitude + " " + lastLatitude);
});

/**
 * Refresh map objects on click on Refresh 
 */
$('#refresh').on('click', function() {
	// Remove userMarker
	if(userMarker){	
    	userMarker.setMap(null);
    	userMarker = null;
    }

    // Remove all objects from map
	clearOverlays();

	// Clear event Table
	$('#modalBody').html('');
	$('#infoAddress').html('Seleziona un punto sulla mappa')

	// Turn off radiusWidget
    radiusWidgetCheck = false;
});

/**
 * Click listener live Button
 */
$('#liveButton').click(function(){
    $(this).toggleClass('loading');
    if($(this).hasClass('loading')){
    	// On live
    	$(this).removeClass('btn-danger');
    	$(this).addClass('btn-success');

    	// timeTo set to NOW
    	$('#timeToText').val('');

    	// Create new markerPosition
		var markerPosition = new google.maps.LatLng(lastLatitude, lastLongitude);

		// Drop userMarker on map
		createUserMarker(markerPosition);

		if(!radiusWidgetCheck){
			// Create new distanceWidget
        	distanceWidget = new DistanceWidget(map);
        	radiusWidgetCheck = true;
		}
		searchEvent();
    	var interval = 1000 * LIVE_SECOND * 1; // Every LIVE_SECOND seconds. Default: 30
		refreshIntervalId = setInterval(searchEvent, interval);	
     }      
     else {
     	// Stop live
      	$(this).removeClass('btn-success');
    	$(this).addClass('btn-danger');

		clearInterval(refreshIntervalId);
      }	
});

/**
 * Bind change Event Status button on changeStatus() definied in notify
 */
$('#changeButton').on('click', function(){
	changeStatus();
})

/**
 * Deactive Live if timeTo is set
 */
$('#timeToText').change(function(){
      	$('#liveButton').removeClass('btn-success loading');
    	$('#liveButton').addClass('btn-danger');
});


/**
 * SearchEvent TimePickers
 */
var dateStart = new Date();
dateStart.setMonth(dateStart.getMonth() - 6); // 6 months ago

var today = new Date();
var todayUpdated = new Date(today.getTime() - 5*60000);

$('#datetimepickerFrom').datetimepicker({
	format: 'dd-mm-yyyy hh:ii',
	pickerPosition: 'bottom-left',
	startDate: dateStart,
	endDate: todayUpdated,
	autoclose: true,
	todayHighlight: true,
	initialDate: dateStart
});

$('#datetimepickerTo').datetimepicker({
	format: 'dd-mm-yyyy hh:ii',
	pickerPosition: 'bottom-left',
	startDate: dateStart,
	endDate: new Date(),
	autoclose: true,
	todayBtn: true,
	todayHighlight: true,
});

/**
 * Error alert
 * @param error Error message
 */
function errorAlert(error){
	var msgObj = new Object();
	msgObj.msg = error;
	msgObj.type = "error";
	msgArray.push(msgObj);
	handleMsg(msgObj);
	
}

/**
 * Succcess alert
 * @param msg Success message
 */
function successAlert(msg){
	var msgObj = new Object();
	msgObj.msg = msg;
	msgObj.type = "success";
	msgArray.push(msgObj);
	handleMsg(msgObj);
}

/**
 * Skeptical alert
 * @param msg Skeptical message
 */
function skepticalAlert(msg){
	var msgObj = new Object();
	msgObj.msg = msg;
	msgObj.type = "warning";
	msgArray.push(msgObj);
	handleMsg(msgObj);
}

function handleMsg(msgObj){
			$('#alertBox').css('display', 'block');
			$('#alertBox').css('opacity', 1);
			$('#alertBox').prepend('<div id="'+count+'alert" class="alert alert-'+msgObj.type+'">\
									<button type="button" class="close"></button>\
									<span id="alertMsg"><strong>'+msgObj.msg+'</strong></span></div>');
			var pota = '#'+count+'alert';
			$(pota).delay(2000).fadeTo(2000, 0, function(){
				$(this).css('display', 'none');
				$(this).remove();
				count--;
			});
			count++;
	}

/**
 * Create infoWindow
 * @param {google.maps.LatLng} Event coordinates
 * @param infoWindow Infowindow reference
 */
function createInfoWindow(latlng, infoWindow){

			// Extract info from infoWindow reference
			var infoID = infoWindow.id;
			var infoType = infoWindow.type;
			var infoSubType = infoWindow.subtype;
			var infoStatus = infoWindow.status;
			var infoScope = infoWindow.scope;
			var address = infoWindow.address;
		
			// Update changeEvent Modal panel values
			$('#eventIDModal').html(infoID);
			$('#coordModal').html(latlng.lat() + " , " + latlng.lng());
			$('#typeModal').html(infoType);
			$('#subtypeModal').html(infoSubType);
							
			switch (infoStatus) {
				case "Open":
						infoStatus = '<div class="btn-group"><a id="infoWindowStatus" type="button" class="btn dropdown-toggle btn-success" data-toggle="dropdown" href="#">'+infoStatus+'  <span class="caret"></span></a>';
						var changeStatus = '<a href="#notifyPanel" data-toggle="modal">Segnala evento chiuso</a>';
						while($("#statusModal").next().is("li"))
							$("#statusModal").next().remove();
						$('#statusModal').after('<li><span id="statusModalValue" class="label label-important">Closed</span>');
					break;
				case "Closed":
						infoStatus = '<div class="btn-group"><a id="infoWindowStatus" type="button" class="btn dropdown-toggle btn-danger" data-toggle="dropdown" href="#">'+infoStatus+'  <span class="caret"></span></a>';
						var changeStatus = '<a href="#notifyPanel" data-toggle="modal">Segnala evento aperto</a>'
						while($("#statusModal").next().is("li"))
							$("#statusModal").next().remove();
						$('#statusModal').after('<li><span id="statusModalValue" class="label label-success">Open</span>');

					break;
				case "Skeptical":
						infoStatus = '<div class="btn-group"><a id="infoWindowStatus" type="button" class="btn dropdown-toggle btn-warning" data-toggle="dropdown" href="#">'+infoStatus+' <span class="caret"></span></a>';
						var changeStatus = '<a href="#notifyPanel" data-toggle="modal">Risolvi evento scettico</a>';
						while($("#statusModal").next().is("li"))
							$("#statusModal").next().remove();
						$('#statusModal').after('<li><label class="radio">\
													<input type="radio" name="optionsRadios" id="optionsRadios1" value="open" checked style="vertical-align: middle"><span class="label label-success">Open</span></label></li>\
													<li><label class="radio">\
													<input type="radio" name="optionsRadios" id="optionsRadios2" value="closed" style="vertical-align: middle"><span class="label label-important">Closed</span></label></li>');
					break;	
			}
			  
			// Update infoWindow
			infoWindow.setContent('<div class="hero-unit">\
										<h2>'+infoSubType+'<img style="padding-left: 35px;" class="pull-right" src='+getIcon(infoType, infoSubType)+'></h2>\
										<h4>'+address+'</h4>\
										<p>'+infoType+' > '+infoSubType+'</p>\
										'+infoStatus+'\
											<ul class="dropdown-menu">\
												<li>'+changeStatus+'</li>\
											</ul>\
										</div>\
									</div>');
}

/**
 * Update radius value on search
 */
function updateRadius(distance){
	$('#searchRadius').val(Math.round(distance * 1000) / 1000 + " km");
	$('#searchRadius').val(($('#searchRadius').val().replace('.',',')));
}

/**
 * Update address after GeocodePosition
 */
 function updateAddress(address){
	$('#notifyAddress').val(address);
    $('#searchAddress').val(address);
    $('#infoAddress').html(address);
    $('#notifyAddress').parent().removeClass("error");
    $('#notifyAddress').next().removeClass("btn-danger");
    $('#addressMarkerSearch').removeClass("icon-white");
    $('#addressButtonSearch').removeClass("btn-danger");
	$('#addressMarkerSearch').removeClass("icon-white");
	$('#addressButtonNotify').removeClass("btn-danger");
	$('#addressMarkerNotify').removeClass("icon-white");
}

/**
 * Reset address after GeocodePosition error
 */
 function resetAddress(){
 	$('#notifyAddress').val('');
    $('#searchAddress').val('');
    $('#infoAddress').html("Seleziona un punto sulla mappa");
 }

/**
 * getLocation on press search/notify location button
 */
$('#addressButtonSearch').on('click', function(){
	getLocation();
});

$('#addressButtonNotify').on('click', function(){
	getLocation();
});

	

