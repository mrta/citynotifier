<?php

/********************** EVENT FUNCTION **********************/

function citynotifier_create_event($data) {
	$data['last_update'] = time();
	drupal_write_record("citynotifier_event", $data);
	return $data['event_id'];
}

function citynotifier_update_event($event, $mode = NULL){
/*	$notifications = citynotifier_get_notify_of_event($event);
  extract(_citynotifier_get_value_type_subtype_from_index($event->type, $event->subtype));
	
	if ((citynotifier_get_range_subtype($type, $subtype)) >= l_range &&
	  count($notifications) == 3 && $mode == 'update_location') {
    foreach($notifications as $notify) {
      $lat += $notify->lat;
      $lng += $notify->lng;
    }
    $event['lat'] = $lat/count($notifications);
    $event['lng'] = $lng/count($notifications);
    
    $update_location = citynotifier_get_address_from_point($data);
    if($update_location)
      $event = array_merge($event, $update_location);
    else
      watchdog('citynotifier', t("Errore geocoding.") . '<pre>'. print_r($event, TRUE) .'</pre>', WATCHDOG_DEBUG);
	};
*/	
	$event->last_update = time();
	return drupal_write_record("citynotifier_event", $event, 'event_id');
}


function citynotifier_get_event($data) {
	$query = db_select("citynotifier_event", 'ce')
		       ->fields('ce', array('event_id', 'status', 'lat', 'lng', 'last_update', 'street_number',
		                            'route', 'locality', 'administrative_area_level_3', 'administrative_area_level_2',
		                            'administrative_area_level_1', 'country', 'postal_code'))
		       ->condition('ce.event_id', $data['event_id'], '=');
	return $query->execute()->fetchAssoc();
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


/**
 * Get matched event to notify
 *
 * @param $data
 * @return $event matched or array("event_id"=>FALSE, "status"=>FALSE) if no match
 */
function citynotifier_get_matched_event($data) {
	extract(_citynotifier_get_value_type_subtype_from_index($data['type'], $data['subtype'])); 
	$range = citynotifier_get_range_subtype($type, $subtype);

	$query = db_select("citynotifier_event", 'ce');
	$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');

	$query->fields('ce', array('event_id', 'status'));
	$query->fields('cn', array('lng', 'lat', 'type', 'subtype', 'street_number', 'route', 'locality',
		'administrative_area_level_3', 'administrative_area_level_2', 'administrative_area_level_1',
		'country', 'postal_code'));
  $query->addExpression(('(6371 * 2 * ASIN(SQRT(POWER(SIN(('.$data['lat'].' - cn.lat) * pi()/180 / 2), 2) +COS('.$data['lat'].' * pi()/180) * COS(cn.lat * pi()/180) *POWER(SIN(('.$data['lng'].' - cn.lng) * pi()/180 / 2), 2) )))*1000'), 'distance');

	$query->condition('cn.type', $data['type'], '=')
		->condition('cn.subtype', $data['subtype'], '=')
    ->condition('ce.status', citynotifier_get_index_status("archived"), '<>');
  $query->havingCondition('distance', $range, '<');
	$query->orderby('cn.created', 'DESC');
  $events = $query->execute()->fetchAll();//fetchAssoc();

  foreach ($events as $event) {
    extract(_citynotifier_get_value_type_subtype_from_index($event->type, $event->subtype)); 

    if($type == "problemi_stradali" && $subtype == "coda"){
      $distance = min(citynotifier_get_driving_distance(array('lat' => $event->lat, 'lng' => $event->lng), array('lat' => $data['lat'], 'lng' => $data['lng'])), citynotifier_get_driving_distance(array('lat' => $data['lat'], 'lng' => $data['lng']),array('lat' => $event->lat, 'lng' => $event->lng)));

      if ($distance > $range)
        continue; 
    }

    return $event;
  }
  return FALSE;
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
     $event = (array)citynotifier_get_matched_event(array('lat' => $data_remote_event['locations'][$i]['lat'],
                                                    'lng' => $data_remote_event['locations'][$i]['lng'],
                                                    'type' => $data_remote_event['type'],
                                                    'subtype' => $data_remote_event['subtype']));
     if( ($i <> 0 && $event <> $prev_event) || ($event == NULL))
        $same_event = FALSE;

     $prev_event = $event;
     $i++;
     if(!$data_remote_event['locations'][$i]['lat'])
     	break;
   };
   return $same_event?$event:FALSE;
}


/********************** NOTIFY FUNCTION **********************/

function citynotifier_get_notify_of_event($event) {
  $query = db_select("citynotifier_notify", 'cn')
                     ->fields('cn', array('notify_id', 'event_id', 'uid', 'created', 'type', 'subtype',
                                          'lat', 'lng', 'street_number', 'route', 'locality', 'administrative_area_level_3',
                                          'administrative_area_level_2', 'administrative_area_level_1', 'country', 'postal_code',
                                          'status', 'description', ))
                     ->condition('cn.event_id', $event->event_id, '=');
	return $query->execute()->fetchAll();
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

function citynotifier_get_range_subtype($type, $subtype){
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
    $address = citynotifier_get_address_from_point($data);
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

function citynotifier_get_address_from_point($data) {
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
  user_save($user);
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
				->groupBy('uid')
				->condition('cn.created', $skeptical_event->last_update, '>')
				->condition('cn.event_id', $skeptical_event->event_id, '=');
			$query->orderby('cn.created', 'DESC');
			$usr_notifications = $query->execute()->fetchAll();

			$open = $close = 0;

			foreach ($usr_notifications as $notification) {
				if ((int)$notification->status == citynotifier_get_index_status("open")) {
					$open += 1;
				}
				elseif ((int)$notification->status == citynotifier_get_index_status("closed")) {
					$close += 1;
				}
			}

			if ($open == $close)
				continue;

			switch ($open > $close) {
				case TRUE:
					citynotifier_increase_decrease_reputation($usr_notifications, citynotifier_get_index_status("open"));
					$event = array('event_id' => $skeptical_event->event_id, 
									'status' => citynotifier_get_index_status("open"), 'last_update' => time());
					break;
				
				case FALSE:
					citynotifier_increase_decrease_reputation($usr_notifications, citynotifier_get_index_status("closed"));
					$event = array('event_id' => $skeptical_event->event_id, 
									'status' => citynotifier_get_index_status("closed"), 'last_update' => time());
					break;
				default:
					break;
			}
			citynotifier_update_event($event);
		}
	}
}

function citynotifier_increase_decrease_reputation($usr_notifications, $status_inc) {
	foreach ($usr_notifications as $notification) {
		$reputation = citynotifier_get_reputation($notification->uid);

		if ((int)$notification->status == $status_inc) {
      if((float)$reputation < 1)
        $reputation += 0.1;
    }
		elseif((float)$reputation > -1)
      $reputation -= 0.1;

		citynotifier_set_reputation($notification->uid, $reputation);
	}
}

function citynotifier_sync_fading() {
	$query = db_select('citynotifier_event', 'ce');
	$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
	$query->fields('ce', array('event_id', 'status', 'last_update'));
	$query->fields('cn', array('type', 'subtype'));
	$query->addExpression('MAX(cn.created)', 'freshness');
	$or = db_or();
	$or->condition('ce.status', citynotifier_get_index_status("open"), '=');
	$or->condition('ce.status', citynotifier_get_index_status("closed"), '=');
	$query->condition($or);
	$query->groupBy('event_id');
	$events = $query->execute()->fetchAll();
	
	foreach ($events as $event){
    extract(_citynotifier_get_value_type_subtype_from_index($event->type, $event->subtype));
    $fading = citynotifier_get_subtype_fading($type, $subtype);
    if ($event->status == citynotifier_get_index_status("open") && $event->freshness < time() - $fading){
      $event->status = citynotifier_get_index_status("closed");
      citynotifier_update_event($event);
    }
    elseif ($event->status == citynotifier_get_index_status("closed") && $event->last_update < time() - $fading){
      $event->status = citynotifier_get_index_status("archived");
      citynotifier_update_event($event);
    }
  }
}
   
function citynotifier_get_subtype_fading($type, $subtype) {
	$types_subtypes = variable_get('citynotifier_settings_types_subtypes', array());

	foreach($types_subtypes[$type] as $st)
	  if($st['subtype'] == $subtype) return $st['fading'];

	return FALSE;
}

function citynotifier_get_driving_distance($from, $to) {
  $query = array('origins' => $from['lat'] . "," . $from['lng'], 'destinations' => $to['lat'] . "," . $to['lng'],
                 'mode'=> 'driving', 'language' => 'en', 'sensor' => 'false');
  
  $response = drupal_http_request("http://maps.googleapis.com/maps/api/distancematrix/json" . "?" . http_build_query($query));
  $response = drupal_json_decode($response->data);
  return $response['rows'][0]['elements'][0]['distance']['value'];
}

