// Global variables
var distanceWidget;
var radiusWidget;
var sizer;
var distanceDefault = RADIUS;

// True: radiusWidget displayed on the map
var radiusWidgetCheck = false;

/**
 * A distance widget that will display a circle that can be resized and will
 * provide the radius in km.
 * @param {google.maps.Map} map The map on which to attach the distance widget.
 */
function DistanceWidget(map) {
    this.set('map', map);
    this.set('position', userMarker.getPosition());

	// Use userMarker as center of the widget
    var marker = userMarker; 

    // Bind the marker map property to the DistanceWidget map property
    marker.bindTo('map', this);

    // Bind the marker position property to the DistanceWidget position property
    marker.bindTo('position', this);

    radiusWidget = new RadiusWidget();

    // DistanceWidget binding options
    radiusWidget.bindTo('map', this);
    radiusWidget.bindTo('center', this, 'position');
    this.bindTo('distance', radiusWidget);
    this.bindTo('bounds', radiusWidget);
}
DistanceWidget.prototype = new google.maps.MVCObject();

/**
 * A radius widget that add a circle to a map and centers on a marker.
 */
function RadiusWidget() {

    var circle = new google.maps.Circle({
        fillColor: "yellow",
        strokeColor: "yellow",
        strokeWeight: 0.5
    });

    // Set the distance property value.
    if(jQuery.cookie('last_radius') && distanceDefault == RADIUS){
    	var radiusSplitted = jQuery.cookie('last_radius').split(" ");
    	this.set('distance', radiusSplitted[0].replace(',','.'));
    	distanceDefault = radiusSplitted[0].replace(',','.');
    	}
    else
    	this.set('distance', distanceDefault);

    // RadiusWidget binding options
    this.bindTo('bounds', circle);
    circle.bindTo('center', this);
    circle.bindTo('map', this);
    circle.bindTo('radius', this);

    // Add sizer marker
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
 * @private
 */
RadiusWidget.prototype.addSizer_ = function() {
    	sizer = new google.maps.Marker({
        draggable: true,
        icon: 'http://maps.gstatic.com/mapfiles/ridefinder-images/mm_20_white.png',
        title: 'Drag me!'
    });
    
    sizer.bindTo('map', this);
    sizer.bindTo('position', this, 'sizer_position');

    var me = this;
    google.maps.event.addListener(sizer, 'drag', function() {
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