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
		add_filter('wpr-available-reports', array(__CLASS__, 'addReports'), 10, 1);

	}

	/**
	 * 
	 * @param string $reportId
	 * @since 1.0.1
	 */
	public static function canUserAccessReport($reportId) {

		return current_user_can(self::CUSTOM_CAPABILITY_NAME);

	}

	public static function add_admin_menu() {

		add_menu_page(__('Reports', 'ds-wp-reports'), __('Reports', 'ds-wp-reports'), self::CUSTOM_CAPABILITY_NAME, self::DEFAULT_ADMIN_PAGE_SLUG, array(__CLASS__, 'render'), 'dashicons-chart-area', 77);

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

	/**
	 * Add default Reports from WordPress
	 *
	 * @author Jakub Bajzath <jakub.bajzath@devstudio.sk>
	 * @since 1.0.1
	 *
	 * @param array $reports
	 *
	 * @return array Array of reports settings and parameters
	 */
	public static function addReports($reports = array()) {

		$reports['wp-post-count'] = [
			'report_id' => 'wp-post-count',
			'name' => __('WordPress - posts per day'),
			'filters' => array(),
			'data_callback' => array(__CLASS__, 'handleDataRequest'),
			'suitable_visualizations' => array('timeline', 'tabular')
		];

		$reports['wp-comments-count'] = [
			'report_id' => 'wp-comments-count',
			'name' => __('WordPress - comments per day'),
			'filters' => array(),
			'data_callback' => array(__CLASS__, 'handleDataRequest'),
			'suitable_visualizations' => array('timeline', 'tabular')
		];

		return $reports;

	}

	/**
	 * Check if date is valid MySQL Data
	 *
	 * @since 1.0.1
	 *
	 * @param bool $value
	 *
	 * @return bool True if value is valid MySQL Date, false if not
	 */
	public static function isValidMySQLDate($value = false) {

		$matches = preg_match('/^\d{4}\-\d{2}\-\d{2}$/', $value);
		return ($matches === 1);

	}

	/**
	 * Handle data request from settings array
	 *
	 * @author Jakub Bajzath <jakub.bajzath@devstudio.sk>
	 * @since 1.0.1
	 *
	 * @param int $reportId
	 * @param array $settings
	 *
	 * @return array|WP_Error Generated data for report, or WP Error if error occurred
	 */
	public static function handleDataRequest($reportId = 0, $settings = array()) {

		$currentTime = current_time('timestamp');
		$toDate = array_key_exists('date_to', $settings) ? trim($settings['date_to']) : date('Y-m-d', $currentTime);
		$fromDate = array_key_exists('date_from', $settings) ? trim($settings['date_from']) : date('Y-m-d', $currentTime - 30 * 86400);

		if (!self::isValidMySQLDate($toDate) || !self::isValidMySQLDate($fromDate)) {
			return new WP_Error(__('Invalid date range'));
		}

		if ($settings['report_id'] === 'wp-post-count') {
			return self::generateDailyPostCount($fromDate, $toDate);
		} elseif ($settings['report_id'] === 'wp-comments-count') {
			return self::generateDailyCommentsCount($fromDate, $toDate);
		}

	}

	/**
	 * Generated daily stats for WordPress posts
	 *
	 * @author Jakub Bajzath <jakub.bajzath@devstudio.sk>
	 * @since 1.0.1
	 *
	 * @param string $fromDate
	 * @param string $toDate
	 *
	 * @return array Array with generated data for WP Reports
	 */
	public static function generateDailyPostCount($fromDate = '', $toDate = '') {

		global $wpdb;

		$postsQueryPrepared = "SELECT DATE_FORMAT(post_date,%s) AS post_date2, COUNT(*) AS count"
				. " FROM {$wpdb->posts} "
				. " WHERE post_date BETWEEN %s AND %s "
				. " AND post_status = 'publish' "
				. " AND post_type = 'post' "
				. " GROUP BY post_date2;";

		$postsQuery = $wpdb->prepare($postsQueryPrepared, '%Y-%m-%d', $fromDate, $toDate, '%Y-%m-%d');
		$posts = $wpdb->get_results($postsQuery);

		$values = array();

		$totalPosts = 0;
		foreach ($posts as $post) {
			$values[$post->post_date2] = [
				'total' => intval($post->count)
			];

			$totalPosts += intval($post->count);
		}

		$result = [
			'labels' => [
				'total' => 'Total'
			],
			'highlights' => [
				[
					'title' => 'Total',
					'value' => intval($totalPosts),
					'description' => 'posts'
				]
			],
			'values' => $values
		];

		$result['query'] = $postsQuery;

		return $result;

	}

	/**
	 * Generated daily stats for WordPress comments
	 *
	 * @author Jakub Bajzath <jakub.bajzath@devstudio.sk>
	 * @since 1.0.1
	 *
	 * @param string $fromDate
	 * @param string $toDate
	 *
	 * @return array Array with generated data for WP Reports
	 */
	public static function generateDailyCommentsCount($fromDate = '', $toDate = '') {

		global $wpdb;

		$postsQueryPrepared = "SELECT DATE_FORMAT(comment_date,%s) AS comment_date2, COUNT(*) AS count"
				. " FROM {$wpdb->comments} "
				. " WHERE comment_date BETWEEN %s AND %s "
				. " AND comment_type != 'pingback' "
				. " AND comment_approved = 1 "
				. " GROUP BY comment_date2;";

		$postsQuery = $wpdb->prepare($postsQueryPrepared, '%Y-%m-%d', $fromDate, $toDate, '%Y-%m-%d');
		$posts = $wpdb->get_results($postsQuery);

		$values = [];

		$totalPosts = 0;
		foreach ($posts as $post) {
			$values[$post->comment_date2] = [
				'total' => intval($post->count)
			];

			$totalPosts += intval($post->count);
		}

		$result = [
			'labels' => [
				'total' => 'Total'
			],
			'highlights' => [
				[
					'title' => 'Total',
					'value' => intval($totalPosts),
					'description' => 'comments'
				]
			],
			'values' => $values
		];

		$result['query'] = $postsQuery;

		return $result;

	}

	public static function onPluginActivation() {

		$role = get_role('administrator');
		$role->add_cap(self::CUSTOM_CAPABILITY_NAME);

	}

}
