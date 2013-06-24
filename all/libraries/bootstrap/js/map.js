// Enable the visual refresh
google.maps.visualRefresh = true;

var map;
var userMarker; var sizer;
var distanceWidget;
var radiusWidget;
var radiusWidgetCheck = false;
var distanceDefault = 2;

var markersArray = [];
var addressArray = [];

function clearOverlays() {
  for (var i = 0; i < markersArray.length; i++ ) {
    markersArray[i].setMap(null);
  }
  markersArray = [];
}


function initialize() {
    var mapOptions = {
        disableDoubleClickZoom: true,
        zoom: 15,
        center: new google.maps.LatLng(44.494860,11.342598),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
    getLocation();


    google.maps.event.addListener(map, 'click', function(event) {
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        
        console.log(lat+" "+lng);
        

        if (userMarker)
            userMarker.setMap(null);
        if (distanceWidget)
            radiusWidget = null;
            
        $('#searchRadius').val(Math.round(distanceDefault * 1000) / 1000 + " km");
        $('#searchRadius').val(($('#searchRadius').val().replace('.',',')));

        userMarker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lng),
            map: map,
            draggable: true,
            title: "Appaio se rimango sopra col mouse",
            animation: google.maps.Animation.DROP
        });
        
        radiusWidgetCheck = false;

        google.maps.event.addListener(userMarker, 'dragend', updateMarker);
        
        var point = userMarker.getPosition();
        console.log("point giusto: "+point);

        geocodePosition(new google.maps.LatLng(lat, lng), null);	
    });
}

function updateMarker(event){
	var lat = event.latLng.lat();
	var lng = event.latLng.lng();
	geocodePosition(new google.maps.LatLng(lat, lng), null);
	var point = userMarker.getPosition();
	map.panTo(point);
}


$('#search').on('click', function() {
    	
    if (!(radiusWidgetCheck) && userMarker){
        distanceWidget = new DistanceWidget(map);
        radiusWidgetCheck = true;
    }
        
    google.maps.event.addListener(distanceWidget, 'distance_changed', function() {
    	if(radiusWidget.get('distance') != 0)
    		distanceDefault = radiusWidget.get('distance');
        $('#searchRadius').val(Math.round(distanceDefault * 1000) / 1000 + " km");
        $('#searchRadius').val(($('#searchRadius').val().replace('.',',')));
    });

    google.maps.event.addListener(distanceWidget, 'position_changed', function() {
        displayInfo(distanceWidget);
    });
});

$('#refresh').on('click', function() {
	if(userMarker){	
    	userMarker.setMap(null);
    	userMarker = null;
    }
	clearOverlays();
    radiusWidgetCheck = false;
});

$('#notify').on('click', function() {
    if(radiusWidget)
    	radiusWidget.set('distance', 0);
    if(sizer){
    	sizer.unbind('map');
    	sizer.unbind('position');
    	sizer.setMap(null);
    }
    radiusWidgetCheck = false;
});



var geocoder = new google.maps.Geocoder();
var latitude;
var longitude;


function geocodePosition(position, eventID){
	$(this).gmap3({
		getaddress:{
			latLng: position,
			callback:function(results){
				var map = $(this).gmap3("get"),
				infowindow = $(this).gmap3({get:"infowindow"}),
				content = results && results[1] ? results[0].address_components[1].long_name + ", " + results[0].address_components[0].long_name: position;
				if(content == position)
					geocodePosition(position, eventID); //Riprova
				
				if(eventID)
					$('#'+eventID).html(content);
				else{
					$('#notifyAddress').val(content);
		            $('#searchAddress').val(content);
		            $('#infoAddress').html(content);
		            $('#notifyAddress').parent().removeClass("error");
		            $('#notifyAddress').next().removeClass("btn-danger");
		            $('#addressMarkerSearch').removeClass("icon-white");
		            $('#addressButtonSearch').removeClass("btn-danger");
					$('#addressMarkerSearch').removeClass("icon-white");
					$('#addressButtonNotify').removeClass("btn-danger");
					$('#addressMarkerNotify').removeClass("icon-white");
                }
                
               
                	
				/*if (infowindow){
					infowindow.open(map, marker);
					infowindow.setContent(content);
				} else {
					$(this).gmap3({
					infowindow:{
						anchor:marker, 
						options:{content: content}
						}
					});
				}*/
			}
		}
	});
}


/*geocoder.geocode({latLng: position}, function(matchingAddresses, status) {
    if (status == google.maps.GeocoderStatus.OK) {
        if (matchingAddresses && matchingAddresses.length > 0) {
            latitude = matchingAddresses[0].geometry.location.lat();
            longitude = matchingAddresses[0].geometry.location.lng();
            $('#notifyAddress').val(matchingAddresses[0].address_components[1].long_name + ", " + matchingAddresses[0].address_components[0].long_name);
            $('#searchAddress').val(matchingAddresses[0].address_components[1].long_name + ", " + matchingAddresses[0].address_components[0].long_name);
            $('#infoAddress').html(matchingAddresses[0].address_components[1].long_name + ", " + matchingAddresses[0].address_components[0].long_name);
            $('#notifyAddress').parent().removeClass("error");
            $('#notifyAddress').next().removeClass("btn-danger");
            $('#addressMarker').removeClass("icon-white");
            
            $latlng = ((position.jb)+''+Math.round(position.kb * 1000000) / 1000000).replace(/\./g,"");
            $('#'+$latlng).html(matchingAddresses[0].address_components[1].long_name + ", " + matchingAddresses[0].address_components[0].long_name);
        }
        else
            alert('Cannot determine address at this location.');
    }
    else
        alert("Geocoder failed due to: " + status);
});*/


google.maps.event.addDomListener(window, 'load', initialize);

/**
 * A distance widget that will display a circle that can be resized and will
 * provide the radius in km.
 *
 * @param {google.maps.Map} map The map on which to attach the distance widget.
 *
 * @constructor
 */
function DistanceWidget(map) {
    this.set('map', map);
    this.set('position', userMarker.getPosition());

    /*var marker = new google.maps.Marker({
     draggable: true,
     title: 'Move me!'
     });*/

    var marker = userMarker; //Uso il mio userMarker come pin

    // Bind the marker map property to the DistanceWidget map property
    marker.bindTo('map', this);

    // Bind the marker position property to the DistanceWidget position
    // property
    marker.bindTo('position', this);

    // Create a new radius widget
    radiusWidget = new RadiusWidget();

    // Bind the radiusWidget map to the DistanceWidget map
    radiusWidget.bindTo('map', this);

    // Bind the radiusWidget center to the DistanceWidget position
    radiusWidget.bindTo('center', this, 'position');

    // Bind to the radiusWidgets' distance property
    this.bindTo('distance', radiusWidget);

    // Bind to the radiusWidgets' bounds property
    this.bindTo('bounds', radiusWidget);
}
DistanceWidget.prototype = new google.maps.MVCObject();


/**
 * A radius widget that add a circle to a map and centers on a marker.
 *
 * @constructor
 */
function RadiusWidget() {
    var circle = new google.maps.Circle({
        fillColor: "yellow",
        strokeColor: "yellow",
        strokeWeight: 0.5
    });


    // Set the distance property value, default to 50km.
    if(jQuery.cookie('last_radius') && distanceDefault == 2){
    	var radiusSplitted = jQuery.cookie('last_radius').split(" ");
    	this.set('distance', radiusSplitted[0].replace(',','.'));
    	distanceDefault = radiusSplitted[0].replace(',','.');
    	}
    else
    	this.set('distance', distanceDefault);

    // Bind the RadiusWidget bounds property to the circle bounds property.
    this.bindTo('bounds', circle);

    // Bind the circle center to the RadiusWidget center property
    circle.bindTo('center', this);

    // Bind the circle map to the RadiusWidget map
    circle.bindTo('map', this);

    // Bind the circle radius property to the RadiusWidget radius property
    circle.bindTo('radius', this);

    this.addSizer_();
}
RadiusWidget.prototype = new google.maps.MVCObject();


/**
 * Update the radius when the distance has changed.
 */
RadiusWidget.prototype.distance_changed = function() {
    this.set('radius', this.get('distance') * 1000);
};

/**
 * Add the sizer marker to the map.
 *
 * @private
 */
RadiusWidget.prototype.addSizer_ = function() {
    	sizer = new google.maps.Marker({
        draggable: true,
        title: 'Drag me!'
    });
    
    sizer.bindTo('map', this);
    sizer.bindTo('position', this, 'sizer_position');

    var me = this;
    google.maps.event.addListener(sizer, 'drag', function() {
        // Set the circle distance (radius)
        me.setDistance();
    });
};

/**
 * Update the center of the circle and position the sizer back on the line.
 *
 * Position is bound to the DistanceWidget so this is expected to change when
 * the position of the distance widget is changed.
 */
RadiusWidget.prototype.center_changed = function() {
    var bounds = this.get('bounds');

    // Bounds might not always be set so check that it exists first.
    if (bounds) {
        var lng = bounds.getSouthWest().lng();

        // Put the sizer at center, right on the circle.
        var position = new google.maps.LatLng(this.get('center').lat(), lng);
        this.set('sizer_position', position);
    }
};

/**
 * Calculates the distance between two latlng locations in km.
 * @see http://www.movable-type.co.uk/scripts/latlong.html
 *
 * @param {google.maps.LatLng} p1 The first lat lng point.
 * @param {google.maps.LatLng} p2 The second lat lng point.
 * @return {number} The distance between the two points in km.
 * @private
 */
RadiusWidget.prototype.distanceBetweenPoints_ = function(p1, p2) {
    if (!p1 || !p2) {
        return 0;
    }

    var R = 6371; // Radius of the Earth in km
    var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
    var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
};

/**
 * Set the distance of the circle based on the position of the sizer.
 */
RadiusWidget.prototype.setDistance = function() {
    // As the sizer is being dragged, its position changes.  Because the
    // RadiusWidget's sizer_position is bound to the sizer's position, it will
    // change as well.
    var pos = this.get('sizer_position');
    var center = this.get('center');
    var distance = this.distanceBetweenPoints_(center, pos);

    // Set the distance property for any objects that are bound to it
    this.set('distance', distance);
    distanceDefault = distance;
};

function displayInfo(widget) {

    //$('#infoAddress').text($('#searchAddress').val);
}
