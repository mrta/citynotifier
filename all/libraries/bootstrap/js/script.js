var firstTime = 0;

var urlCrossDomain = -1;

var eventsMap = [];

$('.brand').on('click', function(){
	console.log(jQuery.cookie());
	errorAlert("Pota");
	heatMapArray = [];
	for(var i=0; i<heatmapArray.length;i++)
		heatmapArray[i].setMap(heatmapArray[i].getMap() ? null : map);
	heatmapArray = [];
	
	geocodePosition(new google.maps.LatLng(44.507188428208536, 11.342839968261728), null);

	if (typeof jQuery != 'undefined') {  
    // jQuery is loaded => print the version
    alert(jQuery.fn.jquery);
}
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
     
     $('#notifyTipe').html('<option disabled selected>Select type</option>\
                                            <option>Problemi stradali</option>\
                                            <option>Emergenze sanitarie</option>\
                                            <option>Reati</option>\
                                            <option>Problemi ambientali</option>\
                                            <option>Eventi pubblici</option>');
	$('#notifySubType').html('<option disabled selected>Select subtype</option>');
});

function alertClose(){
	$(".alert").alert('close');
};

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

function getPin(type, subtype){
    var dir = "sites/all/libraries/bootstrap/img/pins/";
    switch (type){
        case"Problemi stradali" :
            switch(subtype){
                case "Incidente": return dir+"car_accident.png";
                case "Buca": return dir+"buca.png";
                case "Coda": return dir+"coda.png";
                case "Lavori in corso": return dir+"lavoriincorso.png";
                case "Strada impraticabile": return dir+"stradanonpercorribile.png";
            }
            break;
        
        case "Emergenze sanitarie" :
            switch(subtype){
                case "Incidente": return dir+"incidente.png";
                case "Malore": return dir+"malore.png";
                case "Ferito": return dir+"ferito.png";
                }
            break;
        
        case "Reati" :
            switch(subtype){
                case "Furto": return dir+"thief.png";
                case "Attentato": return dir+"shooting.png";
            }
            break;
            
        case "Problemi ambientali" :
            switch(subtype){
                case "Incendio" : return dir+"fire.png";
                case "Tornado" : return dir+"tornado.png";
                case "Neve" : return dir+"snow.png";
                case "Alluvione" : return dir+"rain.png";
            }
            break;
        case "Eventi pubblici" :
            switch(subtype){
                case "Partita" : return dir+"football.png";
                case "Manifestazione" : return dir+"manifestazione.png";
                case "Concerto" : return dir+"livemusic.png";
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
	changeObj.type = $('#typeModal').html();
	changeObj.subtype = $('#subtypeModal').html();

	
	if($('input[name=optionsRadios]:checked').val())
		changeObj.status = $('input[name=optionsRadios]:checked').val();
	else
		changeObj.status = $('#statusModalValue').html();
	
	xmlhttp = new XMLHttpRequest();
    url = URLSERVER.concat("/notifica");	
	
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
