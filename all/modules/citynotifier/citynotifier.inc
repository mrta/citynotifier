<?php

function citynotifier_report() {
  header('Content-type: application/json');
  $data = drupal_json_decode(file_get_contents("php://input"));
  
  $validation = _citynotifier_validate($data, "report");
  
  if($validation['code'] <> 200) {
    drupal_add_http_header("Status", $validation['code'], $validation['response']);
    return;
  }

  $record = array (
    "uid" => $user->uid,
    "created" => time(),
    "type" => array_search($data['type']['type'], $types),
    "subtype" => array_search($data['type']['subtype'], $subtypes[$data['type']['type']]),
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
  drupal_write_record($schema["citynotifier_notify"], $record);
    
  $result = array("event_id" => "9806", "result" => "nuova segnalazione aperta con successo / segnalazione di un evento già in memoria avvenuta con successo");
  
  drupal_add_http_header("Status", 200);
  echo drupal_json_output($result);
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
  $types = array("all" => array("all"),
                 "problemi_stradali" => array("incidente", "buca", "coda", "lavori_in_corso", "strada_impraticabile"),
                 "emergenze_sanitarie" => array("incidente", "malore", "ferito"),
                 "reati" => array("furto", "attentato"),
                 "problemi_ambientali" => array("incendio", "tornado", "neve", "alluvione"),
                 "eventi_pubblici" => array("partita", "manifestazione", "concerto")); 
  
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
  
  $validate_type = FALSE;
  $validate_subtype = FALSE;
  $type=array_keys($types);
  $n=0;
  while(!$validate_type && !$validate_subtype && $n < count($type)){
    if($type[$n] == $data['type']['type']) {
      $validate_type = TRUE;
      if(in_array($data['type']['subtype'], $types[$data['type']['type']]))
        $validate_subtype = TRUE;
    }
    $n++;
  };
  
  if(!$validate_type)
    return array("code" => 406, "response" => t('Type non valido'));
  
  if(!$validate_subtype)
    return array("code" => 406, "response" => t('Subtype non valido'));

  if(!is_float(floatval($data['lat'])))
    return array("code" => 406, "response" => t('Latitudine non valida'));
  
  if(!is_float(floatval($data['lng'])))
    return array("code" => 406, "response" => t('Longitudine non valida'));
  
  return array("code" => 200, "response" => '');
}

