<?php
// citynotifier.admin.inc

function citynotifier_admin($form, &$form_state) {
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
    $header = array(
      'subscribed' => t('Sottoscrivi'),
      'name' => t('Nome'),
      'link' => t('link'),
      );
    
    $servers = array();
    foreach(variable_get('citynotifier_settings_servers', '') as $index => $server) {
      $row['subscribed'] = array(
        '#type' => 'checkbox',
        '#default_value' => (bool)$server['subscribed'],
        '#ajax' => array(
                  'callback' => 'citynotifier_ajax',
                  'wrapper' => 'citynotifier_ajax-wrapper')
        );
      $row['name'] = array(
        '#markup' => $server['name'],
        );
      $row['link'] = array(
        '#markup' => l(t('link'), $server['url'], array('attributes' => array('target' => array('_blank')))),
        );
     
      $servers[$index] = $row;
    }
    
    $form['servers'] = array(
      '#tree' => TRUE,
      );
    $form['servers'] += $servers;
    
  }
  return $form;
}

function citynotifier_ajax($form, $form_state) {
  $servers = variable_get("citynotifier_settings_servers", "");
  preg_match("/servers\[(.*)\]\[(.*)\]/", $form_state['triggering_element']['#name'], $matches);
  $servers[$matches[1]]['subscribed'] = $form_state['triggering_element']['#value'];
  variable_set("citynotifier_settings_servers", $servers);
}

function citynotifier_admin_submit($form_id, &$form_state) {
  $http_result = drupal_http_request($form_state['values']['catalogue']);
  if ($http_result->code == 200) {
    $catalogue = simplexml_load_string($http_result->data);
    
    $servers = array();
    foreach($catalogue->server as $server) {
      $servers[] = array('subscribed' => 0, 'name' => (string)$server->attributes()->gruppo, 'url' => (string)$server->attributes()->url);
    };
    
    variable_set('citynotifier_settings_servers', $servers);
    variable_set('citynotifier_settings_catalogue', $form_state['values']['catalogue']);
    drupal_set_message(t('Aggiornato il catalogo.'));
  }
  else {
    drupal_set_message(t('Impossibile aggiornare il catalogo.'));
  }
}

/**
 * Returns HTML for the Citynotifier form.
 *
 * @param $variables
 *   An associative array containing:
 *   - form: A render element representing the form.
 *
 * @ingroup themeable
 */
function theme_citynotifier_admin($variables) {
  $rows = array();

  $form = $variables['form'];
  
  if(!isset($form['servers']))
    return drupal_render_children($form);
  
  foreach (element_children($form['servers']) as $server) {
    $row = array();
    $row[] = drupal_render($form['servers'][$server]['subscribed']);
    $row[] = drupal_render($form['servers'][$server]['name']);
    $row[] = drupal_render($form['servers'][$server]['link']);
    $rows[] = array('data' => $row);
  }

  if (count($rows) > 0) {

    $header = array();
    $header[] = t('Sottoscrivi');
    $header[] = t('Nome');
    $header[] = t('Link');

    $output = theme('table', array('header' => $header, 'rows' => $rows));
    $output .= drupal_render_children($form);
  }
  else {

    $output = '<p>' . drupal_placeholder(t('Nessun tema definitvo.')) . '</p>';
  }

  return $output;
}


function citynotifier_admin_users() {
  return;
}
