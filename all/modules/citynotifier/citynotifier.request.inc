<?php

/**
 * Request service.
 */
function citynotifier_request() {
   header('Content-type: application/json; charset=utf-8');

   if($_SERVER["REQUEST_METHOD"] != "GET") {
     drupal_add_http_header("Status", "405", TRUE); 
     echo drupal_convert_to_utf8(drupal_json_encode(array("result" => t("Metodo non consentito"))));
     return;
   }
     
   $data = _citynotifier_citynotifier2data($_GET);
   $statuses = variable_get('citynotifier_settings_statuses', array());

   $validation = _citynotifier_validate($data, 'request');
   
   if($validation['code'] <> 200) {
     drupal_add_http_header("Status", $validation['code'], TRUE); 
     echo drupal_convert_to_utf8(drupal_json_encode(array("result" => $validation['response'])));
     return;
   }
   
   if ($data['scope'] == "local" ) {
     drupal_add_http_header("Status", 200);
     echo drupal_convert_to_utf8(drupal_json_encode(array("request_time" => time(),
                                                          "result" => "Messaggio di servizio",
                                                          "from_server" => "http://" . $_SERVER['HTTP_HOST'],
                                                          "events" => citynotifier_get_local_event($data))));
     return;
   };
   
   if ($data['scope'] == "remote") {
     $data = _citynotifier_data2citynotifier($data);
     $servers = citynotifier_get_subscribed_servers();

     if(isset($data['dest'])) {
       $servers = array($servers[$data['dest']]);
       unset($data['dest']);
     } 
     
     $fps = array();
     $data_remote = array();
     $data['scope'] = "local"; /* from server to server are local requests */

     foreach($servers as $index => $server) {
       $fp = citynotifier_get_fp_for_asynchronous_http_get_request($server['url'] . "/richieste", $data);
       if(!$fp['errno']) {
         $fps[] = array("fp" => $fp['fp'], "server" => $server['name'], "request_time" => time());
         $data_remote[$index] = '';
       } else {
         /** 200 non va bene bisogna stabilire, per esempio, se va in timeout **/
         drupal_add_http_header("Status", 200);
         echo drupal_convert_to_utf8(drupal_json_encode(array("request_time" => time(),
           "result" => $fp['errstr'],
           "from_server" => $server['name'],
           "events" => array())));
       }
     }

     while(!empty($fps)) {
       foreach($fps as $i_fp => $fp) {
         $fgets = fgets($fp['fp']);

         if (!$fgets) {
           fclose($fp['fp']);
           unset($fps[$i_fp]);
           $data_remote[$i_fp] = explode("\r\n\r\n", $data_remote[$i_fp]);
           $data_remote[$i_fp][1] = citynotifier_normalize_json($data_remote[$i_fp][1]);
           $data_remote[$i_fp] = drupal_json_decode($data_remote[$i_fp][1]);

           foreach($data_remote[$i_fp]["events"] as $i_event => $event) {
             $data_local = _citynotifier_get_matched_remote_event(_citynotifier_citynotifier2data($event));

             if($data_local) {
               if(_citynotifier_get_event_freshness($data_local["event_id"]) < $event["freshness"]){
                 if($data_remote[$i_fp]["events"][$i_event]["status"] == "open" && $statuses[$data_local["status"]] == "closed"){
                   $data_remote[$i_fp]["events"][$i_event]["status"] = "skeptical";
                   $data_local = array("event_id" => $data_local["event_id"], "status" => citynotifier_get_index_status("skeptical"));
                   citynotifier_update_event($data_local);
                 }
                 else{
                   $data_local = array("event_id" => $data_local["event_id"], "status" => citynotifier_get_index_status($event['status']));
                   citynotifier_update_event($data_local);
                 }
               }
               elseif ($data_remote[$i_fp]["events"][$i_event]["status"] == "closed" && $statuses[$data_local["status"]] == "open"){
                 $data_remote[$i_fp]["events"][$i_event]["status"] = "skeptical";
                 $data_remote[$i_fp]["events"][$i_event]["freshness"] = time();
                 $data_local = array("event_id" => $data_local["event_id"], "status" => citynotifier_get_index_status("skeptical"));
                 citynotifier_update_event($data_local);
               }
               $data_local["event_id"] = citynotifier_encode_event_id($data_local["event_id"], $_SERVER['HTTP_HOST']);
               $data_remote[$i_fp]["events"][$i_event]["event_id"] = $data_local["event_id"];
             }
             else{
               $address = citynotifier_get_address_from_point($event['locations'][0]);
               $data_remote[$i_fp]["events"][$i_event] = array_merge($data_remote[$i_fp]["events"][$i_event], $address);
             }
           };
         } else {
           $data_remote[$i_fp] = $data_remote[$i_fp] . $fgets;
         };
       };
     };

     drupal_add_http_header("Status", 200);
     echo drupal_convert_to_utf8(drupal_json_encode($data_remote));    
     return;
   };
};

function citynotifier_normalize_json($data){
  $pos = strpos($data, "{");
  $data = substr($data, $pos);

  $pos = strrpos($data, "}");
  $data = substr($data, 0, $pos+1);

  return $data;
}

function citynotifier_get_local_event($data) {
	$statuses = variable_get('citynotifier_settings_statuses', array());

	$query = db_select("citynotifier_event", 'ce');
	$query->join("citynotifier_notify", 'cn', 'ce.event_id = cn.event_id');
	$query->fields('ce', array('event_id', 'status'));
	$query->fields('cn', array('type','subtype','lat','lng', 'street_number', 'route', 'locality', 'administrative_area_level_3', 'administrative_area_level_2', 'administrative_area_level_1', 'country', 'postal_code', 'description'));
	//$query->fields('ce', array());
	//$query->fields('cn', array());
	$query->addExpression('MAX(cn.created)', 'freshness');
	$query->addExpression('MIN(cn.created)', 'start');
	$query->addExpression(('6371 * 2 * ASIN(SQRT(POWER(SIN(('.$data['lat'].' - cn.lat) * pi()/180 / 2), 2) +COS('.$data['lat'].' * pi()/180) * COS(cn.lat * pi()/180) *POWER(SIN(('.$data['lng'].' - cn.lng) * pi()/180 / 2), 2) ))'), 'distance');

	if($data['type']){
		$query->condition('cn.type', $data['type'], '=');
		if($data['subtype'])
			$query->condition('cn.subtype', $data['subtype'], '=');
	}

/*	switch($data['subtype']) {
	case 0:
	  $types_subtypes = array_map("_citynotifier_get_map_subtype", variable_get('citynotifier_settings_types_subtypes', array()));
    $types = array_keys($types_subtypes);
    $subtypes = $types_subtypes[$types[$data['type']]];
    unset($subtypes[0]); /* delete 'all' item */
/*    $db_or = db_or();
	  foreach($subtypes as $index_subtype => $subtype) {
	    $db_and = db_and()->condition('cn.type', $data['type'], '=')
	                      ->condition('cn.subtype', $index_subtype, '=');
	    $query->condition($db_or->condition($db_and)); 
	  }
	  break;
	default:
	  $query->condition('cn.type', $data['type'], '=');
	  $query->condition('cn.subtype', $data['subtype'], '=');
	  break;
	}
*/	  
	if($data['status'])
		$query->condition('ce.status', $data['status'],'=');
	else
		$query->condition('ce.status', citynotifier_get_index_status("archived"),'<>');

	$query->havingCondition('freshness', $data['timemin'], '>')
		->havingCondition('freshness', $data['timemax'], '<')
		->havingCondition('distance', $data['radius']/1000, '<');
	$query->groupBy('ce.event_id');

	$events = $query->execute();//->fetchAll();

	$result = array();

	foreach($events as $event){
		$event_result = array();
		$event_result['event_id'] = citynotifier_encode_event_id($event->event_id, $_SERVER['HTTP_HOST']);
		$event_result['type'] = _citynotifier_get_value_type_subtype_from_index($event->type, $event->subtype);
		$event_result['status'] = $statuses[$event->status];
		$event_result['start_time'] = (int)$event->start;
		$event_result['freshness'] = (int)$event->freshness;

		$event_result['street_number'] = $event->street_number;
		$event_result['route'] = $event->route;
		$event_result['locality'] = $event->locality;
		$event_result['administrative_area_level_3'] = $event->administrative_area_level_3;
		$event_result['administrative_area_level_2'] = $event->administrative_area_level_2;
		$event_result['administrative_area_level_1'] = $event->administrative_area_level_1;
		$event_result['country'] = $event->country;
		$event_result['postal_code'] = $event->postal_code;


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
			$assiduity = citynotifier_get_assiduity($res->uid);
			$sum += (1 + citynotifier_get_reputation($res->uid) * $assiduity);

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


