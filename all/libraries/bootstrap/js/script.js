var firstTime = 0;
var urlServer = "http://"+document.location.hostname;
var urlCrossDomain = -1;

var lastGeo;

var eventsMap = [];

$('.brand').on('click', function(){
	console.log(jQuery.cookie());
	errorAlert("Pota");	
});

$(window).unload(function() {
	if(jQuery.cookie('session_user')){
		jQuery.cookie('last_type', $('#searchType').val(), { path: '/', expires: 30 });
		jQuery.cookie('last_subtype', $('#searchSubType').val(), { path: '/', expires: 30 });
		jQuery.cookie('last_address', $('#searchAddress').val(), { path: '/', expires: 30 });
		jQuery.cookie('last_radius', $('#searchRadius').val(), { path: '/', expires: 30 });
		jQuery.cookie('last_status', $('#searchStatus').val(), { path: '/', expires: 30 });
		jQuery.cookie('last_timeFrom', $('#timeFromText').val(), { path: '/', expires: 30 });
		jQuery.cookie('last_timeTo', $('#timeToText').val(), { path: '/', expires: 30 });
	
		if(userMarker){
			jQuery.cookie('last_lat', userMarker.getPosition().lat(), { path: '/', expires: 30 });
			jQuery.cookie('last_lng', userMarker.getPosition().lng(), { path: '/', expires: 30 });
		}
		
		
	}
});

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
});


$("#account").next().delegate("#login", "click", function() {
    loginFunction();
});

$("#account").next().delegate('#pass', 'keypress', function(e) {
    if (e.which === 13) {
        loginFunction();
    }
});

/*------------------------------*/
$("#search").next().delegate('#searchRadius', 'keypress', function(e) {
    if (e.which === 13){
    	var klm = $('#searchRadius').val().split(" ")[0].replace(',','.');
    	if(jQuery.isNumeric(klm) && klm > 0) {
    	    radiusWidget.set('distance', klm);
    	    radiusWidget.center_changed();
    	    $('#searchRadius').parent().removeClass("error");
    	}
    	else if(!(jQuery.isNumeric(klm)) || klm <= 0){
				$('#searchRadius').parent().addClass("error");
				$('#searchRadius').val("Insert a valid radius");
			}
	}
});
$('#searchRadius').blur(function() {
	var klm = $('#searchRadius').val().split(" ")[0].replace(',','.');
	if(klm)
	  	if(jQuery.isNumeric(klm) && klm > 0){
	  		radiusWidget.set('distance', klm);
		    radiusWidget.center_changed();
		    $('#searchRadius').parent().removeClass("error");
	  	}
	  	else{
	  		$('#searchRadius').parent().addClass("error");
			$('#searchRadius').val("Insert a valid radius");
	  	}
});
$("#searchRadius").on('click', function(){
	if($('#searchRadius').parent().hasClass('error'))
			$('#searchRadius').val('');
});


/*------------------------------*/


function loginFunction() {
    xmlhttp = new XMLHttpRequest();
    url = urlServer.concat("/login");

    var loginObj = new Object();
    loginObj.username = $('#user').val();
    loginObj.password = $('#pass').val();

    var userError = $('<span id="user_span" class="help-inline">User incorrect</span>');
    var passError = $('<span id="pass_span" class="help-inline">Password incorrect</span>');

    var loginJSON = JSON.stringify(loginObj);
    console.log(loginJSON);

    if ((loginObj.username) && (loginObj.password)) {
        $.ajax({
            url: url,
            type: 'POST',
            data: loginJSON,
            contentType: "application/json; charset=utf-8",
            success: function(datiString, status, richiesta) {
            	successAlert("Login effettuato con successo");
            	//success code
       			var session_id = datiString.session_id;
        		var session_name = datiString.session_name;   
        		var session_user = datiString.username;   
        		var session_auth = datiString.roles;
        		console.log("Creo la sessione di nome "+session_name+" con id "+session_id);
        		
        		jQuery.cookie('session_name', session_name, { path: '/', expires: 30 });
        		jQuery.cookie('session_id', session_id, { path: '/', expires: 30 });
        		jQuery.cookie('session_user', session_user, { path: '/', expires: 30 });
        		
        		
            	 
            
                $('#account').fadeOut(1000, function() {
                    $('#account').html((loginObj.username)[0].toUpperCase() + (loginObj.username).slice(1) + ' <i class="icon-user icon-white"></i>');
                    $('#account').fadeIn(1000);
                    $('#notify').css('visibility','visible').hide().fadeIn(1000);
                });

                $('#account').next().empty();
                for (var auth_level in session_auth) {
  					if(auth_level == 3){ //ADMIN
  						$('#account').next().html('<div id="logout-form">\
  							<a href="#adminPanel" role="button" id="adminPanelButton" class="btn btn-info input-block-level" data-toggle="modal">Admin Panel</a>\
  							<button id="logout" type="button" class="btn btn-danger input-block-level">Logout</button></div>');
  							jQuery.cookie('session_auth', auth_level, { path: '/', expires: 30 });
  							
					}
  					else{
  						$('#account').next().html('<div id="logout-form"><button id="logout" type="button" class="btn btn-danger input-block-level">Logout</button></div>');	
						jQuery.cookie('session_auth', auth_level, { path: '/', expires: 30 });
					}
				}

                
				
				$('#account').parent().removeClass('open');
            },
            error: function(err) {
                errorAlert("Utente non registrato");
            }
        });
    }
    else if (!(loginObj.username) && $("#user").is(':last-child')) {
        $('#user').parent().addClass("error");
        $('#user').after(userError);
    }
    else if (!(loginObj.password) && $("#pass").is(':last-child')) {
        $('#pass').parent().addClass("error");
        $('#pass').after(passError);
    }

    $('#user').on("keypress", function() {
        $('#user').parent().removeClass("error");
        $('#user_span').fadeOut();
        $('#user_span').remove();
    });
    $('#pass').on("keypress", function() {
        $('#pass').parent().removeClass("error");
        $('#pass_span').fadeOut();
        $('#pass_span').remove();
    });
}

$("#account").next().delegate("#logout", "click", function() {
    xmlhttp = new XMLHttpRequest();
    url = urlServer.concat("/logout");

    $('#account').fadeOut(1000, function() {
        $('#account').html("Account " + '<i class="icon-user icon-white"></i>');
        $('#account').fadeIn(1000);

        $('#account').next().empty();
        $('#account').next().html('<form>\
									<fieldset>\
										<div class="control-group">\
											<input id="user" type="text" placeholder="Username"></div>\
											<div class="control-group">\
											<input id="pass" type="password" placeholder="Password"></div>\
											<button id="login" type="button" class="btn btn-inverse pull-right">Login</button>\
										</fieldset>\
									</form>');
        $('#account').next().fadeIn();
        $('#account').removeAttr("style");
        $('#account').next().removeAttr("style");
    });

    $.ajax({
        url: url,
        method: 'POST',
        data: null,
        success: function(datiString, status, richiesta) {
        	jQuery.removeCookie('session_name');
        	jQuery.removeCookie('session_id');
        	jQuery.removeCookie('session_user');
        	jQuery.removeCookie('session_auth');
        	
        	jQuery.removeCookie('last_type');
			jQuery.removeCookie('last_subtype');
			jQuery.removeCookie('last_address');
			jQuery.removeCookie('last_radius');
			jQuery.removeCookie('last_status');
			jQuery.removeCookie('last_timeFrom');
			jQuery.removeCookie('last_timeTo');
	
			jQuery.removeCookie('last_lat');
			jQuery.removeCookie('last_lng');
			
			successAlert("Logout effettuato con successo");
        	
        	$('#notify').fadeOut(1000);
        },
        error: function(err) {
        	errorAlert("Si è verificato un errore con il logout");
        }
    });
});


$("#notifyType").on('change', function() {
    var conceptName = $('#notifyType').find(":selected").text();
    if (conceptName != "Select Type") {
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
    }
});

$("#searchType").on('change', function() {
    var conceptName = $('#searchType').find(":selected").text();
    if (conceptName != "All") {
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
    }
    else{
    	$('#searchSubType').attr('disabled', 'disabled');
    	$('#searchSubType').html('<option disabled selected>Select subtype</option>');
    }
});

$("#notify").next().delegate("#notifySubmit", "click", function() {
    sendNotify();
});

function queueOk(){
	queueCheck = false;
	sendNotify();
	$(".alert").alert('close');
};

function alertClose(){
	$(".alert").alert('close');
};

var queueCheck = true;
function sendNotify() {
    xmlhttp = new XMLHttpRequest();
    url = urlServer.concat("/segnalazione");


    var notifyType = new Object();
    notifyType.type = ($('#notifyType').find(":selected").text()).toLowerCase().replace(/ /g, "_");
    notifyType.subtype = ($('#notifySubType').find(":selected").text()).toLowerCase().replace(/ /g, "_");

    var notifyObj = new Object();
    notifyObj.type = notifyType;
    notifyObj.lat = userMarker.getPosition().lat();
    notifyObj.lng = userMarker.getPosition().lng();
    notifyObj.description = $('#notifyDescription').val();
    notifyObj.address_components = lastGeo; //Asincrono. Pericoloso Pericoloso!!

    /*var typeError = $('<span id="type_span" class="help-inline">Select a type</span>');
     var subTypeError = $('<span id="sybtype_span" class="help-inline">Select a subtype</span>');*/
    var addressError = $('<span id="address_span">Select an address on map</span>');

    var notifyJSON = JSON.stringify(notifyObj);
    //console.log(notifyType.type);

	//console.log("Invio notifica con subtype "+notifyType.subtype+" lat: "+notifyObj.lat+" lng: "+notifyObj.lng);
	
    if ((notifyType.type != "select_type") && (notifyType.subtype != "select_subtype") && $('#notifyAddress').val()) {
    	console.log(notifyType.subtype);
    	if(notifyType.subtype == "coda" && queueCheck){
			warningAlert();
		}
		else{
		    $.ajax({
		        url: url,
		        type: 'POST',
		        data: notifyJSON,
		        contentType: "application/json; charset=utf-8",
		        success: function(datiString, status, richiesta) {
		            $('#notify').parent().removeClass('open');
		            successAlert("Notifica Inviata!");
		            queueCheck = true;
		        },
		        error: function(err) {
		            errorAlert("Ajax Notify error");
		            queueCheck = true;
		        }
		    });
        }
    }
    if ((notifyType.type == "select_type")) {
        $('#notifyType').parent().addClass("error");
    }
    else
    if ((notifyType.subtype == "select_subtype") && (!$('#notifySubType').attr('disabled'))) {
        $('#notifySubType').parent().addClass("error");
    }
    if (!$('#notifyAddress').val() && $('#notifyAddress').next().is('button')) {
        $('#notifyAddress').parent().addClass("error");
        $('#notifyAddress').next().addClass("btn-danger");
        $('#addressMarkerNotify').addClass("icon-white");
    }

    $("#notifyType").on("change", function() {
        $('#notifyType').parent().removeClass("error");
    });
    $("#notifySubType").on("change", function() {
        $('#notifySubType').parent().removeClass("error");
    });
    $('#notifyAddress').on("keypress", function() {
        $('#notifyAddress').parent().removeClass("error");
        $('#addressMarkerNotify').removeClass("icon-white");
        $('#addressButtonNotify').removeClass("btn-danger");
    });
}


/*****************GEOLOCALIZZAZIONE***************************/
function getLocation() {
	$('#search').parent().removeClass('open');
	$('#notify').parent().removeClass('open');
    if (navigator.geolocation) {
        // timeout at 60000 milliseconds (60 seconds)
        var options = {timeout: 60000};
        navigator.geolocation.getCurrentPosition(showLocation, errorHandler, options);
    } else {
        errorAlert("Sorry, browser does not support geolocation!");
    }
}
function showLocation(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;

    if (userMarker)
        userMarker.setMap(null);
    radiusWidgetCheck = false;
        
    userMarker = new google.maps.Marker({
        position: new google.maps.LatLng(latitude, longitude),
        map: map,
        draggable: true,
        title: "SONO QUI!",
        animation: google.maps.Animation.DROP
    });
    
    lastLatitude = latitude;
    lastLongitude = longitude;
    
    map.panTo(new google.maps.LatLng(latitude, longitude));
    geocodePosition(new google.maps.LatLng(latitude, longitude), null);
    $('#notify').parent().removeClass('open');
    //$('#search').parent().removeClass('open');
    
    google.maps.event.addListener(userMarker, 'dragend', updateMarker);
}

function errorHandler(err) {	
    if (userMarker)
        userMarker.setMap(null);
    radiusWidgetCheck = false;
    
    if (err.code == 1 || err.code == 2) {
        errorAlert("Position is not available!");
    	
    if(jQuery.cookie('last_lat') && !firstTime){
    	firstTime = 1;
    	geocodePosition(new google.maps.LatLng(jQuery.cookie('last_lat'), jQuery.cookie('last_lng')), null);
    	var mPosition = new google.maps.LatLng(jQuery.cookie('last_lat'), jQuery.cookie('last_lng'));
    }
    else{
    	geocodePosition(new google.maps.LatLng(44.494860, 11.342598), null);
    	var mPosition = new google.maps.LatLng(44.494860,11.342598);
    	map.panTo(mPosition);
    }
    	
	userMarker = new google.maps.Marker({
	    position: mPosition,
	    map: map,
	    draggable: true,
	    title: "SONO QUI!",
	    animation: google.maps.Animation.DROP
	});
    	
    google.maps.event.addListener(userMarker, 'dragend', updateMarker);  
   }
    
}
/********************************************/


$("#search").next().delegate("#searchSubmit", "click", function() {
    searchEvent();
});

function buildUrl(url, parameters) {
    var qs = "";
    for (var key in parameters) {
        var value = parameters[key];
        qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
    }
    if (qs.length > 0) {
        qs = qs.substring(0, qs.length - 1); //chop off last "&"
        url = url + "?" + qs;
    }
    return url;
}

function searchEvent() {

    var d = new Date();   
    xmlhttp = new XMLHttpRequest();
    
    var parameters = new Array();
    if(urlCrossDomain != -1)
    	parameters["scope"] = "remote"
    else
    	parameters["scope"] = "local";
    parameters["type"] = ($('#searchType').find(":selected").text()).toLowerCase().replace(/ /g, "_");
    
    var subtypeSelected = ($('#searchSubType').find(":selected").text()).toLowerCase().replace(/ /g, "_");
    if(subtypeSelected == "select_subtype")
    	parameters["subtype"] = "all";
    else
    	parameters["subtype"] = subtypeSelected;
    	
    parameters["lat"] = userMarker.getPosition().lat();
    parameters["lng"] = userMarker.getPosition().lng();
    parameters["radius"] = radiusWidget.get('distance') * 1000;
    
    
    var timeMin = toTimestamp(parseDate($("#timeFromText").val().replace(/\-/g,'/')));
    if(isNaN(timeMin))
    	timeMin = toTimestamp(dateStart);
    parameters["timemin"] = timeMin;
    
    
    var timeMax = toTimestamp(parseDate($("#timeToText").val().replace(/\-/g,'/')));

    if(isNaN(timeMax))
    	timeMax = toTimestamp(new Date());
    parameters["timemax"] = timeMax;

    
    parameters["status"] = $('#searchStatus').val().toLowerCase();
	if(urlCrossDomain != -1)
		parameters["dest"] = urlCrossDomain;
	console.log("scope="+parameters["scope"]+"&type="+parameters["type"]+"&subtype="+parameters["subtype"]+"&lat="+parameters["lat"]+"&lng="+parameters["lng"]+"&radius="+parameters["radius"]+"&timemin="+parameters["timemin"]+"&timemax="+parameters["timemax"]+"&status="+parameters["status"]+"&dest="+parameters["dest"]);
    
    url = urlServer.concat(buildUrl("/richieste", parameters));

	if($('#searchAddress').val() != ''){
		$('#infoAddress').append('<p id="spinner"></p>');
		$('#searchAddress').parent().removeClass("error");
		$('#addressButtonSearch').removeClass("btn-danger");
		$('#addressMarkerSearch').removeClass("icon-white");
		
		
		$.ajax({
		    url: url,
		    type: 'GET',
		    success: function(datiString, status, richiesta) {
	    		eventsMap.length = 0;
		    	clearOverlays();
		    	$('#modalBody').html('');
		    	
		    	successAlert("Ricerca in corso...");
		        $('#search').parent().removeClass('open');
		          
		        $.each(datiString.events, function(index, event){
					createEvent(event);
				});
				
				//Seconda chiamata remote
				parameters["scope"] = "remote"
				url = urlServer.concat(buildUrl("/richieste", parameters));

				$.ajax({
					url: url,
					type: 'GET',
					success: function(responseRemote, status, richiesta) {
						successAlert("Aggiornamento in corso...");
						$('#search').parent().removeClass('open');
						
						
						$.each(responseRemote, function(index, response){
							console.log(responseRemote);
							$.each(response.events, function(index, event){
								console.log(index);
								console.log(event);
								var eventIDRemote = event.event_id;
							
								var result = $.grep(eventsMap, function(e){ return e.id == eventIDRemote; });
							
								if (result.length == 0) {
							
								  //console.log("Nuovo evento");
									if(event.locations[0]) //Fix temporaneo perchè QuellidiLettere non tornano un array
								  		createEvent(event);
								  
								} else if (result.length == 1) {
							
									//console.log("Evento esiste già");
								  	// access the foo property using result[0].foo
								  	updateEvent(result[0], event);
								  
								} else {
							
									console.log("ERROR! Più eventi fanno match!!!!");
								  // multiple items found
								  
								}
							});
					 	});
				 	},
					error: function(err) {
						errorAlert("Ajax Remote Notify error");
					}
				});
				$('#spinner').fadeOut(2000, function() { $(this).remove(); });
	 		},
		    error: function(err) {
		        errorAlert("Ajax Notify error");
		    }
		});
	}
	else{
		 if (!$('#searchAddress').val() && $('#searchAddress').next().is('button')) {
		    $('#searchAddress').parent().addClass("error");
		    $('#searchAddress').next().addClass("btn-danger");
		    $('#addressMarkerSearch').addClass("icon-white");
    	}
	}
}

function updateEvent(eventLocal, eventRemote){

	eventLocal.description = eventRemote.description;
	eventLocal.freshness = eventRemote.freshness;	
	eventLocal.status = eventRemote.status.charAt(0).toUpperCase() + eventRemote.status.slice(1);
	var statusFormatted = eventLocal.status;
	
	switch (eventLocal.status) {
		case "Open":
			eventLocal.status = '<button class="btn btn-success">'+eventLocal.status;
			break;
		case "Closed":
			eventLocal.status = '<button class="btn btn-danger">'+eventLocal.status;
			break;
		case "Skeptical":
			eventLocal.status = '<button class="btn btn-warning">'+eventLocal.status;
			break;	
	}
	
	eventLocal.reliability = eventRemote.reliability;
	eventLocal.numNot = eventRemote.number_of_notifications;
}

function createEvent(event){		        
	var eventObject = new Object();
	eventObject.type = event.type.type.charAt(0).toUpperCase() + event.type.type.slice(1).replace(/_/g," ");
	eventObject.subtype = event.type.subtype.charAt(0).toUpperCase() + event.type.subtype.slice(1).replace(/_/g," ");
	eventObject.description = event.description;
	
	var date = new Date(event.start_time*1000);
		var day = date.getDate();
		var month = date.getMonth();
		var year = date.getFullYear();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
	eventObject.startTime = day+'/'+month+'/'+year+'\t'+ hours + ':' + minutes + ':' + seconds;
	
	eventObject.freshness = event.freshness;

	var status = event.status;
	eventObject.status = status.charAt(0).toUpperCase() + status.slice(1);
	var statusFormatted = eventObject.status;
	switch (eventObject.status) {
		case "Open":
			eventObject.status = '<button class="btn btn-success">'+eventObject.status;
			break;
		case "Closed":
			eventObject.status = '<button class="btn btn-danger">'+eventObject.status;
			break;
		case "Skeptical":
			eventObject.status = '<button class="btn btn-warning">'+eventObject.status;
			break;	
	}

	eventObject.reliability = Math.round(event.reliability * 100) / 100;
	eventObject.numNot = event.number_of_notifications;
	eventObject.lat = event.locations[0].lat;
	eventObject.lng = event.locations[0].lng;
	eventObject.eventID = event.event_id;
	
	eventsMap.push(eventObject);
	
	
	if(eventObject.subtype == "Coda"){
		if(event.locations.length != 1){
			var endUnformatted = event.locations.pop();
			var end = new google.maps.LatLng(endUnformatted.lat,endUnformatted.lng);
			var startUnformatted = event.locations.shift();
			var start = new google.maps.LatLng(startUnformatted.lat,startUnformatted.lng);
			
			var distanceSE = calcDistance(start, end);
			
			var waypointsArray = [];
			
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
			distRoute(start, end, null);
			
		}
	}

	searchMarker = new google.maps.Marker({
		position: new google.maps.LatLng(eventObject.lat, eventObject.lng),
		map: map,
		draggable: false,
		title: eventObject.eventID,
		animation: google.maps.Animation.DROP
	});
	
	searchMarker.id = eventObject.eventID;
	searchMarker.type = eventObject.type;	
	searchMarker.subtype = eventObject.subtype;	
	searchMarker.status = statusFormatted;				
	markersArray.push(searchMarker);
	
	var infoWindow = new google.maps.InfoWindow();			
	
	var onMarkerClick = function() {
		var marker = this;
		infoWindow.id = this.id;
		infoWindow.type = this.type;	
		infoWindow.subtype = this.subtype;	
		infoWindow.status = this.status;		
	  
		var latLng = marker.getPosition();
		console.log("pota");
		geocodePositionAjax(marker.getPosition(), infoWindow);
		//geocodePosition(marker.getPosition(), null, infoWindow);
		infoWindow.open(map, marker);
	};					

	google.maps.event.addListener(searchMarker, 'click', onMarkerClick);
	google.maps.event.addListener(map, 'click', function() { infoWindow.close(); });

	var latHtml = JSON.stringify(eventObject.lat).replace(/\./g,"");
	var lngHtml = JSON.stringify(eventObject.lng).replace(/\./g,"");
	var latlngHtml = (latHtml+lngHtml).replace(/""/g,"");

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
					
	$('#modalBody').append('<tr>\
						<td>'+eventObject.type+' > '+eventObject.subtype+'</td>\
						<td>'+eventObject.startTime+'</td>\
						<td id='+eventObject.eventID+'></td>\
						<td><div class="btn-group">\
							<a href="#" id="'+eventObject.eventID+'but" class="btn btn-inverse dropdown-toggle" data-toggle="dropdown">Show</a>\
							<ul class="dropdown-menu">'+descriptionHtml+'</ul>\
						</div></td>\
						<td>'+eventObject.numNot+' / '+eventObject.reliability+'</td>\
						<td>'+eventObject.status+'</td>\
						</tr>');
	var butID = "#"+eventObject.eventID+"but";			
	if(!fullArray)
		$(butID).addClass('disabled');

	geocodePosition(new google.maps.LatLng(eventObject.lat, eventObject.lng), eventObject.eventID);
}

$('#liveButton').click(function(){
    $(this).toggleClass('loading');
    if($(this).hasClass('loading')){
    	$(this).removeClass('btn-danger');
    	$(this).addClass('btn-success');
    	$('#timeToText').val('');
    	searchEvent();
     }      
     else {
      	$(this).removeClass('btn-success');
    	$(this).addClass('btn-danger');	
      }	
});

var dateStart = new Date();
dateStart.setMonth(dateStart.getMonth() - 6);

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


$('#timeToText').change(function(){
      	$('#liveButton').removeClass('btn-success loading');
    	$('#liveButton').addClass('btn-danger');
});


// parse a date in yyyy-mm-dd format
function parseDate(input) {
  var parts = input.split('/');
  return ""+parts[1]+"/"+parts[0]+"/"+parts[2];
}

function toTimestamp(strDate){
 var datum = Date.parse(strDate);
 return datum/1000;
}

function checkArray(my_arr){
   for(var i=0;i<my_arr.length;i++){
       if(my_arr[i] != "")   
          return true;
   }
   return false;
}


//AUTOCOMPLETE
var service = new google.maps.places.AutocompleteService();
var geocoder = new google.maps.Geocoder();
 
$('#searchAddress').typeahead({
  source: function(query, process) {
    service.getPlacePredictions({ input: query, types: ['geocode'], 
                                location: new google.maps.LatLng(44.494860,11.342598), radius: 5000 }, function(predictions, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        process($.map(predictions, function(prediction) {
        	//console.log(prediction.terms.slice(-1)[0].offset);
        	console.log($('li.open ul.typeahead').css('display'));
        	if( $('li.open ul.typeahead').css('display') == 'none'){
      			$('#searchAddress').parent().addClass("error");
      			$('#searchAddress').parent().addClass("error");
		   		$('#addressButtonSearch').addClass("btn-danger");
		    	$('#addressMarkerSearch').addClass("icon-white");
      		}
      		else{
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
    geocoder.geocode({ address: item }, function(results, status) {
      if (status != google.maps.GeocoderStatus.OK) {
      	$('#searchAddress').parent().addClass("error");
        errorAlert('Cannot find address');
        return;
      }
      	$('li.open ul.typeahead').parent().removeClass("error");
		$('#addressButtonSearch').removeClass("btn-danger");
		$('#addressMarkerSearch').removeClass("icon-white");
		
		if(!userMarker){
			userMarker = new google.maps.Marker({
					map: map,
					title: "SONO IO",
					animation: google.maps.Animation.DROP
			});
			$('#search').parent().removeClass('open');
		}
		
		userMarker.setPosition(results[0].geometry.location);
    	map.panTo(results[0].geometry.location);
		map.setCenter(results[0].geometry.location);
		geocodePosition(results[0].geometry.location, null);
    });
    return item;
  }
});

$('#notifyAddress').typeahead({
  source: function(query, process) {
    service.getPlacePredictions({ input: query, types: ['geocode'], 
                                location: new google.maps.LatLng(44.494860,11.342598), radius: 5000 }, function(predictions, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        process($.map(predictions, function(prediction) {
        	//console.log(prediction.terms.slice(-1)[0].offset);
        	if( $('li.open ul.typeahead').css('display') == 'none'){
      			$('#notifyAddress').parent().addClass("error");
      			$('#notifyAddress').parent().addClass("error");
		   		$('#addressButtonNotify').addClass("btn-danger");
		    	$('#addressMarkerNotify').addClass("icon-white");
      		}
      		else{
      			$('li.open ul.typeahead').parent().removeClass("error");
      			$('#addressButtonNotify').removeClass("btn-danger");
				$('#addressMarkerNotify').removeClass("icon-white");
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
    geocoder.geocode({ address: item }, function(results, status) {
      if (status != google.maps.GeocoderStatus.OK) {
      	$('#notifyAddress').parent().addClass("error");
        errorAlert('Cannot find address');
        return;
      }
      	$('li.open ul.typeahead').parent().removeClass("error");
		$('#addressButtonNotify').removeClass("btn-danger");
		$('#addressMarkerNotify').removeClass("icon-white");
		
		if(!userMarker)
			userMarker = new google.maps.Marker({
					map: map,
					title: "SONO IO",
					animation: google.maps.Animation.DROP
			});
	
		userMarker.setPosition(results[0].geometry.location);
    	map.panTo(results[0].geometry.location);
		map.setCenter(results[0].geometry.location);
		geocodePosition(results[0].geometry.location, null);
    });
    return item;
  }
});

function warningAlert(){
	$('#alertBox').html('<div class="alert fade in">\
		  <button type="button" class="close" data-dismiss="alert">&times;</button>\
		  <span id="alertMsg"><strong>Attenzione!</strong> Il sistema di monitoraggio traffico è delicato!<br>\
							Assicurati che nessuno abbia già fatto una segnalazione di Coda dove sei tu!<br>\
							Controlla inoltre di NON segnalare una coda se l\'hai già superata!!"</span>\
		  <p id="pota" style="padding-top: 20px"><button id="queueCheck" class="btn btn-warning" onclick="queueOk()">Notify</button> <button id="queueCancel" onclick="alertClose()" class="btn">Close</button></p>\
		  </div>');
		  $('#alertBox').fadeTo(500, 1);
}

function errorAlert(error){
	$('#alertBox').html('<div class="alert alert-error ">\
		  <button type="button" class="close"></button>\
		  <span id="alertMsg"><strong>Warning! '+error+'</strong></span></div>');
	$('#alertBox').fadeTo(500, 1).delay(1500).fadeTo(500, 0, function(){
		$('#alertBox').css('display', 'none');
		});
	
}

function successAlert(msg){
	$('#alertBox').html('<div class="alert alert-success ">\
		  <button type="button" class="close"></button>\
		  <span id="alertMsg"><strong>'+msg+'</strong></span></div>');
	$('#alertBox').fadeTo(500, 1).delay(1500).fadeTo(500, 0, function(){
		$('#alertBox').css('display', 'none');
		});
}

$("#account").next().delegate("#adminPanelButton", "click", function() {
	console.log("Aggiungo server");
	if($('#serverInput > option').length == 1){
		console.log("Aggiungo server");
		url = urlServer.concat("/servers"); 							
		$.ajax({
			url: url,
			type: 'GET',
			success: function(serverString, status){
				//console.log(serverString);
				for (var i in serverString)
				$('#serverInput').append('<option>'+ i + ": "+ serverString[i].name + " "+ serverString[i].url+'</option>');
			},
			error: function(err){
				console.log("Server string error");
			}
		});
	}
});
					
$('#serverConnect').on('click', function(){
	if ($('#serverInput').val().substring(0, 7) != "http://")
    	var urlServerHttp = "http://" + $('#serverInput').val();
    else
    	var urlServerHttp = $('#serverInput').val();


	 $('#adminAlert').html('<div class="alert alert-info span4">\
		  		<button type="button" class="close"></button>\
		  		<span id="alertMsg"><strong>E\' stato modificato il Server destinatario</strong></span></div>');
			$('#adminAlert').fadeTo(500, 1).delay(1500).fadeTo(500, 0, function(){
				$('#adminAlert').css('display', 'none');
	});
	
	urlCrossDomain = $("#serverInput").prop("selectedIndex")-1;
	$('#serverInput').attr('onfocus', '');
});

function getIcon(type, subtype){
	var dir = "sites/all/libraries/bootstrap/img/symbols/48/";
	switch (type){
		case"Problemi stradali" :
			switch(subtype){
				case "Incidente": return dir+"Strip-Club.png";
				case "Buca": return dir+"Strip-Club.png";
				case "Coda": return dir+"Strip-Club.png";
				case "Lavori in corso": return dir+"Strip-Club.png";
				case "Strada impraticabile": return dir+"Strip-Club.png";
			}
			break;
		
		case "Emergenze sanitarie" :
			switch(subtype){
				case "Incidente": return dir+"Strip-Club.png";
				case "Malore": return dir+"Strip-Club.png";
				case "Ferito": return dir+"Strip-Club.png";
				}
			break;
		
		case "Reati" :
			switch(subtype){
				case "Furto": return dir+"Strip-Club.png";
				case "Attentato": return dir+"Strip-Club.png";
			}
			break;
			
		case "Problemi ambientali" :
			switch(subtype){
				case "Incendio" : return dir+"Strip-Club.png";
				case "Tornado" : return dir+"Tornado.png";
				case "Neve" : return dir+"Snow.png";
				case "Alluvione" : return dir+"Rainy.png";
			}
			break;
		case "Eventi pubblici" :
			switch(subtype){
				case "Partita" : return dir+"Football.png";
				case "Manifestazione" : return dir+"Strip-Club.png";
				case "Concerto" : return dir+"Live-Music.png";
				}
			break;
		break;
		}
}		

function change(){
	var changeObj = new Object();
	changeObj.event_id = $('#eventIDModal').html();
	changeObj.lat = $('#coordModal').html().split(" , ")[0];
	changeObj.lng = $('#coordModal').html().split(" , ")[1];
	changeObj.description = $('#descModal').html();
	
	if($('input[name=optionsRadios]:checked').val())
		changeObj.status = $('input[name=optionsRadios]:checked').val();
	else
		changeObj.status = $('#statusModalValue').html();
	
	xmlhttp = new XMLHttpRequest();
    url = urlServer.concat("/notifica");	
	
	$.ajax({
            url: url,
            type: 'POST',
            data: changeObj,
            contentType: "application/json; charset=utf-8",
            success: function(datiString, status, richiesta) {
            	successAlert("Modifica segnalata con successo"); 
            	$('#notifyPanel').modal('toggle');
            },
            error: function(err) {
                errorAlert("Errore nella modifica dell'evento");
                $('#notifyPanel').modal('toggle');
            }  	
       });
}
