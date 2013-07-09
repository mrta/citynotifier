<?php

/**
 * Report service.
 */
function citynotifier_report() {
	global $user, $skepticals;
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

	$matched_event = _citynotifier_get_matched_event($data);

	$new_event = FALSE;
	switch ($matched_event['status']) {
	case FALSE:
	case _citynotifier_get_index_status("archived"):
	  $new_event = TRUE;
	  $event_id = _citynotifier_create_event($data);
	  break;
	case _citynotifier_get_index_status("open"):
	  $event_id = $matched_event['event_id'];
	  break;
	case _citynotifier_get_index_status("closed"):
	  _citynotifier_update_status_event($matched_event['event_id'], _citynotifier_get_index_status("skeptical"));
		$event_id = $matched_event['event_id'];
		break;
	case _citynotifier_get_index_status("skeptical"):
	  /** Bisogna vedere cosa fare nel caso sia una notifica su evento già skeptical **/
	  break;
	};

	/* Casi
	1) Non c'è evento, crealo
	2) Evento esiste
	  1) Aperto: collega notifica a questo evento
	  2) Chiuso:
	    1) Freshness < N: mettere evento in stato scettico, chiedere agli utenti
	    2) Freshness > N: aprire un nuovo evento
	*/
	//citynotifier_debug($data);
  
  /** Ad extra $data **/
  $data += array (
    "uid" => $user->uid,
    "event_id" => $event_id,
    "created" => time(),
    );
  
  if(!drupal_write_record("citynotifier_notify", $data)) {
    watchdog('citynotifier', t("Errore nella memorizzazione nel database") . '<pre>'. print_r($data, TRUE) .'</pre>', WATCHDOG_DEBUG);
    drupal_add_http_header("Status", 500);
    echo drupal_convert_to_utf8(drupal_json_encode(array("result" => t("Errore nella memorizzazione nel database"))));
    return;
  };

  drupal_add_http_header("Status", 200);
  echo drupal_convert_to_utf8(drupal_json_encode(array("event_id" => $data['event_id'],
                                                       "result" => $new_event?t("nuova segnalazione aperta con successo"):t("segnalazione di un evento già in memoria avvenuta con successo"))));
  return;
}


