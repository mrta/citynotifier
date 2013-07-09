// Global variables
var userMarker;
var lastLatitude = CITYCENTER.lat();
var lastLongitude = CITYCENTER.lng();


/**
* Returns the user's location
*/
function getLocation() {
    if (navigator.geolocation) {
        var options = {timeout: 5000}; // milliseconds (60 seconds)
        navigator.geolocation.getCurrentPosition(showLocation, errorHandler, options);
    } else {
        console.log("error")
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

    // Move userMarker if exists
    if (userMarker){
        map.panTo(markerPosition);
        userMarker.setPosition(markerPosition);
    }
    else
        // Drop userMarker on map if it doesn't exist
        createUserMarker(markerPosition);  
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
        createUserMarker(new google.maps.LatLng(44.494860,11.342598));
    }
    else{ 
        errorAlert("GeocodePosition unknown error");
        if(err.code == 3)
            getLocation();
    }
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