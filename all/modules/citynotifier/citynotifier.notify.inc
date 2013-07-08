<?php

/**
 * Notify service.
 */
function citynotifier_notify() {
	global $user;
	header('Content-type: application/json; charset=utf-8');

	if($_SERVER["REQUEST_METHOD"] != "POST") {
     drupal_add_http_header("Status", "405", TRUE); 
     echo drupal_convert_to_utf8(drupal_json_encode(array("result" => t("Metodo non consentito"))));
     return;
   };
   
	if(!$user->uid) {
		drupal_add_http_header("Status", 401);
		echo drupal_convert_to_utf8(drupal_json_encode(array("result" => t("Per inviare una segnalazione bisogna essere loggati"))));
		return;
	}
	
	$data = _citynotifier_citynotifier2data(drupal_json_decode(citynotifier_file_get_contents_utf8("php://input")));

   
   
}
