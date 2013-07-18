<?php

module_load_include('inc', 'citynotifier', 'citynotifier.report');
 
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

	list($event, $new_event) = citynotifier_report_apply($data, "notify");
	
	/* Notify on a non local event, create new one */
	if($new_event) {
	  drupal_add_http_header("Status", 200);
	  echo drupal_convert_to_utf8(drupal_json_encode(array("event_id" => $event['event_id'],
	                                                       "result" => t("notifica inviata con successo su un evento non esistente in locale che ora è stato creato"))));
	  return;
	}
	
	if (($data['status'] == citynotifier_get_index_status("open") && $event['status'] == citynotifier_get_index_status("closed")) ||
	    ($data['status'] == citynotifier_get_index_status("closed") && $event['status'] == citynotifier_get_index_status("open"))) {
    	$event['status'] = citynotifier_get_index_status("skeptical");
	    drupal_write_record("citynotifier_event", $event, 'event_id');
	  }
	
	  drupal_add_http_header("Status", 200);
	echo drupal_convert_to_utf8(drupal_json_encode(array("result" => t("notifica inviata con successo"))));
	return;
}


