// Enable new Google Maps
google.maps.visualRefresh = true;

// Global variables
var map;
var directionsService;
var directionsDisplay;

 /**
 * Google Map initialization
 */
function initialize() {

    var mapOptions = {
        disableDoubleClickZoom: true,
        zoom: 15,
        center: CITYCENTER,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
    
    // Load Directions Service to draw routes on map
    directionsService = new google.maps.DirectionsService();
	var rendererOptions = { draggable: true, map: map };
	directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
    directionsDisplay.setMap(map);

    // Click Listener on map
    google.maps.event.addListener(map, 'click', function(event) {

        // Keep track of the user's last location
        lastLatitude = event.latLng.lat();
        lastLongitude = event.latLng.lng();

         // Create new markerPosition
        var markerPosition = new google.maps.LatLng(lastLatitude, lastLongitude);

        // Do not display radiusWidget
        if (distanceWidget) radiusWidget = null;
        radiusWidgetCheck = false;

        // Drop userMarker on map
        createUserMarker(markerPosition);               
                                                    //$('#searchRadius').val(Math.round(distanceDefault * 1000) / 1000 + " km");
                                                    //$('#searchRadius').val(($('#searchRadius').val().replace('.',',')));
    });
}

// Only load the map when the window is ready
$(window).load(function () {
    initialize();
    getLocation();
});



