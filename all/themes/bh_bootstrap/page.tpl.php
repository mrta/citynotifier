<?php

/**
 * @file
 * Default theme implementation to display a single Drupal page.
 *
 * Available variables:
 *
 * General utility variables:
 * - $base_path: The base URL path of the Drupal installation. At the very
 *   least, this will always default to /.
 * - $directory: The directory the template is located in, e.g. modules/system
 *   or themes/bartik.
 * - $is_front: TRUE if the current page is the front page.
 * - $logged_in: TRUE if the user is registered and signed in.
 * - $is_admin: TRUE if the user has permission to access administration pages.
 *
 * Site identity:
 * - $front_page: The URL of the front page. Use this instead of $base_path,
 *   when linking to the front page. This includes the language domain or
 *   prefix.
 * - $logo: The path to the logo image, as defined in theme configuration.
 * - $site_name: The name of the site, empty when display has been disabled
 *   in theme settings.
 * - $site_slogan: The slogan of the site, empty when display has been disabled
 *   in theme settings.
 *
 * Navigation:
 * - $main_menu (array): An array containing the Main menu links for the
 *   site, if they have been configured.
 * - $secondary_menu (array): An array containing the Secondary menu links for
 *   the site, if they have been configured.
 * - $breadcrumb: The breadcrumb trail for the current page.
 *
 * Page content (in order of occurrence in the default page.tpl.php):
 * - $title_prefix (array): An array containing additional output populated by
 *   modules, intended to be displayed in front of the main title tag that
 *   appears in the template.
 * - $title: The page title, for use in the actual HTML content.
 * - $title_suffix (array): An array containing additional output populated by
 *   modules, intended to be displayed after the main title tag that appears in
 *   the template.
 * - $messages: HTML for status and error messages. Should be displayed
 *   prominently.
 * - $tabs (array): Tabs linking to any sub-pages beneath the current page
 *   (e.g., the view and edit tabs when displaying a node).
 * - $action_links (array): Actions local to the page, such as 'Add menu' on the
 *   menu administration interface.
 * - $feed_icons: A string of all feed icons for the current page.
 * - $node: The node object, if there is an automatically-loaded node
 *   associated with the page, and the node ID is the second argument
 *   in the page's path (e.g. node/12345 and node/12345/revisions, but not
 *   comment/reply/12345).
 *
 * Regions:
 * - $page['help']: Dynamic help text, mostly for admin pages.
 * - $page['highlighted']: Items for the highlighted content region.
 * - $page['content']: The main content of the current page.
 * - $page['sidebar_first']: Items for the first sidebar.
 * - $page['sidebar_second']: Items for the second sidebar.
 * - $page['header']: Items for the header region.
 * - $page['footer']: Items for the footer region.
 *
 * @see template_preprocess()
 * @see template_preprocess_page()
 * @see template_process()
 */
?>

<nav>
	    <div class="navbar navbar-inverse navbar-fixed-top">
	      <div class="navbar-inner">
	        <div class="container">
	          <a class="brand" href="#">City<span class="text-error">Notifier</span></a>
	            <ul class="nav pull-right">
	              
	              <li class="dropdown">
	              	<a href="#" id="notify" class="dropdown-toggle" data-toggle="dropdown">Notify <i class="icon-plus icon-white"></i></a>
	              	<ul class="dropdown-menu">
						  <form>
							  <fieldset>
							  	<select>
								  <option>Select event type</option>
								</select>
								<select>
								  <option>Select event subtype</option>
								</select>
							    <div class="input-append">
								  <input type="text" placeholder="Address">
								  <button class="btn" type="button"><i class="icon-map-marker"></i></button>
								</div>
							    <input type="text" placeholder="Description" class="input-block-level">
							    <button type="submit" class="btn btn-inverse pull-right">Notify </button>
							  </fieldset>
						  </form>
					</ul>
	              </li>

	              <li class="dropdown">
	              	<a href="#" id="search" class="dropdown-toggle" data-toggle="dropdown">Search <i class="icon-search icon-white"></i></a>
	              	<ul class="dropdown-menu">
						  <form>
							  <fieldset>
							  	<select>
								  <option>Select event type</option>
								</select>
								<select>
								  <option>Select radius</option>
								</select>
								<select>
								  <option>From time</option>
								</select>
								<select>
								  <option>To time</option>
								</select>
								<label class="checkbox inline">
								  <input type="checkbox" value="" checked>
								  Open
								</label>
								<label class="checkbox inline">
								  <input type="checkbox" value="">
								  Closed
								</label>
								<label class="checkbox">
								  <input type="checkbox" value="">
								  Skeptical
								</label>
							    <button type="submit" class="btn btn-inverse pull-right">Search</button>
							  </fieldset>
						  </form>
					</ul>
	              </li>
	              
	              <li><a href="#" id="update">Update <i class="icon-repeat icon-white"></i></a></li>
	              
	              <li class="divider-vertical"></li>
	              
	              <li class="dropdown">
	              	<a href="#" id="account" class="dropdown-toggle" data-toggle="dropdown">Account <i class="icon-user icon-white"></i></a>
	              	<ul class="dropdown-menu">
						  <form>
							  <fieldset>
								<div class="control-group">
							    <input id="user" type="text" placeholder="Username"></div>
								<div class="control-group">
								<input id="pass" type="password" placeholder="Password"></div>
							    <button id="login" type="button" class="btn btn-inverse pull-right">Login</button>
							  </fieldset>
						  </form>
					</ul>
	              </li>
	              
	            </ul>
	        </div>
	      </div>
	    </div>
	</nav>

    <div id="map_canvas"></div>
    
    <script src="http://code.jquery.com/jquery.js"></script>
    <script src="https://maps.googleapis.com/maps/api/js?v=3.exp&key=AIzaSyCa8ToftfGkbPcIZldAjUiUNvQp0sxoGro&sensor=false"></script>
