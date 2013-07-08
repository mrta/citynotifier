<?php

/**
 * Request service.
 */
function citynotifier_request() {
   header('Content-type: application/json; charset=utf-8');
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
                                                          "events" => _citynotifier_get_local_event($data))));
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
           $data_remote[$i_fp] = drupal_json_decode($data_remote[$i_fp][1]);

           foreach($data_remote[$i_fp]["events"] as $i_event => $event) {
             $data_local = _citynotifier_get_matched_remote_event(_citynotifier_citynotifier2data($event));
            if($data_local["event_id"]) {
               $data_remote[$i_fp]["events"][$i_event]["event_id"] = $data_local["event_id"];
               if(_citynotifier_get_event_freshness($data_local["event_id"]) < $data_remote[$i_fp]["events"][$i_event]["freshness"] && $data_remote[$i_fp]["events"][$i_event]["status"] <> $statuses[$data_local["status"]]) {
                if($data_remote[$i_fp]["events"][$i_event]["status"] == "open" && $statuses[$data_local["status"]] == "closed"){
                   $data_remote[$i_fp]["events"][$i_event]["status"] = "skeptical";
                   $data_local = array("event_id" => $data_local["event_id"], "status" => _citynotifier_get_index_status("skeptical"));
                   _citynotifier_update_event($data_local);
                }
                else{
                  $data_local = array("event_id" => $data_local["event_id"], "status" => _citynotifier_get_index_status($event['status']));
                  _citynotifier_update_event($data_local);
                }
               };
             }
             else{
              $address = _citynotifier_get_address_from_point($event['locations'][0]);
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


