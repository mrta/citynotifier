/* Global Variables */
var count = 0; // Count alerts orders

$(document).ready(function(){
	// Store session user authentication 
	session_auth = jQuery.cookie('session_auth');

	// Load cookie info
	if(jQuery.cookie('session_user')){ 

		// If a user is logged

		// Update login gui
		$('#account').fadeOut(1000, function() {
                    $('#account').html((jQuery.cookie('session_user'))[0].toUpperCase() + (jQuery.cookie('session_user')).slice(1) + ' <i class="icon-user icon-white"></i>');
                    $('#account').fadeIn(1000);
                    $('#notify').css('visibility','visible').hide().fadeIn(1000);
        });
        $('#account').next().empty();

        // If admin loads admin panel
        if(jQuery.cookie('session_auth') == 3) //ADMIN
			$('#account').next().html('<div id="logout-form">\
				<a href="#adminPanel" role="button" id="adminPanelButton" class="btn btn-info input-block-level" data-toggle="modal">Admin Panel</a>\
				<button id="logout" type="button" class="btn btn-danger input-block-level">Logout</button></div>');
		else
        	$('#account').next().html('<div id="logout-form"><button id="logout" type="button" class="btn btn-danger input-block-level">Logout</button></div>');
        $('#account').parent().removeClass('open');          
        
        // Update search infos
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
        	
        // Update address
        $('#searchAddress').val(jQuery.cookie('last_address'));
        console.log("Pota2");
        
        // Update radius
        updateRadius(jQuery.cookie('last_radius'));
        if(isNaN(jQuery.cookie('last_radius')) || jQuery.cookie('last_radius') == 0)
        	updateRadius(RADIUS);
        distanceDefault = jQuery.cookie('last_radius').split(" ")[0];
        
        // Update status
        $('#searchStatus').val(jQuery.cookie('last_status'));
        	
        // Update time
        $('#timeToText').val(jQuery.cookie('last_timeTo')); 
        if($('#timeToText').val()){
			$('#liveButton').removeClass('btn-success loading');
			$('#liveButton').addClass('btn-danger');
		}
     }

    // Render selectPicker 
	$('.selectpicker').selectpicker('refresh');
    $('.selectpicker').selectpicker('render');

    // Get user Location
    getLocation();
});

/**
 * Test on brand click
 */
$('.brand').on('click', function(){
	summerEgg();
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
    	$('#timeFromText').val('');

    	// Create new markerPosition
		var markerPosition = new google.maps.LatLng(lastLatitude, lastLongitude);

		// Drop userMarker on map
		createUserMarker(markerPosition);

		if(!radiusWidgetCheck){
			// Create new distanceWidget
        	distanceWidget = new DistanceWidget(map);
        	radiusWidgetCheck = true;
		}

		timeMin = 1;
		clearOverlays();
		
		// Clear list table
		$('#modalBody').html('');

		searchEvent();

    	var interval = 1000 * LIVE_SECOND * 1; // Every LIVE_SECOND seconds. Default: 30
		refreshIntervalId = setInterval(searchLive, interval);	
     }      
     else {
     	// Stop live
     	if(searching)
     		$(this).attr('disabled', 'disabled');
      	$(this).removeClass('btn-success');
    	$(this).addClass('btn-danger');
    	
    	$('#timeFromText').val('');

		clearInterval(refreshIntervalId);
      }	
});

/**
 * Bind change Event Status button on changeStatus() definied in notify
 */
$('#changeButton').on('click', function(){
	changeStatus();
});

/**
 * Change submit button enter pressed listener
 */
$("#notifyPanel").on('keypress', '#descModal', function(e) {
    if (e.which === 13) {
        changeStatus();
    }
});

/**
 * Deactive Live if timeTo is set
 */
$('#timeToText').change(function(){
      	$('#liveButton').removeClass('btn-success loading');
    	$('#liveButton').addClass('btn-danger');
    	clearInterval(refreshIntervalId);
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
	handleMsg(msgObj);
}

function handleMsg(msgObj){
			 $.noty.consumeAlert({layout: 'bottomLeft', type: msgObj.type, dismissQueue: true, timeout: 2000});
	 			alert(msgObj.msg);
	 		$.noty.stopConsumeAlert();
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
			var descriptions = infoWindow.description;
		
			// Update changeEvent Modal panel values
			$('#eventIDModal').html(infoID);
			$('#coordModal').html(latlng.lat() + " , " + latlng.lng());
			$('#typeModal').html(infoType);
			$('#subtypeModal').html(infoSubType);
			$('#descModal').val('');

			if(!session_auth){
				var disabled = 'disabled';
				var infoCaret = ''
				var disabledInfo = ''
			}
			else if (session_auth == 2 && ( infoSubType == "Buca" || infoSubType == "Lavori in corso") ){
				var disabled = 'disabled';
				var infoCaret = ''
				var disabledInfo = '<p class="text-error text-auth">Non sei autorizzato a cambiare lo stato dell\'evento</p>'
			}
			else{
				var disabled = '';
				var infoCaret = '<span class="caret"></span>'
				var disabledInfo = ''
			}
							
			switch (infoStatus) {
				case "Open":
						infoStatus = '<div class="btn-group" id="infoStatusBtnGroup"><a id="infoWindowStatus" type="button" class="btn dropdown-toggle '+disabled+' btn-success" data-toggle="dropdown" href="#">'+infoStatus+''+infoCaret+'</a>'+disabledInfo;
						var changeStatus = '<a href="#notifyPanel" data-toggle="modal">Segnala evento chiuso</a>';
						while($("#statusModal").next().is("li"))
							$("#statusModal").next().remove();
						$('#statusModal').after('<li><span id="statusModalValue" class="label label-important">Closed</span>');
					break;
				case "Closed":
						infoStatus = '<div class="btn-group" id="infoStatusBtnGroup"><a id="infoWindowStatus" type="button" class="btn dropdown-toggle '+disabled+' btn-danger" data-toggle="dropdown" href="#">'+infoStatus+''+infoCaret+'</a>'+disabledInfo;
						var changeStatus = '<a href="#notifyPanel" data-toggle="modal">Segnala evento aperto</a>'
						while($("#statusModal").next().is("li"))
							$("#statusModal").next().remove();
						$('#statusModal').after('<li><span id="statusModalValue" class="label label-success">Open</span>');

					break;
				case "Skeptical":
						infoStatus = '<div class="btn-group" id="infoStatusBtnGroup"><a id="infoWindowStatus" type="button" class="btn dropdown-toggle '+disabled+' btn-warning" data-toggle="dropdown" href="#">'+infoStatus+''+infoCaret+'</a>'+disabledInfo;
						var changeStatus = '<a href="#notifyPanel" data-toggle="modal">Risolvi evento scettico</a>';
						while($("#statusModal").next().is("li"))
							$("#statusModal").next().remove();
						$('#statusModal').after('<li><label class="radio">\
													<input type="radio" name="optionsRadios" id="optionsRadios1" value="open" checked style="vertical-align: middle"><span class="label label-success">Open</span></label></li>\
													<li><label class="radio">\
													<input type="radio" name="optionsRadios" id="optionsRadios2" value="closed" style="vertical-align: middle"><span class="label label-important">Closed</span></label></li>');
					break;	
			}

			// Html description creation
			var countDesc = 0;
			var descriptionHtml = "";
			var fullArray = checkArray(descriptions);
			if(fullArray){
				for (j=0; j<descriptions.length; j++){
					if(descriptions[j] && countDesc < 5){
						descriptions[j] = descriptions[j].charAt(0).toUpperCase() + descriptions[j].slice(1);
						descriptionHtml = descriptionHtml.concat('<li><p>'+descriptions[j]+'</p></li>');
						countDesc++
					}
				}	
			}
	  
			// Update infoWindow
			infoWindow.setContent('<div class="hero-unit">\
										<h2>'+infoSubType+'<img id="imgInfoWindow" src='+getIcon(infoType, infoSubType)+'></h2>\
										<h4>'+address+'</h4>\
										<p>'+infoType+' > '+infoSubType+'</p>\
										<ul id="ulInfoWindow">\
											'+descriptionHtml+'\
										</ul>\
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
	$('#addressButtonSearch').removeClass("btn-danger");
	$('#addressMarkerSearch').removeClass("icon-white");
	getLocation();
});

$('#addressButtonNotify').on('click', function(){
	getLocation();
});

// Load selectPicker plugin
$('.selectpicker').selectpicker();
$('.selectpicker-div').on('click', function(e){
	$('.selectpicker-div').not(this).removeClass('open');
	$(this).toggleClass('open');
	e.stopPropagation();
});
$('body').on('click', function() {
	$('.selectpicker-div').removeClass('open');
});

// Create cookie
$(window).unload(function() {
    // Create cookies
    if(jQuery.cookie('session_user')){
        jQuery.cookie('last_type', $('#searchType').val(), { path: '/', expires: 30 });
        jQuery.cookie('last_subtype', $('#searchSubType').val(), { path: '/', expires: 30 });
        jQuery.cookie('last_address', $('#searchAddress').val(), { path: '/', expires: 30 });
        jQuery.cookie('last_radius', distanceDefault, { path: '/', expires: 30 });
        jQuery.cookie('last_status', $('#searchStatus').val(), { path: '/', expires: 30 });
        jQuery.cookie('last_timeTo', $('#timeToText').val(), { path: '/', expires: 30 });
    
        // Save last location clicked
        if(userMarker){
            jQuery.cookie('last_lat', userMarker.getPosition().lat(), { path: '/', expires: 30 });
            jQuery.cookie('last_lng', userMarker.getPosition().lng(), { path: '/', expires: 30 });
        }     
    }
});