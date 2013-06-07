// Enable the visual refresh
google.maps.visualRefresh = true;

var map;
var userMarker;

function initialize() {
	var mapOptions = {
		zoom: 15,
		center: new google.maps.LatLng(44.495281,11.349735),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);


	google.maps.event.addListener(map, 'click', function(event) {
		var lat=event.latLng.lat();
		var lng=event.latLng.lng();

		if(userMarker) userMarker.setMap(null);

		userMarker = new google.maps.Marker({
			position: new google.maps.LatLng(lat, lng),
			map: map,
			draggable: true,
			title: "Appaio se rimango sopra col mouse",
			animation: google.maps.Animation.DROP
		});

		geocodePosition(new google.maps.LatLng(lat, lng));

	});  
}

var geocoder = new google.maps.Geocoder();
var latitude;
var longitude;

function geocodePosition(position) {
	geocoder.geocode({ latLng: position }, function(matchingAddresses, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (matchingAddresses && matchingAddresses.length > 0){
				latitude = matchingAddresses[0].geometry.location.lat();
				longitude = matchingAddresses[0].geometry.location.lng();
				$('#notifyAddress').val(matchingAddresses[0].address_components[1].long_name + ", " + matchingAddresses[0].address_components[0].long_name);
				$('#notifyAddress').parent().removeClass("error");
				$('#notifyAddress').next().removeClass("btn-danger");
				$('#addressMarker').removeClass("icon-white");
			}
			else
				alert('Cannot determine address at this location.');
		}
		else
			alert("Geocoder failed due to: " + status);
	});
}

google.maps.event.addDomListener(window, 'load', initialize);
