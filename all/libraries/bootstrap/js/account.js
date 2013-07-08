/**
 * loginFunction permette all'utente di collegarsi al sistema CityNotifier
 */
function loginFunction() {
    xmlhttp = new XMLHttpRequest();
    url = URLSERVER.concat("/login");

    // Login object: Username & Password
    var loginObj = new Object();
    loginObj.username = $('#user').val();
    loginObj.password = $('#pass').val();

    					var userError = $('<span id="user_span" class="help-inline">User incorrect</span>');
    					var passError = $('<span id="pass_span" class="help-inline">Password incorrect</span>');

    // Create JSON Object from loginObject
    var loginJSON = JSON.stringify(loginObj);

    if ((loginObj.username) && (loginObj.password)) {
        $.ajax({
            url: url,
            type: 'POST',
            data: loginJSON,
            contentType: "application/json; charset=utf-8",
            success: function(datiString, status, richiesta) {
            	successAlert("Login effettuato con successo");

            	// Store login session data
       			var session_id = datiString.session_id;
        		var session_name = datiString.session_name;   
        		var session_user = datiString.username;   
        		var session_auth = datiString.roles;
        		console.log("Creo la sessione di nome "+session_name+" con id "+session_id);
        		
        		// Store login session data in a cookie
        		jQuery.cookie('session_name', session_name, { path: '/', expires: 30 });
        		jQuery.cookie('session_id', session_id, { path: '/', expires: 30 });
        		jQuery.cookie('session_user', session_user, { path: '/', expires: 30 });
            
                $('#account').fadeOut(1000, function() {
                    $('#account').html((loginObj.username)[0].toUpperCase() + (loginObj.username).slice(1) + ' <i class="icon-user icon-white"></i>');
                    $('#account').fadeIn(1000);
                    $('#notify').css('visibility','visible').hide().fadeIn(1000);
                });

                $('#account').next().empty();
                for (var auth_level in session_auth) {
  					if(auth_level == 3){ //ADMIN
  						$('#account').next().html('<div id="logout-form">\
  							<a href="#adminPanel" role="button" id="adminPanelButton" class="btn btn-info input-block-level" data-toggle="modal">Admin Panel</a>\
  							<button id="logout" type="button" class="btn btn-danger input-block-level">Logout</button></div>');
  							jQuery.cookie('session_auth', auth_level, { path: '/', expires: 30 });
  							
					}
  					else{
  						$('#account').next().html('<div id="logout-form"><button id="logout" type="button" class="btn btn-danger input-block-level">Logout</button></div>');	
						jQuery.cookie('session_auth', auth_level, { path: '/', expires: 30 });
					}
				}
				$('#account').parent().removeClass('open');
            },
            error: function(err) {
                errorAlert("Utente non registrato");
            }
        });
    }
    else if (!(loginObj.username) && $("#user").is(':last-child')) {
        $('#user').parent().addClass("error");
        $('#user').after(userError);
    }
    else if (!(loginObj.password) && $("#pass").is(':last-child')) {
        $('#pass').parent().addClass("error");
        $('#pass').after(passError);
    }

    $('#user').on("keypress", function() {
        $('#user').parent().removeClass("error");
        $('#user_span').fadeOut();
        $('#user_span').remove();
    });
    $('#pass').on("keypress", function() {
        $('#pass').parent().removeClass("error");
        $('#pass_span').fadeOut();
        $('#pass_span').remove();
    });
}

/**
 * Logout event on click on logout button
 */
$("#dropdown_account").on("click", '#logout', function() {
    xmlhttp = new XMLHttpRequest();
    url = URLSERVER.concat("/logout");

    $.ajax({
        url: url,
        method: 'POST',
        data: null,
        success: function(datiString, status, richiesta) {

        	// Cookie session deleted
        	jQuery.removeCookie('session_name');
        	jQuery.removeCookie('session_id');
        	jQuery.removeCookie('session_user');
        	jQuery.removeCookie('session_auth');
        	
        	jQuery.removeCookie('last_type');
			jQuery.removeCookie('last_subtype');
			jQuery.removeCookie('last_address');
			jQuery.removeCookie('last_radius');
			jQuery.removeCookie('last_status');
			jQuery.removeCookie('last_timeFrom');
			jQuery.removeCookie('last_timeTo');
	
			jQuery.removeCookie('last_lat');
			jQuery.removeCookie('last_lng');

			successAlert("Logout effettuato con successo");

			$('#account').fadeOut(1000, function() {
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
        	
        	$('#notify').fadeOut(1000);
        },
        error: function(err) {
        	errorAlert("Si è verificato un errore con il logout");
        }
    });
});

/**
 * Login button click event listener
 */
$("#dropdown_account").on("click", "#login", function() {
    loginFunction();
});

/**
 * Login button enter pressed listener
 */
$("#dropdown_account").on('keypress', '#pass', function(e) {
    if (e.which === 13) {
        loginFunction();
    }
});