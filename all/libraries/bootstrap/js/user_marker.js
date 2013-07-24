// Global variables
var userMarker;
var lastLatitude = CITYCENTER.lat();
var lastLongitude = CITYCENTER.lng();


/**
* Returns the user's location
*/
function getLocation() {
    if (navigator.geolocation) {
        var options = {timeout: 2000}; // milliseconds
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

    // Move userMarker if exists
    if (userMarker){
        map.panTo(markerPosition);
        userMarker.setPosition(markerPosition);

        // Update current address and display where needed
        geocodePosition(markerPosition);

        // Keep track of the user's last location
        lastLatitude = markerPosition.lat();
        lastLongitude = markerPosition.lng();
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
    // Browser doesn't support geolocation
    if (err.code == 1 || err.code == 2) {
        errorAlert("Posizione non disponibile!");
        
        // Try to get last known position
        if(jQuery.cookie('last_lat'))
            var markerPosition = new google.maps.LatLng(jQuery.cookie('last_lat'), jQuery.cookie('last_lng'));
        
        // Otherwise put the marker on the city center
        else
            var markerPosition = CITYCENTER;

        // Drop userMarker on map
        createUserMarker(markerPosition);
    }
    else{ 
        // GeoPosition could fail : http://stackoverflow.com/questions/3397585/navigator-geolocation-getcurrentposition-sometimes-works-sometimes-doesnt
        errorAlert("GeocodePosition momentaneamente non disponibile");

        // Set userMarker to default location
        var markerPosition = CITYCENTER;
        map.panTo(markerPosition);
        if(userMarker){
            userMarker.setPosition(markerPosition);

            // Update current address and display where needed
            geocodePosition(markerPosition);

            // Keep track of the user's last location
            lastLatitude = markerPosition.lat();
            lastLongitude = markerPosition.lng();
        }
        else
            createUserMarker(markerPosition);
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

    if(radiusWidgetCheck){
        // Create new distanceWidget
        distanceWidget = new DistanceWidget(map);
    }


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

    // Keep track of the user's last location
    lastLatitude = lat;
    lastLongitude = lng;

    // Move the userMarker
    var markerPosition = new google.maps.LatLng(lat, lng)

    // Update current address and display where needed
    geocodePosition(markerPosition);

    // Pan the map to the user's location
    map.panTo(markerPosition);
}