<?php

function citynotifier_notify() {
	global $user;
	header('Content-type: application/json; charset=utf-8');
	$data = drupal_json_decode(file_get_contents("php://input"));

	if(!$user) {
		drupal_add_http_header("Status", 401);
		return drupal_json_output(array("result" => t("Per inviare una notifica bisogna essere loggati")));
	}

	$query = db_select("citynotifier_event", 'ce')
		->fields('ce', array('type','subtype','status'))
		->condition('ce.event_id', $data['event_id'], '=');
	$event = $query->execute()->fetchAssoc();

	$event['status'] = $data['status'];

	drupal_write_record("citynotifier_event", $event, $data['event_id']);

	drupal_add_http_header("Status", 200);
	return drupal_json_output(array("result" => t("notifica inviata con successo")));
}

function citynotifier_report() {
	global $user;
	$time_const = 1200;

	header('Content-type: application/json; charset=utf-8');
	$data = drupal_json_decode(file_get_contents("php://input"));

	$validation = _citynotifier_validate($data, "report");

	if($validation['code'] <> 200) {
		drupal_add_http_header("Status", $validation['code'], $validation['response']);
		return;
	}

	$event_exist = _citynotifier_check_event($data);
  
	if(!$event_exist || $event_exist['status'] == _citynotifier_get_index_status("archived"))
		$event_id = _citynotifier_create_event($data);
	if($event_exist['status'] == _citynotifier_get_index_status("open"))
		$event_id = $event_exist['event_id'];
	if($event_exist['status'] == _citynotifier_get_index_status("closed")){
		//status scettico cosa fare?
		//$event_id = _citynotifier_update_event();
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
		"status" => _citynotifier_get_index_status("open"),
	);

	drupal_write_record("citynotifier_event", $record);

	return $record['event_id'];
}

function _citynotifier_check_event($data) {
	$range=0.005;
	extract(_citynotifier_get_index_type_subtype($data), EXTR_OVERWRITE);

	$query = db_select("citynotifier_event", 'ce');
	$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
	$query->fields('ce', array('event_id','status'))
		->fields('cn', array('created'))
		->condition('cn.type', $type, '=')
		->condition('cn.subtype', $subtype, '=')
		->condition('cn.lat', $data['lat']-$range,'>')
		->condition('cn.lat', $data['lat']+$range,'<')
		->condition('cn.lng', $data['lng']-$range,'>')
		->condition('cn.lng', $data['lng']+$range,'<')
		->orderby('cn.created', 'DESC');
	$events = $query->execute()->fetchAssoc();

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

function _citynotifier_get_index_type_subtype($data, $get = null) {
  $types = array("all" => array("all"),
                 "problemi_stradali" => array("incidente", "buca", "coda", "lavori_in_corso", "strada_impraticabile"),
                 "emergenze_sanitarie" => array("incidente", "malore", "ferito"),
                 "reati" => array("furto", "attentato"),
                 "problemi_ambientali" => array("incendio", "tornado", "neve", "alluvione"),
                 "eventi_pubblici" => array("partita", "manifestazione", "concerto"));
  
  $validate_type = FALSE;
  $validate_subtype = FALSE;
  $type=array_keys($types);

  if($get)
	return array("type" => array_search($_GET['type'], $type), "subtype" => array_search($_GET['subtype'], $types[$_GET['type']]));
  return array("type" => array_search($data['type']['type'], $type), "subtype" => array_search($data['type']['subtype'], $types[$data['type']['type']]));
}

function _citynotifier_get_index_status($status){
	$array_status = array(0 => "archived", 1 => "open", 2 => "closed", 3 => "skeptical");

	return array_search($status, $array_status);
}

function _citynotifier_create_event_to_resp() {
	$status = _citynotifier_get_index_status($_GET['status']);
	extract(_citynotifier_get_index_type_subtype($data, 1), EXTR_OVERWRITE);

	$lonmin = $_GET['lng']-$_GET['radius']/abs(cos(deg2rad($_GET['lat']))*69);
	$lonmax = $_GET['lng']+$_GET['radius']/abs(cos(deg2rad($_GET['lat']))*69);

	$latmin = $_GET['lat']-($_GET['radius']/69);
	$latmax = $_GET['lat']+($_GET['radius']/69);

/*	$query = db_query("SELECT event_id, lat, lng, 3956 * 2 * ASIN(SQRT(POWER(SIN((".$_GET['lat']." -lat) * pi()/180 / 2), 2) +COS(".$_GET['lat']." * pi()/180) * COS(lat * pi()/180) *POWER(SIN((".$_GET['lng']." -lon) * pi()/180 / 2), 2) )) as distance 
		FROM citynotifier_notify
		WHERE lng between $lonmin and $lonmax and lat between $latmin and $latmax 
		having distance < ".$_GET['radius']." ORDER BY Distance limit 10;"
		)->fetchAll;*/

	$query = db_select("citynotifier_event", 'ce');
	$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
	$query->fields('ce', array('event_id','type','subtype','status'));
	$query->addExpression('MAX(cn.created)', 'freshness');
	$query->addExpression('MIN(cn.created)', 'start');
	$query->condition('ce.type', $type, '=')
		->condition('ce.subtype', $subtype, '=')
		/*->condition('cn.lat', $latmin,'>')
		->condition('cn.lat', $latmax,'<')
		->condition('cn.lng', $lonmax,'>')
		->condition('cn.lng', $lonmin,'<')*/
		->condition('ce.status', $status,'=')
		->havingCondition('freshness', $_GET['timemin'], '>')
		->havingCondition('freshness', $_GET['timemax'], '<');
	$query->groupBy('ce.event_id');

	$events = $query->execute();//->fetchAll();

	foreach($events as $event){
		$query = db_select("citynotifier_event", 'ce');
		$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
//		$query->fields('cn', array('uid','lat','lng','description'));
		$query->addExpression('COUNT(*)', 'number_of_notifications');
		$query->condition('ce.event_id', $event->event_id, '=');
		$query->groupBy('ce.event_id');
		$nOn = $query->execute()->fetchAll();
//$profile = user_load($uid);

citynotifier_debug($nOn);
	}

	return $events;
}



