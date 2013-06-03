// Enable the visual refresh
google.maps.visualRefresh = true;

var map;
function initialize() {
  var mapOptions = {
    zoom: 15,
    center: new google.maps.LatLng(44.495281,11.349735),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById('map_canvas'),
      mapOptions);

	
}

google.maps.event.addDomListener(window, 'load', initialize);


