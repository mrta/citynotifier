// Enable the visual refresh
google.maps.visualRefresh = true;

var map;
var userMarker;
var distanceWidget;
var radiusWidget;

function initialize() {
	var mapOptions = {
		disableDoubleClickZoom: true,
		zoom: 15,
		
		center: new google.maps.LatLng(44.495281,11.349735),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);


	google.maps.event.addListener(map, 'click', function(event) {
		var lat=event.latLng.lat();
		var lng=event.latLng.lng();

		if(userMarker) userMarker.setMap(null);
		if(distanceWidget) radiusWidget.set('distance', 0);

		userMarker = new google.maps.Marker({
			position: new google.maps.LatLng(lat, lng),
			map: map,
			draggable: true,
			title: "Appaio se rimango sopra col mouse",
			animation: google.maps.Animation.DROP
		});
		
		google.maps.event.addListener(userMarker, 'dragend', function(event) {
                    var lat=event.latLng.lat();
                    var lng=event.latLng.lng();
                    geocodePosition(new google.maps.LatLng(lat, lng));
                    var point = userMarker.getPosition();
                    map.panTo(point);
		}); 

		geocodePosition(new google.maps.LatLng(lat, lng));
		
		
		$('#search').on('click', function(){
			distanceWidget = new DistanceWidget(map);
			google.maps.event.addListener(distanceWidget, 'distance_changed', function() {
	  			$('#searchRadius').val((Math.round(distanceWidget.get('distance') * 1000) / 1000)+" km");	
			});

			google.maps.event.addListener(distanceWidget, 'position_changed', function() {
	  			displayInfo(distanceWidget);
			});
		});
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
  this.set('distance', 0.5);

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
	var sizer = new google.maps.Marker({
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
};

function displayInfo(widget) {
  var info = document.getElementById('info');
  info.innerHTML = 'Position: ' + widget.get('position') + ', distance: ' +
    widget.get('distance');
}
