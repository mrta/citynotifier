$("#account").next().delegate("#adminPanelButton", "click", function() {
	if($('#serverInput > option').length == 1){
		url = urlServer.concat("/servers"); 							
		$.ajax({
			url: url,
			type: 'GET',
			success: function(serverString, status){
				//console.log(serverString);
				for (var i in serverString)
				$('#serverInput').append('<option>'+ i + ": "+ serverString[i].name + " "+ serverString[i].url+'</option>');
			},
			error: function(err){
				console.log("Server string error");
			}
		});
	}
});

  							

$('#serverConnect').on('click', function(){
	if ($('#serverInput').val().substring(0, 7) != "http://")
    	var urlServerHttp = "http://" + $('#serverInput').val();
    else
    	var urlServerHttp = $('#serverInput').val();

	 $('#adminAlert').html('<div class="alert alert-info span4">\
		  		<button type="button" class="close"></button>\
		  		<span id="alertMsg"><strong>E\' stato modificato il Server destinatario</strong></span></div>');
			$('#adminAlert').fadeTo(500, 1).delay(1500).fadeTo(500, 0, function(){
				$('#adminAlert').css('display', 'none');
	});
	
	urlCrossDomain = $("#serverInput").prop("selectedIndex")-1;
	$('#serverInput').attr('onfocus', '');

});
