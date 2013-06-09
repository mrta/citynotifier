<?php
// citynotifier.admin.inc

function _citynotifier_admin_form($node, &$form_state) {
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
  
  return $form;
}


function _citynotifier_admin_form_submit(&$form_state) {
  variable_set('citynotifier_settings_catalogue', $form_state['values']['catalogue']);
  drupal_set_message(t('Aggiornato il catalogo.'));
}
