<?php
// citynotifier.admin.inc

function _citynotifier_admin_form($form, &$form_state) {
  $form = array();
  
  $form['catalogue'] = array(
    '#type' => 'textfield',
    '#title' => t('Url del catalogo'),
    '#default_value' => variable_get('citynotifier_settings_catalogue', ''),    
    '#required' => TRUE,
    );
  
  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Aggiorna'),
    );
  
  
  if(variable_get('citynotifier_settings_servers', "")) {
    $form['servers'] = array('#tree' => TRUE);
    
    $servers = array();
    foreach(variable_get('citynotifier_settings_servers', '') as $index => $server) {
      $extra['#tree'] = TRUE;
      $extra['subscribed'] = array('#type' => 'checkbox', '#title' => t('Sottosvrivi'), '#default_value'  => (bool)$server['subscribed']);
      $extra['name'] = array('#markup' => $server['name']);
      $extra['link'] = array('#markup' => $server['url']);
      $servers[]=$extra;
    }
    $form['servers'] = $servers;
  }
  return $form;
}


function _citynotifier_admin_form_submit($form_id, &$form_state) {
  $http_result = drupal_http_request($form_state['values']['catalogue']);
  if ($http_result->code == 200) {
    $catalogue = simplexml_load_string($http_result->data);
    
    $servers = array();
    foreach($catalogue->server as $server) {
      $servers[] = array('subscribed' => FALSE, 'name' => (string)$server->attributes()->gruppo, 'url' => (string)$server->attributes()->url);
    };
    
    variable_set('citynotifier_settings_servers', $servers);
    drupal_set_message(t('Aggiornato il catalogo.'));
  }
  else {
    drupal_set_message(t('Impossibile aggiornare il catalogo.'));
  }
}
