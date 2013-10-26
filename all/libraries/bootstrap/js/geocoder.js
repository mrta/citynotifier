// Geocoder Google Service
var geocoder = new google.maps.Geocoder();

// Global variables
var lastAddress; // Keep last address geocoded 

/**
* Get address from coordinates
* @param latlng point
* ASYNCHRONOUS
*/
function geocodePosition(position){
	geocoder.geocode({'latLng': position}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) { 
				// SUCCESS: get the first matching address and format it properly
				var address = results && results[1] ? results[0].address_components[1].long_name + ", " + results[0].address_components[0].long_name: position,
				lastAddress = results[0].address_components;
				
				if(address == position)
					geocodePosition(position); //Retry if Geocoder fails
				else{
					updateAddress(address);
    				if(startUp) startUpSearch(); // Search on startUp
				}
		}
		else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {    
		    setTimeout(function() {
		        geocodePosition(position);
		    }, 200);
        }
		else {
		  console.log('Geocoder failed due to: ' + status);
		}
	});
}