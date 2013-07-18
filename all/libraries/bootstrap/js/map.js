// Enable new Google Maps
google.maps.visualRefresh = NEW_GOOGLE_MAP;

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

    // Get user Location
    getLocation();

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
        console.log("Pota");           
    });
}

// Only load the map when the window is ready
$(window).load(function () {
    initialize();
});

$(window).unload(function() {
    // Create cookies
    if(jQuery.cookie('session_user')){
        jQuery.cookie('last_type', $('#searchType').val(), { path: '/', expires: 30 });
        jQuery.cookie('last_subtype', $('#searchSubType').val(), { path: '/', expires: 30 });
        jQuery.cookie('last_address', $('#searchAddress').val(), { path: '/', expires: 30 });
        jQuery.cookie('last_radius', $('#searchRadius').val(), { path: '/', expires: 30 });
        jQuery.cookie('last_status', $('#searchStatus').val(), { path: '/', expires: 30 });
        jQuery.cookie('last_timeFrom', $('#timeFromText').val(), { path: '/', expires: 30 });
        jQuery.cookie('last_timeTo', $('#timeToText').val(), { path: '/', expires: 30 });
    
        // Save last location clicked
        if(userMarker){
            jQuery.cookie('last_lat', userMarker.getPosition().lat(), { path: '/', expires: 30 });
            jQuery.cookie('last_lng', userMarker.getPosition().lng(), { path: '/', expires: 30 });
        }     
    }
});


