$("#account").next().delegate("#login", "click", function(){
	xmlhttp = new XMLHttpRequest();
	domain = "http://";
	url =  domain.concat(document.location.hostname, "/login");
	
	var loginObj = new Object();
	loginObj.username = $('#user').val();
	loginObj.password = $('#pass').val();

	var userError = $('<span id="user_span" class="help-inline">User incorrect</span>');
	var passError = $('<span id="pass_span" class="help-inline">Password incorrect</span>');

	var loginJSON = JSON.stringify(loginObj);
	console.log(loginJSON);

	if((loginObj.username) && (loginObj.password)){
			$.ajax({
				url: url,
				type: 'POST',
				data: loginJSON,
				contentType: "application/json; charset=utf-8",
				success: function(datiString, status, richiesta){
					$('#account').fadeOut(1000, function(){ 
						$('#account').html((loginObj.username)[0].toUpperCase() + (loginObj.username).slice(1) + ' <i class="icon-user icon-white"></i>');
						$('#account').fadeIn(1000);
					});

					$('#account').next().empty();
					$('#account').next().html('<div id="logout-form"><button id="logout" type="button" class="btn btn-danger input-block-level">Logout</button></div>');
					$('#account').next().fadeIn();
					},
				error: function(err) {
					alert("Utente non registrato");
				}
			  });			
	}
	else if(!(loginObj.username) && $("#user").is(':last-child')){
		$('#user').parent().addClass("error");
		$('#user').after(userError);
	}
	else if(!(loginObj.password) && $("#pass").is(':last-child')){
		$('#pass').parent().addClass("error");
		$('#pass').after(passError);
	}

	$('#user').on("keypress", function(){
		$('#user').parent().removeClass("error");
		$('#user_span').fadeOut();
		$('#user_span').remove();
	});
	$('#pass').on("keypress", function(){
		$('#pass').parent().removeClass("error");
		$('#pass_span').fadeOut();
		$('#pass_span').remove();
	});

});

$("#account").next().delegate("#logout", "click", function(){
	xmlhttp = new XMLHttpRequest();
	url = 'http://ltw1306.web.cs.unibo.it/logout';

	$('#account').fadeOut(1000, function(){ 
	$('#account').html("Account " + '<i class="icon-user icon-white"></i>');
	$('#account').fadeIn(1000);

	$('#account').next().empty();
	$('#account').next().html('<form>\
							  <fieldset>\
								<div class="control-group">\
							    <input id="user" type="text" placeholder="Username"></div>\
								<div class="control-group">\
								<input id="pass" type="password" placeholder="Password"></div>\
							    <button id="login" type="button" class="btn btn-inverse pull-right">Login</button>\
							  </fieldset>\
						  </form>');

	$('#account').next().fadeIn();
	$('#account').removeAttr("style");
	$('#account').next().removeAttr("style");
	});
			
	$.ajax({
			url: url,
			method: 'POST',
			data: null,
			success: function(datiString, status, richiesta){
			},
			error: function(err) {
			}
	});
});
