/**
* Get server list from catalogue specified in /admin/config/citynotifier
*/
$("#account").next().on('click', "#adminPanelButton", function() {

	// If the list hasn't been already fetched, get it
	if($('#serverInput > option').length == 1){
		console.log("Aggiungo server");
		url = URLSERVER.concat("/servers"); 							
		$.ajax({
			url: url,
			type: 'GET',
			success: function(serverString, status){
				for (var i in serverString)
					$('#serverInput').append('<option>'+ i + ": "+ serverString[i].name + " "+ serverString[i].url+'</option>');
			},
			error: function(err){
				console.log("Server get error");
			}
		});
	}
});

/**
* Adds the id of the server to query in the 'dest' field 
*/		
$('#serverConnect').on('click', function(){

	// Server url parsing
	if ($('#serverInput').val().substring(0, 7) != "http://")
    	var urlServerHttp = "http://" + $('#serverInput').val();
    else
    	var urlServerHttp = $('#serverInput').val();

    // Success Alert
	$('#adminAlert').html('<div class="alert alert-info span4">\
		  		<button type="button" class="close"></button>\
		  		<span id="alertMsg"><strong>E\' stato modificato il Server destinatario</strong></span></div>');
	$('#adminAlert').fadeTo(500, 1).delay(1500).fadeTo(500, 0, function(){
		$('#adminAlert').css('display', 'none');
	});

	// Update urlCrossDomain Server value with Server index
	urlCrossDomain = $("#serverInput").prop("selectedIndex")-1;
	$('#serverInput').attr('onfocus', '');
});

/**
* Used to set the interval between refreshs in LIVE mode
*/	
$('input:radio[name="timeLive"]').change( 
	function(){
        LIVE_SECOND = $(this).val();
	});