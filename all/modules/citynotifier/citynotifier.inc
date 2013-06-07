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
  
  drupal_write_record("citynotifier_notify", $record);
  citynotifier_debug($record);
}
