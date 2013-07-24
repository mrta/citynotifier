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

	switch($event['status']) {
	case citynotifier_get_index_status("closed"):
	  if($data['status'] == citynotifier_get_index_status("open")) {
	    $event['status'] = citynotifier_get_index_status("skeptical");
    	citynotifier_update_event($event);
	  }
	  break;
	case citynotifier_get_index_status("skeptical"):
		break;
	default:
	  extract(_citynotifier_get_value_type_subtype_from_index($data['type'], $data['subtype']));
	  if($type == "problemi_stradali" && $subtype == "buca"){
	  	if(in_array("citynotifier_admin", $user->roles)){
	  	  	$event['status'] = citynotifier_get_index_status("archived");
	  		citynotifier_update_event($event);
	  	}
	  	else{
	  		drupal_add_http_header("Status", 403);
	  		echo drupal_convert_to_utf8(drupal_json_encode(array("result" => t("non hai i permessi per chiudere l'evento"))));
	  		return;
	  	}
	  	break;
	  }
	  $event['status'] = $data['status'];
	  citynotifier_update_event($event, 'update_location');
	}
	
	drupal_add_http_header("Status", 200);
	echo drupal_convert_to_utf8(drupal_json_encode(array("result" => t("notifica inviata con successo"))));
	return;
}


