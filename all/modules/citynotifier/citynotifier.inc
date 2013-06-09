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
    if(!is_float($data['radius']))
      return array("code" => 406, "response" => t('Radius non valido'));
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

  if(!is_float($data['lat']))
    return array("code" => 406, "response" => t('Latitudine non valida'));
  
  if(!is_float($data['lng']))
    return array("code" => 406, "response" => t('Longitudine non valida'));
  
  return array("code" => 200, "response" => '');
}

