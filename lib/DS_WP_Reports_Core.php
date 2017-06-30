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

		//	@todo remove or replace with dynamic loading
		SmartAdsClickReport::init();

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

		wp_enqueue_script('wp-reports-vendor', plugins_url('/js/vendor.min.js', DS_WP_REPORTS_PLUGIN_INDEX), array('jquery'), '1.0.0', true);
		wp_enqueue_script('ds-wp-reports', plugins_url('/js/reports-app.js', DS_WP_REPORTS_PLUGIN_INDEX), array('wp-reports-vendor'), '1.0.0', true);

		wp_localize_script('ds-wp-reports', 'DS_WP_Reports', array(
			'ajax_url' => admin_url('admin-ajax.php'),
			'action_get_report_setup' => self::AJAX_ACTION_REPORT_SETUP,
			'action_get_report_data' => self::AJAX_ACTION_REPORT_DATA
		));

		wp_enqueue_style('ds-wp-reports', plugins_url('/css/vendor.min.css', DS_WP_REPORTS_PLUGIN_INDEX), array(), '1.0.0');

	}

	public static function getReports() {

		return apply_filters('wpr-available-reports', array());

	}

	public static function render() {

		echo '<h2>' . __('Reports for WordPress', 'ds-wp-reports') . '</h2>';

		$reports = self::getReports();
		if (empty($reports)) {

			echo '<p>' . __('No reports available.', 'ds-wp-reports') . '</p>';
			//	@todo add a hint to go to the plugin web site and create one
			return;
		}

		echo '<nav>';
		echo '<ul>';
		foreach ($reports as $report) {
			echo '<li>' . $report['name'] . '</li>';
		}

		echo '</ul>';
		echo '</nav>';

		echo '<div class="report-area">';
		echo '<input type="text" name="daterange" style="float: right;" />';
		echo '<canvas id="vsst-chart-daily-increments" width="100%" height="300"></canvas>';
		echo '</div>';

	}

	public static function getReportById($reportId = '') {

		$reports = self::getReports();
		return $reports[$reportId];

	}

	public static function executeReportDataHandler($reportId = '') {

		$report = self::getReportById($reportId);
		call_user_func($report['data_callback'], $reportId, $_REQUEST);

	}

}
