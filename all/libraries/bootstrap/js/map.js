
var sizer;
var markersArray = [];

function clearOverlays() {
  for (var i = 0; i < markersArray.length; i++ ) {
    markersArray[i].setMap(null);
  }
  markersArray = [];
  
	for(var i=0; i<heatmapArray.length;i++)
		heatmapArray[i].setMap(heatmapArray[i].getMap() ? null : map);
	heatmapArray = [];
}

$('#refresh').on('click', function() {
	if(userMarker){	
    	userMarker.setMap(null);
    	userMarker = null;
    }
	clearOverlays();
	$('#modalBody').html('');
    radiusWidgetCheck = false;
});



function createInfoWindow(latlng, infoWindow){
			var infoID = infoWindow.id;
			var infoType = infoWindow.type;
			var infoSubType = infoWindow.subtype;
			var infoStatus = infoWindow.status;
			var infoScope = infoWindow.scope;
			var address = infoWindow.address;
		
			$('#eventIDModal').html(infoID);
			$('#coordModal').html(latlng.lat() + " , " + latlng.lng());
			$('#typeModal').html(infoType);
			$('#subtypeModal').html(infoSubType);
							
			switch (infoStatus) {
				case "Open":
						infoStatus = '<div class="btn-group"><a id="infoWindowStatus" type="button" class="btn dropdown-toggle btn-success" data-toggle="dropdown" href="#">'+infoStatus+'  <span class="caret"></span></a>';
						changeStatus = '<a href="#notifyPanel" data-toggle="modal">Segnala evento chiuso</a>';
						if($("#statusModal").next().is("li"))
							$("#statusModal").next().remove();
						$('#statusModal').after('<li><span id="statusModalValue" class="label label-important">Closed</span>');
					break;
				case "Closed":
						infoStatus = '<div class="btn-group"><a id="infoWindowStatus" type="button" class="btn dropdown-toggle btn-danger" data-toggle="dropdown" href="#">'+infoStatus+'  <span class="caret"></span></a>';
						changeStatus = '<a href="#notifyPanel" data-toggle="modal">Segnala evento aperto</a>'
						if($("#statusModal").next().is("li"))
							$("#statusModal").next().remove();
						$('#statusModal').after('<li><span id="statusModalValue" class="label label-success">Open</span>');

					break;
				case "Skeptical":
						infoStatus = '<div class="btn-group"><a id="infoWindowStatus" type="button" class="btn dropdown-toggle btn-warning" data-toggle="dropdown" href="#">'+infoStatus+' <span class="caret"></span></a>';
						changeStatus = '<a href="#notifyPanel" data-toggle="modal">Risolvi evento scettico</a>';
						if($("#statusModal").next().is("li"))
							$("#statusModal").next().remove();
						$('#statusModal').after('<li><label class="radio">\
													<input type="radio" name="optionsRadios" id="optionsRadios1" value="open" checked style="vertical-align: middle"><span class="label label-success">Open</span></label></li>\
													<li><label class="radio">\
													<input type="radio" name="optionsRadios" id="optionsRadios2" value="closed" style="vertical-align: middle"><span class="label label-important">Closed</span></label></li>');
					break;	
			}
			  
			infoWindow.setContent('<div class="hero-unit">\
										<h2>'+infoSubType+'<img style="padding-left: 35px;" class="pull-right" src='+getIcon(infoType, infoSubType)+'></h2>\
										<h4>'+address+'</h4>\
										<p>'+infoType+' > '+infoSubType+'</p>\
										'+infoStatus+'\
											<ul class="dropdown-menu">\
												<li>'+changeStatus+'</li>\
											</ul>\
										</div>\
									</div>');
}



