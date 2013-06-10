<?php

function citynotifier_report() {
  global $user;
  
  header('Content-type: application/json');
  $data = drupal_json_decode(file_get_contents("php://input"));
  
  $validation = _citynotifier_validate($data, "report");
  
  if($validation['code'] <> 200) {
    drupal_add_http_header("Status", $validation['code'], $validation['response']);
    return;
  }

  //_citynotifier_check_event($data);
  
  extract(_citynotifier_get_index_type_subtype($data), EXTR_OVERWRITE);
   
  $record = array (
    "uid" => $user->uid,
    "event_id" => 0,
    "created" => time(),
    "type" => $type,
    "subtype" => $subtype,
    "lat" => $data['lat'],
    "lng" => $data['lng'],
    "description" => $data['description'],
    );
  
/*  $record_ev = array (
    "status" => "open",
    "type" => array_search($report['type']['type'], $types),
    "subtype" => array_search($report['type']['subtype'], $subtypes[$report['type']['type']]),
    "lat" => $report['lat'],
    "lng" => $report['lng'],
    );
*/

  drupal_write_record("citynotifier_notify", $record);
  $result = array("event_id" => $record['notify_id'], "result" => "nuova segnalazione aperta con successo / segnalazione di un evento già in memoria avvenuta con successo");
  
  drupal_add_http_header("Status", 200);
  echo drupal_json_output($result);
}

function _citynotifier_check_event($data) {
  $range=10;
  extract(_citynotifier_get_index_type_subtype($data), EXTR_OVERWRITE);
  
  
  $query_result = db_select("citynotifier_event", 'ce')
      ->fields('cn', array('notify_id','type', "subtype"))
      ->condition('type', $type, '=')
      ->condition('subtype', $subtype, '=')
      ->condition('lat', $data['lat']-$range,'>')
			->condition('lat', $data['lat']+$range,'<')
			->condition('lng', $data['lng']-$range,'>')
			->condition('lng', $data['lng']+$range,'<')
      ->execute()
			->fetchAll();
			
	/* Casi
	1) Non c'è evento, crealo
	2) Evento esiste
	  1) Aperto: collega notifica a questo evento
	  2) Chiuso:
	    1) Freshness < N: mettere evento in stato scettico, chiedere agli utenti
	    2) Freshness > N: aprire un nuovo evento
	*/
}

function create_ev() {

	$location = array();

	$query_result = db_select($schema["citynotifier_notify"], 'n')
			->fields('n')
			->condition('type', $_GET['type'],'=')
			->condition('subtype', $_GET['subtype'],'=')
			->condition('lat', $_GET['lat']-$_GET['radius'],'>')
			->condition('lat', $_GET['lat']+$_GET['radius'],'<')
			->condition('lng', $_GET['lng']-$_GET['radius'],'>')
			->condition('lng', $_GET['lng']+$_GET['radius'],'<')
			->condition('status', $_GET['status'],'=')
			->condition('created', $_GET['timemin'],'>')
			->condition('created', $_GET['timemax'],'<')
			->execute()
			->fetchAssoc();

	foreach($query_result as $pippo){
		array_push_assoc($location, "lat", $pippo->lat);
		array_push_assoc($location, "lng", $pippo->lng);
	}
	$start_time = min($query_result->created);
	$fresh = max($query_result->created);
	$nOn = length($query_result);
	$reliability = get_reliability();

	$record_ev = array (
			"status" => "open",
			"type" => $_GET['type'],
			"subtype" => $_GET['subtype'],
			"lat" => $location['lat'],
			"lng" => $location['lng'],
	);

	drupal_write_record($schema["citynotifier_event"], $record_ev);

	$event = array("event_id" => "",
			   "type" => array("type" => $_GET['type'], "subtype" => $_GET['subtype']),
			   "description" => array("","","","",""),
			   "start_time" => $start_time,
			   "freshness" => $fresh,
			   "status" => $stat,
			   "reliability" => $reliability,
			   "number_of_notifications" => $nOn,
			   "locations" => $location
		 );

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

