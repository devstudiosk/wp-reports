<?php

/**
 * Bootstrap class for the whole plugin.
 * 
 * @author Martin Krcho <martin.krcho@devstudio.sk>
 * @since 1.0.0
 */
class DS_WP_Reports_Core {

	const AJAX_ACTION_REPORT_SETUP = 'ds-wp-report-setup';
	const AJAX_ACTION_REPORT_DATA = 'ds-wp-report-data';
	const DEFAULT_ADMIN_PAGE_SLUG = 'ds-wp-reports';
	const CUSTOM_CAPABILITY_NAME = 'wp_reports_view';

	public static function init() {

		DS_WP_Reports_AJAX::init();

		//	@todo load all classes from "modules" folder

		add_action('admin_enqueue_scripts', array(__CLASS__, 'admin_enqueue_scripts'));
		add_action('admin_menu', array(__CLASS__, 'add_admin_menu'));

	}

	public static function add_admin_menu() {

		add_menu_page(__('Reports', 'ds-wp-reports'), __('Reports', 'ds-wp-reports'), 'manage_options', self::DEFAULT_ADMIN_PAGE_SLUG, array(__CLASS__, 'render'), 'dashicons-chart-area', 77);

	}

	public static function admin_enqueue_scripts($hook) {

		if ('toplevel_page_' . self::DEFAULT_ADMIN_PAGE_SLUG !== $hook) {
			return;
		}

		wp_enqueue_script('wp-reports-vendor', plugins_url('/js/vendor.min.js', DS_WP_REPORTS_PLUGIN_INDEX), array('jquery'), '1.0.3', true);
		wp_enqueue_script('ds-wp-reports', plugins_url('/js/reports-app.min.js', DS_WP_REPORTS_PLUGIN_INDEX), array('wp-reports-vendor'), '1.0.10', true);

		wp_localize_script('ds-wp-reports', 'DS_WP_Reports', array(
			'ajax_url' => admin_url('admin-ajax.php'),
			'action_get_report_setup' => self::AJAX_ACTION_REPORT_SETUP,
			'action_get_report_data' => self::AJAX_ACTION_REPORT_DATA
		));

		wp_enqueue_style('wp-reports-vendor', plugins_url('/css/vendor.min.css', DS_WP_REPORTS_PLUGIN_INDEX), array(), '1.0.1');
		wp_enqueue_style('ds-wp-reports', plugins_url('/css/reports-app.min.css', DS_WP_REPORTS_PLUGIN_INDEX), array('wp-reports-vendor'), '1.0.1');

	}

	public static function getReports() {

		return apply_filters('wpr-available-reports', array());

	}

	public static function render() {

		echo '<div class="container-fluid wp-reports-pane">';
		echo '<div class="row">';

		echo '<div class="col-xs-12 col-md-3">';
		echo '<div class="nav-box">';
		echo '<h2>' . __('Reports for WordPress', 'ds-wp-reports') . '</h2>';

		$reports = self::getReports();
		if (empty($reports)) {

			echo '<p>' . __('No reports available.', 'ds-wp-reports') . '</p>';
			//	@todo add a hint to go to the plugin web site and create one
		} else {

			self::renderReportList($reports);
		}

		echo '</div><!-- /.nav-box -->';
		echo '</div><!-- /.col -->';

		if (!empty($reports)) {

			echo '<div class="col-xs-12 col-md-9">';
			echo '<div class="report-area">';
			echo '<p>' . __('Choose one of the reports in the nav bar to get started.', 'ds-wp-reports') . '</p>';
			echo '</div><!-- /.report-area -->';
			echo '</div><!-- /.col -->';
		}

		echo '</div><!-- /.row -->';
		echo '</div><!-- /.container-fluid -->';

	}

	private static function renderReportList($reports) {

		echo '<ul class="nav nav-pills nav-stacked">';
		foreach ($reports as $key => $report) {
			echo '<li><a href="#" data-report-id="' . $key . '" onclick="return DS_WP_Reports.switchReport(this);">' . $report['name'] . '</a></li>';
		}
		echo '</ul>';

	}

	public static function getReportById($reportId = '') {

		$reports = self::getReports();
		return $reports[$reportId];

	}

	public static function executeReportDataHandler($reportId = '') {

		$report = self::getReportById($reportId);
		$result = call_user_func($report['data_callback'], $reportId, $_REQUEST);
		return $result;

	}

}
