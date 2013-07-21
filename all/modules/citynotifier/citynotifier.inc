<?php

/********************** EVENT FUNCTION **********************/

function citynotifier_create_event($data) {
	$data['last_update'] = time();
	drupal_write_record("citynotifier_event", $data);
	return $data['event_id'];
}

function citynotifier_get_event($data) {
	$query = db_select("citynotifier_event", 'ce')
		       ->fields('ce', array('event_id', 'status', 'lat', 'lng', 'last_update', 'street_number',
		                            'route', 'locality', 'administrative_area_level_3', 'administrative_area_level_2',
		                            'administrative_area_level_1', 'country', 'postal_code'))
		       ->condition('ce.event_id', $data['event_id'], '=');
	return $query->execute()->fetchAssoc();
}

function _citynotifier_get_event_status($event_id){
	$query = db_select("citynotifier_event", 'ce')
		->fields('ce', array('status'))
		->condition('ce.event_id', $event_id, '=');
	$event = $query->execute()->fetchAssoc();

	return $event['status'];
}
function _citynotifier_check_status($event_id, $status){
	$query = db_select("citynotifier_event", 'ce')
		->fields('ce', array('status'))
		->condition('ce.event_id', $event_id, '=');
	$event = $query->execute()->fetchAssoc();

	if($event['status'] == $status)
		return 	TRUE;
	else
		return FALSE;
}

function _citynotifier_update_event($event){
	$event['last_update'] = time();
	if(!drupal_write_record("citynotifier_event", $event, 'event_id')) {
		watchdog('citynotifier', t("Errore nella memorizzazione nel database") . '<pre>'. print_r($data, TRUE) .'</pre>', WATCHDOG_DEBUG);
		drupal_add_http_header("Status", 500);
		echo drupal_convert_to_utf8(drupal_json_encode(array("result" => t("Errore nella memorizzazione nel database"))));
		return;
	};
}




function _citynotifier_get_range_subtype($type, $subtype){
  $types_subtypes = variable_get('citynotifier_settings_types_subtypes', array());

  foreach($types_subtypes[$type] as $st)
    if($st['subtype'] == $subtype) return $st['range'];

  return FALSE;
}

function _citynotifier_get_event_freshness($event_id){
	$query = db_select("citynotifier_event", 'ce');
	$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
	$query->addExpression('MAX(cn.created)', 'freshness');
	$query->condition('cn.event_id', $event_id, '=');
	$event = $query->execute()->fetchAssoc();

	return $event['freshness'];
}

/**
 * Get matched event to notify
 *
 * @param $data
 * @return $event matched or array("event_id"=>FALSE, "status"=>FALSE) if no match
 */
function citynotifier_get_matched_event($data) {
	extract(_citynotifier_get_value_type_subtype_from_index($data['type'], $data['subtype'])); 
	$range = _citynotifier_get_range_subtype($type, $subtype);

		/* 3 casi: 2 notifiche 
		   1) vicine ma su vie diverse => 2 eventi diversi
		   2) 2 notifiche vicine sulla stessa via => stesso evento
		   3) 2 notifiche lontane sulla stessa via o meno ma fuori dal range => 2 eventi diversi
		*/
	$query = db_select("citynotifier_event", 'ce');
	$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');

	$query->fields('ce', array('event_id', 'status'));
	$query->fields('cn', array('lng', 'lat', 'street_number', 'route', 'locality',
		'administrative_area_level_3', 'administrative_area_level_2', 'administrative_area_level_1',
		'country', 'postal_code'));

	$query->condition('cn.type', $data['type'], '=')
		->condition('cn.subtype', $data['subtype'], '=')
		->condition('cn.lat', $data['lat']-$range,'>')
		->condition('cn.lat', $data['lat']+$range,'<')
		->condition('cn.lng', $data['lng']-$range,'>')
		->condition('cn.lng', $data['lng']+$range,'<');

	if($type == "problemi_stradali" && $subtype == "coda")
		$query->condition('cn.route', $data['route'],'=');

	$query->orderby('cn.created', 'DESC');
	$event = $query->execute()->fetchAssoc();

	return $event;
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
     $event = citynotifier_get_matched_event(array('lat' => $data_remote_event['locations'][$i]['lat'],
                                                    'lng' => $data_remote_event['locations'][$i]['lng'],
                                                    'type' => $data_remote_event['type'],
                                                    'subtype' => $data_remote_event['subtype']));
     if($i <> 0 && $event <> $prev_event)
       $same_event = FALSE;
     
     $prev_event = $event;
     $i++;
     if(!$data_remote_event['locations'][$i]['lat'])
     	break;
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
    if($data['status'] === FALSE)
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
    $data['status'] = citynotifier_get_index_status($data['status']);
  
  if($data['index_id'])
    $data['index_id'] = citynotifier_decode_event_id($data['index_id']);
    
  
  if(!$data['route'] || !$data['street_number']) {
    $address = _citynotifier_get_address_from_point($data);
    if($address)
      $data += $address;
    else
      watchdog('citynotifier', t("Errore geocoding.") . '<pre>'. print_r($data, TRUE) .'</pre>', WATCHDOG_DEBUG);
  }
  

  $type_cast = array('lat' => 'floatval(%)', 'lng' => 'floatval(%)',
                     'radius' => 'intval(%)', 'timemax' => 'intval(%)',
                     'timemin' => 'intval(%)', 'description' => 'truncate_utf8(%, 255)',
                     'street_number' => 'truncate_utf8(%, 10)', 'route' => 'truncate_utf8(%, 50)',
                     'locality' => 'truncate_utf8(%, 50)', 'administrative_area_level_3' => 'truncate_utf8(%, 50)',
                     'administrative_area_level_2' => 'truncate_utf8(%, 50)', 'administrative_area_level_1' => 'truncate_utf8(%, 50)',
                     'country' => 'truncate_utf8(%, 50)', 'postal_code' => 'truncate_utf8(%, 10)',
                     'event_id' => 'citynotifier_decode_event_id(%)');
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



function _citynotifier_get_address_from_point($data) {
  $options['language'] = "it";
  $address = geocoder_reverse('google', $data['lat'], $data['lng'], $options);
  
  if(!$address)
    return FALSE;
  
  $result = array();
  
  foreach($address->data['geocoder_address_components'] as $component)
    $result[$component->types[0]] = $component->long_name;

  return $result;
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


function citynotifier_get_index_status($status){
	return array_search($status, variable_get('citynotifier_settings_statuses', array()));
}

function _citynotifier_get_value_type_subtype_from_index($index_type, $index_subtype){
	$types_subtypes = array_map("_citynotifier_get_map_subtype", variable_get('citynotifier_settings_types_subtypes', array()));
	$type = array_keys($types_subtypes);

	return array("type" => $type[$index_type], "subtype" => $types_subtypes[$type[$index_type]][$index_subtype]);
}


function citynotifier_get_assiduity($uid) {
	$subquery = db_select("citynotifier_notify", 'cn')->groupBy('cn.uid');
	$subquery->fields('cn', array('uid'));
	$subquery->addExpression('COUNT(*)', 'count');
	
	$query = db_select("users", 'u');
	$query->fields('u', array('uid'));
	$query->addExpression('MAX(cn.count)', 'max');
  $query->join($subquery,'cn', 'cn.uid=u.uid');
	$notifications = $query->execute()->fetchAll();
	
	if(!$notifications[0]->max)
	  return 0;
	  
	$query = db_select("citynotifier_notify", 'cn');
	$query->fields('cn', array('uid'))->condition('cn.uid', $uid, '=');
	$query->addExpression('COUNT(*)', 'count');
	
	$notifications_by_user = $query->execute()->fetchAll();

	return (float)(count(citynotifier_get_notifications_by_user($uid))/(int)$notifications[0]->max);
}

function citynotifier_get_reputation($uid) {
  $user = user_load($uid);
  return $user->reputation['und'][0]['value'];
}

function citynotifier_set_reputation($uid, $reputation) {
  $user = user_load($uid);
  $user->reputation['und'][0]['value'] = $reputation;
  user_save($uid);
}

function citynotifier_get_notifications_by_user($uid) {
  $query = db_select("citynotifier_notify", 'cn');
  $query->fields('cn', array('uid', 'lat','lng','description'));
  $query->condition('cn.uid', $uid, '=');
  return $query->execute()->fetchAll();
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
  $get_string = drupal_http_build_query($query);
  $parts=parse_url($url);
  
  $fp = fsockopen($parts['host'],
    isset($parts['port'])?$parts['port']:80,
    $errno, $errstr, 5);
  
  $out = "GET ".$parts['path'].'?'.$get_string." HTTP/1.1\r\n";
  $out.= "Host: ".$parts['host']."\r\n";
  $out.= "Content-Type: application/json; charset=utf-8\r\n";
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

function citynotifier_debug($data) {
  if (is_array($data) || is_object($data))
    $data = print_r($data, TRUE);
  $data .= "\n";
  error_log($data, 3, "/tmp/citynotifier_debug.log");
}


function citynotifier_file_get_contents_utf8($fn) {
     $content = file_get_contents($fn);
      return mb_convert_encoding($content, 'UTF-8',
          mb_detect_encoding($content, 'UTF-8, ISO-8859-1', true));
}


function citynotifier_encode_event_id($event_id, $url) {
  if(!preg_match("/(?:http[s]*\:\/\/)*(.*?)\.(?=[^\/]*\..{2,5})/", $url, $matches))
    return FALSE;
  return $matches[1] . "_" . $event_id;
}

function citynotifier_decode_event_id($event_id) {
  $result = explode("_", $event_id);
  
  if($result[1])
    return (int)$result[1];
  
  return (int)$result[0];
}

function citynotifier_sync() {
	$query = db_select('citynotifier_event', 'ce');
	$query->fields('ce', array('event_id', 'status', 'last_update'))
		->condition('ce.status', citynotifier_get_index_status("skeptical"), '=');
	$skeptical_events = $query->execute()->fetchAll();

	foreach ($skeptical_events as $skeptical_event) {
		if($skeptical_event->last_update < time()-variable_get('citynotifier_settings_waiting_skeptical', 0)){
			$query = db_select('citynotifier_notify', 'cn');
			$query->fields('cn', array('uid', 'status'))
				->distinct()
				->condition('cn.created', $skeptical_event->last_update, '>')
				->condition('cn.event_id', $skeptical_event->event_id, '=');
			$query->orderby('cn.created', 'DESC');
			$usr_notifications = $query->execute()->fetchAll();

			$open = $close = 0;

			foreach ($usr_notifications as $notification) {
				if ($notification->status == citynotifier_get_index_status("open")) {
					$open += 1;
				}
				elseif ($notification->status == citynotifier_get_index_status("close")) {
					$close += 1;
				}
			}

			if ($open == $close)
				continue;

			switch ($open > $close) {
				case TRUE:
					citynotifier_increase_decrease_reputation($usr_notifications, citynotifier_get_index_status("open"));
					$event = array('event_id' => $skeptical_event->event_id, 'status' => citynotifier_get_index_status("open"));
					break;
				
				case FALSE:
					citynotifier_increase_decrease_reputation($usr_notifications, citynotifier_get_index_status("close"));
					$event = array('event_id' => $skeptical_event->event_id, 'status' => citynotifier_get_index_status("close"));
					break;
				default:
					break;
			}
			_citynotifier_update_event($event);
		}
	}
}

function citynotifier_increase_decrease_reputation($usr_notifications, $status_inc) {
	foreach ($usr_notifications as $notification) {
		$reputation = citynotifier_get_reputation($notification->uid);
		if ($notification->status == $status_inc) 
			$reputation += 0.1;
		else
			$reputation -= 0.1;
		citynotifier_set_reputation($notification->uid, $reputation);
	}
}

function citynotifier_sync_fading() {
	$query = db_select('citynotifier_event', 'ce');
	$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
	$query->fields('ce', array('event_id', 'status'));
	$query->fields('cn', array('type', 'subtype'));
	$query->addExpression('MAX(cn.created)', 'freshness');
	$query->condition('ce.status', citynotifier_get_index_status("open"), '=');
	$events = $query->execute()->fetchAll();

	
	foreach ($events as $event) {
		$fading = citynotifier_get_fading($event);
		if ($event->freshness < time() - $fading) {
			$event_update = array('event_id' => $event->event_id, 'status' => citynotifier_get_index_status("close"));
			_citynotifier_update_event($event_update);
		}
	}
}

function citynotifier_get_fading($event) {
	$types_subtypes = variable_get('citynotifier_settings_types_subtypes', array());

	foreach($types_subtypes[$event->type] as $st)
	  if($st['subtype'] == $event->subtype) return $st['fading'];

	return FALSE;
}
