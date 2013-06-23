<?php

$skepticals = array();

function citynotifier_notify() {
	global $user, $skepticals;
	header('Content-type: application/json; charset=utf-8');

	if(!$user->uid) {
		drupal_add_http_header("Status", 401);
		return drupal_json_output(array("result" => t("Per inviare una notifica bisogna essere loggati")));
	}

	$data = drupal_json_decode(file_get_contents("php://input"));
	
	if(in_array($data['event_id'], $skepticals)){
		$usr_status = array("uid" => $user->uid, "status" => $data['status']);
		array_push($skepticals['usrskeprtical'], $usr_status);
	}

	_citynotifier_update_status_event($data['event_id'], _citynotifier_get_index_or_value_status($data['status']));

	drupal_add_http_header("Status", 200);
	return drupal_json_output(array("result" => t("notifica inviata con successo")));
}

function _citynotifier_update_status_event($event_id, $status){
	$query = db_select("citynotifier_event", 'ce')
		->fields('ce', array('type','subtype','status'))
		->condition('ce.event_id', $event_id, '=');
	$event = $query->execute()->fetchAssoc();

	$event['status'] = $status;

	drupal_write_record("citynotifier_event", $event, $event_id);
}


function _citynotifier_create_event($data) {
	extract(_citynotifier_get_index_type_subtype($data), EXTR_OVERWRITE);

	$record = array (
		"type" => $type,
		"subtype" => $subtype,
		"status" => _citynotifier_get_index_or_value_status("open"),
	);

	drupal_write_record("citynotifier_event", $record);

	return $record['event_id'];
}

function _citynotifier_get_range_subtype($type, $subtype){
  $types = variable_get('citynotifier_settings_types', "");
  foreach($types[$type] as $st)
    if($st['subtype'] == $subtype) return $st['range'];
  
  return FALSE;
}

function _citynotifier_check_event($data) {
	$range = _citynotifier_get_range_subtype($data['type']['type'], $data['type']['subtype']);
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
    if(!in_array($data['status'], variable_get('citynotifier_settings_status', array())))
      return array("code" => 406, "response" => t('Status non valido'));
    if(!is_int($data['timemin']))
      return array("code" => 406, "response" => t('Timemin non valido'));
    if(!is_int($data['timemax']))
      return array("code" => 406, "response" => t('Timemax non valido'));
  }
  
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

/**
 * Get data from request $_GET and return a normalize $data
 *
 * @param $data=$_GET from request or report
 * @return $data normalize
 */
function _citynotifier_normalize_data($data) {
  if(isset($data['type']['type'])) {
    $data['subtype'] = $data['type']['subtype'];
    $data['type'] = $data['type']['type'];
  }
    
  $type_cast = array('lat' => 'floatval', 'lng' => 'floatval', 'radius' => 'intval', 'timemax' => 'intval', 'timemin' => 'intval');
  foreach($type_cast as $type => $cast)
    if(isset($data[$type]))
      eval("\$data['" . $type . "']=" . $cast . "(\"" . $data[$type] . "\");");
  return $data;
}

/**
 * Function get index of type and subtype from $data
 *
 * @param $data
 * @return array("type" => index_of_type_in_types, "subtype" => index_of_subtype_in_relative_type)
 */
function _citynotifier_get_index_type_subtype($data) {
  $types = array_map("_citynotifier_get_map_subtype", variable_get('citynotifier_settings_types', array()));
  
  return array("type" => array_search($data['type'], array_keys($types)),
               "subtype" => array_search($data['subtype'], $types[$data['type']]));
}

/**
 * Function callback for array_map in _citynotifier_get_index_type_subtype
 *
 * @param array('type' => type, 'range' => 'range')
 * @return array(type)
 */
function _citynotifier_get_map_subtype($subtypes) {
  $result = array();
  foreach($subtypes as $subtype) {
    $result[] = $subtype['subtype'];
  };
  return $result;
}


function _citynotifier_get_index_or_value_status($status, $getvalue = null){
	$array_status = array(0 => "archived", 1 => "open", 2 => "closed", 3 => "skeptical", 4 => "all");

	if($getvalue)
		return $array_status[$status];
	return array_search($status, $array_status);
}

function _citynotifier_get_value_type_subtype_from_index($index_type, $index_subtype){
	$types = array_map("_citynotifier_get_map_subtype", variable_get('citynotifier_settings_types', array()));
	$type=array_keys($types);
	return array("type" => $type[$index_type], "subtype" => $types[$type[$index_type]][$index_subtype]);
}

function _citynotifier_get_local_event($data) {
	$status = _citynotifier_get_index_or_value_status($data['status']);
	extract(_citynotifier_get_index_type_subtype($_GET, 1), EXTR_OVERWRITE);

/*	$lonmin = $_GET['lng']-$_GET['radius']/abs(cos(deg2rad($_GET['lat']))*69);
	$lonmax = $_GET['lng']+$_GET['radius']/abs(cos(deg2rad($_GET['lat']))*69);

	$latmin = $_GET['lat']-($_GET['radius']/69);
	$latmax = $_GET['lat']+($_GET['radius']/69);*/

	$query = db_select("citynotifier_event", 'ce');
	$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
	$query->fields('ce', array('event_id', 'status'));
	$query->fields('cn', array('type','subtype','lat','lng'));
	$query->addExpression('MAX(cn.created)', 'freshness');
	$query->addExpression('MIN(cn.created)', 'start');
	$query->addExpression(('6371 * 2 * ASIN(SQRT(POWER(SIN(('.$_GET['lat'].' - lat) * pi()/180 / 2), 2) +COS('.$_GET['lat'].' * pi()/180) * COS(lat * pi()/180) *POWER(SIN(('.$_GET['lng'].' - lng) * pi()/180 / 2), 2) ))'), 'distance');

	if($type){
		$query->condition('ce.type', $type, '=');
		if($subtype)
			$query->condition('ce.subtype', $subtype, '=');
	}
		/*->condition('cn.lat', $latmin,'>')
		->condition('cn.lat', $latmax,'<')
		->condition('cn.lng', $lonmax,'>')
		->condition('cn.lng', $lonmin,'<')*/
	if($status != _citynotifier_get_index_or_value_status("all"))
		$query->condition('ce.status', $status,'=');

	$query->havingCondition('freshness', $_GET['timemin'], '>')
		->havingCondition('freshness', $_GET['timemax'], '<')
		->havingCondition('distance', $_GET['radius'], '<');
	$query->groupBy('ce.event_id');

	$events = $query->execute();//->fetchAll();

	$events_result = array();

//citynotifier_debug($events);
	foreach($events as $event){

		$event_result = array();
		$event_result['event_id'] = $event->event_id;
		$event_result['type'] = _citynotifier_get_value_type_subtype_from_index($event->type, $event->subtype);
		$event_result['status'] = _citynotifier_get_index_or_value_status($event->status, 1);
		$event_result['start_time'] = $event->start;
		$event_result['freshness'] = $event->freshness;

		$query = db_select("citynotifier_event", 'ce');
		$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
		$query->addExpression('COUNT(*)', 'number_of_notifications');
		$query->condition('ce.event_id', $event->event_id, '=');
		$query->groupBy('ce.event_id');
		$nOn = $query->execute()->fetchAssoc();

		$event_result['number_of_notifications'] = $nOn['number_of_notifications'];

		$query = db_select("citynotifier_event", 'ce');
		$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
		$query->fields('cn', array('uid', 'lat','lng','description'));
		$query->condition('ce.event_id', $event->event_id, '=');
		$fetched_res = $query->execute()->fetchAll();

		$locations = array();
		$descriptions = array();
		$sum = 0;

		foreach($fetched_res as $res){
			$profile = user_load($res->uid);

			$rep = $profile->reputation;

			$ass = citynotifier_get_assiduity($res->uid);
			$sum += (1 + $rep['und'][0]['value'] * $ass);

			$location = array();
			$location['lat'] = $res->lat;
			$location['lng'] = $res->lng;
			array_push($locations, $location);
			array_push($descriptions, $res->description);
		}

		$reliability = $sum/(2*$nOn['number_of_notifications']);

		$event_result['reliability'] = $reliability;
		$event_result['description'] = $descriptions;
		$event_result['locations'] = $locations;
		array_push($events_result, $event_result);
	}
//citynotifier_debug($events_result);
	return $events_result;
}

function citynotifier_get_assiduity($uid) {
	$query = db_select("citynotifier_notify", 'cn');
	$query->addExpression('COUNT(*)', 'assiduity');
	$query->condition('cn.uid', $uid, '=');

	$nOn = $query->execute()->fetchAll();

	$assiduity = $non->assiduity * 0.1;

	if($assiduity > 1)
		$assiduity = 1;

	return $assiduity;
}


function citynotifier_get_subscribed_servers() {
  $result = array();
  $servers = variable_get('citynotifier_settings_servers', '');
  foreach($servers as $server) {
    if($server["subscribed"])
      $result[] = array("name" => $server["name"], "url" => $server["url"]);
  }
  return $result;
}


