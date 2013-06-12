<?php

function citynotifier_report() {
  global $user;
  $time_const = 1200;

  header('Content-type: application/json');
  $data = drupal_json_decode(file_get_contents("php://input"));
  
  $validation = _citynotifier_validate($data, "report");
  
  if($validation['code'] <> 200) {
    drupal_add_http_header("Status", $validation['code'], $validation['response']);
    return;
  }

  $event_exist = _citynotifier_check_event($data);
  
	if(!$event_exist || $event_exist['status'] == "archived")
		$event_id = _citynotifier_create_event($data);
	if($event_exist['status'] == "open")
		$event_id = $event_exist['event_id'];
	if($event_exist['status'] == "closed"){
		//status scettico cosa fare?
		$event_id = _citynotifier_update_event();
	}

	/* Casi
	1) Non c'è evento, crealo
	2) Evento esiste
	  1) Aperto: collega notifica a questo evento
	  2) Chiuso:
	    1) Freshness < N: mettere evento in stato scettico, chiedere agli utenti
	    2) Freshness > N: aprire un nuovo evento
	*/

  extract(_citynotifier_get_index_type_subtype($data), EXTR_OVERWRITE);
   
  $record = array (
    "uid" => $user->uid,
    "event_id" => $event_id,
    "created" => time(),
    "type" => $type,
    "subtype" => $subtype,
    "lat" => $data['lat'],
    "lng" => $data['lng'],
    "description" => $data['description'],
    );

  drupal_write_record("citynotifier_notify", $record);

  $result = array("event_id" => $record['event_id'], "result" => "nuova segnalazione aperta con successo / segnalazione di un evento già in memoria avvenuta con successo");
  
  drupal_add_http_header("Status", 200);
  echo drupal_json_output($result);
}

function _citynotifier_create_event($data) {
	extract(_citynotifier_get_index_type_subtype($data), EXTR_OVERWRITE);

	$record = array (
		"type" => $type,
		"subtype" => $subtype,
		"status" => "open",
	);

	drupal_write_record("citynotifier_event", $record);

	return $record['event_id'];
}

function _citynotifier_check_event($data) {
  $range=10;
  extract(_citynotifier_get_index_type_subtype($data), EXTR_OVERWRITE);
  
  
  $events = db_select("citynotifier_event", 'ce');
	
  $events->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
//l ultimo campo di fields dovrebbe essere sbagliato
  $events->fields('ce', array('event_id','status','created'));

  $events->condition('cn.type', $type, '=')
	->condition('cn.subtype', $subtype, '=')
	->condition('cn.lat', $data['lat']-$range,'>')
	->condition('cn.lat', $data['lat']+$range,'<')
	->condition('cn.lng', $data['lng']-$range,'>')
	->condition('cn.lng', $data['lng']+$range,'<')
	->orderby('cn.created', 'DESC')
	->execute()
	->fetchAssoc();

  return $events;
}

function _citynotifier_validate($data, $function_type=NULL) {
  switch($function_type) {
  case "request":
    if($data['scope'] <> "local" && $data['scope'] <> "remote")
      return array("code" => 406, "response" => t('Scope non valido'));
    if(!is_float(floatval($data['radius'])))
      return array("code" => 406, "response" => t('Radius non valido'));
    
    $data['type'] = array('type' => $data['type'], 'subtype' => $data['subtype']);
    unset($data['subtype']);
  }
  
  if(!isset($data['type']['type']))
    return array("code" => 406, "response" => t('Type non valido'));
  
  extract(_citynotifier_get_index_type_subtype($data), EXTR_OVERWRITE);
  
  if($type === FALSE)
    return array("code" => 406, "response" => t('Type non valido'));
  
  if($subtype === FALSE)
    return array("code" => 406, "response" => t('Subtype non valido'));

  if(!is_float(floatval($data['lat'])))
    return array("code" => 406, "response" => t('Latitudine non valida'));
  
  if(!is_float(floatval($data['lng'])))
    return array("code" => 406, "response" => t('Longitudine non valida'));
  
  return array("code" => 200, "response" => '');
}

function _citynotifier_get_index_type_subtype($data) {
  $types = array("all" => array("all"),
                 "problemi_stradali" => array("incidente", "buca", "coda", "lavori_in_corso", "strada_impraticabile"),
                 "emergenze_sanitarie" => array("incidente", "malore", "ferito"),
                 "reati" => array("furto", "attentato"),
                 "problemi_ambientali" => array("incendio", "tornado", "neve", "alluvione"),
                 "eventi_pubblici" => array("partita", "manifestazione", "concerto"));
  
  $validate_type = FALSE;
  $validate_subtype = FALSE;
  $type=array_keys($types);

  return array("type" => array_search($data['type']['type'], $type), "subtype" => array_search($data['type']['subtype'], $types[$data['type']['type']]));
}

