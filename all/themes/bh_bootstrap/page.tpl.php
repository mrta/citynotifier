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
                <div style="position:absolute; left:212px; top:127px;" id="info"></div>
                <a class="brand" href="#">City<span class="text-error">Notifier</span></a>
                <ul class="nav pull-right">

                    <li class="dropdown">
                        <a href="#" id="notify" class="dropdown-toggle" data-toggle="dropdown">Notify <i class="icon-plus icon-white"></i></a>
                        <ul class="dropdown-menu">
                            <form>
                                <fieldset>
                                    <div class="control-group">
                                        <select id="notifyType">
                                            <option disabled selected>Select type</option>
                                            <option>Problemi stradali</option>
                                            <option>Emergenze sanitarie</option>
                                            <option>Reati</option>
                                            <option>Problemi ambientali</option>
                                            <option>Eventi pubblici</option>
                                        </select>
                                    </div>
                                    <div class="control-group">
                                        <select id="notifySubType" >
                                            <option disabled selected>Select subtype</option>
                                        </select>
                                    </div>
                                    <div class="input-append control-group">
                                        <input type="text" id="notifyAddress" placeholder="Address">
                                        <button onclick="getLocation()" id="addressButtonNotify" class="btn" type="button">
                                            <i id="addressMarkerNotify" class="icon-map-marker"></i>
                                        </button>
                                    </div>
                                    <div class="control-group">
                                        <input id="notifyDescription" type="text" placeholder="Description" class="input-block-level ">
                                    </div>
                                    <button id="notifySubmit" type="button" class="btn btn-inverse pull-right">Notify </button>
                                </fieldset>
                            </form>
                        </ul>
                    </li>

                    <li class="dropdown">
                        <a href="#" id="search" class="dropdown-toggle fulladdressvalidator" data-toggle="dropdown">Search <i class="icon-search icon-white"></i></a>
                        <ul class="dropdown-menu">
                            <form>
                                <fieldset>
                                
                                    <div class="control-group">
                                        <select id="searchType">
                                            <option selected>All</option>
                                            <option>Problemi stradali</option>
                                            <option>Emergenze sanitarie</option>
                                            <option>Reati</option>
                                            <option>Problemi ambientali</option>
                                            <option>Eventi pubblici</option>
                                        </select>
                                    </div>
                                    
                                    <div class="control-group">
                                        <select disabled id="searchSubType">
                                            <option disabled selected>Select subtype</option>
                                        </select>
                                    </div>
                                    
                                    <div class="input-append control-group">
                                        <input type="text" id="searchAddress" placeholder="Address">
                                        <button onclick="getLocation()" id="addressButtonSearch" class="btn" type="button">
                                            <i id="addressMarkerSearch" class="icon-map-marker"></i>
                                        </button>
                                    </div>
                                    
                                    <div class="control-group">
                                    	<input type="text" id="searchRadius" class="span3" placeholder="Radius (km, es. '2.5')">
                                    </div>
                                     
									<div class="input-append date" id="datetimepickerFrom" data-date-format="dd-mm-yyyy">
										<input type="text" id="timeFromText" placeholder="From time" disabled="disabled" data-date-format="yyyy-mm-dd hh:ii">
    									<span class="add-on"><i class="icon-th"></i></span>
									</div>
									
									<div class="input-append date" id="datetimepickerTo" data-date-format="dd-mm-yyyy">
										<input type="text" id="timeToText" placeholder="To time" disabled="disabled" data-date-format="yyyy-mm-dd hh:ii">
    									<span class="add-on"><i class="icon-th"></i></span>
									</div>
                              
                                    <div class="control-group">
                                        <select class="span2" id="searchStatus">
                                            <option selected>Open</option>
                                            <option>Closed</option>
                                            <option>Skeptical</option>
                                        </select>
                                    </div>
									
                                    <button id="searchSubmit" type="button" class="btn btn-inverse pull-right">Search</button> 
                                </fieldset>
                            </form>
                        </ul>
                    </li>

                    <li><a href="#" id="refresh">Refresh <i class="icon-remove icon-white"></i></a></li>

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

<nav>
    <div class="navbar navbar-inverse navbar-fixed-bottom">
        <div class="navbar-inner">
            <div class="container">
                <ul class="nav pull-left">
                    <li>
                        <a href="#myModal" role="button" data-toggle="modal"><i class="icon-list icon-white"></i> List</a>  
                    </li>
                    <li>
                    	<p id="infoAddress" class="span4 offset3 text-center"> Hodor? </p>
                    </li>
                </ul>
                <ul class="nav pull-right">
                	<li>
                		<button id="liveButton" type="button" class="btn btn-success loading">Live <i class="icon-eye-open icon-white"></i></button>
                	</li>
                </ul>
            </div>
        </div>
    </div>
</nav>

<!-- Modal -->
<div id="myModal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
    <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
        <h3 id="myModalLabel">Search matches</h3>
    </div>
    <div class="modal-body">
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Type/Subtype</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Descriptions</th>
                    <th>Credibility</th>
                    <th>Status</th>  
                </tr>
            </thead>
            <tbody id="modalBody"></tbody>
        </table>
    </div>
    <div class="modal-footer">
        <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
    </div>
</div>

<!-- Modal Admin Panel -->
<div id="adminPanel" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
    <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
        <h3 id="myModalLabel">Admin Panel</h3>
    </div>
    <div class="modal-body">
    	Prova Hodor?
    </div>
    <div class="modal-footer">
        <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
    </div>
</div>

<script src="http://code.jquery.com/ui/1.10.3/jquery-ui.js"></script>
<script src="http://code.jquery.com/jquery.js"></script>
<script src="https://maps.googleapis.com/maps/api/js?v=3.exp&key=AIzaSyCa8ToftfGkbPcIZldAjUiUNvQp0sxoGro&sensor=false&libraries=places"></script>
