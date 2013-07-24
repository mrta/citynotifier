<?php

/**
 * Report service.
 */
function citynotifier_report() {
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

	$validation = _citynotifier_validate($data, "report");

	if($validation['code'] <> 200) {
		drupal_add_http_header("Status", $validation['code'], TRUE); 
		echo drupal_convert_to_utf8(drupal_json_encode(array("result" => $validation['response'])));
		return;
	}

  list($data, $new_event) = citynotifier_report_apply($data);
  drupal_add_http_header("Status", 200);
  echo drupal_convert_to_utf8(drupal_json_encode(array("event_id" => $data['event_id'],
                                                       "result" => $new_event?t("nuova segnalazione aperta con successo"):t("segnalazione di un evento già in memoria avvenuta con successo"))));
  return;
}

function citynotifier_report_apply($data, $mode = NULL) {
  global $user;
  
  $matched_event = citynotifier_get_matched_event($data);
  
	$new_event = FALSE;
	switch ($matched_event['status']) {
	case FALSE:
	case citynotifier_get_index_status("archived"):
	  $new_event = TRUE;
	  $event_id = citynotifier_create_event($data);
	  break;
	case citynotifier_get_index_status("open"):
	  $event_id = $matched_event['event_id'];
	  break;
	case citynotifier_get_index_status("closed"):
	  if($mode == "notify")
	  	break;
	  $matched_event['status'] = citynotifier_get_index_status("skeptical");
	  citynotifier_update_event($matched_event);
		break;
	case citynotifier_get_index_status("skeptical"):
	  /** Bisogna vedere cosa fare nel caso sia una notifica su evento già skeptical **/
	  $event_id = $matched_event['event_id'];
	  break;
	};

  /** Ad extra $data **/

  $data = array_merge($data, array("uid" => $user->uid, "event_id" => $event_id, "created" => time()));
  drupal_write_record("citynotifier_notify", $data);

  if($mode=="notify")
    return array(citynotifier_get_event($data), $new_event);
  
  return array($data, $new_event);
}



