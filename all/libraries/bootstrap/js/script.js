var firstTime = 0;

$('.brand').on('click', function(){
	console.log(jQuery.cookie());
});

$(window).unload(function() {
	if(jQuery.cookie('session_user')){
		jQuery.cookie('last_type', $('#searchType').val());
		jQuery.cookie('last_subtype', $('#searchSubType').val());
		jQuery.cookie('last_address', $('#searchAddress').val());
		jQuery.cookie('last_radius', $('#searchRadius').val());
		jQuery.cookie('last_status', $('#searchStatus').val());
		jQuery.cookie('last_timeFrom', $('#timeFromText').val());
		jQuery.cookie('last_timeTo', $('#timeToText').val());
	
		jQuery.cookie('last_lat', latitude);
		jQuery.cookie('last_lng', longitude);
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
    domain = "http://";
    url = domain.concat(document.location.hostname, "/login");

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
            	//success code
       			var session_id = datiString.session_id;
        		var session_name = datiString.session_name;   
        		var session_user = datiString.username;   
        		console.log("Creo la sessione di nome "+session_name+" con id "+session_id);
        		
        		jQuery.cookie('session_name', session_name);
        		jQuery.cookie('session_id', session_id);
        		jQuery.cookie('session_user', session_user);
        		
        		
            	 
            
                $('#account').fadeOut(1000, function() {
                    $('#account').html((loginObj.username)[0].toUpperCase() + (loginObj.username).slice(1) + ' <i class="icon-user icon-white"></i>');
                    $('#account').fadeIn(1000);
                    $('#notify').css('visibility','visible').hide().fadeIn(1000);
                });

                $('#account').next().empty();
                $('#account').next().html('<div id="logout-form"><button id="logout" type="button" class="btn btn-danger input-block-level">Logout</button></div>');
                $('#account').parent().removeClass('open');
            },
            error: function(err) {
                alert("Utente non registrato");
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
    domain = "http://";
    url = domain.concat(document.location.hostname, "/logout");

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
        	
        	jQuery.removeCookie('last_type');
			jQuery.removeCookie('last_subtype');
			jQuery.removeCookie('last_address');
			jQuery.removeCookie('last_radius');
			jQuery.removeCookie('last_status');
			jQuery.removeCookie('last_timeFrom');
			jQuery.removeCookie('last_timeTo');
	
			jQuery.removeCookie('last_lat');
			jQuery.removeCookie('last_lng');
        	
        	$('#notify').fadeOut(1000);
        },
        error: function(err) {
        }
    });
});


$("#notifyType").on('click', function() {
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

$("#searchType").on('click', function() {
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



function sendNotify() {
    xmlhttp = new XMLHttpRequest();
    domain = "http://";
    url = domain.concat(document.location.hostname, "/segnalazione");


    var notifyType = new Object();
    notifyType.type = ($('#notifyType').find(":selected").text()).toLowerCase().replace(/ /g, "_");
    notifyType.subtype = ($('#notifySubType').find(":selected").text()).toLowerCase().replace(/ /g, "_");

    var notifyObj = new Object();
    notifyObj.type = notifyType;
    notifyObj.lat = latitude;
    notifyObj.lng = longitude;
    notifyObj.description = $('#notifyDescription').val();

    /*var typeError = $('<span id="type_span" class="help-inline">Select a type</span>');
     var subTypeError = $('<span id="sybtype_span" class="help-inline">Select a subtype</span>');*/
    var addressError = $('<span id="address_span">Select an address on map</span>');

    var notifyJSON = JSON.stringify(notifyObj);
    console.log(notifyType.type);

    if ((notifyType.type != "select_type") && (notifyType.subtype != "select_subtype") && $('#notifyAddress').val()) {
        $.ajax({
            url: url,
            type: 'POST',
            data: notifyJSON,
            contentType: "application/json; charset=utf-8",
            success: function(datiString, status, richiesta) {
                $('#notify').parent().removeClass('open');
                alert("Notifica Inviata!");
            },
            error: function(err) {
                alert("Ajax Notify error");
            }
        });
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
        $('#addressMarker').addClass("icon-white");
        $('#notifyAddress').next().after(addressError); //NON VA!!!!!!!!!!!!!!!!!
    }

    $("#notifyType").on("change", function() {
        $('#notifyType').parent().removeClass("error");
    });
    $("#notifySubType").on("change", function() {
        $('#notifySubType').parent().removeClass("error");
    });
    $('#notifyAddress').on("keypress", function() {
        $('#notifyAddress').parent().removeClass("error");
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
        alert("Sorry, browser does not support geolocation!");
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
    map.panTo(new google.maps.LatLng(latitude, longitude));
    geocodePosition(new google.maps.LatLng(latitude, longitude));
    $('#notify').parent().removeClass('open');
    //$('#search').parent().removeClass('open');
    
    google.maps.event.addListener(userMarker, 'dragend', updateMarker);
}

function errorHandler(err) {	
    if (userMarker)
        userMarker.setMap(null);
    radiusWidgetCheck = false;
    
    if (err.code == 1 || err.code == 2) {
        alert("Error: Position is not available!");
    	
    if(jQuery.cookie('last_lat') && !firstTime){
    	firstTime = 1;
    	geocodePosition(new google.maps.LatLng(jQuery.cookie('last_lat'), jQuery.cookie('last_lng')));
    	var mPosition = new google.maps.LatLng(jQuery.cookie('last_lat'), jQuery.cookie('last_lng'));
    }
    else{
    	geocodePosition(new google.maps.LatLng(44.494860, 11.342598));
    	var mPosition = new google.maps.LatLng(44.494860,11.342598);
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
    domain = "http://";
    var parameters = new Array();
    parameters["scope"] = "remote";
    parameters["type"] = ($('#searchType').find(":selected").text()).toLowerCase().replace(/ /g, "_");
    
    var subtypeSelected = ($('#searchSubType').find(":selected").text()).toLowerCase().replace(/ /g, "_");
    if(subtypeSelected == "select_subtype")
    	parameters["subtype"] = "all";
    else
    	parameters["subtype"] = subtypeSelected;
    	
    parameters["lat"] = latitude;
    parameters["lng"] = longitude;
    parameters["radius"] = radiusWidget.get('distance');
    
    
    var timeMin = toTimestamp(parseDate($("#timeFromText").val().replace(/\-/g,'/')));
    if(isNaN(timeMin))
    	timeMin = toTimestamp(dateStart);
    parameters["timemin"] = timeMin;
    
    var timeMax = toTimestamp(parseDate($("#timeToText").val().replace(/\-/g,'/')));
    if(isNaN(timeMax))
    	timeMax = toTimestamp(today);
    parameters["timemax"] = timeMax;
    
    parameters["status"] = "open";
	
	console.log("scope="+parameters["scope"]+"&type="+parameters["type"]+"&subtype="+parameters["subtype"]+"&lat="+parameters["lat"]+"&lng="+parameters["lng"]+"&radius="+parameters["radius"]+"&timemin="+parameters["timemin"]+"&timemax="+parameters["timemax"]+"&status="+parameters["status"]);
    url = domain.concat(document.location.hostname, buildUrl("/richieste", parameters));

    $.ajax({
        url: url,
        type: 'GET',
        success: function(datiString, status, richiesta) {
            $('#search').parent().removeClass('open');
            alert("Ricerca Inviata..ecco i risultati!");
            $('tbody').html('');
            clearOverlays();
            for (var i in datiString.events) {
				var type = datiString.events[i].type.type.charAt(0).toUpperCase() + datiString.events[i].type.type.slice(1).replace("_"," ");
				var subtype = datiString.events[i].type.subtype.charAt(0).toUpperCase() + datiString.events[i].type.subtype.slice(1);
				var description = datiString.events[i].description
					
				var date = new Date(datiString.events[i].start_time*1000);
					var day = date.getDate();
					var month = date.getMonth();
					var year = date.getFullYear();
					var hours = date.getHours();
					var minutes = date.getMinutes();
					var seconds = date.getSeconds();
					var startTime = day+'/'+month+'/'+year+'\t'+ hours + ':' + minutes + ':' + seconds;
					
				var freshness = datiString.events[i].freshness;
				
				var status = datiString.events[i].status
				status = status.charAt(0).toUpperCase() + status.slice(1);
				switch (status) {
					case "Open":
						status = '<button class="btn btn-success">'+status;
						break;
					case "Closed":
						status = '<button class="btn btn-danger">'+status;
						break;
					case "Skeptical":
						status = '<button class="btn btn-warning">'+status;
						break;	
				}
				
				var reliability = datiString.events[i].reliability;
				var numNot = datiString.events[i].number_of_notifications;
				var lat = datiString.events[i].locations[0].lat;
				var lng = datiString.events[i].locations[0].lng;
			
				searchMarker = new google.maps.Marker({
				position: new google.maps.LatLng(datiString.events[i].locations[0].lat,datiString.events[i].locations[0].lng),
				map: map,
				draggable: false,
				title: datiString.events[i].event_id,
				animation: google.maps.Animation.DROP
				});
				markersArray.push(searchMarker);
			
				var latHtml = JSON.stringify(lat).replace(/\./g,"");
				var lngHtml = JSON.stringify(lng).replace(/\./g,"");
				
				var descriptionHtml = "";
				for ( j in description){
					if(description[j]){
						description[j] = description[j].charAt(0).toUpperCase() + description[j].slice(1);
						descriptionHtml = descriptionHtml.concat('<li><p>'+description[j]+'</p></li>');
						}
				}
				
				
				$('tbody').append('<tr>\
									<td>'+type+' > '+subtype+'</td>\
									<td>'+startTime+'</td>\
									<td id='+latHtml+''+lngHtml+'></td>\
									<td><div class="btn-group">\
										<a href="#" class="btn btn-inverse dropdown-toggle" data-toggle="dropdown">Show</a>\
										<ul class="dropdown-menu">'+descriptionHtml+'</ul>\
									</div></td>\
									<td>'+numNot+' / '+reliability+'</td>\
									<td>'+status+'</td>\
									</tr>');
									
				geocodePosition(new google.maps.LatLng(lat, lng));
			
			}

 		},
        error: function(err) {
            alert("Ajax Notify error");
        }
    });
}

$('#liveButton').click(function(){
    $(this).toggleClass('loading');
    if($(this).hasClass('loading')){
    	$(this).removeClass('btn-danger');
    	$(this).addClass('btn-success');
    	$('#timeToText').val('');
     }      
     else {
      	$(this).removeClass('btn-success');
    	$(this).addClass('btn-danger');	
      }	
});

var dateStart = new Date();
var today = new Date();
dateStart.setMonth(dateStart.getMonth() - 6);
var todayUpdated = new Date(today.getTime() - 5*60000);

$('#datetimepickerFrom').datetimepicker({
	format: 'dd-mm-yyyy hh:ii',
	pickerPosition: 'bottom-left',
	startDate: dateStart,
	endDate: todayUpdated,
	autoclose: true,
	todayBtn: true,
	todayHighlight: true,
	initialDate: dateStart
});

$('#datetimepickerTo').datetimepicker({
	format: 'dd-mm-yyyy hh:ii',
	pickerPosition: 'bottom-left',
	startDate: dateStart,
	endDate: today,
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


