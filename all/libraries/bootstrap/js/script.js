$("#account").next().delegate("#login", "click", function(){
	loginFunction();
});
     
$("#account").next().delegate('#pass', 'keypress', function(e) {
	if (e.which === 13) {
		loginFunction();
	}
});
     
function loginFunction(){
    xmlhttp = new XMLHttpRequest();
    domain = "http://";
    url =  domain.concat(document.location.hostname, "/login");
   
    var loginObj = new Object();
    loginObj.username = $('#user').val();
    loginObj.password = $('#pass').val();

    var userError = $('<span id="user_span" class="help-inline">User incorrect</span>');
    var passError = $('<span id="pass_span" class="help-inline">Password incorrect</span>');

    var loginJSON = JSON.stringify(loginObj);
    console.log(loginJSON);

    if((loginObj.username) && (loginObj.password)){
        $.ajax({
                url: url,
                type: 'POST',
                data: loginJSON,
                contentType: "application/json; charset=utf-8",
                success: function(datiString, status, richiesta){
		            $('#account').fadeOut(1000, function(){
		                    $('#account').html((loginObj.username)[0].toUpperCase() + (loginObj.username).slice(1) + ' <i class="icon-user icon-white"></i>');
		                    $('#account').fadeIn(1000);
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
    else if(!(loginObj.username) && $("#user").is(':last-child')){
        $('#user').parent().addClass("error");
        $('#user').after(userError);
    }
    else if(!(loginObj.password) && $("#pass").is(':last-child')){
        $('#pass').parent().addClass("error");
        $('#pass').after(passError);
    }

    $('#user').on("keypress", function(){
        $('#user').parent().removeClass("error");
        $('#user_span').fadeOut();
        $('#user_span').remove();
    });
    $('#pass').on("keypress", function(){
        $('#pass').parent().removeClass("error");
        $('#pass_span').fadeOut();
        $('#pass_span').remove();
    });
}
     
$("#account").next().delegate("#logout", "click", function(){
	xmlhttp = new XMLHttpRequest();
	url = 'http://ltw1306.web.cs.unibo.it/logout';

	$('#account').fadeOut(1000, function(){
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
		success: function(datiString, status, richiesta){},
		error: function(err) {}
	});
});
     
$("#notifyType").on('click', function(){
	var conceptName = $('#notifyType').find(":selected").text();
	if(conceptName != "Select Type"){
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
     
$("#notify").next().delegate("#notifySubmit", "click", function(){ 
	sendNotify(); 
});
     
function sendNotify(){
	xmlhttp = new XMLHttpRequest();
	domain = "http://";
	url =  domain.concat(document.location.hostname, "/segnalazione");


	var notifyType = new Object();
	notifyType.type = ($('#notifyType').find(":selected").text()).toLowerCase().replace(/ /g,"_");
	notifyType.subtype = ($('#notifySubType').find(":selected").text()).toLowerCase().replace(/ /g,"_");

	var notifyObj = new Object();
	notifyObj.type = notifyType;
	notifyObj.lat = latitude;
	notifyObj.lng = longitude;
	notifyObj.description = $('#notifyDesc').val();

	/*var typeError = $('<span id="type_span" class="help-inline">Select a type</span>');
	var subTypeError = $('<span id="sybtype_span" class="help-inline">Select a subtype</span>');*/
	var addressError = $('<span id="address_span">Select an address on map</span>');

	var notifyJSON = JSON.stringify(notifyObj);
	console.log(notifyType.type);

	if( (notifyType.type != "select_type") && (notifyType.subtype != "select_subtype") && $('#notifyAddress').val() ){
        $.ajax({
            url: url,
            type: 'POST',
            data: notifyJSON,
            contentType: "application/json; charset=utf-8",
            success: function(datiString, status, richiesta){
            	$('#notify').parent().removeClass('open');
            	alert("Notifica Inviata!");
            },
            error: function(err) {
                    alert("Ajax Notify error");
            }
          });                  
	}
	if( (notifyType.type == "select_type") ){    
	    $('#notifyType').parent().addClass("error");
	}
	else
	if( (notifyType.subtype == "select_subtype") && (!$('#notifySubType').attr('disabled')) ){
	    $('#notifySubType').parent().addClass("error");
	}
	if( !$('#notifyAddress').val() && $('#notifyAddress').next().is('button')){
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
	$('#notifyAddress').on("keypress", function(){
	    $('#notifyAddress').parent().removeClass("error");
	});
}


function showLocation(position) {
  var latitude = position.coords.latitude;
  var longitude = position.coords.longitude;
  
  if(userMarker) userMarker.setMap(null);
  userMarker = new google.maps.Marker({
			position: new google.maps.LatLng(latitude, longitude),
			map: map,
			draggable: true,
			title: "SONO QUI!",
			animation: google.maps.Animation.DROP
		});
	map.panTo(new google.maps.LatLng(latitude, longitude));
	geocodePosition(new google.maps.LatLng(latitude, longitude));
}

function errorHandler(err) {
  if(err.code == 1) {
    alert("Error: Access is denied!");
  }else if( err.code == 2) {
    alert("Error: Position is unavailable!");
  }
}
function getLocation(){

   if(navigator.geolocation){
      // timeout at 60000 milliseconds (60 seconds)
      var options = {timeout:60000};
      navigator.geolocation.getCurrentPosition(showLocation, 
                                               errorHandler,
                                               options);
   }else{
      alert("Sorry, browser does not support geolocation!");
   }
}
