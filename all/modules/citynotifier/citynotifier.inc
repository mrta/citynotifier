<?php

function citynotifier_report() {
  global $index, $types, $subtypes, $user;

  header('Content-type: application/json');
  $report = drupal_json_decode(file_get_contents("php://input"));
  
  if(!in_array($report['type']['type'], $types)) {
    drupal_add_http_header("Status", 406, "Not validate type");
    return;
  }

  if(!in_array($report['type']['subtype'], $subtypes[$report['type']['type']])) {
    drupal_add_http_header("Status", 406, "Not validate subtype");
    return;
  }

  if(!is_float($report['lat'])) {
    drupal_add_http_header("Status", 406, "Not validate lat");
    return;
  }
  
  if(!is_float($report['lng'])) {
    drupal_add_http_header("Status", 406, "Not validate lng");
    return;
  }
  
  $record = array (
    "uid" => $user->uid,
    "created" => time(),
    "type" => array_search($report['type']['type'], $types),
    "subtype" => array_search($report['type']['subtype'], $subtypes[$report['type']['type']]),
    "lat" => $report['lat'],
    "lng" => $report['lng'],
    "description" => $report['description'],
    );
  
  drupal_write_record($schema["citynotifier_notify"], $record);
  
  $result = array("event_id" => "9806", "result" => "nuova segnalazione aperta con successo / segnalazione di un evento già in memoria avvenuta con successo");
  
  drupal_add_http_header("Status", 200);
  echo drupal_json_output($result);
}


function _citynotifier_validate($data, $type=NULL) {
  $index = array("scope","type","subtype","lat","lng","radius","timemin","timemax","status");
  $types = array("all" => array("all"),
                 "problemi_stradali" => array("incidente", "buca", "coda", "lavori_in_corso", "strada_impraticabile"),
                 "emergenze_sanitarie" => array("incidente", "malore", "ferito"),
                 "reati" => array("furto", "attentato"),
                 "problemi_ambientali" => array("incendio", "tornado", "neve", "alluvione"),
                 "eventi_pubblici" => array("partita", "manifestazione", "concerto")); 

  switch($type) {
  case "request":
    if($data['scope'] <> "local" && $data['scope'] <> "remote")
      return array("code" => 406, $response => t('Scope non valido'));
    if(!is_float($data['radius']))
      return array("code" => 406, $response => t('Radius non valido'));
  }
  
  var_dump($data['type']['type']);
  if(!in_array($data['type']['type'], $types))
    return array("code" => 406, $response => t('Type non valido'));

  if(!in_array($data['type']['subtype'], $types[$data['type']['type']]))
    return array("code" => 406, $response => t('Subtype non valido'));

  if(!is_float($data['lat']))
    return array("code" => 406, $response => t('Latitudine non valida'));
  
  if(!is_float($data['lng']))
    return array("code" => 406, $response => t('Longitudine non valida'));
  
  return array("code" => 200, $response => '');
}

