// Global Variables
var heatmapArray = [];

/**
 * distRoute finds the shortest path between start/end & end/start and calls calcRoute()
 * @param {google.maps.LatLng} start Start of the path
 * @param {google.maps.LatLng} end End of the path
 * @param waypointsArray Array of intermediate points between start and end
 * @param eventID Queue's ID event
 * @param gradient Queue's color gradient
 */
function distRoute(start, end, waypointsArray, eventID, gradient) {

	// First request to Google directionService to calculate start/end path length
	var request = {		
		origin: start, 
		destination: end,
		travelMode: google.maps.DirectionsTravelMode.DRIVING,
		waypoints: waypointsArray,
		optimizeWaypoints: true
	};

	directionsService.route(request, function(result, status) { 
		if (status == google.maps.DirectionsStatus.OK) {
			path = result.routes[0].overview_path;

			// pathLenSE stores path and length of Start_to_End path
			var pathLenSE = new Object();
			pathLenSE.path = path;
			pathLenSE.len = google.maps.geometry.spherical.computeLength(path);
			
			// Second request to Google directionService to calculate end/start path length
			var request = {		
				origin: end, 
				destination: start,
				travelMode: google.maps.DirectionsTravelMode.DRIVING,
				waypoints: waypointsArray,
				optimizeWaypoints: true
			};
			
			directionsService.route(request, function(result, status) { 
			if (status == google.maps.DirectionsStatus.OK) {
				path = result.routes[0].overview_path;

				// pathLenES stores path and length of End_to_Start path
				var pathLenES = new Object();
				pathLenES.path = path;
				pathLenES.len = google.maps.geometry.spherical.computeLength(path);
				
				// Draw the shortest path on map
				if(pathLenSE.len <= pathLenES.len)
					calcRoute(start, end, waypointsArray, pathLenSE.path, eventID, gradient);
				else
					calcRoute(end, start, waypointsArray, pathLenES.path, eventID, gradient);

				}
			});
		}
	});
}

/**
 * calcRoute draws 20 heatMap points along path between start/end previously calculated
 * @param {google.maps.LatLng} start Start of the path
 * @param {google.maps.LatLng} end End of the path
 * @param waypointsArray Array of intermediate points between start and end
 * @param eventID Queue's ID event
 * @param gradient Queue's color gradient
 */

function calcRoute(start, end, waypointsArray, path, eventID, gradient) {
	// heatMapArray contains current heatMap points between every steps of route 
	var heatMapMVCArray = [];	
		
	// Every route's steps interpolate() fills heatMapArray with 20 points
	for(var j=0; j<path.length-1; j++){
		for(var i=0.01; i<1; i+=0.05){	
			var heatPoint = google.maps.geometry.spherical.interpolate(path[j], path[j+1], i);
			heatMapMVCArray.push(heatPoint);
		}
	}
	// Google HeatMap needs a heatPoint MVCArray
	var pointArray = new google.maps.MVCArray(heatMapMVCArray);
	
	var heatmap = new google.maps.visualization.HeatmapLayer({
		data: pointArray
	});

	// Set heatMap color
	heatmap.setOptions({
		 gradient: heatmap.get('gradient') ? null : gradient
	});	

	// Add eventID to heatMap queue event
	heatmap.eventID = eventID;
		
	// Add heatMap queue event to global heatmapArray
	heatmapArray.push(heatmap);

	// Draw heatMap
	heatmap.setMap(map);
}

/**
 * Calculate air route between p1 and p2 coordinates
 * @param {google.maps.LatLng} p1 Start of the path
 * @param {google.maps.LatLng} p2 End of the path
 * @return Integer Km Air route between p1 and p2 
 */
function calcDistance(p1, p2){ return google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000; }

/**
 * Calculate middlePoint from coordinates Array
 * @param {google.maps.LatLng Array} pointArray coordinates Array
 * @return {google.maps.LatLng} middlePoint
 */
function middlePoint(pointArray){
	var count = pointArray.length;
	var sumLen = 0;
	var sumLng = 0;
	$.each(pointArray, function(index, value){
		if(value.lat && value.lng){ 
			sumLen += parseFloat(value.lat);
			sumLng += parseFloat(value.lng);
		}
		else
			count--;
	});
	
	return new google.maps.LatLng(sumLen/count,sumLng/count);
}

/**
 * updateQueue() compute and display new heatmap gradient 
 */
function updateQueue(){
	for(i in heatmapArray){
		var eventID_heatmap = heatmapArray[i].eventID;

		var result = $.grep(eventArray, function(e){ return e.eventID == eventID_heatmap; });

		// Check expire Event
        var expireTimeDate = new Date(result[0].freshness).getTime();
        var fadedTime = expireTimeDate + 10*60;
        var expireTime = expireTimeDate + 20*60;
        var nowTime = new Date().getTime() / 1000;
                        
        if(expireTime < nowTime){ 
            var gradient = [
            'rgba(34, 139, 34, 0)',
            'rgba(34, 139, 34, 1)' //Gradiente verde
            ];
    		heatmapArray[i].setOptions({
    			gradient:  gradient
  			});
        }
        else if(fadedTime < nowTime){ /*L'evento è sbiadito*/
            var gradient = [
            'rgba(255, 165, 0, 0)',
            'rgba(255, 165, 0, 1)' //Gradiente arancio
            ];
            heatmapArray[i].setOptions({
    			gradient:  gradient
  			});
        }
        else{ //Coda Fresca
            var gradient = [
            'rgba(255, 0, 0, 0)',
            'rgba(255, 0, 0, 1)' //Gradiente rosso
            ];
            // Disegno la coda
            heatmapArray[i].setOptions({
    			gradient:  gradient
  			});
        }
	}
}