// Global variables
var userMarker;
var lastLongitude;
var lastLatitude;

/**
* Returns the user's location
*/
function getLocation() {
                                                                        //$('#search').parent().removeClass('open');
                                                                        //$('#notify').parent().removeClass('open');
    if (navigator.geolocation) {
        var options = {timeout: 60000}; // milliseconds (60 seconds)
        navigator.geolocation.getCurrentPosition(showLocation, errorHandler, options);
    } else {
        errorAlert("Sorry, browser does not support geolocation!");
    }
}

/**
* Displays the user's location with a marker
* @param user's position (latlng)
*/
function showLocation(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var markerPosition = new google.maps.LatLng(latitude, longitude);

    // Do not duplicate userMarker & turn off radiusWidget
    if (userMarker) userMarker.setMap(null);
    radiusWidgetCheck = false;

    // Drop userMarker on map
    createUserMarker(markerPosition);
                                                        //$('#notify').parent().removeClass('open');
                                                        //$('#search').parent().removeClass('open');    
}

/**
* getLocation error handling
* @param error
*/
function errorHandler(err) {    

    // Do not duplicate userMarker & turn off radiusWidget
    if (userMarker) userMarker.setMap(null);
    radiusWidgetCheck = false;
    
    // Browser doesn't support geolocation
    if (err.code == 1 || err.code == 2) {
        errorAlert("Position is not available!");
        
        // Try to get last known position
        if(jQuery.cookie('last_lat'))
            var markerPosition = new google.maps.LatLng(jQuery.cookie('last_lat'), jQuery.cookie('last_lng'));      
        
        // Otherwise put the marker on the city center
        else
            var markerPosition = CITYCENTER;

        // Drop userMarker on map
        createUserMarker(markerPosition);
    }
    else errorAlert("GeocodePosition unknown error"); 
}

/**
* Create and show userMarker on the map
* @param user's position (latlng)
*/
function createUserMarker(markerPosition){
    // Clear previous userMarker
    if (userMarker) userMarker.setMap(null);

    // Update current address and display where needed
    geocodePosition(markerPosition);

    // Pan the map to the user's location
    map.panTo(markerPosition);

    // Keep track of the user's last location
    lastLatitude = markerPosition.lat();
    lastLongitude = markerPosition.lng();

    userMarker = new google.maps.Marker({
        position: markerPosition,
        map: map,
        draggable: true,
        title: "You're here",
        animation: google.maps.Animation.DROP
    });   

    // userMarker drag listener
    google.maps.event.addListener(userMarker, 'dragend', updateMarker);
}

/**
* Update userMarker info and position on drag
* @param New userMarker position
*/
function updateMarker(event){

    // Get the position where the drag ended
    var lat = event.latLng.lat();
    var lng = event.latLng.lng();

    // Move the userMarker
    var markerPosition = new google.maps.LatLng(lat, lng)

    // Update current address and display where needed
    geocodePosition(markerPosition);

    // Pan the map to the user's location
    map.panTo(markerPosition);
}