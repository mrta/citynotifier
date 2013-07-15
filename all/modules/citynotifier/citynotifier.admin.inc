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
  /*
  $header = array(
    'username' => array('data' => t('Username'), 'field' => 'u.name'),
    'status' => array('data' => t('Status'), 'field' => 'u.status'),
    'member_for' => array('data' => t('Member for'), 'field' => 'u.created'),
    'access' => array('data' => t('Last access'), 'field' => 'u.access'),
    'notifications' => array('data' => t('Notifiche'), 'field' => 'number_of_notifications', 'sort' => 'desc'),
    'assiduity' => array('data' => t('Assiduità')),
    'reputation' => array('data' => t('Reputazione'), 'field' => 'rep.reputation_value'),
  );
  
  $query = db_select('users', 'u');
  $query->condition('u.uid', 0, '<>');
  user_build_filter_query($query);

  $count_query = clone $query;
  $count_query->addExpression('COUNT(u.uid)');
 
  $query->join("citynotifier_notify", 'cn', 'cn.uid = u.uid');
  $query->join("field_data_reputation", 'rep', 'rep.entity_id = u.uid');
  $query = $query->extend('PagerDefault')->extend('TableSort')->groupBy('u.uid');
  
  $query
    ->fields('u', array('uid', 'name', 'status', 'created', 'access'))
    ->fields('cn', array('notify_id'))
    ->fields('rep', array('reputation_value'))
    ->limit(50)
    ->orderByHeader($header)
    ->setCountQuery($count_query);
  $query->addExpression('COUNT(notify_id)', 'number_of_notifications');
  $query->addExpression('MAX(number_of_notifications)', 'max');
  $result = $query->execute();
  
  $status = array(t('blocked'), t('active'));
  $accounts = array();
  foreach ($result as $account) {
    $options[$account->uid] = array(
      'username' => theme('username', array('account' => $account)),
      'status' =>  $status[$account->status],
      'member_for' => format_interval(REQUEST_TIME - $account->created),
      'access' =>  $account->access ? t('@time ago', array('@time' => format_interval(REQUEST_TIME - $account->access))) : t('never'),
      'notifications' => $account->number_of_notifications,
      'assiduity' => citynotifier_get_assiduity($account->uid),
      'reputation' => citynotifier_get_reputation($account->uid),
    );
  }
  
  $form['accounts'] = array(
    '#type' => 'tableselect',
    '#header' => $header,
    '#options' => $options,
    '#empty' => t('No people available.'),
  );
  $form['pager'] = array('#markup' => theme('pager'));

  return $form;*/
  
  $header = array(
    'username' => array('data' => t('Username'), 'field' => 'username'),
    'status' => array('data' => t('Status'), 'field' => 'status'),
    'member_for' => array('data' => t('Membro da'), 'field' => 'member_for'),
    'access' => array('data' => t('Ultimo accesso'), 'field' => 'access'),
    'notifications' => array('data' => t('Notifiche'), 'field' => 'notifications', 'sort' => 'desc'),
    'assiduity' => array('data' => t('Assiduità'), 'field' => 'assiduity'),
    'reputation' => array('data' => t('Reputazione'), 'field' => 'reputation')
    );
  
  $query = db_select('users', 'u');
  $query->condition('u.uid', 0, '<>');
  user_build_filter_query($query);

  $count_query = clone $query;
  $count_query->addExpression('COUNT(u.uid)');
 
  $query->join("citynotifier_notify", 'cn', 'cn.uid = u.uid');
  $query->join("field_data_reputation", 'rep', 'rep.entity_id = u.uid');
  $query = $query->extend('PagerDefault')->extend('TableSort')->groupBy('u.uid');
  
  $query
    ->fields('u', array('uid', 'name', 'status', 'created', 'access'))
    ->fields('cn', array('notify_id'))
    ->fields('rep', array('reputation_value'))
    ->limit(50)
    ->setCountQuery($count_query);
  $query->addExpression('COUNT(notify_id)', 'number_of_notifications');
  $result = $query->execute();
  
  $status = array(t('blocked'), t('active'));
  $accounts = array();
  foreach ($result as $account) {
    $options[$account->uid] = array(
      'username' => $account->name,
      'status' =>  $status[$account->status],
      'member_for' => $account->created,
      'access' =>  $account->access ? REQUEST_TIME - $account->access : 0,
      'notifications' => $account->number_of_notifications,
      'assiduity' => citynotifier_get_assiduity($account->uid),
      'reputation' => citynotifier_get_reputation($account->uid),
      'account' => $account
    );
  }
  
  $order = tablesort_get_order($header);
  $sort = tablesort_get_sort($header);

  $options = _citynotifier_admin_users_sort($options, $order['sql'], $sort);
  
  $rows = array();
  foreach ($options as $entry) {
    $rows[] = array(
      array('data' => theme('username', array('account' => $entry['account']))),
      array('data' => $entry['status']),
      array('data' => format_interval(REQUEST_TIME - $entry['account']->created)),
      array('data' => $entry['account']->access ? t('@time ago', array('@time' => format_interval(REQUEST_TIME - $entry['account']->access))) : t('never')),
      array('data' => $entry['notifications']),
      array('data' => $entry['assiduity']),
      array('data' => $entry['reputation'])
      );
  }
  
  // add any attributes and sent everything to theme table
  $attributes = array('class' => array('my_class'));
  $table = array('header' => $header, 'attributes' => $attributes, 'rows' => $rows);
  return theme('table', $table);
}

function _citynotifier_admin_users_sort($data, $order, $sort) {
  foreach ($data as $key => $row) {
    $username[$key] = $row['username'];
    $status[$key] = $row['status'];
    $member_for[$key] = $row['member_for'];
    $access[$key] = $row['access'];
    $notifications[$key] = $row['notifications'];
    $assiduity[$key] = $row['assiduity'];
    $reputation[$key] = $row['reputation'];
  }
  
  eval("array_multisort(\$" . $order . ", (\$sort == 'desc'? SORT_DESC:SORT_ASC), \$data);");
  return $data;
}
