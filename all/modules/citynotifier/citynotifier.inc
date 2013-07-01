<?php

function citynotifier_notify() {
	global $user;
	header('Content-type: application/json; charset=utf-8');

	if(!$user->uid) {
		drupal_add_http_header("Status", 401);
		return drupal_json_output(array("result" => t("Per inviare una notifica bisogna essere loggati")));
	}

	$data = drupal_json_decode(file_get_contents("php://input"));
	
	if(!_citynotifier_check_skeptical($event_id)){
		_citynotifier_update_status_event($data['event_id'], _citynotifier_get_index_status($data['status']));
	}
	else{
	//caso scettico cosa fare?
	}

	drupal_add_http_header("Status", 200);
	return drupal_json_output(array("result" => t("notifica inviata con successo")));
}

function _citynotifier_check_skeptical($event_id){
	$query = db_select("citynotifier_event", 'ce')
		->fields('ce', array('status'))
		->condition('ce.event_id', $event_id, '=');
	$event = $query->execute()->fetchAssoc();

	if($event['status'] == _citynotifier_get_index_status("skeptical"))
		return 	TRUE;
	else
		return FALSE;
}

function _citynotifier_update_status_event($event_id, $status){
	$query = db_select("citynotifier_event", 'ce')
		->fields('ce', array('status'))
		->condition('ce.event_id', $event_id, '=');
	$event = $query->execute()->fetchAssoc();

	$event['status'] = $status;

	if(!drupal_write_record("citynotifier_event", $event, $event_id)) {
		watchdog('citynotifier', t("Errore nella memorizzazione nel database") . '<pre>'. print_r($data, TRUE) .'</pre>', WATCHDOG_DEBUG);
		drupal_add_http_header("Status", 500);
		echo drupal_convert_to_utf8(drupal_json_encode(array("result" => t("Errore nella memorizzazione nel database"))));
		return;
	};
}


function _citynotifier_create_event() {
  $data = array("status" => _citynotifier_get_index_status('open'));
	drupal_write_record("citynotifier_event", $data);
	return $data['event_id'];
}

function _citynotifier_get_range_subtype($type, $subtype){
  $types_subtypes = variable_get('citynotifier_settings_types_subtypes', array());

  foreach($types_subtypes[$type] as $st)
    if($st['subtype'] == $subtype) return $st['range'];

  return FALSE;
}

/**
 * Get matched event to notify
 *
 * @param $data
 * @return $event matched or array("event_id"=>FALSE, "status"=>FALSE) if no match
 */
function _citynotifier_get_matched_event($data) {
	$type_subtype = _citynotifier_get_value_type_subtype_from_index($data['type'], $data['subtype']); 
	$range = _citynotifier_get_range_subtype($type_subtype['type'], $type_subtype['subtype']);

	$query = db_select("citynotifier_event", 'ce');
	$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
	$query->fields('ce', array('event_id','status'))
		->condition('cn.type', $data['type'], '=')
		->condition('cn.subtype', $data['subtype'], '=')
		->condition('cn.lat', $data['lat']-$range,'>')
		->condition('cn.lat', $data['lat']+$range,'<')
		->condition('cn.lng', $data['lng']-$range,'>')
		->condition('cn.lng', $data['lng']+$range,'<')
		->orderby('cn.created', 'DESC');
	$event = $query->execute()->fetchAssoc();
	
	return $event?$event:array("event_id"=>FALSE, "status"=>FALSE);
}

/**
 * Get matched remote event
 *
 * @param $data_remote 
 * @return $event matched or array("event_id"=>FALSE, "status"=>FALSE) if no match
 */
function _citynotifier_get_matched_remote_event($data_remote_event) {
   $same_event = TRUE;
   $event['event_id'] = TRUE;
   $i = 0;
   
   while($same_event && $event['event_id']) {
     $event = _citynotifier_get_matched_event(array('lat' => $data_remote_event['locations'][$i]['lat'],
                                                    'lng' => $data_remote_event['locations'][$i]['lng'],
                                                    'type' => $data_remote_event['type'],
                                                    'subtype' => $data_remote_event['subtype']));
     if($i <> 0 && $event <> $prev_event)
       $same_event = FALSE;
     
     $prev_event = $event;
     $i++;
   };
   return $same_event?$event:array("event_id"=>FALSE, "status"=>FALSE);
}

function _citynotifier_validate($data, $function_type=NULL) {
  switch($function_type) {
  case "request":
    if($data['scope'] <> "local" && $data['scope'] <> "remote")
      return array("code" => 406, "response" => t('Scope non valido'));
    if(!$data['radius'])
      return array("code" => 406, "response" => t('Radius non valido'));
    if($data['status'] <> FALSE)
      return array("code" => 406, "response" => t('Status non valido'));
    if(!$data['timemin'])
      return array("code" => 406, "response" => t('Timemin non valido'));
    if(!$data['timemax'])
      return array("code" => 406, "response" => t('Timemax non valido'));
  }
  
  if($data['type'] === FALSE)
    return array("code" => 406, "response" => t('Type non valido'));
  
  if($data['subtype'] === FALSE)
    return array("code" => 406, "response" => t('Subtype non valido'));
  
  if(!$data['lat'])
    return array("code" => 406, "response" => t('Latitudine non valida'));
  
  if(!$data['lng'])
    return array("code" => 406, "response" => t('Longitudine non valida'));
  
  return array("code" => 200, "response" => '');
}

/**
 * Get data from request $_GET and return a $data array
 *
 * @param $data=$_GET from request or report
 * @return $data
 */
function _citynotifier_citynotifier2data($data) {
  if(is_array($data['type'])) {
    $data['subtype'] = $data['type']['subtype'];
    $data['type'] = $data['type']['type'];
  }

  extract(_citynotifier_get_index_type_subtype($data), EXTR_OVERWRITE);
  $data['type'] = $type;
  $data['subtype'] = $subtype;

  if($data['status'])
    $data['status'] = _citynotifier_get_index_status($data['status']);

  $type_cast = array('lat' => 'floatval(%)', 'lng' => 'floatval(%)',
                     'radius' => 'intval(%)', 'timemax' => 'intval(%)',
                     'timemin' => 'intval(%)', 'description' => 'truncate_utf8(%, 255)');
  foreach($type_cast as $type => $cast) {
    if(isset($data[$type]))
      eval("\$data['" . $type . "']=" . str_replace("%", "\$data['" . $type . "']", $cast) . ";");
  }

  return $data;
}

/**
 * Transform $data to an alike citynotifier's protocol array
 *
 * @param $data
 * @return result
 */
function _citynotifier_data2citynotifier($data) {
  $statuses = variable_get('citynotifier_settings_statuses', array());
  $types_subtypes = array_map("_citynotifier_get_map_subtype", variable_get('citynotifier_settings_types_subtypes', array()));
  $types = array_keys($types_subtypes);

  $data['subtype'] = $types_subtypes[$types[$data['type']]][$data['subtype']];
  $data['type'] = $types[$data['type']];
  unset($data['q']);
  $data['status'] = $statuses[$data['status']];
  return $data;
}


/**
 * Function get index of type and subtype from $data
 *
 * @param $data
 * @return array("type" => index_of_type_in_types, "subtype" => index_of_subtype_in_relative_type)
 */
function _citynotifier_get_index_type_subtype($data) {
  $types_subtypes = array_map("_citynotifier_get_map_subtype", variable_get('citynotifier_settings_types_subtypes', array()));
  return array("type" => array_search($data['type'], array_keys($types_subtypes)),
               "subtype" => array_search($data['subtype'], $types_subtypes[$data['type']]));
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


function _citynotifier_get_index_status($status){
	return array_search($status, variable_get('citynotifier_settings_statuses', array()));
}

function _citynotifier_get_value_type_subtype_from_index($index_type, $index_subtype){
	$types_subtypes = array_map("_citynotifier_get_map_subtype", variable_get('citynotifier_settings_types_subtypes', array()));
	$type = array_keys($types_subtypes);

	return array("type" => $type[$index_type], "subtype" => $types_subtypes[$type[$index_type]][$index_subtype]);
}

function _citynotifier_get_local_event($data) {
	$statuses = variable_get('citynotifier_settings_statuses', array());

	$query = db_select("citynotifier_event", 'ce');
	$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
	$query->fields('ce', array('event_id', 'status'));
	$query->fields('cn', array('type','subtype','lat','lng'));
	$query->addExpression('MAX(cn.created)', 'freshness');
	$query->addExpression('MIN(cn.created)', 'start');
	$query->addExpression(('6371 * 2 * ASIN(SQRT(POWER(SIN(('.$data['lat'].' - lat) * pi()/180 / 2), 2) +COS('.$data['lat'].' * pi()/180) * COS(lat * pi()/180) *POWER(SIN(('.$data['lng'].' - lng) * pi()/180 / 2), 2) ))'), 'distance');

	switch($data['subtype']) {
	case 0:
	  $db_or = db_or();
	  $db_and = db_and();
	  $types_subtypes = array_map("_citynotifier_get_map_subtype", variable_get('citynotifier_settings_types_subtypes', array()));
    $types = array_keys($types_subtypes);
	  foreach($types_subtypes[$types[$data['type']][$data['subtype']]] as $index_subtype => $subtype) {
	    $db_and->condition('cn.type', $data['type'], '=');
	    $db_and->condition('cn.subtype', $index_subtype, '=');
	    $db_or->condition($db_and);
	    $query->condition($db_or); 
	  }
	  break;
	default:
	  $query->condition('cn.type', $data['type'], '=');
	  $query->condition('cn.subtype', $data['subtype'], '=');
	  break;
	}
	  
	if($data['status'])
		$query->condition('ce.status', $data['status'],'=');


	$query->havingCondition('freshness', $data['timemin'], '>')
		->havingCondition('freshness', $data['timemax'], '<')
		->havingCondition('distance', $data['radius']/1000, '<');
	$query->groupBy('ce.event_id');

	$events = $query->execute();//->fetchAll();

	$result = array();

	foreach($events as $event){

		$event_result = array();
		$event_result['event_id'] = $event->event_id;
		$event_result['type'] = _citynotifier_get_value_type_subtype_from_index($event->type, $event->subtype);
		$event_result['status'] = $statuses[$event->status];
		$event_result['start_time'] = (int)$event->start;
		$event_result['freshness'] = (int)$event->freshness;

		$query = db_select("citynotifier_event", 'ce');
		$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
		$query->addExpression('COUNT(*)', 'number_of_notifications');
		$query->condition('ce.event_id', $event->event_id, '=');
		$query->groupBy('ce.event_id');
		$nOn = $query->execute()->fetchAssoc();

		$event_result['number_of_notifications'] = (int)$nOn['number_of_notifications'];

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
			$location['lat'] = (float)$res->lat;
			$location['lng'] = (float)$res->lng;
			array_push($locations, $location);
			array_push($descriptions, $res->description);
		}

		$reliability = $sum/(2*$nOn['number_of_notifications']);

		$event_result['reliability'] = (float)$reliability;
		$event_result['description'] = $descriptions;
		$event_result['locations'] = $locations;
		array_push($result, $event_result);
	}

	return $result;
}

function citynotifier_get_assiduity($uid) {
	$a = 1728000;
	$time = time() - $a;

	$query = db_select("citynotifier_notify", 'cn');
	$query->addExpression('COUNT(*)', 'assiduity');
	$query->condition('cn.uid', $uid, '=')
		->condition('cn.created', $time, '>');

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

function citynotifier_http_get_request($url, $query) {
  $options = array(
    'headers' => array(
      'Accept' => 'application/json',
      ),
    'method' => 'GET',
    'timeout' => 5,
    'max_redirects' => 6,
    );
  
  $response = drupal_http_request($url . "?" . http_build_query($query), $options);
  return drupal_json_decode(utf8_decode($response->data));
}


/**
 * Asynchronous http request
 *
 * @param $url and $query
 * @return array("fp" => $fp, "errno" => $errno, "errstr" => $errstr)
 */
 
function citynotifier_get_fp_for_asynchronous_http_get_request($url, $query) {
  foreach ($query as $key => &$val) {
    if (is_array($val)) $val = implode(',', $val);
    $get_params[] = $key.'='.urlencode($val);
  }
  $get_string = implode('&', $get_params);
  
  $parts=parse_url($url);
  
  $fp = fsockopen($parts['host'],
    isset($parts['port'])?$parts['port']:80,
    $errno, $errstr, 5);
  
  $out = "GET ".$parts['path'].'?'.$get_string." HTTP/1.1\r\n";
  $out.= "Host: ".$parts['host']."\r\n";
  $out.= "Content-Type: application/json; charset=utf-8\r\n";
  $out.= "Content-Length: ".strlen($post_string)."\r\n";
  $out.= "Connection: Close\r\n\r\n";
  
  fwrite($fp, $out);
  
  return array("fp" => $fp, "errno" => $errno, "errstr" => $errstr);
}

function _citynotifier_get_remote_event($data){
	$servers = citynotifier_get_subscribed_servers();
	$fp = array();
	$result = array();

	foreach($servers as $server) {
		$pointer = citynotifier_http_get_request_asynchronous($server['url'] . "/richieste", $data);
		$fp[] = array("pointer" => $pointer, "server" => $server['name']);
		$result[$server['name']] = '';
	}

	while(!empty($fp)) {
		foreach($fp as $index => $f) {
			$out = fgets($f['pointer']);
			if (!$out) {
				fclose($f['pointer']);
				unset($fp[$index]);
			}
			$result[$f['server']] = $result[$f['server']] . $out;
		}
	}

	foreach($result as $index => $data) {
		$out = explode("\r\n\r\n", $result[$index]);
		$result[$index] = drupal_json_decode($out[1]);
	}
	return $result;
}

function _citynotifier_check_remote_events($events){
	foreach($events as $i => $event){
		$id = _citynotifier_check_existing_event($event);
		if($id['event_id'])
			$events[$i]['event_id'] = $id['event_id'];
		else
		//da vedere bene cosa fare in questo caso
			$events[$i]['event_id'] = _citynotifier_create_event();
	}

	return $events;
}

function _citynotifier_check_existing_event($event){
	$range = _citynotifier_get_range_subtype($event['type']['type'], $event['type']['subtype']);
	extract(_citynotifier_get_index_type_subtype($event['type']), EXTR_OVERWRITE);

	$query = db_select("citynotifier_event", 'ce');
	$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
	$query->fields('ce', array('event_id'))
		->condition('cn.type', $type, '=')
		->condition('cn.subtype', $subtype, '=')
		->condition('ce.status', $event['status'], '=')
		->condition('cn.lat', $event['locations']['lat']-$range,'>')
		->condition('cn.lat', $event['locations']['lat']+$range,'<')
		->condition('cn.lng', $event['locations']['lng']-$range,'>')
		->condition('cn.lng', $event['locations']['lng']+$range,'<')
		->orderby('cn.created', 'DESC');
	$result = $query->execute()->fetchAssoc();

	return $result?$result:array("event_id"=>FALSE);
}

function citynotifier_debug($data) {
  if (is_array($data) || is_object($data))
    $data = print_r($data, TRUE);
  $data .= "\n";
  error_log($data, 3, "/tmp/citynotifier_debug.log");
}
